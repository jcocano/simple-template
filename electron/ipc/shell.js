const { ipcMain, shell } = require('electron');

// Whitelist http(s) only so a compromised/malicious renderer can't trigger
// file:/// paths, protocol handlers, or other shell side effects.
function register() {
  ipcMain.handle('shell:openExternal', async (_e, url) => {
    if (typeof url !== 'string') return { ok: false, error: 'URL inválida.' };
    if (!/^https?:\/\//i.test(url)) return { ok: false, error: 'Solo se permiten URLs http/https.' };
    try {
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message || 'No se pudo abrir el navegador.' };
    }
  });
}

module.exports = { register };
