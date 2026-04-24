// Images-category pre-flight review checks.
//
// Registers:
//   i1 — per-image weight (warn >500 KB, error >1 MB)
//   i2 — total email weight (HTML + all images)
//
// Both checks are async: data/blob URLs are measured synchronously-ish, but
// remote http(s) URLs need a HEAD fetch (best-effort; CORS may block). The
// engine's runAsync() awaits the returned Promise.
//
// Module-level cache: i1 populates _lastSizes keyed by tpl.id so i2 can reuse
// the same measurements instead of re-hitting the network for every image.

(function registerImageChecks() {
  if (!window.stReview || typeof window.stReview.register !== 'function') return;

  const helpers = (window.stReview && window.stReview._helpers) || {};
  const eachBlock = helpers.eachBlock;
  const getContent = helpers.getContent;
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
    'review.check.i1.ok': '{count} imagen(es) pesan {totalKb} KB en total.',
    'review.check.i1.heavy': 'Imagen de {sizeKb} KB (recomendado &lt;500 KB).',
    'review.check.i1.tooHeavy': 'Imagen de {sizeKb} KB supera 1 MB, va a cargar lento en 4G.',
    'review.check.i1.cors': 'No se pudo medir {count} imagen(es) por CORS. Previsualiza para verificar.',
    'review.check.i1.fix.focus': 'Ir a la imagen',
    'review.check.i2.ok': 'Peso total ~{totalKb} KB, carga rápida.',
    'review.check.i2.mid': 'Peso total ~{totalMb} MB, aceptable pero ajustado.',
    'review.check.i2.big': 'Peso total ~{totalMb} MB, puede ser problemático en 4G.',
    'review.check.i2.htmlOnly': '{kb} KB de HTML, dentro del límite de Gmail.',
    'review.check.i3.ok': 'Todas las imágenes locales existen.',
    'review.check.i3.missing': '{count} imagen(es) locales referencian archivos que ya no existen en disco.',
    'review.check.i3.fix.focus': 'Ir a la imagen rota',
  });

  Object.assign(window.stI18nDict.en, {
    'review.check.i1.ok': '{count} image(s) weigh {totalKb} KB total.',
    'review.check.i1.heavy': 'Image is {sizeKb} KB (recommended &lt;500 KB).',
    'review.check.i1.tooHeavy': 'Image is {sizeKb} KB, over 1 MB — will load slowly on 4G.',
    'review.check.i1.cors': 'Could not measure {count} image(s) due to CORS. Preview to verify.',
    'review.check.i1.fix.focus': 'Go to image',
    'review.check.i2.ok': 'Total weight ~{totalKb} KB, loads fast.',
    'review.check.i2.mid': 'Total weight ~{totalMb} MB, acceptable but tight.',
    'review.check.i2.big': 'Total weight ~{totalMb} MB, may struggle on 4G.',
    'review.check.i2.htmlOnly': '{kb} KB of HTML, well under Gmail limit.',
    'review.check.i3.ok': 'All local images exist.',
    'review.check.i3.missing': '{count} local image(s) reference files that no longer exist on disk.',
    'review.check.i3.fix.focus': 'Go to broken image',
  });

  Object.assign(window.stI18nDict.pt, {
    'review.check.i1.ok': '{count} imagem(ns) pesam {totalKb} KB no total.',
    'review.check.i1.heavy': 'Imagem de {sizeKb} KB (recomendado &lt;500 KB).',
    'review.check.i1.tooHeavy': 'Imagem de {sizeKb} KB supera 1 MB, vai carregar devagar no 4G.',
    'review.check.i1.cors': 'Não foi possível medir {count} imagem(ns) por CORS. Pré-visualize para verificar.',
    'review.check.i1.fix.focus': 'Ir para a imagem',
    'review.check.i2.ok': 'Peso total ~{totalKb} KB, carrega rápido.',
    'review.check.i2.mid': 'Peso total ~{totalMb} MB, aceitável mas no limite.',
    'review.check.i2.big': 'Peso total ~{totalMb} MB, pode ter problemas no 4G.',
    'review.check.i2.htmlOnly': '{kb} KB de HTML, bem dentro do limite do Gmail.',
    'review.check.i3.ok': 'Todas as imagens locais existem.',
    'review.check.i3.missing': '{count} imagem(ns) local(is) referenciam arquivos que não existem mais em disco.',
    'review.check.i3.fix.focus': 'Ir para a imagem quebrada',
  });

  Object.assign(window.stI18nDict.fr, {
    'review.check.i1.ok': '{count} image(s) pèsent {totalKb} KB au total.',
    'review.check.i1.heavy': 'Image de {sizeKb} KB (recommandé &lt;500 KB).',
    'review.check.i1.tooHeavy': 'Image de {sizeKb} KB dépasse 1 MB, chargement lent en 4G.',
    'review.check.i1.cors': 'Impossible de mesurer {count} image(s) à cause de CORS. Prévisualisez pour vérifier.',
    'review.check.i1.fix.focus': 'Aller à l\'image',
    'review.check.i2.ok': 'Poids total ~{totalKb} KB, chargement rapide.',
    'review.check.i2.mid': 'Poids total ~{totalMb} MB, acceptable mais juste.',
    'review.check.i2.big': 'Poids total ~{totalMb} MB, peut poser problème en 4G.',
    'review.check.i2.htmlOnly': '{kb} KB de HTML, bien en deçà de la limite Gmail.',
    'review.check.i3.ok': 'Toutes les images locales existent.',
    'review.check.i3.missing': '{count} image(s) locale(s) référencent des fichiers qui n\'existent plus sur le disque.',
    'review.check.i3.fix.focus': 'Aller à l\'image manquante',
  });

  Object.assign(window.stI18nDict.ja, {
    'review.check.i1.ok': '{count} 個の画像、合計 {totalKb} KB です。',
    'review.check.i1.heavy': '画像サイズ {sizeKb} KB (推奨 &lt;500 KB)。',
    'review.check.i1.tooHeavy': '画像サイズ {sizeKb} KB は 1 MB を超え、4G で読み込みが遅くなります。',
    'review.check.i1.cors': 'CORS により {count} 個の画像を計測できませんでした。プレビューで確認してください。',
    'review.check.i1.fix.focus': '画像へ移動',
    'review.check.i2.ok': '合計サイズ 約 {totalKb} KB、高速に読み込まれます。',
    'review.check.i2.mid': '合計サイズ 約 {totalMb} MB、許容範囲ですが余裕はありません。',
    'review.check.i2.big': '合計サイズ 約 {totalMb} MB、4G で問題が生じる可能性があります。',
    'review.check.i2.htmlOnly': 'HTML サイズ {kb} KB、Gmail の上限内に十分収まっています。',
    'review.check.i3.ok': 'ローカル画像はすべて存在します。',
    'review.check.i3.missing': '{count} 個のローカル画像が、ディスク上に存在しないファイルを参照しています。',
    'review.check.i3.fix.focus': '欠落した画像へ移動',
  });

  Object.assign(window.stI18nDict.zh, {
    'review.check.i1.ok': '{count} 张图片总计 {totalKb} KB。',
    'review.check.i1.heavy': '图片 {sizeKb} KB (建议 &lt;500 KB)。',
    'review.check.i1.tooHeavy': '图片 {sizeKb} KB 超过 1 MB，4G 下加载缓慢。',
    'review.check.i1.cors': '由于 CORS 无法测量 {count} 张图片。请预览验证。',
    'review.check.i1.fix.focus': '前往图片',
    'review.check.i2.ok': '总大小约 {totalKb} KB，加载迅速。',
    'review.check.i2.mid': '总大小约 {totalMb} MB，可接受但接近上限。',
    'review.check.i2.big': '总大小约 {totalMb} MB，在 4G 下可能有问题。',
    'review.check.i2.htmlOnly': 'HTML {kb} KB，远低于 Gmail 限制。',
    'review.check.i3.ok': '所有本地图片均存在。',
    'review.check.i3.missing': '{count} 张本地图片引用的文件在磁盘上已不存在。',
    'review.check.i3.fix.focus': '前往缺失的图片',
  });

  const t = function (key, params) {
    return (window.stI18n && typeof window.stI18n.t === 'function')
      ? window.stI18n.t(key, params)
      : key;
  };

  const IMG_TYPES = { image: 1, hero: 1, gif: 1 };

  // ── Module-level cache so i2 can reuse i1's measurements ─────────────
  let _lastMeasuredFor = null;
  let _lastSizes = new Map(); // key: url string → bytes or null (unknown)

  // ── URL resolver: read from either content.src, data.src, or data.url ─
  function _imgUrl(block) {
    if (!block || !block.data) return null;
    const c = (typeof getContent === 'function') ? getContent(block.data) : block.data;
    return (c && c.src) || block.data.src || (block.data.content && block.data.content.url) || null;
  }

  // ── Timeout helper for HEAD fetches ──────────────────────────────────
  function _withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); }),
    ]);
  }

  // ── Measure a single URL ─────────────────────────────────────────────
  async function measureImage(url) {
    if (!url || typeof url !== 'string') return null;

    // data: URL — exact (decode base64 length or url-encoded text)
    if (url.startsWith('data:')) {
      const comma = url.indexOf(',');
      if (comma === -1) return null;
      const meta = url.slice(5, comma);
      const body = url.slice(comma + 1);
      if (meta.includes(';base64')) {
        const pad = (body.match(/=+$/) || [''])[0].length;
        return Math.floor(body.length * 3 / 4) - pad;
      }
      try { return decodeURIComponent(body).length; } catch (e) { return body.length; }
    }

    // blob: URL — exact via fetch + .size
    if (url.startsWith('blob:')) {
      try {
        const r = await _withTimeout(fetch(url), 5000);
        const b = await r.blob();
        return b.size;
      } catch (e) { return null; }
    }

    // http(s) — HEAD request, may fail on CORS
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const r = await _withTimeout(fetch(url, { method: 'HEAD' }), 5000);
        const cl = r.headers.get('content-length');
        if (cl) {
          const n = parseInt(cl, 10);
          return isNaN(n) ? null : n;
        }
      } catch (e) { /* CORS, network, or timeout */ }
      return null;
    }

    return null;
  }

  // ── Collect image blocks with their coords ───────────────────────────
  function _collectImageBlocks(tpl) {
    const out = [];
    if (typeof eachBlock !== 'function') return out;
    eachBlock(tpl, function (blk, ctx) {
      if (!blk || !IMG_TYPES[blk.type]) return;
      const url = _imgUrl(blk);
      if (!url) return;
      out.push({ url: url, si: ctx.si, ci: ctx.ci, bi: ctx.bi });
    });
    return out;
  }

  // Measure a list of image blocks; dedupe URLs so duplicate images are
  // only fetched once, but each occurrence still carries the measured size.
  async function _measureAll(tpl) {
    const tplId = (tpl && tpl.id) || null;
    const imgs = _collectImageBlocks(tpl);

    // If we already measured for this exact tpl id, reuse.
    const useCache = tplId && _lastMeasuredFor === tplId;

    const uniqueUrls = [];
    const seen = new Set();
    for (let i = 0; i < imgs.length; i++) {
      if (!seen.has(imgs[i].url)) { seen.add(imgs[i].url); uniqueUrls.push(imgs[i].url); }
    }

    const sizes = useCache ? _lastSizes : new Map();
    if (!useCache) {
      const results = await Promise.all(uniqueUrls.map(function (u) { return measureImage(u); }));
      for (let i = 0; i < uniqueUrls.length; i++) sizes.set(uniqueUrls[i], results[i]);
      _lastSizes = sizes;
      _lastMeasuredFor = tplId;
    } else {
      // Top up in case new URLs appeared (rare — tpl.id same but doc mutated)
      const missing = uniqueUrls.filter(function (u) { return !sizes.has(u); });
      if (missing.length) {
        const extras = await Promise.all(missing.map(function (u) { return measureImage(u); }));
        for (let i = 0; i < missing.length; i++) sizes.set(missing[i], extras[i]);
      }
    }

    // Attach size to each occurrence
    return imgs.map(function (r) { return Object.assign({}, r, { size: sizes.get(r.url) }); });
  }

  // ── i1 — Imagen pesada ──────────────────────────────────────────────
  window.stReview.register({
    id: 'i1',
    cat: 'images',
    run: async function (tpl) {
      const imgs = await _measureAll(tpl);
      if (imgs.length === 0) return null;

      const WARN = 500000;
      const ERR = 1000000;

      let unknown = 0;
      let heaviest = null; // { size, si, ci, bi }
      let totalKnown = 0;
      let knownCount = 0;

      for (let i = 0; i < imgs.length; i++) {
        const it = imgs[i];
        if (it.size == null) { unknown++; continue; }
        knownCount++;
        totalKnown += it.size;
        if (!heaviest || it.size > heaviest.size) heaviest = it;
      }

      // Worst offender (by size) to focus
      const focus = heaviest
        ? { si: heaviest.si, ci: heaviest.ci, bi: heaviest.bi }
        : null;
      const focusFix = focus
        ? [{ focusBlock: focus, label: t('review.check.i1.fix.focus') }]
        : null;

      // Over 1 MB → error
      if (heaviest && heaviest.size > ERR) {
        return {
          kind: 'error',
          detail: t('review.check.i1.tooHeavy', { sizeKb: Math.round(heaviest.size / 1024) }),
          fixes: focusFix,
        };
      }

      // Between 500 KB and 1 MB → warn
      if (heaviest && heaviest.size > WARN) {
        return {
          kind: 'warn',
          detail: t('review.check.i1.heavy', { sizeKb: Math.round(heaviest.size / 1024) }),
          fixes: focusFix,
        };
      }

      // Some unknown (CORS/timeout) and no heavy offender → info
      if (unknown > 0) {
        return {
          kind: 'info',
          detail: t('review.check.i1.cors', { count: unknown }),
        };
      }

      // All measured and all ≤ 500 KB → ok
      return {
        kind: 'ok',
        detail: t('review.check.i1.ok', {
          count: knownCount,
          totalKb: Math.round(totalKnown / 1024),
        }),
      };
    },
  });

  // ── i2 — Peso total del correo ──────────────────────────────────────
  window.stReview.register({
    id: 'i2',
    cat: 'images',
    run: async function (tpl) {
      const imgs = await _measureAll(tpl);

      // Image bytes — dedupe by URL so duplicates don't double-count (a
      // single hosted asset is fetched once even if embedded multiple
      // times in the document).
      let imgBytes = 0;
      const counted = new Set();
      for (let i = 0; i < imgs.length; i++) {
        const it = imgs[i];
        if (it.size == null) continue;
        if (counted.has(it.url)) continue;
        counted.add(it.url);
        imgBytes += it.size;
      }

      // HTML bytes
      let htmlBytes = 0;
      try {
        const html = typeof emitEmailHtml === 'function' ? emitEmailHtml(tpl) : null;
        if (typeof html === 'string') htmlBytes = html.length;
      } catch (e) { /* ignore */ }

      const total = imgBytes + htmlBytes;
      const GMAIL_CLIP = 102 * 1024;

      // No images present → frame the result around Gmail's HTML clip.
      if (imgs.length === 0) {
        if (htmlBytes <= GMAIL_CLIP) {
          return {
            kind: 'ok',
            detail: t('review.check.i2.htmlOnly', { kb: Math.round(htmlBytes / 1024) }),
          };
        }
        // HTML alone is over Gmail's clip — surface as info using the mid band.
        return {
          kind: 'info',
          detail: t('review.check.i2.mid', { totalMb: (total / 1048576).toFixed(1) }),
        };
      }

      if (total <= 500000) {
        return {
          kind: 'ok',
          detail: t('review.check.i2.ok', { totalKb: Math.round(total / 1024) }),
        };
      }
      if (total <= 2000000) {
        return {
          kind: 'info',
          detail: t('review.check.i2.mid', { totalMb: (total / 1048576).toFixed(1) }),
        };
      }
      return {
        kind: 'warn',
        detail: t('review.check.i2.big', { totalMb: (total / 1048576).toFixed(1) }),
      };
    },
  });

  // ── i3 — Broken local image references ─────────────────────────────
  // Flags `st-img://` URLs that no longer resolve to a file on disk.
  // Happens when a user deletes an image from the library but the block
  // still references it, or after a workspace restore with missing files.
  window.stReview.register({
    id: 'i3',
    cat: 'images',
    run: async function (tpl) {
      const imgs = _collectImageBlocks(tpl);
      const localImgs = imgs.filter(function (it) {
        return typeof it.url === 'string' && it.url.startsWith('st-img://');
      });
      if (localImgs.length === 0) return null;

      if (!window.cdn || typeof window.cdn.checkExists !== 'function') return null;

      const uniqueUrls = Array.from(new Set(localImgs.map(function (it) { return it.url; })));
      let results = {};
      try {
        const resp = await window.cdn.checkExists(uniqueUrls);
        if (resp && resp.ok) results = resp.results || {};
      } catch (e) {
        return null;
      }

      const missing = localImgs.filter(function (it) { return results[it.url] === false; });
      if (missing.length === 0) {
        return { kind: 'ok', detail: t('review.check.i3.ok') };
      }

      const first = missing[0];
      return {
        kind: 'error',
        detail: t('review.check.i3.missing', { count: missing.length }),
        fixes: [{
          focusBlock: { si: first.si, ci: first.ci, bi: first.bi },
          label: t('review.check.i3.fix.focus'),
        }],
      };
    },
  });
})();
