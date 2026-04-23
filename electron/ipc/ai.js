const { ipcMain } = require('electron');
const { complete, listModels } = require('../ai/client');
const aiLog = require('../storage/ai_log');

function register() {
  ipcMain.handle('ai:complete', async (_e, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Payload inválido.', code: 'EINVAL' };
    }
    return await complete(payload);
  });
  ipcMain.handle('ai:listModels', async (_e, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Payload inválido.', code: 'EINVAL' };
    }
    return await listModels(payload);
  });
  ipcMain.handle('ai:log:add', (_e, workspaceId, entry) => {
    try { return aiLog.add(workspaceId, entry); }
    catch (err) { console.error('[ai:log:add]', err); return null; }
  });
  ipcMain.handle('ai:log:list', (_e, workspaceId, opts) => {
    try { return aiLog.list(workspaceId, opts || {}); }
    catch (err) { console.error('[ai:log:list]', err); return []; }
  });
  ipcMain.handle('ai:log:count', (_e, workspaceId) => {
    try { return aiLog.count(workspaceId); }
    catch (err) { console.error('[ai:log:count]', err); return 0; }
  });
  ipcMain.handle('ai:log:clear', (_e, workspaceId) => {
    try { return aiLog.clear(workspaceId); }
    catch (err) { console.error('[ai:log:clear]', err); return 0; }
  });
}

module.exports = { register };
