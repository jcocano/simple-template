// OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636) for desktop apps.
// The user registers their own OAuth app in Azure/Google and brings the
// client_id (+ client_secret for Google, + tenant_id for Microsoft). We:
//   1. Open a local HTTP server on a random loopback port.
//   2. Open the provider's auth URL in the system browser.
//   3. Receive the ?code=… callback at http://127.0.0.1:<port>.
//   4. Exchange the code (plus the PKCE code_verifier) for tokens at the
//      provider's token endpoint using global fetch (Node 20 / Electron 37).
//   5. Return { accessToken, refreshToken, expiresAt } to the caller.
//
// Refresh uses the same token endpoint with grant_type=refresh_token.
//
// Security:
//   - code_verifier is 32 random bytes (base64url) → SHA256 → challenge.
//   - state param guards CSRF; we reject a mismatched state on callback.
//   - The loopback server only stays up until the callback arrives or the
//     5-minute timeout hits.
//   - We never log tokens or secrets.

const crypto = require('crypto');
const http = require('http');
const { URL } = require('url');
const { shell } = require('electron');

function base64url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateVerifier() {
  return base64url(crypto.randomBytes(32));
}

function challengeFromVerifier(verifier) {
  return base64url(crypto.createHash('sha256').update(verifier).digest());
}

function generateState() {
  return base64url(crypto.randomBytes(16));
}

function startLoopbackServer({ timeoutMs = 5 * 60 * 1000 } = {}) {
  return new Promise((resolveStart, rejectStart) => {
    let settled = false;
    let resolveWait;
    let rejectWait;
    const waitPromise = new Promise((r, j) => {
      resolveWait = r;
      rejectWait = j;
    });

    const server = http.createServer();

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { server.close(); } catch {}
        rejectWait(new Error('Timeout esperando autorización (5 min).'));
      }
    }, timeoutMs);

    server.on('request', (req, res) => {
      let parsed;
      try {
        parsed = new URL(req.url, 'http://127.0.0.1');
      } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
        return;
      }

      const code = parsed.searchParams.get('code');
      const state = parsed.searchParams.get('state');
      const error = parsed.searchParams.get('error');
      const errorDescription = parsed.searchParams.get('error_description');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (error) {
        res.end(`<!doctype html><html><body style="font-family:system-ui;padding:48px;max-width:560px;margin:0 auto;text-align:center;color:#1a1a17">
          <h1 style="color:#d97757;margin:0 0 12px">Autorización rechazada</h1>
          <p style="margin:0 0 8px"><b>${escapeHtml(error)}</b></p>
          <p style="color:#666;margin:0">${escapeHtml(errorDescription || '')}</p>
          <p style="color:#999;margin-top:32px;font-size:12px">Podés cerrar esta ventana y volver a Simple Template.</p>
        </body></html>`);
      } else {
        res.end(`<!doctype html><html><body style="font-family:system-ui;padding:48px;max-width:560px;margin:0 auto;text-align:center;color:#1a1a17">
          <h1 style="color:#22a06b;margin:0 0 12px">✓ Autorización exitosa</h1>
          <p>Volvé a Simple Template para continuar con la configuración.</p>
          <p style="color:#999;margin-top:32px;font-size:12px">Ya podés cerrar esta ventana.</p>
        </body></html>`);
      }

      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Defer close so the response can flush.
      setImmediate(() => { try { server.close(); } catch {} });

      if (error) {
        rejectWait(new Error(errorDescription || error || 'Autorización rechazada'));
      } else if (code && state) {
        resolveWait({ code, state });
      } else {
        rejectWait(new Error('Callback sin code/state.'));
      }
    });

    server.once('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        rejectWait(err);
      }
      rejectStart(err);
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolveStart({
        port,
        redirectUri: `http://127.0.0.1:${port}`,
        wait: () => waitPromise,
        close: () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
          }
          try { server.close(); } catch {}
        },
      });
    });
  });
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function authorize(providerConfig = {}) {
  const {
    authUrl, tokenUrl, scopes,
    clientId, clientSecret,
    accessType, prompt,
    extraAuthParams,
  } = providerConfig;

  if (!authUrl || !tokenUrl || !clientId || !Array.isArray(scopes) || !scopes.length) {
    return { ok: false, error: 'Config incompleto (authUrl/tokenUrl/clientId/scopes).' };
  }

  const verifier = generateVerifier();
  const challenge = challengeFromVerifier(verifier);
  const state = generateState();

  let server;
  try {
    server = await startLoopbackServer();
  } catch (err) {
    return { ok: false, error: `No se pudo abrir el servidor local: ${err.message}` };
  }
  const { redirectUri, wait, close } = server;

  try {
    const url = new URL(authUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    if (accessType) url.searchParams.set('access_type', accessType);
    if (prompt) url.searchParams.set('prompt', prompt);
    if (extraAuthParams && typeof extraAuthParams === 'object') {
      for (const [k, v] of Object.entries(extraAuthParams)) url.searchParams.set(k, v);
    }

    await shell.openExternal(url.toString());

    const { code, state: receivedState } = await wait();
    if (receivedState !== state) {
      return { ok: false, error: 'El state no coincide (posible CSRF). Volvé a intentar.' };
    }

    const tokenResp = await exchangeCode({
      tokenUrl, clientId, clientSecret, code, redirectUri, verifier,
    });
    return tokenResp;
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  } finally {
    close();
  }
}

async function exchangeCode({ tokenUrl, clientId, clientSecret, code, redirectUri, verifier }) {
  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('client_id', clientId);
  if (clientSecret) params.set('client_secret', clientSecret);
  params.set('code', code);
  params.set('redirect_uri', redirectUri);
  params.set('code_verifier', verifier);

  try {
    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });
    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!resp.ok) {
      return { ok: false, error: json.error_description || json.error || `Token exchange falló (${resp.status}).` };
    }
    if (!json.access_token) {
      return { ok: false, error: 'El provider no devolvió access_token.' };
    }
    return {
      ok: true,
      accessToken: json.access_token,
      refreshToken: json.refresh_token || null,
      expiresAt: Date.now() + ((Number(json.expires_in) || 3600) * 1000),
      tokenType: json.token_type || 'Bearer',
      scope: json.scope || '',
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'Error de red en token exchange.' };
  }
}

async function refresh(providerConfig = {}, refreshToken) {
  const { tokenUrl, clientId, clientSecret } = providerConfig;
  if (!tokenUrl || !clientId) {
    return { ok: false, error: 'Config incompleto para refresh.' };
  }
  if (!refreshToken) {
    return { ok: false, error: 'Falta refresh_token.' };
  }

  const params = new URLSearchParams();
  params.set('grant_type', 'refresh_token');
  params.set('client_id', clientId);
  if (clientSecret) params.set('client_secret', clientSecret);
  params.set('refresh_token', refreshToken);

  try {
    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });
    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!resp.ok) {
      return { ok: false, error: json.error_description || json.error || `Refresh falló (${resp.status}).` };
    }
    if (!json.access_token) {
      return { ok: false, error: 'El provider no devolvió access_token al refrescar.' };
    }
    return {
      ok: true,
      accessToken: json.access_token,
      // Some providers rotate refresh_token, others don't — preserve old if not returned.
      refreshToken: json.refresh_token || refreshToken,
      expiresAt: Date.now() + ((Number(json.expires_in) || 3600) * 1000),
      tokenType: json.token_type || 'Bearer',
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'Error de red refrescando token.' };
  }
}

module.exports = { authorize, refresh };
