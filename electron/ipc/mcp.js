const { ipcMain } = require('electron');
const mcp = require('../mcp');

function register() {
  ipcMain.handle('mcp:status', () => mcp.getStatus());

  ipcMain.handle('mcp:setEnabled', async (_e, enabled) => {
    try {
      return await mcp.setEnabled(enabled);
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('mcp:setPort', async (_e, port) => {
    try {
      return await mcp.setPort(port);
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('mcp:rotateToken', async () => {
    try {
      return await mcp.rotateToken();
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('mcp:forceRelease', () => {
    mcp.forceRelease();
    return { ok: true };
  });
}

module.exports = { register };
