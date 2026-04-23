// export-html.tsx — R5 · Pure, email-safe HTML generator.
//
// Converts a section/column/block doc into an HTML email that survives the
// worst-case email clients (Outlook desktop on Windows, Gmail's style-stripping,
// iOS Mail's dark-mode invert). Design intents:
//
//   · Zero JavaScript in output (no <script>, no on*= handlers, no React
//     artifacts). `{{vars}}` are merge tags consumed by the ESP at send time.
//   · Table-based layout — Outlook ignores flex/grid entirely. Every section
//     and column renders through role="presentation" tables.
//   · Desktop styles go INLINE on every <td>/<p>/<h*>. Mobile overrides and
//     hidden-on-device rules go in a single <style>@media</style> block with
//     class hooks (.st-sec-{id}, .st-col-{sec}-{i}, .st-blk-{id}) so they can
//     be targeted without depending on cascade.
//   · Merge tags are translated per dialect (native/sendgrid/mailgun/mailchimp).
//   · For preview, `previewVars` substitutes {{key}} with the sample value.
//
// This generator DOES NOT call the React renderers in `email-blocks.tsx`. It
// has its own per-type pure emitters so the output is deterministic and free
// of React-isms.
//
// NOTE on QR: QRCode.toDataURL is async. Callers that want real QRs must
// pre-bake each qr block's `content.dataUrl` before calling docToEmailHtml —
// the function itself is synchronous and emits an <img src="data:..."/>
// when `dataUrl` is present, else pushes a warning.
//
// Public surface:
//   window.docToEmailHtml(doc, opts) → { html, warnings }

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────

function _esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Attribute-safe URL — escape quotes and angle brackets. Does not validate.
function _urlAttr(u = '') {
  return String(u).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Font stacks — same intent as lib/export.tsx but lives here so this module
// is self-contained. Every stack ends in a generic so Outlook always has
// something to fall back to.
const _FONT_STACKS = {
  'inter': 'Inter, Helvetica, Arial, sans-serif',
  'inter-tight': '"Inter Tight", Helvetica, Arial, sans-serif',
  'fraunces': 'Fraunces, Georgia, serif',
  'dm-serif': '"DM Serif Display", Georgia, serif',
  'instrument': '"Instrument Serif", Georgia, serif',
  'instrument-serif': '"Instrument Serif", Georgia, serif',
  'playfair': '"Playfair Display", Georgia, serif',
  'space-grotesk': '"Space Grotesk", Helvetica, Arial, sans-serif',
  'ibm-plex': '"IBM Plex Sans", Helvetica, Arial, sans-serif',
  'ibm-plex-mono': '"IBM Plex Mono", Consolas, monospace',
  'georgia': 'Georgia, serif',
  'helvetica': 'Helvetica, Arial, sans-serif',
  'arial': 'Arial, Helvetica, sans-serif',
  'courier': '"Courier New", Consolas, monospace',
  'system': '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", sans-serif',
};
function _fstack(f) {
  if (!f) return 'Helvetica, Arial, sans-serif';
  const key = String(f).toLowerCase();
  if (_FONT_STACKS[key]) return _FONT_STACKS[key];
  return /\s/.test(f) ? `"${f}", Helvetica, Arial, sans-serif` : `${f}, Helvetica, Arial, sans-serif`;
}

// Normalize padding (scalar | [t,r,b,l] | {top,right,bottom,left}) → CSS string.
function _padCss(sp, fallback = 0) {
  if (sp == null) return `${fallback}px`;
  if (typeof sp === 'number') return `${sp}px`;
  if (Array.isArray(sp)) return `${sp[0]||0}px ${sp[1]||0}px ${sp[2]||0}px ${sp[3]||0}px`;
  if (typeof sp === 'object') {
    return `${sp.top||0}px ${sp.right||0}px ${sp.bottom||0}px ${sp.left||0}px`;
  }
  return `${fallback}px`;
}

// oklab/color-mix is not portable in email — strip any custom-property or
// color-mix value and fall back to a safe neutral. The helper only fires on
// strings containing "color-mix"; everything else passes through.
function _safeColor(c, fallback = '#000000') {
  if (!c) return fallback;
  const s = String(c);
  if (s.includes('color-mix') || s.includes('var(') || s.includes('currentColor')) {
    return fallback;
  }
  return s;
}

// getContent — matches the shape in email-blocks.tsx.
function _getContent(data = {}) {
  const { style, content, spacing, mobile, mobileSpacing, hidden, ...flat } = data || {};
  return { ...flat, ...(content || {}) };
}

// resolveStyle passthrough — falls back to a local impl if window helper is
// missing (e.g. calling docToEmailHtml from Node-like tests).
function _resolveStyle(base, override, device) {
  const fn = typeof window !== 'undefined' ? window.resolveStyle : null;
  if (fn) return fn(base, override, device);
  const b = base || {};
  if (device === 'mobile' && override && typeof override === 'object') return { ...b, ...override };
  return b;
}
function _isVisibleOn(hidden, device) {
  const fn = typeof window !== 'undefined' ? window.isVisibleOn : null;
  if (fn) return fn(hidden, device);
  if (!hidden || typeof hidden !== 'object') return true;
  if (device === 'desktop' && hidden.desktop) return false;
  if (device === 'mobile' && hidden.mobile) return false;
  return true;
}

function _borderDecls(border, important = false) {
  if (!border || typeof border !== 'object') return [];
  const bw = typeof border.w === 'number' ? border.w : 0;
  const bs = border.style || 'solid';
  const bc = _safeColor(border.color, '#000000');
  const bang = important ? ' !important' : '';
  if (border.sides && typeof border.sides === 'object') {
    return ['top', 'right', 'bottom', 'left'].map((side) => {
      const sw = typeof border.sides[side] === 'number' ? border.sides[side] : bw;
      return `border-${side}:${sw}px ${bs} ${bc}${bang}`;
    });
  }
  if (bw > 0) return [`border:${bw}px ${bs} ${bc}${bang}`];
  return [];
}

// ───────────────────────────────────────────────────────────────────
// Merge-tag mapping — native/sendgrid pass-through, mailgun/mailchimp rewrite.
// ───────────────────────────────────────────────────────────────────

const _MERGE_TAG_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

function tokenizeMergeTags(text) {
  if (text == null || text === '') return [];
  const s = String(text);
  const tokens = [];
  let buf = '';
  let i = 0;
  while (i < s.length) {
    // Escaped literal: \{\{literal\}\} -> literal token "{{literal}}".
    if (s.startsWith('\\{\\{', i)) {
      if (buf) {
        tokens.push({ type: 'text', value: buf });
        buf = '';
      }
      const end = s.indexOf('\\}\\}', i + 4);
      if (end === -1) {
        buf += s.slice(i);
        break;
      }
      const inner = s.slice(i + 4, end);
      tokens.push({ type: 'literal', value: `{{${inner}}}` });
      i = end + 4;
      continue;
    }

    const isRaw = s.startsWith('{{{', i);
    const isNormal = !isRaw && s.startsWith('{{', i);
    if (!isRaw && !isNormal) {
      buf += s[i];
      i += 1;
      continue;
    }

    const openerLen = isRaw ? 3 : 2;
    const closer = isRaw ? '}}}' : '}}';
    const closeIdx = s.indexOf(closer, i + openerLen);
    if (closeIdx === -1) {
      buf += s.slice(i);
      break;
    }

    const original = s.slice(i, closeIdx + closer.length);
    const inner = s.slice(i + openerLen, closeIdx);
    const key = inner.trim();
    if (!_MERGE_TAG_IDENTIFIER_RE.test(key)) {
      buf += original;
      i = closeIdx + closer.length;
      continue;
    }

    if (buf) {
      tokens.push({ type: 'text', value: buf });
      buf = '';
    }
    tokens.push({ type: 'var', key, raw: isRaw, original });
    i = closeIdx + closer.length;
  }
  if (buf) tokens.push({ type: 'text', value: buf });
  return tokens;
}

function _previewMap(previewVars) {
  if (!Array.isArray(previewVars) || previewVars.length === 0) return null;
  const map = Object.create(null);
  for (const v of previewVars) {
    if (v && v.key) map[String(v.key)] = v.sample;
  }
  return map;
}

function _warnMerge(ctxWarnings, kind, dialect, key) {
  if (!Array.isArray(ctxWarnings)) return;
  ctxWarnings.push(`${kind}:${dialect || 'native'}:${key || ''}`);
}

function _renderMergeTagVar(token, dialect, previewMap, ctxWarnings) {
  const key = token.key;
  if (previewMap && Object.prototype.hasOwnProperty.call(previewMap, key)) {
    const sample = previewMap[key];
    return sample != null ? String(sample) : '';
  }

  const isDotNotation = key.includes('.');
  const d = dialect || 'native';
  if ((d === 'mailgun' || d === 'mailchimp') && isDotNotation) {
    _warnMerge(ctxWarnings, 'mergeTagDotNotation', d, key);
    return token.original;
  }

  if (d === 'mailgun') {
    if (token.raw) _warnMerge(ctxWarnings, 'mergeTagRawNotSupported', d, key);
    return `%recipient.${key}%`;
  }
  if (d === 'mailchimp') {
    if (token.raw) _warnMerge(ctxWarnings, 'mergeTagRawNotSupported', d, key);
    return `*|${String(key).toUpperCase()}|*`;
  }
  if (d === 'sendgrid' || d === 'native') {
    return token.raw ? `{{{${key}}}}` : `{{${key}}}`;
  }
  return token.raw ? `{{{${key}}}}` : `{{${key}}}`;
}

function mapMergeTag(text, dialect, previewVars, ctxWarnings) {
  if (text == null) return '';
  const tokens = tokenizeMergeTags(String(text));
  if (!tokens.length) return '';
  const previewMap = _previewMap(previewVars);
  return tokens.map((token) => {
    if (token.type === 'text' || token.type === 'literal') return token.value;
    if (token.type === 'var') {
      return _renderMergeTagVar(token, dialect, previewMap, ctxWarnings);
    }
    return '';
  }).join('');
}

// Convenience: escape-after-map — use for user-visible text.
function _tag(text, ctx) {
  return _esc(mapMergeTag(text, ctx.dialect, ctx.previewVars, ctx.warnings));
}
// Same but preserves raw HTML content (caller is responsible for escaping).
function _tagRaw(text, ctx) {
  return mapMergeTag(text, ctx.dialect, ctx.previewVars, ctx.warnings);
}

// ───────────────────────────────────────────────────────────────────
// Sanitizer for the `html` block.
// ───────────────────────────────────────────────────────────────────

const _HTML_ALLOWED_TAGS = new Set([
  'DIV','P','SPAN','A','IMG','BR','STRONG','EM','UL','OL','LI','TABLE','TR','TD','TH','THEAD','TBODY',
  'H1','H2','H3','H4','H5','H6','HR','B','I','U',
]);
const _HTML_ALLOWED_ATTRS = new Set([
  'style','href','src','alt','width','height','class','colspan','rowspan','align','bgcolor',
]);
const _HTML_DROP_CONTENT_TAGS = new Set([
  'SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','BASE','FORM','INPUT','BUTTON','TEXTAREA','SELECT','OPTION',
]);

function _sanitizeInlineStyle(value = '') {
  return String(value)
    .split(';')
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => {
      const low = decl.toLowerCase().replace(/\s+/g, '');
      if (low.includes('expression(')) return false;
      if (low.includes('javascript:')) return false;
      if (low.includes('url(data:text/html')) return false;
      return true;
    })
    .join('; ');
}

function _isUnsafeUrl(value = '') {
  const low = String(value).trim().toLowerCase();
  if (!low) return false;
  if (low.startsWith('javascript:')) return true;
  if (low.startsWith('vbscript:')) return true;
  if (low.startsWith('data:text/html')) return true;
  return false;
}

function safeHtmlSubset(raw = '') {
  const warnings = [];
  if (!raw) return { html: '', warnings };
  if (typeof DOMParser === 'undefined') {
    return { html: _esc(raw), warnings: ['htmlTagStripped:raw'] };
  }

  const doc = new DOMParser().parseFromString(String(raw), 'text/html');
  const body = doc.body;
  if (!body) return { html: '', warnings };

  const warnTag = (tag) => warnings.push(`htmlTagStripped:${String(tag || '').toLowerCase()}`);
  const warnAttr = (attr) => warnings.push(`attrStripped:${String(attr || '').toLowerCase()}`);
  const walker = [];
  for (const n of Array.from(body.childNodes)) walker.push(n);

  while (walker.length) {
    const node = walker.shift();
    if (!node) continue;
    if (node.nodeType !== 1) continue;
    const el = node;
    const tag = String(el.tagName || '').toUpperCase();

    if (!_HTML_ALLOWED_TAGS.has(tag)) {
      warnTag(tag);
      const parent = el.parentNode;
      if (!parent) continue;
      if (_HTML_DROP_CONTENT_TAGS.has(tag)) {
        parent.removeChild(el);
        continue;
      }
      const kids = Array.from(el.childNodes);
      for (const kid of kids) parent.insertBefore(kid, el);
      parent.removeChild(el);
      for (const kid of kids) walker.unshift(kid);
      continue;
    }

    const attrs = Array.from(el.attributes || []);
    for (const attr of attrs) {
      const name = String(attr.name || '').toLowerCase();
      const value = attr.value;
      const isEvent = /^on\s*/i.test(name);
      if (isEvent || !_HTML_ALLOWED_ATTRS.has(name)) {
        el.removeAttribute(attr.name);
        warnAttr(name || attr.name);
        continue;
      }
      if ((name === 'href' || name === 'src') && _isUnsafeUrl(value)) {
        el.removeAttribute(attr.name);
        warnAttr(name);
        continue;
      }
      if (name === 'style') {
        const cleanStyle = _sanitizeInlineStyle(value);
        if (cleanStyle) el.setAttribute('style', cleanStyle);
        else el.removeAttribute('style');
      }
    }

    for (const kid of Array.from(el.childNodes)) walker.push(kid);
  }

  return { html: body.innerHTML || '', warnings };
}

// ───────────────────────────────────────────────────────────────────
// Block emitters — each returns a string of HTML (no wrappers).
// ───────────────────────────────────────────────────────────────────

function _emitText(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const style = [
    `margin:0`,
    `padding:${_padCss(sp?.padding)}`,
    `font-size:${s.size || 14}px`,
    `line-height:${s.lh || 1.55}`,
    s.tracking != null ? `letter-spacing:${s.tracking}px` : '',
    `color:${_safeColor(s.color, '#1a1a17')}`,
    `text-align:${s.align || 'left'}`,
    `font-family:${_fstack(s.font || ctx.font)}`,
    `font-weight:${s.weight || 400}`,
    s.italic ? 'font-style:italic' : '',
    s.underline ? 'text-decoration:underline' : '',
  ].filter(Boolean).join(';');
  return `<p class="st-blk-${_esc(blk.id||'')}" style="${style}">${_tag(c.body || '', ctx)}</p>`;
}

function _emitHeading(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const level = Math.max(1, Math.min(6, s.level || 2));
  const sizes = { 1:32, 2:24, 3:20, 4:17, 5:15, 6:13 };
  const size = s.size || sizes[level];
  const style = [
    `margin:0`,
    `padding:${_padCss(sp?.padding)}`,
    `font-size:${size}px`,
    `line-height:${s.lh || 1.2}`,
    s.tracking != null ? `letter-spacing:${s.tracking}px` : 'letter-spacing:-0.3px',
    `font-weight:${s.weight || 600}`,
    `color:${_safeColor(s.color, '#1a1a17')}`,
    `text-align:${s.align || 'left'}`,
    `font-family:${_fstack(s.font || ctx.font)}`,
  ].filter(Boolean).join(';');
  return `<h${level} class="st-blk-${_esc(blk.id||'')}" style="${style}">${_tag(c.text || '', ctx)}</h${level}>`;
}

function _emitHero(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const align = s.align || 'left';
  const font = _fstack(s.font || ctx.font);
  return `<table role="presentation" class="st-blk-${_esc(blk.id||'')}" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${_padCss(sp?.padding)};">
<tr><td align="${align}" style="font-family:${font};text-align:${align};">
<h1 style="margin:0 0 12px;font-size:${s.titleSize || 30}px;line-height:1.15;letter-spacing:-0.5px;font-weight:${s.titleWeight || 600};color:${_safeColor(s.titleColor, '#1a1a17')};">${_tag(c.heading || '', ctx)}</h1>
<p style="margin:0;font-size:${s.bodySize || 15}px;line-height:1.55;color:${_safeColor(s.bodyColor, '#1a1a17')};opacity:0.9;">${_tag(c.body || '', ctx)}</p>
</td></tr></table>`;
}

function _emitImage(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const align = s.align || 'center';
  const widthPct = s.width || 100;
  const alt = _esc(c.alt || '');
  const radius = s.radius || 0;
  if (!c.alt) ctx.warnings.push('altMissing:image');
  if (!c.src) {
    // Empty placeholder — render a neutral cell so the structure survives.
    return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};">
<table role="presentation" width="${widthPct}%" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;width:${widthPct}%;max-width:100%;"><tr><td align="center" bgcolor="#eeeeee" style="background:#eeeeee;color:#888888;font-size:12px;font-family:${_fstack(s.font||ctx.font)};padding:40px 16px;border-radius:${radius}px;">${alt || 'Image'}</td></tr></table>
</div>`;
  }
  const imgHtml = `<img src="${_urlAttr(c.src)}" alt="${alt}" width="${Math.round(600 * widthPct/100)}" style="display:block;border:0;outline:none;text-decoration:none;width:100%;height:auto;max-width:100%;border-radius:${radius}px;" />`;
  const inner = c.url
    ? `<a href="${_urlAttr(c.url)}" target="_blank" style="text-decoration:none;display:block;line-height:0;">${imgHtml}</a>`
    : imgHtml;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-size:0;line-height:0;">
<div style="display:inline-block;width:${widthPct}%;max-width:100%;line-height:0;">${inner}</div>
</div>`;
}

// Bulletproof VML Outlook button — classic Campaign Monitor pattern.
function _emitButton(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const align = s.align || 'center';
  const label = _tag(c.label || 'Call to action', ctx);
  const url = _urlAttr(c.url || '#');
  const bg = _safeColor(s.bg, '#1a1a17');
  const color = _safeColor(s.color, '#ffffff');
  const radius = s.radius != null ? s.radius : 4;
  const padX = s.padX || 22;
  const padY = s.padY || 12;
  const fontSize = s.size || 14;
  const fontW = s.weight || 500;
  const font = _fstack(s.font || ctx.font);
  const borderColor = _safeColor(s.borderColor, bg);
  const borderW = s.borderW || 0;

  // VML fallback needs an estimated width — use 0 + `w:anchorlock` to hug.
  const vmlHeight = padY*2 + fontSize + 4;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:${vmlHeight}px;v-text-anchor:middle;width:auto;mso-padding-alt:${padY}px ${padX}px;" arcsize="${Math.min(50, Math.round((radius/vmlHeight)*100))}%" strokecolor="${borderColor}" strokeweight="${borderW}px" fillcolor="${bg}">
<w:anchorlock/>
<center style="color:${color};font-family:${font};font-size:${fontSize}px;font-weight:${fontW};">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${url}" target="_blank" style="display:inline-block;background:${bg};color:${color};padding:${padY}px ${padX}px;border-radius:${radius}px;text-decoration:none;font-family:${font};font-size:${fontSize}px;font-weight:${fontW};line-height:1;mso-hide:all;${borderW ? `border:${borderW}px solid ${borderColor};` : ''}">${label}</a>
<!--<![endif]-->
</div>`;
}

function _emitDivider(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const widthPct = s.width || 100;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${s.align || 'center'};">
<table role="presentation" width="${widthPct}%" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;width:${widthPct}%;"><tr><td style="border-top:${s.thickness || 1}px ${s.style || 'solid'} ${_safeColor(s.color, '#d9d9d9')};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>
</div>`;
}

function _emitSpacer(blk /*, ctx */) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const h = s.h || data.h || 24;
  return `<table role="presentation" class="st-blk-${_esc(blk.id||'')}" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="${h}" style="height:${h}px;line-height:${h}px;font-size:0;background:${_safeColor(s.bg, 'transparent')};">&nbsp;</td></tr></table>`;
}

function _emitHeader(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const centered = s.layout === 'center';
  const font = _fstack(s.font || ctx.font);
  const color = _safeColor(s.color, '#1a1a17');
  const subColor = _safeColor(s.subColor, '#888888');
  return `<table role="presentation" class="st-blk-${_esc(blk.id||'')}" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${_padCss(sp?.padding)};">
<tr><td align="${centered ? 'center' : 'left'}" style="font-family:${font};">
<div style="font-weight:700;font-size:${s.logoSize || 18}px;letter-spacing:-0.3px;color:${color};">${_tag(c.brand || 'Acme', ctx)}</div>
${!centered && c.sub ? `<div style="font-size:12px;color:${subColor};font-family:Consolas,Menlo,monospace;margin-top:2px;">${_tag(c.sub || '', ctx)}</div>` : ''}
</td></tr></table>`;
}

function _emitFooter(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const align = s.align || 'left';
  const font = _fstack(s.font || ctx.font);
  const color = _safeColor(s.color, '#6a6a8a');
  return `<table role="presentation" class="st-blk-${_esc(blk.id||'')}" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${_padCss(sp?.padding)};">
<tr><td align="${align}" style="font-family:${font};font-size:${s.size || 12}px;line-height:1.6;color:${color};text-align:${align};">
${c.company ? `<div style="margin-bottom:6px;font-weight:500;">${_tag(c.company, ctx)}</div>` : ''}
${c.notice ? `<div style="opacity:0.85;">${_tag(c.notice, ctx)}</div>` : ''}
</td></tr></table>`;
}

function _emitIcon(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const mode = s.mode || 'icon';
  const size = s.size || 32;
  const align = s.align === 'left' ? 'left' : s.align === 'right' ? 'right' : 'center';
  const gap = s.gap != null ? s.gap : 10;
  const font = _fstack(s.font || ctx.font);
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-family:${font};">
${(mode === 'icon' || mode === 'icon-text') ? `<span style="font-size:${size}px;line-height:1;color:${_safeColor(s.color, '#1a1a17')};vertical-align:middle;">${_esc(c.emoji || '✨')}</span>` : ''}
${mode === 'icon-text' ? `<span style="display:inline-block;width:${gap}px;">&nbsp;</span>` : ''}
${(mode === 'text' || mode === 'icon-text') ? `<span style="font-size:${s.textSize || 14}px;font-weight:${s.textWeight || 500};color:${_safeColor(s.textColor, '#1a1a17')};vertical-align:middle;font-family:${font};">${_tag(c.text || '', ctx)}</span>` : ''}
</div>`;
}

// Video — thumb+play overlay. Outlook ignores absolute positioning but
// renders background-image + centered ▶ character, so we layer both.
function _emitVideo(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const parse = typeof window !== 'undefined' && window.parseVideoUrl ? window.parseVideoUrl(c.videoUrl) : { autoThumb: null };
  const thumb = c.thumbnail || parse.autoThumb;
  const url = c.url || c.videoUrl || '#';
  const widthPct = s.width || 100;
  const align = s.align || 'center';
  const radius = s.radius || 0;
  const playColor = _safeColor(s.playColor, '#ffffff');
  const playBg = _safeColor(s.playBg, '#000000');
  if (!c.alt && !c.caption) ctx.warnings.push('altMissing:video');

  const inner = thumb ? `<img src="${_urlAttr(thumb)}" alt="${_esc(c.caption || c.alt || '')}" width="600" style="display:block;border:0;width:100%;height:auto;max-width:100%;border-radius:${radius}px;" />` : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#222222" style="background:#222222;color:#ffffff;height:180px;font-family:${_fstack(s.font||ctx.font)};font-size:12px;">Video</td></tr></table>`;

  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};">
<a href="${_urlAttr(url)}" target="_blank" style="display:inline-block;text-decoration:none;width:${widthPct}%;max-width:100%;line-height:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${thumb ? `background-image:url('${_urlAttr(thumb)}');background-size:cover;background-position:center;` : ''}">
<tr><td align="center" valign="middle" style="padding:60px 0;${thumb ? '' : 'background:#222222;'}">
<div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:32px;background:${playBg};color:${playColor};font-size:28px;text-align:center;opacity:0.85;">&#9654;</div>
</td></tr>
</table>
${thumb ? '' : inner}
</a>
${c.caption ? `<div style="font-size:${s.captionSize || 12}px;color:${_safeColor(s.captionColor, '#888888')};margin-top:6px;font-family:${_fstack(s.font||ctx.font)};line-height:1.4;">${_tag(c.caption, ctx)}</div>` : ''}
</div>`;
}

// GIF — animated in Apple Mail/iOS/Android; first-frame fallback in Outlook
// desktop (Windows). There is no workaround; documented inline.
function _emitGif(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const widthPct = s.width || 100;
  const align = s.align || 'center';
  const alt = _esc(c.alt || '');
  if (!c.alt) ctx.warnings.push('altMissing:gif');
  if (!c.src) {
    return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};"><div style="display:inline-block;background:#eeeeee;color:#888888;padding:40px 16px;font-family:${_fstack(s.font||ctx.font)};font-size:12px;border-radius:${s.radius||0}px;">GIF</div></div>`;
  }
  // Outlook on Windows shows the GIF's first frame — no fix at template level.
  const img = `<img src="${_urlAttr(c.src)}" alt="${alt}" width="${Math.round(600 * widthPct/100)}" style="display:block;border:0;width:100%;height:auto;max-width:100%;border-radius:${s.radius||0}px;" />`;
  const inner = c.url ? `<a href="${_urlAttr(c.url)}" target="_blank" style="display:block;line-height:0;text-decoration:none;">${img}</a>` : img;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-size:0;line-height:0;">
<div style="display:inline-block;width:${widthPct}%;max-width:100%;line-height:0;">${inner}</div>
</div>`;
}

// QR — caller must pre-bake `content.dataUrl` (see header comment).
function _emitQr(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const size = s.size || 180;
  const align = s.align || 'center';
  const bg = _safeColor(s.bg, '#ffffff');
  if (!c.dataUrl) {
    ctx.warnings.push('qrNotBaked');
    return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};">
<div style="display:inline-block;width:${size}px;height:${size}px;line-height:${size}px;background:${bg};color:#888888;border:1px dashed #aaaaaa;font-family:${_fstack(s.font||ctx.font)};font-size:11px;text-align:center;">QR</div>
</div>`;
  }
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};">
<img src="${_urlAttr(c.dataUrl)}" alt="${_esc(c.alt || c.qrContent || 'QR')}" width="${size}" height="${size}" style="display:inline-block;border:0;width:${size}px;height:${size}px;background:${bg};border-radius:${s.radius||0}px;" />
${c.caption ? `<div style="font-size:${s.captionSize || 12}px;color:${_safeColor(s.captionColor, '#888888')};margin-top:8px;font-family:${_fstack(s.font||ctx.font)};line-height:1.4;">${_tag(c.caption, ctx)}</div>` : ''}
</div>`;
}

// Countdown — static freezes text at export time, live renders <img>.
function _emitCountdown(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const mode = c.mode || 'static';
  const font = _fstack(s.font || ctx.font);
  const align = s.align || 'center';

  if (mode === 'live') {
    if (!c.alt) ctx.warnings.push('altMissing:countdown');
    if (!c.imageUrl) {
      return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-family:${font};color:#888888;font-size:12px;">${_esc(c.fallbackText || '')}</div>`;
    }
    const w = c.width || 600, h = c.height || 150;
    const img = `<img src="${_urlAttr(c.imageUrl)}" alt="${_esc(c.alt || c.fallbackText || '')}" width="${w}" height="${h}" style="display:block;border:0;max-width:100%;height:auto;border-radius:${s.radius||0}px;" />`;
    const inner = c.linkUrl ? `<a href="${_urlAttr(c.linkUrl)}" target="_blank" style="display:block;line-height:0;text-decoration:none;">${img}</a>` : img;
    return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-size:0;line-height:0;">
<div style="display:inline-block;max-width:100%;line-height:0;">${inner}</div>
</div>`;
  }

  // Static — compute days once and freeze.
  const lang = ctx.lang || 'en';
  const defs = (typeof window !== 'undefined' && window.defaultCountdownLabels)
    ? window.defaultCountdownLabels(lang)
    : { template: '{days} days left', singular: '1 day left', zero: 'Today', expired: 'Expired' };
  const labels = {
    template: c.template || defs.template,
    singular: c.singular || defs.singular,
    zero:     c.zero     || defs.zero,
    expired:  c.expired  || defs.expired,
  };
  const nowIso = ctx.exportDateIso || new Date().toISOString();
  const daysUntil = (typeof window !== 'undefined' && window.daysUntil)
    ? window.daysUntil
    : (target) => {
        if (!target) return null;
        const ms = new Date(target).getTime() - new Date(nowIso).getTime();
        return Math.ceil(ms / (1000*60*60*24));
      };
  const resolveLabel = (typeof window !== 'undefined' && window.resolveCountdownLabel)
    ? window.resolveCountdownLabel
    : (days, l) => days==null ? l.template.replace('{days}','—')
                 : days<0 ? l.expired
                 : days===0 ? l.zero
                 : days===1 ? l.singular
                 : l.template.replace('{days}', String(days));
  const days = daysUntil(c.targetDate, nowIso);
  const text = c.targetDate ? resolveLabel(days, labels) : (labels.template || '').replace('{days}','—');
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-family:${font};font-size:${s.size||28}px;font-weight:${s.weight||600};color:${_safeColor(s.color,'#1a1a17')};line-height:1.2;${s.tracking!=null?`letter-spacing:${s.tracking}px;`:''}">${_esc(text)}</div>`;
}

function _emitTestimonial(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const align = s.align || 'center';
  const font = _fstack(s.font || ctx.font);
  const color = _safeColor(s.color, '#1a1a17');
  const isCard = s.layout === 'card';
  const cardCss = isCard
    ? `border:1px solid ${_safeColor(s.borderColor,'#dddddd')};border-radius:${s.radius != null ? s.radius : 12}px;padding:${s.cardPadding != null ? s.cardPadding : 24}px;`
    : '';
  const rating = parseInt(c.rating) || 0;
  const ratingStars = rating > 0
    ? `<div style="margin-bottom:10px;color:${_safeColor(s.ratingColor,'#f5a623')};font-size:${s.ratingSize||16}px;letter-spacing:2px;">${'★'.repeat(Math.min(5, rating))}${'☆'.repeat(Math.max(0, 5-rating))}</div>`
    : '';
  const ident = (c.name || c.role || c.company || c.avatar) ? `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 0;"><tr>
${c.avatar ? `<td style="padding-right:12px;"><img src="${_urlAttr(c.avatar)}" alt="${_esc(c.name||'')}" width="${s.avatarSize||44}" height="${s.avatarSize||44}" style="display:block;border:0;width:${s.avatarSize||44}px;height:${s.avatarSize||44}px;border-radius:${(s.avatarShape||'circle')==='square' ? (s.avatarRadius||6) : 9999}px;object-fit:cover;" /></td>` : ''}
<td style="text-align:left;vertical-align:middle;">
${c.name ? `<div style="font-size:${s.nameSize||14}px;font-weight:600;color:${_safeColor(s.nameColor,color)};line-height:1.3;">${_tag(c.name, ctx)}</div>` : ''}
${(c.role || c.company) ? `<div style="font-size:${s.roleSize||12}px;color:${_safeColor(s.roleColor,'#888888')};margin-top:2px;line-height:1.3;">${_tag(c.role||'', ctx)}${c.role && c.company ? ' · ' : ''}${_tag(c.company||'', ctx)}</div>` : ''}
</td></tr></table>` : '';
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-family:${font};color:${color};${cardCss}">
${ratingStars}
<blockquote style="margin:0;padding:0;font-size:${s.quoteSize||18}px;font-weight:${s.quoteWeight||400};${s.quoteItalic?'font-style:italic;':''}color:${_safeColor(s.quoteColor,color)};line-height:1.5;">${_tag(c.quote || '', ctx)}</blockquote>
${ident}
</div>`;
}

function _emitSignature(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const font = _fstack(s.font || ctx.font);
  const color = _safeColor(s.color, '#1a1a17');
  const avatarSize = s.avatarSize || 56;
  const avatarHtml = c.avatar
    ? `<img src="${_urlAttr(c.avatar)}" alt="${_esc(c.name||'')}" width="${avatarSize}" height="${avatarSize}" style="display:block;border:0;width:${avatarSize}px;height:${avatarSize}px;border-radius:${(s.avatarShape||'circle')==='square' ? (s.avatarRadius||6) : 9999}px;object-fit:cover;" />`
    : `<div style="width:${avatarSize}px;height:${avatarSize}px;border-radius:${(s.avatarShape||'circle')==='square' ? (s.avatarRadius||6) : 9999}px;background:#eeeeee;color:#888888;font-size:${Math.round(avatarSize*0.35)}px;font-weight:600;line-height:${avatarSize}px;text-align:center;">${_esc((c.name||'?').charAt(0).toUpperCase())}</div>`;
  const socials = Array.isArray(c.socials) ? c.socials : [];
  const socialCells = socials.map(sc => {
    const nets = (typeof window !== 'undefined' && window.SIG_SOCIAL_NETS) ? window.SIG_SOCIAL_NETS : [];
    const net = nets.find(n => n.id === sc.type) || nets[0] || { letter: '?' };
    const sz = s.socialSize || 24;
    return `<td style="padding-right:${s.socialGap||8}px;"><a href="${_urlAttr(sc.url||'#')}" target="_blank" style="display:inline-block;width:${sz}px;height:${sz}px;line-height:${sz}px;border-radius:${(s.socialShape||'circle')==='square'?4:sz}px;background:${_safeColor(s.socialColor,'#1a1a17')};color:#ffffff;font-size:${Math.max(9,Math.round(sz*0.38))}px;font-weight:700;text-align:center;text-decoration:none;">${_esc(net.letter)}</a></td>`;
  }).join('');
  return `<table role="presentation" class="st-blk-${_esc(blk.id||'')}" cellpadding="0" cellspacing="0" border="0" style="padding:${_padCss(sp?.padding)};font-family:${font};color:${color};">
<tr>
<td style="padding-right:16px;vertical-align:top;">${avatarHtml}</td>
<td style="vertical-align:top;">
${c.name ? `<div style="font-size:${s.nameSize||16}px;font-weight:600;color:${_safeColor(s.nameColor,color)};line-height:1.3;">${_tag(c.name, ctx)}</div>` : ''}
${(c.title||c.company) ? `<div style="font-size:${s.titleSize||13}px;color:${_safeColor(s.titleColor,'#888888')};margin-top:2px;line-height:1.4;">${_tag(c.title||'', ctx)}${c.title && c.company ? ' · ' : ''}${_tag(c.company||'', ctx)}</div>` : ''}
${(c.email||c.phone) ? `<div style="font-size:${s.metaSize||12}px;color:${_safeColor(s.metaColor,'#888888')};line-height:1.8;margin-top:8px;">
${c.email ? `<div>✉ <a href="mailto:${_urlAttr(c.email)}" style="color:inherit;text-decoration:none;">${_esc(c.email)}</a></div>` : ''}
${c.phone ? `<div>☎ <a href="tel:${_urlAttr(String(c.phone).replace(/[^\d+]/g,''))}" style="color:inherit;text-decoration:none;">${_esc(c.phone)}</a></div>` : ''}
</div>` : ''}
${socialCells ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;"><tr>${socialCells}</tr></table>` : ''}
</td>
</tr>
</table>`;
}

function _emitAccordion(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const items = Array.isArray(c.items) ? c.items : [];
  const font = _fstack(s.font || ctx.font);
  const dividerColor = _safeColor(s.dividerColor, '#dddddd');
  const itemGap = s.itemGap != null ? s.itemGap : 14;
  // All items expanded, stacked with divider — email clients don't run JS.
  const itemsHtml = items.map((it, i) => `<tr><td style="${i > 0 ? `border-top:1px solid ${dividerColor};padding-top:${itemGap}px;` : ''}${i > 0 ? `padding-top:${itemGap}px;` : ''}padding-bottom:${itemGap}px;">
<div style="font-size:${s.titleSize||16}px;font-weight:${s.titleWeight||600};color:${_safeColor(s.titleColor,'#1a1a17')};line-height:1.3;margin-bottom:6px;">${_tag(it.title || '', ctx)}</div>
<div style="font-size:${s.bodySize||14}px;color:${_safeColor(s.bodyColor,'#1a1a17')};line-height:1.55;white-space:pre-wrap;">${_tag(it.body || '', ctx)}</div>
</td></tr>`).join('');
  return `<table role="presentation" class="st-blk-${_esc(blk.id||'')}" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${_padCss(sp?.padding)};font-family:${font};text-align:${s.align||'left'};color:${_safeColor(s.bodyColor,'#1a1a17')};">
${itemsHtml || ''}
</table>`;
}

function _emitAttachment(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const font = _fstack(s.font || ctx.font);
  const ext = String((c.ext || (c.filename||'').split('.').pop() || '').toLowerCase()).slice(0,4).toUpperCase() || 'FILE';
  const radius = s.radius != null ? s.radius : 8;
  return `<table role="presentation" class="st-blk-${_esc(blk.id||'')}" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${_padCss(sp?.padding)};font-family:${font};">
<tr><td style="padding:14px 16px;background:${_safeColor(s.bg,'#f5f5f5')};border:1px solid ${_safeColor(s.borderColor,'#dddddd')};border-radius:${radius}px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="42" style="padding-right:14px;vertical-align:middle;"><div style="width:42px;height:50px;line-height:50px;border-radius:6px;background:${_safeColor(s.iconBg,'#6b6a63')};color:${_safeColor(s.iconColor,'#ffffff')};text-align:center;font-size:11px;font-weight:700;letter-spacing:0.5px;">${_esc(ext)}</div></td>
<td style="vertical-align:middle;">
<div style="font-size:${s.nameSize||14}px;font-weight:600;color:${_safeColor(s.nameColor,'#1a1a17')};">${_tag(c.filename || 'File', ctx)}</div>
${c.size ? `<div style="font-size:${s.sizeSize||12}px;color:${_safeColor(s.sizeColor,'#888888')};font-family:Consolas,Menlo,monospace;margin-top:2px;">${_esc(c.size)}</div>` : ''}
</td>
<td align="right" style="vertical-align:middle;"><a href="${_urlAttr(c.fileUrl || '#')}" target="_blank" style="display:inline-block;padding:8px 14px;background:${_safeColor(s.ctaBg,'#1a1a17')};color:${_safeColor(s.ctaColor,'#ffffff')};border-radius:4px;text-decoration:none;font-size:12px;font-weight:500;">${_tag(c.ctaLabel || 'Download', ctx)}</a></td>
</tr></table>
</td></tr></table>`;
}

function _emitProduct(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const font = _fstack(s.font || ctx.font);
  const img = c.image
    ? `<img src="${_urlAttr(c.image)}" alt="${_esc(c.name||'')}" width="300" style="display:block;border:0;width:100%;height:auto;max-width:100%;border-radius:${s.radius||0}px;" />`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#e8eddd" style="background:#e8eddd;color:#6a6a8a;font-size:12px;height:160px;border-radius:${s.radius||0}px;font-family:${font};">${_tag(c.name || 'Product', ctx)}</td></tr></table>`;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};font-family:${font};">
${img}
<div style="padding:10px 0 0;font-size:${s.nameSize||13}px;font-weight:500;color:${_safeColor(s.nameColor,'#1a1a17')};">${_tag(c.name || '', ctx)}</div>
${c.price ? `<div style="font-size:12px;color:${_safeColor(s.priceColor,'#888888')};font-family:Consolas,Menlo,monospace;">${_tag(c.price, ctx)}</div>` : ''}
</div>`;
}

function _emitCart(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const items = Array.isArray(c.items) ? c.items : [];
  const currency = c.currency || 'USD';
  const fmt = (v) => (typeof window !== 'undefined' && window.fmtMoney) ? window.fmtMoney(v, currency) : (v == null ? '' : String(v));
  const font = _fstack(s.font || ctx.font);
  const cellBorder = `1px solid ${_safeColor(s.rowBorderColor,'#e5e5e5')}`;
  const color = _safeColor(s.textColor,'#1a1a17');
  const radius = s.radius != null ? s.radius : 8;
  const rows = items.map((it, i) => `<tr>
<td width="56" style="padding:10px 14px;${i>0?`border-top:${cellBorder};`:''}">
<div style="width:48px;height:48px;line-height:48px;text-align:center;border-radius:6px;background:#f0f0f0;font-size:18px;color:#aaaaaa;">${it.image ? `<img src="${_urlAttr(it.image)}" alt="${_esc(it.name||'')}" width="48" height="48" style="display:block;border:0;width:48px;height:48px;border-radius:6px;object-fit:cover;" />` : '🛍'}</div>
</td>
<td style="padding:10px 14px;${i>0?`border-top:${cellBorder};`:''}">
<div style="font-size:13px;font-weight:500;color:${color};">${_tag(it.name || '', ctx)}</div>
${(it.qty != null && it.qty !== '') ? `<div style="font-size:11px;color:#888888;margin-top:2px;">Qty: ${_esc(it.qty)}</div>` : ''}
</td>
<td align="right" style="padding:10px 14px;${i>0?`border-top:${cellBorder};`:''}font-size:13px;font-weight:500;font-family:Consolas,Menlo,monospace;color:${color};white-space:nowrap;">${_esc(fmt(it.price))}</td>
</tr>`).join('');
  const totalRow = (label, value, emph) => (value == null || value === '') ? '' :
    `<tr><td colspan="2" align="right" style="padding:10px 14px;border-top:${cellBorder};font-size:${emph?15:13}px;font-weight:${emph?700:500};color:${color};">${_esc(label)}</td>
     <td align="right" style="padding:10px 14px;border-top:${cellBorder};font-size:${emph?15:13}px;font-weight:${emph?700:500};color:${color};font-family:Consolas,Menlo,monospace;white-space:nowrap;">${_esc(fmt(value))}</td></tr>`;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};font-family:${font};color:${color};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:${_safeColor(s.bg,'#ffffff')};border:1px solid ${_safeColor(s.borderColor,'#dddddd')};border-radius:${radius}px;">
<thead><tr style="background:${_safeColor(s.headerBg,'#f5f5f5')};">
<th colspan="2" align="left" style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${color};">Item</th>
<th align="right" style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${color};">Price</th>
</tr></thead>
<tbody>
${rows || `<tr><td colspan="3" align="center" style="padding:22px 14px;font-size:12px;color:#888888;font-style:italic;">No items</td></tr>`}
${totalRow('Subtotal', c.subtotal)}
${totalRow('Shipping', c.shipping)}
${totalRow('Tax', c.tax)}
${totalRow('Total', c.total, true)}
</tbody>
</table>
${(c.ctaUrl || c.ctaLabel) ? `<div style="margin-top:14px;text-align:center;"><a href="${_urlAttr(c.ctaUrl || '#')}" target="_blank" style="display:inline-block;padding:12px 22px;background:${_safeColor(s.ctaBg,'#1a1a17')};color:${_safeColor(s.ctaColor,'#ffffff')};border-radius:4px;text-decoration:none;font-size:14px;font-weight:500;">${_tag(c.ctaLabel || 'Complete checkout', ctx)}</a></div>` : ''}
</div>`;
}

function _emitReceipt(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const items = Array.isArray(c.items) ? c.items : [];
  const currency = c.currency || 'USD';
  const fmt = (v) => (typeof window !== 'undefined' && window.fmtMoney) ? window.fmtMoney(v, currency) : (v == null ? '' : String(v));
  const font = _fstack(s.font || ctx.font);
  const color = _safeColor(s.textColor,'#1a1a17');
  const cellBorder = `1px solid ${_safeColor(s.rowBorderColor,'#e5e5e5')}`;
  const radius = s.radius != null ? s.radius : 8;
  const header = [
    c.orderNumber ? `Order #${_esc(c.orderNumber)}` : '',
    c.orderDate ? _esc(c.orderDate) : '',
  ].filter(Boolean).join(' · ');
  const rows = items.map((it, i) => `<tr>
<td style="padding:8px 0;${i>0?`border-top:${cellBorder};`:''}font-size:13px;color:${color};">${_tag(it.name || '', ctx)}</td>
<td align="right" style="padding:8px 10px;${i>0?`border-top:${cellBorder};`:''}font-size:12px;color:#888888;white-space:nowrap;">${(it.qty != null && it.qty !== '') ? `×${_esc(it.qty)}` : ''}</td>
<td align="right" style="padding:8px 0;${i>0?`border-top:${cellBorder};`:''}font-size:13px;font-family:Consolas,Menlo,monospace;color:${color};white-space:nowrap;">${_esc(fmt(it.price))}</td>
</tr>`).join('');
  const totalRow = (label, value, emph) => (value == null || value === '') ? '' :
    `<tr><td colspan="2" align="right" style="padding:${emph?10:4}px 0;${emph?`border-top:${cellBorder};`:''}font-size:${emph?14:12}px;font-weight:${emph?700:400};color:${emph?color:'#888888'};">${_esc(label)}</td>
     <td align="right" style="padding:${emph?10:4}px 0;${emph?`border-top:${cellBorder};`:''}font-size:${emph?14:12}px;font-weight:${emph?700:400};color:${emph?color:'#888888'};font-family:Consolas,Menlo,monospace;white-space:nowrap;">${_esc(fmt(value))}</td></tr>`;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};font-family:${font};color:${color};">
<div style="padding:14px 16px;background:${_safeColor(s.bg,'#ffffff')};border:1px solid ${_safeColor(s.borderColor,'#dddddd')};border-radius:${radius}px;">
${header ? `<div style="font-size:13px;font-weight:600;color:${color};margin-bottom:12px;">${header}</div>` : ''}
${(c.customerName || c.address) ? `<div style="font-size:12px;color:#888888;margin-bottom:14px;line-height:1.5;white-space:pre-wrap;">
${c.customerName ? `<div style="font-weight:500;color:${color};">${_tag(c.customerName, ctx)}</div>` : ''}
${c.address ? `<div>${_tag(c.address, ctx)}</div>` : ''}
</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
<tbody>
${rows || `<tr><td colspan="3" align="center" style="padding:14px 0;font-size:12px;color:#888888;font-style:italic;">No items</td></tr>`}
${totalRow('Subtotal', c.subtotal)}
${totalRow('Tax', c.tax)}
${totalRow('Total', c.total, true)}
</tbody>
</table>
</div>
${(c.ctaUrl || c.ctaLabel) ? `<div style="margin-top:14px;text-align:center;"><a href="${_urlAttr(c.ctaUrl || '#')}" target="_blank" style="display:inline-block;padding:10px 20px;background:${_safeColor(s.ctaBg,'#1a1a17')};color:${_safeColor(s.ctaColor,'#ffffff')};border-radius:4px;text-decoration:none;font-size:13px;font-weight:500;">${_tag(c.ctaLabel || 'View order', ctx)}</a></div>` : ''}
</div>`;
}

function _emitMap(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const widthPct = s.width || 100;
  const align = s.align || 'center';
  const radius = s.radius || 0;
  const borderW = s.borderWidth || 0;
  const borderCss = borderW ? `border:${borderW}px solid ${_safeColor(s.borderColor,'#000000')};` : 'border:0;';
  if (!c.alt && !c.label && !c.address) ctx.warnings.push('altMissing:map');
  if (!c.imageUrl) {
    return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};"><div style="display:inline-block;width:${widthPct}%;max-width:100%;background:#eeeeee;color:#888888;padding:40px 16px;font-family:${_fstack(s.font||ctx.font)};font-size:12px;border-radius:${radius}px;">Map</div></div>`;
  }
  const img = `<img src="${_urlAttr(c.imageUrl)}" alt="${_esc(c.label || c.address || '')}" width="${Math.round(600 * widthPct/100)}" style="display:block;width:100%;height:auto;max-width:100%;border-radius:${radius}px;${borderCss}" />`;
  const inner = c.destinationUrl ? `<a href="${_urlAttr(c.destinationUrl)}" target="_blank" style="display:block;line-height:0;text-decoration:none;">${img}</a>` : img;
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};font-size:0;line-height:0;">
<div style="display:inline-block;width:${widthPct}%;max-width:100%;">${inner}</div>
${c.label ? `<div style="font-size:12px;color:${_safeColor(s.labelColor,'#888888')};margin-top:6px;font-family:${_fstack(s.font||ctx.font)};line-height:1.4;text-align:${align};">${_tag(c.label, ctx)}</div>` : ''}
</div>`;
}

function _emitSocial(blk, ctx) {
  const data = blk.data || {};
  const s = _resolveStyle(data.style, data.mobile, 'desktop');
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const active = Array.isArray(c.active) && c.active.length ? c.active : ['f','t','i','in'];
  const align = s.align === 'left' ? 'left' : s.align === 'right' ? 'right' : 'center';
  const size = s.size || 28;
  const gap = s.gap || 12;
  const radius = s.shape === 'square' ? 4 : size;
  const color = _safeColor(s.color, '#1a1a17');
  const cells = active.map(l => `<td style="padding:0 ${gap/2}px;"><div style="width:${size}px;height:${size}px;line-height:${size}px;border-radius:${radius}px;background:${color};color:#ffffff;text-align:center;font-size:11px;font-weight:600;">${_esc(l)}</div></td>`).join('');
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};text-align:${align};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;"><tr>${cells}</tr></table>
</div>`;
}

function _emitHtml(blk, ctx) {
  const data = blk.data || {};
  const sp = _resolveStyle(data.spacing, data.mobileSpacing, 'desktop');
  const c = _getContent(data);
  const raw = c.code || '';
  const { html, warnings } = safeHtmlSubset(raw);
  if (warnings && warnings.length) ctx.warnings.push(...warnings);
  return `<div class="st-blk-${_esc(blk.id||'')}" style="padding:${_padCss(sp?.padding)};">${html}</div>`;
}

const _EMITTERS = {
  header: _emitHeader,
  hero: _emitHero,
  image: _emitImage,
  heading: _emitHeading,
  text: _emitText,
  button: _emitButton,
  divider: _emitDivider,
  spacer: _emitSpacer,
  icon: _emitIcon,
  product: _emitProduct,
  footer: _emitFooter,
  social: _emitSocial,
  html: _emitHtml,
  video: _emitVideo,
  gif: _emitGif,
  qr: _emitQr,
  countdown: _emitCountdown,
  testimonial: _emitTestimonial,
  signature: _emitSignature,
  accordion: _emitAccordion,
  attachment: _emitAttachment,
  cart: _emitCart,
  receipt: _emitReceipt,
  map: _emitMap,
};

// ───────────────────────────────────────────────────────────────────
// Column / Section / Document rendering
// ───────────────────────────────────────────────────────────────────

function _emitBlocks(blocks, ctx, mediaChunks) {
  const out = [];
  for (const b of (blocks || [])) {
    if (!b || !b.type) continue;
    // Desktop-hidden: skip entirely. Mobile-hidden: emit but add @media rule.
    if (!_isVisibleOn(b.data?.hidden, 'desktop')) continue;
    const em = _EMITTERS[b.type];
    if (!em) {
      out.push(`<!-- unsupported block: ${_esc(b.type)} -->`);
      continue;
    }
    out.push(em(b, ctx));
    if (b.data?.hidden?.mobile) {
      mediaChunks.push(`.st-blk-${b.id} { display:none !important; mso-hide:all; }`);
    }
    // Block-level mobile spacing override → emit mobile padding rule.
    if (b.data?.mobileSpacing?.padding != null) {
      const pad = _padCss(b.data.mobileSpacing.padding);
      mediaChunks.push(`.st-blk-${b.id} { padding:${pad} !important; }`);
    }
  }
  return out.join('\n');
}

function _emitColumn(section, col, idx, ctx, mediaChunks) {
  // Desktop-hidden columns: skip entirely.
  if (!_isVisibleOn(col.hidden, 'desktop')) return '';
  const colClass = `st-col-${section.id}-${idx}`;
  const cs = _resolveStyle(col.style || {}, null, 'desktop');
  const w = col.w || Math.floor(100 / (section.columns?.length || 1));
  const colPad = _padCss(cs.padding);
  const colBg = _safeColor(cs.bg, 'transparent');
  const alignAttr = cs.align || 'left';
  const borderCss = _borderDecls(cs.border, false).map((decl) => `${decl};`).join('');

  // Mobile-hidden column → @media display:none.
  if (col.hidden?.mobile) {
    mediaChunks.push(`.${colClass} { display:none !important; mso-hide:all; }`);
  }
  // Mobile column width override.
  const stackOnMobile = section.stackOnMobile !== false;
  const mobW = col.mobile && typeof col.mobile.w === 'number' ? col.mobile.w : null;
  if (mobW != null) {
    mediaChunks.push(`.${colClass} { display:block !important; width:${mobW}% !important; }`);
  } else if (stackOnMobile) {
    mediaChunks.push(`.${colClass} { display:block !important; width:100% !important; }`);
  }
  // Mobile column style overrides → emit full rule for any present keys.
  if (col.mobile && typeof col.mobile === 'object') {
    const m = col.mobile;
    const overrides = [];
    if (m.bg != null) overrides.push(`background:${_safeColor(m.bg,'transparent')} !important`);
    if (m.padding != null) overrides.push(`padding:${_padCss(m.padding)} !important`);
    if (m.align != null) overrides.push(`text-align:${m.align} !important`);
    if (m.border != null) overrides.push(..._borderDecls(m.border, true));
    if (m.radius != null) overrides.push(`border-radius:${m.radius}px !important`);
    if (overrides.length) mediaChunks.push(`.${colClass} { ${overrides.join(';')}; }`);
  }

  const blocksHtml = _emitBlocks(col.blocks, ctx, mediaChunks);
  return `<td class="${colClass}" valign="${section.style?.vAlign || 'top'}" width="${w}%" style="width:${w}%;padding:${colPad};background:${colBg};${borderCss}text-align:${alignAttr};">
${blocksHtml}
</td>`;
}

function _emitSection(section, ctx, mediaChunks) {
  if (!_isVisibleOn(section.hidden, 'desktop')) return '';
  const secClass = `st-sec-${section.id}`;
  const s = _resolveStyle(section.style || {}, null, 'desktop');
  const outerBg = _safeColor(s.outerBg, 'transparent');
  const outerPadY = s.outerPadY || 0;
  const innerWidth = s.width || 600;
  const innerBg = _safeColor(s.bg, '#ffffff');
  const textColor = _safeColor(s.text, '#1a1a17');
  const innerPad = _padCss(s.padding, 24);
  const align = s.align || 'left';
  const font = s.font || ctx.font;
  const ctxInner = { ...ctx, font };

  // Section borders / radius.
  const borderCss = (() => {
    const b = s.border;
    if (!b || typeof b !== 'object') return '';
    const bw = typeof b.w === 'number' ? b.w : 0;
    const bs = b.style || 'solid';
    const bc = _safeColor(b.color, '#000000');
    if (b.sides) {
      return ['top','right','bottom','left'].map(side => {
        const sw = typeof b.sides[side] === 'number' ? b.sides[side] : bw;
        return `border-${side}:${sw}px ${bs} ${bc};`;
      }).join('');
    }
    if (bw > 0) return `border:${bw}px ${bs} ${bc};`;
    return '';
  })();
  const radiusCss = (() => {
    const rs = s.radius, corners = s.radiusCorners;
    if (corners) return `border-top-left-radius:${corners.tl||rs||0}px;border-top-right-radius:${corners.tr||rs||0}px;border-bottom-right-radius:${corners.br||rs||0}px;border-bottom-left-radius:${corners.bl||rs||0}px;`;
    if (typeof rs === 'number' && rs > 0) return `border-radius:${rs}px;`;
    return '';
  })();
  const bgImgCss = s.bgImage ? `background-image:url('${_urlAttr(s.bgImage)}');background-position:${s.bgImagePosition||'center center'};background-repeat:${s.bgImageRepeat||'no-repeat'};background-size:${s.bgImageSize||'cover'};` : '';

  // Mobile-hidden section.
  if (section.hidden?.mobile) {
    mediaChunks.push(`.${secClass} { display:none !important; mso-hide:all; }`);
  }
  // Mobile section override: emit any present keys as !important rules.
  if (section.mobile && typeof section.mobile === 'object') {
    const m = section.mobile;
    const inner = [];
    if (m.bg != null) inner.push(`background:${_safeColor(m.bg, innerBg)} !important`);
    if (m.text != null) inner.push(`color:${_safeColor(m.text, textColor)} !important`);
    if (m.padding != null) inner.push(`padding:${_padCss(m.padding)} !important`);
    if (m.align != null) inner.push(`text-align:${m.align} !important`);
    if (m.width != null) inner.push(`max-width:${m.width}px !important`);
    if (inner.length) mediaChunks.push(`.${secClass}-inner { ${inner.join(';')}; }`);
    if (m.outerBg != null || m.outerPadY != null) {
      const outer = [];
      if (m.outerBg != null) outer.push(`background:${_safeColor(m.outerBg, outerBg)} !important`);
      if (m.outerPadY != null) outer.push(`padding:${m.outerPadY}px 0 !important`);
      mediaChunks.push(`.${secClass} { ${outer.join(';')}; }`);
    }
  }

  const cols = section.columns || [];
  const colsHtml = cols.map((c, i) => _emitColumn(section, c, i, ctxInner, mediaChunks)).join('\n');

  return `<table role="presentation" class="${secClass}" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${outerBg}" style="background:${outerBg};padding:${outerPadY}px 0;">
<tr><td align="center" style="padding:0;">
<!--[if mso | IE]><table role="presentation" width="${innerWidth}" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="${secClass}-inner" width="${innerWidth}" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:${innerWidth}px;margin:0 auto;background:${innerBg};color:${textColor};font-family:${_fstack(font)};${borderCss}${radiusCss}${bgImgCss}">
<tr><td align="${align}" style="padding:${innerPad};text-align:${align};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${colsHtml}
</tr></table>
</td></tr>
</table>
<!--[if mso | IE]></td></tr></table><![endif]-->
</td></tr>
</table>`;
}

// ───────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────

function docToEmailHtml(doc, opts = {}) {
  const warnings = [];
  const dialect = opts.mergeDialect || 'native';
  const lang = opts.lang || 'en';
  const subject = opts.subject || '';
  const preheader = opts.preheader || '';
  const ctx = {
    dialect,
    lang,
    previewVars: Array.isArray(opts.previewVars) ? opts.previewVars : null,
    exportDateIso: opts.exportDateIso || null,
    font: 'inter',
    warnings,
  };
  const mediaChunks = [];
  const sections = Array.isArray(doc?.sections) ? doc.sections : [];

  // Determine the outer "wall" color — first section's outerBg wins for the
  // body background. Falls back to white if nothing is configured.
  const outerBg = (() => {
    for (const sec of sections) {
      const b = sec?.style?.outerBg;
      if (b && b !== 'transparent') return _safeColor(b, '#ffffff');
    }
    return '#ffffff';
  })();

  const body = sections.map(sec => _emitSection(sec, ctx, mediaChunks)).filter(Boolean).join('\n');

  // Deduplicate + join media rules.
  const mediaRules = Array.from(new Set(mediaChunks)).join('\n  ');
  const styleBlock = `
    /* Hard resets to survive Outlook / Gmail cascade. */
    body, table, td, p, h1, h2, h3, h4, h5, h6 { margin:0; padding:0; }
    img { -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse !important; }
    a { color:inherit; }
    @media (max-width:600px) {
      table.st-outer, .st-sec-inner { width:100% !important; max-width:100% !important; }
      img { max-width:100% !important; height:auto !important; }
      ${mediaRules}
    }
  `;

  const html = `<!DOCTYPE html>
<html lang="${_esc(lang)}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${_esc(subject)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style type="text/css">${styleBlock}</style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background:${outerBg};">
<div style="display:none;font-size:1px;color:transparent;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${_tag(preheader, ctx)}</div>
<!--[if mso | IE]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<div role="article" aria-roledescription="email" lang="${_esc(lang)}" style="background:${outerBg};">
${body}
</div>
<!--[if mso | IE]></td></tr></table><![endif]-->
</body>
</html>`;

  const minify = opts.minify !== false;
  const minifier = typeof window !== 'undefined' ? window.minifyEmailHtml : null;
  const finalHtml = (minify && typeof minifier === 'function') ? minifier(html) : html;
  return { html: finalHtml, warnings: Array.from(new Set(warnings)) };
}

Object.assign(window, {
  docToEmailHtml,
  mapMergeTag,
  tokenizeMergeTags,
});
