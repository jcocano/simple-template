// Test-send helper — single path for sending a template preview to real
// inboxes via SMTP. Centralizes the wiring so DeliveryModal, TestSendModal,
// and ExportModal.SendTab all go through the same code.
//
// Flow:
//   1. Resolve the current workspace's delivery provider + cfg (from secrets).
//   2. Render the template with `{ resolveVars: true }` so recipients see
//      substituted values, not {{literal}}.
//   3. Subject also gets vars resolved, and is prefixed with a localized
//      test badge (e.g. [PRUEBA] / [TEST]) so recipients distinguish it
//      from production sends.
//   4. Invoke window.smtp.send (IPC → electron/smtp/send.js → nodemailer).
//
// Return shape:
//   { ok:true, messageId, accepted, rejected }
//   { ok:false, error:"friendly copy", code?, detail? }
//
// Higher-level helper `sendFromEditor(recipients)` flushes pending autosave
// and pulls the active template before delegating to send().

// Safe t() wrapper — i18n.tsx always loads before this file (see src/main.tsx
// import order), but fall back to the key if window.stI18n isn't ready yet so
// we never leak `undefined` into an error message.
const tr = (key, params) =>
  window.stI18n && typeof window.stI18n.t === 'function' ? window.stI18n.t(key, params) : key;

function resolveSubject(s = '', vars) {
  const map = {};
  for (const v of (vars || [])) if (v && v.key) map[v.key] = v.sample;
  return String(s).replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, k) =>
    map[k] != null ? String(map[k]) : '{{' + k + '}}'
  );
}

function extractDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const at = email.indexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase().trim() : null;
}

// Providers that use SMTP under the hood. `smtp` is fully user-configured;
// gmail/outlook/yahoo/icloud use SMTP with pre-baked host/port + app password;
// gmail-oauth/microsoft-oauth use SMTP with XOAUTH2 access tokens from a BYO
// OAuth app. All share the same nodemailer transport path.
const PASSWORD_PROVIDERS = new Set(['smtp', 'gmail', 'outlook', 'yahoo', 'icloud']);
const OAUTH_PROVIDERS = new Set(['gmail-oauth', 'microsoft-oauth']);

function isSupportedProvider(provider) {
  return PASSWORD_PROVIDERS.has(provider) || OAUTH_PROVIDERS.has(provider);
}

async function loadWorkspaceDeliveryCfg() {
  const provider = window.stStorage.getWSSetting('delivery:provider', null);
  if (!provider) {
    return { error: tr('testSend.error.noProvider') };
  }
  if (!isSupportedProvider(provider)) {
    return { error: tr('testSend.error.providerUnsupported', { provider }) };
  }
  try {
    const raw = await window.stStorage.secrets.get(
      window.stStorage.secrets.wsKey(`delivery:cfg:${provider}`)
    );
    const cfg = raw ? JSON.parse(raw) : null;
    if (!cfg) {
      return { error: tr('testSend.error.cfgEmpty') };
    }

    if (OAUTH_PROVIDERS.has(provider)) {
      if (!cfg.clientId || !cfg.user || !cfg.fromEmail) {
        return { error: tr('testSend.error.oauthIncomplete') };
      }
      if (!cfg.tokens?.accessToken) {
        return { error: tr('testSend.error.oauthNotAuthorized') };
      }
    } else {
      // Password-based (smtp/gmail/outlook/yahoo/icloud)
      if (!cfg.host || !cfg.user || !cfg.pass) {
        return { error: tr('testSend.error.smtpIncomplete') };
      }
    }

    // Pre-flight: detect From/User domain mismatch and refuse to send. The
    // message would be accepted by the SMTP relay but silently dropped by
    // Gmail/Outlook/etc. due to SPF/DMARC misalignment. Better to block here
    // than to waste the user's inbox quota on undelivered tests.
    const userDomain = extractDomain(cfg.user);
    const fromDomain = extractDomain(cfg.fromEmail);
    if (userDomain && fromDomain && userDomain !== fromDomain) {
      return {
        error: tr('testSend.error.fromDomainMismatch', { fromDomain, userDomain }),
      };
    }
    return { provider, cfg };
  } catch (err) {
    return { error: tr('testSend.error.cfgReadFailed') };
  }
}

async function send({ template, recipients, fromOverride } = {}) {
  if (!template) return { ok: false, error: tr('testSend.error.noTemplate') };
  const list = Array.isArray(recipients) ? recipients.filter(Boolean) : [];
  if (list.length === 0) return { ok: false, error: tr('testSend.error.noRecipients') };

  if (!window.smtp || typeof window.smtp.send !== 'function') {
    return { ok: false, error: tr('testSend.error.bridgeUnavailable') };
  }
  if (!window.stExport) {
    return { ok: false, error: tr('testSend.error.exportUnavailable') };
  }

  const loaded = await loadWorkspaceDeliveryCfg();
  if (loaded.error) return { ok: false, error: loaded.error };
  const { provider, cfg } = loaded;

  // Move `st-img://` URLs into CID attachments instead of inlining base64.
  // Inline data URLs inflate the HTML past Gmail's ~102 KB clipping threshold;
  // CID attachments travel as separate MIME parts and are delivered intact.
  let html = window.stExport.renderHTML(template, { resolveVars: true });
  const extracted = await window.stExport.extractImagesAsAttachments(html);
  html = extracted.html;
  const attachments = extracted.attachments;
  const text = window.stExport.renderTXT(template, { resolveVars: true });

  const fromEmail = String(fromOverride?.email || cfg.fromEmail || cfg.user || '').trim();
  const fromName  = String(fromOverride?.name || cfg.fromName || '').trim();
  const from = fromName ? `"${fromName.replace(/"/g, '')}" <${fromEmail}>` : fromEmail;

  let subject = template.meta?.subject || template.name || tr('testSend.subject.untitled');
  subject = resolveSubject(subject, template.vars);
  const badge = tr('modals.test.tag.badge');
  subject = `${badge} ${subject}`;

  // Resolve the nodemailer auth object based on provider kind. Password-based
  // providers use {user, pass}; OAuth providers refresh the access token if
  // needed, persist rotated tokens back to secrets, and use XOAUTH2.
  let authPayload;
  let host, port, secure;

  if (OAUTH_PROVIDERS.has(provider)) {
    const smtpCfg = window.stOAuth?.getSmtpConfig(provider);
    if (!smtpCfg) {
      return { ok: false, error: tr('testSend.error.oauthSmtpMissing') };
    }
    host = smtpCfg.host;
    secure = smtpCfg.security === 'ssl';
    port = smtpCfg.port || (secure ? 465 : 587);

    const refreshResult = await window.stOAuth.refreshIfNeeded(provider, cfg.tokens, cfg);
    if (!refreshResult.ok) {
      return { ok: false, error: refreshResult.error || tr('testSend.error.tokenRefreshFailed') };
    }
    // Persist rotated tokens so next send doesn't re-refresh unnecessarily.
    if (refreshResult.accessToken !== cfg.tokens.accessToken
      || refreshResult.refreshToken !== cfg.tokens.refreshToken
      || refreshResult.expiresAt !== cfg.tokens.expiresAt) {
      try {
        const updated = {
          ...cfg,
          tokens: {
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken,
            expiresAt: refreshResult.expiresAt,
          },
        };
        await window.stStorage.secrets.set(
          window.stStorage.secrets.wsKey(`delivery:cfg:${provider}`),
          JSON.stringify(updated),
        );
      } catch (err) {
        // Non-fatal — send still works with the fresh token in memory.
        console.warn('[stTestSend] failed to persist rotated tokens', err);
      }
    }
    authPayload = {
      type: 'OAuth2',
      user: cfg.user,
      accessToken: refreshResult.accessToken,
    };
  } else {
    secure = cfg.security === 'ssl';
    port = Number(cfg.port) || (secure ? 465 : 587);
    host = cfg.host;
    authPayload = { user: cfg.user, pass: cfg.pass };
  }

  const payload = {
    host,
    port,
    secure,
    auth: authPayload,
    from,
    to: list.join(', '),
    subject,
    html,
    text,
    replyTo: fromEmail,
    attachments,
  };

  try {
    return await window.smtp.send(payload);
  } catch (err) {
    return { ok: false, error: err?.message || tr('testSend.error.smtpIpc'), code: 'IPC' };
  }
}

// Convenience for UIs that need to operate on whatever template the editor
// currently has open. Flushes pending autosave so the sent email reflects the
// user's latest edits, then reads from disk.
async function sendFromEditor(recipients, fromOverride) {
  const ed = window.__stEditor;
  if (!ed || typeof ed.getTemplateId !== 'function') {
    return { ok: false, error: tr('testSend.error.openTemplate') };
  }
  const id = ed.getTemplateId();
  if (!id) return { ok: false, error: tr('testSend.error.noActiveTemplate') };
  if (typeof ed.flush === 'function') {
    try { await ed.flush(); } catch {}
  }
  const template = await window.stTemplates.read(id);
  if (!template) return { ok: false, error: tr('testSend.error.templateReadFailed') };
  return await send({ template, recipients, fromOverride });
}

// Lightweight pre-flight: runs every validation that `send()` would run EXCEPT
// actually talking to SMTP. Intended for UIs that want to warn the user about
// broken delivery config before they click "Send" — avoiding silent failures
// when the cfg would cause the server to accept + Gmail to drop.
async function checkConfig() {
  const result = await loadWorkspaceDeliveryCfg();
  if (result.error) return { ok: false, error: result.error };
  return { ok: true, provider: result.provider };
}

const stTestSend = { send, sendFromEditor, loadWorkspaceDeliveryCfg, checkConfig };
Object.assign(window, { stTestSend });
