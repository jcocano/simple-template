// Document export renderers — HTML (email-safe, table-based, inline CSS),
// MJML (editable source for MJML tooling), TXT (plain text).
//
// All three resolve {{vars}} using `template.vars[].sample`. Brand settings
// (fontDisplay, fontBody, address, footer, unsubscribe) are read from the
// current workspace and appended to the legal footer in HTML and MJML.
//
// Public surface:
//   window.stExport.renderHTML(template, { inline, minify, includeTxt })
//   window.stExport.renderMJML(template)
//   window.stExport.renderTXT(template)
//   window.stExport.downloadFile(filename, content, mime)
//   window.stExport.safeFilename(name)

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Variable substitution helper — kept for internal preview/debugging but NOT
// used by the exporters. Mailing platforms (Mailchimp, Sendgrid, Klaviyo,
// Brevo…) interpret `{{var}}` with their own handlebars-like engine at send
// time, so the exported HTML/MJML/TXT must preserve those literals untouched.
// If a future caller wants a fully-resolved preview, call this explicitly.
function resolveVars(s = '', vars) {
  if (!s) return '';
  const map = {};
  for (const v of (vars || [])) if (v && v.key) map[v.key] = v.sample;
  return String(s).replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, key) =>
    map[key] != null ? String(map[key]) : '{{' + key + '}}'
  );
}

function stripTags(s = '') {
  return String(s).replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').trim();
}

// ─── Font stacks (email-safe fallbacks) ─────────────────────────────
const EXPORT_FONT_STACKS = {
  'inter': 'Inter, Helvetica, Arial, sans-serif',
  'inter-tight': '"Inter Tight", Helvetica, Arial, sans-serif',
  'fraunces': 'Fraunces, Georgia, serif',
  'dm-serif': '"DM Serif Display", Georgia, serif',
  'instrument': '"Instrument Serif", Georgia, serif',
  'instrument-serif': '"Instrument Serif", Georgia, serif',
  'playfair': '"Playfair Display", Georgia, serif',
  'space-grotesk': '"Space Grotesk", Helvetica, Arial, sans-serif',
  'ibm-plex': '"IBM Plex Sans", Helvetica, Arial, sans-serif',
  'georgia': 'Georgia, serif',
  'helvetica': 'Helvetica, Arial, sans-serif',
  'arial': 'Arial, Helvetica, sans-serif',
  'system': '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", sans-serif',
};
function fontStack(f) {
  if (!f) return 'Helvetica, Arial, sans-serif';
  const key = String(f).toLowerCase();
  if (EXPORT_FONT_STACKS[key]) return EXPORT_FONT_STACKS[key];
  return /\s/.test(f) ? `"${f}", Helvetica, Arial, sans-serif` : `${f}, Helvetica, Arial, sans-serif`;
}

function padCss(sp) {
  if (!sp) return '0';
  if (Array.isArray(sp)) return `${sp[0] || 0}px ${sp[1] || 0}px ${sp[2] || 0}px ${sp[3] || 0}px`;
  if (typeof sp === 'number') return `${sp}px`;
  return '0';
}

function getContent(data = {}) {
  const { style, content, spacing, ...flat } = data || {};
  return { ...flat, ...(content || {}) };
}

// ═══════════════════════════════════════════════════════════════════
// HTML RENDERER
// ═══════════════════════════════════════════════════════════════════

function renderHTMLBlock(block, ctx) {
  const s = block.data?.style || {};
  const c = getContent(block.data);
  const V = ctx.V;
  const U = ctx.U;
  const font = fontStack(s.font || ctx.font);
  const align = s.align || 'left';
  const padding = padCss(block.data?.spacing?.padding) || '0';

  switch (block.type) {
    case 'header': {
      const centered = s.layout === 'center';
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${padding};">
<tr>
<td align="${centered ? 'center' : 'left'}" style="font-family:${font};">
<div style="font-weight:700;font-size:${s.logoSize || 18}px;letter-spacing:-0.3px;color:${s.color || 'inherit'};">${V(c.brand || 'Acme')}</div>
${!centered ? `<div style="font-size:12px;color:${s.subColor || '#888'};font-family:Consolas,Menlo,monospace;margin-top:2px;">${V(c.sub || '')}</div>` : ''}
</td>
</tr>
</table>`;
    }

    case 'hero': {
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${padding};">
<tr>
<td align="${align}" style="font-family:${font};">
<h1 style="margin:0 0 12px;font-size:${s.titleSize || 30}px;line-height:1.15;letter-spacing:-0.5px;font-weight:${s.titleWeight || 600};color:${s.titleColor || 'inherit'};">${V(c.heading || '')}</h1>
<p style="margin:0;font-size:${s.bodySize || 15}px;line-height:1.55;opacity:0.82;color:${s.bodyColor || 'inherit'};">${V(c.body || '')}</p>
</td>
</tr>
</table>`;
    }

    case 'heading': {
      const level = s.level || 2;
      const sizes = { 1: 32, 2: 24, 3: 20, 4: 17, 5: 15, 6: 13 };
      const size = s.size || sizes[level];
      return `<h${level} style="margin:0;padding:${padding};font-size:${size}px;line-height:${s.lh || 1.2};letter-spacing:${s.tracking != null ? s.tracking + 'px' : '-0.3px'};font-weight:${s.weight || 600};color:${s.color || 'inherit'};text-align:${align};font-family:${font};">${V(c.text || '')}</h${level}>`;
    }

    case 'text': {
      return `<p style="margin:0;padding:${padding};font-size:${s.size || 14}px;line-height:${s.lh || 1.55};color:${s.color || 'inherit'};text-align:${align};font-family:${font};font-weight:${s.weight || 400};${s.italic ? 'font-style:italic;' : ''}${s.underline ? 'text-decoration:underline;' : ''}">${V(c.body || '')}</p>`;
    }

    case 'button': {
      const fullWidth = s.width === 'full';
      const btnStyle = [
        `display:${fullWidth ? 'block' : 'inline-block'}`,
        `padding:${s.padY || 12}px ${s.padX || 22}px`,
        `background:${s.bg || '#1a1a17'}`,
        `color:${s.color || '#ffffff'}`,
        `font-weight:${s.weight || 500}`,
        `border-radius:${s.radius != null ? s.radius : 4}px`,
        `text-decoration:none`,
        `font-size:${s.size || 14}px`,
        `font-family:${font}`,
        s.borderW ? `border:${s.borderW}px solid ${s.borderColor || '#000'}` : 'border:none',
        s.shadow ? `box-shadow:${s.shadow}` : '',
        fullWidth ? 'width:100%' : '',
        'text-align:center',
      ].filter(Boolean).join(';');
      return `<div style="padding:${padding};text-align:${s.align || 'center'};"><a href="${U(c.url || '#')}" style="${btnStyle};">${V(c.label || 'Llámame a la acción')}</a></div>`;
    }

    case 'image': {
      const width = s.width || 100;
      const ratio = (s.ratio || '2/1').split('/').map(n => parseFloat(n));
      const alt = V(c.alt || 'Imagen');
      const src = c.src;
      if (src) {
        return `<div style="padding:${padding};text-align:${s.align || 'center'};">
<img src="${escapeHtml(src)}" alt="${alt}" width="${width}%" style="display:inline-block;width:${width}%;max-width:100%;height:auto;border:0;border-radius:${s.radius || 0}px;"/>
</div>`;
      }
      // Placeholder — colored table cell so the exported email still renders
      // meaningfully when there's no uploaded image yet.
      const h = Math.round(600 * (ratio[1] / ratio[0]) * (width / 100));
      return `<div style="padding:${padding};text-align:${s.align || 'center'};">
<table role="presentation" width="${width}%" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;width:${width}%;max-width:100%;">
<tr><td align="center" bgcolor="#e8eddd" style="background:#e8eddd;color:#6a6a8a;font-family:${font};font-size:12px;height:${h}px;border-radius:${s.radius || 0}px;">${alt}</td></tr>
</table>
</div>`;
    }

    case 'divider': {
      return `<div style="padding:${padding};text-align:${s.align || 'center'};">
<table role="presentation" width="${s.width || 100}%" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;width:${s.width || 100}%;">
<tr><td style="border-top:${s.thickness || 1}px ${s.style || 'solid'} ${s.color || '#d9d9d9'};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
</table>
</div>`;
    }

    case 'spacer': {
      const h = s.h || block.data?.h || 24;
      return `<div style="height:${h}px;line-height:${h}px;font-size:0;background:${s.bg || 'transparent'};">&nbsp;</div>`;
    }

    case 'icon': {
      const mode = s.mode || 'icon';
      const size = s.size || 32;
      const justify = s.align === 'left' ? 'left' : s.align === 'right' ? 'right' : 'center';
      const emoji = c.emoji || '✨';
      const text = V(c.text || '');
      const gap = s.gap != null ? s.gap : 10;
      return `<div style="padding:${padding};text-align:${justify};font-family:${font};">
${(mode === 'icon' || mode === 'icon-text') ? `<span style="font-size:${size}px;line-height:1;color:${s.color || 'inherit'};vertical-align:middle;">${escapeHtml(emoji)}</span>` : ''}
${(mode === 'icon-text') ? `<span style="display:inline-block;width:${gap}px;">&nbsp;</span>` : ''}
${(mode === 'text' || mode === 'icon-text') ? `<span style="font-size:${s.textSize || 14}px;font-weight:${s.textWeight || 500};color:${s.textColor || 'inherit'};vertical-align:middle;">${text}</span>` : ''}
</div>`;
    }

    case 'product': {
      return `<div style="padding:${padding};font-family:${font};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" bgcolor="#e8eddd" style="background:#e8eddd;color:#6a6a8a;font-size:12px;height:160px;border-radius:${s.radius || 0}px;">${V(c.name || 'Producto')}</td></tr>
<tr><td style="padding:10px 0 0;font-size:${s.nameSize || 13}px;font-weight:500;color:${s.nameColor || 'inherit'};">${V(c.name || 'Producto')}</td></tr>
<tr><td style="font-size:12px;opacity:0.7;font-family:Consolas,Menlo,monospace;color:${s.priceColor || 'inherit'};">${V(c.price || '$0')}</td></tr>
</table>
</div>`;
    }

    case 'footer': {
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:${padding};">
<tr>
<td align="${align}" style="font-family:${font};font-size:${s.size || 12}px;line-height:1.6;color:${s.color || 'inherit'};">
<div style="margin-bottom:6px;font-weight:500;">${V(c.company || '')}</div>
<div style="opacity:0.8;">${V(c.notice || '')}</div>
</td>
</tr>
</table>`;
    }

    case 'social': {
      const active = c.active || ['f', 't', 'i', 'in'];
      const justify = s.align === 'left' ? 'left' : s.align === 'right' ? 'right' : 'center';
      const size = s.size || 28;
      const cells = active.map((l) =>
        `<td style="padding:0 ${(s.gap || 12) / 2}px;">
<div style="width:${size}px;height:${size}px;border-radius:${s.shape === 'square' ? 4 : size}px;background:${s.color || '#1a1a17'};color:#fff;display:inline-block;line-height:${size}px;text-align:center;font-size:11px;font-weight:600;">${escapeHtml(l)}</div>
</td>`
      ).join('');
      return `<div style="padding:${padding};text-align:${justify};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;"><tr>${cells}</tr></table>
</div>`;
    }

    case 'html': {
      return `<div style="padding:${padding};">${c.code || ''}</div>`;
    }

    default:
      return `<!-- unsupported block: ${block.type} -->`;
  }
}

function renderHTMLSection(section, ctx) {
  const s = section.style || {};
  const font = fontStack(s.font || ctx.font);
  const sectionCtx = { ...ctx, font: s.font || ctx.font };
  const padding = typeof s.padding === 'number' ? `${s.padding}px` : padCss(s.padding);

  const cols = (section.columns || []).filter(col => col);
  const isMultiCol = cols.length > 1;

  let innerHTML;
  if (isMultiCol) {
    // Multi-column: outer table with each column as a <td> of the given width%.
    // Email clients don't support flex, so we use inline-block tables inside cells.
    const colCells = cols.map((col) => {
      const blocksHTML = (col.blocks || []).map(b => renderHTMLBlock(b, sectionCtx)).join('\n');
      return `<td valign="top" width="${col.w}%" style="width:${col.w}%;padding:0 8px;">${blocksHTML}</td>`;
    }).join('');
    innerHTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${colCells}</tr></table>`;
  } else {
    const col = cols[0] || { blocks: [] };
    innerHTML = (col.blocks || []).map(b => renderHTMLBlock(b, sectionCtx)).join('\n');
  }

  const bg = s.bg || '#ffffff';
  const textColor = s.text || '#1a1a17';
  const hasGradient = /gradient/i.test(bg);

  return `<tr>
<td bgcolor="${hasGradient ? '#ffffff' : bg}" align="${s.align || 'left'}" style="background:${bg};color:${textColor};padding:${padding};font-family:${font};">
${innerHTML}
</td>
</tr>`;
}

function renderLegalFooterHTML(brand, ctx) {
  const parts = [];
  const V = ctx.V;
  const U = ctx.U;
  if (brand.address) parts.push(V(brand.address));
  if (brand.footer) parts.push(V(brand.footer));
  if (brand.unsubscribe) {
    parts.push(`<a href="${U(brand.unsubscribe)}" style="color:#888;text-decoration:underline;">Darme de baja</a>`);
  }
  if (parts.length === 0) return '';
  return `<tr>
<td align="center" style="padding:24px 32px;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#888;background:#f6f5f1;">
${parts.join(' · ')}
</td>
</tr>`;
}

function renderHTML(template, opts = {}) {
  const { minify = false, includeTxt = false, resolveVars: doResolve = false } = opts;
  if (!template) return '';
  const sections = Array.isArray(template.doc?.sections)
    ? template.doc.sections
    : (Array.isArray(template.doc) ? template.doc : []);

  const brand = (typeof window !== 'undefined' && window.stStorage)
    ? (window.stStorage.getWSSetting('brand', {}) || {})
    : {};

  const vars = template.vars || [];
  // V: escape text value for HTML context. U: same for URL/href context.
  // When `resolveVars` is true, substitute `{{key}}` with `vars[key].sample`
  // first (used by Preview and Test Send). When false (default — Export),
  // keep `{{key}}` literal so mailing platforms (Mailchimp/Sendgrid/Klaviyo…)
  // can handle the substitution at send time.
  const V = doResolve
    ? (t) => escapeHtml(resolveVars(t || '', vars))
    : (t) => escapeHtml(t || '');
  const U = doResolve
    ? (t) => escapeHtml(resolveVars(t || '', vars))
    : (t) => escapeHtml(t || '');

  const ctx = {
    vars,
    font: brand.fontBody || 'inter',
    brand,
    V,
    U,
  };

  const sectionsHTML = sections.map(sec => renderHTMLSection(sec, ctx)).join('\n');
  const legalFooter = renderLegalFooterHTML(brand, ctx);

  const subject = escapeHtml(template.meta?.subject || template.name || 'Correo');
  const preview = escapeHtml(template.meta?.preview || '');
  const bodyFont = fontStack(brand.fontBody || 'inter');

  let html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f6f5f1;font-family:${bodyFont};">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f5f1" style="background:#f6f5f1;">
<tr>
<td align="center" style="padding:24px 0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
${sectionsHTML}
${legalFooter}
</table>
</td>
</tr>
</table>
${includeTxt ? `<!--[TXT]\n${renderTXT(template)}\n[/TXT]-->` : ''}
</body>
</html>`;

  if (minify) {
    html = html
      .replace(/\n+/g, '')
      .replace(/>\s+</g, '><')
      .replace(/[ \t]{2,}/g, ' ');
  }
  return html;
}

// ═══════════════════════════════════════════════════════════════════
// MJML RENDERER
// ═══════════════════════════════════════════════════════════════════

function renderMJMLBlock(block, ctx) {
  const s = block.data?.style || {};
  const c = getContent(block.data);
  const V = ctx.V;
  const U = ctx.U;
  const font = s.font ? `font-family="${fontStack(s.font)}"` : '';

  switch (block.type) {
    case 'header': {
      const centered = s.layout === 'center';
      return `        <mj-text align="${centered ? 'center' : 'left'}" font-weight="700" font-size="${s.logoSize || 18}px" ${font}>${V(c.brand || 'Acme')}</mj-text>${c.sub && !centered ? `\n        <mj-text align="left" font-size="12px" color="${s.subColor || '#888'}">${V(c.sub)}</mj-text>` : ''}`;
    }
    case 'hero':
      return `        <mj-text font-size="${s.titleSize || 30}px" font-weight="${s.titleWeight || 600}" align="${s.align || 'left'}" ${font}>${V(c.heading || '')}</mj-text>
        <mj-text font-size="${s.bodySize || 15}px" line-height="1.55" align="${s.align || 'left'}" ${font}>${V(c.body || '')}</mj-text>`;
    case 'heading':
      return `        <mj-text font-size="${s.size || 24}px" font-weight="${s.weight || 600}" align="${s.align || 'left'}" ${font}>${V(c.text || '')}</mj-text>`;
    case 'text':
      return `        <mj-text font-size="${s.size || 14}px" line-height="${s.lh || 1.55}" align="${s.align || 'left'}" ${font}>${V(c.body || '')}</mj-text>`;
    case 'button':
      return `        <mj-button href="${U(c.url || '#')}" background-color="${s.bg || '#1a1a17'}" color="${s.color || '#ffffff'}" font-size="${s.size || 14}px" border-radius="${s.radius != null ? s.radius : 4}px" align="${s.align || 'center'}" ${font}>${V(c.label || 'Llámame a la acción')}</mj-button>`;
    case 'image':
      return `        <mj-image src="${U(c.src || 'https://via.placeholder.com/600x300?text=Imagen')}" alt="${V(c.alt || 'Imagen')}" width="${s.width || 100}%" border-radius="${s.radius || 0}px"/>`;
    case 'divider':
      return `        <mj-divider border-color="${s.color || '#d9d9d9'}" border-width="${s.thickness || 1}px" border-style="${s.style || 'solid'}" width="${s.width || 100}%"/>`;
    case 'spacer':
      return `        <mj-spacer height="${s.h || block.data?.h || 24}px"/>`;
    case 'icon': {
      const emoji = c.emoji || '✨';
      const txt = V(c.text || '');
      return `        <mj-text align="${s.align || 'center'}" font-size="${s.textSize || 14}px">${escapeHtml(emoji)} ${txt}</mj-text>`;
    }
    case 'product':
      return `        <mj-image src="${U(c.img || 'https://via.placeholder.com/300x300?text=Producto')}" alt="${V(c.name || 'Producto')}"/>
        <mj-text font-size="${s.nameSize || 13}px" font-weight="500">${V(c.name || 'Producto')}</mj-text>
        <mj-text font-size="12px" color="#888">${V(c.price || '$0')}</mj-text>`;
    case 'footer':
      return `        <mj-text font-size="${s.size || 12}px" align="${s.align || 'left'}" line-height="1.6">${V(c.company || '')}</mj-text>${c.notice ? `\n        <mj-text font-size="${s.size || 12}px" color="#888" align="${s.align || 'left'}">${V(c.notice)}</mj-text>` : ''}`;
    case 'social': {
      const active = c.active || ['f', 't', 'i', 'in'];
      const elems = active.map(l => `<mj-social-element name="${l === 'f' ? 'facebook' : l === 't' ? 'twitter' : l === 'i' ? 'instagram' : 'linkedin'}"/>`).join('\n          ');
      return `        <mj-social align="${s.align || 'center'}">\n          ${elems}\n        </mj-social>`;
    }
    case 'html':
      return `        <mj-raw>${c.code || ''}</mj-raw>`;
    default:
      return `        <!-- unsupported block: ${block.type} -->`;
  }
}

function renderMJMLSection(section, ctx) {
  const s = section.style || {};
  const sectionCtx = { ...ctx, font: s.font || ctx.font };
  const padding = typeof s.padding === 'number' ? `${s.padding}px` : '32px';
  const bg = s.bg || '#ffffff';
  const textColor = s.text || '#1a1a17';

  const cols = (section.columns || []).filter(col => col);
  const colsXml = cols.map(col => {
    const blocksXml = (col.blocks || []).map(b => renderMJMLBlock(b, sectionCtx)).join('\n');
    return `      <mj-column width="${col.w}%">\n${blocksXml}\n      </mj-column>`;
  }).join('\n');

  return `    <mj-section background-color="${bg}" padding="${padding}" color="${textColor}" text-align="${s.align || 'left'}">
${colsXml}
    </mj-section>`;
}

function renderMJML(template, opts = {}) {
  const { resolveVars: doResolve = false } = opts;
  if (!template) return '';
  const sections = Array.isArray(template.doc?.sections)
    ? template.doc.sections
    : (Array.isArray(template.doc) ? template.doc : []);

  const brand = (typeof window !== 'undefined' && window.stStorage)
    ? (window.stStorage.getWSSetting('brand', {}) || {})
    : {};

  const vars = template.vars || [];
  const V = doResolve
    ? (t) => escapeHtml(resolveVars(t || '', vars))
    : (t) => escapeHtml(t || '');
  const U = V; // MJML: URLs escaped same as text

  const ctx = { vars, font: brand.fontBody || 'inter', brand, V, U };
  const sectionsXml = sections.map(sec => renderMJMLSection(sec, ctx)).join('\n');
  const subject = template.meta?.subject || template.name || 'Correo';
  const preview = template.meta?.preview || '';
  const bodyFont = fontStack(brand.fontBody || 'inter');

  const legalParts = [];
  if (brand.address) legalParts.push(`<mj-text font-size="11px" color="#888" align="center">${V(brand.address)}</mj-text>`);
  if (brand.footer) legalParts.push(`<mj-text font-size="11px" color="#888" align="center">${V(brand.footer)}</mj-text>`);
  if (brand.unsubscribe) legalParts.push(`<mj-text font-size="11px" color="#888" align="center"><a href="${U(brand.unsubscribe)}" style="color:#888;">Darme de baja</a></mj-text>`);
  const legal = legalParts.length
    ? `    <mj-section background-color="#f6f5f1" padding="24px">\n      <mj-column>\n        ${legalParts.join('\n        ')}\n      </mj-column>\n    </mj-section>`
    : '';

  return `<mjml>
  <mj-head>
    <mj-title>${escapeHtml(subject)}</mj-title>
    <mj-preview>${escapeHtml(preview)}</mj-preview>
    <mj-attributes>
      <mj-all font-family="${bodyFont}"/>
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f6f5f1">
${sectionsXml}
${legal}
  </mj-body>
</mjml>`;
}

// ═══════════════════════════════════════════════════════════════════
// TXT RENDERER
// ═══════════════════════════════════════════════════════════════════

function renderTXTBlock(block, ctx) {
  const c = getContent(block.data);
  const R = ctx.R;

  switch (block.type) {
    case 'header': {
      const lines = [R(c.brand || 'Acme')];
      if (c.sub) lines.push(R(c.sub));
      return lines.join('\n');
    }
    case 'hero':
      return [R(c.heading || ''), '', R(c.body || '')].filter(Boolean).join('\n');
    case 'heading':
      return R(c.text || '');
    case 'text':
      return R(c.body || '');
    case 'button': {
      const label = R(c.label || 'Llámame a la acción');
      const url = R(c.url || '');
      return url ? `${label}: ${url}` : `[${label}]`;
    }
    case 'image':
      return c.alt ? `[Imagen: ${R(c.alt)}]` : '[Imagen]';
    case 'divider':
      return '──────────────────────────────';
    case 'spacer':
      return '';
    case 'icon': {
      const txt = R(c.text || '');
      return txt ? `${c.emoji || '*'} ${txt}` : '';
    }
    case 'product': {
      const name = R(c.name || 'Producto');
      const price = R(c.price || '');
      return price ? `${name} — ${price}` : name;
    }
    case 'footer': {
      const out = [];
      if (c.company) out.push(R(c.company));
      if (c.notice) out.push(R(c.notice));
      return out.join('\n');
    }
    case 'social':
      return '[Redes sociales]';
    case 'html':
      return stripTags(c.code || '');
    default:
      return '';
  }
}

function renderTXT(template, opts = {}) {
  const { resolveVars: doResolve = false } = opts;
  if (!template) return '';
  const sections = Array.isArray(template.doc?.sections)
    ? template.doc.sections
    : (Array.isArray(template.doc) ? template.doc : []);

  const brand = (typeof window !== 'undefined' && window.stStorage)
    ? (window.stStorage.getWSSetting('brand', {}) || {})
    : {};
  const vars = template.vars || [];
  const R = doResolve
    ? (t) => resolveVars(t || '', vars)
    : (t) => String(t || '');
  const ctx = { vars, R };

  const sectionChunks = sections.map(section => {
    const colChunks = (section.columns || []).map(col =>
      (col.blocks || []).map(b => renderTXTBlock(b, ctx)).filter(s => s !== null && s !== undefined).join('\n\n')
    );
    return colChunks.filter(Boolean).join('\n\n');
  }).filter(Boolean);

  const legal = [];
  if (brand.address) legal.push(R(brand.address));
  if (brand.footer) legal.push(R(brand.footer));
  if (brand.unsubscribe) legal.push(`Darme de baja: ${brand.unsubscribe}`);

  return [
    ...sectionChunks,
    ...(legal.length ? ['──────────────────────────────', legal.join('\n')] : []),
  ].join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// ═══════════════════════════════════════════════════════════════════
// DOWNLOAD HELPERS
// ═══════════════════════════════════════════════════════════════════

function safeFilename(name) {
  return String(name || 'correo')
    .toLowerCase()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'correo';
}

function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Reemplaza todas las URLs `st-img://{wsId}/{file}` que aparecen en `src="…"`
// o `href="…"` dentro de un string (HTML o MJML) por data URLs base64 leídas
// del disco vía IPC. Las URLs repetidas se resuelven una sola vez (cache).
//
// Idempotente: si no hay matches, devuelve el string sin overhead. Si alguna
// URL no se puede leer (archivo borrado, etc.), la deja tal cual y sigue —
// el correo renderizará con imagen rota, pero no falla todo el export.
async function inlineImages(str) {
  if (typeof str !== 'string' || !str.includes('st-img://')) return str;
  if (!window.cdn || typeof window.cdn.readLocalAsDataUrl !== 'function') return str;

  const urls = Array.from(new Set(
    (str.match(/st-img:\/\/[^\s"'<>)]+/g) || [])
  ));
  if (urls.length === 0) return str;

  const cache = new Map();
  await Promise.all(urls.map(async (url) => {
    try {
      const result = await window.cdn.readLocalAsDataUrl(url);
      if (result?.ok && result.dataUrl) cache.set(url, result.dataUrl);
    } catch (err) {
      console.warn('[stExport] inline failed', url, err);
    }
  }));

  let out = str;
  for (const [url, dataUrl] of cache) {
    // Regex-escape the URL for global replace (no special chars expected but
    // be safe). `split/join` avoids needing a full escape.
    out = out.split(url).join(dataUrl);
  }

  const sizeKB = Math.round(new Blob([out]).size / 1024);
  if (sizeKB > 100) {
    console.info(`[stExport] Salida grande: ${sizeKB} KB tras inline. Algunos clientes truncan correos pesados.`);
  }
  return out;
}

const stExport = {
  renderHTML,
  renderMJML,
  renderTXT,
  inlineImages,
  downloadFile,
  safeFilename,
};

Object.assign(window, { stExport });
