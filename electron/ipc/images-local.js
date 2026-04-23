// IPC del modo 'local' de storage. Equivalente al bridge `cdn:upload` pero
// sin red — el archivo queda en userData/workspaces/{wsId}/images/. La URL
// resultante es `st-img://{wsId}/{imageId}.{ext}`, servida por el protocol
// handler registrado en main.js.

const { ipcMain } = require('electron');
const imageFiles = require('../storage/image-files');

function register() {
  // Guardar un archivo local. Payload: { workspaceId, imageId, ext, bytes:Uint8Array }.
  ipcMain.handle('images:saveLocal', async (_e, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Payload inválido.', code: 'EINVAL' };
    }
    const { workspaceId, imageId, ext, bytes } = payload;
    if (!workspaceId) return { ok: false, error: 'Falta workspaceId.', code: 'EINVAL' };
    if (!imageId) return { ok: false, error: 'Falta imageId.', code: 'EINVAL' };
    if (!bytes) return { ok: false, error: 'Faltan bytes.', code: 'EINVAL' };
    try {
      const { localPath, ext: safeExt } = imageFiles.write(workspaceId, imageId, ext, bytes);
      return {
        ok: true,
        url: `st-img://${workspaceId}/${localPath}`,
        localPath,
        ext: safeExt,
        mode: 'local',
      };
    } catch (err) {
      return { ok: false, error: err?.message || 'No se pudo guardar.', code: 'IO' };
    }
  });

  // Leer un archivo local como data URL — útil para inline-en-export y otros
  // callers del renderer que necesitan base64 desde un st-img:// URL.
  ipcMain.handle('images:readLocalAsDataUrl', async (_e, url) => {
    const parsed = imageFiles.parseStImgUrl(url);
    if (!parsed) return { ok: false, error: 'URL inválida.', code: 'EINVAL' };
    const data = imageFiles.read(parsed.workspaceId, parsed.localPath);
    if (!data) return { ok: false, error: 'Archivo no encontrado.', code: 'ENOENT' };
    const b64 = Buffer.from(data.bytes).toString('base64');
    return {
      ok: true,
      dataUrl: `data:${data.mime};base64,${b64}`,
      mime: data.mime,
      sizeBytes: data.bytes.length,
    };
  });
}

module.exports = { register };
