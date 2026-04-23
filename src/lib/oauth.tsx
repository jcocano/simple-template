// OAuth2 provider registry + renderer orchestration for the BYO (Bring Your
// Own) OAuth flow. The user registers their own client in Azure / Google
// and types client_id (+ client_secret / tenant_id) into the DeliveryModal.
// Tokens + credentials live in workspace secrets alongside the rest of the
// SMTP cfg.
//
// Flow:
//   1. User clicks "Autorizar" → stOAuth.authorize(providerId, cfg)
//      → window.oauth.authorize(resolvedProviderCfg)
//      → main process opens browser + local server → returns tokens.
//   2. Caller persists cfg.tokens = { accessToken, refreshToken, expiresAt }
//      in secrets.
//   3. Before any send: stOAuth.refreshIfNeeded(providerId, tokens, cfg)
//      returns a valid accessToken (refreshing if within 60s of expiry).

const OAUTH_PROVIDER_CFG = {
  'gmail-oauth': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://mail.google.com/'],
    // Google requires access_type=offline to receive a refresh_token at all,
    // and prompt=consent so the consent screen shows every time (refresh
    // tokens are otherwise skipped on second authorizations).
    accessType: 'offline',
    prompt: 'consent',
    requiresClientSecret: true,
    requiresTenant: false,
    smtp: { host: 'smtp.gmail.com', port: 587, security: 'tls' },
  },
  'microsoft-oauth': {
    // Tenant is injected at runtime: 'common' for multi-tenant, or a specific
    // tenant ID for single-tenant apps. User's choice when registering.
    authUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    // SMTP.Send is the minimum scope for SMTP AUTH; offline_access gets a
    // refresh_token.
    scopes: ['https://outlook.office.com/SMTP.Send', 'offline_access'],
    requiresClientSecret: false,
    requiresTenant: true,
    smtp: { host: 'smtp.office365.com', port: 587, security: 'tls' },
  },
};

function isOAuthProvider(providerId) {
  return Object.prototype.hasOwnProperty.call(OAUTH_PROVIDER_CFG, providerId);
}

function buildProviderCfg(providerId, userCfg = {}) {
  const base = OAUTH_PROVIDER_CFG[providerId];
  if (!base) return null;
  const tenant = userCfg.tenantId || 'common';
  return {
    authUrl: base.authUrl.replace('{tenant}', tenant),
    tokenUrl: base.tokenUrl.replace('{tenant}', tenant),
    scopes: base.scopes,
    clientId: userCfg.clientId,
    clientSecret: userCfg.clientSecret,
    accessType: base.accessType,
    prompt: base.prompt,
  };
}

async function authorize(providerId, userCfg) {
  const base = OAUTH_PROVIDER_CFG[providerId];
  if (!base) return { ok: false, error: `Provider "${providerId}" no soportado.` };
  if (!userCfg?.clientId) return { ok: false, error: 'Falta client_id.' };
  if (base.requiresClientSecret && !userCfg.clientSecret) {
    return { ok: false, error: 'Falta client_secret.' };
  }
  if (base.requiresTenant && !userCfg.tenantId) {
    return { ok: false, error: 'Falta tenant_id (usá "common" para multi-tenant).' };
  }
  if (!window.oauth || typeof window.oauth.authorize !== 'function') {
    return { ok: false, error: 'Puente OAuth no disponible (abrí la app en Electron).' };
  }
  const providerCfg = buildProviderCfg(providerId, userCfg);
  return await window.oauth.authorize(providerCfg);
}

async function refreshIfNeeded(providerId, tokens, userCfg) {
  if (!tokens?.accessToken) {
    return { ok: false, error: 'No hay access token. Re-autorizá el proveedor.' };
  }
  const now = Date.now();
  const skewMs = 60 * 1000; // refresh 60s before expiry
  if (tokens.expiresAt && tokens.expiresAt - skewMs > now) {
    return { ok: true, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt };
  }
  if (!tokens.refreshToken) {
    return { ok: false, error: 'Access token expirado y sin refresh token. Re-autorizá el proveedor.' };
  }
  if (!window.oauth || typeof window.oauth.refresh !== 'function') {
    return { ok: false, error: 'Puente OAuth no disponible.' };
  }
  const providerCfg = buildProviderCfg(providerId, userCfg);
  return await window.oauth.refresh(providerCfg, tokens.refreshToken);
}

function getSmtpConfig(providerId) {
  return OAUTH_PROVIDER_CFG[providerId]?.smtp || null;
}

const stOAuth = {
  authorize,
  refreshIfNeeded,
  getSmtpConfig,
  isOAuthProvider,
  OAUTH_PROVIDER_CFG,
};

Object.assign(window, { stOAuth });
