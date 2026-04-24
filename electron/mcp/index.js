const auth = require('./auth');
const activity = require('./activity');
const server = require('./server');
const tools = require('./tools');
const settings = require('../storage/settings');

let mainWindow = null;

const DEFAULT_PORT = 7777;

async function init({ mainWindow: win }) {
  mainWindow = win;

  activity.on('change', (evt) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('st:mcp-activity', evt);
    }
  });

  tools.setNotifier(({ workspaceId, templateId, event }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('st:template-change-external', {
        workspaceId,
        templateId,
        source: 'mcp',
        event,
      });
    }
  });

  tools.setOpenTemplate(({ workspaceId, templateId }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('st:mcp-open-template', {
        workspaceId,
        templateId,
      });
    }
  });

  let enabled = settings.get('mcp:enabled');
  if (enabled === null || enabled === undefined) {
    enabled = true;
    settings.set('mcp:enabled', true);
  }

  let port = settings.get('mcp:port');
  if (port === null || port === undefined) {
    port = DEFAULT_PORT;
    settings.set('mcp:port', DEFAULT_PORT);
  }

  auth.getOrCreateToken();

  if (enabled) {
    try {
      await server.start({ port, tools });
    } catch (err) {
      console.error('[mcp] failed to start server:', err && err.message ? err.message : err);
    }
  }
}

async function shutdown() {
  try {
    if (server.isRunning()) {
      await server.stop();
    }
  } catch (_err) {
    // ignore
  }
}

function getStatus() {
  const running = server.isRunning();
  const port = server.getPort();
  return {
    enabled: !!settings.get('mcp:enabled'),
    running,
    port,
    token: auth.getOrCreateToken(),
    url: running ? `http://127.0.0.1:${port}/mcp` : null,
  };
}

async function setEnabled(bool) {
  const next = !!bool;
  settings.set('mcp:enabled', next);

  if (next && !server.isRunning()) {
    const port = settings.get('mcp:port') || DEFAULT_PORT;
    try {
      await server.start({ port, tools });
    } catch (err) {
      console.error('[mcp] failed to start server:', err && err.message ? err.message : err);
    }
  } else if (!next && server.isRunning()) {
    try {
      await server.stop();
    } catch (err) {
      console.error('[mcp] failed to stop server:', err && err.message ? err.message : err);
    }
  }

  return getStatus();
}

async function setPort(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('Port must be an integer between 1024 and 65535');
  }

  settings.set('mcp:port', port);

  if (server.isRunning()) {
    await server.stop();
    try {
      await server.start({ port, tools });
    } catch (err) {
      console.error('[mcp] failed to restart server on new port:', err && err.message ? err.message : err);
      throw err;
    }
  }

  return getStatus();
}

async function rotateToken() {
  const token = auth.rotateToken();

  if (server.isRunning()) {
    const port = settings.get('mcp:port') || DEFAULT_PORT;
    try {
      await server.stop();
      await server.start({ port, tools });
    } catch (err) {
      console.error('[mcp] failed to restart server after token rotation:', err && err.message ? err.message : err);
    }
  }

  return { ...getStatus(), token };
}

function forceRelease() {
  activity.release();
}

module.exports = {
  init,
  shutdown,
  getStatus,
  setEnabled,
  setPort,
  rotateToken,
  forceRelease,
};
