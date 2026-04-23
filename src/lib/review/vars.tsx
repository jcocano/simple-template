// c4 — merge-tag pre-flight check.
//
// Scans every text source in the template (subject, preview, all block text)
// for {{var}} tokens via window.tokenizeMergeTags, then cross-references each
// used key against tpl.vars:
//   - key missing from tpl.vars            → error  ("unknown")
//   - key declared but sample is empty     → warn   ("no default")
//   - all keys resolve with a sample value → ok
// If the template uses no merge tags at all the check returns null (hidden).
//
// Fix button jumps to the Tags screen via `goSettings: 'vars'`.

(function registerMergeTagCheck() {
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
    'review.check.c4.unknown': 'Etiquetas no declaradas: {list}. Los destinatarios verán el código literal.',
    'review.check.c4.nodefault': '{list} no tiene valor por defecto. Si el contacto no lo tiene, aparecerá vacío.',
    'review.check.c4.ok': '{count} etiquetas usadas, todas con valor por defecto.',
    'review.check.c4.fix.vars': 'Ir a Etiquetas',
  });

  Object.assign(window.stI18nDict.en, {
    'review.check.c4.unknown': 'Undeclared tags: {list}. Recipients will see the literal code.',
    'review.check.c4.nodefault': '{list} has no default value. If the contact lacks it, it will render empty.',
    'review.check.c4.ok': '{count} tags used, all with a default value.',
    'review.check.c4.fix.vars': 'Go to Tags',
  });

  Object.assign(window.stI18nDict.pt, {
    'review.check.c4.unknown': 'Etiquetas não declaradas: {list}. Os destinatários verão o código literal.',
    'review.check.c4.nodefault': '{list} não tem valor padrão. Se o contato não o tiver, aparecerá vazio.',
    'review.check.c4.ok': '{count} etiquetas usadas, todas com valor padrão.',
    'review.check.c4.fix.vars': 'Ir para Etiquetas',
  });

  Object.assign(window.stI18nDict.fr, {
    'review.check.c4.unknown': 'Balises non déclarées : {list}. Les destinataires verront le code littéral.',
    'review.check.c4.nodefault': '{list} n\'a pas de valeur par défaut. Si le contact ne l\'a pas, le rendu sera vide.',
    'review.check.c4.ok': '{count} balises utilisées, toutes avec une valeur par défaut.',
    'review.check.c4.fix.vars': 'Aller aux balises',
  });

  Object.assign(window.stI18nDict.ja, {
    'review.check.c4.unknown': '未宣言のタグ: {list}。受信者にはコードがそのまま表示されます。',
    'review.check.c4.nodefault': '{list} にデフォルト値がありません。連絡先に値がない場合、空で表示されます。',
    'review.check.c4.ok': '{count} 個のタグを使用、すべてデフォルト値あり。',
    'review.check.c4.fix.vars': 'タグへ移動',
  });

  Object.assign(window.stI18nDict.zh, {
    'review.check.c4.unknown': '未声明的标签：{list}。收件人将看到原始代码。',
    'review.check.c4.nodefault': '{list} 没有默认值。如果联系人缺少该字段，将显示为空。',
    'review.check.c4.ok': '使用了 {count} 个标签，均有默认值。',
    'review.check.c4.fix.vars': '前往标签',
  });

  // ── helpers ────────────────────────────────────────────────────────
  const helpers = window.stReview._helpers || {};
  const textOfBlock = helpers.textOfBlock || (() => '');
  const eachBlock = helpers.eachBlock || (() => {});

  function collectUsedKeys(tpl) {
    const tokenize = window.tokenizeMergeTags;
    const used = new Set();
    if (typeof tokenize !== 'function') return used;

    const scan = (text) => {
      if (!text) return;
      let toks = [];
      try { toks = tokenize(text) || []; } catch { toks = []; }
      for (const tk of toks) {
        if (tk && tk.type === 'var' && typeof tk.key === 'string' && tk.key) {
          used.add(tk.key);
        }
      }
    };

    const meta = (tpl && tpl.meta) || {};
    scan(meta.subject);
    scan(meta.preview);
    eachBlock(tpl, (blk) => { scan(textOfBlock(blk)); });

    return used;
  }

  function declaredVarsMap(tpl) {
    const map = new Map();
    const list = (tpl && Array.isArray(tpl.vars)) ? tpl.vars : [];
    for (const v of list) {
      if (!v || typeof v.key !== 'string' || !v.key) continue;
      map.set(v.key, v);
    }
    return map;
  }

  function hasDefault(v) {
    if (!v) return false;
    const s = v.sample;
    if (s == null) return false;
    if (typeof s === 'string' && s === '') return false;
    return true;
  }

  function formatList(keys) {
    return keys.map(k => `{{${k}}}`).join(', ');
  }

  // ── check ──────────────────────────────────────────────────────────
  window.stReview.register({
    id: 'c4',
    cat: 'content',
    run(tpl) {
      const t = (window.stI18n && window.stI18n.t) ? window.stI18n.t : ((k) => k);

      const used = collectUsedKeys(tpl);
      if (used.size === 0) return null; // no tags used → hide check

      const declared = declaredVarsMap(tpl);
      const unknown = [];
      const noDefault = [];
      for (const key of used) {
        if (!declared.has(key)) {
          unknown.push(key);
        } else if (!hasDefault(declared.get(key))) {
          noDefault.push(key);
        }
      }

      const fix = { goSettings: 'vars', label: t('review.check.c4.fix.vars') };

      if (unknown.length > 0) {
        return {
          kind: 'error',
          detail: t('review.check.c4.unknown', { list: formatList(unknown) }),
          fixes: [fix],
        };
      }

      if (noDefault.length > 0) {
        return {
          kind: 'warn',
          detail: t('review.check.c4.nodefault', { list: formatList(noDefault) }),
          fixes: [fix],
        };
      }

      return {
        kind: 'ok',
        detail: t('review.check.c4.ok', { count: used.size }),
      };
    },
  });
})();
