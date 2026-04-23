// Accessibility pre-flight checks — a1..a4.
//
// a1 — image blocks (image|hero|gif) must declare alt text.
// a2 — WCAG contrast between background and foreground colors (section-level
//      and block-level pairs). Flags < AA (4.5) as error, AA-only as warn,
//      AAA (>=7) as ok. Pairs where either side is missing or 'transparent'
//      are skipped — we can't judge contrast without knowing the colour that
//      actually renders behind the element.
// a3 — smallest declared font size across text/heading blocks. Assumes 16px
//      when nothing is declared anywhere.
// a4 — heading hierarchy: exactly one H1 is the goal; also flags H3 appearing
//      before any H2 as disordered structure.

(function registerA11yChecks() {
  if (!window.stReview || typeof window.stReview.register !== 'function') return;

  // ── i18n registration ──────────────────────────────────────────────
  window.stI18nDict = window.stI18nDict || {};
  window.stI18nDict.es = window.stI18nDict.es || {};
  window.stI18nDict.en = window.stI18nDict.en || {};
  window.stI18nDict.pt = window.stI18nDict.pt || {};
  window.stI18nDict.fr = window.stI18nDict.fr || {};
  window.stI18nDict.ja = window.stI18nDict.ja || {};
  window.stI18nDict.zh = window.stI18nDict.zh || {};

  Object.assign(window.stI18nDict.es, {
    'review.check.a1.ok': '{count} imágenes con texto alternativo.',
    'review.check.a1.bad': '{count} imagen(es) sin texto alternativo. Los lectores de pantalla no sabrán qué son.',
    'review.check.a1.fix.focus': 'Ir a la imagen',
    'review.check.a2.low': 'Contraste {ratio} insuficiente (mínimo AA: 4.5). Afecta legibilidad.',
    'review.check.a2.mid': 'Contraste {ratio}, cumple AA pero no AAA.',
    'review.check.a2.good': 'Contraste {ratio}, cumple AAA.',
    'review.check.a3.small': 'Hay texto de {size}px, por debajo de 12px dificulta la lectura en móvil.',
    'review.check.a3.mid': 'Tamaño mínimo {size}px, considera subirlo a 14px+.',
    'review.check.a3.good': 'Mínimo {size}px, legible.',
    'review.check.a4.none': 'No hay encabezados. Ayudan a estructurar el contenido.',
    'review.check.a4.good': '1 H1 · estructura semántica correcta.',
    'review.check.a4.noH1': 'Ningún encabezado es H1, debería haber uno principal.',
    'review.check.a4.manyH1': '{count} H1 detectados, usa uno solo y degrada los demás a H2/H3.',
    'review.check.a4.disorder': 'Hay jerarquía desordenada (H3 sin H2).',
  });

  Object.assign(window.stI18nDict.en, {
    'review.check.a1.ok': '{count} images with alternative text.',
    'review.check.a1.bad': '{count} image(s) without alternative text. Screen readers will not know what they are.',
    'review.check.a1.fix.focus': 'Go to image',
    'review.check.a2.low': 'Contrast {ratio} is too low (AA minimum: 4.5). Hurts legibility.',
    'review.check.a2.mid': 'Contrast {ratio}, meets AA but not AAA.',
    'review.check.a2.good': 'Contrast {ratio}, meets AAA.',
    'review.check.a3.small': '{size}px text found, below 12px is hard to read on mobile.',
    'review.check.a3.mid': 'Minimum size {size}px, consider bumping to 14px+.',
    'review.check.a3.good': 'Minimum {size}px, legible.',
    'review.check.a4.none': 'No headings found. They help structure content.',
    'review.check.a4.good': '1 H1 · correct semantic structure.',
    'review.check.a4.noH1': 'No heading is an H1, there should be one main heading.',
    'review.check.a4.manyH1': '{count} H1 found, use only one and demote the rest to H2/H3.',
    'review.check.a4.disorder': 'Disordered hierarchy (H3 before any H2).',
  });

  Object.assign(window.stI18nDict.pt, {
    'review.check.a1.ok': '{count} imagens com texto alternativo.',
    'review.check.a1.bad': '{count} imagem(ns) sem texto alternativo. Leitores de tela não saberão do que se trata.',
    'review.check.a1.fix.focus': 'Ir para a imagem',
    'review.check.a2.low': 'Contraste {ratio} insuficiente (mínimo AA: 4.5). Afeta a legibilidade.',
    'review.check.a2.mid': 'Contraste {ratio}, cumpre AA mas não AAA.',
    'review.check.a2.good': 'Contraste {ratio}, cumpre AAA.',
    'review.check.a3.small': 'Há texto de {size}px, abaixo de 12px dificulta a leitura no celular.',
    'review.check.a3.mid': 'Tamanho mínimo {size}px, considere aumentar para 14px+.',
    'review.check.a3.good': 'Mínimo {size}px, legível.',
    'review.check.a4.none': 'Não há cabeçalhos. Ajudam a estruturar o conteúdo.',
    'review.check.a4.good': '1 H1 · estrutura semântica correta.',
    'review.check.a4.noH1': 'Nenhum cabeçalho é H1, deveria haver um principal.',
    'review.check.a4.manyH1': '{count} H1 detectados, use apenas um e rebaixe os demais a H2/H3.',
    'review.check.a4.disorder': 'Hierarquia desordenada (H3 sem H2).',
  });

  Object.assign(window.stI18nDict.fr, {
    'review.check.a1.ok': '{count} images avec texte alternatif.',
    'review.check.a1.bad': '{count} image(s) sans texte alternatif. Les lecteurs d\'écran ne sauront pas ce qu\'elles sont.',
    'review.check.a1.fix.focus': 'Aller à l\'image',
    'review.check.a2.low': 'Contraste {ratio} insuffisant (minimum AA : 4.5). Affecte la lisibilité.',
    'review.check.a2.mid': 'Contraste {ratio}, respecte AA mais pas AAA.',
    'review.check.a2.good': 'Contraste {ratio}, respecte AAA.',
    'review.check.a3.small': 'Texte de {size}px, en dessous de 12px rend la lecture difficile sur mobile.',
    'review.check.a3.mid': 'Taille minimale {size}px, envisagez de passer à 14px+.',
    'review.check.a3.good': 'Minimum {size}px, lisible.',
    'review.check.a4.none': 'Aucun titre trouvé. Ils aident à structurer le contenu.',
    'review.check.a4.good': '1 H1 · structure sémantique correcte.',
    'review.check.a4.noH1': 'Aucun titre n\'est un H1, il devrait y en avoir un principal.',
    'review.check.a4.manyH1': '{count} H1 détectés, n\'en utilisez qu\'un et rétrogradez les autres en H2/H3.',
    'review.check.a4.disorder': 'Hiérarchie désordonnée (H3 avant un H2).',
  });

  Object.assign(window.stI18nDict.ja, {
    'review.check.a1.ok': '{count} 個の画像に代替テキストがあります。',
    'review.check.a1.bad': '{count} 個の画像に代替テキストがありません。スクリーンリーダーは内容を把握できません。',
    'review.check.a1.fix.focus': '画像へ移動',
    'review.check.a2.low': 'コントラスト {ratio} が不十分です (AA 最低: 4.5)。可読性に影響します。',
    'review.check.a2.mid': 'コントラスト {ratio}、AA は満たしますが AAA は満たしません。',
    'review.check.a2.good': 'コントラスト {ratio}、AAA を満たします。',
    'review.check.a3.small': '{size}px のテキストがあります。12px 未満はモバイルで読みにくくなります。',
    'review.check.a3.mid': '最小サイズ {size}px、14px 以上への引き上げを検討してください。',
    'review.check.a3.good': '最小 {size}px、読みやすいです。',
    'review.check.a4.none': '見出しがありません。コンテンツの構造化に役立ちます。',
    'review.check.a4.good': 'H1 が 1 つ · セマンティック構造は正しいです。',
    'review.check.a4.noH1': 'H1 の見出しがありません。メインの見出しが 1 つ必要です。',
    'review.check.a4.manyH1': 'H1 が {count} 個検出されました。1 つだけ使用し、残りは H2/H3 に降格してください。',
    'review.check.a4.disorder': '階層が乱れています (H2 より前に H3)。',
  });

  Object.assign(window.stI18nDict.zh, {
    'review.check.a1.ok': '{count} 张图片带有替代文本。',
    'review.check.a1.bad': '{count} 张图片缺少替代文本。屏幕阅读器无法识别它们。',
    'review.check.a1.fix.focus': '前往图片',
    'review.check.a2.low': '对比度 {ratio} 不足 (AA 最低: 4.5)。影响可读性。',
    'review.check.a2.mid': '对比度 {ratio}，符合 AA 但不符合 AAA。',
    'review.check.a2.good': '对比度 {ratio}，符合 AAA。',
    'review.check.a3.small': '存在 {size}px 的文本，低于 12px 在移动端难以阅读。',
    'review.check.a3.mid': '最小字号 {size}px，建议提升到 14px 以上。',
    'review.check.a3.good': '最小 {size}px，易读。',
    'review.check.a4.none': '没有标题。标题有助于组织内容结构。',
    'review.check.a4.good': '1 个 H1 · 语义结构正确。',
    'review.check.a4.noH1': '没有 H1 标题，应该有一个主标题。',
    'review.check.a4.manyH1': '检测到 {count} 个 H1，请只使用一个，其余降级为 H2/H3。',
    'review.check.a4.disorder': '层级混乱 (H3 出现在 H2 之前)。',
  });

  // ── helpers ────────────────────────────────────────────────────────
  const helpers = window.stReview._helpers || {};
  const eachBlock = helpers.eachBlock || (() => {});
  const getContent = helpers.getContent || ((d) => (d && d.content) || d || {});

  const IMG_TYPES = new Set(['image', 'hero', 'gif']);

  function _hexToRgb(h) {
    if (!h) return null;
    const m = /^#?([0-9a-f]{3,8})$/i.exec(String(h).trim()); if (!m) return null;
    let s = m[1]; if (s.length === 3) s = s.split('').map(c => c + c).join('');
    if (s.length < 6) return null; s = s.slice(0, 6);
    const n = parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function _rel(c) { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function _lum(rgb) { return 0.2126 * _rel(rgb.r) + 0.7152 * _rel(rgb.g) + 0.0722 * _rel(rgb.b); }
  function _ratio(a, b) { const L1 = Math.max(a, b), L2 = Math.min(a, b); return (L1 + 0.05) / (L2 + 0.05); }
  function contrastRatio(bgHex, fgHex) {
    const a = _hexToRgb(bgHex), b = _hexToRgb(fgHex);
    if (!a || !b) return null;
    return _ratio(_lum(a), _lum(b));
  }

  // Treat `transparent`, empty, `'none'`, or unparseable values as "no colour
  // defined" so we skip rather than falsely pass/fail. We only score pairs
  // where both sides are real hex colours.
  function _isUsableColor(v) {
    if (!v || typeof v !== 'string') return false;
    const s = v.trim().toLowerCase();
    if (!s || s === 'transparent' || s === 'none' || s === 'inherit') return false;
    return !!_hexToRgb(s);
  }

  function _fmtRatio(r) {
    // One decimal place + ":1", e.g. 4.3:1
    return `${(Math.round(r * 10) / 10).toFixed(1)}:1`;
  }

  // ── a1: alt text on image-bearing blocks ───────────────────────────
  window.stReview.register({
    id: 'a1',
    cat: 'a11y',
    run(tpl) {
      const t = (window.stI18n && window.stI18n.t) ? window.stI18n.t : ((k) => k);

      let total = 0;
      let offenders = 0;
      let firstOffender = null;

      eachBlock(tpl, (blk, ctx) => {
        if (!blk || !IMG_TYPES.has(blk.type)) return;
        total++;
        const data = blk.data || {};
        const content = getContent(data);
        const alt =
          (typeof content.alt === 'string' ? content.alt : null) ??
          (typeof data.alt === 'string' ? data.alt : null);
        const empty = !alt || !alt.trim();
        if (empty) {
          offenders++;
          if (!firstOffender) firstOffender = { si: ctx.si, ci: ctx.ci, bi: ctx.bi };
        }
      });

      if (total === 0) return null;

      if (offenders === 0) {
        return {
          kind: 'ok',
          detail: t('review.check.a1.ok', { count: total }),
        };
      }

      const fixes = firstOffender
        ? [{ focusBlock: firstOffender, label: t('review.check.a1.fix.focus') }]
        : null;

      return {
        kind: 'error',
        detail: t('review.check.a1.bad', { count: offenders }),
        fixes,
      };
    },
  });

  // ── a2: WCAG contrast across section + block colour pairs ──────────
  window.stReview.register({
    id: 'a2',
    cat: 'a11y',
    run(tpl) {
      const t = (window.stI18n && window.stI18n.t) ? window.stI18n.t : ((k) => k);

      const ratios = [];
      const sections = (tpl && tpl.doc && Array.isArray(tpl.doc.sections)) ? tpl.doc.sections : [];

      for (const sec of sections) {
        const ss = (sec && sec.style) || {};
        if (_isUsableColor(ss.bg) && _isUsableColor(ss.text)) {
          const r = contrastRatio(ss.bg, ss.text);
          if (r != null) ratios.push(r);
        }
      }

      eachBlock(tpl, (blk) => {
        const bs = (blk && blk.style) || {};
        if (_isUsableColor(bs.bg) && _isUsableColor(bs.color)) {
          const r = contrastRatio(bs.bg, bs.color);
          if (r != null) ratios.push(r);
        }
      });

      if (ratios.length === 0) return null;

      const min = Math.min.apply(null, ratios);
      const label = _fmtRatio(min);

      if (min < 4.5) {
        return {
          kind: 'error',
          detail: t('review.check.a2.low', { ratio: label }),
        };
      }
      if (min < 7) {
        return {
          kind: 'warn',
          detail: t('review.check.a2.mid', { ratio: label }),
        };
      }
      return {
        kind: 'ok',
        detail: t('review.check.a2.good', { ratio: label }),
      };
    },
  });

  // ── a3: smallest declared font size in text/heading blocks ─────────
  window.stReview.register({
    id: 'a3',
    cat: 'a11y',
    run(tpl) {
      const t = (window.stI18n && window.stI18n.t) ? window.stI18n.t : ((k) => k);

      let textCount = 0;
      let minSize = Infinity;
      let anyDeclared = false;

      eachBlock(tpl, (blk) => {
        if (!blk || (blk.type !== 'text' && blk.type !== 'heading')) return;
        textCount++;
        const blockStyle = (blk.style && typeof blk.style === 'object') ? blk.style : null;
        const dataStyle = (blk.data && blk.data.style && typeof blk.data.style === 'object') ? blk.data.style : null;
        const sizes = [];
        if (blockStyle && typeof blockStyle.fontSize === 'number') sizes.push(blockStyle.fontSize);
        if (dataStyle && typeof dataStyle.fontSize === 'number') sizes.push(dataStyle.fontSize);
        if (sizes.length) {
          anyDeclared = true;
          const localMin = Math.min.apply(null, sizes);
          if (localMin < minSize) minSize = localMin;
        }
      });

      if (textCount === 0) return null;

      const size = anyDeclared ? minSize : 16;

      if (size < 12) {
        return {
          kind: 'warn',
          detail: t('review.check.a3.small', { size }),
        };
      }
      if (size < 14) {
        return {
          kind: 'info',
          detail: t('review.check.a3.mid', { size }),
        };
      }
      return {
        kind: 'ok',
        detail: t('review.check.a3.good', { size }),
      };
    },
  });

  // ── a4: heading hierarchy (H1 uniqueness, H3-before-H2) ────────────
  window.stReview.register({
    id: 'a4',
    cat: 'a11y',
    run(tpl) {
      const t = (window.stI18n && window.stI18n.t) ? window.stI18n.t : ((k) => k);

      const levels = []; // ordered list of heading levels, document order
      eachBlock(tpl, (blk) => {
        if (!blk || blk.type !== 'heading') return;
        const data = blk.data || {};
        let lvl = data.level;
        if (typeof lvl !== 'number' || !isFinite(lvl)) lvl = 2;
        lvl = Math.max(1, Math.min(6, Math.round(lvl)));
        levels.push(lvl);
      });

      if (levels.length === 0) {
        return {
          kind: 'warn',
          detail: t('review.check.a4.none'),
        };
      }

      let h1 = 0, h2 = 0, h3 = 0;
      let sawH2 = false;
      let h3BeforeH2 = false;
      for (const lv of levels) {
        if (lv === 1) h1++;
        else if (lv === 2) { h2++; sawH2 = true; }
        else if (lv === 3) { h3++; if (!sawH2) h3BeforeH2 = true; }
      }

      if (h1 === 0) {
        return {
          kind: 'warn',
          detail: t('review.check.a4.noH1'),
        };
      }
      if (h1 >= 2) {
        return {
          kind: 'warn',
          detail: t('review.check.a4.manyH1', { count: h1 }),
        };
      }

      // Exactly 1 H1 from here on. Flag disordered hierarchy as a softer info.
      if (h3BeforeH2) {
        return {
          kind: 'info',
          detail: t('review.check.a4.disorder'),
        };
      }

      return {
        kind: 'ok',
        detail: t('review.check.a4.good'),
      };
    },
  });
})();
