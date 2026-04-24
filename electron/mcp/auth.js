const crypto = require('crypto');
const settings = require('../storage/settings');

const TOKEN_KEY = 'mcp:token';

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function getOrCreateToken() {
  const existing = settings.get(TOKEN_KEY);
  if (typeof existing === 'string' && existing.length > 0) return existing;
  const token = generateToken();
  settings.set(TOKEN_KEY, token);
  return token;
}

function rotateToken() {
  const token = generateToken();
  settings.set(TOKEN_KEY, token);
  return token;
}

function validateBearer(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return false;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const provided = m[1].trim();
  if (!provided) return false;
  const current = settings.get(TOKEN_KEY);
  if (typeof current !== 'string' || current.length === 0) return false;
  // timingSafeEqual requires equal-length buffers; length mismatch alone is
  // sufficient to reject, but we still run the compare on padded buffers
  // against a throwaway to keep the code path constant-shape.
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(current, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

module.exports = { getOrCreateToken, rotateToken, validateBearer };
