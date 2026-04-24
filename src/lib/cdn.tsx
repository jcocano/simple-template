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
  throw new Error(window.stI18n.t('cdn.err.fileReadFailed'));
}

// Base64 path: reads file into a data URL. Optional for self-contained HTML.
// Not the default; recommended mode is `local`. Size cap is permissive
// (1024 KB) and emits a warning when exceeded.
async function uploadBase64(file, opts = {}) {
  const bytes = await fileToUint8Array(file);
  const sizeKB = Math.round(bytes.length / 1024);
  const maxKB = opts.maxKB || 1024;
  if (sizeKB > maxKB) {
    return {
      ok: false,
      error: window.stI18n.t('cdn.err.imgTooLargeBase64', { sizeKB, maxKB }),
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

// Local disk path: delegates to `cdn.saveLocal` in main. File is stored in
// `userData/workspaces/{wsId}/images/{id}.{ext}` and served via `st-img://`.
// No hard cap, only a 50MB soft cap to prevent accidental OOM uploads.
const LOCAL_SOFT_CAP = 50 * 1024 * 1024;
function randomImageId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `img_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
  return `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
function extFrom(file) {
  const name = file?.name || '';
  const fromName = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  if (fromName) return fromName;
  const mime = file?.type || '';
  const m = mime.match(/^image\/(\w+)/);
  if (m) {
    const sub = m[1].toLowerCase();
    return sub === 'jpeg' ? 'jpg' : sub;
  }
  return 'png';
}
async function uploadLocal(file, opts = {}) {
  if (!window.cdn || typeof window.cdn.saveLocal !== 'function') {
    return { ok: false, error: window.stI18n.t('cdn.err.localBridgeUnavailable'), code: 'IPC' };
  }
  const workspaceId = window.stStorage?.getCurrentWorkspaceId?.();
  if (!workspaceId) {
    return { ok: false, error: window.stI18n.t('cdn.err.workspaceNotReady'), code: 'CONFIG' };
  }
  const bytes = await fileToUint8Array(file);
  if (bytes.length > LOCAL_SOFT_CAP) {
    return {
      ok: false,
      error: window.stI18n.t('cdn.err.imgTooLargeLocal', {
        sizeMB: Math.round(bytes.length / 1024 / 1024),
        maxMB: Math.round(LOCAL_SOFT_CAP / 1024 / 1024),
      }),
      code: 'PAYLOAD_TOO_LARGE',
    };
  }
  const imageId = opts.imageId || randomImageId();
  const ext = extFrom(file);
  try {
    const result = await window.cdn.saveLocal({ workspaceId, imageId, ext, bytes });
    if (!result?.ok) return result || { ok: false, error: window.stI18n.t('cdn.err.saveUnknown'), code: 'IO' };
    return {
      ok: true,
      url: result.url,
      localPath: result.localPath,
      mode: 'local',
      sizeKB: Math.round(bytes.length / 1024),
    };
  } catch (err) {
    return { ok: false, error: err?.message || window.stI18n.t('cdn.err.localIpcFailed'), code: 'IPC' };
  }
}

/**
 * Encodes Uint8Array bytes into base64 using chunked conversion.
 * @param {Uint8Array} bytes Binary payload.
 * @returns {string} Base64 string.
 */
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
  if (!file) return { ok: false, error: window.stI18n.t('cdn.err.missingFile') };

  const storageCfg = window.stStorage.getWSSetting('storage', {}) || {};
  const mode = opts.provider || storageCfg.mode || 'local';

  // Default optimization: resize to max 2000 px and re-encode while preserving
  // source format. Enabled unless user disabled it (`storage.optimize === false`)
  // or caller passed `skipOptimize`. SVG is excluded to avoid rasterizing vectors.
  const shouldOptimize =
    storageCfg.optimize !== false
    && opts.skipOptimize !== true
    && !(file?.type && /svg/i.test(file.type));
  let outFile = file;
  if (shouldOptimize) {
    try {
      outFile = await optimizeImage(file, { maxDim: 2000, quality: 0.85 });
    } catch (err) {
      console.warn('[stCDN] optimize failed, using original', err);
    }
  }

  let providerResult;
  if (mode === 'local') {
    providerResult = await uploadLocal(outFile, opts);
  } else if (mode === 'base64') {
    providerResult = await uploadBase64(outFile, opts);
  } else if (!window.cdn || typeof window.cdn.upload !== 'function') {
    return { ok: false, error: window.stI18n.t('cdn.err.uploadBridgeUnavailable') };
  } else {
    const providerConfig = storageCfg[mode] || {};
    const secrets = await resolveSecrets(mode, providerConfig);
    const data = await fileToUint8Array(outFile);
    const filename = buildFilename(outFile, opts);
    const contentType = outFile?.type || opts.contentType || guessContentType(filename);
    try {
      providerResult = await window.cdn.upload({
        provider: mode,
        config: providerConfig,
        secrets,
        file: data,
        filename,
        contentType,
      });
    } catch (err) {
      return { ok: false, error: err?.message || 'Error llamando al puente de subida.', code: 'IPC' };
    }
  }

  if (!providerResult?.ok) return providerResult;

  // Expose the post-optimization metadata so callers persist the real file
  // attributes, not the pre-compression ones from the original input.
  let width = null;
  let height = null;
  try {
    if (window.stImages && typeof window.stImages.readImageSize === 'function') {
      const dim = await window.stImages.readImageSize(outFile);
      if (dim) { width = dim.width; height = dim.height; }
    }
  } catch {}

  return {
    ...providerResult,
    sizeBytes: outFile.size ?? null,
    mime: outFile.type || null,
    width,
    height,
  };
}

// Generate a unique-ish filename. S3 and similar path-based providers rely
// on this as the object key; collisions overwrite silently.
/**
 * Builds a provider-safe filename for object-key based storage backends.
 * @param {{name?: string}|Blob|File} file Input file-like object.
 * @param {{filename?: string}} opts Upload options.
 * @returns {string} Stable filename to send to provider.
 */
function buildFilename(file, opts) {
  if (opts.filename) return opts.filename;
  const original = file?.name || 'upload';
  const ext = (original.split('.').pop() || '').toLowerCase();
  const base = original.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 40) || 'upload';
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${ts}${rand}${ext ? '.' + ext : ''}`;
}

/**
 * Infers content-type from file extension.
 * @param {string} filename File name with extension.
 * @returns {string} MIME type fallbacking to `application/octet-stream`.
 */
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

// Downscale + recompress image before upload. Runs in renderer via Canvas,
// without native deps. Keeps source format (JPG -> JPG, PNG -> PNG) for max
// email-client compatibility (older Outlook desktop does not support WebP).
// GIF loses animation through canvas, so we emit static PNG.
//
// `maxBytes` is a size budget (post-encode). If the re-encoded output exceeds
// it, we escalate: PNG without meaningful alpha -> JPEG, then iteratively
// shrink dimensions. The budget exists because otherwise a 500x500 PNG can
// still weigh 1+ MB and push emails past Gmail's clipping threshold.
//
// Returns a `File` with `name` and `type` set so downstream `upload()` treats
// it exactly like the original input.
async function optimizeImage(file, { maxDim = 2000, quality = 0.85, maxBytes = 400_000 } = {}) {
  const srcType = file?.type || 'image/png';
  const isPng  = /png/i.test(srcType);
  const isGif  = /gif/i.test(srcType);
  // PNG with alpha -> PNG. GIF -> PNG (drops animation, keeps first-frame
  // quality). JPG (and fallback types) -> JPG.
  const initialOutType = (isPng || isGif) ? 'image/png' : 'image/jpeg';

  const bytes = await fileToUint8Array(file);
  const sourceSize = bytes.byteLength;
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
  // Skip re-encoding only when the source is already within BOTH budgets
  // (dimensions AND bytes) and we're not changing codecs. Re-encoding a
  // small-and-light PNG doesn't help; re-encoding a small-but-heavy PNG does.
  if (w <= maxDim && h <= maxDim && sourceSize <= maxBytes && srcType === initialOutType) {
    URL.revokeObjectURL(url);
    return file;
  }

  const scale = Math.min(1, maxDim / Math.max(w, h));
  let tw = Math.max(1, Math.round(w * scale));
  let th = Math.max(1, Math.round(h * scale));

  let currentOutType = initialOutType;
  let currentQuality = quality;
  let best = null;

  // Escalation ladder, stops as soon as an attempt fits within maxBytes:
  //   1. Re-encode at full resolution with the initial codec.
  //   2. If still over budget and the PNG has no significant alpha, switch
  //      to JPEG (typically 5-10x smaller for photos).
  //   3. Shrink dimensions 20% and retry. Max 3 shrink passes.
  // If nothing fits, return the smallest attempt produced (`best`).
  for (let attempt = 0; attempt < 5; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      throw new Error(window.stI18n.t('cdn.err.canvasInitFailed'));
    }
    ctx.drawImage(img, 0, 0, tw, th);

    const outBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error(window.stI18n.t('cdn.err.canvasToBlobNull')))),
        currentOutType,
        currentQuality,
      );
    });

    if (!best || outBlob.size < best.blob.size) {
      best = { blob: outBlob, type: currentOutType };
    }

    if (outBlob.size <= maxBytes) break;

    // First escalation: try JPEG when we're emitting PNG with no alpha.
    // Only attempted once — after that we switch to shrinking.
    if (currentOutType === 'image/png' && !hasSignificantAlpha(ctx, tw, th)) {
      currentOutType = 'image/jpeg';
      continue;
    }

    // Subsequent escalations: shrink by 20%. Stop if the image would become
    // tinier than usable for an email hero.
    const nextW = Math.max(1, Math.round(tw * 0.8));
    const nextH = Math.max(1, Math.round(th * 0.8));
    if (nextW < 128 || nextH < 128) break;
    tw = nextW;
    th = nextH;
  }

  URL.revokeObjectURL(url);

  const outType = best.type;
  const base = (file?.name || 'imagen').replace(/\.[^.]+$/, '');
  const ext = outType === 'image/png' ? 'png' : 'jpg';
  return new File([best.blob], `${base}.${ext}`, { type: outType });
}

// Samples up to 256 pixels from the canvas to decide whether transparency
// is load-bearing. Anything below `alphaThreshold` in more than 0.5% of samples
// counts as "has alpha" — flat fully-opaque PNGs pass, photo-like PNGs with a
// few anti-aliased edges pass too, screenshots with real transparency fail.
function hasSignificantAlpha(ctx, w, h) {
  try {
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const total = w * h;
    const step = Math.max(1, Math.floor(total / 256));
    const alphaThreshold = 250;
    let transparentCount = 0;
    let sampled = 0;
    for (let i = 0; i < total; i += step) {
      const a = data[i * 4 + 3];
      if (a < alphaThreshold) transparentCount++;
      sampled++;
    }
    return sampled > 0 && transparentCount / sampled > 0.005;
  } catch {
    return true;
  }
}

// Lightweight connectivity test — uploads a 1x1 transparent PNG and reports
// whether the configured provider accepts it. Used by the "Test connection"
// button in Settings -> Storage.
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
