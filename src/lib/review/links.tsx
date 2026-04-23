// Links-category pre-flight review checks — l1, l2.
//
// No backend: we can't do real HTTP reachability from the renderer without
// running into CORS. These checks are purely syntactic/heuristic:
//
//   l1 — Enlaces rotos o placeholder: harvests every href in the template
//        (block fields + hrefs extracted from any block HTML + hrefs scraped
//        from the emitted email HTML when available) and classifies each as
//        unsafe / empty / malformed / placeholder / ok. Severity ladder:
//        unsafe > empty > malformed > placeholder > ok.
//   l2 — mailto sin dirección: pulls the mailto: entries out of the same
//        harvested list and flags any that don't match a loose
//        local-part@domain.tld shape (or are bare `mailto:`).
//
// Both checks de-dupe via a Set keyed on the raw href string, so the same
// href repeated across blocks and the emitted HTML only counts once. Relative
// paths (`/contact`) and protocol-relative (`//cdn.example.com`) fail
// `new URL(href)` without a base, so we explicitly treat them as ok —
// they're valid in an email once the host rewrites them.

(function registerLinkChecks() {
  if (!window.stReview || typeof window.stReview.register !== 'function') return;

  // ── i18n keys (es + en) ─────────────────────────────────────────────
  window.stI18nDict = window.stI18nDict || {};
  window.stI18nDict.es = window.stI18nDict.es || {};
  window.stI18nDict.en = window.stI18nDict.en || {};
  window.stI18nDict.pt = window.stI18nDict.pt || {};
  window.stI18nDict.fr = window.stI18nDict.fr || {};
  window.stI18nDict.ja = window.stI18nDict.ja || {};
  window.stI18nDict.zh = window.stI18nDict.zh || {};

  Object.assign(window.stI18nDict.es, {
    'review.check.l1.unsafe': 'Enlace con protocolo inseguro detectado: {example}. Gmail y Outlook lo bloquearán.',
    'review.check.l1.empty': '{count} enlace(s) sin destino (href vacío o #).',
    'review.check.l1.malformed': '{count} enlace(s) con URL mal formada.',
    'review.check.l1.placeholder': '{count} enlace(s) apuntan a placeholder: {examples}.',
    'review.check.l1.ok': '{count} enlaces revisados, todos con formato válido.',
    'review.check.l2.bad': '{count} enlace(s) mailto sin dirección válida (ej. "mailto:" solo).',
    'review.check.l2.ok': '{count} enlaces mailto con formato correcto.',
  });

  Object.assign(window.stI18nDict.en, {
    'review.check.l1.unsafe': 'Unsafe protocol link detected: {example}. Gmail and Outlook will block it.',
    'review.check.l1.empty': '{count} link(s) with no destination (empty href or #).',
    'review.check.l1.malformed': '{count} link(s) with malformed URL.',
    'review.check.l1.placeholder': '{count} link(s) point to placeholder: {examples}.',
    'review.check.l1.ok': '{count} links reviewed, all well-formed.',
    'review.check.l2.bad': '{count} mailto link(s) without a valid address (e.g. bare "mailto:").',
    'review.check.l2.ok': '{count} mailto links well-formed.',
  });

  Object.assign(window.stI18nDict.pt, {
    'review.check.l1.unsafe': 'Link com protocolo inseguro detectado: {example}. Gmail e Outlook vão bloqueá-lo.',
    'review.check.l1.empty': '{count} link(s) sem destino (href vazio ou #).',
    'review.check.l1.malformed': '{count} link(s) com URL mal formada.',
    'review.check.l1.placeholder': '{count} link(s) apontam para placeholder: {examples}.',
    'review.check.l1.ok': '{count} links revisados, todos bem formados.',
    'review.check.l2.bad': '{count} link(s) mailto sem endereço válido (ex. "mailto:" sozinho).',
    'review.check.l2.ok': '{count} links mailto bem formados.',
  });

  Object.assign(window.stI18nDict.fr, {
    'review.check.l1.unsafe': 'Lien avec protocole non sécurisé détecté : {example}. Gmail et Outlook le bloqueront.',
    'review.check.l1.empty': '{count} lien(s) sans destination (href vide ou #).',
    'review.check.l1.malformed': '{count} lien(s) avec URL mal formée.',
    'review.check.l1.placeholder': '{count} lien(s) pointent vers un placeholder : {examples}.',
    'review.check.l1.ok': '{count} liens vérifiés, tous bien formés.',
    'review.check.l2.bad': '{count} lien(s) mailto sans adresse valide (ex. "mailto:" seul).',
    'review.check.l2.ok': '{count} liens mailto bien formés.',
  });

  Object.assign(window.stI18nDict.ja, {
    'review.check.l1.unsafe': '安全でないプロトコルのリンクを検出: {example}。Gmail と Outlook はブロックします。',
    'review.check.l1.empty': '{count} 件のリンクに遷移先がありません (href が空または #)。',
    'review.check.l1.malformed': '{count} 件のリンクの URL が不正です。',
    'review.check.l1.placeholder': '{count} 件のリンクがプレースホルダーを指しています: {examples}。',
    'review.check.l1.ok': '{count} 件のリンクを確認、すべて正常な形式です。',
    'review.check.l2.bad': '{count} 件の mailto リンクに有効なアドレスがありません (例: "mailto:" のみ)。',
    'review.check.l2.ok': '{count} 件の mailto リンクは正しい形式です。',
  });

  Object.assign(window.stI18nDict.zh, {
    'review.check.l1.unsafe': '检测到不安全协议的链接：{example}。Gmail 和 Outlook 会将其拦截。',
    'review.check.l1.empty': '{count} 个链接没有目标 (href 为空或 #)。',
    'review.check.l1.malformed': '{count} 个链接的 URL 格式错误。',
    'review.check.l1.placeholder': '{count} 个链接指向占位符：{examples}。',
    'review.check.l1.ok': '已检查 {count} 个链接，格式均正确。',
    'review.check.l2.bad': '{count} 个 mailto 链接缺少有效地址 (例如仅 "mailto:")。',
    'review.check.l2.ok': '{count} 个 mailto 链接格式正确。',
  });

  // ── helpers ─────────────────────────────────────────────────────────
  const helpers = (window.stReview && window.stReview._helpers) || {};
  const eachBlock = typeof helpers.eachBlock === 'function' ? helpers.eachBlock : function () {};
  const getContent = typeof helpers.getContent === 'function'
    ? helpers.getContent
    : function (d) { return (d && typeof d === 'object' && d.content && typeof d.content === 'object') ? d.content : (d || {}); };
  const emitEmailHtml = typeof helpers.emitEmailHtml === 'function' ? helpers.emitEmailHtml : null;

  const t = function (key, params) {
    return (window.stI18n && typeof window.stI18n.t === 'function')
      ? window.stI18n.t(key, params)
      : key;
  };

  const HREF_RE = /href\s*=\s*["']([^"']+)["']/gi;
  const PLACEHOLDER_NEEDLES = ['example.com', 'example.org', 'todo', 'tu-sitio', 'placeholder', 'localhost', 'xxx'];
  const MAILTO_VALID_RE = /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/i;

  function _scrapeHtmlHrefs(html, bag) {
    if (typeof html !== 'string' || !html) return;
    HREF_RE.lastIndex = 0;
    let m;
    while ((m = HREF_RE.exec(html)) !== null) {
      const href = m[1];
      if (typeof href === 'string') bag.add(href);
    }
  }

  function _pushFromBlock(blk, bag) {
    if (!blk || typeof blk !== 'object') return;
    const type = blk.type;
    const data = blk.data || {};
    const content = getContent(data) || {};

    // Common href fields across button, cta, image, hero, etc.
    const candidates = [
      data.href, content.href,
      data.url, content.url,
    ];
    for (let i = 0; i < candidates.length; i++) {
      const v = candidates[i];
      if (typeof v === 'string' && v.length > 0) bag.add(v);
    }

    // Social: links[] with .url or .href
    if (type === 'social') {
      const list = Array.isArray(data.links) ? data.links
        : (Array.isArray(content.links) ? content.links : []);
      for (let i = 0; i < list.length; i++) {
        const it = list[i] || {};
        if (typeof it.url === 'string' && it.url) bag.add(it.url);
        if (typeof it.href === 'string' && it.href) bag.add(it.href);
      }
    }

    // Blocks that can carry rich HTML — scrape hrefs out.
    const htmlCandidates = [content.html, data.html];
    for (let i = 0; i < htmlCandidates.length; i++) {
      _scrapeHtmlHrefs(htmlCandidates[i], bag);
    }
  }

  function _harvestHrefs(tpl) {
    const bag = new Set();

    // Preferred: emit the full email HTML once and scrape. Catches everything
    // the real send would contain in a single pass.
    if (emitEmailHtml) {
      try {
        const html = emitEmailHtml(tpl);
        if (typeof html === 'string' && html) _scrapeHtmlHrefs(html, bag);
      } catch (_) {
        // fall through — we still walk blocks below
      }
    }

    // Always walk blocks too — guarantees coverage when emitEmailHtml is
    // unavailable or throws, and picks up data-shape-only fields (href,
    // url, social.links[]) that might not make it verbatim into the HTML.
    try {
      eachBlock(tpl, function (blk) { _pushFromBlock(blk, bag); });
    } catch (_) { /* best-effort */ }

    return Array.from(bag);
  }

  function _classify(href) {
    if (typeof href !== 'string') return 'empty';
    const raw = href;
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();

    if (!trimmed) return 'empty';
    if (trimmed === '#') return 'empty';
    if (trimmed.charAt(0) === '#') return 'empty'; // in-email anchors: treat as placeholder/empty
    if (lower.indexOf('javascript:') === 0) return 'unsafe';
    if (lower.indexOf('vbscript:') === 0) return 'unsafe';
    if (lower.indexOf('mailto:') === 0) return 'mailto';   // l2 handles these
    if (lower.indexOf('tel:') === 0) return 'ok';

    for (let i = 0; i < PLACEHOLDER_NEEDLES.length; i++) {
      if (lower.indexOf(PLACEHOLDER_NEEDLES[i]) !== -1) return 'placeholder';
    }

    // Relative (`/foo`, `foo/bar`) and protocol-relative (`//cdn.x`) URLs
    // are valid in emails once a host is rewriting them; `new URL(href)`
    // without a base would reject them. Accept them as ok.
    if (trimmed.charAt(0) === '/') return 'ok';
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) === false) {
      // No scheme: treat as relative/ok (e.g. "contact.html").
      // We've already rejected empty/# above.
      return 'ok';
    }

    // Has a scheme — validate via URL.
    try {
      // eslint-disable-next-line no-new
      new URL(trimmed);
      return 'ok';
    } catch (_) {
      return 'malformed';
    }
  }

  // ── l1 — Enlaces rotos o placeholder ───────────────────────────────
  window.stReview.register({
    id: 'l1',
    cat: 'links',
    run(tpl) {
      const hrefs = _harvestHrefs(tpl);
      if (!hrefs.length) return null;

      // Classify every href, ignoring mailto for l1 (l2 owns them).
      const unsafe = [];
      const empty = [];
      const malformed = [];
      const placeholder = [];
      let okCount = 0;

      for (let i = 0; i < hrefs.length; i++) {
        const h = hrefs[i];
        const cls = _classify(h);
        if (cls === 'mailto') continue; // l2
        if (cls === 'unsafe') unsafe.push(h);
        else if (cls === 'empty') empty.push(h);
        else if (cls === 'malformed') malformed.push(h);
        else if (cls === 'placeholder') placeholder.push(h);
        else okCount++;
      }

      const considered = unsafe.length + empty.length + malformed.length + placeholder.length + okCount;
      if (considered === 0) return null;

      if (unsafe.length > 0) {
        return {
          kind: 'error',
          detail: t('review.check.l1.unsafe', { example: unsafe[0] }),
        };
      }
      if (empty.length > 0) {
        return {
          kind: 'error',
          detail: t('review.check.l1.empty', { count: empty.length }),
        };
      }
      if (malformed.length > 0) {
        return {
          kind: 'error',
          detail: t('review.check.l1.malformed', { count: malformed.length }),
        };
      }
      if (placeholder.length > 0) {
        const examples = placeholder.slice(0, 2).join(', ');
        return {
          kind: 'warn',
          detail: t('review.check.l1.placeholder', { count: placeholder.length, examples: examples }),
        };
      }
      return {
        kind: 'ok',
        detail: t('review.check.l1.ok', { count: okCount }),
      };
    },
  });

  // ── l2 — mailto sin dirección ──────────────────────────────────────
  window.stReview.register({
    id: 'l2',
    cat: 'links',
    run(tpl) {
      const hrefs = _harvestHrefs(tpl);
      if (!hrefs.length) return null;

      const mailtos = [];
      for (let i = 0; i < hrefs.length; i++) {
        const h = hrefs[i];
        if (typeof h !== 'string') continue;
        if (h.trim().toLowerCase().indexOf('mailto:') === 0) mailtos.push(h.trim());
      }
      if (mailtos.length === 0) return null;

      let bad = 0;
      for (let i = 0; i < mailtos.length; i++) {
        const m = mailtos[i];
        // Bare `mailto:` or anything without a valid local@domain.tld shape.
        const body = m.slice('mailto:'.length);
        if (!body || !MAILTO_VALID_RE.test(m)) bad++;
      }

      if (bad > 0) {
        return {
          kind: 'warn',
          detail: t('review.check.l2.bad', { count: bad }),
        };
      }
      return {
        kind: 'ok',
        detail: t('review.check.l2.ok', { count: mailtos.length }),
      };
    },
  });
})();
