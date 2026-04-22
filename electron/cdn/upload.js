// CDN upload dispatcher. Normalizes 3 providers behind a single interface:
//   - imgbb      (API key, multipart POST)
//   - cloudinary (unsigned upload preset, multipart POST)
//   - s3         (SigV4 signed PUT — covers AWS S3, R2, B2, Wasabi, MinIO, DO Spaces)
//
// GitHub Pages and FTP are parked for a future sub-bundle.
//
// Payload shape (from IPC):
//   {
//     provider: 's3' | 'cloudinary' | 'imgbb',
//     config: {...}     // public config fields (bucket, preset, etc.)
//     secrets: {...}    // sensitive fields (apiKey, secret)
//     file: Uint8Array  // binary image data
//     filename: string
//     contentType: string
//   }
//
// Output:
//   { ok: true, url: 'https://...' }
//   { ok: false, error: '...', code?: 'AUTH'|'NETWORK'|'CONFIG' }

const { signedPutRequest, encodeObjectKey } = require('./s3-sign');
const { uploadGithub } = require('./github');
const { uploadFTP } = require('./ftp');

async function upload(payload = {}) {
  const { provider } = payload;
  if (!provider) return { ok: false, error: 'Falta provider.', code: 'CONFIG' };
  const dispatch = {
    imgbb: uploadImgBB,
    cloudinary: uploadCloudinary,
    s3: uploadS3,
    github: uploadGithub,
    ftp: uploadFTP,
  };
  const fn = dispatch[provider];
  if (!fn) return { ok: false, error: `Provider "${provider}" no soportado.`, code: 'CONFIG' };
  try {
    return await fn(payload);
  } catch (err) {
    return { ok: false, error: err?.message || 'Error desconocido.', code: 'NETWORK' };
  }
}

function toBuffer(fileLike) {
  if (Buffer.isBuffer(fileLike)) return fileLike;
  if (fileLike instanceof Uint8Array) return Buffer.from(fileLike);
  if (fileLike?.buffer) return Buffer.from(fileLike.buffer, fileLike.byteOffset, fileLike.byteLength);
  throw new Error('payload.file debe ser Uint8Array o Buffer.');
}

// ═══════════════════════════════════════════════════════════════════
// imgbb
// ═══════════════════════════════════════════════════════════════════

async function uploadImgBB({ secrets, file, filename, contentType }) {
  const apiKey = secrets?.apiKey;
  if (!apiKey) return { ok: false, error: 'Falta API key de imgbb.', code: 'AUTH' };

  const buf = toBuffer(file);
  const form = new FormData();
  form.append('image', new Blob([buf], { type: contentType || 'image/png' }), filename || 'upload.png');

  const resp = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    body: form,
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok || !json?.success) {
    return {
      ok: false,
      error: json?.error?.message || json?.raw?.slice?.(0, 200) || `imgbb ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }
  // imgbb returns multiple URLs; `data.display_url` is friendly, `data.url`
  // is the direct image URL suitable for <img src>.
  return { ok: true, url: json.data?.url, deleteUrl: json.data?.delete_url, data: json.data };
}

// ═══════════════════════════════════════════════════════════════════
// Cloudinary (unsigned upload preset)
// ═══════════════════════════════════════════════════════════════════

async function uploadCloudinary({ config, file, filename, contentType }) {
  const cloudName = config?.cloudName;
  const uploadPreset = config?.uploadPreset;
  if (!cloudName || !uploadPreset) {
    return { ok: false, error: 'Falta cloud name o upload preset de Cloudinary.', code: 'CONFIG' };
  }

  const buf = toBuffer(file);
  const form = new FormData();
  form.append('file', new Blob([buf], { type: contentType || 'image/png' }), filename || 'upload.png');
  form.append('upload_preset', uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
  const resp = await fetch(url, { method: 'POST', body: form });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return {
      ok: false,
      error: json?.error?.message || `Cloudinary ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }
  return {
    ok: true,
    url: json.secure_url || json.url,
    data: json,
  };
}

// ═══════════════════════════════════════════════════════════════════
// S3 compatible (SigV4)
// ═══════════════════════════════════════════════════════════════════

async function uploadS3({ config, secrets, file, filename, contentType }) {
  const {
    endpoint = 'https://s3.amazonaws.com',
    region = 'us-east-1',
    bucket,
    key: accessKeyId,
    publicUrl,
  } = config || {};
  const secretAccessKey = secrets?.secret;

  if (!bucket) return { ok: false, error: 'Falta nombre del bucket.', code: 'CONFIG' };
  if (!accessKeyId || !secretAccessKey) {
    return { ok: false, error: 'Faltan credenciales AWS (Access Key + Secret).', code: 'AUTH' };
  }

  const buf = toBuffer(file);
  // Use the filename as the S3 object key. If the caller wants a prefix
  // (e.g. per-template folders) they can encode it into `filename`.
  const key = filename || `upload-${Date.now()}.bin`;

  let req;
  try {
    req = signedPutRequest({
      endpoint, region, bucket, key,
      accessKeyId, secretAccessKey,
      body: buf,
      contentType: contentType || 'application/octet-stream',
    });
  } catch (err) {
    return { ok: false, error: err.message, code: 'CONFIG' };
  }

  const resp = await fetch(req.url, {
    method: 'PUT',
    headers: req.headers,
    body: buf,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return {
      ok: false,
      error: parseS3Error(errText) || `S3 ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }

  // Prefer the user-configured CDN domain if set; otherwise use the raw S3
  // URL. Note: the raw URL only works if the bucket has a public-read ACL.
  const finalUrl = publicUrl
    ? `${publicUrl.replace(/\/+$/, '')}/${encodeObjectKey(key)}`
    : req.url;

  return { ok: true, url: finalUrl };
}

// S3 returns XML error bodies like:
//   <Error><Code>SignatureDoesNotMatch</Code><Message>...</Message>...</Error>
function parseS3Error(xml) {
  if (!xml) return null;
  const codeMatch = /<Code>([^<]+)<\/Code>/i.exec(xml);
  const msgMatch = /<Message>([^<]+)<\/Message>/i.exec(xml);
  if (codeMatch || msgMatch) {
    return [codeMatch?.[1], msgMatch?.[1]].filter(Boolean).join(': ');
  }
  return xml.slice(0, 200);
}

function mapHttpError(status) {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'HTTP';
}

module.exports = { upload };
