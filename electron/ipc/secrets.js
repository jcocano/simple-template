const { ipcMain } = require('electron');
const secrets = require('../storage/secrets');

function register() {
  ipcMain.handle('secrets:set', (_e, key, value) => {
    secrets.set(key, value);
    return true;
  });
  ipcMain.handle('secrets:get', (_e, key) => secrets.get(key));
  ipcMain.handle('secrets:remove', (_e, key) => {
    secrets.remove(key);
    return true;
  });
  ipcMain.handle('secrets:backend', () => secrets.backend());
}

module.exports = { register };
