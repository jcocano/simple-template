// Review engine — pre-flight checks over a template document.
//
// A check is registered by each category file (src/lib/review/*.tsx) via
// `window.stReview.register({ id, cat, run })`. `run(tpl)` receives the full
// template record ({ doc, meta, vars, … }) and must return either:
//   - null          → the check is not applicable and is hidden
//   - a Sync result → { kind, detailKey?, detailCtx?, detail?, fixes?, count? }
//   - a Promise of the above for async/best-effort checks (image HEAD, etc.)
//
// Result fields:
//   kind       — 'ok' | 'warn' | 'error' | 'info'
//   detailKey  — i18n key to translate (falls back to `review.check.<id>.detail`)
//   detailCtx  — interpolation params for the i18n string ({len}, {count}, …)
//   detail     — raw string, used only if no key resolves
//   fixes      — array of { label?, goSettings?, action? } buttons; label falls
//                back to `review.check.<id>.fix.<i>` via the panel.
//   count      — optional numeric badge data (unused by UI today; kept for future)
//
// `runReview(tpl)` returns an array of normalised result objects in registration
// order so categories group predictably.

const _CHECKS = [];

function registerReviewCheck(def) {
  if (!def || !def.id || !def.cat || typeof def.run !== 'function') return;
  // Replace-on-duplicate so hot-module swaps don't double-register in dev.
  const idx = _CHECKS.findIndex(c => c.id === def.id);
  if (idx >= 0) _CHECKS[idx] = def;
  else _CHECKS.push(def);
}

function _normalize(def, raw) {
  if (raw == null) return null;
  const out = {
    id: def.id,
    cat: def.cat,
    kind: raw.kind || 'info',
    detailKey: raw.detailKey || null,
    detailCtx: raw.detailCtx || null,
    detail: raw.detail || null,
    fixes: Array.isArray(raw.fixes) ? raw.fixes : null,
    count: typeof raw.count === 'number' ? raw.count : null,
  };
  return out;
}

function runReview(tpl) {
  if (!tpl) return [];
  const results = [];
  for (const def of _CHECKS) {
    let raw = null;
    try { raw = def.run(tpl); } catch { raw = null; }
    // Async checks: skipped in the sync path (the panel only reads sync for
    // now; async-capable checks can push updates through runReviewAsync).
    if (raw && typeof raw.then === 'function') continue;
    const norm = _normalize(def, raw);
    if (norm) results.push(norm);
  }
  return results;
}

async function runReviewAsync(tpl, onUpdate) {
  if (!tpl) return [];
  const results = [];
  for (const def of _CHECKS) {
    let raw = null;
    try {
      const v = def.run(tpl);
      raw = (v && typeof v.then === 'function') ? await v : v;
    } catch { raw = null; }
    const norm = _normalize(def, raw);
    if (norm) {
      results.push(norm);
      if (typeof onUpdate === 'function') onUpdate(norm, results.slice());
    }
  }
  return results;
}

// ───────────────────────────────────────────────────────────────────
// Shared helpers for individual checks
// ───────────────────────────────────────────────────────────────────

function _eachBlock(tpl, visit) {
  const sections = (tpl && tpl.doc && Array.isArray(tpl.doc.sections)) ? tpl.doc.sections : [];
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si] || {};
    const cols = Array.isArray(sec.columns) ? sec.columns : [];
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci] || {};
      const blocks = Array.isArray(col.blocks) ? col.blocks : [];
      for (let bi = 0; bi < blocks.length; bi++) {
        visit(blocks[bi] || {}, { section: sec, si, ci, bi });
      }
    }
  }
}

function _getContent(data) {
  if (!data || typeof data !== 'object') return {};
  if (data.content && typeof data.content === 'object') return data.content;
  return data;
}

function _textOfBlock(block) {
  const d = block && block.data ? block.data : {};
  const c = _getContent(d);
  const parts = [];
  if (typeof c.text === 'string') parts.push(c.text);
  if (typeof c.title === 'string') parts.push(c.title);
  if (typeof c.subtitle === 'string') parts.push(c.subtitle);
  if (typeof c.label === 'string') parts.push(c.label);
  if (typeof c.html === 'string') parts.push(c.html.replace(/<[^>]*>/g, ' '));
  if (typeof c.caption === 'string') parts.push(c.caption);
  if (typeof c.body === 'string') parts.push(c.body);
  return parts.join(' ');
}

function _allTextSources(tpl) {
  const out = [];
  const meta = (tpl && tpl.meta) || {};
  if (meta.subject) out.push(String(meta.subject));
  if (meta.preview) out.push(String(meta.preview));
  _eachBlock(tpl, (blk) => {
    const t = _textOfBlock(blk);
    if (t) out.push(t);
  });
  return out;
}

function _emitEmailHtml(tpl) {
  try {
    if (typeof window.docToEmailHtml !== 'function') return null;
    const out = window.docToEmailHtml(tpl.doc || { sections: [] }, {
      subject: (tpl.meta && tpl.meta.subject) || '',
      preheader: (tpl.meta && tpl.meta.preview) || '',
      vars: tpl.vars || [],
      minify: false,
    });
    return (out && out.html) ? out.html : null;
  } catch { return null; }
}

Object.assign(window, {
  stReview: {
    register: registerReviewCheck,
    run: runReview,
    runAsync: runReviewAsync,
    _helpers: { eachBlock: _eachBlock, getContent: _getContent, textOfBlock: _textOfBlock, allTextSources: _allTextSources, emitEmailHtml: _emitEmailHtml },
  },
});
