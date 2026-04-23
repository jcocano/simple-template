const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

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
  openExternal: (url) => invoke('shell:openExternal', url)
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
  upload: (payload) => invoke('cdn:upload', payload)
});
