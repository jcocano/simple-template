// Thin wrapper around nodemailer. Builds a transport per call (no pooling —
// test sends are infrequent and per-workspace credentials may change) and
// maps low-level error codes to user-facing Spanish copy.
//
// Payload shape (from renderer via IPC):
//   { host, port, secure, auth:{user,pass}, from, to, subject, html, text, replyTo }
//
// Returns: { ok:true, messageId, accepted, rejected }
//       or { ok:false, error, code, detail }

const nodemailer = require('nodemailer');

async function send(payload = {}) {
  const {
    host, port, secure,
    auth,
    from, to, subject,
    html, text,
    replyTo,
  } = payload;

  if (!host || !auth || !auth.user) {
    return { ok: false, error: 'Configuración SMTP incompleta.', code: 'EINVAL' };
  }
  const needsAccessToken = auth.type === 'OAuth2';
  if (needsAccessToken && !auth.accessToken) {
    return { ok: false, error: 'Falta access token OAuth.', code: 'EINVAL' };
  }
  if (!needsAccessToken && !auth.pass) {
    return { ok: false, error: 'Configuración SMTP incompleta.', code: 'EINVAL' };
  }
  if (!to || !from) {
    return { ok: false, error: 'Faltan remitente o destinatarios.', code: 'EINVAL' };
  }

  // Support both password auth (plain + app password) and XOAUTH2 (BYO OAuth
  // providers). XOAUTH2 uses accessToken in place of pass; nodemailer handles
  // the SASL base64 encoding internally.
  const transportAuth = auth.type === 'OAuth2'
    ? { type: 'OAuth2', user: auth.user, accessToken: auth.accessToken }
    : { user: auth.user, pass: auth.pass };

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
      subject: subject || '(sin asunto)',
      html,
      text,
      replyTo: replyTo || from,
    });

    return {
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
    };
  } catch (err) {
    return {
      ok: false,
      error: mapError(err),
      code: err.code || err.errno || 'UNKNOWN',
      detail: err.message,
    };
  }
}

// Map nodemailer/smtp error codes to friendly Spanish copy. Fallback to the
// raw message so we never swallow useful information entirely.
function mapError(err) {
  const code = err.code || err.errno;
  const msg = String(err.message || '');
  switch (code) {
    case 'EAUTH':
      if (/app(lication)?.?specific|app password|less secure/i.test(msg)) {
        return 'Tu cuenta tiene 2FA activado y requiere una contraseña de aplicación. Generá una en los ajustes de seguridad de tu proveedor.';
      }
      return 'El servidor rechazó tus credenciales. Revisá usuario y contraseña.';
    case 'ECONNECTION':
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return 'No se pudo conectar al servidor SMTP. Revisá el host, el puerto y tu firewall.';
    case 'ESOCKET':
      return 'Falló la conexión segura. Probá cambiar entre TLS (puerto 587) y SSL (puerto 465).';
    case 'EDNS':
    case 'ENOTFOUND':
      return 'No se encontró el servidor SMTP. Verificá el nombre del host.';
    case 'EENVELOPE':
      return 'El servidor rechazó algún destinatario. Verificá que los correos sean válidos.';
    case 'EMESSAGE':
      return 'El servidor rechazó el contenido del correo.';
    default:
      return msg || 'Error desconocido al enviar.';
  }
}

module.exports = { send };
