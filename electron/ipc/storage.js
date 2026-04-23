const { ipcMain } = require('electron');
const templates = require('../storage/templates');
const settings = require('../storage/settings');
const workspaces = require('../storage/workspaces');
const workspaceSettings = require('../storage/workspace-settings');
const images = require('../storage/images');

function register() {
  // Templates — always scoped by workspaceId
  ipcMain.handle('storage:templates:list', (_e, workspaceId) => templates.list(workspaceId));
  ipcMain.handle('storage:templates:listTrashed', (_e, workspaceId) => templates.listTrashed(workspaceId));
  ipcMain.handle('storage:templates:read', (_e, workspaceId, id) => templates.read(workspaceId, id));
  ipcMain.handle('storage:templates:write', (_e, workspaceId, id, doc) => templates.write(workspaceId, id, doc));
  ipcMain.handle('storage:templates:remove', (_e, workspaceId, id) => templates.remove(workspaceId, id));
  ipcMain.handle('storage:templates:restore', (_e, workspaceId, id) => templates.restore(workspaceId, id));
  ipcMain.handle('storage:templates:purge', (_e, workspaceId, id) => templates.purge(workspaceId, id));
  ipcMain.handle('storage:templates:rename', (_e, workspaceId, id, name) => templates.rename(workspaceId, id, name));
  ipcMain.handle('storage:templates:newId', () => templates.newId());

  // Global settings (user identity, appearance, ai, etc.)
  ipcMain.handle('storage:settings:get', (_e, key) => settings.get(key));
  ipcMain.handle('storage:settings:set', (_e, key, value) => {
    settings.set(key, value);
    return true;
  });
  ipcMain.handle('storage:settings:remove', (_e, key) => {
    settings.remove(key);
    return true;
  });
  ipcMain.handle('storage:settings:list', () => settings.list());

  // Workspaces CRUD
  ipcMain.handle('storage:workspaces:list', () => workspaces.list());
  ipcMain.handle('storage:workspaces:create', (_e, name) => workspaces.create(name));
  ipcMain.handle('storage:workspaces:rename', (_e, id, name) => workspaces.rename(id, name));
  ipcMain.handle('storage:workspaces:remove', (_e, id) => {
    try {
      return workspaces.remove(id);
    } catch (err) {
      return { error: err.message };
    }
  });
  ipcMain.handle('storage:workspaces:countTemplates', (_e, id) => workspaces.countTemplates(id));

  // Workspace-scoped settings (brand, delivery, vars, notif, editor, export, storage)
  ipcMain.handle('storage:wsSettings:get', (_e, workspaceId, key) => workspaceSettings.get(workspaceId, key));
  ipcMain.handle('storage:wsSettings:set', (_e, workspaceId, key, value) => {
    workspaceSettings.set(workspaceId, key, value);
    return true;
  });
  ipcMain.handle('storage:wsSettings:remove', (_e, workspaceId, key) => {
    workspaceSettings.remove(workspaceId, key);
    return true;
  });
  ipcMain.handle('storage:wsSettings:list', (_e, workspaceId) => workspaceSettings.list(workspaceId));

  // Image library (workspace-scoped)
  ipcMain.handle('storage:images:list', (_e, workspaceId) => images.list(workspaceId));
  ipcMain.handle('storage:images:add', (_e, workspaceId, entry) => images.add(workspaceId, entry));
  ipcMain.handle('storage:images:remove', (_e, workspaceId, id) => images.remove(workspaceId, id));
  ipcMain.handle('storage:images:updateFolder', (_e, workspaceId, id, folder) => images.updateFolder(workspaceId, id, folder));
  ipcMain.handle('storage:images:rename', (_e, workspaceId, id, name) => images.rename(workspaceId, id, name));
  ipcMain.handle('storage:images:folders', (_e, workspaceId) => images.folders(workspaceId));
}

module.exports = { register };
