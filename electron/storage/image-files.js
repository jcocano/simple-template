// Filesystem layer para imágenes locales (mode='local').
// Los archivos viven en userData/workspaces/{wsId}/images/{imageId}.{ext}.
// Filename = imageId generado por el renderer (hex random con prefijo img_)
// + extensión sanitizada contra allow-list → no hay traversal posible.

const fs = require('fs');
const path = require('path');
const { workspaceImagesDir, ensureImagesDir } = require('./paths');

const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']);
const MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
};
// Filename shape we produce and accept: alphanum/_/- base + dot + short ext.
const LOCAL_PATH_RE = /^[A-Za-z0-9_-]+\.[a-z0-9]{2,5}$/;
const WS_ID_RE = /^ws_[a-f0-9]+$/;

function sanitizeExt(raw) {
  const clean = String(raw || '').toLowerCase().replace(/^\./, '').replace(/[^a-z0-9]/g, '');
  return ALLOWED_EXT.has(clean) ? clean : 'png';
}

function mimeFor(ext) {
  return MIME_BY_EXT[sanitizeExt(ext)] || 'application/octet-stream';
}

function isSafeLocalPath(localPath) {
  return typeof localPath === 'string' && LOCAL_PATH_RE.test(localPath);
}

function isSafeWorkspaceId(wsId) {
  return typeof wsId === 'string' && WS_ID_RE.test(wsId);
}

// Escribe bytes a disco para un workspace/id/ext dados. Devuelve el basename
// como `localPath` (lo que queda guardado en la columna `images.local_path`).
function write(workspaceId, imageId, ext, bytes) {
  if (!isSafeWorkspaceId(workspaceId)) throw new Error('workspaceId inválido');
  if (!/^[A-Za-z0-9_-]+$/.test(imageId || '')) throw new Error('imageId inválido');
  const safeExt = sanitizeExt(ext);
  ensureImagesDir(workspaceId);
  const filename = `${imageId}.${safeExt}`;
  const full = path.join(workspaceImagesDir(workspaceId), filename);
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  fs.writeFileSync(full, buf);
  return { localPath: filename, ext: safeExt };
}

// Lee bytes + mime. Devuelve null si falta el archivo, o si los inputs son
// sospechosos (defensivo — el protocol handler y los IPCs dependen de esto).
function read(workspaceId, localPath) {
  if (!isSafeWorkspaceId(workspaceId)) return null;
  if (!isSafeLocalPath(localPath)) return null;
  const full = path.join(workspaceImagesDir(workspaceId), localPath);
  try {
    const bytes = fs.readFileSync(full);
    const ext = localPath.split('.').pop() || '';
    return { bytes, mime: mimeFor(ext) };
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    console.error('[image-files] read failed', workspaceId, localPath, err);
    return null;
  }
}

function remove(workspaceId, localPath) {
  if (!isSafeWorkspaceId(workspaceId)) return false;
  if (!isSafeLocalPath(localPath)) return false;
  const full = path.join(workspaceImagesDir(workspaceId), localPath);
  try {
    fs.unlinkSync(full);
    return true;
  } catch (err) {
    if (err && err.code === 'ENOENT') return false;
    console.error('[image-files] remove failed', workspaceId, localPath, err);
    return false;
  }
}

// Parsea st-img://{wsId}/{filename} → { workspaceId, localPath } o null.
// Delegar acá mantiene la lógica de parseo centralizada para que el protocol
// handler, el export inline y el SMTP transform la reusen.
function parseStImgUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('st-img://')) return null;
  try {
    const parsed = new URL(url);
    const workspaceId = parsed.hostname;
    const localPath = path.posix.basename(parsed.pathname || '');
    if (!isSafeWorkspaceId(workspaceId)) return null;
    if (!isSafeLocalPath(localPath)) return null;
    return { workspaceId, localPath };
  } catch {
    return null;
  }
}

function bytesForUrl(url) {
  const parsed = parseStImgUrl(url);
  if (!parsed) return null;
  return read(parsed.workspaceId, parsed.localPath);
}

module.exports = {
  write,
  read,
  remove,
  parseStImgUrl,
  bytesForUrl,
  sanitizeExt,
  mimeFor,
  isSafeLocalPath,
  isSafeWorkspaceId,
  ALLOWED_EXT,
};
