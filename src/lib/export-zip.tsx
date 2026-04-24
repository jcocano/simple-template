// ZIP export — bundles index.html + local assets (st-img://) into a downloadable
// archive. External https:// URLs stay untouched; the recipient's mail client
// loads them on open.

async function buildZip(template, opts = {}) {
  const { default: JSZip } = await import('jszip');
  const docFn = window.docToEmailHtml;
  if (typeof docFn !== 'function' || !template?.doc) {
    throw new Error(window.stI18n.t('export.err.docToHtmlUnavailableOrEmpty'));
  }
  const result = docFn(template.doc, {
    lang: opts.lang,
    mergeDialect: opts.mergeDialect,
    subject: template.meta?.subject || template.name || '',
    preheader: template.meta?.preheader || '',
    minify: opts.minify !== false,
  });
  let html = result.html;
  const warnings = result.warnings || [];

  const zip = new JSZip();
  const imgFolder = zip.folder('images');

  const stImgUrls = Array.from(new Set(html.match(/st-img:\/\/[^\s"'<>)]+/g) || []));
  const rewrites = new Map();
  const usedNames = new Set();

  const dedup = (base) => {
    let name = base;
    let i = 2;
    while (usedNames.has(name)) {
      const dot = base.lastIndexOf('.');
      name = dot > 0 ? `${base.slice(0, dot)}-${i}${base.slice(dot)}` : `${base}-${i}`;
      i++;
    }
    usedNames.add(name);
    return name;
  };

  for (const url of stImgUrls) {
    try {
      const res = await window.cdn?.readLocalAsDataUrl?.(url);
      if (!res?.ok || !res.dataUrl) continue;
      const m = res.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) continue;
      const [, mime, b64] = m;
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const ext = (mime.split('/')[1] || 'bin').split('+')[0];
      const rawName = (url.split('/').pop() || 'img').split('?')[0];
      const base = window.stExport.safeFilename(rawName.replace(/\.[^.]+$/, '')) + '.' + ext;
      const name = dedup(base);
      imgFolder.file(name, bytes);
      rewrites.set(url, `images/${name}`);
    } catch (_) {}
  }

  for (const [from, to] of rewrites) html = html.split(from).join(to);

  zip.file('index.html', html);
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = window.stExport.safeFilename(template?.name) + '.zip';
  return { blob, filename, warnings };
}

Object.assign(window, {
  stExportZip: { buildZip },
});

if (window.stExport) {
  window.stExport.buildZip = buildZip;
}
