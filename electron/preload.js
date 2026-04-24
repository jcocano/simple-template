const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
});

contextBridge.exposeInMainWorld('storage', {
  templates: {
    list: (workspaceId) => invoke('storage:templates:list', workspaceId),
    listTrashed: (workspaceId) => invoke('storage:templates:listTrashed', workspaceId),
    read: (workspaceId, id) => invoke('storage:templates:read', workspaceId, id),
    write: (workspaceId, id, doc) => invoke('storage:templates:write', workspaceId, id, doc),
    remove: (workspaceId, id) => invoke('storage:templates:remove', workspaceId, id),
    restore: (workspaceId, id) => invoke('storage:templates:restore', workspaceId, id),
    purge: (workspaceId, id) => invoke('storage:templates:purge', workspaceId, id),
    rename: (workspaceId, id, name) => invoke('storage:templates:rename', workspaceId, id, name),
    newId: () => invoke('storage:templates:newId')
  },
  blocks: {
    list: (workspaceId) => invoke('storage:blocks:list', workspaceId),
    listTrashed: (workspaceId) => invoke('storage:blocks:listTrashed', workspaceId),
    read: (workspaceId, id) => invoke('storage:blocks:read', workspaceId, id),
    write: (workspaceId, id, doc) => invoke('storage:blocks:write', workspaceId, id, doc),
    remove: (workspaceId, id) => invoke('storage:blocks:remove', workspaceId, id),
    restore: (workspaceId, id) => invoke('storage:blocks:restore', workspaceId, id),
    purge: (workspaceId, id) => invoke('storage:blocks:purge', workspaceId, id),
    rename: (workspaceId, id, name) => invoke('storage:blocks:rename', workspaceId, id, name),
    newId: () => invoke('storage:blocks:newId')
  },
  settings: {
    get: (key) => invoke('storage:settings:get', key),
    set: (key, value) => invoke('storage:settings:set', key, value),
    remove: (key) => invoke('storage:settings:remove', key),
    list: () => invoke('storage:settings:list')
  },
  workspaces: {
    list: () => invoke('storage:workspaces:list'),
    create: (name) => invoke('storage:workspaces:create', name),
    rename: (id, name) => invoke('storage:workspaces:rename', id, name),
    remove: (id) => invoke('storage:workspaces:remove', id),
    countTemplates: (id) => invoke('storage:workspaces:countTemplates', id)
  },
  wsSettings: {
    get: (workspaceId, key) => invoke('storage:wsSettings:get', workspaceId, key),
    set: (workspaceId, key, value) => invoke('storage:wsSettings:set', workspaceId, key, value),
    remove: (workspaceId, key) => invoke('storage:wsSettings:remove', workspaceId, key),
    list: (workspaceId) => invoke('storage:wsSettings:list', workspaceId)
  },
  images: {
    list: (workspaceId) => invoke('storage:images:list', workspaceId),
    add: (workspaceId, entry) => invoke('storage:images:add', workspaceId, entry),
    remove: (workspaceId, id) => invoke('storage:images:remove', workspaceId, id),
    updateFolder: (workspaceId, id, folder) => invoke('storage:images:updateFolder', workspaceId, id, folder),
    rename: (workspaceId, id, name) => invoke('storage:images:rename', workspaceId, id, name),
    folders: (workspaceId) => invoke('storage:images:folders', workspaceId)
  }
});

contextBridge.exposeInMainWorld('secrets', {
  get: (key) => invoke('secrets:get', key),
  set: (key, value) => invoke('secrets:set', key, value),
  remove: (key) => invoke('secrets:remove', key),
  backend: () => invoke('secrets:backend')
});

contextBridge.exposeInMainWorld('smtp', {
  send: (payload) => invoke('smtp:send', payload)
});

contextBridge.exposeInMainWorld('shell', {
  openExternal: (url) => invoke('shell:openExternal', url),
  beep: () => invoke('shell:beep')
});

contextBridge.exposeInMainWorld('oauth', {
  authorize: (providerConfig) => invoke('oauth:authorize', providerConfig),
  refresh: (providerConfig, refreshToken) => invoke('oauth:refresh', providerConfig, refreshToken)
});

contextBridge.exposeInMainWorld('ai', {
  complete: (payload) => invoke('ai:complete', payload),
  listModels: (payload) => invoke('ai:listModels', payload),
  log: {
    add: (workspaceId, entry) => invoke('ai:log:add', workspaceId, entry),
    list: (workspaceId, opts) => invoke('ai:log:list', workspaceId, opts),
    count: (workspaceId) => invoke('ai:log:count', workspaceId),
    clear: (workspaceId) => invoke('ai:log:clear', workspaceId)
  }
});

contextBridge.exposeInMainWorld('cdn', {
  upload: (payload) => invoke('cdn:upload', payload),
  saveLocal: (payload) => invoke('images:saveLocal', payload),
  readLocalAsDataUrl: (url) => invoke('images:readLocalAsDataUrl', url),
  checkExists: (urls) => invoke('images:checkExists', urls)
});

contextBridge.exposeInMainWorld('share', {
  upload: (bytes, filename) => invoke('share:upload', bytes, filename),
  download: (url) => invoke('share:download', url),
  onDeepLink: (cb) => {
    const listener = (_e, url) => {
      try { cb(url); } catch (err) { console.error('[share.onDeepLink]', err); }
    };
    ipcRenderer.on('share:deeplink', listener);
    return () => ipcRenderer.removeListener('share:deeplink', listener);
  }
});

contextBridge.exposeInMainWorld('mcp', {
  status: () => invoke('mcp:status'),
  setEnabled: (enabled) => invoke('mcp:setEnabled', enabled),
  setPort: (port) => invoke('mcp:setPort', port),
  rotateToken: () => invoke('mcp:rotateToken'),
  forceRelease: () => invoke('mcp:forceRelease'),
  onActivity: (cb) => {
    const listener = (_e, detail) => {
      try { cb(detail); } catch (err) { console.error('[mcp.onActivity]', err); }
    };
    ipcRenderer.on('st:mcp-activity', listener);
    return () => ipcRenderer.removeListener('st:mcp-activity', listener);
  },
  onExternalChange: (cb) => {
    const listener = (_e, detail) => {
      try { cb(detail); } catch (err) { console.error('[mcp.onExternalChange]', err); }
    };
    ipcRenderer.on('st:template-change-external', listener);
    return () => ipcRenderer.removeListener('st:template-change-external', listener);
  },
  onOpenTemplate: (cb) => {
    const listener = (_e, detail) => {
      try { cb(detail); } catch (err) { console.error('[mcp.onOpenTemplate]', err); }
    };
    ipcRenderer.on('st:mcp-open-template', listener);
    return () => ipcRenderer.removeListener('st:mcp-open-template', listener);
  },
});
