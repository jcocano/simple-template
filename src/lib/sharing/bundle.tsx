// Bundle codec v1 for template sharing.
//
// Format:
//   {
//     v: 1,
//     tpl: { name, variant, color, folder, status, starred, doc, vars, meta },
//     images: { "<st-img:// url>": "data:...;base64,..." },
//     sharedBy: { name, email, avatar? },
//     sharedAt: "<ISO timestamp>"
//   }
//
// Only `st-img://` URLs are inlined into `images`. http(s) URLs are passed
// through — the receiver loads them over the network. IDs, timestamps and
// workspace-local fields (occasionId) are stripped: the receiver assigns a
// new id and lands the template in the "Compartidas" folder.
//
// Image references inside blocks/sections are discovered with a generic
// recursive string walk: we do not hard-code the per-block schema (src,
// imageUrl, avatar, thumbnail, bgImage, item.image, etc. — plus anything a
// future block introduces), so adding new image-bearing fields does not
// require touching this file.

// Transportable fields of a template — everything the receiver should keep.
// Intentionally omits: id, created_at, updated_at, deleted_at, occasionId.
const TPL_TRANSPORT_FIELDS = [
  'name',
  'variant',
  'color',
  'folder',
  'status',
  'starred',
  'doc',
  'vars',
  'meta',
  'schemaVersion',
];

function pickTplTransport(tpl) {
  const out = {};
  for (const k of TPL_TRANSPORT_FIELDS) {
    if (tpl[k] !== undefined) out[k] = tpl[k];
  }
  return out;
}

// Recursively walk any value and collect every string that starts with the
// given prefix. Dedupes via a Set. Safe against cycles (tracks visited
// objects) — defensive; section docs shouldn't have cycles, but JSON.parse
// output could in theory be reused if callers merge things oddly.
function collectStringsWithPrefix(root, prefix) {
  const found = new Set();
  const seen = new WeakSet();
  const walk = (v) => {
    if (v == null) return;
    const t = typeof v;
    if (t === 'string') {
      if (v.startsWith(prefix)) found.add(v);
      return;
    }
    if (t !== 'object') return;
    if (seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    for (const key of Object.keys(v)) walk(v[key]);
  };
  walk(root);
  return Array.from(found);
}

// Deep-clone every plain object/array and rewrite any string value that
// exactly matches a key in `map` to its mapped replacement. Returns a new
// structure; does not mutate `root`. Non-JSON values (functions, DOM nodes)
// are preserved by reference but sections/blocks never contain those.
function deepRemapStrings(root, map) {
  if (root == null) return root;
  const t = typeof root;
  if (t === 'string') {
    return Object.prototype.hasOwnProperty.call(map, root) ? map[root] : root;
  }
  if (t !== 'object') return root;
  if (Array.isArray(root)) return root.map((item) => deepRemapStrings(item, map));
  const out = {};
  for (const key of Object.keys(root)) {
    out[key] = deepRemapStrings(root[key], map);
  }
  return out;
}

// Resolve an st-img:// URL to a data URL by fetching it through the custom
// protocol handler. The handler serves raw bytes with the right MIME header,
// so a standard fetch + FileReader flow works in the renderer. Returns null
// on any failure so a broken image doesn't block the whole share.
async function resolveStImgToDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Parse a data URL into { mime, base64, bytes } — everything the unpacker
// needs to persist the image. Returns null on malformed input.
function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = /^data:([^;,]+)(;base64)?,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const mime = m[1] || 'application/octet-stream';
  const isBase64 = !!m[2];
  const payload = m[3];
  try {
    if (isBase64) {
      const bin = atob(payload);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { mime, base64: payload, bytes };
    }
    // URL-encoded text payload — rare for images but supported by the spec.
    const text = decodeURIComponent(payload);
    const bytes = new TextEncoder().encode(text);
    let base64 = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      base64 += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return { mime, base64: btoa(base64), bytes };
  } catch {
    return null;
  }
}

function extFromMime(mime) {
  if (!mime || typeof mime !== 'string') return 'png';
  const sub = mime.split('/')[1] || 'png';
  return sub === 'jpeg' ? 'jpg' : sub.toLowerCase();
}

async function packSharing(tpl, sharedBy) {
  if (!tpl) throw new Error('TEMPLATE_REQUIRED');
  const transport = pickTplTransport(tpl);
  const stImgUrls = collectStringsWithPrefix(transport.doc, 'st-img://');

  const images = {};
  await Promise.all(stImgUrls.map(async (url) => {
    const dataUrl = await resolveStImgToDataUrl(url);
    images[url] = dataUrl || null;
  }));

  return {
    v: 1,
    tpl: transport,
    images,
    sharedBy: sharedBy || null,
    sharedAt: new Date().toISOString(),
  };
}

async function unpackSharing(bundle) {
  if (!bundle || bundle.v !== 1 || !bundle.tpl || typeof bundle.tpl !== 'object') {
    throw new Error('INVALID_BUNDLE');
  }

  // Persist each bundled image to the current workspace as a new base64
  // entry and build the old→new URL map. We don't try to rehydrate to local
  // disk here; base64 provider keeps the image inline so it renders even
  // before the user configures storage, and existing blocks already accept
  // data: URLs as <img src>.
  const urlMap = {};
  const entries = Object.entries(bundle.images || {});
  for (let i = 0; i < entries.length; i++) {
    const [oldUrl, dataUrl] = entries[i];
    if (!dataUrl) continue; // original image unreadable at pack time — skip
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) continue;
    const ext = extFromMime(parsed.mime);
    const sizeBytes = parsed.bytes ? parsed.bytes.length : null;
    const name = `shared-${Date.now()}-${i}.${ext}`;
    const saved = await window.stImages.save({
      url: dataUrl,
      name,
      folder: 'Compartidas',
      mime: parsed.mime,
      sizeBytes,
      provider: 'base64',
    });
    if (saved && saved.url) urlMap[oldUrl] = saved.url;
  }

  const remappedTpl = Object.keys(urlMap).length
    ? deepRemapStrings(bundle.tpl, urlMap)
    : bundle.tpl;

  return remappedTpl;
}

Object.assign(window, {
  stSharingBundle: { pack: packSharing, unpack: unpackSharing },
});
