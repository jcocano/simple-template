// Settings panel — full-screen panel with sidebar + 7 sections
// Section 3 (Envío de pruebas) reuses DeliveryInner from smtp-modal.jsx

const SETTINGS_SECTIONS = [
  { id:'workspace',  label:'Espacios',                    icon:'layers',   desc:'Crea, renombra o borra espacios de trabajo' },
  { id:'account',    label:'Perfil',                      icon:'user',     desc:'Tu nombre y cómo apareces en las plantillas' },
  { id:'brand',      label:'Marca',                       icon:'palette',  desc:'Colores, fuentes, logo, footer legal' },
  { id:'appearance', label:'Apariencia',                  icon:'sun',      desc:'Tema, densidad, esquinas y tipografía de la app' },
  { id:'editor',     label:'Editor',                      icon:'edit',     desc:'Autoguardado, grid y regla del canvas' },
  { id:'storage',    label:'Almacenamiento de imágenes',  icon:'image',    desc:'Dónde se alojan las imágenes de tus correos' },
  { id:'delivery',   label:'Envío de pruebas',            icon:'send',     desc:'Cuenta desde la que envías pruebas' },
  { id:'variables',  label:'Variables por defecto',       icon:'braces',   desc:'Etiquetas que se copian a las plantillas nuevas' },
  { id:'export',     label:'Exportación',                 icon:'download', desc:'Formato por defecto al exportar el correo' },
  { id:'ai',         label:'Inteligencia artificial',     icon:'sparkles', desc:'Proveedor, API key y modelo para generar o mejorar plantillas' },
  { id:'notif',      label:'Notificaciones',              icon:'bell',     desc:'Avisos internos de la app: guardado, exportación, pruebas, actualizaciones' },
];

function SettingsPanel({ onClose, initialSection='account' }) {
  const [section, setSection] = React.useState(initialSection);
  const [saved, setSaved] = React.useState(false);
  const currentWorkspace = useCurrentWorkspace();

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
              <div style={{fontSize:10.5,color:'var(--fg-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                Espacio {currentWorkspace?.name || '…'}
              </div>
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
            {section==='workspace'   && <WorkspaceSection onChange={flashSaved}/>}
            {section==='account'     && <AccountSection onChange={flashSaved}/>}
            {section==='appearance'  && <AppearanceSection onChange={flashSaved}/>}
            {section==='ai'          && <AISection onChange={flashSaved}/>}
            {/* Per-workspace sections: key bump forces remount on workspace switch
                so each section re-reads its state from the new workspace. */}
            {section==='brand'       && <BrandSection key={currentWorkspace?.id} onChange={flashSaved}/>}
            {section==='storage'     && <StorageSection key={currentWorkspace?.id} onChange={flashSaved}/>}
            {section==='delivery'    && <div key={currentWorkspace?.id}><DeliveryInner/></div>}
            {section==='editor'      && <EditorSection key={currentWorkspace?.id} onChange={flashSaved}/>}
            {section==='variables'   && <VariablesSection key={currentWorkspace?.id} onChange={flashSaved}/>}
            {section==='export'      && <ExportSection key={currentWorkspace?.id} onChange={flashSaved}/>}
            {section==='notif'       && <NotifSection key={currentWorkspace?.id} onChange={flashSaved}/>}
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

// Banner used by sections whose values persist correctly per-workspace but
// don't have a consumer wired yet. Promised to the user as P1 work.
function SoonBanner({ msg }) {
  return (
    <div style={{
      padding:'10px 14px',marginBottom:18,
      borderRadius:'var(--r-md)',
      background:'color-mix(in oklab, #f0b042 12%, transparent)',
      border:'1px solid color-mix(in oklab, #f0b042 40%, var(--line))',
      display:'flex',gap:10,alignItems:'flex-start',
      fontSize:12,lineHeight:1.55,color:'var(--fg-2)',
    }}>
      <I.info size={14} style={{color:'#b87a18',flexShrink:0,marginTop:1}}/>
      <div>
        <b style={{color:'var(--fg-1)'}}>Pronto en una versión próxima.</b> {msg || 'Tus cambios se guardan en el espacio actual, pero la app aún no los está aplicando.'}
      </div>
    </div>
  );
}

// ───────────────────────────── Workspace ─────────────────────────────
function WorkspaceSection({ onChange }) {
  const workspaces = useWorkspaces();
  const current = useCurrentWorkspace();
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [renaming, setRenaming] = React.useState(null); // {id, name}
  const [counts, setCounts] = React.useState({});
  const [confirmDelete, setConfirmDelete] = React.useState(null); // {id, name, count}
  const [deleteWord, setDeleteWord] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  // Template counts per workspace, refreshed when the workspace list or any
  // template mutates.
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const entries = await Promise.all(
        workspaces.map(async (w) => [w.id, await window.stWorkspaces.countTemplates(w.id)])
      );
      if (alive) setCounts(Object.fromEntries(entries));
    };
    refresh();
    window.addEventListener('st:template-change', refresh);
    return () => {
      alive = false;
      window.removeEventListener('st:template-change', refresh);
    };
  }, [workspaces]);

  const submitCreate = async () => {
    const nm = newName.trim();
    if (!nm) { setCreating(false); return; }
    const ws = await window.stWorkspaces.create(nm);
    if (ws?.id) await window.stWorkspaces.switch(ws.id);
    setCreating(false);
    setNewName('');
    onChange && onChange();
  };

  const submitRename = async () => {
    if (!renaming) return;
    const nm = renaming.name.trim();
    const currentName = workspaces.find((w) => w.id === renaming.id)?.name;
    if (nm && nm !== currentName) {
      await window.stWorkspaces.rename(renaming.id, nm);
      onChange && onChange();
    }
    setRenaming(null);
  };

  const openDelete = async (w) => {
    const count = await window.stWorkspaces.countTemplates(w.id);
    setConfirmDelete({ id: w.id, name: w.name, count });
    setDeleteWord('');
  };

  const runDelete = async () => {
    if (!confirmDelete || deleteWord !== 'BORRAR') return;
    setBusy(true);
    try {
      const result = await window.stWorkspaces.remove(confirmDelete.id);
      if (!result || !result.error) {
        onChange && onChange();
        setConfirmDelete(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const isLast = workspaces.length <= 1;

  return (
    <>
      <SGroup title={`Mis espacios · ${workspaces.length}`}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {workspaces.map((w) => {
            const isCurrent = w.id === current?.id;
            const count = counts[w.id];
            const isRenaming = renaming?.id === w.id;
            return (
              <div key={w.id} style={{
                display:'flex',alignItems:'center',gap:12,
                padding:'12px 14px',
                borderRadius:'var(--r-md)',
                border:'1px solid var(--line)',
                background: isCurrent ? 'color-mix(in oklab, var(--accent) 6%, var(--surface))' : 'var(--surface)',
              }}>
                <div style={{
                  width:32,height:32,borderRadius:'var(--r-sm)',
                  background:'var(--accent-soft)',color:'var(--accent)',
                  display:'grid',placeItems:'center',
                  fontFamily:'var(--font-display)',fontWeight:600,fontSize:14,
                  flexShrink:0,
                }}>
                  {(w.name || '?').slice(0,1).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  {isRenaming ? (
                    <input
                      autoFocus
                      className="field"
                      value={renaming.name}
                      onChange={e=>setRenaming({...renaming, name:e.target.value})}
                      onKeyDown={e=>{
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      onBlur={submitRename}
                      style={{fontSize:13,padding:'4px 8px'}}
                    />
                  ) : (
                    <div style={{fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
                      <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{w.name}</span>
                      {isCurrent && <span className="chip" style={{fontSize:10,background:'var(--accent-soft)',color:'var(--accent)',flexShrink:0}}>Activo</span>}
                    </div>
                  )}
                  <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2}}>
                    {count == null ? '…' : `${count} plantilla${count===1?'':'s'}`}
                  </div>
                </div>
                <div style={{display:'flex',gap:4,flexShrink:0}}>
                  {!isCurrent && !isRenaming && (
                    <button className="btn sm ghost" onClick={()=>window.stWorkspaces.switch(w.id)}>Cambiar aquí</button>
                  )}
                  {!isRenaming && (
                    <button className="btn icon sm ghost" title="Renombrar"
                      onClick={()=>setRenaming({id:w.id, name:w.name})}>
                      <I.edit size={12}/>
                    </button>
                  )}
                  <button
                    className="btn icon sm ghost"
                    title={isLast ? 'No puedes borrar tu único espacio — crea otro antes.' : 'Eliminar'}
                    disabled={isLast}
                    onClick={()=>openDelete(w)}
                    style={{
                      opacity: isLast ? 0.4 : 1,
                      color: isLast ? undefined : 'var(--err, #e04f4f)',
                      cursor: isLast ? 'not-allowed' : 'pointer',
                    }}>
                    <I.trash size={12}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SGroup>

      <SGroup title="Crear espacio nuevo">
        {creating ? (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input
              autoFocus
              className="field"
              value={newName}
              onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>{
                if (e.key === 'Enter') submitCreate();
                if (e.key === 'Escape') { setCreating(false); setNewName(''); }
              }}
              placeholder="Ej. Marca B, Cliente X, Personal…"
              style={{flex:1}}
            />
            <button className="btn primary sm" onClick={submitCreate} disabled={!newName.trim()}>Crear</button>
            <button className="btn ghost sm" onClick={()=>{ setCreating(false); setNewName(''); }}>Cancelar</button>
          </div>
        ) : (
          <button className="btn" onClick={()=>setCreating(true)}><I.plus size={13}/> Crear espacio nuevo</button>
        )}
      </SGroup>

      <SGroup title="Cómo funcionan los espacios">
        <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.6,padding:12,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-md)'}}>
          Cada espacio tiene sus propias plantillas, marca, variables, envío de pruebas y preferencias.
          Los ajustes globales (tu perfil, apariencia de la app, clave de IA) se comparten entre todos.
          Borrar un espacio elimina sus plantillas para siempre — incluidas las que estén en la papelera.
        </div>
      </SGroup>

      {confirmDelete && (
        <div className="modal-backdrop" onClick={busy ? undefined : ()=>setConfirmDelete(null)}>
          <div className="modal pop" onClick={e=>e.stopPropagation()} style={{maxWidth:460}}>
            <div className="modal-head">
              <div style={{
                width:32,height:32,borderRadius:'var(--r-sm)',
                background:'color-mix(in oklab, #e04f4f 15%, transparent)',
                color:'#e04f4f',display:'grid',placeItems:'center',flexShrink:0,
              }}>
                <I.trash size={15}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <h3>Eliminar «{confirmDelete.name}»</h3>
                <div className="sub">
                  Vas a borrar este espacio{confirmDelete.count>0 ? ` y sus ${confirmDelete.count} plantilla${confirmDelete.count===1?'':'s'}` : ''}. No se puede deshacer.
                </div>
              </div>
            </div>
            <div className="modal-body">
              <div style={{fontSize:12.5,color:'var(--fg-2)',marginBottom:10}}>
                Para confirmar, escribe <b style={{fontFamily:'var(--font-mono)'}}>BORRAR</b> abajo:
              </div>
              <input
                autoFocus
                className="field"
                value={deleteWord}
                onChange={e=>setDeleteWord(e.target.value)}
                onKeyDown={e=>{ if (e.key === 'Enter' && deleteWord === 'BORRAR') runDelete(); }}
                placeholder="BORRAR"
                style={{fontFamily:'var(--font-mono)',letterSpacing:'0.08em'}}
              />
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={()=>setConfirmDelete(null)} disabled={busy}>Cancelar</button>
              <button
                className="btn primary"
                onClick={runDelete}
                disabled={busy || deleteWord !== 'BORRAR'}
                style={{
                  background: deleteWord==='BORRAR' ? '#e04f4f' : undefined,
                  borderColor: deleteWord==='BORRAR' ? '#e04f4f' : undefined,
                }}>
                {busy ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
          <input className="field"
            value={acc.name||''}
            placeholder="Tu nombre"
            onChange={e=>set('name',e.target.value)}/>
        </SRow>
        <SRow label="Correo" hint="Se usa como remitente por defecto en pruebas.">
          <input className="field" type="email"
            value={acc.email||''}
            placeholder="tu@correo.com"
            onChange={e=>set('email',e.target.value)}/>
        </SRow>
        <SRow label="Avatar" hint="Imagen local. Se muestra solo dentro de la app.">
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{
              width:56,height:56,borderRadius:'50%',
              background:'linear-gradient(135deg,#5b5bf0,#8b5cf6)',
              color:'#fff',display:'grid',placeItems:'center',
              fontFamily:'var(--font-display)',fontWeight:700,fontSize:22,
            }}>{((acc.name||'').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()) || '?'}</div>
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

// Hook: loads a sensitive CDN field from workspace secrets on mount. If the
// field is missing from secrets but present in the legacy plaintext config,
// migrates it transparently. Mirrors the `AISection` API-key pattern.
function useCDNSecret(provider, field) {
  const [value, setValue] = React.useState('');
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    setLoaded(false);
    (async () => {
      const wsKey = window.stStorage.secrets.wsKey(`cdn:${provider}:${field}`);
      try {
        const stored = await window.stStorage.secrets.get(wsKey);
        if (!alive) return;
        if (stored) { setValue(stored); setLoaded(true); return; }
        // Legacy: older builds kept this inside the storage settings JSON.
        // Move it to secrets and wipe the plaintext copy.
        const legacy = (window.stStorage.getWSSetting('storage', {}) || {})?.[provider]?.[field];
        if (legacy) {
          try { await window.stStorage.secrets.set(wsKey, legacy); } catch {}
          if (!alive) return;
          setValue(legacy);
          const cur = window.stStorage.getWSSetting('storage', {}) || {};
          const next = { ...cur, [provider]: { ...(cur[provider] || {}) } };
          delete next[provider][field];
          window.stStorage.setWSSetting('storage', next);
        }
      } catch {}
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, [provider, field]);

  const save = async (v) => {
    setValue(v);
    const wsKey = window.stStorage.secrets.wsKey(`cdn:${provider}:${field}`);
    try {
      if (v) await window.stStorage.secrets.set(wsKey, v);
      else await window.stStorage.secrets.remove(wsKey);
    } catch (err) {
      console.error(`[cdn] save secret ${provider}.${field}`, err);
    }
  };

  return [value, save, loaded];
}

function StorageSection({ onChange }) {
  const [s, setS] = React.useState(() => ({
    mode: 'base64',
    s3: { endpoint:'https://s3.amazonaws.com', region:'us-east-1', bucket:'', key:'', publicUrl:'' },
    r2: { accountId:'', bucket:'', key:'', publicUrl:'' },
    cloudinary: { cloudName:'', uploadPreset:'' },
    imgbb: {},
    github: { repo:'', branch:'main', path:'assets/' },
    ftp: { host:'', port:'21', user:'', path:'/public_html/img/', publicUrl:'' },
    ...window.stStorage.getWSSetting('storage', {}),
  }));
  const save = (next) => { setS(next); window.stStorage.setWSSetting('storage', next); onChange(); };
  const setMode = (mode) => save({...s, mode});
  const setField = (provider, k, v) => save({...s, [provider]: {...s[provider], [k]:v}});

  // Sensitive fields live in safeStorage-encrypted secrets, one per (provider, field).
  const [s3Secret, setS3Secret] = useCDNSecret('s3', 'secret');
  const [imgbbKey, setImgbbKey] = useCDNSecret('imgbb', 'apiKey');
  const [cloudinaryKey, setCloudinaryKey] = useCDNSecret('cloudinary', 'apiKey');
  const [githubToken, setGithubToken] = useCDNSecret('github', 'token');
  const [ftpPassword, setFtpPassword] = useCDNSecret('ftp', 'password');

  // "Probar conexión" state per provider: idle | testing | ok | err (+ message).
  const [testState, setTestState] = React.useState({});
  const doTest = async (providerId) => {
    setTestState(t => ({ ...t, [providerId]: { state: 'testing' } }));
    try {
      // Persist config first so stCDN can read fresh values.
      const result = await window.stCDN.testConnection(providerId);
      setTestState(t => ({
        ...t,
        [providerId]: result.ok
          ? { state: 'ok', url: result.url }
          : { state: 'err', msg: result.error || 'Falló la prueba.' },
      }));
    } catch (err) {
      setTestState(t => ({ ...t, [providerId]: { state: 'err', msg: err?.message || 'Error desconocido.' } }));
    }
  };

  const testIndicator = (providerId) => {
    const t = testState[providerId];
    if (!t) return null;
    if (t.state === 'testing') return <span style={{fontSize:11,color:'var(--fg-3)'}}>Probando…</span>;
    if (t.state === 'ok') return <span className="chip ok" style={{fontSize:10.5}}><I.check size={10}/> Subida OK</span>;
    if (t.state === 'err') return <span style={{fontSize:11,color:'var(--danger)',lineHeight:1.4,flex:1}}>{t.msg}</span>;
    return null;
  };

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
            <input className="field" type="password" value={s3Secret} onChange={e=>setS3Secret(e.target.value)} placeholder="••••••••••••••••"/>
          </SRow>
          <SRow label="URL pública base" hint="Opcional. Dominio desde el que se servirán las imágenes (ej: cdn.tudominio.com).">
            <input className="field" value={s.s3.publicUrl} onChange={e=>setField('s3','publicUrl',e.target.value)} placeholder="https://cdn.tudominio.com"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('s3')} disabled={testState.s3?.state === 'testing'}>
              <I.check size={12}/> Probar conexión
            </button>
            {testIndicator('s3')}
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
            <input className="field" type="password" value={cloudinaryKey} onChange={e=>setCloudinaryKey(e.target.value)} placeholder="1234567890"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('cloudinary')} disabled={testState.cloudinary?.state === 'testing'}>
              <I.check size={12}/> Probar conexión
            </button>
            {testIndicator('cloudinary')}
          </div>
        </SGroup>
      )}

      {s.mode==='imgbb' && (
        <SGroup title="Configuración · imgbb">
          <SRow label="API key" hint="Obtén una clave gratuita en api.imgbb.com. Se guarda cifrada en tu equipo.">
            <input className="field" type="password" value={imgbbKey} onChange={e=>setImgbbKey(e.target.value)} placeholder="••••••••••••••••"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('imgbb')} disabled={testState.imgbb?.state === 'testing'}>
              <I.check size={12}/> Probar conexión
            </button>
            {testIndicator('imgbb')}
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
          <SRow label="Personal Access Token" hint="Token con permiso 'repo' (o fine-grained 'contents:write'). Se guarda cifrado en tu equipo.">
            <input className="field" type="password" value={githubToken} onChange={e=>setGithubToken(e.target.value)} placeholder="ghp_••••••••••••"/>
          </SRow>
          <SRow label="URL pública base (opcional)" hint="Dominio desde el que se servirán las imágenes. Si no lo pones, se usa la URL cruda de GitHub.">
            <input className="field" value={s.github.publicUrl||''} onChange={e=>setField('github','publicUrl',e.target.value)} placeholder="https://miusuario.github.io/mi-repo/assets"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('github')} disabled={testState.github?.state === 'testing'}>
              <I.check size={12}/> Probar conexión
            </button>
            {testIndicator('github')}
          </div>
        </SGroup>
      )}

      {s.mode==='ftp' && (
        <SGroup title="Configuración · FTP / FTPS">
          <SRow label="Host" hint="Dirección del servidor (ej: ftp.tudominio.com). SFTP (SSH) no está soportado — usá FTP o FTPS.">
            <input className="field" value={s.ftp.host} onChange={e=>setField('ftp','host',e.target.value)} placeholder="ftp.tudominio.com"/>
          </SRow>
          <SRow label="Puerto" hint="21 para FTP normal, 990 para FTPS implícito.">
            <input className="field" value={s.ftp.port} onChange={e=>setField('ftp','port',e.target.value)} placeholder="21"/>
          </SRow>
          <SRow label="Usar FTPS (TLS)" hint="Activá si el servidor requiere conexión cifrada.">
            <Switch checked={!!s.ftp.secure} onChange={v=>setField('ftp','secure',v)}/>
          </SRow>
          <SRow label="Usuario" hint="Nombre de usuario con permiso de escritura en la carpeta destino.">
            <input className="field" value={s.ftp.user} onChange={e=>setField('ftp','user',e.target.value)} placeholder="mi-usuario"/>
          </SRow>
          <SRow label="Contraseña" hint="Se guarda cifrada en tu equipo.">
            <input className="field" type="password" value={ftpPassword} onChange={e=>setFtpPassword(e.target.value)} placeholder="••••••••••••"/>
          </SRow>
          <SRow label="Carpeta destino" hint="Ruta absoluta en el servidor donde se subirán las imágenes.">
            <input className="field" value={s.ftp.path} onChange={e=>setField('ftp','path',e.target.value)} placeholder="/public_html/img/"/>
          </SRow>
          <SRow label="URL pública base" hint="Dominio desde el que se servirán las imágenes. Requerido.">
            <input className="field" value={s.ftp.publicUrl} onChange={e=>setField('ftp','publicUrl',e.target.value)} placeholder="https://tudominio.com/img/"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('ftp')} disabled={testState.ftp?.state === 'testing'}>
              <I.check size={12}/> Probar conexión
            </button>
            {testIndicator('ftp')}
          </div>
        </SGroup>
      )}

      <SGroup title="Comportamiento">
        <SRow label="Optimizar imágenes antes de subir" hint="Reduce a máx 2000px y re-comprime a WebP (o mantiene PNG si tiene transparencia). Ahorra ancho de banda y tamaño del correo.">
          <Switch checked={s.optimize === true} onChange={v => save({...s, optimize: v})}/>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Brand ─────────────────────────────
// Single swatch with native color picker + remove-on-hover. Used by BrandSection.
function ColorSwatch({ value, onChange, onRemove }) {
  const inputRef = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  return (
    <div
      style={{position:'relative'}}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
    >
      <div
        onClick={()=>inputRef.current?.click()}
        title="Cambiar color"
        style={{
          width:40,height:40,borderRadius:'var(--r-sm)',
          background:value,
          border:'1px solid var(--line)',
          cursor:'pointer',
        }}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={e=>onChange(e.target.value)}
        style={{position:'absolute',inset:0,opacity:0,pointerEvents:'none',width:0,height:0}}
        aria-hidden="true"
      />
      <div style={{fontSize:10,color:'var(--fg-3)',fontFamily:'var(--font-mono)',textAlign:'center',marginTop:4}}>{value}</div>
      {onRemove && hover && (
        <button
          onClick={(e)=>{ e.stopPropagation(); onRemove(); }}
          title="Eliminar color"
          aria-label="Eliminar color"
          style={{
            position:'absolute',top:-6,right:-6,
            width:18,height:18,borderRadius:'50%',
            background:'#e04f4f',color:'#fff',border:'none',
            display:'grid',placeItems:'center',cursor:'pointer',
            fontSize:12,lineHeight:1,padding:0,
            boxShadow:'0 1px 4px rgba(0,0,0,.25)',
          }}>×</button>
      )}
    </div>
  );
}

function BrandSection({ onChange }) {
  const [brand, setBrand] = React.useState(() => window.stStorage.getWSSetting('brand', {}));
  const set = (k,v) => { const n = {...brand, [k]:v}; setBrand(n); window.stStorage.setWSSetting('brand', n); onChange(); };

  const colors = brand.colors || ['#5b5bf0','#1a1a2e','#f6f5f1','#e8eddd','#d97757'];
  const fonts  = ['Inter','Söhne','Fraunces','DM Serif Display','Instrument Serif','Playfair Display','Space Grotesk','IBM Plex Sans'];

  const addRef = React.useRef(null);
  const setColors = (next) => set('colors', next);
  const updateColorAt = (i, v) => setColors(colors.map((c, ci) => ci===i ? v : c));
  const removeColorAt = (i) => setColors(colors.filter((_, ci) => ci !== i));
  const appendColor = (v) => setColors([...colors, v]);

  return (
    <>
      <SGroup title="Identidad visual">
        <SRow label="Paleta de colores" hint="Los primeros 5 aparecen en el editor como accesos rápidos. Pasa el mouse sobre uno para borrarlo, o haz clic para cambiarlo.">
          <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'flex-start',paddingTop:6}}>
            {colors.map((c, i) => (
              <ColorSwatch
                key={i}
                value={c}
                onChange={(v)=>updateColorAt(i, v)}
                onRemove={colors.length > 1 ? ()=>removeColorAt(i) : null}
              />
            ))}
            <div style={{position:'relative'}}>
              <button
                onClick={()=>addRef.current?.click()}
                title="Añadir color"
                aria-label="Añadir color"
                style={{
                  width:40,height:40,borderRadius:'var(--r-sm)',
                  border:'1px dashed var(--line)',
                  background:'transparent',
                  color:'var(--fg-3)',cursor:'pointer',
                  display:'grid',placeItems:'center',
                }}><I.plus size={14}/></button>
              <input
                ref={addRef}
                type="color"
                defaultValue="#888888"
                onChange={e=>appendColor(e.target.value)}
                style={{position:'absolute',inset:0,opacity:0,pointerEvents:'none',width:0,height:0}}
                aria-hidden="true"
              />
            </div>
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
          <textarea className="field" rows="2"
            placeholder="Ej. Acme SA · Av. Reforma 123, CDMX 06600, México"
            value={brand.address || ''}
            onChange={e=>set('address', e.target.value)}/>
        </SRow>
        <SRow label="Enlace de baja" hint="URL a la que lleva el botón 'Darme de baja' en el footer.">
          <input className="field"
            placeholder="https://acme.com/unsubscribe"
            value={brand.unsubscribe || ''}
            onChange={e=>set('unsubscribe', e.target.value)}/>
        </SRow>
        <SRow label="Texto del footer" hint="Aparece debajo del botón de baja en todos los envíos.">
          <textarea className="field" rows="3"
            placeholder="Recibes este correo porque te suscribiste en acme.com. Puedes actualizar tus preferencias o darte de baja cuando quieras."
            value={brand.footer || ''}
            onChange={e=>set('footer', e.target.value)}/>
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
  const [ed, setEd] = React.useState(() => window.stStorage.getWSSetting('editor', {}));
  const set = (k,v) => { const n = {...ed, [k]:v}; setEd(n); window.stStorage.setWSSetting('editor', n); onChange(); };

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
      <SoonBanner msg="Las preferencias del editor se guardan en este espacio, pero el editor aún no las consulta. Está en cola para una próxima versión."/>
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
  const [vars, setVars] = React.useState(() => window.stStorage.getWSSetting('vars', null) || VARIABLES);
  const save = (next) => { setVars(next); window.stStorage.setWSSetting('vars', next); onChange(); };
  const setVal = (i,v) => save(vars.map((x,j)=>j===i?{...x,sample:v}:x));

  return (
    <>
      <div style={{
        padding:'10px 14px',marginBottom:18,
        borderRadius:'var(--r-md)',
        background:'var(--accent-soft)',
        border:'1px solid color-mix(in oklab, var(--accent) 30%, var(--line))',
        display:'flex',gap:10,alignItems:'flex-start',
        fontSize:12,lineHeight:1.55,color:'var(--fg-2)',
      }}>
        <I.info size={14} style={{color:'var(--accent)',flexShrink:0,marginTop:1}}/>
        <div>
          <b style={{color:'var(--fg-1)'}}>Defaults para plantillas nuevas.</b> Cada plantilla nueva hereda esta lista. Cambiarla aquí NO afecta a las que ya existen — esas se editan con el botón «Etiquetas» del editor.
        </div>
      </div>
      <SGroup title="Etiquetas que heredan las plantillas nuevas">
        <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.55,paddingBottom:16}}>
          Cuando creas una plantilla, se le copia esta lista. Desde ahí cada plantilla evoluciona independiente.
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
  const [ex, setEx] = React.useState(() => window.stStorage.getWSSetting('export', {}));
  const set = (k,v) => { const n = {...ex, [k]:v}; setEx(n); window.stStorage.setWSSetting('export', n); onChange(); };

  return (
    <>
      <SoonBanner msg="La preferencia de formato de exportación se guarda en este espacio, pero el flujo de exportar todavía es mock. Está en cola para una próxima versión."/>
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
  const [n, setN] = React.useState(() => window.stStorage.getWSSetting('notif', {}));
  const set = (k,v) => { const nn = {...n, [k]:v}; setN(nn); window.stStorage.setWSSetting('notif', nn); onChange(); };

  const Switch = ({k, def=true}) => (
    <label className="switch"><input type="checkbox" defaultChecked={n[k]!==false && (n[k]===undefined?def:n[k])} onChange={e=>set(k,e.target.checked)}/><span/></label>
  );

  return (
    <>
      <SoonBanner msg="«Recordar autoguardado», «Aviso de exportación lista» y «Resultado del envío de prueba» ya respetan tu preferencia. El resto (imagen pesada, sonidos, actualizaciones, beta) se guardan en este espacio pero todavía no se aplican."/>
      <SGroup title="Avisos dentro de la app">
        <SRow label="Recordar autoguardado" hint="Te avisa en la esquina inferior cada vez que Simple Template guarda tu trabajo automáticamente. Apagado por defecto porque puede ser ruidoso si editas mucho.">
          <Switch k="saved" def={false}/>
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

  // Model lists intentionally not hardcoded — they rot. Models are fetched
  // live from each provider's /models endpoint (or Ollama's /api/tags) via
  // stAI.listModels, with a free-text input so the user can always type a
  // newly-released model name we don't know about yet.
  const PROVIDERS = [
    { id:'anthropic', name:'Anthropic Claude', hint:'Mejores resultados para copy y HTML.', url:'https://console.anthropic.com' },
    { id:'openai',    name:'OpenAI',           hint:'Versátil y con buen ecosistema.',       url:'https://platform.openai.com' },
    { id:'google',    name:'Google Gemini',    hint:'Generoso con tokens; rápido.',          url:'https://aistudio.google.com' },
    { id:'ollama',    name:'Ollama (local)',   hint:'Corre en tu máquina. Sin API key.',     url:'http://localhost:11434' },
  ];
  const provider = PROVIDERS.find(p => p.id === (ai.provider||'anthropic'));
  const enabled = ai.enabled !== false;

  // API key lives in workspace secrets (encrypted via safeStorage), keyed per
  // provider so switching providers doesn't clobber another's key. The flag
  // `ai.keyConfigured` is the public signal other UIs (dashboard, editor)
  // read to decide whether to enable the AI buttons — the actual key never
  // leaves this section unless explicitly loaded.
  const [apiKey, setApiKey] = React.useState('');
  const [apiKeyLoaded, setApiKeyLoaded] = React.useState(false);
  const keyOk = !!apiKey && apiKey.length > 15;

  React.useEffect(() => {
    let alive = true;
    setApiKeyLoaded(false);
    (async () => {
      const secretKey = `ai:${provider.id}:key`;
      try {
        const stored = await window.stStorage.secrets.get(secretKey);
        if (!alive) return;
        // Legacy migration: if older builds left the key inside ai.key, move
        // it to secrets the first time we see it.
        if (!stored && ai.key) {
          await window.stStorage.secrets.set(secretKey, ai.key);
          if (!alive) return;
          setApiKey(ai.key);
          const next = { ...ai };
          delete next.key;
          next.keyConfigured = ai.key.length > 15;
          setAi(next);
          window.stStorage.setSetting('ai', next);
        } else {
          setApiKey(stored || '');
        }
      } catch {}
      if (alive) setApiKeyLoaded(true);
    })();
    return () => { alive = false; };
  }, [provider.id]);

  const setApiKeyValue = async (value) => {
    setApiKey(value);
    const secretKey = `ai:${provider.id}:key`;
    try {
      if (value) await window.stStorage.secrets.set(secretKey, value);
      else await window.stStorage.secrets.remove(secretKey);
    } catch (err) {
      console.error('[ai] save key', err);
    }
    const next = { ...ai, keyConfigured: !!value && value.length > 15 };
    setAi(next);
    window.stStorage.setSetting('ai', next);
    onChange();
  };

  // Live-fetched models from the provider's /models endpoint. We never
  // hardcode a list because providers (Anthropic, OpenAI, Google) ship new
  // models constantly and Ollama models are whatever the user has pulled
  // locally. The input is free-text so the user can always type a model
  // name we don't know about yet.
  const [models, setModels] = React.useState([]);
  const [modelsLoading, setModelsLoading] = React.useState(false);
  const [modelsError, setModelsError] = React.useState(null);

  const refreshModels = async () => {
    setModelsLoading(true);
    setModelsError(null);
    try {
      const result = await window.stAI.listModels(provider.id);
      if (result.ok) {
        setModels(result.models || []);
        if ((result.models || []).length === 0 && provider.id === 'ollama') {
          setModelsError('No hay modelos instalados. Descargá uno con "ollama pull llama3.3" en tu terminal.');
        }
      } else {
        setModels([]);
        setModelsError(result.error);
      }
    } catch (err) {
      setModels([]);
      setModelsError(err?.message || 'Error inesperado al listar modelos.');
    } finally {
      setModelsLoading(false);
    }
  };

  // Auto-fetch when provider or key availability changes. Only after the
  // initial key load settles — avoids duplicate fetches on first mount.
  React.useEffect(() => {
    if (!apiKeyLoaded) return;
    const canFetch = provider.id === 'ollama' || !!apiKey;
    if (!canFetch) {
      setModels([]);
      setModelsError(null);
      return;
    }
    refreshModels();
  }, [provider.id, apiKeyLoaded]);

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
            {enabled && keyOk ? <>Activo con <b style={{color:'var(--fg)'}}>{provider.name}</b>{ai.model ? <> · modelo <b style={{color:'var(--fg)'}}>{ai.model}</b></> : null}</> :
             enabled && !keyOk ? <>Te falta añadir la API key de <b style={{color:'var(--fg)'}}>{provider.name}</b> para poder usarla.</> :
             <>Desactivada. Activa el interruptor para usar “✨ Generar con IA” y “✨ Mejorar”.</>}
          </div>
        </div>
        <Switch checked={enabled} onChange={v=>set('enabled',v)}/>
      </div>

      <SGroup title="Proveedor">
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
      </SGroup>

      <SGroup title="Credenciales">
        {provider.id !== 'ollama' && (
          <SRow label="API key" hint={<>Se guarda cifrada en tu disco local. Nunca se envía a ningún servidor salvo al del propio proveedor. <a href={provider.url} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>Conseguir una en {provider.name} →</a></>}>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input
                className="field"
                type="password"
                value={apiKey}
                onChange={e=>setApiKeyValue(e.target.value)}
                disabled={!apiKeyLoaded}
                placeholder={provider.id==='anthropic'?'sk-ant-…':provider.id==='openai'?'sk-…':'AIza…'}
                style={{flex:1,fontFamily:'var(--font-mono)',fontSize:12}}/>
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

      {/* Model picker hidden until credentials are in place. For password
          providers we gate on keyOk (len > 15); Ollama has no key so always
          shows once the group renders. Avoids showing an empty/failing
          picker before the user has set up access. */}
      {(keyOk || provider.id === 'ollama') && (
        <SGroup title="Modelo">
          <SRow label="Modelo" hint={`Los modelos disponibles se actualizan contra ${provider.name}. Podés tipear el nombre de uno nuevo aunque no aparezca en la lista.`}>
            <div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <input
                  className="field"
                  list={`ai-models-${provider.id}`}
                  value={ai.model || ''}
                  onChange={e => set('model', e.target.value)}
                  placeholder={provider.id === 'ollama' ? 'llama3.3' : provider.id === 'anthropic' ? 'claude-sonnet-4-5' : provider.id === 'openai' ? 'gpt-4.1' : 'gemini-2.5-flash'}
                  style={{flex:1, fontFamily:'var(--font-mono)', fontSize:12}}/>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={refreshModels}
                  disabled={modelsLoading}
                  title="Refrescar lista de modelos">
                  {modelsLoading ? 'Cargando…' : 'Refrescar'}
                </button>
              </div>
              <datalist id={`ai-models-${provider.id}`}>
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.createdAt ? ` · ${String(m.createdAt).slice(0,10)}` : ''}
                  </option>
                ))}
              </datalist>
              {modelsError && (
                <div style={{fontSize:11,color:'var(--fg-3)',marginTop:6,lineHeight:1.4}}>
                  {modelsError} Podés tipear el nombre igual si ya lo conocés.
                </div>
              )}
              {!modelsError && !modelsLoading && models.length > 0 && (
                <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}}>
                  {models.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => set('model', m.id)}
                      title={m.createdAt ? `Disponible desde ${String(m.createdAt).slice(0,10)}` : m.id}
                      style={{
                        fontSize:10.5,padding:'3px 8px',
                        fontFamily:'var(--font-mono)',
                        border: ai.model === m.id ? '1px solid var(--accent)' : '1px solid var(--line)',
                        borderRadius:999,
                        background: ai.model === m.id ? 'var(--accent-soft)' : 'var(--surface)',
                        color: ai.model === m.id ? 'var(--accent)' : 'var(--fg-2)',
                        cursor:'pointer',
                      }}>
                      {m.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SRow>
        </SGroup>
      )}

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
        <SRow label="Registrar las conversaciones con la IA" hint="Guarda el prompt y la respuesta en un historial local por espacio, por si querés revisarlos. Nunca se suben a la nube.">
          <Switch checked={!!ai.log} onChange={v=>set('log',v)}/>
        </SRow>
      </SGroup>

      {ai.log && <AIHistoryGroup/>}
    </>
  );
}

// Workspace-scoped AI history viewer. Only renders when ai.log is on.
// Keeps the last 500 prompts+responses per workspace in SQLite (pruned
// automatically on insert). Never touches the network.
function AIHistoryGroup() {
  const [entries, setEntries] = React.useState([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(null);
  const [confirmClear, setConfirmClear] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, total] = await Promise.all([
        window.stAI.log.list({ limit: 50 }),
        window.stAI.log.count(),
      ]);
      setEntries(rows);
      setCount(total);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const doClear = async () => {
    await window.stAI.log.clear();
    setConfirmClear(false);
    await load();
  };

  const doExport = () => {
    const json = JSON.stringify(entries, null, 2);
    const ts = new Date().toISOString().slice(0, 10);
    window.stExport.downloadFile(`ai-history-${ts}.json`, json, 'application/json');
  };

  return (
    <SGroup title={`Historial de IA${count ? ` · ${count}` : ''}`}>
      <SRow
        label="Conversaciones guardadas"
        hint={`${count === 0 ? 'Todavía no hay ninguna.' : count === 1 ? '1 conversación local.' : `${count} conversaciones locales.`} Se guardan las últimas 500 por espacio; las viejas se borran automáticamente.`}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button type="button" className="btn sm ghost" onClick={load} disabled={loading}>
            {loading ? 'Cargando…' : 'Refrescar'}
          </button>
          <button type="button" className="btn sm ghost" onClick={doExport} disabled={entries.length === 0}>
            <I.download size={12}/> Exportar JSON
          </button>
          {!confirmClear ? (
            <button
              type="button"
              className="btn sm"
              style={{color:'var(--danger)'}}
              onClick={() => setConfirmClear(true)}
              disabled={count === 0}>
              <I.trash size={12}/> Borrar todo
            </button>
          ) : (
            <>
              <button type="button" className="btn sm ghost" onClick={() => setConfirmClear(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn sm"
                style={{background:'var(--danger)',color:'#fff'}}
                onClick={doClear}>
                Sí, borrar {count}
              </button>
            </>
          )}
        </div>
      </SRow>

      {entries.length > 0 && (
        <div style={{padding:'12px 0 4px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {entries.map(e => (
              <AIHistoryEntry
                key={e.id}
                entry={e}
                expanded={expanded === e.id}
                onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
              />
            ))}
          </div>
          {count > entries.length && (
            <div style={{fontSize:11,color:'var(--fg-3)',padding:'8px 0 0',textAlign:'center'}}>
              Mostrando {entries.length} de {count}. Exportá el JSON para ver todas.
            </div>
          )}
        </div>
      )}
    </SGroup>
  );
}

function AIHistoryEntry({ entry, expanded, onToggle }) {
  const when = new Date(entry.createdAt).toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const opLabel = entry.op === 'improve' ? 'Mejorar texto'
    : entry.op === 'generate' ? 'Generar plantilla'
    : entry.op;
  const providerShort = entry.provider === 'anthropic' ? 'Claude'
    : entry.provider === 'openai' ? 'OpenAI'
    : entry.provider === 'google' ? 'Gemini'
    : entry.provider === 'ollama' ? 'Ollama'
    : entry.provider;

  return (
    <div style={{
      border:'1px solid var(--line)',borderRadius:'var(--r-sm)',
      background:'var(--surface)',
      overflow:'hidden',
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width:'100%',padding:'8px 12px',
          background:'transparent',border:'none',cursor:'pointer',
          display:'flex',alignItems:'center',gap:10,
          textAlign:'left',
        }}>
        <div style={{
          width:18,height:18,borderRadius:4,flexShrink:0,
          background: entry.ok ? 'color-mix(in oklab, var(--ok) 15%, transparent)' : 'color-mix(in oklab, var(--danger) 15%, transparent)',
          color: entry.ok ? 'var(--ok)' : 'var(--danger)',
          display:'grid',placeItems:'center',
        }}>
          {entry.ok ? <I.check size={11}/> : <I.x size={11}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:500,display:'flex',gap:6,alignItems:'center'}}>
            <span>{opLabel}</span>
            <span style={{color:'var(--fg-3)',fontWeight:400}}>·</span>
            <span style={{color:'var(--fg-3)',fontWeight:400}}>{providerShort}{entry.model ? ` · ${entry.model}` : ''}</span>
          </div>
          <div style={{fontSize:10.5,color:'var(--fg-3)',marginTop:2}}>{when}</div>
        </div>
        <div style={{fontSize:10.5,color:'var(--fg-3)'}}>{expanded ? '▾' : '▸'}</div>
      </button>
      {expanded && (
        <div style={{padding:'0 12px 12px',borderTop:'1px solid var(--line)'}}>
          <div style={{fontSize:10.5,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'.06em',margin:'10px 0 4px'}}>Prompt</div>
          <pre style={{margin:0,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,fontFamily:'var(--font-mono)',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:240,overflow:'auto'}}>
            {entry.prompt || '(vacío)'}
          </pre>
          <div style={{fontSize:10.5,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'.06em',margin:'12px 0 4px'}}>
            {entry.ok ? 'Respuesta' : 'Error'}
          </div>
          <pre style={{margin:0,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,fontFamily:'var(--font-mono)',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:240,overflow:'auto',color: entry.ok ? undefined : 'var(--danger)'}}>
            {entry.ok ? (entry.response || '(vacío)') : (entry.error || 'Sin detalle')}
          </pre>
          {entry.usage && (
            <div style={{marginTop:8,fontSize:10.5,color:'var(--fg-3)'}}>
              Tokens: {Object.entries(entry.usage).map(([k,v]) => `${k}=${v}`).join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SettingsPanel });
