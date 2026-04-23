// FTP / FTPS upload using `basic-ftp`. Pure JS, no native deps.
// SFTP (SSH) is NOT covered here — it needs `ssh2-sftp-client` which has
// native bindings. If users ask for it we can add a separate client later.
//
// Config shape:
//   config.host       — "ftp.example.com"
//   config.port       — 21 (FTP) or 990 (implicit FTPS)
//   config.path       — "/public_html/img/" (remote directory)
//   config.publicUrl  — required. The URL base that maps to `path` on the
//                       web, e.g. "https://example.com/img". Appended with
//                       the uploaded filename to form the final image URL.
//   config.user       — FTP username
//   config.secure     — true for FTPS (implicit/explicit)
//
// Secrets shape:
//   secrets.password  — FTP/FTPS password

const { Client } = require('basic-ftp');
const { PassThrough } = require('stream');

async function uploadFTP({ config, secrets, file, filename }) {
  const host = config?.host;
  const user = config?.user;
  const password = secrets?.password;
  const port = Number(config?.port) || 21;
  const remotePath = normalizePath(config?.path || '/');
  const publicUrl = config?.publicUrl;
  const secure = !!config?.secure;

  if (!host) return { ok: false, error: 'Falta host FTP.', code: 'CONFIG' };
  if (!user || !password) return { ok: false, error: 'Faltan credenciales FTP (usuario/contraseña).', code: 'AUTH' };
  if (!publicUrl) {
    return {
      ok: false,
      error: 'Falta la URL pública base (ej: https://tudominio.com/img). Sin ella no hay cómo saber la URL resultante.',
      code: 'CONFIG',
    };
  }

  const buf = toBuffer(file);
  const client = new Client(20000); // 20s socket timeout
  client.ftp.verbose = false;

  try {
    await client.access({ host, port, user, password, secure });
    await client.ensureDir(remotePath);
    const stream = new PassThrough();
    stream.end(buf);
    await client.uploadFrom(stream, filename);
  } catch (err) {
    client.close();
    return {
      ok: false,
      error: friendlyFtpError(err),
      code: inferFtpCode(err),
    };
  }
  client.close();

  const base = publicUrl.replace(/\/+$/, '');
  const encoded = encodeURIComponent(filename).replace(/%2F/g, '/');
  return { ok: true, url: `${base}/${encoded}` };
}

function normalizePath(p) {
  if (!p) return '/';
  let s = String(p).replace(/\/+/g, '/');
  if (!s.startsWith('/')) s = '/' + s;
  if (!s.endsWith('/')) s += '/';
  return s;
}

function toBuffer(fileLike) {
  if (Buffer.isBuffer(fileLike)) return fileLike;
  if (fileLike instanceof Uint8Array) return Buffer.from(fileLike);
  throw new Error('file debe ser Uint8Array o Buffer.');
}

function friendlyFtpError(err) {
  const msg = String(err?.message || err);
  if (/530|login/i.test(msg)) return 'El servidor rechazó tus credenciales.';
  if (/ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/i.test(msg)) return `No se pudo conectar al servidor FTP (${msg}).`;
  if (/ENOTFOUND/i.test(msg)) return 'No se encontró el host FTP. Revisá el nombre.';
  if (/550/i.test(msg)) return 'El servidor rechazó la ruta (permisos o carpeta inexistente).';
  return msg;
}

function inferFtpCode(err) {
  const msg = String(err?.message || err);
  if (/530|login/i.test(msg)) return 'AUTH';
  if (/ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND/i.test(msg)) return 'NETWORK';
  if (/550/i.test(msg)) return 'CONFIG';
  return 'FTP';
}

module.exports = { uploadFTP };
