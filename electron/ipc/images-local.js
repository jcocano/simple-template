// IPC handlers for local storage mode. Equivalent to `cdn:upload` without
// network: file is stored in userData/workspaces/{wsId}/images/. Result URL is
// `st-img://{wsId}/{imageId}.{ext}`, served by the custom protocol in main.js.

const { ipcMain } = require('electron');
const imageFiles = require('../storage/image-files');

function register() {
  // Save local file. Payload: { workspaceId, imageId, ext, bytes: Uint8Array }.
  ipcMain.handle('images:saveLocal', async (_e, payload) => {
    if (!payload || typeof payload !== 'object') {
      return {
        ok: false,
        errorKey: 'ipc.err.invalidPayload',
        errorParams: {},
        error: 'Invalid payload.',
        code: 'EINVAL',
      };
    }
    const { workspaceId, imageId, ext, bytes } = payload;
    if (!workspaceId) {
      return {
        ok: false,
        errorKey: 'ipc.err.missingWorkspaceId',
        errorParams: {},
        error: 'Missing workspaceId.',
        code: 'EINVAL',
      };
    }
    if (!imageId) {
      return {
        ok: false,
        errorKey: 'ipc.err.missingImageId',
        errorParams: {},
        error: 'Missing imageId.',
        code: 'EINVAL',
      };
    }
    if (!bytes) {
      return {
        ok: false,
        errorKey: 'ipc.err.missingBytes',
        errorParams: {},
        error: 'Missing bytes.',
        code: 'EINVAL',
      };
    }
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
      return {
        ok: false,
        errorKey: 'ipc.err.couldNotSaveImage',
        errorParams: {},
        error: err?.message || 'Could not save the image.',
        code: 'IO',
      };
    }
  });

  // Read local file as data URL for export inlining and other renderer callers
  // that need base64 content from an st-img:// URL.
  ipcMain.handle('images:readLocalAsDataUrl', async (_e, url) => {
    const parsed = imageFiles.parseStImgUrl(url);
    if (!parsed) {
      return {
        ok: false,
        errorKey: 'ipc.err.invalidUrl',
        errorParams: {},
        error: 'Invalid URL.',
        code: 'EINVAL',
      };
    }
    const data = imageFiles.read(parsed.workspaceId, parsed.localPath);
    if (!data) {
      return {
        ok: false,
        errorKey: 'ipc.err.fileNotFound',
        errorParams: {},
        error: 'File not found.',
        code: 'ENOENT',
      };
    }
    const b64 = Buffer.from(data.bytes).toString('base64');
    return {
      ok: true,
      dataUrl: `data:${data.mime};base64,${b64}`,
      mime: data.mime,
      sizeBytes: data.bytes.length,
    };
  });

  // Batch existence check for `st-img://` URLs. Used by the Review panel's
  // orphan-image check to flag broken references without reading bytes.
  ipcMain.handle('images:checkExists', async (_e, urls) => {
    if (!Array.isArray(urls)) return { ok: false, results: {} };
    const results = {};
    for (const url of urls) {
      const parsed = imageFiles.parseStImgUrl(url);
      if (!parsed) { results[url] = false; continue; }
      results[url] = imageFiles.exists(parsed.workspaceId, parsed.localPath);
    }
    return { ok: true, results };
  });
}

module.exports = { register };
