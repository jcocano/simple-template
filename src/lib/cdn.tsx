// CDN upload facade. Reads the current workspace's `storage` setting to find
// the active provider, resolves its secrets (encrypted via safeStorage), and
// delegates to window.cdn.upload. The `base64` mode is handled locally — no
// IPC, no network — because the whole point is to embed the file inline.
//
// Usage:
//   const result = await stCDN.upload(file);
//   if (result.ok) editor.insertImage(result.url);
//
// File can be a browser File, Blob, or { data:Uint8Array, name, type }.

const SENSITIVE_FIELDS = {
  s3: ['secret'],
  imgbb: ['apiKey'],
  cloudinary: ['apiKey'],
  github: ['token'],
  ftp: ['password'],
};

// Read the sensitive credentials for a provider from workspace secrets.
// Falls back to the legacy plaintext copy (still present in storage config
// from pre-K.4 builds) and migrates it to secrets on the fly.
async function resolveSecrets(provider, providerConfig) {
  const fields = SENSITIVE_FIELDS[provider] || [];
  const out = {};
  const wsKey = (name) => window.stStorage.secrets.wsKey(`cdn:${provider}:${name}`);
  for (const f of fields) {
    try {
      const stored = await window.stStorage.secrets.get(wsKey(f));
      if (stored) {
        out[f] = stored;
        continue;
      }
    } catch {}
    // Legacy migration: older builds left the secret inside the storage
    // settings JSON. Move to secrets now and clear it from the plaintext
    // blob so next read uses the encrypted store.
    const legacy = providerConfig?.[f];
    if (legacy) {
      try {
        await window.stStorage.secrets.set(wsKey(f), legacy);
      } catch {}
      out[f] = legacy;
    }
  }
  return out;
}

async function fileToUint8Array(file) {
  if (file instanceof Uint8Array) return file;
  if (file?.data instanceof Uint8Array) return file.data;
  if (file instanceof Blob || file instanceof File) {
    const buf = await file.arrayBuffer();
    return new Uint8Array(buf);
  }
  if (file?.arrayBuffer) {
    const buf = await file.arrayBuffer();
    return new Uint8Array(buf);
  }
  throw new Error('No se pudo leer el archivo.');
}

// Local (base64) path: read the file into a data URL so it can be used as
// <img src> directly. Size-limited — email clients truncate >150 KB bodies.
async function uploadBase64(file, opts = {}) {
  const bytes = await fileToUint8Array(file);
  const sizeKB = Math.round(bytes.length / 1024);
  const maxKB = opts.maxKB || 500;
  if (sizeKB > maxKB) {
    return {
      ok: false,
      error: `La imagen pesa ${sizeKB} KB. Máximo ${maxKB} KB para Base64 (los clientes de correo truncan correos grandes). Configurá un CDN en Ajustes → Almacenamiento.`,
      code: 'PAYLOAD_TOO_LARGE',
    };
  }
  const contentType = file?.type || opts.contentType || 'image/png';
  const b64 = uint8ToBase64(bytes);
  return {
    ok: true,
    url: `data:${contentType};base64,${b64}`,
    sizeKB,
    mode: 'base64',
  };
}

function uint8ToBase64(bytes) {
  // btoa expects a binary string. For large buffers, chunk to avoid "string
  // too long" errors.
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function upload(file, opts = {}) {
  if (!file) return { ok: false, error: 'Falta archivo.' };

  const storageCfg = window.stStorage.getWSSetting('storage', {}) || {};
  const mode = opts.provider || storageCfg.mode || 'base64';

  // Optional optimization: resize + recompress before anything touches the
  // network. Controlled by `storage.optimize` toggle in Settings. Skipped
  // entirely for base64 (that mode already has its own size ceiling) and
  // for SVG (resize would rasterize the vector — undesirable).
  const shouldOptimize =
    storageCfg.optimize === true
    && mode !== 'base64'
    && opts.skipOptimize !== true
    && !(file?.type && /svg/i.test(file.type));
  if (shouldOptimize) {
    try {
      file = await optimizeImage(file, { maxDim: 2000, quality: 0.85 });
    } catch (err) {
      console.warn('[stCDN] optimize failed, using original', err);
    }
  }

  if (mode === 'base64') {
    return await uploadBase64(file, opts);
  }

  if (!window.cdn || typeof window.cdn.upload !== 'function') {
    return { ok: false, error: 'El puente de subida no está disponible (abrí la app en Electron).' };
  }

  const providerConfig = storageCfg[mode] || {};
  const secrets = await resolveSecrets(mode, providerConfig);

  const data = await fileToUint8Array(file);
  const filename = buildFilename(file, opts);
  const contentType = file?.type || opts.contentType || guessContentType(filename);

  try {
    const result = await window.cdn.upload({
      provider: mode,
      config: providerConfig,
      secrets,
      file: data,
      filename,
      contentType,
    });
    return result;
  } catch (err) {
    return { ok: false, error: err?.message || 'Error llamando al puente de subida.', code: 'IPC' };
  }
}

// Generate a unique-ish filename. S3 and similar path-based providers rely
// on this as the object key; collisions overwrite silently.
function buildFilename(file, opts) {
  if (opts.filename) return opts.filename;
  const original = file?.name || 'upload';
  const ext = (original.split('.').pop() || '').toLowerCase();
  const base = original.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 40) || 'upload';
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${ts}${rand}${ext ? '.' + ext : ''}`;
}

function guessContentType(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
  };
  return map[ext] || 'application/octet-stream';
}

// Downscale + recompress an image before upload. Runs entirely in the
// renderer via Canvas — no deps, no native bindings. Preserves PNG when the
// source has alpha (to avoid matting artifacts); WebP otherwise for size.
//
// Returns a Blob with `name` + `type` properties set, so the rest of
// `upload()` can treat it identically to the original File.
async function optimizeImage(file, { maxDim = 2000, quality = 0.85 } = {}) {
  const srcType = file?.type || 'image/png';
  const preserveAlpha = /png|gif/i.test(srcType);
  const outType = preserveAlpha ? 'image/png' : 'image/webp';

  const bytes = await fileToUint8Array(file);
  const blob = new Blob([bytes], { type: srcType });
  const url = URL.createObjectURL(blob);

  let img;
  try {
    img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }

  const { naturalWidth: w, naturalHeight: h } = img;
  // No-op if already within the target dimensions AND we're not changing
  // the codec. Keeps the original bytes (smaller in most cases than a
  // re-encoded copy at the same pixel count).
  if (w <= maxDim && h <= maxDim && srcType === outType) {
    URL.revokeObjectURL(url);
    return file;
  }

  const scale = Math.min(1, maxDim / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('No se pudo inicializar canvas para optimizar.');
  }
  ctx.drawImage(img, 0, 0, tw, th);
  URL.revokeObjectURL(url);

  const outBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob devolvió null.'))),
      outType,
      quality,
    );
  });

  // Rename extension to match the new codec so S3/GitHub/etc. save with
  // the right file type on disk.
  const base = (file?.name || 'imagen').replace(/\.[^.]+$/, '');
  const ext = outType === 'image/webp' ? 'webp' : outType === 'image/png' ? 'png' : 'jpg';
  const named = new File([outBlob], `${base}.${ext}`, { type: outType });
  return named;
}

// Lightweight connectivity test — uploads a 1x1 transparent PNG and reports
// whether the configured provider accepts it. Used by the "Probar conexión"
// button in Settings → Almacenamiento.
const TEST_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
]);

async function testConnection(provider) {
  return await upload(
    { data: TEST_PNG_BYTES, name: `connection-test-${Date.now()}.png`, type: 'image/png' },
    { provider, filename: `connection-test-${Date.now()}.png`, contentType: 'image/png' },
  );
}

const stCDN = { upload, resolveSecrets, testConnection, optimizeImage };
Object.assign(window, { stCDN });
