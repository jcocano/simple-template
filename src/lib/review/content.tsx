// Content-category pre-flight review checks.
//
// Registers c1 (subject), c2 (preview text), c3 (CTA count) and c5 (word count)
// against the review engine at window.stReview. Titles for these ids are
// already provided by the global i18n dicts; this file only adds the dynamic
// detail strings each check emits (empty/short/long/ok/info variants).

(function registerContentChecks() {
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
    // c1 — subject
    'review.check.c1.empty': 'El asunto está vacío',
    'review.check.c1.short': 'Asunto muy corto ({len} caracteres)',
    'review.check.c1.long': 'Asunto muy largo ({len} caracteres), puede recortarse en la bandeja',
    'review.check.c1.ok': '{len} caracteres, longitud adecuada',
    // c2 — preheader (inbox preview text)
    'review.check.c2.empty': 'Sin texto de preheader (la previsualización que se ve en la bandeja). Ayuda al open rate.',
    'review.check.c2.short': 'Preheader muy corto ({len} caracteres). Recomendado entre 40 y 90.',
    'review.check.c2.long': 'Preheader demasiado largo ({len} caracteres), se va a cortar en la bandeja.',
    'review.check.c2.ok': 'Preheader de {len} caracteres, longitud adecuada.',
    // c3 — CTAs
    'review.check.c3.none': 'No hay botones de llamada a la acción',
    'review.check.c3.ok': '{count} botón(es) CTA',
    'review.check.c3.many': 'Hay {count} CTAs, puede saturar el mensaje',
    // c5 — word count
    'review.check.c5.empty': 'El correo está vacío de texto',
    'review.check.c5.short': 'Solo {count} palabras, demasiado breve',
    'review.check.c5.ok': '{count} palabras, longitud adecuada',
    'review.check.c5.long': '{count} palabras, considera acortar',
    'review.check.c5.title': 'Longitud del cuerpo',
  });

  Object.assign(window.stI18nDict.en, {
    // c1 — subject
    'review.check.c1.empty': 'Subject is empty',
    'review.check.c1.short': 'Subject is very short ({len} characters)',
    'review.check.c1.long': 'Subject is too long ({len} characters), may be truncated in the inbox',
    'review.check.c1.ok': '{len} characters, good length',
    // c2 — preheader (inbox preview text)
    'review.check.c2.empty': 'No preheader text (the inbox preview line). It helps open rate.',
    'review.check.c2.short': 'Preheader is very short ({len} characters). Recommended 40–90.',
    'review.check.c2.long': 'Preheader is too long ({len} characters), the inbox will truncate it.',
    'review.check.c2.ok': 'Preheader is {len} characters, good length.',
    // c3 — CTAs
    'review.check.c3.none': 'No call-to-action buttons',
    'review.check.c3.ok': '{count} CTA button(s)',
    'review.check.c3.many': '{count} CTAs found, the message may feel cluttered',
    // c5 — word count
    'review.check.c5.empty': 'The email has no text',
    'review.check.c5.short': 'Only {count} words, too brief',
    'review.check.c5.ok': '{count} words, good length',
    'review.check.c5.long': '{count} words, consider trimming',
    'review.check.c5.title': 'Body length',
  });

  Object.assign(window.stI18nDict.pt, {
    // c1 — subject
    'review.check.c1.empty': 'O assunto está vazio',
    'review.check.c1.short': 'Assunto muito curto ({len} caracteres)',
    'review.check.c1.long': 'Assunto muito longo ({len} caracteres), pode ser truncado na caixa de entrada',
    'review.check.c1.ok': '{len} caracteres, tamanho adequado',
    // c2 — preheader (inbox preview text)
    'review.check.c2.empty': 'Sem texto de preheader (a prévia visível na caixa de entrada). Ajuda na taxa de abertura.',
    'review.check.c2.short': 'Preheader muito curto ({len} caracteres). Recomendado entre 40 e 90.',
    'review.check.c2.long': 'Preheader longo demais ({len} caracteres), a caixa de entrada vai truncar.',
    'review.check.c2.ok': 'Preheader de {len} caracteres, tamanho adequado.',
    // c3 — CTAs
    'review.check.c3.none': 'Nenhum botão de chamada para ação',
    'review.check.c3.ok': '{count} botão(ões) CTA',
    'review.check.c3.many': '{count} CTAs encontrados, a mensagem pode ficar sobrecarregada',
    // c5 — word count
    'review.check.c5.empty': 'O e-mail não tem texto',
    'review.check.c5.short': 'Apenas {count} palavras, muito breve',
    'review.check.c5.ok': '{count} palavras, tamanho adequado',
    'review.check.c5.long': '{count} palavras, considere encurtar',
    'review.check.c5.title': 'Tamanho do corpo',
  });

  Object.assign(window.stI18nDict.fr, {
    // c1 — subject
    'review.check.c1.empty': 'L\'objet est vide',
    'review.check.c1.short': 'Objet très court ({len} caractères)',
    'review.check.c1.long': 'Objet trop long ({len} caractères), peut être tronqué dans la boîte de réception',
    'review.check.c1.ok': '{len} caractères, longueur adéquate',
    // c2 — preheader (inbox preview text)
    'review.check.c2.empty': 'Pas de texte de preheader (l\'aperçu visible dans la boîte de réception). Améliore le taux d\'ouverture.',
    'review.check.c2.short': 'Preheader très court ({len} caractères). Recommandé entre 40 et 90.',
    'review.check.c2.long': 'Preheader trop long ({len} caractères), la boîte de réception le tronquera.',
    'review.check.c2.ok': 'Preheader de {len} caractères, longueur adéquate.',
    // c3 — CTAs
    'review.check.c3.none': 'Aucun bouton d\'appel à l\'action',
    'review.check.c3.ok': '{count} bouton(s) CTA',
    'review.check.c3.many': '{count} CTAs trouvés, le message peut paraître encombré',
    // c5 — word count
    'review.check.c5.empty': 'L\'e-mail ne contient pas de texte',
    'review.check.c5.short': 'Seulement {count} mots, trop bref',
    'review.check.c5.ok': '{count} mots, longueur adéquate',
    'review.check.c5.long': '{count} mots, envisagez de raccourcir',
    'review.check.c5.title': 'Longueur du corps',
  });

  Object.assign(window.stI18nDict.ja, {
    // c1 — subject
    'review.check.c1.empty': '件名が空です',
    'review.check.c1.short': '件名が短すぎます ({len} 文字)',
    'review.check.c1.long': '件名が長すぎます ({len} 文字)。受信トレイで切り詰められる可能性があります',
    'review.check.c1.ok': '{len} 文字、適切な長さです',
    // c2 — preheader (inbox preview text)
    'review.check.c2.empty': 'プリヘッダーテキストがありません (受信トレイに表示されるプレビュー)。開封率の向上に役立ちます。',
    'review.check.c2.short': 'プリヘッダーが短すぎます ({len} 文字)。推奨は 40〜90 文字です。',
    'review.check.c2.long': 'プリヘッダーが長すぎます ({len} 文字)。受信トレイで切り詰められます。',
    'review.check.c2.ok': 'プリヘッダー {len} 文字、適切な長さです。',
    // c3 — CTAs
    'review.check.c3.none': 'CTA ボタンがありません',
    'review.check.c3.ok': 'CTA ボタン {count} 個',
    'review.check.c3.many': 'CTA が {count} 個あります。メッセージが混雑して見える可能性があります',
    // c5 — word count
    'review.check.c5.empty': 'メールにテキストがありません',
    'review.check.c5.short': '{count} 語のみ、短すぎます',
    'review.check.c5.ok': '{count} 語、適切な長さです',
    'review.check.c5.long': '{count} 語、短縮を検討してください',
    'review.check.c5.title': '本文の長さ',
  });

  Object.assign(window.stI18nDict.zh, {
    // c1 — subject
    'review.check.c1.empty': '主题为空',
    'review.check.c1.short': '主题过短 ({len} 个字符)',
    'review.check.c1.long': '主题过长 ({len} 个字符)，在收件箱中可能被截断',
    'review.check.c1.ok': '{len} 个字符，长度合适',
    // c2 — preheader (inbox preview text)
    'review.check.c2.empty': '没有预览文本 (收件箱中显示的预览行)。有助于提升打开率。',
    'review.check.c2.short': '预览文本过短 ({len} 个字符)。建议 40–90 个字符。',
    'review.check.c2.long': '预览文本过长 ({len} 个字符)，收件箱会将其截断。',
    'review.check.c2.ok': '预览文本 {len} 个字符，长度合适。',
    // c3 — CTAs
    'review.check.c3.none': '没有行动号召按钮',
    'review.check.c3.ok': '{count} 个 CTA 按钮',
    'review.check.c3.many': '发现 {count} 个 CTA，消息可能显得杂乱',
    // c5 — word count
    'review.check.c5.empty': '邮件没有文本',
    'review.check.c5.short': '仅 {count} 个词，过于简短',
    'review.check.c5.ok': '{count} 个词，长度合适',
    'review.check.c5.long': '{count} 个词，建议精简',
    'review.check.c5.title': '正文长度',
  });

  const t = function (key, params) {
    return window.stI18n && typeof window.stI18n.t === 'function'
      ? window.stI18n.t(key, params)
      : key;
  };

  // Fix helper: dispara el evento que abre DetailsModal desde app.tsx.
  const editDetailsFix = () => ({
    label: t('review.check.fix.editDetails'),
    action: function () { window.dispatchEvent(new CustomEvent('st:open-details')); },
  });

  // ── c1 — Subject not empty ───────────────────────────────────────────
  window.stReview.register({
    id: 'c1',
    cat: 'content',
    run: function (tpl) {
      const meta = (tpl && tpl.meta) || {};
      const raw = typeof meta.subject === 'string' ? meta.subject : '';
      const trimmed = raw.trim();
      if (!trimmed) {
        return { kind: 'error', detail: t('review.check.c1.empty'), fixes: [editDetailsFix()] };
      }
      const len = raw.length;
      if (len < 10) {
        return { kind: 'warn', detail: t('review.check.c1.short', { len: len }), fixes: [editDetailsFix()] };
      }
      if (len > 70) {
        return { kind: 'warn', detail: t('review.check.c1.long', { len: len }), fixes: [editDetailsFix()] };
      }
      return { kind: 'ok', detail: t('review.check.c1.ok', { len: len }) };
    },
  });

  // ── c2 — Preheader (inbox preview text) length ───────────────────────
  window.stReview.register({
    id: 'c2',
    cat: 'content',
    run: function (tpl) {
      const meta = (tpl && tpl.meta) || {};
      const raw = typeof meta.preview === 'string' ? meta.preview : '';
      const len = raw.length;
      if (len === 0) {
        return { kind: 'warn', detail: t('review.check.c2.empty'), fixes: [editDetailsFix()] };
      }
      if (len < 40) {
        return { kind: 'warn', detail: t('review.check.c2.short', { len: len }), fixes: [editDetailsFix()] };
      }
      if (len > 130) {
        return { kind: 'warn', detail: t('review.check.c2.long', { len: len }), fixes: [editDetailsFix()] };
      }
      return { kind: 'ok', detail: t('review.check.c2.ok', { len: len }) };
    },
  });

  // ── c3 — At least one CTA ────────────────────────────────────────────
  window.stReview.register({
    id: 'c3',
    cat: 'content',
    run: function (tpl) {
      let count = 0;
      const helpers = (window.stReview && window.stReview._helpers) || {};
      if (typeof helpers.eachBlock === 'function') {
        helpers.eachBlock(tpl, function (blk) {
          const type = blk && blk.type;
          if (type === 'button' || type === 'cta') count++;
        });
      }
      if (count === 0) {
        return { kind: 'warn', detail: t('review.check.c3.none') };
      }
      if (count <= 3) {
        return { kind: 'ok', detail: t('review.check.c3.ok', { count: count }) };
      }
      return { kind: 'info', detail: t('review.check.c3.many', { count: count }) };
    },
  });

  // ── c5 — Word count across all text sources ──────────────────────────
  window.stReview.register({
    id: 'c5',
    cat: 'content',
    run: function (tpl) {
      const helpers = (window.stReview && window.stReview._helpers) || {};
      const sources = typeof helpers.allTextSources === 'function'
        ? (helpers.allTextSources(tpl) || [])
        : [];
      let total = 0;
      for (let i = 0; i < sources.length; i++) {
        const s = typeof sources[i] === 'string' ? sources[i] : '';
        if (!s) continue;
        const words = s.split(/\s+/).filter(function (w) { return w.length > 0; });
        total += words.length;
      }
      if (total === 0) {
        return { kind: 'warn', detail: t('review.check.c5.empty') };
      }
      if (total < 50) {
        return { kind: 'warn', detail: t('review.check.c5.short', { count: total }) };
      }
      if (total <= 400) {
        return { kind: 'ok', detail: t('review.check.c5.ok', { count: total }) };
      }
      return { kind: 'info', detail: t('review.check.c5.long', { count: total }) };
    },
  });
})();
