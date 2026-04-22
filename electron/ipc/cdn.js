const { ipcMain } = require('electron');
const { upload } = require('../cdn/upload');

function register() {
  ipcMain.handle('cdn:upload', async (_e, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Payload inválido.', code: 'EINVAL' };
    }
    return await upload(payload);
  });
}

module.exports = { register };
