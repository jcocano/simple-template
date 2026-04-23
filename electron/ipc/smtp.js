const { ipcMain } = require('electron');
const { send } = require('../smtp/send');

function register() {
  ipcMain.handle('smtp:send', async (_e, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Payload inválido.', code: 'EINVAL' };
    }
    return await send(payload);
  });
}

module.exports = { register };
