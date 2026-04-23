// Vista previa — iframe con HTML puro generado por docToEmailHtml (R5).
// El contenido del iframe es EXACTAMENTE lo que saldrá exportado (dialect
// 'native'), con substitución de variables al vuelo para que se vean los
// valores sample. El chrome simulado (Gmail-like) queda fuera del iframe.

function Preview({ template, onBack }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [device, setDevice] = React.useState('desktop'); // desktop | mobile
  const [theme, setTheme]   = React.useState('light');   // light | dark
  const [doc, setDoc] = React.useState({ sections: [] });
  const [tplMeta, setTplMeta] = React.useState(null);

  React.useEffect(() => {
    if (!template?.id) { setDoc({ sections: [] }); return; }
    let cancelled = false;
    (async () => {
      const tpl = await window.stTemplates.read(template.id);
      if (cancelled) return;
      setDoc(tpl?.doc && Array.isArray(tpl.doc.sections) ? tpl.doc : { sections: [] });
      setTplMeta(tpl || null);
    })();
    return () => { cancelled = true; };
  }, [template?.id]);

  const isMobile = device === 'mobile';
  const isDark   = theme === 'dark';

  const previewVars = Array.isArray(tplMeta?.vars) ? tplMeta.vars : (window.VARIABLES || []);
  const lang = (window.stI18n && window.stI18n.getLang) ? window.stI18n.getLang() : 'en';

  // Generate email HTML via the same path as export. Using `previewVars`
  // substitutes {{key}} with sample values; dialect stays 'native' so the
  // preview reflects the editor-level document shape.
  const { html } = React.useMemo(() => {
    const fn = window.docToEmailHtml;
    if (!fn) return { html: '<!doctype html><html><body></body></html>', warnings: [] };
    return fn(doc, {
      lang,
      mergeDialect: 'native',
      subject: tplMeta?.meta?.subject || tplMeta?.name || '',
      preheader: tplMeta?.meta?.preheader || '',
      previewVars,
    });
  }, [doc, lang, previewVars, tplMeta?.meta?.subject, tplMeta?.meta?.preheader, tplMeta?.name]);

  // Simulate a mail client's "force dark" transform (Gmail mobile / iOS Mail):
  // invert the whole document and re-invert media so images keep their colors.
  // Inline styles on blocks win over any stylesheet we could inject, so a
  // filter is the only way to move all that hard-coded light into dark without
  // leaking preview concerns into export-html.tsx.
  const previewHtml = React.useMemo(() => {
    if (!isDark) return html;
    // Set html background transparent so the iframe element's own bg shows
    // beyond the body box — otherwise the filter re-inverts whatever we paint
    // here and we lose the dark. Media gets re-inverted so images look right.
    const darkStyle = `<style>html{filter:invert(1) hue-rotate(180deg);background:transparent !important}img,picture,video,svg,canvas,iframe{filter:invert(1) hue-rotate(180deg)}</style>`;
    return html.includes('</head>')
      ? html.replace('</head>', `${darkStyle}</head>`)
      : `${darkStyle}${html}`;
  }, [html, isDark]);

  // Auto-size iframe to content so blank letter-sheet space doesn't show
  // below a short email. `allow-same-origin` gives us contentDocument access;
  // ResizeObserver keeps up with late-loading images.
  const iframeRef = React.useRef(null);
  const [iframeHeight, setIframeHeight] = React.useState(200);
  React.useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    let ro = null;
    const measure = () => {
      try {
        const d = el.contentDocument;
        if (!d) return;
        const h = Math.max(
          d.documentElement?.scrollHeight || 0,
          d.body?.scrollHeight || 0,
        );
        if (h > 0) setIframeHeight(h);
      } catch (_) { /* cross-origin — shouldn't happen with srcDoc + allow-same-origin */ }
    };
    const onLoad = () => {
      measure();
      try {
        const d = el.contentDocument;
        if (d && typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(measure);
          if (d.documentElement) ro.observe(d.documentElement);
          if (d.body) ro.observe(d.body);
        }
      } catch (_) {}
    };
    el.addEventListener('load', onLoad);
    return () => {
      el.removeEventListener('load', onLoad);
      try { ro?.disconnect(); } catch (_) {}
    };
  }, [previewHtml]);

  // Ancho del card del cliente. En desktop, card e iframe comparten ancho para
  // evitar que el chromeBg asome a los lados del email (se notaba en dark por
  // la diferencia contra el bg del iframe). En mobile el card es 15px más
  // ancho para acomodar el bisel/borde tipo teléfono.
  const docMaxWidth = (doc.sections || []).reduce((m, s) => Math.max(m, s.style?.width || 600), 600);
  const iframeWidth = isMobile ? 375 : docMaxWidth;
  const emailWidth = isMobile ? 390 : iframeWidth;

  // Chrome del cliente
  const clientBg     = isDark ? '#0b0b0d' : '#edece6';
  const chromeBg     = isDark ? '#17171a' : '#ffffff';
  const chromeFg     = isDark ? '#e7e7ea' : '#1a1a17';
  const chromeSub    = isDark ? '#8a8a92' : '#6b6b72';
  const chromeLine   = isDark ? '#26262b' : '#e8e7e1';

  const EmailChrome = (
    <div style={{
      background: chromeBg,
      borderBottom:`1px solid ${chromeLine}`,
      padding: isMobile ? '14px 16px' : '16px 22px',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
        <div style={{
          width: isMobile?34:40, height: isMobile?34:40, borderRadius:'50%',
          background:'linear-gradient(135deg,#5b5bf0,#8b5cf6)',
          color:'#fff',display:'grid',placeItems:'center',
          fontWeight:600,fontSize: isMobile?13:15, flex:'0 0 auto',
        }}>A</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{
            fontFamily:'var(--font-display)',
            fontSize: isMobile?14:15,fontWeight:600,color:chromeFg,
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
          }}>{tplMeta?.meta?.subject || tplMeta?.name || template?.name || t('preview.title')}</div>
          <div style={{fontSize:11.5,color:chromeSub,marginTop:2,display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontWeight:500,color:chromeFg}}>Acme Studio</span>
            <span>&lt;hola@acme.com&gt;</span>
            <span style={{marginLeft:'auto',flexShrink:0}}>14 nov · 09:42</span>
          </div>
          <div style={{fontSize:11,color:chromeSub,marginTop:2}}>para mí</div>
        </div>
        {!isMobile && (
          <div style={{display:'flex',gap:4,color:chromeSub}}>
            <div style={{padding:6,borderRadius:6}}><I.star size={14}/></div>
            <div style={{padding:6,borderRadius:6}}><I.mail size={14}/></div>
            <div style={{padding:6,borderRadius:6}}><I.dotsV size={14}/></div>
          </div>
        )}
      </div>
    </div>
  );

  const StatusBar = isMobile ? (
    <div style={{
      background: chromeBg, borderBottom:`1px solid ${chromeLine}`,
      padding:'10px 18px 6px',display:'flex',alignItems:'center',justifyContent:'space-between',
      fontSize:12,fontWeight:600,color:chromeFg,
      fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <span>9:41</span>
      <span style={{display:'flex',gap:4,alignItems:'center'}}>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 8h1M4 6h1M7 4h1M10 2h1" stroke={chromeFg} strokeWidth="2" strokeLinecap="round"/></svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M7 8.5c-2 0-3.5-1.5-3.5-3.5S5 1.5 7 1.5s3.5 1.5 3.5 3.5S9 8.5 7 8.5Z" stroke={chromeFg} strokeWidth="1.3"/></svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x=".5" y=".5" width="18" height="9" rx="2" stroke={chromeFg} opacity=".4"/><rect x="2" y="2" width="13" height="6" rx="1" fill={chromeFg}/><rect x="19" y="3.5" width="2" height="3" rx=".5" fill={chromeFg} opacity=".6"/></svg>
      </span>
    </div>
  ) : null;

  return (
    <div className="editor" style={{background:'var(--bg)'}}>
      {/* Top bar */}
      <div className="editor-top">
        <button className="btn ghost sm" onClick={onBack}><I.chevronL size={14}/> {t('preview.back')}</button>
        <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,letterSpacing:-0.2}}>{t('preview.title')}</div>
        <span className="chip">{tplMeta?.name || template?.name || t('preview.template')}</span>

        <div className="grow"/>

        {/* Switch 1 — Dispositivo */}
        <div className="seg" role="tablist" aria-label={t('preview.device')}>
          <button
            className={device==='desktop'?'on':''}
            onClick={()=>setDevice('desktop')}
            title={t('preview.desktop')}
            aria-label={t('preview.desktop')}
          >
            <I.monitor size={13}/>
          </button>
          <button
            className={device==='mobile'?'on':''}
            onClick={()=>setDevice('mobile')}
            title={t('preview.mobile')}
            aria-label={t('preview.mobile')}
          >
            <I.phone size={13}/>
          </button>
        </div>

        {/* Switch 2 — Tema */}
        <div className="seg" role="tablist" aria-label={t('preview.theme')}>
          <button
            className={theme==='light'?'on':''}
            onClick={()=>setTheme('light')}
            title={t('preview.light')}
            aria-label={t('preview.light')}
          >
            <I.sun size={13}/>
          </button>
          <button
            className={theme==='dark'?'on':''}
            onClick={()=>setTheme('dark')}
            title={t('preview.dark')}
            aria-label={t('preview.dark')}
          >
            <I.moon size={13}/>
          </button>
        </div>

        <button className="btn sm"><I.send size={13}/> {t('preview.sendTest')}</button>
      </div>

      {/* Stage del cliente de correo */}
      <div style={{
        flex:1,
        background: clientBg,
        overflow:'auto',
        display:'flex',
        alignItems:'flex-start',
        justifyContent:'center',
        padding: isMobile ? '32px 16px 64px' : '40px 24px 80px',
        transition:'background 200ms ease',
      }}>
        <div style={{
          width: emailWidth,
          maxWidth:'100%',
          minWidth: 0,
          flex:'0 0 auto',
          background: chromeBg,
          borderRadius: isMobile ? 28 : 10,
          overflow:'hidden',
          boxShadow: isDark
            ? '0 20px 60px -20px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)'
            : '0 20px 60px -20px rgba(26,26,46,.2), 0 0 0 1px rgba(26,26,46,.04)',
          border: isMobile ? `6px solid ${isDark?'#1e1e22':'#d7d6d0'}` : 'none',
          transition:'all 250ms ease',
        }}>
          {StatusBar}
          {EmailChrome}

          {/* Iframe con el HTML email real — nada fuera del generador. */}
          {doc.sections.length === 0 ? (
            <div style={{padding:'40px 24px',textAlign:'center',color:'#8e8b7e',fontSize:13,background:'#ffffff'}}>
              {t('preview.empty')}
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              title="email-preview"
              srcDoc={previewHtml}
              sandbox="allow-same-origin"
              style={{
                display:'block',
                width: iframeWidth,
                maxWidth:'100%',
                height: iframeHeight,
                border:0,
                background: isDark ? '#0b0b0d' : '#ffffff',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

window.Preview = Preview;
