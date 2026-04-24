// Share-link crypto: PIN-derived AES-256-GCM over the bundle bytes. No deps —
// WebCrypto is native in Electron's renderer. The PIN is the second factor:
// even if the link leaks, without the PIN the uploaded blob is opaque.
//
// PIN alphabet: Crockford Base32 (digits + A-Z, minus I/L/O/U to avoid
// visual confusion). 6 chars → 32^6 ≈ 1B combinations (~30 bits). Paired
// with PBKDF2-SHA256 at 600k iterations (OWASP 2023 guidance) this puts a
// casual brute-force at years of compute time per leaked link.
//
// Packed blob layout (all bytes):
//   [0]        version = 1
//   [1..17)    salt (16 bytes)
//   [17..29)   IV (12 bytes)
//   [29..]     ciphertext + GCM tag
//
// Wrong PIN → AES-GCM tag verification fails → decrypt throws, we re-throw
// as WRONG_PIN so the UI can render a specific message.

const PBKDF2_ITER = 600000;
const SALT_LEN = 16;
const IV_LEN = 12;
const VERSION = 1;

const PIN_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford Base32
const PIN_LEN = 6;

function generatePin() {
  const rand = new Uint8Array(PIN_LEN);
  crypto.getRandomValues(rand);
  let out = '';
  for (let i = 0; i < PIN_LEN; i++) {
    out += PIN_ALPHABET[rand[i] % PIN_ALPHABET.length];
  }
  return out;
}

// Display a 6-char PIN as "XXX-XXX" for readability.
function formatPin(pin) {
  if (typeof pin !== 'string' || pin.length !== PIN_LEN) return pin;
  return `${pin.slice(0, 3)}-${pin.slice(3)}`;
}

// Accept any user input (case-insensitive, hyphens/spaces OK). Normalize
// ambiguous glyphs per Crockford: O → 0, I/L → 1, U → V. Returns a 6-char
// uppercase string or null if invalid.
function normalizePin(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/[-\s]/g, '')
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
  if (cleaned.length !== PIN_LEN) return null;
  for (let i = 0; i < cleaned.length; i++) {
    if (!PIN_ALPHABET.includes(cleaned[i])) return null;
  }
  return cleaned;
}

async function deriveKey(pin, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptBytes(plaintext, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(pin, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  );
  const out = new Uint8Array(1 + SALT_LEN + IV_LEN + ct.length);
  out[0] = VERSION;
  out.set(salt, 1);
  out.set(iv, 1 + SALT_LEN);
  out.set(ct, 1 + SALT_LEN + IV_LEN);
  return out;
}

async function decryptBytes(packed, pin) {
  if (!(packed instanceof Uint8Array) || packed.length < 1 + SALT_LEN + IV_LEN + 16) {
    throw new Error('INVALID_BUNDLE');
  }
  if (packed[0] !== VERSION) throw new Error('UNSUPPORTED_VERSION');
  const salt = packed.slice(1, 1 + SALT_LEN);
  const iv = packed.slice(1 + SALT_LEN, 1 + SALT_LEN + IV_LEN);
  const ct = packed.slice(1 + SALT_LEN + IV_LEN);
  const key = await deriveKey(pin, salt);
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new Uint8Array(pt);
  } catch {
    throw new Error('WRONG_PIN');
  }
}

Object.assign(window, {
  stSharingCrypto: { generatePin, formatPin, normalizePin, encryptBytes, decryptBytes, PIN_LEN },
});
