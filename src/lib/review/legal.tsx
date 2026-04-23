// Legal + deliverability pre-flight review checks.
//
// Registers:
//   g1 — Unsubscribe link present (GDPR / CAN-SPAM)
//   g2 — Physical postal address present (CAN-SPAM)
//   g3 — Plain-text fallback availability (deliverability)
//   g4 — Local spam-score heuristic (deliverability)
//
// All checks run locally over the template document and/or emitted HTML —
// no network calls, no backend. g4 is a keyword/format heuristic only; it
// does not replace a real spam-filter test.

(function registerLegalChecks() {
  if (!window.stReview || typeof window.stReview.register !== 'function') return;

  const helpers = (window.stReview && window.stReview._helpers) || {};
  const eachBlock = helpers.eachBlock;
  const textOfBlock = helpers.textOfBlock;
  const allTextSources = helpers.allTextSources;
  const emitEmailHtml = helpers.emitEmailHtml;

  // ── i18n (es + en) ─────────────────────────────────────────────────
  window.stI18nDict = window.stI18nDict || {};
  window.stI18nDict.es = window.stI18nDict.es || {};
  window.stI18nDict.en = window.stI18nDict.en || {};
  window.stI18nDict.pt = window.stI18nDict.pt || {};
  window.stI18nDict.fr = window.stI18nDict.fr || {};
  window.stI18nDict.ja = window.stI18nDict.ja || {};
  window.stI18nDict.zh = window.stI18nDict.zh || {};

  Object.assign(window.stI18nDict.es, {
    'review.check.g1.ok': 'Link de desuscripción detectado. Cumple GDPR/CAN-SPAM.',
    'review.check.g1.missing': 'No se detectó link de desuscripción. Es obligatorio por GDPR/CAN-SPAM.',
    'review.check.g2.ok': 'Dirección física detectada en el contenido.',
    'review.check.g2.missing': 'No se detectó una dirección física. Es requerida por CAN-SPAM.',
    'review.check.g3.missing': 'No hay versión texto plano guardada. Generarla mejora entregabilidad.',
    'review.check.g3.ok': 'Versión texto plano configurada.',
    'review.check.g3.fix': 'Editar versión texto plano',
    'review.check.g4.ok': 'Spam score {score}/10, bajo riesgo.',
    'review.check.g4.warn': 'Spam score {score}/10. Triggers: {list}.',
    'review.check.g4.error': 'Spam score alto: {score}/10. Triggers: {list}.',
  });

  Object.assign(window.stI18nDict.en, {
    'review.check.g1.ok': 'Unsubscribe link detected. Complies with GDPR/CAN-SPAM.',
    'review.check.g1.missing': 'No unsubscribe link detected. Required by GDPR/CAN-SPAM.',
    'review.check.g2.ok': 'Physical address detected in the content.',
    'review.check.g2.missing': 'No physical address detected. Required by CAN-SPAM.',
    'review.check.g3.missing': 'No saved plain-text version. Generating one improves deliverability.',
    'review.check.g3.ok': 'Plain-text version configured.',
    'review.check.g3.fix': 'Edit plain-text version',
    'review.check.g4.ok': 'Spam score {score}/10, low risk.',
    'review.check.g4.warn': 'Spam score {score}/10. Triggers: {list}.',
    'review.check.g4.error': 'High spam score: {score}/10. Triggers: {list}.',
  });

  Object.assign(window.stI18nDict.pt, {
    'review.check.g1.ok': 'Link de descadastro detectado. Cumpre GDPR/CAN-SPAM.',
    'review.check.g1.missing': 'Link de descadastro não detectado. É obrigatório por GDPR/CAN-SPAM.',
    'review.check.g2.ok': 'Endereço físico detectado no conteúdo.',
    'review.check.g2.missing': 'Nenhum endereço físico detectado. É exigido pela CAN-SPAM.',
    'review.check.g3.missing': 'Sem versão texto puro salva. Gerá-la melhora a entregabilidade.',
    'review.check.g3.ok': 'Versão texto puro configurada.',
    'review.check.g3.fix': 'Editar versão texto puro',
    'review.check.g4.ok': 'Spam score {score}/10, baixo risco.',
    'review.check.g4.warn': 'Spam score {score}/10. Gatilhos: {list}.',
    'review.check.g4.error': 'Spam score alto: {score}/10. Gatilhos: {list}.',
  });

  Object.assign(window.stI18nDict.fr, {
    'review.check.g1.ok': 'Lien de désabonnement détecté. Conforme RGPD/CAN-SPAM.',
    'review.check.g1.missing': 'Aucun lien de désabonnement détecté. Requis par RGPD/CAN-SPAM.',
    'review.check.g2.ok': 'Adresse postale détectée dans le contenu.',
    'review.check.g2.missing': 'Aucune adresse postale détectée. Requise par CAN-SPAM.',
    'review.check.g3.missing': 'Pas de version texte brut enregistrée. En générer une améliore la délivrabilité.',
    'review.check.g3.ok': 'Version texte brut configurée.',
    'review.check.g3.fix': 'Modifier la version texte brut',
    'review.check.g4.ok': 'Spam score {score}/10, risque faible.',
    'review.check.g4.warn': 'Spam score {score}/10. Déclencheurs : {list}.',
    'review.check.g4.error': 'Spam score élevé : {score}/10. Déclencheurs : {list}.',
  });

  Object.assign(window.stI18nDict.ja, {
    'review.check.g1.ok': '配信停止リンクを検出しました。GDPR/CAN-SPAM に準拠しています。',
    'review.check.g1.missing': '配信停止リンクが検出されませんでした。GDPR/CAN-SPAM で必須です。',
    'review.check.g2.ok': 'コンテンツ内に実在の住所を検出しました。',
    'review.check.g2.missing': '実在の住所が検出されませんでした。CAN-SPAM で必須です。',
    'review.check.g3.missing': '保存されたプレーンテキスト版がありません。生成することで配信性が向上します。',
    'review.check.g3.ok': 'プレーンテキスト版が設定されています。',
    'review.check.g3.fix': 'プレーンテキスト版を編集',
    'review.check.g4.ok': 'スパムスコア {score}/10、リスクは低いです。',
    'review.check.g4.warn': 'スパムスコア {score}/10。トリガー: {list}。',
    'review.check.g4.error': 'スパムスコアが高い: {score}/10。トリガー: {list}。',
  });

  Object.assign(window.stI18nDict.zh, {
    'review.check.g1.ok': '已检测到退订链接。符合 GDPR/CAN-SPAM。',
    'review.check.g1.missing': '未检测到退订链接。GDPR/CAN-SPAM 要求必须包含。',
    'review.check.g2.ok': '内容中检测到实体地址。',
    'review.check.g2.missing': '未检测到实体地址。CAN-SPAM 要求必须包含。',
    'review.check.g3.missing': '未保存纯文本版本。生成后可提升送达率。',
    'review.check.g3.ok': '已配置纯文本版本。',
    'review.check.g3.fix': '编辑纯文本版本',
    'review.check.g4.ok': '垃圾邮件评分 {score}/10，风险低。',
    'review.check.g4.warn': '垃圾邮件评分 {score}/10。触发项：{list}。',
    'review.check.g4.error': '垃圾邮件评分过高：{score}/10。触发项：{list}。',
  });

  const t = function (key, params) {
    return (window.stI18n && typeof window.stI18n.t === 'function')
      ? window.stI18n.t(key, params)
      : key;
  };

  // ── g1 — Link de desuscripción ─────────────────────────────────────
  //
  // Primary path: scan emitted HTML for <a href="..."> with either the
  // `link_baja` merge tag or unsubscribe-flavoured words in URL or text.
  // Fallback path: walk blocks and inspect link-bearing data fields
  // (button.url, link.href, text.html) when HTML emission fails.
  const UNSUB_WORDS = /(unsubscribe|opt[-_]?out|darse[-_ ]?de[-_ ]?baja|desuscrib\w*|\bbaja\b)/i;
  const LINK_BAJA_TAG = /\{\{\{?\s*link_baja\s*\}?\}\}/i;

  function _g1FromHtml(html) {
    if (typeof html !== 'string' || !html) return false;
    // Fast scan for the merge tag anywhere in the HTML (tag or text).
    if (LINK_BAJA_TAG.test(html)) return true;

    // Parse anchors and inspect both href and inner text.
    const re = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const tag = m[0];
      const inner = (m[1] || '').replace(/<[^>]*>/g, ' ');
      const hrefMatch = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || '') : '';
      if (LINK_BAJA_TAG.test(href)) return true;
      if (UNSUB_WORDS.test(href)) return true;
      if (UNSUB_WORDS.test(inner)) return true;
    }
    return false;
  }

  function _g1FromBlocks(tpl) {
    let hit = false;
    if (typeof eachBlock !== 'function') return false;
    eachBlock(tpl, function (blk) {
      if (hit) return;
      const d = (blk && blk.data) || {};
      const c = (d.content && typeof d.content === 'object') ? d.content : d;
      // Collect candidate href-ish fields + textual fields.
      const hrefs = [];
      if (typeof c.href === 'string') hrefs.push(c.href);
      if (typeof c.url === 'string') hrefs.push(c.url);
      if (typeof c.link === 'string') hrefs.push(c.link);
      if (typeof d.href === 'string') hrefs.push(d.href);
      if (typeof d.url === 'string') hrefs.push(d.url);
      for (let i = 0; i < hrefs.length; i++) {
        const h = hrefs[i];
        if (LINK_BAJA_TAG.test(h) || UNSUB_WORDS.test(h)) { hit = true; return; }
      }
      // Raw HTML content (text blocks) often carries <a> tags.
      if (typeof c.html === 'string' && c.html) {
        if (_g1FromHtml(c.html)) { hit = true; return; }
      }
      // Button / link label text might contain "Darse de baja" etc.
      const text = typeof textOfBlock === 'function' ? textOfBlock(blk) : '';
      if (text && UNSUB_WORDS.test(text)) { hit = true; return; }
    });
    return hit;
  }

  window.stReview.register({
    id: 'g1',
    cat: 'legal',
    run: function (tpl) {
      let found = false;
      try {
        const html = typeof emitEmailHtml === 'function' ? emitEmailHtml(tpl) : null;
        if (html) found = _g1FromHtml(html);
      } catch (e) { /* fall through to block walk */ }
      if (!found) found = _g1FromBlocks(tpl);

      if (found) return { kind: 'ok', detail: t('review.check.g1.ok') };
      return { kind: 'error', detail: t('review.check.g1.missing') };
    },
  });

  // ── g2 — Dirección física ──────────────────────────────────────────
  //
  // Heuristic — any of the following counts as an address line:
  //   (a) keyword hit: calle, avenida, av., ave., street, st., road, rd.,
  //       suite, piso, floor;
  //   (b) ZIP match: 5 consecutive digits, or Canadian A1A 1A1;
  //   (c) number + comma + ≥15 chars line (fuzzy fallback).
  //
  // We scan every line of every text source. Known false positives: an
  // invoice-like "Total: 1,234 units" can trip rule (c). Rule (a) covers
  // the common real case and fires first.
  const ADDRESS_KEYWORDS = /\b(calle|avenida|av\.?|ave\.?|street|st\.?|road|rd\.?|suite|piso|floor)\b/i;
  const ZIP_US = /(?:^|[^\d])\d{5}(?:[-\s]\d{4})?(?!\d)/;
  const ZIP_CA = /\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/;

  function _isAddressLine(line) {
    const s = typeof line === 'string' ? line.trim() : '';
    if (!s) return false;
    if (ADDRESS_KEYWORDS.test(s)) return true;
    if (ZIP_US.test(s)) return true;
    if (ZIP_CA.test(s)) return true;
    // Fuzzy: has a number, has a comma, long enough to plausibly be an address.
    if (s.length >= 15 && /\d/.test(s) && s.indexOf(',') !== -1) return true;
    return false;
  }

  window.stReview.register({
    id: 'g2',
    cat: 'legal',
    run: function (tpl) {
      const sources = typeof allTextSources === 'function'
        ? (allTextSources(tpl) || [])
        : [];
      for (let i = 0; i < sources.length; i++) {
        const src = typeof sources[i] === 'string' ? sources[i] : '';
        if (!src) continue;
        const lines = src.split(/\r?\n|\.\s+|\s{2,}/);
        for (let j = 0; j < lines.length; j++) {
          if (_isAddressLine(lines[j])) {
            return { kind: 'ok', detail: t('review.check.g2.ok') };
          }
        }
        // Fallback: check the whole source as one line (handles a single
        // glued paragraph with the address inline).
        if (_isAddressLine(src)) {
          return { kind: 'ok', detail: t('review.check.g2.ok') };
        }
      }
      return { kind: 'warn', detail: t('review.check.g2.missing') };
    },
  });

  // ── g3 — Plain-text version ────────────────────────────────────────
  //
  // Plain-text fallback: revisa si tpl.meta.plainText tiene contenido real.
  // El Detalles modal auto-genera el texto al abrir pero solo lo persiste si
  // el usuario lo edita o confirma con guardar — así diferenciamos "nunca se
  // configuró" (warn) de "hay versión" (ok).
  window.stReview.register({
    id: 'g3',
    cat: 'legal',
    run: function (tpl) {
      const meta = (tpl && tpl.meta) || {};
      const plain = typeof meta.plainText === 'string' ? meta.plainText.trim() : '';
      if (plain) return { kind: 'ok', detail: t('review.check.g3.ok') };
      return {
        kind: 'warn',
        detail: t('review.check.g3.missing'),
        fixes: [{
          label: t('review.check.g3.fix'),
          action: function () { window.dispatchEvent(new CustomEvent('st:open-details')); },
        }],
      };
    },
  });

  // ── g4 — Spam score (heurística local) ─────────────────────────────
  //
  // Score is the sum of small penalties capped at 10. We also remember
  // which rules fired so the detail string can list the top three.
  //
  // Trigger labels are localised per active locale at emit time so a
  // mixed es/en template still produces a readable "Triggers: …" list.
  const SPAM_WORDS = [
    'gratis',
    '100% gratis',
    'urgente',
    'oferta limitada',
    'haz click aquí',
    'click aquí',
    'click here',
    'act now',
    'free!!!',
    'dinero fácil',
    'viagra',
    'bitcoin',
    'casino',
    'garantizado',
    'sin costo',
    'increíble oferta',
  ];

  function _countOccurrences(haystack, needle) {
    if (!needle) return 0;
    const n = needle.toLowerCase();
    let count = 0;
    let idx = 0;
    while ((idx = haystack.indexOf(n, idx)) !== -1) {
      count++;
      idx += n.length;
    }
    return count;
  }

  function _label(key) {
    // Localised trigger labels. Keep them short — they're joined in the
    // detail string.
    const loc = (window.stI18n && window.stI18n.locale) || 'es';
    const es = {
      caps: 'mayúsculas excesivas',
      exclaim: 'exclamaciones excesivas',
      tripleSymbol: 'símbolos repetidos',
      allCapsSubject: 'asunto en mayúsculas',
    };
    const en = {
      caps: 'excessive caps',
      exclaim: 'excessive exclamations',
      tripleSymbol: 'repeated symbols',
      allCapsSubject: 'all-caps subject',
    };
    const dict = (loc === 'en') ? en : es;
    return dict[key] || key;
  }

  window.stReview.register({
    id: 'g4',
    cat: 'legal',
    run: function (tpl) {
      const sources = typeof allTextSources === 'function'
        ? (allTextSources(tpl) || [])
        : [];
      const joined = sources.join(' ');
      const lower = joined.toLowerCase();

      let score = 0;
      const triggers = [];
      const seen = new Set();
      function pushTrigger(label) {
        if (seen.has(label)) return;
        seen.add(label);
        triggers.push(label);
      }

      // 1) Spam keywords (1 point per occurrence).
      for (let i = 0; i < SPAM_WORDS.length; i++) {
        const w = SPAM_WORDS[i];
        const hits = _countOccurrences(lower, w);
        if (hits > 0) {
          score += hits;
          pushTrigger("'" + w + "'");
        }
      }

      // 2) Excessive caps: ratio of fully-uppercase words (len ≥ 4).
      const words = joined.split(/\s+/).filter(function (w) { return w.length > 0; });
      if (words.length > 0) {
        let capsCount = 0;
        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          if (w.length >= 4 && w === w.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(w)) {
            capsCount++;
          }
        }
        const ratio = (capsCount / words.length) * 100;
        if (ratio > 10) {
          const extra = Math.min(3, Math.floor(ratio - 10));
          if (extra > 0) {
            score += extra;
            pushTrigger(_label('caps'));
          }
        }
      }

      // 3) Excessive exclamation marks.
      const exclaims = _countOccurrences(joined, '!');
      if (exclaims > 10) {
        score += 3;
        pushTrigger(_label('exclaim'));
      } else if (exclaims > 6) {
        score += 2;
        pushTrigger(_label('exclaim'));
      } else if (exclaims > 3) {
        score += 1;
        pushTrigger(_label('exclaim'));
      }

      // 4) Repeated symbols ($$$ / €€€ / ¡¡¡) — cap 2 points.
      let symbolHits = 0;
      symbolHits += _countOccurrences(joined, '$$$');
      symbolHits += _countOccurrences(joined, '€€€');
      symbolHits += _countOccurrences(joined, '¡¡¡');
      if (symbolHits > 0) {
        score += Math.min(2, symbolHits);
        pushTrigger(_label('tripleSymbol'));
      }

      // 5) All-caps subject.
      const subject = (tpl && tpl.meta && typeof tpl.meta.subject === 'string') ? tpl.meta.subject : '';
      if (subject.length >= 5 && subject === subject.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(subject)) {
        score += 2;
        pushTrigger(_label('allCapsSubject'));
      }

      // Clamp to [0, 10].
      if (score < 0) score = 0;
      if (score > 10) score = 10;

      const list = triggers.slice(0, 3).join(', ');

      if (score <= 2) {
        return { kind: 'ok', detail: t('review.check.g4.ok', { score: score }) };
      }
      if (score <= 5) {
        return { kind: 'warn', detail: t('review.check.g4.warn', { score: score, list: list }) };
      }
      return { kind: 'error', detail: t('review.check.g4.error', { score: score, list: list }) };
    },
  });
})();
