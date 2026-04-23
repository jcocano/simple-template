const { ipcMain } = require('electron');
const { authorize, refresh } = require('../oauth/pkce');

function register() {
  ipcMain.handle('oauth:authorize', async (_e, providerConfig) => {
    if (!providerConfig || typeof providerConfig !== 'object') {
      return { ok: false, error: 'Provider config inválido.' };
    }
    return await authorize(providerConfig);
  });
  ipcMain.handle('oauth:refresh', async (_e, providerConfig, refreshToken) => {
    if (!providerConfig || typeof providerConfig !== 'object') {
      return { ok: false, error: 'Provider config inválido.' };
    }
    return await refresh(providerConfig, refreshToken);
  });
}

module.exports = { register };
