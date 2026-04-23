// Settings panel — full-screen panel with sidebar + 7 sections
// Section 3 (Envío de pruebas) reuses DeliveryInner from smtp-modal.jsx

const SETTINGS_SECTIONS = [
  { id:'workspace',  labelKey:'settings.nav.workspace',  descKey:'settings.nav.workspace.desc',  icon:'layers'   },
  { id:'account',    labelKey:'settings.nav.account',    descKey:'settings.nav.account.desc',    icon:'user'     },
  { id:'brand',      labelKey:'settings.nav.brand',      descKey:'settings.nav.brand.desc',      icon:'palette'  },
  { id:'appearance', labelKey:'settings.nav.appearance', descKey:'settings.nav.appearance.desc', icon:'sun'      },
  { id:'editor',     labelKey:'settings.nav.editor',     descKey:'settings.nav.editor.desc',     icon:'edit'     },
  { id:'storage',    labelKey:'settings.nav.storage',    descKey:'settings.nav.storage.desc',    icon:'image'    },
  { id:'delivery',   labelKey:'settings.nav.delivery',   descKey:'settings.nav.delivery.desc',   icon:'send'     },
  { id:'variables',  labelKey:'settings.nav.variables',  descKey:'settings.nav.variables.desc',  icon:'braces'   },
  { id:'export',     labelKey:'settings.nav.export',     descKey:'settings.nav.export.desc',     icon:'download' },
  { id:'ai',         labelKey:'settings.nav.ai',         descKey:'settings.nav.ai.desc',         icon:'sparkles' },
  { id:'notif',      labelKey:'settings.nav.notif',      descKey:'settings.nav.notif.desc',      icon:'bell'     },
];

function SettingsPanel({ onClose, initialSection='account' }) {
  window.stI18n.useLang();
  const t = window.stI18n.t;
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
      window.toast && window.toast({ kind:'ok', title:t('settings.toast.saved.title'), msg:t('settings.toast.saved.msg') });
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
              <div style={{fontSize:12.5,fontWeight:500}}>{t('settings.title')}</div>
              <div style={{fontSize:10.5,color:'var(--fg-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {t('settings.workspaceLabel', { name: currentWorkspace?.name || '…' })}
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
                  <span>{t(s.labelKey)}</span>
                </button>
              );
            })}
          </div>

          <div style={{marginTop:'auto',padding:'12px 10px 4px',fontSize:10.5,color:'var(--fg-3)',lineHeight:1.55}}>
            {t('settings.version', { v: __APP_VERSION__ })} · <span style={{color:'var(--accent)',cursor:'pointer'}} onClick={()=>window.shell?.openExternal?.('https://github.com/jcocano/simple-templete/blob/main/CHANGELOG.md')}>{t('settings.changelog')}</span>
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
                {(() => { const s = SETTINGS_SECTIONS.find(s=>s.id===section); return s ? t(s.labelKey) : ''; })()}
              </h3>
              <div style={{fontSize:12,color:'var(--fg-3)',marginTop:3}}>
                {(() => { const s = SETTINGS_SECTIONS.find(s=>s.id===section); return s ? t(s.descKey) : ''; })()}
              </div>
            </div>
            <div style={{
              fontSize:11.5,color:'var(--ok)',
              display:'flex',alignItems:'center',gap:5,
              opacity:saved?1:0,
              transition:'opacity 200ms',
            }}>
              <I.check size={12}/> {t('settings.savedFlash')}
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
  window.stI18n.useLang();
  const t = window.stI18n.t;
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
        <b style={{color:'var(--fg-1)'}}>{t('settings.soonBanner.title')}</b> {msg || t('settings.soonBanner.default')}
      </div>
    </div>
  );
}

// ───────────────────────────── Workspace ─────────────────────────────
function WorkspaceSection({ onChange }) {
  window.stI18n.useLang();
  const t = window.stI18n.t;
  const workspaces = useWorkspaces();
  const current = useCurrentWorkspace();
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [renaming, setRenaming] = React.useState(null); // {id, name}
  const [counts, setCounts] = React.useState({});
  const [confirmDelete, setConfirmDelete] = React.useState(null); // {id, name, count}
  const [deleteWord, setDeleteWord] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const DELETE_WORD = t('settings.workspace.deleteWord');

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
    if (!confirmDelete || deleteWord !== DELETE_WORD) return;
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
      <SGroup title={`${t('settings.workspace.myList')} · ${workspaces.length}`}>
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
                      {isCurrent && <span className="chip" style={{fontSize:10,background:'var(--accent-soft)',color:'var(--accent)',flexShrink:0}}>{t('settings.workspace.active')}</span>}
                    </div>
                  )}
                  <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2}}>
                    {count == null ? '…' : (count===1 ? t('settings.workspace.count.one', { n: count }) : t('settings.workspace.count.other', { n: count }))}
                  </div>
                </div>
                <div style={{display:'flex',gap:4,flexShrink:0}}>
                  {!isCurrent && !isRenaming && (
                    <button className="btn sm ghost" onClick={()=>window.stWorkspaces.switch(w.id)}>{t('settings.workspace.btn.switch')}</button>
                  )}
                  {!isRenaming && (
                    <button className="btn icon sm ghost" title={t('settings.workspace.btn.rename')}
                      onClick={()=>setRenaming({id:w.id, name:w.name})}>
                      <I.edit size={12}/>
                    </button>
                  )}
                  <button
                    className="btn icon sm ghost"
                    title={isLast ? t('settings.workspace.deleteLast.tip') : t('settings.workspace.btn.delete')}
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

      <SGroup title={t('settings.workspace.create.title')}>
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
              placeholder={t('settings.workspace.create.placeholder')}
              style={{flex:1}}
            />
            <button className="btn primary sm" onClick={submitCreate} disabled={!newName.trim()}>{t('common.create')}</button>
            <button className="btn ghost sm" onClick={()=>{ setCreating(false); setNewName(''); }}>{t('common.cancel')}</button>
          </div>
        ) : (
          <button className="btn" onClick={()=>setCreating(true)}><I.plus size={13}/> {t('settings.workspace.btn.createNew')}</button>
        )}
      </SGroup>

      <SGroup title={t('settings.workspace.howItWorks.title')}>
        <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.6,padding:12,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-md)'}}>
          {t('settings.workspace.howItWorks.body')}
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
                <h3>{t('settings.workspace.delete.title', { name: confirmDelete.name })}</h3>
                <div className="sub">
                  {confirmDelete.count > 0
                    ? (confirmDelete.count === 1
                        ? t('settings.workspace.delete.sub.withTemplates.one', { n: confirmDelete.count })
                        : t('settings.workspace.delete.sub.withTemplates.other', { n: confirmDelete.count }))
                    : t('settings.workspace.delete.sub.empty')}
                </div>
              </div>
            </div>
            <div className="modal-body">
              <div style={{fontSize:12.5,color:'var(--fg-2)',marginBottom:10}}>
                {t('settings.workspace.delete.prompt')} <b style={{fontFamily:'var(--font-mono)'}}>{DELETE_WORD}</b>{t('settings.workspace.delete.promptSuffix')}
              </div>
              <input
                autoFocus
                className="field"
                value={deleteWord}
                onChange={e=>setDeleteWord(e.target.value)}
                onKeyDown={e=>{ if (e.key === 'Enter' && deleteWord === DELETE_WORD) runDelete(); }}
                placeholder={DELETE_WORD}
                style={{fontFamily:'var(--font-mono)',letterSpacing:'0.08em'}}
              />
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={()=>setConfirmDelete(null)} disabled={busy}>{t('common.cancel')}</button>
              <button
                className="btn primary"
                onClick={runDelete}
                disabled={busy || deleteWord !== DELETE_WORD}
                style={{
                  background: deleteWord===DELETE_WORD ? '#e04f4f' : undefined,
                  borderColor: deleteWord===DELETE_WORD ? '#e04f4f' : undefined,
                }}>
                {busy ? t('settings.workspace.delete.busy') : t('settings.workspace.delete.confirm')}
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
  const lang = window.stI18n.useLang();
  const t = window.stI18n.t;
  const [tw, setTw] = React.useState(() => ({...window.TWEAKS, ...window.stStorage.getSetting('tweaks', {})}));
  const set = (k, v) => {
    const next = {...tw, [k]: v};
    setTw(next);
    window.stStorage.setSetting('tweaks', next);
    if (window.__mcSetTweaks) window.__mcSetTweaks(next);
    onChange();
  };

  const themes = React.useMemo(() => [
    { id:'indigo', name:t('settings.appearance.theme.indigo.name'), color:'#5b5bf0', desc:t('settings.appearance.theme.indigo.desc') },
    { id:'ocean',  name:t('settings.appearance.theme.ocean.name'),  color:'#2b6cb0', desc:t('settings.appearance.theme.ocean.desc') },
    { id:'violet', name:t('settings.appearance.theme.violet.name'), color:'#7c3aed', desc:t('settings.appearance.theme.violet.desc') },
  ], [lang]);
  const fonts = React.useMemo(() => [
    { id:'inter-tight',      name:'Inter Tight',      sample:t('settings.appearance.font.sample'), hint:t('settings.appearance.font.interTight.hint') },
    { id:'inter',            name:'Inter',            sample:t('settings.appearance.font.sample'), hint:t('settings.appearance.font.inter.hint') },
    { id:'instrument-serif', name:'Instrument Serif', sample:t('settings.appearance.font.sample'), hint:t('settings.appearance.font.instrumentSerif.hint') },
  ], [lang]);

  return (
    <>
      <SGroup title={t('settings.appearance.group.theme')}>
        <SRow label={t('settings.appearance.mode.label')} hint={t('settings.appearance.mode.hint')}>
          <div className="seg" style={{width:'fit-content'}}>
            <button
              className={tw.mode==='light'?'on':''}
              onClick={()=>set('mode','light')}
              style={{padding:'0 14px',height:30}}>
              <I.sun size={12} style={{marginRight:6}}/> {t('settings.appearance.mode.light')}
            </button>
            <button
              className={tw.mode==='dark'?'on':''}
              onClick={()=>set('mode','dark')}
              style={{padding:'0 14px',height:30}}>
              <I.moon size={12} style={{marginRight:6}}/> {t('settings.appearance.mode.dark')}
            </button>
          </div>
        </SRow>

        <SRow label={t('settings.appearance.palette.label')} hint={t('settings.appearance.palette.hint')}>
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

      <SGroup title={t('settings.appearance.group.interface')}>
        <SRow label={t('settings.appearance.density.label')} hint={t('settings.appearance.density.hint')}>
          <div className="seg" style={{width:'fit-content'}}>
            <button
              className={tw.density==='comfortable'?'on':''}
              onClick={()=>set('density','comfortable')}
              style={{padding:'0 14px',height:30}}>{t('settings.appearance.density.comfy')}</button>
            <button
              className={tw.density==='compact'?'on':''}
              onClick={()=>set('density','compact')}
              style={{padding:'0 14px',height:30}}>{t('settings.appearance.density.compact')}</button>
          </div>
        </SRow>

        <SRow label={t('settings.appearance.corners.label')} hint={t('settings.appearance.corners.hint')}>
          <div className="seg" style={{width:'fit-content'}}>
            <button
              className={tw.radius==='sharp'?'on':''}
              onClick={()=>set('radius','sharp')}
              style={{padding:'0 14px',height:30}}>{t('settings.appearance.corners.sharp')}</button>
            <button
              className={tw.radius==='soft'?'on':''}
              onClick={()=>set('radius','soft')}
              style={{padding:'0 14px',height:30}}>{t('settings.appearance.corners.soft')}</button>
            <button
              className={tw.radius==='round'?'on':''}
              onClick={()=>set('radius','round')}
              style={{padding:'0 14px',height:30}}>{t('settings.appearance.corners.round')}</button>
          </div>
        </SRow>

        <SRow label={t('settings.appearance.appFont.label')} hint={t('settings.appearance.appFont.hint')}>
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

      <SGroup title={t('settings.appearance.group.preview')}>
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
            <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600}}>{t('settings.appearance.preview.title')}</div>
            <div className="chip accent" style={{marginLeft:'auto'}}>{t('settings.appearance.preview.live')}</div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <button className="btn primary sm"><I.send size={12}/> {t('settings.appearance.preview.btn.primary')}</button>
            <button className="btn sm">{t('settings.appearance.preview.btn.secondary')}</button>
            <button className="btn ghost sm">{t('settings.appearance.preview.btn.ghost')}</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{padding:10,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)'}}>
              <div style={{fontSize:11.5,color:'var(--fg-3)'}}>{t('settings.appearance.preview.sampleField')}</div>
              <div style={{fontSize:13,marginTop:3,fontWeight:500}}>{t('settings.appearance.preview.sampleValue')}</div>
            </div>
            <div style={{padding:10,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)'}}>
              <div style={{fontSize:11.5,color:'var(--fg-3)'}}>{t('settings.appearance.preview.accentTone')}</div>
              <div style={{fontSize:13,marginTop:3,color:'var(--accent)',fontWeight:500}}>{t('settings.appearance.preview.activeLink')}</div>
            </div>
          </div>
        </div>
      </SGroup>

      <SGroup title={t('settings.appearance.group.followSystem')}>
        <SRow label={t('settings.appearance.followSystem.label')} hint={t('settings.appearance.followSystem.hint')}>
          <label className="switch"><input type="checkbox" defaultChecked={false} onChange={onChange}/></label>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.appearance.group.tour')}>
        <SRow label={t('settings.appearance.tour.label')} hint={t('settings.appearance.tour.hint')}>
          <button className="btn" onClick={()=>{
            window.stStorage.removeSetting('tour-seen');
            window.dispatchEvent(new CustomEvent('st:start-tour'));
            onChange();
          }}><I.sparkles size={12}/> {t('settings.appearance.tour.btn')}</button>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Account (perfil local) ─────────────────────────────
function AccountSection({ onChange }) {
  const lang = window.stI18n.useLang();
  const t = window.stI18n.t;
  const [acc, setAcc] = React.useState(() => window.stStorage.getSetting('account', {}));
  const set = (k,v) => { const next = {...acc, [k]:v}; setAcc(next); window.stStorage.setSetting('account', next); onChange(); };

  const stats = React.useMemo(() => [
    { k:t('settings.account.stats.templates'),    v:'24',      icon:'mail' },
    { k:t('settings.account.stats.blocks'),       v:'11',      icon:'grid' },
    { k:t('settings.account.stats.diskSpace'),    v:'18.4 MB', icon:'folder' },
  ], [lang]);

  return (
    <>
      <SGroup title={t('settings.account.group.profile')}>
        <SRow label={t('settings.account.name.label')} hint={t('settings.account.name.hint')}>
          <input className="field"
            value={acc.name||''}
            placeholder={t('settings.account.name.placeholder')}
            onChange={e=>set('name',e.target.value)}/>
        </SRow>
        <SRow label={t('settings.account.email.label')} hint={t('settings.account.email.hint')}>
          <input className="field" type="email"
            value={acc.email||''}
            placeholder={t('settings.account.email.placeholder')}
            onChange={e=>set('email',e.target.value)}/>
        </SRow>
        <SRow label={t('settings.account.avatar.label')} hint={t('settings.account.avatar.hint')}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{
              width:56,height:56,borderRadius:'50%',
              background:'linear-gradient(135deg,#5b5bf0,#8b5cf6)',
              color:'#fff',display:'grid',placeItems:'center',
              fontFamily:'var(--font-display)',fontWeight:700,fontSize:22,
            }}>{((acc.name||'').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()) || '?'}</div>
            <div className="col" style={{gap:4}}>
              <button className="btn sm"><I.upload size={12}/> {t('settings.account.avatar.upload')}</button>
              <button className="btn sm ghost" style={{color:'var(--fg-3)'}}>{t('settings.account.avatar.remove')}</button>
            </div>
          </div>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.account.group.about')}>
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
              {t('settings.account.about.title')}
            </div>
            <p style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.55,margin:0}}>
              {t('settings.account.about.body')}
            </p>
            <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
              <button className="btn sm" onClick={()=>window.shell?.openExternal?.('https://github.com/jcocano/simple-templete')}><I.code size={12}/> {t('settings.account.about.btn.github')}</button>
              <button className="btn sm ghost" onClick={()=>window.shell?.openExternal?.('https://github.com/jcocano/simple-templete/blob/main/LICENSE')}><I.book size={12}/> {t('settings.account.about.btn.license')}</button>
              <button className="btn sm ghost" onClick={()=>window.shell?.openExternal?.('https://buymeacoffee.com/jesuscocana')}><I.heart size={12}/> {t('settings.account.about.btn.coffee')}</button>
            </div>
          </div>
        </div>
      </SGroup>

      <SGroup title={t('settings.account.group.library')}>
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

      <SGroup title={t('settings.account.group.localData')}>
        <SRow label={t('settings.account.export.label')} hint={t('settings.account.export.hint')}>
          <button className="btn sm"><I.download size={12}/> {t('settings.account.export.btn')}</button>
        </SRow>
        <SRow label={t('settings.account.import.label')} hint={t('settings.account.import.hint')}>
          <button className="btn sm"><I.upload size={12}/> {t('settings.account.import.btn')}</button>
        </SRow>
        <SRow label={t('settings.account.wipe.label')} hint={t('settings.account.wipe.hint')} danger>
          <button className="btn danger sm">{t('settings.account.wipe.btn')}</button>
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
  const lang = window.stI18n.useLang();
  const t = window.stI18n.t;
  const [s, setS] = React.useState(() => ({
    mode: 'local',
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
      setTestState(tt => ({
        ...tt,
        [providerId]: result.ok
          ? { state: 'ok', url: result.url }
          : { state: 'err', msg: result.error || t('settings.storage.test.fail') },
      }));
    } catch (err) {
      setTestState(tt => ({ ...tt, [providerId]: { state: 'err', msg: err?.message || t('settings.storage.test.unknownErr') } }));
    }
  };

  const testIndicator = (providerId) => {
    const tt = testState[providerId];
    if (!tt) return null;
    if (tt.state === 'testing') return <span style={{fontSize:11,color:'var(--fg-3)'}}>{t('settings.storage.test.testing')}</span>;
    if (tt.state === 'ok') return <span className="chip ok" style={{fontSize:10.5}}><I.check size={10}/> {t('settings.storage.test.ok')}</span>;
    if (tt.state === 'err') return <span style={{fontSize:11,color:'var(--danger)',lineHeight:1.4,flex:1}}>{tt.msg}</span>;
    return null;
  };

  const providers = React.useMemo(() => [
    { id:'local',      name:t('settings.storage.provider.local.name'),      tag:t('settings.storage.tag.default'),    icon:'folder',   desc:t('settings.storage.provider.local.desc') },
    { id:'base64',     name:t('settings.storage.provider.base64.name'),     tag:t('settings.storage.tag.selfContained'), icon:'code',   desc:t('settings.storage.provider.base64.desc') },
    { id:'s3',         name:t('settings.storage.provider.s3.name'),         tag:t('settings.storage.tag.popular'),     icon:'server',  desc:t('settings.storage.provider.s3.desc') },
    { id:'cloudinary', name:t('settings.storage.provider.cloudinary.name'), tag:t('settings.storage.tag.freeTier'),    icon:'image',   desc:t('settings.storage.provider.cloudinary.desc') },
    { id:'imgbb',      name:'imgbb',                                        tag:t('settings.storage.tag.simplest'),    icon:'upload',  desc:t('settings.storage.provider.imgbb.desc') },
    { id:'github',     name:t('settings.storage.provider.github.name'),     tag:t('settings.storage.tag.free'),        icon:'code',    desc:t('settings.storage.provider.github.desc') },
    { id:'ftp',        name:'FTP / SFTP',                                   tag:t('settings.storage.tag.yourServer'),  icon:'folder',  desc:t('settings.storage.provider.ftp.desc') },
  ], [lang]);

  const isSet = (p) => {
    if (p.id==='local') return true;
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
      <SGroup title={t('settings.storage.group.howItWorks')}>
        <div style={{
          padding:14, borderRadius:'var(--r-md)',
          background:'var(--accent-soft)', border:'1px solid var(--accent)',
          display:'flex', gap:12, alignItems:'flex-start',
        }}>
          <div style={{color:'var(--accent)',marginTop:2}}><I.info size={16}/></div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:12.5,lineHeight:1.55,margin:0,color:'var(--fg-2)'}}>
              {t('settings.storage.howItWorks.body')}
            </p>
          </div>
        </div>
      </SGroup>

      <SGroup title={t('settings.storage.group.activeProvider')}>
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
      {s.mode==='local' && (
        <SGroup title={t('settings.storage.config.local.title')}>
          <div style={{padding:14,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-md)'}}>
            <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.6,marginBottom:10}}>
              {t('settings.storage.config.local.body.prefix')} <code style={{fontFamily:'var(--font-mono)',fontSize:11.5}}>userData/workspaces/&#123;id&#125;/images</code> {t('settings.storage.config.local.body.mid')} (<code style={{fontFamily:'var(--font-mono)',fontSize:11.5}}>st-img://</code>).
            </div>
            <div style={{fontSize:11.5,color:'var(--fg-3)',lineHeight:1.6}}>
              {t('settings.storage.config.local.bullet1')}<br/>
              {t('settings.storage.config.local.bullet2.prefix')} <strong style={{color:'var(--fg-1)'}}>{t('settings.storage.config.local.bullet2.exportWord')}</strong> {t('settings.storage.config.local.bullet2.or')} <strong style={{color:'var(--fg-1)'}}>{t('settings.storage.config.local.bullet2.sendWord')}</strong>{t('settings.storage.config.local.bullet2.suffix')}<br/>
              {t('settings.storage.config.local.bullet3')}
            </div>
          </div>
        </SGroup>
      )}
      {s.mode==='base64' && (
        <SGroup title={t('settings.storage.config.base64.title')}>
          <div style={{padding:14,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-md)'}}>
            <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.6,marginBottom:10}}>
              {t('settings.storage.config.base64.body')}
            </div>
            <div style={{fontSize:11.5,color:'var(--fg-3)',lineHeight:1.6}}>
              <strong style={{color:'var(--fg-1)'}}>{t('settings.storage.config.base64.limits')}</strong><br/>
              {t('settings.storage.config.base64.bullet.gmail')}<br/>
              {t('settings.storage.config.base64.bullet.outlook')}<br/>
              {t('settings.storage.config.base64.bullet.weight')}
            </div>
          </div>
          <SRow label={t('settings.storage.config.base64.maxSize.label')} hint={t('settings.storage.config.base64.maxSize.hint')}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="range" min="50" max="500" defaultValue="150" style={{flex:1}}/>
              <span className="chip" style={{minWidth:60,textAlign:'center'}}>150 KB</span>
            </div>
          </SRow>
        </SGroup>
      )}

      {s.mode==='s3' && (
        <SGroup title={t('settings.storage.config.s3.title')}>
          <div style={{
            padding:10, marginBottom:4,
            background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',
            display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',
          }}>
            <span style={{fontSize:11,color:'var(--fg-3)',marginRight:4}}>{t('settings.storage.s3.presets')}</span>
            {['AWS S3','Cloudflare R2','Backblaze B2','Wasabi','MinIO','DigitalOcean Spaces'].map(p => (
              <button key={p} className="btn sm ghost" style={{fontSize:11,padding:'3px 8px'}}>{p}</button>
            ))}
          </div>
          <SRow label={t('settings.storage.s3.endpoint.label')} hint={t('settings.storage.s3.endpoint.hint')}>
            <input className="field" value={s.s3.endpoint} onChange={e=>setField('s3','endpoint',e.target.value)} placeholder="https://s3.amazonaws.com"/>
          </SRow>
          <SRow label={t('settings.storage.s3.region.label')} hint={t('settings.storage.s3.region.hint')}>
            <input className="field" value={s.s3.region} onChange={e=>setField('s3','region',e.target.value)} placeholder="us-east-1"/>
          </SRow>
          <SRow label={t('settings.storage.s3.bucket.label')} hint={t('settings.storage.s3.bucket.hint')}>
            <input className="field" value={s.s3.bucket} onChange={e=>setField('s3','bucket',e.target.value)} placeholder={t('settings.storage.s3.bucket.placeholder')}/>
          </SRow>
          <SRow label="Access Key ID" hint={t('settings.storage.s3.accessKey.hint')}>
            <input className="field" value={s.s3.key} onChange={e=>setField('s3','key',e.target.value)} placeholder="AKIA…"/>
          </SRow>
          <SRow label="Secret Access Key" hint={t('settings.storage.s3.secret.hint')}>
            <input className="field" type="password" value={s3Secret} onChange={e=>setS3Secret(e.target.value)} placeholder="••••••••••••••••"/>
          </SRow>
          <SRow label={t('settings.storage.s3.publicUrl.label')} hint={t('settings.storage.s3.publicUrl.hint')}>
            <input className="field" value={s.s3.publicUrl} onChange={e=>setField('s3','publicUrl',e.target.value)} placeholder="https://cdn.tudominio.com"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('s3')} disabled={testState.s3?.state === 'testing'}>
              <I.check size={12}/> {t('settings.storage.btn.testConnection')}
            </button>
            {testIndicator('s3')}
          </div>
        </SGroup>
      )}

      {s.mode==='cloudinary' && (
        <SGroup title={t('settings.storage.config.cloudinary.title')}>
          <SRow label={t('settings.storage.cloudinary.cloudName.label')} hint={t('settings.storage.cloudinary.cloudName.hint')}>
            <input className="field" value={s.cloudinary.cloudName} onChange={e=>setField('cloudinary','cloudName',e.target.value)} placeholder={t('settings.storage.cloudinary.cloudName.placeholder')}/>
          </SRow>
          <SRow label={t('settings.storage.cloudinary.uploadPreset.label')} hint={t('settings.storage.cloudinary.uploadPreset.hint')}>
            <input className="field" value={s.cloudinary.uploadPreset} onChange={e=>setField('cloudinary','uploadPreset',e.target.value)} placeholder="simple_template_unsigned"/>
          </SRow>
          <SRow label="API key" hint={t('settings.storage.cloudinary.apiKey.hint')}>
            <input className="field" type="password" value={cloudinaryKey} onChange={e=>setCloudinaryKey(e.target.value)} placeholder="1234567890"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('cloudinary')} disabled={testState.cloudinary?.state === 'testing'}>
              <I.check size={12}/> {t('settings.storage.btn.testConnection')}
            </button>
            {testIndicator('cloudinary')}
          </div>
        </SGroup>
      )}

      {s.mode==='imgbb' && (
        <SGroup title={t('settings.storage.config.imgbb.title')}>
          <SRow label="API key" hint={t('settings.storage.imgbb.apiKey.hint')}>
            <input className="field" type="password" value={imgbbKey} onChange={e=>setImgbbKey(e.target.value)} placeholder="••••••••••••••••"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('imgbb')} disabled={testState.imgbb?.state === 'testing'}>
              <I.check size={12}/> {t('settings.storage.btn.testConnection')}
            </button>
            {testIndicator('imgbb')}
          </div>
        </SGroup>
      )}

      {s.mode==='github' && (
        <SGroup title={t('settings.storage.config.github.title')}>
          <SRow label={t('settings.storage.github.repo.label')} hint={t('settings.storage.github.repo.hint')}>
            <input className="field" value={s.github.repo} onChange={e=>setField('github','repo',e.target.value)} placeholder="mi-usuario/simple-template-assets"/>
          </SRow>
          <SRow label={t('settings.storage.github.branch.label')} hint={t('settings.storage.github.branch.hint')}>
            <input className="field" value={s.github.branch} onChange={e=>setField('github','branch',e.target.value)} placeholder="main"/>
          </SRow>
          <SRow label={t('settings.storage.github.path.label')} hint={t('settings.storage.github.path.hint')}>
            <input className="field" value={s.github.path} onChange={e=>setField('github','path',e.target.value)} placeholder="assets/img/"/>
          </SRow>
          <SRow label={t('settings.storage.github.token.label')} hint={t('settings.storage.github.token.hint')}>
            <input className="field" type="password" value={githubToken} onChange={e=>setGithubToken(e.target.value)} placeholder="ghp_••••••••••••"/>
          </SRow>
          <SRow label={t('settings.storage.github.publicUrl.label')} hint={t('settings.storage.github.publicUrl.hint')}>
            <input className="field" value={s.github.publicUrl||''} onChange={e=>setField('github','publicUrl',e.target.value)} placeholder="https://miusuario.github.io/mi-repo/assets"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('github')} disabled={testState.github?.state === 'testing'}>
              <I.check size={12}/> {t('settings.storage.btn.testConnection')}
            </button>
            {testIndicator('github')}
          </div>
        </SGroup>
      )}

      {s.mode==='ftp' && (
        <SGroup title={t('settings.storage.config.ftp.title')}>
          <SRow label={t('settings.storage.ftp.host.label')} hint={t('settings.storage.ftp.host.hint')}>
            <input className="field" value={s.ftp.host} onChange={e=>setField('ftp','host',e.target.value)} placeholder="ftp.tudominio.com"/>
          </SRow>
          <SRow label={t('settings.storage.ftp.port.label')} hint={t('settings.storage.ftp.port.hint')}>
            <input className="field" value={s.ftp.port} onChange={e=>setField('ftp','port',e.target.value)} placeholder="21"/>
          </SRow>
          <SRow label={t('settings.storage.ftp.tls.label')} hint={t('settings.storage.ftp.tls.hint')}>
            <Switch checked={!!s.ftp.secure} onChange={v=>setField('ftp','secure',v)}/>
          </SRow>
          <SRow label={t('settings.storage.ftp.user.label')} hint={t('settings.storage.ftp.user.hint')}>
            <input className="field" value={s.ftp.user} onChange={e=>setField('ftp','user',e.target.value)} placeholder="mi-usuario"/>
          </SRow>
          <SRow label={t('settings.storage.ftp.password.label')} hint={t('settings.storage.ftp.password.hint')}>
            <input className="field" type="password" value={ftpPassword} onChange={e=>setFtpPassword(e.target.value)} placeholder="••••••••••••"/>
          </SRow>
          <SRow label={t('settings.storage.ftp.path.label')} hint={t('settings.storage.ftp.path.hint')}>
            <input className="field" value={s.ftp.path} onChange={e=>setField('ftp','path',e.target.value)} placeholder="/public_html/img/"/>
          </SRow>
          <SRow label={t('settings.storage.ftp.publicUrl.label')} hint={t('settings.storage.ftp.publicUrl.hint')}>
            <input className="field" value={s.ftp.publicUrl} onChange={e=>setField('ftp','publicUrl',e.target.value)} placeholder="https://tudominio.com/img/"/>
          </SRow>
          <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={() => doTest('ftp')} disabled={testState.ftp?.state === 'testing'}>
              <I.check size={12}/> {t('settings.storage.btn.testConnection')}
            </button>
            {testIndicator('ftp')}
          </div>
        </SGroup>
      )}

      <SGroup title={t('settings.storage.group.behavior')}>
        <SRow label={t('settings.storage.optimize.label')} hint={t('settings.storage.optimize.hint')}>
          <Switch checked={s.optimize !== false} onChange={v => save({...s, optimize: v})}/>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Brand ─────────────────────────────
// Single swatch with native color picker + remove-on-hover. Used by BrandSection.
function ColorSwatch({ value, onChange, onRemove }) {
  window.stI18n.useLang();
  const t = window.stI18n.t;
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
        title={t('settings.brand.color.change')}
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
          title={t('settings.brand.color.remove')}
          aria-label={t('settings.brand.color.remove')}
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
  window.stI18n.useLang();
  const t = window.stI18n.t;
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
      <SGroup title={t('settings.brand.group.identity')}>
        <SRow label={t('settings.brand.palette.label')} hint={t('settings.brand.palette.hint')}>
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
                title={t('settings.brand.color.add')}
                aria-label={t('settings.brand.color.add')}
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

        <SRow label={t('settings.brand.fontDisplay.label')} hint={t('settings.brand.fontDisplay.hint')}>
          <select className="field" value={brand.fontDisplay||'Fraunces'} onChange={e=>set('fontDisplay',e.target.value)}>
            {fonts.map(f => <option key={f} style={{fontFamily:f}}>{f}</option>)}
          </select>
        </SRow>

        <SRow label={t('settings.brand.fontBody.label')} hint={t('settings.brand.fontBody.hint')}>
          <select className="field" value={brand.fontBody||'Inter'} onChange={e=>set('fontBody',e.target.value)}>
            {fonts.map(f => <option key={f} style={{fontFamily:f}}>{f}</option>)}
          </select>
        </SRow>

        <SRow label={t('settings.brand.logo.label')} hint={t('settings.brand.logo.hint')}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{
              width:120,height:56,borderRadius:'var(--r-sm)',
              background:'var(--surface-2)',border:'1px solid var(--line)',
              display:'grid',placeItems:'center',
              fontFamily:'var(--font-display)',fontWeight:600,fontSize:18,
              color:'var(--fg)',
            }}>acme</div>
            <div className="col" style={{gap:4}}>
              <button className="btn sm"><I.upload size={12}/> {t('settings.brand.logo.upload')}</button>
              <span style={{fontSize:10.5,color:'var(--fg-3)'}}>{t('settings.brand.logo.recommended')}</span>
            </div>
          </div>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.brand.group.legalFooter')}>
        <SRow label={t('settings.brand.address.label')} hint={t('settings.brand.address.hint')}>
          <textarea className="field" rows="2"
            placeholder={t('settings.brand.address.placeholder')}
            value={brand.address || ''}
            onChange={e=>set('address', e.target.value)}/>
        </SRow>
        <SRow label={t('settings.brand.unsubscribe.label')} hint={t('settings.brand.unsubscribe.hint')}>
          <input className="field"
            placeholder="https://acme.com/unsubscribe"
            value={brand.unsubscribe || ''}
            onChange={e=>set('unsubscribe', e.target.value)}/>
        </SRow>
        <SRow label={t('settings.brand.footerText.label')} hint={t('settings.brand.footerText.hint')}>
          <textarea className="field" rows="3"
            placeholder={t('settings.brand.footerText.placeholder')}
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
  const lang = window.stI18n.useLang();
  const t = window.stI18n.t;
  const [ed, setEd] = React.useState(() => window.stStorage.getWSSetting('editor', {}));
  // Re-read when the language changes elsewhere (e.g. cmd-palette), so the
  // select reflects the current value.
  React.useEffect(() => { setEd(window.stStorage.getWSSetting('editor', {})); }, [lang]);
  const set = (k,v) => {
    const n = {...ed, [k]:v};
    setEd(n);
    window.stStorage.setWSSetting('editor', n);
    if (k === 'lang') window.stI18n.setLang(v);
    onChange();
  };

  const [tweaks, setTweaks] = React.useState(() => window.__mcTweaks || window.TWEAKS);
  React.useEffect(() => {
    const h = () => setTweaks({...window.__mcTweaks});
    window.addEventListener('st:tweaks-change', h);
    return () => window.removeEventListener('st:tweaks-change', h);
  }, []);
  const setTweak = (k, v) => {
    window.__mcSetTweaks?.(tw => ({...tw, [k]: v}));
    onChange();
  };

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
      <SoonBanner msg={t('settings.editor.soon')}/>
      <SGroup title={t('settings.editor.group.appearance')}>
        <SRow label={t('settings.editor.theme.label')} hint={t('settings.editor.theme.hint')}>
          <Seg value={tweaks.mode||'light'} onPick={v=>setTweak('mode',v)} options={[
            {id:'light',label:t('settings.editor.theme.light'),icon:'sun'},
            {id:'dark',label:t('settings.editor.theme.dark'),icon:'moon'},
            {id:'system',label:t('settings.editor.theme.system')},
          ]}/>
        </SRow>
        <SRow label={t('settings.editor.lang')} hint={t('settings.editor.lang.hint')}>
          <select className="field" value={ed.lang||lang} onChange={e=>set('lang',e.target.value)} style={{width:200}}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
            <option value="ja">日本語</option>
            <option value="zh">中文 (简体)</option>
          </select>
        </SRow>
        <SRow label={t('settings.editor.density.label')} hint={t('settings.editor.density.hint')}>
          <Seg value={tweaks.density||'comfortable'} onPick={v=>setTweak('density',v)} options={[
            {id:'compact',label:t('settings.editor.density.compact')},
            {id:'comfortable',label:t('settings.editor.density.comfortable')},
            {id:'spacious',label:t('settings.editor.density.spacious')},
          ]}/>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.editor.group.canvas')}>
        <SRow label={t('settings.editor.grid.label')} hint={t('settings.editor.grid.hint')}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <input type="range" min="8" max="32" step="4" value={ed.grid||16} onChange={e=>set('grid',Number(e.target.value))} style={{flex:1,maxWidth:200}}/>
            <span style={{fontSize:12,fontFamily:'var(--font-mono)',color:'var(--fg-2)',width:40}}>{ed.grid||16} px</span>
          </div>
        </SRow>
        <SRow label={t('settings.editor.ruler.label')} hint={t('settings.editor.ruler.hint')}>
          <label className="switch"><input type="checkbox" defaultChecked={ed.ruler!==false} onChange={e=>set('ruler',e.target.checked)}/><span/></label>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.editor.group.save')}>
        <SRow label={t('settings.editor.autosave.label')} hint={t('settings.editor.autosave.hint')}>
          <label className="switch"><input type="checkbox" defaultChecked={ed.autosave!==false} onChange={e=>set('autosave',e.target.checked)}/><span/></label>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.editor.group.shortcuts')}>
        <div style={{border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
          {[
            [t('settings.editor.shortcut.save'),       ['⌘','S']],
            [t('settings.editor.shortcut.undo'),       ['⌘','Z']],
            [t('settings.editor.shortcut.redo'),       ['⌘','⇧','Z']],
            [t('settings.editor.shortcut.duplicate'),  ['⌘','D']],
            [t('settings.editor.shortcut.delete'),     ['⌫']],
            [t('settings.editor.shortcut.preview'),    ['⌘','P']],
            [t('settings.editor.shortcut.sendTest'),   ['⌘','⇧','T']],
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
// Source data in src/data.tsx stores `type` as a Spanish slug (e.g. 'número',
// 'enlace'). i18n keys can only contain ASCII, so map the non-ASCII ones.
const VAR_TYPE_KEY = { 'número': 'numero' };

function VariablesSection({ onChange }) {
  window.stI18n.useLang();
  const t = window.stI18n.t;
  const [vars, setVars] = React.useState(() => window.stStorage.getWSSetting('vars', null) || VARIABLES);
  const save = (next) => { setVars(next); window.stStorage.setWSSetting('vars', next); onChange(); };
  const setVal = (i,v) => save(vars.map((x,j)=>j===i?{...x,sample:v}:x));
  const [creating, setCreating] = React.useState(false);
  const [draft, setDraft] = React.useState({ key:'', label:'', sample:'' });
  const addVar = () => {
    const key = draft.key.trim().replace(/^@/,'').replace(/\s+/g,'_');
    if (!key) return;
    if (vars.some(v => v.key === key)) {
      window.toast && window.toast({ kind:'err', title: t('modals.vars.alreadyExists', { key }) });
      return;
    }
    save([...vars, { key, label: draft.label.trim() || key, sample: draft.sample.trim() || '', type:'texto' }]);
    setCreating(false);
    setDraft({ key:'', label:'', sample:'' });
  };
  const removeVar = (i) => save(vars.filter((_, vi) => vi !== i));

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
          <b style={{color:'var(--fg-1)'}}>{t('settings.variables.banner.title')}</b> {t('settings.variables.banner.body')}
        </div>
      </div>
      <SGroup title={t('settings.variables.group.title')}>
        <div style={{fontSize:12.5,color:'var(--fg-2)',lineHeight:1.55,paddingBottom:16}}>
          {t('settings.variables.description')}
        </div>
        {/* Inline form copiado del flujo de VariablesModal (src/modals.tsx) */}
        {creating && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 28px',gap:6,padding:10,marginBottom:10,background:'var(--accent-soft)',borderRadius:'var(--r-md)',alignItems:'center'}}>
            <input className="field" value={draft.key} onChange={e=>setDraft(d=>({...d,key:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')addVar();if(e.key==='Escape')setCreating(false);}} placeholder={t('modals.vars.placeholder.key')} autoFocus style={{fontSize:12,padding:'4px 6px'}}/>
            <input className="field" value={draft.label} onChange={e=>setDraft(d=>({...d,label:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')addVar();if(e.key==='Escape')setCreating(false);}} placeholder={t('modals.vars.placeholder.label')} style={{fontSize:12,padding:'4px 6px'}}/>
            <input className="field" value={draft.sample} onChange={e=>setDraft(d=>({...d,sample:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')addVar();if(e.key==='Escape')setCreating(false);}} placeholder={t('modals.vars.placeholder.sample')} style={{fontSize:12,padding:'4px 6px'}}/>
            <button className="btn icon sm" onClick={addVar} disabled={!draft.key.trim()} title={t('modals.vars.btn.create.tooltip')}><I.check size={11}/></button>
          </div>
        )}
        <div style={{border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
          {vars.map((v,i) => (
            <div key={v.key} style={{
              display:'grid',gridTemplateColumns:'180px 1fr 80px 30px',gap:12,
              padding:'10px 14px',alignItems:'center',
              borderBottom:i<vars.length-1?'1px solid var(--line)':'none',
            }}>
              <code style={{fontFamily:'var(--font-mono)',fontSize:11.5,color:'var(--accent)'}}>{`{{${v.key}}}`}</code>
              <input className="field" value={v.sample} onChange={e=>setVal(i,e.target.value)} style={{height:30,fontSize:12.5}}/>
              <span style={{fontSize:11,color:'var(--fg-3)'}}>{t(`settings.variables.type.${VAR_TYPE_KEY[v.type] || v.type}`)}</span>
              <button className="btn icon sm ghost" title={t('modals.vars.delete.tooltip')} style={{color:'var(--err,#e04f4f)'}}
                onClick={()=>{ if (window.confirm(t('modals.vars.delete.confirm', { key: v.key }))) removeVar(i); }}>
                <I.trash size={11}/>
              </button>
            </div>
          ))}
        </div>
        <button className="btn sm" style={{marginTop:12}} onClick={()=>setCreating(true)}><I.plus size={12}/> {t('settings.variables.btn.new')}</button>
      </SGroup>
    </>
  );
}

// ───────────────────────────── Export ─────────────────────────────
function ExportSection({ onChange }) {
  const lang = window.stI18n.useLang();
  const t = window.stI18n.t;
  const [ex, setEx] = React.useState(() => window.stStorage.getWSSetting('export', {}));
  const set = (k,v) => { const n = {...ex, [k]:v}; setEx(n); window.stStorage.setWSSetting('export', n); onChange(); };

  return (
    <>
      <SoonBanner msg={t('settings.export.soonMsg')}/>
      <SGroup title={t('settings.export.group.defaultFormat')}>
        <SRow label={t('settings.export.format.label')} hint={t('settings.export.format.hint')}>
          <div className="col" style={{gap:6}}>
            {[
              {id:'html',  label:t('settings.export.format.html.label'),  d:t('settings.export.format.html.desc')},
              {id:'mjml',  label:t('settings.export.format.mjml.label'),  d:t('settings.export.format.mjml.desc')},
              {id:'zip',   label:t('settings.export.format.zip.label'),   d:t('settings.export.format.zip.desc')},
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

      <SGroup title={t('settings.export.group.defaultOptions')}>
        <SRow label={t('settings.export.minify.label')} hint={t('settings.export.minify.hint')}>
          <label className="switch"><input type="checkbox" defaultChecked={ex.minify!==false} onChange={e=>set('minify',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label={t('settings.export.plaintext.label')} hint={t('settings.export.plaintext.hint')}>
          <label className="switch"><input type="checkbox" defaultChecked={ex.plaintext!==false} onChange={e=>set('plaintext',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label={t('settings.export.optimize.label')} hint={t('settings.export.optimize.hint')}>
          <label className="switch"><input type="checkbox" defaultChecked={ex.optimize!==false} onChange={e=>set('optimize',e.target.checked)}/><span/></label>
        </SRow>
        <SRow label={t('settings.export.imgDomain.label')} hint={t('settings.export.imgDomain.hint')}>
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
  window.stI18n.useLang();
  const t = window.stI18n.t;
  const [n, setN] = React.useState(() => window.stStorage.getWSSetting('notif', {}));
  const set = (k,v) => { const nn = {...n, [k]:v}; setN(nn); window.stStorage.setWSSetting('notif', nn); onChange(); };

  const Switch = ({k, def=true}) => (
    <label className="switch"><input type="checkbox" defaultChecked={n[k]!==false && (n[k]===undefined?def:n[k])} onChange={e=>set(k,e.target.checked)}/><span/></label>
  );

  return (
    <>
      <SoonBanner msg={t('settings.notif.soonMsg')}/>
      <SGroup title={t('settings.notif.group.inApp')}>
        <SRow label={t('settings.notif.saved.label')} hint={t('settings.notif.saved.hint')}>
          <Switch k="saved" def={false}/>
        </SRow>
        <SRow label={t('settings.notif.heavyImg.label')} hint={t('settings.notif.heavyImg.hint')}>
          <Switch k="heavyImg"/>
        </SRow>
        <SRow label={t('settings.notif.exportDone.label')} hint={t('settings.notif.exportDone.hint')}>
          <Switch k="exportDone"/>
        </SRow>
        <SRow label={t('settings.notif.testDone.label')} hint={t('settings.notif.testDone.hint')}>
          <Switch k="testDone"/>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.notif.group.sound')}>
        <SRow label={t('settings.notif.sound.label')} hint={t('settings.notif.sound.hint')}>
          <Switch k="sound" def={false}/>
        </SRow>
        <SRow label={t('settings.notif.volume.label')} hint={t('settings.notif.volume.hint')}>
          <input type="range" min="0" max="100" defaultValue={n.vol||60} onChange={e=>set('vol',Number(e.target.value))} style={{width:200}}/>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.notif.group.updates')}>
        <SRow label={t('settings.notif.updates.label')} hint={t('settings.notif.updates.hint')}>
          <Switch k="updates"/>
        </SRow>
        <SRow label={t('settings.notif.beta.label')} hint={t('settings.notif.beta.hint')}>
          <Switch k="beta" def={false}/>
        </SRow>
      </SGroup>
    </>
  );
}

// ───────────────────────────── IA ─────────────────────────────
function AISection({ onChange }) {
  const lang = window.stI18n.useLang();
  const t = window.stI18n.t;
  const [ai, setAi] = React.useState(() => window.stStorage.getSetting('ai', {}));
  const set = (k,v) => { const next = {...ai, [k]:v}; setAi(next); window.stStorage.setSetting('ai', next); onChange(); };

  // Model lists intentionally not hardcoded — they rot. Models are fetched
  // live from each provider's /models endpoint (or Ollama's /api/tags) via
  // stAI.listModels, with a free-text input so the user can always type a
  // newly-released model name we don't know about yet.
  const PROVIDERS = React.useMemo(() => [
    { id:'anthropic', name:'Anthropic Claude', hint:t('settings.ai.provider.anthropic.hint'), url:'https://console.anthropic.com' },
    { id:'openai',    name:'OpenAI',           hint:t('settings.ai.provider.openai.hint'),    url:'https://platform.openai.com' },
    { id:'google',    name:'Google Gemini',    hint:t('settings.ai.provider.google.hint'),    url:'https://aistudio.google.com' },
    { id:'ollama',    name:'Ollama (local)',   hint:t('settings.ai.provider.ollama.hint'),    url:'http://localhost:11434' },
  ], [lang]);
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
          setModelsError(t('settings.ai.model.ollama.empty'));
        }
      } else {
        setModels([]);
        setModelsError(result.error);
      }
    } catch (err) {
      setModels([]);
      setModelsError(err?.message || t('settings.ai.model.error.unexpected'));
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
          <div style={{fontSize:13,fontWeight:500}}>{t('settings.ai.hero.title')}</div>
          <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:2,lineHeight:1.5}}>
            {enabled && keyOk
              ? t(ai.model ? 'settings.ai.hero.activeWithModel' : 'settings.ai.hero.active', { provider: provider.name, model: ai.model || '' })
              : enabled && !keyOk
              ? t('settings.ai.hero.nokey', { provider: provider.name })
              : t('settings.ai.hero.disabled')}
          </div>
        </div>
        <Switch checked={enabled} onChange={v=>set('enabled',v)}/>
      </div>

      <SGroup title={t('settings.ai.provider.group.title')}>
        <SRow label={t('settings.ai.provider.label')} hint={t('settings.ai.provider.hint')}>
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

      <SGroup title={t('settings.ai.credentials.group.title')}>
        {provider.id !== 'ollama' && (
          <SRow label={t('settings.ai.apikey.label')} hint={<>{t('settings.ai.apikey.hint')} <a href={provider.url} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>{t('settings.ai.apikey.getLink', { provider: provider.name })}</a></>}>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input
                className="field"
                type="password"
                value={apiKey}
                onChange={e=>setApiKeyValue(e.target.value)}
                disabled={!apiKeyLoaded}
                placeholder={provider.id==='anthropic'?'sk-ant-…':provider.id==='openai'?'sk-…':'AIza…'}
                style={{flex:1,fontFamily:'var(--font-mono)',fontSize:12}}/>
              {keyOk && <span className="chip ok" style={{fontSize:10.5}}><I.check size={10}/> {t('settings.ai.apikey.valid')}</span>}
            </div>
          </SRow>
        )}
        {provider.id === 'ollama' && (
          <SRow label={t('settings.ai.ollama.url.label')} hint={t('settings.ai.ollama.url.hint')}>
            <input className="field" value={ai.ollamaUrl||'http://localhost:11434'} onChange={e=>set('ollamaUrl',e.target.value)} style={{fontFamily:'var(--font-mono)',fontSize:12}}/>
          </SRow>
        )}
        <SRow label={t('settings.ai.cap.label')} hint={t('settings.ai.cap.hint')}>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{color:'var(--fg-3)',fontSize:12}}>{t('settings.ai.cap.currency')}</span>
            <input className="field" type="number" min="0" step="5" value={ai.cap??20} onChange={e=>set('cap', Number(e.target.value))} style={{width:100}}/>
            <span style={{color:'var(--fg-3)',fontSize:11.5,marginLeft:8}}>{t('settings.ai.cap.thisMonth')} <b style={{color:'var(--fg)'}}>$3.48</b></span>
          </div>
        </SRow>
      </SGroup>

      {/* Model picker hidden until credentials are in place. For password
          providers we gate on keyOk (len > 15); Ollama has no key so always
          shows once the group renders. Avoids showing an empty/failing
          picker before the user has set up access. */}
      {(keyOk || provider.id === 'ollama') && (
        <SGroup title={t('settings.ai.model.group.title')}>
          <SRow label={t('settings.ai.model.label')} hint={t('settings.ai.model.hint', { provider: provider.name })}>
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
                  title={t('settings.ai.model.refresh.title')}>
                  {modelsLoading ? t('settings.ai.model.loading') : t('settings.ai.model.refresh')}
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
                  {modelsError} {t('settings.ai.model.error.suffix')}
                </div>
              )}
              {!modelsError && !modelsLoading && models.length > 0 && (
                <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}}>
                  {models.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => set('model', m.id)}
                      title={m.createdAt ? t('settings.ai.model.available.title', { date: String(m.createdAt).slice(0,10) }) : m.id}
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

      <SGroup title={t('settings.ai.features.group.title')}>
        <SRow label={t('settings.ai.features.genTpl.label')} hint={t('settings.ai.features.genTpl.hint')}>
          <Switch checked={ai.genTpl!==false} onChange={v=>set('genTpl',v)}/>
        </SRow>
        <SRow label={t('settings.ai.features.improve.label')} hint={t('settings.ai.features.improve.hint')}>
          <Switch checked={ai.improve!==false} onChange={v=>set('improve',v)}/>
        </SRow>
        <SRow label={t('settings.ai.features.subject.label')} hint={t('settings.ai.features.subject.hint')}>
          <Switch checked={ai.subject!==false} onChange={v=>set('subject',v)}/>
        </SRow>
        <SRow label={t('settings.ai.features.review.label')} hint={t('settings.ai.features.review.hint')}>
          <Switch checked={!!ai.review} onChange={v=>set('review',v)}/>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.ai.tone.group.title')}>
        <SRow label={t('settings.ai.tone.label')} hint={t('settings.ai.tone.hint')}>
          <select className="field" value={ai.tone||'neutral'} onChange={e=>set('tone',e.target.value)}>
            <option value="neutral">{t('settings.ai.tone.opt.neutral')}</option>
            <option value="calido">{t('settings.ai.tone.opt.calido')}</option>
            <option value="profesional">{t('settings.ai.tone.opt.profesional')}</option>
            <option value="divertido">{t('settings.ai.tone.opt.divertido')}</option>
            <option value="directo">{t('settings.ai.tone.opt.directo')}</option>
            <option value="narrativo">{t('settings.ai.tone.opt.narrativo')}</option>
          </select>
        </SRow>
        <SRow label={t('settings.ai.lang.label')} hint={t('settings.ai.lang.hint')}>
          <select className="field" value={ai.lang||'es-MX'} onChange={e=>set('lang',e.target.value)}>
            <option value="es-MX">{t('settings.ai.lang.opt.es-MX')}</option>
            <option value="es-ES">{t('settings.ai.lang.opt.es-ES')}</option>
            <option value="es-AR">{t('settings.ai.lang.opt.es-AR')}</option>
            <option value="en-US">{t('settings.ai.lang.opt.en-US')}</option>
            <option value="pt-BR">{t('settings.ai.lang.opt.pt-BR')}</option>
          </select>
        </SRow>
        <SRow label={t('settings.ai.brand.label')} hint={t('settings.ai.brand.hint')}>
          <textarea className="field" rows={4} value={ai.brandRules||''} onChange={e=>set('brandRules',e.target.value)} placeholder={t('settings.ai.brand.placeholder')}/>
        </SRow>
      </SGroup>

      <SGroup title={t('settings.ai.privacy.group.title')}>
        <SRow label={t('settings.ai.pii.label')} hint={t('settings.ai.pii.hint')}>
          <Switch checked={ai.pii!==false} onChange={v=>set('pii',v)}/>
        </SRow>
        <SRow label={t('settings.ai.log.label')} hint={t('settings.ai.log.hint')}>
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
  window.stI18n.useLang();
  const t = window.stI18n.t;
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

  const hintKey = count === 0 ? 'settings.ai.history.hint.zero'
    : count === 1 ? 'settings.ai.history.hint.one'
    : 'settings.ai.history.hint.other';

  return (
    <SGroup title={count ? t('settings.ai.history.titleCount', { n: count }) : t('settings.ai.history.title')}>
      <SRow
        label={t('settings.ai.history.label')}
        hint={t(hintKey, { n: count })}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button type="button" className="btn sm ghost" onClick={load} disabled={loading}>
            {loading ? t('settings.ai.history.btn.loading') : t('settings.ai.history.btn.refresh')}
          </button>
          <button type="button" className="btn sm ghost" onClick={doExport} disabled={entries.length === 0}>
            <I.download size={12}/> {t('settings.ai.history.btn.export')}
          </button>
          {!confirmClear ? (
            <button
              type="button"
              className="btn sm"
              style={{color:'var(--danger)'}}
              onClick={() => setConfirmClear(true)}
              disabled={count === 0}>
              <I.trash size={12}/> {t('settings.ai.history.btn.clearAll')}
            </button>
          ) : (
            <>
              <button type="button" className="btn sm ghost" onClick={() => setConfirmClear(false)}>
                {t('settings.ai.history.btn.cancel')}
              </button>
              <button
                type="button"
                className="btn sm"
                style={{background:'var(--danger)',color:'#fff'}}
                onClick={doClear}>
                {t('settings.ai.history.btn.confirmClear', { n: count })}
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
              {t('settings.ai.history.pagination', { shown: entries.length, total: count })}
            </div>
          )}
        </div>
      )}
    </SGroup>
  );
}

function AIHistoryEntry({ entry, expanded, onToggle }) {
  const lang = window.stI18n.useLang();
  const t = window.stI18n.t;
  const when = new Date(entry.createdAt).toLocaleString(lang, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const opLabel = entry.op === 'improve' ? t('settings.ai.history.op.improve')
    : entry.op === 'generate' ? t('settings.ai.history.op.generate')
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
          <div style={{fontSize:10.5,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'.06em',margin:'10px 0 4px'}}>{t('settings.ai.history.promptLabel')}</div>
          <pre style={{margin:0,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,fontFamily:'var(--font-mono)',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:240,overflow:'auto'}}>
            {entry.prompt || t('settings.ai.history.empty')}
          </pre>
          <div style={{fontSize:10.5,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'.06em',margin:'12px 0 4px'}}>
            {entry.ok ? t('settings.ai.history.responseLabel') : t('settings.ai.history.errorLabel')}
          </div>
          <pre style={{margin:0,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,fontFamily:'var(--font-mono)',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:240,overflow:'auto',color: entry.ok ? undefined : 'var(--danger)'}}>
            {entry.ok ? (entry.response || t('settings.ai.history.empty')) : (entry.error || t('settings.ai.history.errorEmpty'))}
          </pre>
          {entry.usage && (
            <div style={{marginTop:8,fontSize:10.5,color:'var(--fg-3)'}}>
              {t('settings.ai.history.tokensLabel')} {Object.entries(entry.usage).map(([k,v]) => `${k}=${v}`).join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SettingsPanel });
