const { ipcMain, shell } = require('electron');

// Whitelist http(s) only so a compromised/malicious renderer can't trigger
// file:/// paths, protocol handlers, or other shell side effects.
function register() {
  ipcMain.handle('shell:openExternal', async (_e, url) => {
    if (typeof url !== 'string') {
      return {
        ok: false,
        errorKey: 'ipc.err.invalidUrl',
        errorParams: {},
        error: 'Invalid URL.',
      };
    }
    if (!/^https?:\/\//i.test(url)) {
      return {
        ok: false,
        errorKey: 'ipc.err.onlyHttpUrlsAllowed',
        errorParams: {},
        error: 'Only http/https URLs are allowed.',
      };
    }
    try {
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        errorKey: 'ipc.err.couldNotOpenBrowser',
        errorParams: {},
        error: err?.message || 'Could not open the browser.',
      };
    }
  });

  ipcMain.handle('shell:beep', () => {
    try { shell.beep(); } catch (_) {}
    return { ok: true };
  });
}

module.exports = { register };
