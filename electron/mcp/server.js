const http = require('http');
const { URL } = require('url');
const auth = require('./auth');

let httpServer = null;
let transport = null;
let mcpServer = null;
let currentPort = null;

const PORT_RETRY_COUNT = 10;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw || raw.length === 0) return resolve(null);
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  if (res.headersSent) return;
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendStatus(res, statusCode, text) {
  if (res.headersSent) return;
  const body = text || '';
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function listenOnPort(server, port, host) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

async function tryListen(server, requestedPort) {
  let lastErr = null;
  for (let i = 0; i <= PORT_RETRY_COUNT; i++) {
    const port = requestedPort + i;
    try {
      await listenOnPort(server, port, '127.0.0.1');
      return port;
    } catch (err) {
      lastErr = err;
      if (err && err.code === 'EADDRINUSE') continue;
      throw err;
    }
  }
  throw new Error('No available port in range');
}

async function start({ port: requestedPort, tools }) {
  if (httpServer) {
    return { port: currentPort };
  }

  const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
  const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
  const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');

  mcpServer = new Server(
    { name: 'simple-template', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.toolDefs,
  }));

  mcpServer.setRequestHandler(CallToolRequestSchema, async (req) => {
    return tools.callTool(req.params.name, req.params.arguments || {});
  });

  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await mcpServer.connect(transport);

  httpServer = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, 'http://127.0.0.1');
      const pathname = parsedUrl.pathname;

      if (req.method === 'GET' && pathname === '/health') {
        return sendJson(res, 200, { ok: true, name: 'simple-template' });
      }

      if (!auth.validateBearer(req.headers.authorization)) {
        return sendStatus(res, 401, 'Unauthorized');
      }

      if (pathname === '/mcp' && (req.method === 'POST' || req.method === 'GET' || req.method === 'DELETE')) {
        let body = null;
        if (req.method === 'POST') {
          try {
            body = await readJsonBody(req);
          } catch (err) {
            console.error('[mcp/server]', err);
            return sendJson(res, 400, { error: 'Invalid JSON body' });
          }
        }
        await transport.handleRequest(req, res, body);
        return;
      }

      return sendStatus(res, 404, 'Not Found');
    } catch (err) {
      console.error('[mcp/server]', err);
      if (!res.headersSent) {
        sendStatus(res, 500, 'Internal Server Error');
      }
    }
  });

  const boundPort = await tryListen(httpServer, requestedPort);
  currentPort = boundPort;
  return { port: boundPort };
}

async function stop() {
  const tasks = [];

  if (transport) {
    try {
      const r = transport.close();
      if (r && typeof r.then === 'function') tasks.push(r);
    } catch (err) {
      console.error('[mcp/server]', err);
    }
  }

  if (mcpServer) {
    try {
      const r = mcpServer.close();
      if (r && typeof r.then === 'function') tasks.push(r);
    } catch (err) {
      console.error('[mcp/server]', err);
    }
  }

  if (httpServer) {
    const srv = httpServer;
    tasks.push(new Promise((resolve) => {
      srv.close(() => resolve());
    }));
  }

  try {
    await Promise.all(tasks);
  } catch (err) {
    console.error('[mcp/server]', err);
  }

  httpServer = null;
  transport = null;
  mcpServer = null;
  currentPort = null;
}

function isRunning() {
  return !!httpServer && httpServer.listening;
}

function getPort() {
  return currentPort;
}

module.exports = { start, stop, isRunning, getPort };
