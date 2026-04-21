// Vista previa — un solo correo, 2 switches (dispositivo y tema)

function Preview({ onBack }) {
  const [device, setDevice] = React.useState('desktop'); // desktop | mobile
  const [theme, setTheme]   = React.useState('light');   // light | dark

  const isMobile = device === 'mobile';
  const isDark   = theme === 'dark';

  // Ancho del "papel" del correo
  const emailWidth = isMobile ? 390 : 640;

  // Colores del cliente (la app/cliente simulado, no el correo)
  const clientBg     = isDark ? '#0b0b0d' : '#edece6';
  const chromeBg     = isDark ? '#17171a' : '#ffffff';
  const chromeFg     = isDark ? '#e7e7ea' : '#1a1a17';
  const chromeSub    = isDark ? '#8a8a92' : '#6b6b72';
  const chromeLine   = isDark ? '#26262b' : '#e8e7e1';

  // Render de una sección (con sus columnas y bloques)
  const renderSection = (section) => {
    const st = section.style || {};
    const pad = st.padding ?? 24;
    const cols = section.columns || [];
    const totalW = cols.reduce((s,c)=>s+(c.w||0),0) || 100;

    return (
      <div key={section.id} style={{
        background: st.bg || '#ffffff',
        color: st.text || '#1a1a17',
        padding: isMobile ? `${Math.min(pad,20)}px 14px` : `${pad}px ${Math.max(pad-4,16)}px`,
        textAlign: st.align || 'left',
        fontFamily: st.font ? `var(--font-${st.font}, var(--font-sans))` : 'var(--font-sans)',
      }}>
        <div style={{
          display: isMobile ? 'block' : 'flex',
          gap: isMobile ? 0 : 16,
          alignItems:'flex-start',
          maxWidth: isMobile ? '100%' : 600, margin:'0 auto',
        }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{
              flex: isMobile ? 'none' : `0 0 ${(col.w/totalW)*100 - 2}%`,
              width: isMobile ? '100%' : undefined,
              marginBottom: isMobile && ci<cols.length-1 ? 20 : 0,
            }}>
              {(col.blocks||[]).map(b => {
                const R = EB_RENDERERS[b.type];
                return R ? <R key={b.id} data={b.data}/> : null;
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Chrome del cliente de correo (cabecera que simula Gmail/Mail)
  const EmailChrome = (
    <div style={{
      background: chromeBg,
      borderBottom:`1px solid ${chromeLine}`,
      padding: isMobile ? '14px 16px' : '16px 22px',
    }}>
      <div style={{
        display:'flex',alignItems:'center',gap:12,marginBottom:10,
      }}>
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
          }}>Newsletter de Noviembre</div>
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

  // Status bar superior del "dispositivo"
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
        <button className="btn ghost sm" onClick={onBack}><I.chevronL size={14}/> Editor</button>
        <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,letterSpacing:-0.2}}>Vista previa</div>
        <span className="chip">Newsletter de Noviembre</span>

        <div className="grow"/>

        {/* Switch 1 — Dispositivo */}
        <div className="seg" role="tablist" aria-label="Dispositivo">
          <button
            className={device==='desktop'?'on':''}
            onClick={()=>setDevice('desktop')}
            title="Escritorio"
            aria-label="Escritorio"
          >
            <I.monitor size={13}/>
          </button>
          <button
            className={device==='mobile'?'on':''}
            onClick={()=>setDevice('mobile')}
            title="Móvil"
            aria-label="Móvil"
          >
            <I.phone size={13}/>
          </button>
        </div>

        {/* Switch 2 — Tema */}
        <div className="seg" role="tablist" aria-label="Tema">
          <button
            className={theme==='light'?'on':''}
            onClick={()=>setTheme('light')}
            title="Claro"
            aria-label="Claro"
          >
            <I.sun size={13}/>
          </button>
          <button
            className={theme==='dark'?'on':''}
            onClick={()=>setTheme('dark')}
            title="Oscuro"
            aria-label="Oscuro"
          >
            <I.moon size={13}/>
          </button>
        </div>

        <button className="btn sm"><I.send size={13}/> Enviar prueba</button>
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

          {/* Cuerpo del correo — renderizado REAL a partir del doc */}
          <div style={{
            background: isDark ? '#0f0f12' : '#f6f5f1',
            padding: isMobile ? '12px 0' : '24px 0',
            overflow:'hidden',
          }}>
            <div style={{
              maxWidth: isMobile ? '100%' : 600, margin:'0 auto',
              background:'#ffffff',
              color:'#1a1a17',
              fontFamily:'var(--font-sans)',
              boxShadow: isDark ? '0 8px 32px -12px rgba(0,0,0,.8)' : 'none',
            }}>
              {DEFAULT_DOC.map(renderSection)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Preview = Preview;
