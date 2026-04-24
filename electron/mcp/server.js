const http = require('http');
const { URL } = require('url');
const auth = require('./auth');

let httpServer = null;
let currentPort = null;
let sdkModules = null;
let toolsRef = null;

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

// Stateless Streamable HTTP: per the MCP SDK contract, each request gets its
// own Server+Transport pair, connected, served, then closed. Reusing a single
// transport across requests works for the first handshake but the transport
// retains protocol state that breaks subsequent tools/call requests.
async function handleMcpRequest(req, res, body) {
  const { Server, StreamableHTTPServerTransport, ListToolsRequestSchema, CallToolRequestSchema } = sdkModules;
  const server = new Server(
    { name: 'simple-template', version: '0.0.1' },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolsRef.toolDefs }));
  server.setRequestHandler(CallToolRequestSchema, async (r) => toolsRef.callTool(r.params.name, r.params.arguments || {}));

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    Promise.resolve(transport.close()).catch(() => {});
    Promise.resolve(server.close()).catch(() => {});
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

async function start({ port: requestedPort, tools }) {
  if (httpServer) {
    return { port: currentPort };
  }

  const [sdkIndex, sdkHttp, sdkTypes] = await Promise.all([
    import('@modelcontextprotocol/sdk/server/index.js'),
    import('@modelcontextprotocol/sdk/server/streamableHttp.js'),
    import('@modelcontextprotocol/sdk/types.js'),
  ]);
  sdkModules = {
    Server: sdkIndex.Server,
    StreamableHTTPServerTransport: sdkHttp.StreamableHTTPServerTransport,
    ListToolsRequestSchema: sdkTypes.ListToolsRequestSchema,
    CallToolRequestSchema: sdkTypes.CallToolRequestSchema,
  };
  toolsRef = tools;

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
        await handleMcpRequest(req, res, body);
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
  if (httpServer) {
    const srv = httpServer;
    await new Promise((resolve) => srv.close(() => resolve()));
  }
  httpServer = null;
  currentPort = null;
  sdkModules = null;
  toolsRef = null;
}

function isRunning() {
  return !!httpServer && httpServer.listening;
}

function getPort() {
  return currentPort;
}

module.exports = { start, stop, isRunning, getPort };
