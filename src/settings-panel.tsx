// Settings panel — full-screen panel with sidebar + 7 sections
// Section 3 (Envío de pruebas) reuses DeliveryInner from smtp-modal.jsx

const SETTINGS_SECTIONS = [
  { id:'account',    label:'Perfil',                      icon:'user',     desc:'Tu nombre y cómo apareces en las plantillas' },
  { id:'brand',      label:'Marca',                       icon:'palette',  desc:'Colores, fuentes, logo, footer legal' },
  { id:'appearance', label:'Apariencia',                  icon:'sun',      desc:'Tema, densidad, esquinas y tipografía de la app' },
  { id:'storage',    label:'Almacenamiento de imágenes',  icon:'image',    desc:'Dónde se alojan las imágenes de tus correos' },
  { id:'delivery',   label:'Envío de pruebas',            icon:'send',     desc:'Cuenta desde la que envías pruebas' },
  { id:'variables',  label:'Variables globales',          icon:'braces',   desc:'Valores de ejemplo para el preview' },
  { id:'ai',         label:'Inteligencia artificial',     icon:'sparkles', desc:'Proveedor, API key y modelo para generar o mejorar plantillas' },
  { id:'notif',      label:'Notificaciones',              icon:'bell',     desc:'Avisos internos de la app: guardado, exportación, pruebas, actualizaciones' },
];

function SettingsPanel({ onClose, initialSection='account' }) {
  const [section, setSection] = React.useState(initialSection);
  const [saved, setSaved] = React.useState(false);

  // Flash "Guardado" on any field change
  const flashSaved = () => {
    setSaved(true);
    clearTimeout(window.__mcSavedT);
    window.__mcSavedT = setTimeout(()=>setSaved(false), 1600);
    // Emit a toast too for the global notification stream
    clearTimeout(window.__mcSavedToastT);
    window.__mcSavedToastT = setTimeout(() => {
      window.toast && window.toast({ kind:'ok', title:'Ajustes guardados', msg:'Los cambios se aplican al momento.' });
    }, 600);
  };

  // Close on Escape
  React.useEffect(() => {
    const h = (e) => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{background:'color-mix(in oklab, #0a0a14 62%, transparent)'}}>
      <div
        className="pop"
        onClick={e=>e.stopPropagation()}
        style={{
          width:'min(1040px, calc(100vw - 48px))',
          height:'min(720px, calc(100vh - 48px))',
          background:'var(--surface)',
          borderRadius:'var(--r-lg)',
          boxShadow:'0 24px 60px rgba(0,0,0,.35), 0 0 0 1px var(--line)',
          display:'grid',
          gridTemplateColumns:'240px 1fr',
          overflow:'hidden',
        }}>

        {/* Sidebar */}
        <aside style={{
          borderRight:'1px solid var(--line)',
          background:'var(--surface-2)',
          display:'flex',flexDirection:'column',
          padding:'18px 10px',
          overflow:'auto',
        }}>
          <div style={{padding:'0 10px 14px',display:'flex',alignItems:'center',gap:8}}>
            <div style={{
              width:24,height:24,borderRadius:6,
              background:'var(--accent)',color:'#fff',
              display:'grid',placeItems:'center',
              fontFamily:'var(--font-display)',fontWeight:700,fontSize:12,
            }}>A</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:500}}>Ajustes</div>
              <div style={{fontSize:10.5,color:'var(--fg-3)'}}>Espacio Acme</div>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:1}}>
            {SETTINGS_SECTIONS.map(s => {
              const Icon = I[s.icon] || I.settings;
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={()=>setSection(s.id)}
                  style={{
                    display:'flex',alignItems:'center',gap:10,
                    padding:'9px 11px',
                    background:active?'var(--surface)':'transparent',
                    border:'none',borderRadius:'var(--r-sm)',
                    cursor:'pointer',
                    textAlign:'left',
                    boxShadow:active?'0 0 0 1px var(--line)':'none',
                    color:active?'var(--fg)':'var(--fg-2)',
                    fontSize:12.5,
                    fontWeight:active?500:400,
                    transition:'background 100ms',
                  }}
                  onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='color-mix(in oklab, var(--accent) 6%, transparent)'; }}
                  onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
                  <Icon size={14} style={{color:active?'var(--accent)':'var(--fg-3)',flexShrink:0}}/>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{marginTop:'auto',padding:'12px 10px 4px',fontSize:10.5,color:'var(--fg-3)',lineHeight:1.55}}>
            Simple Template v0.4.2 · <span style={{color:'var(--accent)',cursor:'pointer'}}>Cambios</span>
          </div>
        </aside>

        {/* Content */}
        <section style={{display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
          {/* Head */}
          <header style={{
            padding:'18px 28px',
            borderBottom:'1px solid var(--line)',
            display:'flex',alignItems:'center',gap:14,
          }}>
            <div style={{flex:1,minWidth:0}}>
              <h3 style={{margin:0,fontSize:18,fontWeight:500,fontFamily:'var(--font-display)'}}>
                {SETTINGS_SECTIONS.find(s=>s.id===section)?.label}
              </h3>
              <div style={{fontSize:12,color:'var(--fg-3)',marginTop:3}}>
                {SETTINGS_SECTIONS.find(s=>s.id===section)?.desc}
              </div>
            </div>
            <div style={{
              fontSize:11.5,color:'var(--ok)',
              display:'flex',alignItems:'center',gap:5,
              opacity:saved?1:0,
              transition:'opacity 200ms',
            }}>
              <I.check size={12}/> Guardado
            </div>
            <button className="btn icon ghost" onClick={onClose}><I.x size={15}/></button>
          </header>

          {/* Body */}
          <div style={{flex:1,overflow:'auto',padding:'24px 28px 32px'}}>
            {section==='account'     && <AccountSection onChange={flashSaved}/>}
            {section==='brand'       && <BrandSection onChange={flashSaved}/>}
            {section==='appearance'  && <AppearanceSection onChange={flashSaved}/>}
            {section==='storage'     && <StorageSection onChange={flashSaved}/>}
            {section==='delivery'    && <DeliveryInner/>}
            {section==='editor'      && <EditorSection onChange={flashSaved}/>}
            {section==='variables'   && <VariablesSection onChange={flashSaved}/>}
            {section==='ai'          && <AISection onChange={flashSaved}/>}
            {section==='notif'       && <NotifSection onChange={flashSaved}/>}
          </div>
        </section>
      </div>
    </div>
  );
}

// ───────────────────────────── Section helpers ─────────────────────────────

function SRow({ label, hint, children, danger }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'220px 1fr',
      gap:24,
      padding:'16px 0',
      borderBottom:'1px solid var(--line)',
      alignItems:'flex-start',
    }}>
      <div>
        <div style={{fontSize:13,fontWeight:500,color:danger?'var(--danger)':'var(--fg)'}}>{label}</div>
        {hint && <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:4,lineHeight:1.5}}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SGroup({ title, children }) {
  return (
    <div style={{marginBottom:24}}>
      {title && <div style={{
        fontSize:10.5,fontWeight:600,color:'var(--fg-3)',
        textTransform:'uppercase',letterSpacing:'.08em',
        paddingBottom:8,marginBottom:4,
      }}>{title}</div>}
      {children}
    </div>
  );
}

// ───────────────────────────── Appearance ─────────────────────────────
function AppearanceSection({ onChange }) {
  const [tw, setTw] = React.useState(() => ({...window.TWEAKS, ...window.stStorage.getSetting('tweaks', {})}));
  const set = (k, v) => {
    const next = {...tw, [k]: v};
    setTw(next);
    window.stStorage.setSetting('tweaks', next);
    if (window.__mcSetTweaks) window.__mcSetTweaks(next);
    onChange();
  };

  const themes = [
    { id:'indigo', name:'Índigo',    color:'#5b5bf0', desc:'Azul con matices violetas (por defecto)' },
    { id:'ocean',  name:'Océano',    color:'#2b6cb0', desc:'Azul frío, profesional' },
    { id:'violet', name:'Violeta',   color:'#7c3aed', desc:'Más violeta, creativo' },
  ];
  const fonts = [
    { id:'inter-tight',      name:'Inter Tight',      sample:'Plantilla', hint:'Sans moderno, condensado' },
    { id:'inter',            name:'Inter',            sample:'Plantilla', hint:'Sans clásico, amplio' },
    { id:'instrument-serif', name:'Instrument Serif', sample:'Plantilla', hint:'Serif editorial' },
  ];

  return (
    <>
      <SGroup title="Tema">
        <SRow label="Modo" hint="Claro para el día, oscuro para la noche. Afecta la app, no tus correos.">
          <div className="seg" style={{width:'fit-content'}}>
            <button
              className={tw.mode==='light'?'on':''}
              onClick={()=>set('mode','light')}
              style={{padding:'0 14px',height:30}}>
              <I.sun size={12} style={{marginRight:6}}/> Claro
            </button>
            <button
              className={tw.mode==='dark'?'on':''}
              onClick={()=>set('mode','dark')}
              style={{padding:'0 14px',height:30}}>
              <I.moon size={12} style={{marginRight:6}}/> Oscuro
            </button>
          </div>
        </SRow>

        <SRow label="Paleta de color" hint="El acento que tiñe botones, enlaces y elementos activos.">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {themes.map(t => {
              const on = tw.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={()=>set('theme', t.id)}
                  style={{
                    textAlign:'left',
                    padding:12,
                    border:`1px solid ${on?'var(--accent)':'var(--line)'}`,
                    borderRadius:'var(--r-md)',
                    background:on?'var(--accent-soft)':'var(--surface)',
                    cursor:'pointer',
                    boxShadow:on?'0 0 0 1px var(--accent) inset':'none',
                    transition:'background 120ms, border-color 120ms',
                  }}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:16,height:16,borderRadius:'50%',background:t.color,flexShrink:0}}/>
                    <div style={{fontSize:12.5,fontWeight:500}}>{t.name}</div>
                    {on && <I.check size={13} style={{marginLeft:'auto',color:'var(--accent)'}}/>}
                  </div>
                  <div style={{fontSize:11,color:'var(--fg-3)',lineHeight:1.4}}>{t.desc}</div>
                </button>
              );
            })}
          </div>
        </SRow>
      </SGroup>

      <SGroup title="Interfaz">
        <SRow label="Densidad" hint="Qué tan apretados se ven los controles. Cómodo para pantallas grandes, compacto para portátiles.">
          <div className="seg" style={{width:'fit-content'}}>
            <button
              className={tw.density==='comfy'?'on':''}
              onClick={()=>set('density','comfy')}
              style={{padding:'0 14px',height:30}}>Cómodo</button>
            <button
              className={tw.density==='compact'?'on':''}
              onClick={()=>set('density','compact')}
              style={{padding:'0 14px',height:30}}>Compacto</button>
          </div>
        </SRow>

        <SRow label="Esquinas" hint="Radio de bordes en botones, cards y campos. No afecta tus correos.">
          <div className="seg" style={{width:'fit-content'}}>
            <button
              className={tw.radius==='sharp'?'on':''}
              onClick={()=>set('radius','sharp')}
              style={{padding:'0 14px',height:30}}>Rectas</button>
            <button
              className={tw.radius==='soft'?'on':''}
              onClick={()=>set('radius','soft')}
              style={{padding:'0 14px',height:30}}>Suaves</button>
            <button
              className={tw.radius==='round'?'on':''}
              onClick={()=>set('radius','round')}
              style={{padding:'0 14px',height:30}}>Redondeadas</button>
          </div>
        </SRow>

        <SRow label="Tipografía de la app" hint="La fuente del chrome. Las plantillas de correo tienen la suya propia.">
          <div style={{display:'grid',gap:6}}>
            {fonts.map(f => {
              const on = tw.font === f.id;
              const fam = f.id==='inter-tight' ? '"Inter Tight",sans-serif'
                        : f.id==='inter'       ? '"Inter",sans-serif'
                        : '"Instrument Serif",serif';
              return (
                <button
                  key={f.id}
                  onClick={()=>set('font', f.id)}
                  style={{
                    display:'flex',alignItems:'center',gap:12,
                    padding:'10px 12px',
                    border:`1px solid ${on?'var(--accent)':'var(--line)'}`,
                    borderRadius:'var(--r-md)',
                    background:on?'var(--accent-soft)':'var(--surface)',
                    cursor:'pointer',
                    textAlign:'left',
                  }}>
                  <div style={{fontFamily:fam,fontSize:18,fontWeight:500,width:100}}>{f.sample}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:500}}>{f.name}</div>
                    <div style={{fontSize:11,color:'var(--fg-3)'}}>{f.hint}</div>
                  </div>
                  {on && <I.check size={14} style={{color:'var(--accent)'}}/>}
                </button>
              );
            })}
          </div>
        </SRow>
      </SGroup>

      <SGroup title="Vista previa en vivo">
        <div style={{
          padding:16, borderRadius:'var(--r-md)',
          background:'var(--surface-2)', border:'1px solid var(--line)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{
              width:26,height:26,borderRadius:'var(--r-sm)',
              background:'var(--accent)',color:'var(--accent-fg)',
              display:'grid',placeItems:'center',
              fontFamily:'var(--font-display)',fontWeight:700,fontSize:13,
            }}>A</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600}}>Así se ve la app</div>
            <div className="chip accent" style={{marginLeft:'auto'}}>en vivo</div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <button className="btn primary sm"><I.send size={12}/> Acción principal</button>
            <button className="btn sm">Secundaria</button>
            <button className="btn ghost sm">Fantasma</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{padding:10,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)'}}>
              <div style={{fontSize:11.5,color:'var(--fg-3)'}}>Campo de ejemplo</div>
              <div style={{fontSize:13,marginTop:3,fontWeight:500}}>Estudio Acme</div>
            </div>
            <div style={{padding:10,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)'}}>
              <div style={{fontSize:11.5,color:'var(--fg-3)'}}>Tono de acento</div>
              <div style={{fontSize:13,marginTop:3,color:'var(--accent)',fontWeight:500}}>Enlace activo</div>
            </div>
          </div>
        </div>
      </SGroup>

      <SGroup title="Seguir el sistema">
        <SRow label="Usar el modo del sistema operativo" hint="Cambia automáticamente a oscuro cuando tu equipo lo hace (al anochecer, por ejemplo).">
          <label className="switch"><input type="checkbox" defaultChecked={false} onChange={onChange}/></label>
        </SRow>
      </SGroup>

      <SGroup title="Recorrido guiado">
        <SRow label="Volver a ver el tour del editor" hint="Te llevamos de nuevo por las partes principales del editor. Dura menos de un minuto.">
          <button className="btn" onClick={()=>{
            window.stStorage.removeSetting('tour-seen');
            window.dispatchEvent(new CustomEvent('st:start-tour'));
            onChange();
          }}><I.sparkles size={12}/> Iniciar tour</button>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Account (perfil local) ─────────────────────────────
function AccountSection({ onChange }) {
  const [acc, setAcc] = React.useState(() => window.stStorage.getSetting('account', {}));
  const set = (k,v) => { const next = {...acc, [k]:v}; setAcc(next); window.stStorage.setSetting('account', next); onChange(); };

  const stats = [
    { k:'Plantillas guardadas', v:'24', icon:'mail' },
    { k:'Bloques personalizados', v:'11', icon:'grid' },
    { k:'Espacio ocupado en disco', v:'18.4 MB', icon:'folder' },
  ];

  return (
    <>
      <SGroup title="Tu perfil">
        <SRow label="Nombre" hint="Aparece como remitente por defecto en los correos de prueba.">
          <input className="field" value={acc.name||'Carmen Luna'} onChange={e=>set('name',e.target.value)}/>
        </SRow>
        <SRow label="Correo" hint="Se usa como remitente por defecto en pruebas.">
          <input className="field" type="email" value={acc.email||'carmen@estudio.com'} onChange={e=>set('email',e.target.value)}/>
        </SRow>
        <SRow label="Avatar" hint="Imagen local. Se muestra solo dentro de la app.">
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{
              width:56,height:56,borderRadius:'50%',
              background:'linear-gradient(135deg,#5b5bf0,#8b5cf6)',
              color:'#fff',display:'grid',placeItems:'center',
              fontFamily:'var(--font-display)',fontWeight:700,fontSize:22,
            }}>{(acc.name||'CL').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
            <div className="col" style={{gap:4}}>
              <button className="btn sm"><I.upload size={12}/> Subir imagen</button>
              <button className="btn sm ghost" style={{color:'var(--fg-3)'}}>Quitar</button>
            </div>
          </div>
        </SRow>
      </SGroup>

      <SGroup title="Sobre Simple Template">
        <div style={{
          padding:14, borderRadius:'var(--r-md)',
          background:'var(--surface-2)', border:'1px solid var(--line)',
          display:'flex', gap:14, alignItems:'flex-start',
        }}>
          <div style={{
            width:40,height:40,borderRadius:'var(--r-md)',flex:'0 0 40px',
            background:'var(--accent-soft)',color:'var(--accent)',
            display:'grid',placeItems:'center',
          }}><I.heart size={18}/></div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,marginBottom:4}}>
              Aplicación local, de código abierto
            </div>
            <p style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.55,margin:0}}>
              Simple Template se ejecuta 100 % en tu equipo. Toda la información — plantillas, marca, credenciales — se guarda localmente.
              No hay planes, ni roles, ni servidores centrales: todas las personas que usan la app tienen acceso completo a todas las funciones.
            </p>
            <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
              <button className="btn sm"><I.code size={12}/> Ver código en GitHub</button>
              <button className="btn sm ghost"><I.external size={12}/> Documentación</button>
              <button className="btn sm ghost"><I.book size={12}/> Licencia MIT</button>
            </div>
          </div>
        </div>
      </SGroup>

      <SGroup title="Tu biblioteca local">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {stats.map(s => (
            <div key={s.k} style={{
              padding:14, border:'1px solid var(--line)', borderRadius:'var(--r-md)',
              background:'var(--surface)',
            }}>
              <div style={{color:'var(--fg-3)'}}>{I[s.icon] && I[s.icon]({size:14})}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600,marginTop:6,letterSpacing:'-0.01em'}}>{s.v}</div>
              <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:2}}>{s.k}</div>
            </div>
          ))}
        </div>
      </SGroup>

      <SGroup title="Datos locales">
        <SRow label="Exportar configuración" hint="Descarga un archivo .json con tu perfil, marca, variables y credenciales cifradas.">
          <button className="btn sm"><I.download size={12}/> Descargar respaldo</button>
        </SRow>
        <SRow label="Importar configuración" hint="Restaura desde un archivo .json previamente exportado.">
          <button className="btn sm"><I.upload size={12}/> Cargar archivo…</button>
        </SRow>
        <SRow label="Borrar datos locales" hint="Elimina plantillas, marca y credenciales guardadas en este equipo. No se puede deshacer." danger>
          <button className="btn danger sm">Borrar todo…</button>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Storage ─────────────────────────────
function StorageSection({ onChange }) {
  const [s, setS] = React.useState(() => ({
    mode: 'base64',
    s3: { endpoint:'https://s3.amazonaws.com', region:'us-east-1', bucket:'', key:'', secret:'', publicUrl:'' },
    r2: { accountId:'', bucket:'', key:'', secret:'', publicUrl:'' },
    cloudinary: { cloudName:'', uploadPreset:'', apiKey:'' },
    imgbb: { apiKey:'' },
    github: { repo:'', branch:'main', token:'', path:'assets/' },
    ftp: { host:'', port:'21', user:'', password:'', path:'/public_html/img/', publicUrl:'' },
    ...window.stStorage.getSetting('storage', {}),
  }));
  const save = (next) => { setS(next); window.stStorage.setSetting('storage', next); onChange(); };
  const setMode = (mode) => save({...s, mode});
  const setField = (provider, k, v) => save({...s, [provider]: {...s[provider], [k]:v}});

  const providers = [
    { id:'base64',     name:'Base64 embebido',  tag:'Por defecto', icon:'code',     desc:'Incrusta las imágenes dentro del HTML del correo. Funciona sin configurar nada, pero algunos clientes las bloquean o limitan el tamaño.' },
    { id:'s3',         name:'S3 compatible',    tag:'Popular',     icon:'server',   desc:'AWS S3, Cloudflare R2, Backblaze B2, MinIO, Wasabi. Sube y sirve con tu propio bucket.' },
    { id:'cloudinary', name:'Cloudinary',       tag:'Plan gratuito amplio', icon:'image', desc:'Servicio optimizado para imágenes con CDN global. Tier gratuito generoso.' },
    { id:'imgbb',      name:'imgbb',            tag:'Más simple',  icon:'upload',   desc:'Subida rápida con solo una API key. Ideal para prototipos y pruebas.' },
    { id:'github',     name:'GitHub Pages',     tag:'Gratis',      icon:'code',     desc:'Sube las imágenes como commits a un repo público servido por GitHub Pages.' },
    { id:'ftp',        name:'FTP / SFTP',       tag:'Tu servidor', icon:'folder',   desc:'Conecta a tu propio hosting o VPS. Control total sobre las URLs y el almacenamiento.' },
  ];

  const isSet = (p) => {
    if (p.id==='base64') return true;
    if (p.id==='s3') return s.s3.bucket && s.s3.key;
    if (p.id==='cloudinary') return s.cloudinary.cloudName && s.cloudinary.uploadPreset;
    if (p.id==='imgbb') return !!s.imgbb.apiKey;
    if (p.id==='github') return s.github.repo && s.github.token;
    if (p.id==='ftp') return s.ftp.host && s.ftp.user;
    return false;
  };

  const active = providers.find(p => p.id===s.mode) || providers[0];
  const currentIsConfigured = isSet(active);

  return (
    <>
      <SGroup title="Cómo funciona">
        <div style={{
          padding:14, borderRadius:'var(--r-md)',
          background:'var(--accent-soft)', border:'1px solid var(--accent)',
          display:'flex', gap:12, alignItems:'flex-start',
        }}>
          <div style={{color:'var(--accent)',marginTop:2}}><I.info size={16}/></div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:12.5,lineHeight:1.55,margin:0,color:'var(--fg-2)'}}>
              Los clientes de correo (Gmail, Outlook, Apple Mail) no muestran imágenes locales: necesitan una URL pública.
              Elige dónde se subirán las imágenes de tus plantillas. Si no configuras nada, Simple Template las incrustará en Base64 — funciona, pero con limitaciones.
            </p>
          </div>
        </div>
      </SGroup>

      <SGroup title="Proveedor activo">
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {providers.map(p => {
            const selected = s.mode===p.id;
            const configured = isSet(p);
            return (
              <button
                key={p.id}
                onClick={()=>setMode(p.id)}
                style={{
                  textAlign:'left',
                  padding:14,
                  border:`1.5px solid ${selected?'var(--accent)':'var(--line)'}`,
                  borderRadius:'var(--r-md)',
                  background: selected?'var(--accent-soft)':'var(--surface)',
                  cursor:'pointer',
                  display:'flex',flexDirection:'column',gap:8,
                  position:'relative',
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{
                    width:32,height:32,borderRadius:'var(--r-sm)',
                    background: selected?'var(--accent)':'var(--surface-2)',
                    color: selected?'#fff':'var(--fg-2)',
                    display:'grid',placeItems:'center',
                  }}>{I[p.icon] && I[p.icon]({size:15})}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                      {p.name}
                      {configured && p.id!=='base64' && (
                        <span style={{
                          width:6,height:6,borderRadius:'50%',
                          background:'#10b981',display:'inline-block',
                        }}/>
                      )}
                    </div>
                    <div style={{fontSize:10.5,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'0.05em',marginTop:2}}>
                      {p.tag}
                    </div>
                  </div>
                  {selected && (
                    <div style={{color:'var(--accent)'}}><I.check size={14}/></div>
                  )}
                </div>
                <p style={{fontSize:11.5,color:'var(--fg-3)',lineHeight:1.5,margin:0}}>{p.desc}</p>
              </button>
            );
          })}
        </div>
      </SGroup>

      {/* Config form for the selected provider */}
      {s.mode==='base64' && (
        <SGroup title="Configuración · Base64">
          <div style={{padding:14,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-md)'}}>
            <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.6,marginBottom:10}}>
              No hay nada que configurar. Simple Template embeberá automáticamente cada imagen como un string Base64 dentro del HTML.
            </div>
            <div style={{fontSize:11.5,color:'var(--fg-3)',lineHeight:1.6}}>
              <strong style={{color:'var(--fg-1)'}}>Limitaciones conocidas:</strong><br/>
              · Gmail trunca los correos que pasan de 102 KB, lo que suele pasar con pocas imágenes.<br/>
              · Outlook desktop y algunos clientes corporativos bloquean imágenes en Base64.<br/>
              · El peso total del correo aumenta ~33 % por la codificación.
            </div>
          </div>
          <SRow label="Tamaño máximo por imagen" hint="Simple Template te avisará antes de embeber imágenes más grandes que este límite.">
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="range" min="50" max="500" defaultValue="150" style={{flex:1}}/>
              <span className="chip" style={{minWidth:60,textAlign:'center'}}>150 KB</span>
            </div>
          </SRow>
        </SGroup>
      )}

      {s.mode==='s3' && (
        <SGroup title="Configuración · S3 compatible">
          <div style={{
            padding:10, marginBottom:4,
            background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',
            display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',
          }}>
            <span style={{fontSize:11,color:'var(--fg-3)',marginRight:4}}>Presets:</span>
            {['AWS S3','Cloudflare R2','Backblaze B2','Wasabi','MinIO','DigitalOcean Spaces'].map(p => (
              <button key={p} className="btn sm ghost" style={{fontSize:11,padding:'3px 8px'}}>{p}</button>
            ))}
          </div>
          <SRow label="Endpoint" hint="Ej: https://s3.amazonaws.com o https://<account>.r2.cloudflarestorage.com">
            <input className="field" value={s.s3.endpoint} onChange={e=>setField('s3','endpoint',e.target.value)} placeholder="https://s3.amazonaws.com"/>
          </SRow>
          <SRow label="Región" hint="Código de región. Para R2 usa 'auto'.">
            <input className="field" value={s.s3.region} onChange={e=>setField('s3','region',e.target.value)} placeholder="us-east-1"/>
          </SRow>
          <SRow label="Nombre del bucket" hint="Debe existir previamente y tener acceso público de lectura.">
            <input className="field" value={s.s3.bucket} onChange={e=>setField('s3','bucket',e.target.value)} placeholder="mi-bucket-imagenes"/>
          </SRow>
          <SRow label="Access Key ID" hint="Credencial de un usuario con permisos PutObject y GetObject.">
            <input className="field" value={s.s3.key} onChange={e=>setField('s3','key',e.target.value)} placeholder="AKIA…"/>
          </SRow>
          <SRow label="Secret Access Key" hint="Se guarda cifrada en tu equipo. Nunca sale de tu disco.">
            <input className="field" type="password" value={s.s3.secret} onChange={e=>setField('s3','secret',e.target.value)} placeholder="••••••••••••••••"/>
          </SRow>
          <SRow label="URL pública base" hint="Opcional. Dominio desde el que se servirán las imágenes (ej: cdn.tudominio.com).">
            <input className="field" value={s.s3.publicUrl} onChange={e=>setField('s3','publicUrl',e.target.value)} placeholder="https://cdn.tudominio.com"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button className="btn"><I.check size={12}/> Probar conexión</button>
            <button className="btn ghost"><I.external size={12}/> Ver guía</button>
          </div>
        </SGroup>
      )}

      {s.mode==='cloudinary' && (
        <SGroup title="Configuración · Cloudinary">
          <SRow label="Cloud name" hint="Lo encuentras en tu dashboard de Cloudinary, arriba a la izquierda.">
            <input className="field" value={s.cloudinary.cloudName} onChange={e=>setField('cloudinary','cloudName',e.target.value)} placeholder="mi-cuenta"/>
          </SRow>
          <SRow label="Upload preset" hint="Preset sin firma (Unsigned) configurado en Settings → Upload.">
            <input className="field" value={s.cloudinary.uploadPreset} onChange={e=>setField('cloudinary','uploadPreset',e.target.value)} placeholder="simple_template_unsigned"/>
          </SRow>
          <SRow label="API key" hint="Opcional. Solo necesario si usas presets firmados.">
            <input className="field" value={s.cloudinary.apiKey} onChange={e=>setField('cloudinary','apiKey',e.target.value)} placeholder="1234567890"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button className="btn"><I.check size={12}/> Probar conexión</button>
            <button className="btn ghost"><I.external size={12}/> Crear cuenta gratuita</button>
          </div>
        </SGroup>
      )}

      {s.mode==='imgbb' && (
        <SGroup title="Configuración · imgbb">
          <SRow label="API key" hint="Obtén una clave gratuita en api.imgbb.com. Se guarda cifrada en tu equipo.">
            <input className="field" type="password" value={s.imgbb.apiKey} onChange={e=>setField('imgbb','apiKey',e.target.value)} placeholder="••••••••••••••••"/>
          </SRow>
          <SRow label="Expiración" hint="Tiempo antes de que las imágenes se eliminen automáticamente. 'Nunca' es lo recomendado para correos.">
            <select className="field">
              <option>Nunca expirar</option>
              <option>180 días</option>
              <option>90 días</option>
              <option>30 días</option>
            </select>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button className="btn"><I.check size={12}/> Probar conexión</button>
            <button className="btn ghost"><I.external size={12}/> Obtener API key</button>
          </div>
        </SGroup>
      )}

      {s.mode==='github' && (
        <SGroup title="Configuración · GitHub Pages">
          <SRow label="Repositorio" hint="Formato usuario/repo. Debe tener GitHub Pages habilitado.">
            <input className="field" value={s.github.repo} onChange={e=>setField('github','repo',e.target.value)} placeholder="mi-usuario/simple-template-assets"/>
          </SRow>
          <SRow label="Rama" hint="Rama donde se harán los commits.">
            <input className="field" value={s.github.branch} onChange={e=>setField('github','branch',e.target.value)} placeholder="main"/>
          </SRow>
          <SRow label="Carpeta destino" hint="Ruta relativa dentro del repo donde se subirán las imágenes.">
            <input className="field" value={s.github.path} onChange={e=>setField('github','path',e.target.value)} placeholder="assets/img/"/>
          </SRow>
          <SRow label="Personal Access Token" hint="Token con permiso 'repo'. Se guarda cifrado en tu equipo.">
            <input className="field" type="password" value={s.github.token} onChange={e=>setField('github','token',e.target.value)} placeholder="ghp_••••••••••••"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button className="btn"><I.check size={12}/> Probar conexión</button>
            <button className="btn ghost"><I.external size={12}/> Generar token</button>
          </div>
        </SGroup>
      )}

      {s.mode==='ftp' && (
        <SGroup title="Configuración · FTP / SFTP">
          <SRow label="Host" hint="Dirección del servidor (ej: ftp.tudominio.com).">
            <input className="field" value={s.ftp.host} onChange={e=>setField('ftp','host',e.target.value)} placeholder="ftp.tudominio.com"/>
          </SRow>
          <SRow label="Puerto" hint="21 para FTP, 22 para SFTP.">
            <input className="field" value={s.ftp.port} onChange={e=>setField('ftp','port',e.target.value)} placeholder="21"/>
          </SRow>
          <SRow label="Usuario" hint="Nombre de usuario con permiso de escritura en la carpeta destino.">
            <input className="field" value={s.ftp.user} onChange={e=>setField('ftp','user',e.target.value)} placeholder="mi-usuario"/>
          </SRow>
          <SRow label="Contraseña" hint="Se guarda cifrada en tu equipo.">
            <input className="field" type="password" value={s.ftp.password} onChange={e=>setField('ftp','password',e.target.value)} placeholder="••••••••••••"/>
          </SRow>
          <SRow label="Carpeta destino" hint="Ruta absoluta en el servidor donde se subirán las imágenes.">
            <input className="field" value={s.ftp.path} onChange={e=>setField('ftp','path',e.target.value)} placeholder="/public_html/img/"/>
          </SRow>
          <SRow label="URL pública base" hint="Dominio desde el que se servirán las imágenes.">
            <input className="field" value={s.ftp.publicUrl} onChange={e=>setField('ftp','publicUrl',e.target.value)} placeholder="https://tudominio.com/img/"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button className="btn"><I.check size={12}/> Probar conexión</button>
          </div>
        </SGroup>
      )}

      <SGroup title="Comportamiento">
        <SRow label="Optimizar imágenes antes de subir" hint="Convierte a WebP y reduce resolución a máx 1440px de ancho.">
          <label className="switch"><input type="checkbox" defaultChecked/><span/></label>
        </SRow>
        <SRow label="Reemplazar imágenes locales al exportar" hint="Al exportar el HTML, las rutas file:// se reemplazan por las URLs públicas.">
          <label className="switch"><input type="checkbox" defaultChecked/><span/></label>
        </SRow>
        <SRow label="Limpiar imágenes no usadas" hint="Busca y elimina del CDN imágenes que ya no están referenciadas en ninguna plantilla.">
          <button className="btn sm"><I.trash size={12}/> Limpiar ahora</button>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Brand ─────────────────────────────
function BrandSection({ onChange }) {
  const [brand, setBrand] = React.useState(() => window.stStorage.getSetting('brand', {}));
  const set = (k,v) => { const n = {...brand, [k]:v}; setBrand(n); window.stStorage.setSetting('brand', n); onChange(); };

  const colors = brand.colors || ['#5b5bf0','#1a1a2e','#f6f5f1','#e8eddd','#d97757'];
  const fonts  = ['Inter','Söhne','Fraunces','DM Serif Display','Instrument Serif','Playfair Display','Space Grotesk','IBM Plex Sans'];

  return (
    <>
      <SGroup title="Identidad visual">
        <SRow label="Paleta de colores" hint="Los primeros 5 aparecen en el editor como accesos rápidos.">
          <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
            {colors.map((c,i) => (
              <div key={i} style={{position:'relative'}}>
                <div style={{
                  width:40,height:40,borderRadius:'var(--r-sm)',
                  background:c,
                  border:'1px solid var(--line)',
                  cursor:'pointer',
                }}/>
                <div style={{fontSize:10,color:'var(--fg-3)',fontFamily:'var(--font-mono)',textAlign:'center',marginTop:4}}>{c}</div>
              </div>
            ))}
            <button style={{
              width:40,height:40,borderRadius:'var(--r-sm)',
              border:'1px dashed var(--line)',
              background:'transparent',
              color:'var(--fg-3)',cursor:'pointer',
              display:'grid',placeItems:'center',
            }}><I.plus size={14}/></button>
          </div>
        </SRow>

        <SRow label="Fuente principal" hint="Se usa en encabezados y bloques de título por defecto.">
          <select className="field" value={brand.fontDisplay||'Fraunces'} onChange={e=>set('fontDisplay',e.target.value)}>
            {fonts.map(f => <option key={f} style={{fontFamily:f}}>{f}</option>)}
          </select>
        </SRow>

        <SRow label="Fuente de cuerpo" hint="Se usa en párrafos y botones.">
          <select className="field" value={brand.fontBody||'Inter'} onChange={e=>set('fontBody',e.target.value)}>
            {fonts.map(f => <option key={f} style={{fontFamily:f}}>{f}</option>)}
          </select>
        </SRow>

        <SRow label="Logo por defecto" hint="Se inserta automáticamente al añadir un bloque de Logo.">
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{
              width:120,height:56,borderRadius:'var(--r-sm)',
              background:'var(--surface-2)',border:'1px solid var(--line)',
              display:'grid',placeItems:'center',
              fontFamily:'var(--font-display)',fontWeight:600,fontSize:18,
              color:'var(--fg)',
            }}>acme</div>
            <div className="col" style={{gap:4}}>
              <button className="btn sm"><I.upload size={12}/> Subir logo</button>
              <span style={{fontSize:10.5,color:'var(--fg-3)'}}>PNG / SVG · 400×160 px recomendado</span>
            </div>
          </div>
        </SRow>
      </SGroup>

      <SGroup title="Footer legal (requerido por ley)">
        <SRow label="Dirección física" hint="CAN-SPAM / RGPD exigen una dirección postal real en todos los correos comerciales.">
          <textarea className="field" rows="2" placeholder="Ej. Acme SA · Av. Reforma 123, CDMX 06600, México" defaultValue={brand.address||'Acme SA · Av. Reforma 123, CDMX 06600'}/>
        </SRow>
        <SRow label="Enlace de baja" hint="URL a la que lleva el botón 'Darme de baja' en el footer.">
          <input className="field" placeholder="https://acme.com/unsubscribe" defaultValue={brand.unsubscribe||'https://acme.com/baja'}/>
        </SRow>
        <SRow label="Texto del footer" hint="Aparece debajo del botón de baja en todos los envíos.">
          <textarea className="field" rows="3" defaultValue={brand.footer||'Recibes este correo porque te suscribiste en acme.com. Puedes actualizar tus preferencias o darte de baja cuando quieras.'}/>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Delivery (reuses DeliveryInner) ─────────────────────────────
function DeliveryInner() {
  // Just render the inner UI (no Modal wrapper)
  return <DeliveryModal embedded={true}/>;
}

// ───────────────────────────── Editor ─────────────────────────────
function EditorSection({ onChange }) {
  const [ed, setEd] = React.useState(() => window.stStorage.getSetting('editor', {}));
  const set = (k,v) => { const n = {...ed, [k]:v}; setEd(n); window.stStorage.setSetting('editor', n); onChange(); };

  const Seg = ({value, options, onPick}) => (
    <div style={{display:'inline-flex',background:'var(--surface-2)',padding:3,borderRadius:'var(--r-sm)',gap:2,border:'1px solid var(--line)'}}>
      {options.map(o => (
        <button key={o.id} onClick={()=>onPick(o.id)} style={{
          padding:'6px 14px',border:'none',
          background:value===o.id?'var(--surface)':'transparent',
          color:value===o.id?'var(--fg)':'var(--fg-2)',
          borderRadius:'calc(var(--r-sm) - 2px)',
          fontSize:12,cursor:'pointer',
          boxShadow:value===o.id?'0 1px 2px rgba(0,0,0,.06)':'none',
          display:'flex',alignItems:'center',gap:6,
        }}>
          {o.icon && React.createElement(I[o.icon], {size:12})}
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <SGroup title="Apariencia">
        <SRow label="Tema" hint="Claro, oscuro o sincronizado con el sistema operativo.">
          <Seg value={ed.theme||'system'} onPick={v=>set('theme',v)} options={[
            {id:'light',label:'Claro',icon:'sun'},
            {id:'dark',label:'Oscuro',icon:'moon'},
            {id:'system',label:'Sistema'},
          ]}/>
        </SRow>
        <SRow label="Idioma de la interfaz" hint="Cambia textos de menús y diálogos.">
          <select className="field" value={ed.lang||'es'} onChange={e=>set('lang',e.target.value)} style={{width:200}}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
          </select>
        </SRow>
        <SRow label="Densidad" hint="Más compacto muestra más en pantalla a costa de espacio.">
          <Seg value={ed.density||'comfortable'} onPick={v=>set('density',v)} options={[
            {id:'compact',label:'Compacto'},
            {id:'comfortable',label:'Cómodo'},
            {id:'spacious',label:'Amplio'},
          ]}/>
        </SRow>
      </SGroup>

      <SGroup title="Canvas">
        <SRow label="Grid del canvas" hint="Tamaño de la cuadrícula visible al editar.">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <input type="range" min="8" max="32" step="4" value={ed.grid||16} onChange={e=>set('grid',Number(e.target.value))} style={{flex:1,maxWidth:200}}/>
            <span style={{fontSize:12,fontFamily:'var(--font-mono)',color:'var(--fg-2)',width:40}}>{ed.grid||16} px</span>
          </div>
        </SRow>
        <SRow label="Regla visible" hint="Muestra marcas de píxeles en los bordes del canvas.">
          <label className="switch"><input type="checkbox" defaultChecked={ed.ruler!==false} onChange={e=>set('ruler',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label="Autoalinear al grid" hint="Los bloques se ajustan automáticamente a la cuadrícula al moverlos.">
          <label className="switch"><input type="checkbox" defaultChecked={ed.snap!==false} onChange={e=>set('snap',e.target.checked)}/><span/></label>
        </SRow>
      </SGroup>

      <SGroup title="Guardado">
        <SRow label="Autoguardado" hint="Guardado automático mientras editas. Se puede revertir desde el historial.">
          <label className="switch"><input type="checkbox" defaultChecked={ed.autosave!==false} onChange={e=>set('autosave',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label="Intervalo de autoguardado" hint="Cada cuántos segundos guardar.">
          <select className="field" value={ed.saveInterval||30} onChange={e=>set('saveInterval',Number(e.target.value))} style={{width:200}}>
            <option value="10">Cada 10 segundos</option>
            <option value="30">Cada 30 segundos</option>
            <option value="60">Cada minuto</option>
            <option value="300">Cada 5 minutos</option>
          </select>
        </SRow>
      </SGroup>

      <SGroup title="Atajos de teclado">
        <div style={{border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
          {[
            ['Guardar',        ['⌘','S']],
            ['Deshacer',       ['⌘','Z']],
            ['Rehacer',        ['⌘','⇧','Z']],
            ['Duplicar bloque',['⌘','D']],
            ['Eliminar bloque',['⌫']],
            ['Vista previa',   ['⌘','P']],
            ['Enviar prueba',  ['⌘','⇧','T']],
          ].map(([name,keys],i,arr) => (
            <div key={name} style={{display:'flex',alignItems:'center',padding:'10px 14px',borderBottom:i<arr.length-1?'1px solid var(--line)':'none',fontSize:12.5}}>
              <span style={{flex:1}}>{name}</span>
              <div style={{display:'flex',gap:4}}>
                {keys.map((k,j)=><span key={j} className="kbd">{k}</span>)}
              </div>
            </div>
          ))}
        </div>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Variables ─────────────────────────────
function VariablesSection({ onChange }) {
  const [vars, setVars] = React.useState(() => window.stStorage.getSetting('vars', null) || VARIABLES);
  const save = (next) => { setVars(next); window.stStorage.setSetting('vars', next); onChange(); };
  const setVal = (i,v) => save(vars.map((x,j)=>j===i?{...x,sample:v}:x));

  return (
    <>
      <SGroup title="Valores de ejemplo para el preview">
        <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.55,paddingBottom:16}}>
          Estos valores sustituyen las variables <code style={{fontFamily:'var(--font-mono)',fontSize:11.5,background:'var(--surface-2)',padding:'1px 6px',borderRadius:4}}>{'{{nombre}}'}</code> cuando ves el preview o envías una prueba. En envíos reales se reemplazan por los datos de cada destinatario.
        </div>
        <div style={{border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
          {vars.map((v,i) => (
            <div key={v.key} style={{
              display:'grid',gridTemplateColumns:'180px 1fr 80px 30px',gap:12,
              padding:'10px 14px',alignItems:'center',
              borderBottom:i<vars.length-1?'1px solid var(--line)':'none',
            }}>
              <code style={{fontFamily:'var(--font-mono)',fontSize:11.5,color:'var(--accent)'}}>{`{{${v.key}}}`}</code>
              <input className="field" value={v.sample} onChange={e=>setVal(i,e.target.value)} style={{height:30,fontSize:12.5}}/>
              <span style={{fontSize:11,color:'var(--fg-3)'}}>{v.type}</span>
              <button className="btn icon sm ghost"><I.dotsV size={12}/></button>
            </div>
          ))}
        </div>
        <button className="btn sm" style={{marginTop:12}}><I.plus size={12}/> Nueva variable</button>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Export ─────────────────────────────
function ExportSection({ onChange }) {
  const [ex, setEx] = React.useState(() => window.stStorage.getSetting('export', {}));
  const set = (k,v) => { const n = {...ex, [k]:v}; setEx(n); window.stStorage.setSetting('export', n); onChange(); };

  return (
    <>
      <SGroup title="Formato por defecto">
        <SRow label="Formato de descarga" hint="Se usa al elegir 'Exportar' sin abrir el modal.">
          <div className="col" style={{gap:6}}>
            {[
              {id:'html',  label:'HTML con estilos inline', d:'Lo más compatible. Gmail, Outlook, iOS, Android.'},
              {id:'mjml',  label:'MJML (código fuente)',     d:'Editable en cualquier herramienta MJML.'},
              {id:'zip',   label:'Paquete ZIP',              d:'HTML + imágenes + texto plano.'},
            ].map(o => (
              <label key={o.id} style={{
                display:'flex',gap:12,padding:'12px 14px',
                border:'1px solid '+((ex.format||'html')===o.id?'var(--accent)':'var(--line)'),
                background:(ex.format||'html')===o.id?'var(--accent-soft)':'var(--surface)',
                borderRadius:'var(--r-md)',cursor:'pointer',
              }}>
                <input type="radio" checked={(ex.format||'html')===o.id} onChange={()=>set('format',o.id)} style={{marginTop:3}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{o.label}</div>
                  <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:2}}>{o.d}</div>
                </div>
              </label>
            ))}
          </div>
        </SRow>
      </SGroup>

      <SGroup title="Opciones por defecto">
        <SRow label="Minificar HTML" hint="Reduce el tamaño del archivo quitando espacios y saltos.">
          <label className="switch"><input type="checkbox" defaultChecked={ex.minify!==false} onChange={e=>set('minify',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label="Incluir texto plano alternativo" hint="Versión solo-texto que ven clientes de correo antiguos y los filtros de spam.">
          <label className="switch"><input type="checkbox" defaultChecked={ex.plaintext!==false} onChange={e=>set('plaintext',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label="Optimizar imágenes" hint="Convierte PNG a WebP y comprime hasta 80%. Reduce hasta 60% el peso del correo.">
          <label className="switch"><input type="checkbox" defaultChecked={ex.optimize!==false} onChange={e=>set('optimize',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label="Subdominio de imágenes" hint="Dónde se alojan las imágenes cuando exportas. Ayuda a la entregabilidad.">
          <div style={{display:'flex',alignItems:'center',background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-md)',padding:'2px 12px'}}>
            <span style={{fontSize:12,color:'var(--fg-3)',fontFamily:'var(--font-mono)'}}>https://</span>
            <input style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:13,padding:'8px 0',fontFamily:'var(--font-mono)'}} defaultValue={ex.imgDomain||'cdn.acme.com'} onChange={e=>set('imgDomain',e.target.value)}/>
          </div>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Notifications ─────────────────────────────
function NotifSection({ onChange }) {
  const [n, setN] = React.useState(() => window.stStorage.getSetting('notif', {}));
  const set = (k,v) => { const nn = {...n, [k]:v}; setN(nn); window.stStorage.setSetting('notif', nn); onChange(); };

  const Switch = ({k, def=true}) => (
    <label className="switch"><input type="checkbox" defaultChecked={n[k]!==false && (n[k]===undefined?def:n[k])} onChange={e=>set(k,e.target.checked)}/><span/></label>
  );

  return (
    <>
      <SGroup title="Avisos dentro de la app">
        <SRow label="Recordar autoguardado" hint="Te avisa en la esquina inferior cada vez que Simple Template guarda tu trabajo automáticamente.">
          <Switch k="saved"/>
        </SRow>
        <SRow label="Aviso de imagen muy pesada" hint="Cuando arrastras una imagen mayor al límite recomendado para correo.">
          <Switch k="heavyImg"/>
        </SRow>
        <SRow label="Aviso de exportación lista" hint="Cuando termina de generarse el HTML, MJML o ZIP de descarga.">
          <Switch k="exportDone"/>
        </SRow>
        <SRow label="Resultado del envío de prueba" hint="Aparece cuando tu SMTP confirma (o falla) un envío de prueba.">
          <Switch k="testDone"/>
        </SRow>
      </SGroup>

      <SGroup title="Sonido">
        <SRow label="Sonidos de la app" hint="Un tono corto al guardar, exportar o enviar una prueba.">
          <Switch k="sound" def={false}/>
        </SRow>
        <SRow label="Volumen" hint="Solo se aplica a los sonidos de la app.">
          <input type="range" min="0" max="100" defaultValue={n.vol||60} onChange={e=>set('vol',Number(e.target.value))} style={{width:200}}/>
        </SRow>
      </SGroup>

      <SGroup title="Actualizaciones">
        <SRow label="Avisarme cuando haya una versión nueva" hint="Simple Template revisa GitHub una vez al día. La descarga es siempre manual.">
          <Switch k="updates"/>
        </SRow>
        <SRow label="Incluir versiones beta" hint="Recibe avisos de releases con el tag 'beta' o 'rc'. Pueden tener errores.">
          <Switch k="beta" def={false}/>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── IA ─────────────────────────────
function AISection({ onChange }) {
  const [ai, setAi] = React.useState(() => window.stStorage.getSetting('ai', {}));
  const set = (k,v) => { const next = {...ai, [k]:v}; setAi(next); window.stStorage.setSetting('ai', next); onChange(); };

  const PROVIDERS = [
    { id:'anthropic', name:'Anthropic Claude', models:['claude-sonnet-4-5','claude-opus-4-1','claude-haiku-4-5'], hint:'Mejores resultados para copy y HTML.', url:'https://console.anthropic.com' },
    { id:'openai',    name:'OpenAI',           models:['gpt-5','gpt-5-mini','gpt-4.1'],                          hint:'Versátil y con buen ecosistema.',       url:'https://platform.openai.com' },
    { id:'google',    name:'Google Gemini',    models:['gemini-2.5-pro','gemini-2.5-flash'],                     hint:'Generoso con tokens; rápido.',         url:'https://aistudio.google.com' },
    { id:'ollama',    name:'Ollama (local)',   models:['llama3.3','qwen2.5-coder','mistral-nemo'],               hint:'Corre en tu máquina. Sin API key.',    url:'http://localhost:11434' },
  ];
  const provider = PROVIDERS.find(p => p.id === (ai.provider||'anthropic'));
  const enabled = ai.enabled !== false;
  const keyOk = !!ai.key && ai.key.length > 15;

  const Switch = ({checked, onChange:oc}) => (
    <label className="switch"><input type="checkbox" checked={!!checked} onChange={e=>oc(e.target.checked)}/><span/></label>
  );

  return (
    <>
      {/* Hero status card */}
      <div style={{
        display:'grid',gridTemplateColumns:'auto 1fr auto',gap:16,alignItems:'center',
        padding:'16px 18px',marginBottom:20,
        background:'linear-gradient(135deg, color-mix(in oklab, var(--accent) 10%, var(--surface)), var(--surface-2))',
        border:'1px solid var(--line)',borderRadius:'var(--r-md)',
      }}>
        <div style={{width:40,height:40,borderRadius:10,background:'var(--accent)',color:'#fff',display:'grid',placeItems:'center'}}>
          <I.sparkles size={18}/>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:500}}>Generar y mejorar plantillas con IA</div>
          <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:2,lineHeight:1.5}}>
            {enabled && keyOk ? <>Activo con <b style={{color:'var(--fg)'}}>{provider.name}</b> · modelo <b style={{color:'var(--fg)'}}>{ai.model||provider.models[0]}</b></> :
             enabled && !keyOk ? <>Te falta añadir la API key de <b style={{color:'var(--fg)'}}>{provider.name}</b> para poder usarla.</> :
             <>Desactivada. Activa el interruptor para usar “✨ Generar con IA” y “✨ Mejorar”.</>}
          </div>
        </div>
        <Switch checked={enabled} onChange={v=>set('enabled',v)}/>
      </div>

      <SGroup title="Proveedor y modelo">
        <SRow label="Proveedor" hint="Elige el servicio que quieres usar. Puedes cambiarlo cuando quieras; las API keys se guardan por separado.">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {PROVIDERS.map(p => {
              const on = (ai.provider||'anthropic') === p.id;
              return (
                <button key={p.id} onClick={()=>set('provider', p.id)} style={{
                  textAlign:'left',padding:'11px 13px',
                  border: on?'1.5px solid var(--accent)':'1px solid var(--line)',
                  borderRadius:'var(--r-md)',
                  background: on?'var(--accent-soft)':'var(--surface)',
                  cursor:'pointer',
                }}>
                  <div style={{fontSize:12.5,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
                    {p.name}
                    {on && <I.check size={12} style={{color:'var(--accent)'}}/>}
                  </div>
                  <div style={{fontSize:10.5,color:'var(--fg-3)',marginTop:3,lineHeight:1.4}}>{p.hint}</div>
                </button>
              );
            })}
          </div>
        </SRow>
        <SRow label="Modelo" hint={`Modelos disponibles en ${provider.name}. Los más grandes dan mejor copy; los pequeños son más rápidos y baratos.`}>
          <select className="field" value={ai.model||provider.models[0]} onChange={e=>set('model', e.target.value)}>
            {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </SRow>
      </SGroup>

      <SGroup title="Credenciales">
        {provider.id !== 'ollama' && (
          <SRow label="API key" hint={<>Se guarda cifrada en tu disco local. Nunca se envía a ningún servidor salvo al del propio proveedor. <a href={provider.url} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>Conseguir una en {provider.name} →</a></>}>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input className="field" type="password" value={ai.key||''} onChange={e=>set('key',e.target.value)} placeholder={provider.id==='anthropic'?'sk-ant-…':provider.id==='openai'?'sk-…':'AIza…'} style={{flex:1,fontFamily:'var(--font-mono)',fontSize:12}}/>
              {keyOk && <span className="chip ok" style={{fontSize:10.5}}><I.check size={10}/> Válida</span>}
            </div>
          </SRow>
        )}
        {provider.id === 'ollama' && (
          <SRow label="URL del servidor" hint="La dirección donde está corriendo Ollama en tu máquina o red local.">
            <input className="field" value={ai.ollamaUrl||'http://localhost:11434'} onChange={e=>set('ollamaUrl',e.target.value)} style={{fontFamily:'var(--font-mono)',fontSize:12}}/>
          </SRow>
        )}
        <SRow label="Límite mensual de gasto" hint="Avísame cuando me acerque a este tope (solo estimación local). 0 = sin límite.">
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{color:'var(--fg-3)',fontSize:12}}>USD</span>
            <input className="field" type="number" min="0" step="5" value={ai.cap??20} onChange={e=>set('cap', Number(e.target.value))} style={{width:100}}/>
            <span style={{color:'var(--fg-3)',fontSize:11.5,marginLeft:8}}>Este mes: <b style={{color:'var(--fg)'}}>$3.48</b></span>
          </div>
        </SRow>
      </SGroup>

      <SGroup title="¿Para qué usarla?">
        <SRow label="Generar plantillas desde un prompt" hint="Activa el botón ✨ Generar con IA en la galería. Describes el correo en lenguaje natural y la IA arma los bloques por ti.">
          <Switch checked={ai.genTpl!==false} onChange={v=>set('genTpl',v)}/>
        </SRow>
        <SRow label="Mejorar textos de un bloque" hint="Activa el botón ✨ Mejorar cuando seleccionas un bloque: reescribir, acortar, cambiar tono, traducir.">
          <Switch checked={ai.improve!==false} onChange={v=>set('improve',v)}/>
        </SRow>
        <SRow label="Sugerir asunto y preview text" hint="Cuando estás por exportar, propone 3 asuntos y 3 previews basados en el contenido del correo.">
          <Switch checked={ai.subject!==false} onChange={v=>set('subject',v)}/>
        </SRow>
        <SRow label="Revisar antes de enviar" hint="Chequeo rápido de ortografía, tono, y consistencia con tu marca. No modifica nada sin tu permiso.">
          <Switch checked={!!ai.review} onChange={v=>set('review',v)}/>
        </SRow>
      </SGroup>

      <SGroup title="Tono y estilo por defecto">
        <SRow label="Tono preferido" hint="La IA intentará mantener este registro cuando genere o reescriba texto.">
          <select className="field" value={ai.tone||'neutral'} onChange={e=>set('tone',e.target.value)}>
            <option value="neutral">Neutral y claro</option>
            <option value="calido">Cálido y cercano</option>
            <option value="profesional">Profesional y serio</option>
            <option value="divertido">Divertido e informal</option>
            <option value="directo">Directo y breve</option>
            <option value="narrativo">Narrativo y editorial</option>
          </select>
        </SRow>
        <SRow label="Idioma principal" hint="Si escribes en otro idioma te lo respeta; este es el default cuando no queda claro.">
          <select className="field" value={ai.lang||'es-MX'} onChange={e=>set('lang',e.target.value)}>
            <option value="es-MX">Español (México)</option>
            <option value="es-ES">Español (España)</option>
            <option value="es-AR">Español (Argentina)</option>
            <option value="en-US">English (US)</option>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </SRow>
        <SRow label="Instrucciones de marca" hint="Texto libre: cómo hablar a tus suscriptores, qué palabras usar o evitar. Se añade al prompt de cada generación.">
          <textarea className="field" rows={4} value={ai.brandRules||''} onChange={e=>set('brandRules',e.target.value)} placeholder={`Ej.: Hablamos de tú, no de usted. Evitamos "estimado" y "cordial saludo". Siempre cerramos con "Con cariño, el equipo".`}/>
        </SRow>
      </SGroup>

      <SGroup title="Privacidad">
        <SRow label="No mandar mi contenido si contiene datos sensibles" hint="Detecta patrones de tarjetas, RFC, CURP, correos privados, y bloquea el envío automáticamente.">
          <Switch checked={ai.pii!==false} onChange={v=>set('pii',v)}/>
        </SRow>
        <SRow label="Registrar las conversaciones con la IA" hint="Guarda el prompt y la respuesta en un historial local, por si quieres revisarlos. Nunca se suben a la nube.">
          <Switch checked={!!ai.log} onChange={v=>set('log',v)}/>
        </SRow>
        <SRow label="Borrar historial de IA" hint="Elimina todos los prompts y respuestas guardados. No afecta las plantillas generadas." danger>
          <button className="btn sm" style={{color:'var(--danger)'}}><I.trash size={12}/> Borrar 14 conversaciones</button>
        </SRow>
      </SGroup>
    </>
  );
}

Object.assign(window, { SettingsPanel });
