// Thin wrapper around nodemailer. Builds a transport per call (no pooling —
// test sends are infrequent and per-workspace credentials may change) and
// maps low-level error codes to structured, localizable error responses
// ({ errorKey, errorParams, error: <English fallback> }) so the renderer can
// localize them via its i18n dictionaries.
//
// Payload shape (from renderer via IPC):
//   { host, port, secure, auth:{user,pass}, from, to, subject, html, text, replyTo,
//     attachments?:[{filename, contentBase64, contentType, cid}] }
//
// Returns: { ok:true, messageId, accepted, rejected }
//       or { ok:false, errorKey, errorParams, error, code, detail }

const nodemailer = require('nodemailer');

async function send(payload = {}) {
  const {
    host, port, secure,
    auth,
    from, to, subject,
    html, text,
    replyTo,
    attachments,
  } = payload;

  if (!host || !auth || !auth.user) {
    return {
      ok: false,
      errorKey: 'smtp.err.configIncomplete',
      errorParams: {},
      error: 'Incomplete SMTP configuration.',
      code: 'EINVAL',
    };
  }
  const needsAccessToken = auth.type === 'OAuth2';
  if (needsAccessToken && !auth.accessToken) {
    return {
      ok: false,
      errorKey: 'smtp.err.missingAccessToken',
      errorParams: {},
      error: 'Missing OAuth access token.',
      code: 'EINVAL',
    };
  }
  if (!needsAccessToken && !auth.pass) {
    return {
      ok: false,
      errorKey: 'smtp.err.configIncomplete',
      errorParams: {},
      error: 'Incomplete SMTP configuration.',
      code: 'EINVAL',
    };
  }
  if (!to || !from) {
    return {
      ok: false,
      errorKey: 'smtp.err.missingFromOrTo',
      errorParams: {},
      error: 'Missing sender or recipients.',
      code: 'EINVAL',
    };
  }

  // Support both password auth (plain + app password) and XOAUTH2 (BYO OAuth
  // providers). XOAUTH2 uses accessToken in place of pass; nodemailer handles
  // the SASL base64 encoding internally.
  const transportAuth = auth.type === 'OAuth2'
    ? { type: 'OAuth2', user: auth.user, accessToken: auth.accessToken }
    : { user: auth.user, pass: auth.pass };

  const mailAttachments = Array.isArray(attachments)
    ? attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.contentBase64 || '', 'base64'),
        contentType: a.contentType,
        cid: a.cid,
      }))
    : undefined;

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(port) || (secure ? 465 : 587),
      secure: !!secure,
      auth: transportAuth,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    const info = await transport.sendMail({
      from,
      to,
      subject: subject || '(no subject)',
      html,
      text,
      replyTo: replyTo || from,
      attachments: mailAttachments,
    });

    return {
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
    };
  } catch (err) {
    const mapped = mapError(err);
    return {
      ok: false,
      errorKey: mapped.errorKey,
      errorParams: mapped.errorParams,
      error: mapped.error,
      code: err.code || err.errno || 'UNKNOWN',
      detail: err.message,
    };
  }
}

// Map nodemailer/smtp error codes to structured, localizable errors. Fallback
// to the raw message so we never swallow useful information entirely.
function mapError(err) {
  const code = err.code || err.errno;
  const msg = String(err.message || '');
  switch (code) {
    case 'EAUTH':
      if (/app(lication)?.?specific|app password|less secure/i.test(msg)) {
        return {
          errorKey: 'smtp.err.authAppPasswordRequired',
          errorParams: {},
          error: 'Your account has 2FA enabled and requires an app password. Generate one in your provider\'s security settings.',
        };
      }
      return {
        errorKey: 'smtp.err.authRejected',
        errorParams: {},
        error: 'The server rejected your credentials. Check username and password.',
      };
    case 'ECONNECTION':
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return {
        errorKey: 'smtp.err.connectionFailed',
        errorParams: {},
        error: 'Could not connect to the SMTP server. Check the host, port, and your firewall.',
      };
    case 'ESOCKET':
      return {
        errorKey: 'smtp.err.secureSocketFailed',
        errorParams: {},
        error: 'Secure connection failed. Try switching between TLS (port 587) and SSL (port 465).',
      };
    case 'EDNS':
    case 'ENOTFOUND':
      return {
        errorKey: 'smtp.err.hostNotFound',
        errorParams: {},
        error: 'SMTP server not found. Verify the host name.',
      };
    case 'EENVELOPE':
      return {
        errorKey: 'smtp.err.recipientRejected',
        errorParams: {},
        error: 'The server rejected one of the recipients. Make sure the addresses are valid.',
      };
    case 'EMESSAGE':
      return {
        errorKey: 'smtp.err.messageRejected',
        errorParams: {},
        error: 'The server rejected the message content.',
      };
    default:
      return {
        errorKey: 'smtp.err.unknown',
        errorParams: { message: msg },
        error: msg || 'Unknown error while sending.',
      };
  }
}

module.exports = { send };
