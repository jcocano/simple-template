// Compatibility-category pre-flight review checks.
//
// Registers k1 (Outlook-unfriendly CSS), k2 (HTML structural sanity),
// k3 (max content width) and k4 (Gmail dark-mode heuristic) against the
// review engine at window.stReview. All four are cat: 'compat'.
//
// k1 + k2 rely on window.stReview._helpers.emitEmailHtml(tpl): when the
// emitter is unavailable or throws, the checks return null so they're
// hidden rather than reported as failures.
//
// k2's tag-balance pass is intentionally approximate — it compares raw
// `<tag>` vs `</tag>` counts for a common subset of block-level elements
// and is NOT a full HTML validator; voids (img/br/hr) and attribute-only
// openings are excluded on purpose.

(function registerCompatChecks() {
  if (!window.stReview || typeof window.stReview.register !== 'function') return;

  // ── i18n keys (es + en). Other locales fall back to en via stI18n.t ──
  window.stI18nDict = window.stI18nDict || {};
  window.stI18nDict.es = window.stI18nDict.es || {};
  window.stI18nDict.en = window.stI18nDict.en || {};
  window.stI18nDict.pt = window.stI18nDict.pt || {};
  window.stI18nDict.fr = window.stI18nDict.fr || {};
  window.stI18nDict.ja = window.stI18nDict.ja || {};
  window.stI18nDict.zh = window.stI18nDict.zh || {};

  Object.assign(window.stI18nDict.es, {
    // k1 — Outlook-unsupported CSS
    'review.check.k1.clean': 'Sin CSS incompatible con Outlook detectado.',
    'review.check.k1.issues': '{count} usos de CSS que Outlook ignora silenciosamente: {list}.',
    // k2 — HTML structural sanity
    'review.check.k2.ok': 'HTML estructuralmente válido, tags balanceados.',
    'review.check.k2.bad': 'HTML con estructura posiblemente inválida: {details}.',
    // k3 — Max width
    'review.check.k3.ok': 'Ancho máximo {max}px, se ve bien en todos los clientes.',
    'review.check.k3.warn600': 'Ancho {max}px, un poco más que el estándar 600px.',
    'review.check.k3.warn700': 'Ancho {max}px excede los 600px recomendados, puede cortarse en móvil.',
    // k4 — Gmail dark mode heuristic
    'review.check.k4.mixed': '{colored} secciones con fondo declarado + {images} imagen(es). Previsualiza en Gmail dark para verificarlo.',
    'review.check.k4.clean': 'Fondos transparentes, Gmail dark se verá natural.',
    'review.check.k4.ok': 'Dark mode debería verse bien.',
  });

  Object.assign(window.stI18nDict.en, {
    // k1 — Outlook-unsupported CSS
    'review.check.k1.clean': 'No Outlook-incompatible CSS detected.',
    'review.check.k1.issues': '{count} uses of CSS that Outlook silently ignores: {list}.',
    // k2 — HTML structural sanity
    'review.check.k2.ok': 'HTML is structurally valid, tags are balanced.',
    'review.check.k2.bad': 'HTML structure may be invalid: {details}.',
    // k3 — Max width
    'review.check.k3.ok': 'Max width {max}px, renders well across clients.',
    'review.check.k3.warn600': 'Width {max}px, a bit over the standard 600px.',
    'review.check.k3.warn700': 'Width {max}px exceeds the recommended 600px, may clip on mobile.',
    // k4 — Gmail dark mode heuristic
    'review.check.k4.mixed': '{colored} sections with explicit backgrounds + {images} image(s). Preview in Gmail dark to verify.',
    'review.check.k4.clean': 'Transparent backgrounds, Gmail dark will look natural.',
    'review.check.k4.ok': 'Dark mode should look fine.',
  });

  Object.assign(window.stI18nDict.pt, {
    // k1 — Outlook-unsupported CSS
    'review.check.k1.clean': 'Nenhum CSS incompatível com Outlook detectado.',
    'review.check.k1.issues': '{count} usos de CSS que o Outlook ignora silenciosamente: {list}.',
    // k2 — HTML structural sanity
    'review.check.k2.ok': 'HTML estruturalmente válido, tags balanceadas.',
    'review.check.k2.bad': 'HTML com estrutura possivelmente inválida: {details}.',
    // k3 — Max width
    'review.check.k3.ok': 'Largura máxima {max}px, exibe bem em todos os clientes.',
    'review.check.k3.warn600': 'Largura {max}px, um pouco acima do padrão de 600px.',
    'review.check.k3.warn700': 'Largura {max}px excede os 600px recomendados, pode ser cortado no celular.',
    // k4 — Gmail dark mode heuristic
    'review.check.k4.mixed': '{colored} seções com fundo explícito + {images} imagem(ns). Pré-visualize no Gmail dark para verificar.',
    'review.check.k4.clean': 'Fundos transparentes, o Gmail dark ficará natural.',
    'review.check.k4.ok': 'O modo escuro deve ficar bem.',
  });

  Object.assign(window.stI18nDict.fr, {
    // k1 — Outlook-unsupported CSS
    'review.check.k1.clean': 'Aucun CSS incompatible avec Outlook détecté.',
    'review.check.k1.issues': '{count} utilisations de CSS qu\'Outlook ignore silencieusement : {list}.',
    // k2 — HTML structural sanity
    'review.check.k2.ok': 'HTML structurellement valide, balises équilibrées.',
    'review.check.k2.bad': 'Structure HTML potentiellement invalide : {details}.',
    // k3 — Max width
    'review.check.k3.ok': 'Largeur max {max}px, rendu correct sur tous les clients.',
    'review.check.k3.warn600': 'Largeur {max}px, un peu au-dessus du standard 600px.',
    'review.check.k3.warn700': 'Largeur {max}px dépasse les 600px recommandés, peut être tronqué sur mobile.',
    // k4 — Gmail dark mode heuristic
    'review.check.k4.mixed': '{colored} sections avec fond explicite + {images} image(s). Prévisualisez dans Gmail dark pour vérifier.',
    'review.check.k4.clean': 'Fonds transparents, Gmail dark aura un rendu naturel.',
    'review.check.k4.ok': 'Le mode sombre devrait bien s\'afficher.',
  });

  Object.assign(window.stI18nDict.ja, {
    // k1 — Outlook-unsupported CSS
    'review.check.k1.clean': 'Outlook 非対応の CSS は検出されませんでした。',
    'review.check.k1.issues': 'Outlook が無視する CSS の使用が {count} 件: {list}。',
    // k2 — HTML structural sanity
    'review.check.k2.ok': 'HTML は構造的に有効で、タグのバランスが取れています。',
    'review.check.k2.bad': 'HTML の構造に問題がある可能性: {details}。',
    // k3 — Max width
    'review.check.k3.ok': '最大幅 {max}px、すべてのクライアントで良好に表示されます。',
    'review.check.k3.warn600': '幅 {max}px、標準の 600px を少し超えています。',
    'review.check.k3.warn700': '幅 {max}px は推奨の 600px を超えており、モバイルで切れる可能性があります。',
    // k4 — Gmail dark mode heuristic
    'review.check.k4.mixed': '背景が明示された {colored} 個のセクション + {images} 個の画像。Gmail ダークモードでプレビューして確認してください。',
    'review.check.k4.clean': '背景が透過、Gmail ダークモードでも自然に表示されます。',
    'review.check.k4.ok': 'ダークモードでも問題なく表示されるはずです。',
  });

  Object.assign(window.stI18nDict.zh, {
    // k1 — Outlook-unsupported CSS
    'review.check.k1.clean': '未检测到与 Outlook 不兼容的 CSS。',
    'review.check.k1.issues': 'Outlook 会静默忽略 {count} 处 CSS 用法：{list}。',
    // k2 — HTML structural sanity
    'review.check.k2.ok': 'HTML 结构有效，标签平衡。',
    'review.check.k2.bad': 'HTML 结构可能无效：{details}。',
    // k3 — Max width
    'review.check.k3.ok': '最大宽度 {max}px，在所有客户端中显示良好。',
    'review.check.k3.warn600': '宽度 {max}px，略超标准 600px。',
    'review.check.k3.warn700': '宽度 {max}px 超过推荐的 600px，在移动端可能被裁切。',
    // k4 — Gmail dark mode heuristic
    'review.check.k4.mixed': '{colored} 个带显式背景的区块 + {images} 张图片。请在 Gmail 深色模式下预览验证。',
    'review.check.k4.clean': '透明背景，Gmail 深色模式下显示自然。',
    'review.check.k4.ok': '深色模式应显示正常。',
  });

  const t = function (key, params) {
    return window.stI18n && typeof window.stI18n.t === 'function'
      ? window.stI18n.t(key, params)
      : key;
  };

  const emitHtml = function (tpl) {
    const helpers = (window.stReview && window.stReview._helpers) || {};
    if (typeof helpers.emitEmailHtml !== 'function') return null;
    try { return helpers.emitEmailHtml(tpl); } catch { return null; }
  };

  // ── k1 — Outlook-unsupported CSS ─────────────────────────────────────
  window.stReview.register({
    id: 'k1',
    cat: 'compat',
    run: function (tpl) {
      const html = emitHtml(tpl);
      if (html == null) return null;

      const probes = [
        { re: /display\s*:\s*flex/gi, label: 'flexbox' },
        { re: /background-image\s*:/gi, label: 'background-image' },
        { re: /position\s*:\s*(?:fixed|absolute|sticky)/gi, label: 'positioning' },
        { re: /:(?:hover|focus|active)\b/gi, label: 'interactive pseudos' },
        { re: /transform\s*:/gi, label: 'transforms' },
      ];

      let total = 0;
      const hits = [];
      for (let i = 0; i < probes.length; i++) {
        const m = html.match(probes[i].re);
        const n = m ? m.length : 0;
        if (n > 0) {
          total += n;
          hits.push(probes[i].label);
        }
      }

      if (total === 0) {
        return { kind: 'ok', detail: t('review.check.k1.clean') };
      }
      return {
        kind: 'warn',
        detail: t('review.check.k1.issues', { count: total, list: hits.join(', ') }),
      };
    },
  });

  // ── k2 — HTML structural sanity ──────────────────────────────────────
  window.stReview.register({
    id: 'k2',
    cat: 'compat',
    run: function (tpl) {
      const html = emitHtml(tpl);
      if (html == null) return null;

      const issues = [];

      // DOMParser is permissive in text/html mode but will surface real
      // malformed fragments via a <parsererror> node when given XHTML-ish
      // input. Still cheap enough to probe.
      try {
        if (typeof DOMParser === 'function') {
          const parsed = new DOMParser().parseFromString(html, 'text/html');
          if (parsed && parsed.querySelector && parsed.querySelector('parsererror')) {
            issues.push('parser error');
          }
        }
      } catch { /* ignore — fall back to tag-balance */ }

      // Approximate tag balance for common non-void elements.
      const tags = ['div', 'table', 'tr', 'td', 'span', 'a', 'p', 'ul', 'li', 'h1', 'h2', 'h3'];
      for (let i = 0; i < tags.length; i++) {
        const T = tags[i];
        const openRe = new RegExp('<' + T + '(?:\\s|>|/)', 'gi');
        const closeRe = new RegExp('</' + T + '\\s*>', 'gi');
        const opens = (html.match(openRe) || []).length;
        const closes = (html.match(closeRe) || []).length;
        if (opens !== closes) {
          issues.push('<' + T + '> ' + opens + '/' + closes);
        }
      }

      if (issues.length === 0) {
        return { kind: 'ok', detail: t('review.check.k2.ok') };
      }
      return {
        kind: 'warn',
        detail: t('review.check.k2.bad', { details: issues.join(', ') }),
      };
    },
  });

  // ── k3 — Max content width ───────────────────────────────────────────
  window.stReview.register({
    id: 'k3',
    cat: 'compat',
    run: function (tpl) {
      const sections = (tpl && tpl.doc && Array.isArray(tpl.doc.sections)) ? tpl.doc.sections : [];
      if (sections.length === 0) return null;

      let max = 0;
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i] || {};
        const w = typeof s.width === 'number' && isFinite(s.width) ? s.width : 600;
        if (w > max) max = w;
      }
      if (max <= 0) max = 600;

      if (max <= 600) {
        return { kind: 'ok', detail: t('review.check.k3.ok', { max: max }) };
      }
      if (max <= 700) {
        return { kind: 'info', detail: t('review.check.k3.warn600', { max: max }) };
      }
      return { kind: 'warn', detail: t('review.check.k3.warn700', { max: max }) };
    },
  });

  // ── k4 — Gmail dark-mode heuristic ───────────────────────────────────
  window.stReview.register({
    id: 'k4',
    cat: 'compat',
    run: function (tpl) {
      const sections = (tpl && tpl.doc && Array.isArray(tpl.doc.sections)) ? tpl.doc.sections : [];
      if (sections.length === 0) return null;

      const isExplicitBg = function (v) {
        if (typeof v !== 'string') return false;
        const s = v.trim().toLowerCase();
        if (!s) return false;
        if (s === 'transparent' || s === 'inherit' || s === 'none' || s === 'initial' || s === 'unset') return false;
        // Count hex colours and rgb/rgba/hsl/hsla + any non-empty named colour.
        return true;
      };

      let colored = 0;
      for (let i = 0; i < sections.length; i++) {
        const st = (sections[i] && sections[i].style) || {};
        if (isExplicitBg(st.bg)) colored++;
      }

      let images = 0;
      const helpers = (window.stReview && window.stReview._helpers) || {};
      if (typeof helpers.eachBlock === 'function') {
        helpers.eachBlock(tpl, function (blk) {
          const type = blk && blk.type;
          if (type === 'image' || type === 'hero' || type === 'gif') images++;
        });
      }

      if (colored === 0) {
        return { kind: 'ok', detail: t('review.check.k4.clean') };
      }
      if (colored >= 1 && images >= 1) {
        return {
          kind: 'info',
          detail: t('review.check.k4.mixed', { colored: colored, images: images }),
        };
      }
      return { kind: 'ok', detail: t('review.check.k4.ok') };
    },
  });
})();
