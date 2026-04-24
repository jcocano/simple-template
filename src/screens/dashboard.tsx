// Dashboard screen with template list and gallery.

function TplThumb({ t }) {
  // Render a real-content mini preview. Text uses tiny but legible sizes.
  // All styles scoped inline so themes don't affect the "email" inside.

  // Per-template content — overrides defaults when t has name/variant signals
  const byVariant = {
    newsletter: {
      brand: 'Estudio Acme',
      issue: 'Noviembre · 2026',
      hero: 'Novedades de este mes',
      body: 'Tres lanzamientos, una entrevista con nuestra diseñadora invitada y el calendario del taller.',
      cta: 'Leer todo',
      grid: [
        { tag:'TALLER',     title:'Cerámica para principiantes' },
        { tag:'ENTREVISTA', title:'Pilar Acuña, diseñadora' },
      ],
    },
    promo: {
      brand: 'Acme',
      hero: '40%',
      sub: 'de descuento',
      body: 'Solo hasta el viernes — aplica al pedir dos o más piezas de la colección de otoño.',
      cta: 'Ver colección',
      kicker: 'Rebaja de temporada',
    },
    receipt: {
      brand: 'Acme',
      hero: 'Gracias por tu compra',
      order: 'Pedido #A-29481',
      rows: [
        { n:'Taza cerámica "Luna"',   p:'$24.00' },
        { n:'Cuaderno "Campos"',      p:'$12.50' },
        { n:'Envío nacional',         p:'$ 4.00' },
      ],
      total: '$40.50',
      cta: 'Ver recibo',
    },
    welcome: {
      brand: 'Acme',
      hero: 'Hola, Carmen',
      body: 'Qué bueno tenerte por aquí. Comenzamos con lo esencial: tres cosas que no te puedes perder en tu primer día.',
      cta: 'Empezar',
      steps: ['Completa tu perfil', 'Conoce al equipo', 'Tu primer proyecto'],
    },
    cart: {
      brand: 'Acme',
      hero: '¿Olvidaste algo?',
      body: 'Dejaste estos artículos en tu carrito. Te los guardamos.',
      items: [
        { n:'Taza "Luna"',         p:'$24.00' },
        { n:'Cuaderno "Campos"',   p:'$12.50' },
      ],
      cta: 'Completar compra',
    },
    survey: {
      brand: 'Acme',
      hero: '¿Cómo estuvo nuestro servicio?',
      body: 'Tu opinión nos ayuda a mejorar. Solo tomará dos minutos.',
      stars: 5,
      cta: 'Responder',
    },
    internal: {
      brand: 'Equipo Acme',
      kicker: 'Aviso interno',
      hero: 'Reunión trimestral',
      body: 'Este jueves a las 10:00 en la sala grande. Traigan sus laptops — habrá un ejercicio rápido.',
      meta: ['Jueves 14', '10:00 – 12:00', 'Sala Norte'],
    },
  };
  const d = byVariant[t.variant] || byVariant.newsletter;

  // Tiny palette derived from variant color — darker for legibility
  const tint = t.color || '#e8e7fe';
  const accent = {
    newsletter:'#4a49b8', promo:'#c6513b', receipt:'#2b5fa3', welcome:'#6b3fb0',
    cart:'#8b4a9e', survey:'#3d7a68', internal:'#5a5f85',
  }[t.variant] || '#4a49b8';

  // Base inline styles (the "email paper")
  const paper = { background:'#fff', width:'100%', height:'100%', color:'#1a1a17', fontFamily:'ui-sans-serif, system-ui, sans-serif', display:'flex', flexDirection:'column', fontSize:6, lineHeight:1.35, overflow:'hidden' };
  const head = { padding:'6px 8px', borderBottom:'0.5px solid #e8e6df', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 };
  const brand = { fontWeight:700, fontSize:7, letterSpacing:0.3 };
  const meta = { fontSize:5, color:'#8e8b7e' };
  const body = { padding:'8px 10px', flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:5 };
  const h = { fontSize:11, lineHeight:1.1, fontWeight:700, margin:0, letterSpacing:-0.2 };
  const p = { fontSize:6, lineHeight:1.45, color:'#555148', margin:0 };
  const btn = { display:'inline-block', background:'#1a1a17', color:'#fff', fontSize:6, fontWeight:600, padding:'3px 7px', borderRadius:2, alignSelf:'flex-start' };
  const pill = { fontSize:5, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', color:accent };

  // Custom blank
  if (t.variant === 'blank') {
    return (
      <div style={{display:'grid',placeItems:'center',width:'100%',height:'100%',background:'repeating-linear-gradient(45deg,transparent,transparent 8px,var(--line) 8px,var(--line) 9px)'}}>
        <div style={{display:'grid',placeItems:'center',width:52,height:52,borderRadius:'50%',background:'var(--surface)',border:'1px dashed var(--accent)',color:'var(--accent)'}}>
          <I.plus size={22}/>
        </div>
      </div>
    );
  }

  // Variant renderers
  if (t.variant === 'newsletter') {
    return (
      <div style={paper}>
        <div style={head}>
          <div style={brand}>{d.brand}</div>
          <div style={meta}>{d.issue}</div>
        </div>
        <div style={{background:tint, padding:'10px 10px 12px'}}>
          <div style={{...pill, marginBottom:4}}>Issue 14</div>
          <div style={{...h, fontSize:12}}>{d.hero}</div>
          <div style={{...p, marginTop:4}}>{d.body}</div>
        </div>
        <div style={{...body, paddingTop:6}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5}}>
            {d.grid.map((g,i) => (
              <div key={i} style={{background:'#f5f3ec', borderRadius:2, padding:5}}>
                <div style={{aspectRatio:'3/2', background:'#e6e3d9', borderRadius:1, marginBottom:3}}/>
                <div style={{...pill, fontSize:4, color:'#8e8b7e'}}>{g.tag}</div>
                <div style={{fontSize:6, fontWeight:600, lineHeight:1.2, marginTop:1}}>{g.title}</div>
              </div>
            ))}
          </div>
          <div style={btn}>{d.cta} →</div>
        </div>
      </div>
    );
  }

  if (t.variant === 'promo') {
    return (
      <div style={paper}>
        <div style={head}>
          <div style={brand}>{d.brand}</div>
          <div style={meta}>★ Oferta</div>
        </div>
        <div style={{background:tint, flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:3}}>
          <div style={{...pill, color:accent}}>{d.kicker}</div>
          <div style={{fontSize:28, fontWeight:800, lineHeight:1, letterSpacing:-1, color:accent}}>{d.hero}</div>
          <div style={{fontSize:8, fontWeight:600}}>{d.sub}</div>
          <div style={{...p, maxWidth:'88%', marginTop:3, textAlign:'center'}}>{d.body}</div>
          <div style={{...btn, marginTop:4, background:accent}}>{d.cta}</div>
        </div>
      </div>
    );
  }

  if (t.variant === 'receipt') {
    return (
      <div style={paper}>
        <div style={head}>
          <div style={brand}>{d.brand}</div>
          <div style={meta}>{d.order}</div>
        </div>
        <div style={body}>
          <div style={{...h, fontSize:10}}>{d.hero}</div>
          <div style={{display:'flex', flexDirection:'column', gap:3, marginTop:2}}>
            {d.rows.map((r,i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:6}}>
                <span style={{color:'#555148'}}>{r.n}</span>
                <span style={{fontVariantNumeric:'tabular-nums', fontWeight:500}}>{r.p}</span>
              </div>
            ))}
          </div>
          <div style={{borderTop:'0.5px dashed #cac5b6', paddingTop:3, display:'flex', justifyContent:'space-between'}}>
            <span style={{fontWeight:700, fontSize:7}}>Total</span>
            <span style={{fontWeight:700, fontSize:7, fontVariantNumeric:'tabular-nums'}}>{d.total}</span>
          </div>
          <div style={btn}>{d.cta}</div>
        </div>
      </div>
    );
  }

  if (t.variant === 'welcome') {
    return (
      <div style={paper}>
        <div style={head}>
          <div style={brand}>{d.brand}</div>
          <div style={meta}>Bienvenida</div>
        </div>
        <div style={{background:tint, padding:'12px 10px 14px'}}>
          <div style={{...h, fontSize:14, color:'#1a1a17'}}>{d.hero} 👋</div>
        </div>
        <div style={body}>
          <div style={p}>{d.body}</div>
          <ol style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:3}}>
            {d.steps.map((s,i) => (
              <li key={i} style={{display:'flex', gap:4, alignItems:'center', fontSize:6}}>
                <span style={{width:10, height:10, borderRadius:'50%', background:accent, color:'#fff', fontSize:5, fontWeight:700, display:'grid', placeItems:'center'}}>{i+1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div style={btn}>{d.cta}</div>
        </div>
      </div>
    );
  }

  if (t.variant === 'cart') {
    return (
      <div style={paper}>
        <div style={{...head, background:tint, borderBottom:'0.5px solid rgba(0,0,0,.08)'}}>
          <div style={brand}>{d.brand}</div>
          <div style={{...meta, color:'#444'}}>🛒 Carrito</div>
        </div>
        <div style={body}>
          <div style={{...h, fontSize:10}}>{d.hero}</div>
          <div style={p}>{d.body}</div>
          <div style={{display:'flex', flexDirection:'column', gap:4, marginTop:2}}>
            {d.items.map((it,i) => (
              <div key={i} style={{display:'flex', gap:5, alignItems:'center'}}>
                <div style={{width:22, height:22, background:'#e6e3d9', borderRadius:2, flexShrink:0}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:6, fontWeight:600}}>{it.n}</div>
                  <div style={{fontSize:5, color:'#8e8b7e', fontVariantNumeric:'tabular-nums'}}>{it.p}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{...btn, background:accent}}>{d.cta} →</div>
        </div>
      </div>
    );
  }

  if (t.variant === 'survey') {
    return (
      <div style={paper}>
        <div style={head}>
          <div style={brand}>{d.brand}</div>
          <div style={meta}>Encuesta</div>
        </div>
        <div style={body}>
          <div style={{...h, fontSize:9}}>{d.hero}</div>
          <div style={p}>{d.body}</div>
          <div style={{display:'flex', gap:4, justifyContent:'center', padding:'4px 0'}}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{width:14, height:14, borderRadius:'50%', border:'0.5px solid #cfcdc2', background:i<=3?tint:'#fff', display:'grid', placeItems:'center', fontSize:6, fontWeight:700, color:'#555'}}>{i}</div>
            ))}
          </div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:5, color:'#8e8b7e', padding:'0 2px'}}>
            <span>Mal</span><span>Excelente</span>
          </div>
          <div style={{...btn, background:accent, alignSelf:'center'}}>{d.cta}</div>
        </div>
      </div>
    );
  }

  if (t.variant === 'internal') {
    return (
      <div style={paper}>
        <div style={{...head, background:tint}}>
          <div style={brand}>{d.brand}</div>
          <div style={{...meta, color:'#444'}}>{d.kicker}</div>
        </div>
        <div style={body}>
          <div style={{...h, fontSize:10}}>{d.hero}</div>
          <div style={p}>{d.body}</div>
          <div style={{display:'flex', flexDirection:'column', gap:2, padding:'4px 0'}}>
            {d.meta.map((m,i) => (
              <div key={i} style={{fontSize:6, display:'flex', gap:4, alignItems:'center'}}>
                <span style={{width:3, height:3, borderRadius:'50%', background:accent}}/>
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Display-only helpers. Kept inline — trivial formatters used by
// Dashboard cards only; no need for a shared lib yet.
function formatRelative(sqlDate) {
  if (!sqlDate) return '';
  const t = window.stI18n.t;
  // SQLite datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC.
  const d = new Date(String(sqlDate).replace(' ', 'T') + 'Z');
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return t('common.time.justNow');
  const m = Math.floor(diff / 60000);
  if (m < 60) return t('common.time.minutes', {n: m});
  const h = Math.floor(m / 60);
  if (h < 24) return t('common.time.hours', {n: h});
  const dd = Math.floor(h / 24);
  if (dd < 7) return t('common.time.days', {n: dd});
  const w = Math.floor(dd / 7);
  if (w < 4) return t('common.time.weeks', {n: w});
  const mo = Math.floor(dd / 30);
  return t(mo === 1 ? 'common.time.months.one' : 'common.time.months.other', {n: mo});
}

function WorkspaceSwitcher({ onOpen }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const current = useCurrentWorkspace();
  const workspaces = useWorkspaces();
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [, setTick] = React.useState(0);
  const ref = React.useRef(null);
  const newInputRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) { setCreating(false); setNewName(''); return; }
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);

  React.useEffect(() => {
    if (creating && newInputRef.current) newInputRef.current.focus();
  }, [creating]);

  const submitNew = async () => {
    const nm = newName.trim();
    if (!nm) { setCreating(false); return; }
    const ws = await window.stWorkspaces.create(nm);
    if (ws?.id) await window.stWorkspaces.switch(ws.id);
    setCreating(false);
    setNewName('');
    setOpen(false);
  };

  React.useEffect(() => {
    const h = (e) => {
      if (e.detail?.scope === 'global' && e.detail?.key === 'account') {
        setTick((n) => n + 1);
      }
    };
    window.addEventListener('st:settings-change', h);
    return () => window.removeEventListener('st:settings-change', h);
  }, []);

  const account = window.stStorage.getSetting('account', {}) || {};
  const name = account.name || t('ws.noName');

  return (
    <div ref={ref} style={{position:'relative'}}>
      <div className="row" style={{gap:8,padding:6,borderRadius:'var(--r-md)',cursor:'pointer'}} onClick={()=>setOpen(v=>!v)}>
        <Avatar name={name} size={28}/>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
          <div style={{fontSize:11,color:'var(--fg-3)',display:'flex',alignItems:'center',gap:4}}>
            <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t('ws.currentPrefix', {name: current?.name || '…'})}</span>
            <I.chevronD size={10} style={{flexShrink:0}}/>
          </div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
          <ThemeToggleBtn/>
          <button className="btn icon sm ghost" title={t('ws.settings.tooltip')} onClick={()=>onOpen && onOpen('settings')}><I.settings size={13}/></button>
        </div>
      </div>

      {open && (
        <div style={{
          position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,
          padding:6,minWidth:240,
          background:'var(--surface)',borderRadius:'var(--r-md)',
          boxShadow:'0 12px 32px rgba(0,0,0,.18), 0 0 0 1px var(--line)',
          zIndex:20,
        }}>
          <div style={{fontSize:10,color:'var(--fg-3)',padding:'6px 10px',textTransform:'uppercase',letterSpacing:'.06em'}}>{t('ws.switch')}</div>
          {workspaces.map(w => (
            <button key={w.id} className="btn ghost sm"
              style={{width:'100%',justifyContent:'flex-start',gap:8,fontWeight: w.id===current?.id ? 500 : 400}}
              onClick={async ()=>{ setOpen(false); await window.stWorkspaces.switch(w.id); }}>
              <span style={{width:14,display:'grid',placeItems:'center'}}>
                {w.id===current?.id && <I.check size={12}/>}
              </span>
              <span style={{flex:1,textAlign:'left'}}>{w.name}</span>
            </button>
          ))}
          <div style={{height:1,background:'var(--line)',margin:'4px 0'}}/>
          {creating ? (
            <div style={{display:'flex',gap:6,padding:'4px 6px',alignItems:'center'}}>
              <I.plus size={12} style={{color:'var(--fg-3)',flexShrink:0}}/>
              <input
                ref={newInputRef}
                value={newName}
                onChange={e=>setNewName(e.target.value)}
                onKeyDown={e=>{
                  if (e.key === 'Enter') submitNew();
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
                placeholder={t('ws.name.placeholder')}
                style={{flex:1,border:'1px solid var(--line)',background:'var(--surface-2)',padding:'4px 8px',borderRadius:'var(--r-sm)',fontSize:12,outline:'none'}}
              />
              <button className="btn sm" onClick={submitNew} disabled={!newName.trim()}>{t('ws.create')}</button>
            </div>
          ) : (
            <button className="btn ghost sm" style={{width:'100%',justifyContent:'flex-start',gap:8}}
              onClick={()=>setCreating(true)}>
              <I.plus size={12}/><span>{t('ws.createNew')}</span>
            </button>
          )}
          <button className="btn ghost sm" style={{width:'100%',justifyContent:'flex-start',gap:8}}
            onClick={()=>{ setOpen(false); onOpen && onOpen('settings', 'workspace'); }}>
            <I.settings size={12}/><span>{t('ws.settingsEntry')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ onOpen, onNew }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [folder, setFolder] = React.useState('all');
  const [view, setView] = React.useState('grid');
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState('updated');
  const [aiOpen, setAiOpen] = React.useState(false);

  const rawItems = useTemplates();
  const trashedItems = useTrashedTemplates();
  const blockRows = window.useBlocks();
  const occasions = useOccasions();
  const [occasionModal, setOccasionModal] = React.useState(null);
  const [moveMenu, setMoveMenu] = React.useState(null);
  const [kebabMenu, setKebabMenu] = React.useState(null);
  const [shareModal, setShareModal] = React.useState(null);
  const [dragOverOccId, setDragOverOccId] = React.useState(null);
  const inTrash = folder === 'trash';

  const [selected, setSelected] = React.useState(() => new Set());
  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clearSelection = () => setSelected(s => s.size === 0 ? s : new Set());
  React.useEffect(() => {
    if (!inTrash || trashedItems.length === 0) clearSelection();
  }, [inTrash, trashedItems.length]);

  // Resolve each template's occasion once per render — honors explicit
  // `occasionId` on the doc and falls back to matching the legacy `folder`
  // string, so seed/older templates still show a color without a disk write.
  const occasionByTplId = React.useMemo(() => {
    const m = {};
    for (const t of rawItems) {
      const oc = window.stOccasions.resolveOccasionForRow(t, occasions);
      if (oc) m[t.id] = oc;
    }
    return m;
  }, [rawItems, occasions]);

  const occasionCounts = React.useMemo(() => {
    const counts = {};
    for (const t of rawItems) {
      const oc = occasionByTplId[t.id];
      if (oc) counts[oc.id] = (counts[oc.id] || 0) + 1;
    }
    return counts;
  }, [rawItems, occasionByTplId]);

  const items = React.useMemo(() => {
    const source = inTrash ? trashedItems : rawItems;
    const filtered = source.filter(t => {
      const matchesName = (t.name || '').toLowerCase().includes(q.toLowerCase());
      if (!matchesName) return false;
      if (inTrash) return true;
      if (folder === 'all' || folder === 'recent') return true;
      if (folder === 'shared') return !!t.sharedFrom;
      if (folder === 'starred') return !!t.starred;
      if (folder.startsWith('occ:')) return occasionByTplId[t.id]?.id === folder.slice(4);
      return false;
    });
    if (sort === 'name') filtered.sort((a,b) => (a.name||'').localeCompare(b.name||''));
    else if (sort === 'status') filtered.sort((a,b) => (a.status||'').localeCompare(b.status||''));
    // 'updated' is already the SQLite default (ORDER BY updated_at DESC).
    return filtered;
  }, [rawItems, trashedItems, inTrash, folder, q, sort, occasionByTplId]);

  const folderCounts = React.useMemo(() => ({
    all: rawItems.length,
    starred: rawItems.filter(r => r.starred).length,
    recent: rawItems.length,
    shared: rawItems.filter(r => r.sharedFrom).length,
    trash: trashedItems.length,
  }), [rawItems, trashedItems]);

  return (
    <div className="editor" style={{flexDirection:'row'}}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-name">Simple Template</div>
          <button
            className="btn icon sm ghost"
            style={{marginLeft:'auto'}}
            title={t('app.search.tooltip')}
            onClick={()=>window.dispatchEvent(new CustomEvent('st:cmd-open'))}
          >
            <I.search size={13}/>
          </button>
        </div>
        <nav>
          <div className="nav-label">{t('sidebar.nav.library')}</div>
          {FOLDERS.map(f => {
            const Ico = I[f.icon];
            const count = folderCounts[f.id] ?? f.count;
            return (
              <div key={f.id} className={`nav-item ${folder===f.id?'active':''}`} onClick={()=>setFolder(f.id)}>
                <Ico size={15}/>
                <span>{f.labelKey ? t(f.labelKey) : f.name}</span>
                <span className="count">{count}</span>
              </div>
            );
          })}
          <div className="nav-label">{t('sidebar.nav.occasions')}</div>
          {occasions.map(oc => {
            const active = folder === `occ:${oc.id}`;
            const dropOver = dragOverOccId === oc.id;
            const count = occasionCounts[oc.id] || 0;
            return (
              <div
                key={oc.id}
                className={`nav-item ${active?'active':''} ${dropOver?'drop-active':''}`}
                onClick={()=>setFolder(`occ:${oc.id}`)}
                onDragOver={(e)=>{
                  if (!Array.from(e.dataTransfer.types).includes('text/x-mc-template')) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverOccId !== oc.id) setDragOverOccId(oc.id);
                }}
                onDragLeave={(e)=>{
                  if (e.currentTarget.contains(e.relatedTarget)) return;
                  setDragOverOccId(id => id === oc.id ? null : id);
                }}
                onDrop={(e)=>{
                  const tplId = e.dataTransfer.getData('text/x-mc-template');
                  setDragOverOccId(null);
                  if (!tplId) return;
                  e.preventDefault();
                  window.stOccasions.setTemplateOccasion(tplId, oc.id);
                }}
              >
                <div style={{width:10,height:10,borderRadius:2,background:oc.color,flexShrink:0}}/>
                <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{oc.name}</span>
                <span className="count oc-count-hideable">{count}</span>
                <div className="oc-actions" onClick={e=>e.stopPropagation()}>
                  <button className="btn icon sm ghost" title={t('sidebar.occasion.edit')}
                    onClick={()=>setOccasionModal({mode:'edit', occasion: oc})}>
                    <I.edit size={11}/>
                  </button>
                  <button className="btn icon sm ghost" title={t('sidebar.occasion.delete')}
                    onClick={()=>{
                      if (window.confirm(t('sidebar.occasion.deleteConfirm', {name: oc.name}))) {
                        window.stOccasions.remove(oc.id);
                        if (folder === `occ:${oc.id}`) setFolder('all');
                      }
                    }}>
                    <I.trash size={11}/>
                  </button>
                </div>
              </div>
            );
          })}
          <div className="nav-item" onClick={()=>setOccasionModal({mode:'new'})} style={{color:'var(--fg-3)'}}>
            <I.plus size={12}/>
            <span>{t('sidebar.occasion.new')}</span>
          </div>
          <div className="nav-label">{t('sidebar.nav.things')}</div>
          <div className="nav-item" onClick={()=>onOpen('library')}>
            <I.layers size={15}/>
            <span>{t('sidebar.myBlocks')}</span>
            <span className="count">{blockRows.length}</span>
          </div>
          <div className="nav-item">
            <I.braces size={15}/>
            <span>{t('sidebar.myTags')}</span>
          </div>
          <div className="nav-item" onClick={()=>onOpen('images')}>
            <I.image size={15}/>
            <span>{t('sidebar.myImages')}</span>
          </div>

          <div className="nav-label">{t('sidebar.nav.delivery')}</div>
          <div className="nav-item" style={{opacity:0.7,cursor:'not-allowed'}} title={t('sidebar.contacts.tip')}>
            <I.user size={15}/>
            <span>{t('sidebar.contacts')}</span>
            <span className="count" style={{background:'color-mix(in oklab, var(--accent) 15%, transparent)',color:'var(--accent)',fontSize:9.5,letterSpacing:'.04em'}}>{t('sidebar.soon')}</span>
          </div>
          <div className="nav-item" style={{opacity:0.7,cursor:'not-allowed'}} title={t('sidebar.soon.tip')}>
            <I.send size={15}/>
            <span>{t('sidebar.history')}</span>
            <span className="count" style={{background:'color-mix(in oklab, var(--accent) 15%, transparent)',color:'var(--accent)',fontSize:9.5,letterSpacing:'.04em'}}>{t('sidebar.soon')}</span>
          </div>
          <div className="nav-item" style={{opacity:0.7,cursor:'not-allowed'}} title={t('sidebar.soon.tip')}>
            <I.eye size={15}/>
            <span>{t('sidebar.opens')}</span>
            <span className="count" style={{background:'color-mix(in oklab, var(--accent) 15%, transparent)',color:'var(--accent)',fontSize:9.5,letterSpacing:'.04em'}}>{t('sidebar.soon')}</span>
          </div>
        </nav>
        <div style={{marginTop:'auto',padding:12,borderTop:'1px solid var(--line)'}}>
          <WorkspaceSwitcher onOpen={onOpen}/>
        </div>
      </aside>

      <main className="dash">
        <div className="dash-head">
          <div className="grow">
            <h1>{t('dash.title')}</h1>
            <div className="sub">
              {t(items.length===1 ? 'dash.count.one' : 'dash.count.other', {n: items.length})}
              {rawItems[0]?.updated_at && <> · {t('dash.lastEdit', {when: formatRelative(rawItems[0].updated_at)})}</>}
            </div>
          </div>
          <button className="btn" onClick={()=>onOpen('gallery')}>
            <I.grid size={14}/> {t('dash.btn.gallery')}
          </button>
          <button className="btn" onClick={()=>setAiOpen(true)} style={{borderColor:'color-mix(in oklab, var(--accent) 40%, var(--line))', color:'var(--accent)'}}>
            <I.sparkles size={14}/> {t('dash.btn.ai')}
          </button>
          <button className="btn primary" onClick={onNew}>
            <I.plus size={14}/> {t('dash.btn.new')}
          </button>
        </div>

        <div className="dash-toolbar">
          <div className="search">
            <span className="si"><I.search size={14}/></span>
            <input placeholder={t('dash.search.placeholder')} value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div className="grow"/>
          <select className="field" style={{width:190}} value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="updated">{t('dash.sort.updated')}</option>
            <option value="name">{t('dash.sort.name')}</option>
            <option value="status">{t('dash.sort.status')}</option>
          </select>
          <div className="seg">
            <button className={view==='grid'?'on':''} onClick={()=>setView('grid')}><I.grid size={14}/></button>
            <button className={view==='list'?'on':''} onClick={()=>setView('list')}><I.layers size={14}/></button>
          </div>
        </div>

        {inTrash && trashedItems.length > 0 && (
          <div className="dash-toolbar" style={{background:'var(--surface-2)'}}>
            {selected.size > 0 ? (
              <>
                <span style={{fontSize:13,fontWeight:500}}>{t('dash.trash.bulk.selected', {n: selected.size})}</span>
                <button className="btn ghost sm" onClick={clearSelection}>
                  <I.x size={12}/> {t('dash.trash.bulk.clear')}
                </button>
                <button className="btn ghost sm" onClick={()=>setSelected(new Set(items.map(x => x.id)))}
                  disabled={selected.size === items.length}>
                  {t('dash.trash.bulk.selectAll')}
                </button>
                <div className="grow"/>
                <button className="btn sm" onClick={()=>{
                  const ids = Array.from(selected);
                  for (const id of ids) window.stTemplates.restore(id);
                  clearSelection();
                }}>
                  <I.undo size={12}/> {t('dash.trash.bulk.restore')}
                </button>
                <button className="btn sm" onClick={()=>{
                  const ids = Array.from(selected);
                  if (ids.length === 0) return;
                  if (!window.confirm(t('dash.confirm.purgeMany', {n: ids.length}))) return;
                  for (const id of ids) window.stTemplates.purge(id);
                  clearSelection();
                }} style={{color:'var(--danger)',borderColor:'color-mix(in oklab, var(--danger) 40%, var(--line))'}}>
                  <I.trash size={12}/> {t('dash.trash.bulk.purge')}
                </button>
              </>
            ) : (
              <>
                <button className="btn ghost sm" onClick={()=>setSelected(new Set(items.map(x => x.id)))}>
                  <I.check size={12}/> {t('dash.trash.bulk.selectAll')}
                </button>
                <div className="grow"/>
                <button className="btn sm" onClick={()=>{
                  if (trashedItems.length === 0) return;
                  if (!window.confirm(t('dash.confirm.emptyTrash', {n: trashedItems.length}))) return;
                  for (const tpl of trashedItems) window.stTemplates.purge(tpl.id);
                  clearSelection();
                }} style={{color:'var(--danger)',borderColor:'color-mix(in oklab, var(--danger) 40%, var(--line))'}}>
                  <I.trash size={12}/> {t('dash.action.emptyTrash')}
                </button>
              </>
            )}
          </div>
        )}

        <div className="dash-body">
          {items.length === 0 && (
            <EmptyState
              illustration={q ? 'search' : 'no-templates'}
              title={q
                ? t('dash.empty.search.title', {q})
                : folder==='trash'   ? t('dash.empty.trash.title')
                : folder==='starred' ? t('dash.empty.starred.title')
                : folder==='shared'  ? t('dash.empty.shared.title')
                : folder==='recent'  ? t('dash.empty.recent.title')
                : t('dash.empty.all.title')}
              msg={q
                ? t('dash.empty.search.msg')
                : folder==='trash'   ? t('dash.empty.trash.msg')
                : folder==='starred' ? t('dash.empty.starred.msg')
                : folder==='shared'  ? t('dash.empty.shared.msg')
                : folder==='recent'  ? t('dash.empty.recent.msg')
                : t('dash.empty.all.msg')}
              primaryAction={q
                ? { label:t('dash.empty.btn.clearSearch'), icon:'x', onClick:()=>setQ('') }
                : folder==='trash'
                  ? { label:t('dash.empty.btn.backAll'), icon:'chevronL', onClick:()=>setFolder('all') }
                  : { label:t('dash.empty.btn.newTemplate'), icon:'plus', onClick:onNew }}
              secondaryAction={!q && folder!=='trash' ? { label:t('dash.empty.btn.openGallery'), icon:'grid', onClick:()=>onOpen('gallery') } : null}
              tips={!q && folder==='all' ? [
                t('dash.empty.tip1'),
                t('dash.empty.tip2'),
              ] : []}
            />
          )}
          {items.length > 0 && (view==='grid' ? (
            <div className="grid-tpl">
              {!inTrash && (
                <div className="tpl-new" onClick={onNew}>
                  <div className="plus"><I.plus size={18}/></div>
                  <div style={{fontSize:13,fontWeight:500}}>{t('dash.tile.new.title')}</div>
                  <div style={{fontSize:11,color:'var(--fg-3)'}}>{t('dash.tile.new.sub')}</div>
                </div>
              )}
              {items.map(tpl => {
                const oc = occasionByTplId[tpl.id];
                const isSelected = inTrash && selected.has(tpl.id);
                return (
                <div key={tpl.id} className="tpl-card"
                  draggable={!inTrash}
                  onClick={inTrash ? ()=>toggleSelect(tpl.id) : ()=>onOpen('editor', tpl)}
                  onDragStart={(e)=>{
                    if (inTrash) return;
                    e.dataTransfer.setData('text/x-mc-template', tpl.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.currentTarget.classList.add('dragging');
                  }}
                  onDragEnd={(e)=>e.currentTarget.classList.remove('dragging')}
                  style={inTrash ? {
                    cursor:'pointer',
                    opacity: isSelected ? 1 : 0.85,
                    outline: isSelected ? '2px solid var(--accent)' : undefined,
                    outlineOffset: isSelected ? 2 : undefined,
                  } : undefined}>
                  <div className="tpl-thumb">
                    {inTrash && (
                      <div className="badge" title={t('dash.action.select')}>
                        <div style={{
                          width:22,height:22,borderRadius:6,
                          background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.92)',
                          border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line-2)'}`,
                          display:'grid',placeItems:'center',
                          boxShadow:'0 2px 6px rgba(0,0,0,.12)',
                          transition:'background 120ms, border-color 120ms',
                        }}>
                          {isSelected && <I.check size={14} style={{color:'#fff'}}/>}
                        </div>
                      </div>
                    )}
                    {!inTrash && tpl.starred && <div className="badge"><div className="chip accent"><I.star size={10}/> {t('dash.badge.favorite')}</div></div>}
                    {!inTrash && tpl.status==='draft' && !tpl.starred && <div className="badge"><div className="chip">{t('dash.badge.unpublished')}</div></div>}
                    <div className="tpl-actions">
                      {inTrash ? (
                        <>
                          <button className="btn icon sm" title={t('dash.action.restore')}
                            onClick={e=>{ e.stopPropagation(); window.stTemplates.restore(tpl.id); }}>
                            <I.undo size={12}/>
                          </button>
                          <button className="btn icon sm" title={t('dash.action.purge')}
                            onClick={e=>{
                              e.stopPropagation();
                              if (window.confirm(t('dash.confirm.purge', {name: tpl.name}))) {
                                window.stTemplates.purge(tpl.id);
                              }
                            }}>
                            <I.trash size={12}/>
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn icon sm" title={tpl.starred ? t('dash.action.star.remove') : t('dash.action.star.add')}
                            onClick={e=>{ e.stopPropagation(); window.stTemplates.toggleStar(tpl.id); }}>
                            {tpl.starred ? <I.star2 size={12}/> : <I.star size={12}/>}
                          </button>
                          <button className="btn icon sm" title={t('dash.action.duplicate')}
                            onClick={e=>{ e.stopPropagation(); window.stTemplates.duplicate(tpl.id); }}>
                            <I.copy size={12}/>
                          </button>
                          <button className="btn icon sm" title={t('dash.action.more')}
                            onClick={e=>{
                              e.stopPropagation();
                              const r = e.currentTarget.getBoundingClientRect();
                              setKebabMenu({
                                templateId: tpl.id,
                                templateName: tpl.name,
                                x: r.right - 220,
                                y: r.bottom + 4,
                              });
                            }}>
                            <I.dotsV size={12}/>
                          </button>
                          <button className="btn icon sm" title={t('dash.action.trash')}
                            onClick={e=>{ e.stopPropagation(); window.stTemplates.remove(tpl.id); }}>
                            <I.trash size={12}/>
                          </button>
                        </>
                      )}
                    </div>
                    <TplThumb t={tpl}/>
                  </div>
                  <div className="tpl-meta">
                    <div className="tpl-title">{tpl.name}</div>
                    <div className="tpl-sub">
                      {oc && <span className="oc-dot" style={{background:oc.color}}/>}
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {tpl.folder || t('dash.noFolder')}
                      </span>
                      <span className="tpl-dot"/>
                      {inTrash
                        ? <span>{t('dash.trash.deletedAt', {when: formatRelative(tpl.deleted_at)})}</span>
                        : <>
                            <span className={tpl.status==='published'?'ok':''}>{t(tpl.status==='published' ? 'dash.status.published' : 'dash.status.draft')}</span>
                            <span className="tpl-dot"/>
                            <span>{formatRelative(tpl.updated_at)}</span>
                          </>}
                    </div>
                    {!inTrash && tpl.sharedFrom?.name && (
                      <div className="tpl-sub" style={{display:'flex',alignItems:'center',gap:4,marginTop:2,color:'var(--fg-3)'}}>
                        <I.user size={10}/>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {t('dash.card.sharedBy', {name: tpl.sharedFrom.name})}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'32px 1fr 160px 140px 120px 40px',padding:'10px 16px',borderBottom:'1px solid var(--line)',fontSize:11,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'0.04em',fontWeight:600}}>
                <span/>
                <span>{t('dash.col.name')}</span><span>{t('dash.col.occasion')}</span><span>{t('dash.col.status')}</span><span>{t('dash.col.lastEdit')}</span><span/>
              </div>
              {items.map(tpl => {
                const oc = occasionByTplId[tpl.id];
                const isSelected = inTrash && selected.has(tpl.id);
                return (
                <div key={tpl.id}
                  draggable={!inTrash}
                  onClick={inTrash ? ()=>toggleSelect(tpl.id) : ()=>onOpen('editor', tpl)}
                  onDragStart={(e)=>{
                    if (inTrash) return;
                    e.dataTransfer.setData('text/x-mc-template', tpl.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  style={{display:'grid',gridTemplateColumns:'32px 1fr 160px 140px 120px 80px',padding:'12px 16px',borderBottom:'1px solid var(--line)',alignItems:'center',cursor:'pointer',fontSize:13,opacity:inTrash && !isSelected ? 0.85 : 1,background:isSelected?'color-mix(in oklab, var(--accent) 10%, var(--surface))':undefined}}
                  onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background='var(--surface-2)'; }}
                  onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background=''; }}>
                  <div>
                    {inTrash ? (
                      <div style={{
                        width:18,height:18,borderRadius:4,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line-2)'}`,
                        display:'grid',placeItems:'center',
                      }}>
                        {isSelected && <I.check size={12} style={{color:'#fff'}}/>}
                      </div>
                    ) : (tpl.starred && <I.star2 size={14} style={{color:'var(--warn)'}}/>)}
                  </div>
                  <div style={{fontWeight:500}}>{tpl.name}</div>
                  <div style={{color:'var(--fg-2)',display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                    {oc && <span className="oc-dot" style={{background:oc.color}}/>}
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tpl.folder || t('dash.noFolder')}</span>
                  </div>
                  <div>
                    {inTrash
                      ? <span className="chip">{t('dash.badge.trash')}</span>
                      : <span className={`chip ${tpl.status==='published'?'ok':''}`}>{t(tpl.status==='published' ? 'dash.status.published' : 'dash.status.draft')}</span>}
                  </div>
                  <div style={{color:'var(--fg-3)',fontSize:12}}>
                    {inTrash ? t('dash.trash.deletedAt', {when: formatRelative(tpl.deleted_at)}) : formatRelative(tpl.updated_at)}
                  </div>
                  <div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}>
                    {inTrash ? (
                      <>
                        <button className="btn icon sm ghost" title={t('dash.action.restore')}
                          onClick={()=>window.stTemplates.restore(tpl.id)}>
                          <I.undo size={13}/>
                        </button>
                        <button className="btn icon sm ghost" title={t('dash.action.purge')}
                          onClick={()=>{
                            if (window.confirm(t('dash.confirm.purge', {name: tpl.name}))) {
                              window.stTemplates.purge(tpl.id);
                            }
                          }}>
                          <I.trash size={13}/>
                        </button>
                      </>
                    ) : (
                      <button className="btn icon sm ghost" title={t('dash.action.more')}
                        onClick={e=>{
                          e.stopPropagation();
                          const r = e.currentTarget.getBoundingClientRect();
                          setKebabMenu({
                            templateId: tpl.id,
                            templateName: tpl.name,
                            x: r.right - 220,
                            y: r.bottom + 4,
                          });
                        }}>
                        <I.dotsV size={14}/>
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ))}
        </div>
      </main>
      {aiOpen && <AIGenerateModal onClose={()=>setAiOpen(false)} onGenerated={(tpl)=>{ setAiOpen(false); onOpen && onOpen('editor', tpl); }}/>}
      {occasionModal && <OccasionModal mode={occasionModal.mode} occasion={occasionModal.occasion} onClose={()=>setOccasionModal(null)}/>}
      {moveMenu && <MoveMenuPopover menu={moveMenu} occasions={occasions} onClose={()=>setMoveMenu(null)}/>}
      {kebabMenu && (
        <window.KebabMenu
          menu={{
            x: kebabMenu.x,
            y: kebabMenu.y,
            items: [
              {
                id: 'move',
                label: t('dash.kebab.moveOccasion'),
                icon: I.folder,
                onClick: () => setMoveMenu({
                  templateId: kebabMenu.templateId,
                  x: kebabMenu.x,
                  y: kebabMenu.y,
                }),
              },
              {
                id: 'share',
                label: t('dash.kebab.share'),
                icon: I.upload,
                onClick: () => setShareModal({
                  templateId: kebabMenu.templateId,
                  templateName: kebabMenu.templateName,
                }),
              },
            ],
          }}
          onClose={()=>setKebabMenu(null)}
        />
      )}
      {shareModal && (
        <window.ShareModal
          templateId={shareModal.templateId}
          templateName={shareModal.templateName}
          onClose={()=>setShareModal(null)}
        />
      )}
    </div>
  );
}

// Occasion modal — create / edit. Color choice is a fixed palette
// (MongoDB Compass-style) rather than a free-form picker so the
// sidebar stays visually coherent across workspaces.
function OccasionModal({ mode, occasion, onClose }) {
  const palette = window.stOccasions.PALETTE;
  const [name, setName] = React.useState(occasion?.name || '');
  const [color, setColor] = React.useState(occasion?.color || palette[0].value);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (mode === 'edit' && occasion) {
      window.stOccasions.update(occasion.id, { name: trimmed, color });
    } else {
      window.stOccasions.add({ name: trimmed, color });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pop" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div className="modal-head">
          <div style={{width:32,height:32,borderRadius:8,background:color,display:'grid',placeItems:'center',transition:'background 120ms'}}>
            <div style={{width:12,height:12,borderRadius:3,background:'rgba(255,255,255,.82)'}}/>
          </div>
          <div style={{flex:1}}>
            <h3>{mode === 'edit' ? 'Editar ocasión' : 'Nueva ocasión'}</h3>
            <div className="sub">Dale un nombre y un color para distinguirla en el sidebar.</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={15}/></button>
        </div>
        <div className="modal-body">
          <div className="prop-label" style={{marginBottom:6}}>Nombre</div>
          <input ref={inputRef} className="field" value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Ej.: Carritos abandonados"/>
          <div className="prop-label" style={{marginTop:16,marginBottom:8}}>Color</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(9, 1fr)',gap:8}}>
            {palette.map(p => {
              const on = color === p.value;
              return (
                <button key={p.id} onClick={()=>setColor(p.value)} title={p.name}
                  style={{
                    aspectRatio:'1',
                    borderRadius:'50%',
                    background:p.value,
                    border:'none',
                    cursor:'pointer',
                    position:'relative',
                    outline: on ? '2px solid var(--fg)' : 'none',
                    outlineOffset: 2,
                  }}>
                  {on && <I.check size={12} style={{color:'#fff',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={!name.trim()}>
            {mode === 'edit' ? 'Guardar cambios' : 'Crear ocasión'}
          </button>
        </div>
      </div>
    </div>
  );
}

// "Mover a…" popover — anchored to the card/row's action button.
// Uses fixed positioning so it isn't clipped by the card's overflow:
// hidden (which exists so the thumbnail stays inside the rounded card).
function MoveMenuPopover({ menu, occasions, onClose }) {
  window.stI18n.useLang();
  const t = window.stI18n.t;
  const ref = React.useRef(null);

  React.useEffect(() => {
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', click);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', click);
      window.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  const move = (occasionId) => {
    window.stOccasions.setTemplateOccasion(menu.templateId, occasionId);
    onClose();
  };

  const style = {
    position:'fixed',
    top: Math.min(menu.y, window.innerHeight - 320),
    left: Math.max(8, Math.min(menu.x, window.innerWidth - 240)),
    minWidth:220,
    maxHeight:320,
    overflowY:'auto',
    background:'var(--surface)',
    border:'1px solid var(--line)',
    borderRadius:'var(--r-md)',
    boxShadow:'0 12px 32px rgba(0,0,0,.18)',
    zIndex:60,
    padding:6,
  };

  return (
    <div ref={ref} style={style}>
      <div style={{fontSize:10,color:'var(--fg-3)',padding:'6px 10px',textTransform:'uppercase',letterSpacing:'.06em'}}>{t('dash.moveMenu.title')}</div>
      {occasions.length === 0 && (
        <div style={{padding:'8px 10px',fontSize:12,color:'var(--fg-3)'}}>
          {t('dash.moveMenu.empty')}
        </div>
      )}
      {occasions.map(oc => (
        <button key={oc.id} className="btn ghost sm"
          style={{width:'100%',justifyContent:'flex-start',gap:8}}
          onClick={()=>move(oc.id)}>
          <span style={{width:10,height:10,borderRadius:2,background:oc.color,flexShrink:0}}/>
          <span style={{flex:1,textAlign:'left',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{oc.name}</span>
        </button>
      ))}
      <div style={{height:1,background:'var(--line)',margin:'4px 0'}}/>
      <button className="btn ghost sm" style={{width:'100%',justifyContent:'flex-start',gap:8}}
        onClick={()=>move(null)}>
        <span style={{width:10,height:10,borderRadius:2,border:'1px dashed var(--fg-3)',flexShrink:0}}/>
        <span style={{flex:1,textAlign:'left',color:'var(--fg-2)'}}>{t('dash.moveMenu.none')}</span>
      </button>
    </div>
  );
}

// AI Generate modal for creating a template from a prompt.
function AIGenerateModal({ onClose, onGenerated }) {
  const aiCfg = window.stStorage.getSetting('ai', {});
  const configured = aiCfg.enabled !== false && (aiCfg.keyConfigured || aiCfg.key || aiCfg.provider === 'ollama');
  const [prompt, setPrompt] = React.useState('');
  const [tone, setTone] = React.useState(aiCfg.tone || 'neutral');
  const [length, setLength] = React.useState('medio');
  const [blocks, setBlocks] = React.useState(['cabecera','titulo','texto','boton','footer']);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const IDEAS = [
    { t:'Newsletter mensual', d:'Resumen de novedades, 3 artículos destacados, CTA a blog' },
    { t:'Lanzamiento de producto', d:'Hero con foto, beneficios, testimonio, CTA de compra' },
    { t:'Bienvenida a nuevo suscriptor', d:'Saludo cálido, qué esperar, primer recurso gratis' },
    { t:'Recuperación de carrito', d:'Tono amable, foto del producto olvidado, descuento opcional' },
    { t:'Evento presencial o webinar', d:'Fecha, hora, qué se aprende, botón de registro' },
    { t:'Encuesta de satisfacción', d:'Pregunta corta, CTA de 1 click, agradecimiento' },
  ];

  const BLOCKS_OPT = [
    {id:'cabecera', name:'Cabecera con logo'},
    {id:'hero', name:'Imagen hero'},
    {id:'titulo', name:'Título'},
    {id:'texto', name:'Texto'},
    {id:'lista', name:'Lista de items'},
    {id:'boton', name:'Botón CTA'},
    {id:'imagen', name:'Imagen'},
    {id:'producto', name:'Tarjeta de producto'},
    {id:'testimonio', name:'Testimonio'},
    {id:'redes', name:'Redes sociales'},
    {id:'footer', name:'Footer legal'},
  ];

  const toggleBlock = (id) => setBlocks(b => b.includes(id) ? b.filter(x=>x!==id) : [...b, id]);

  const handleGen = async () => {
    if (!prompt.trim() || !configured) return;
    setLoading(true);
    setError(null);
    const result = await window.stAI.generateTemplate({ prompt, tone, length, blocks });
    if (!result.ok) {
      setLoading(false);
      setError(window.stIpcErr.localize(result));
      return;
    }
    // Create a real template from the generated doc and open it in the editor.
    try {
      const newTpl = await window.stTemplates.create({
        name: promptToName(prompt),
        folder: 'Sin carpeta',
        variant: 'newsletter',
        color: '#e8e7fe',
        status: 'draft',
        starred: false,
        doc: result.doc,
      });
      setLoading(false);
      if (!newTpl) {
        setError('No se pudo guardar la plantilla generada.');
        return;
      }
      onGenerated && onGenerated(newTpl);
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Error al crear la plantilla.');
    }
  };

  // Derive a short template name from the user's prompt. Trims to the first
  // sentence / 60 chars and capitalizes, so the dashboard card has a label
  // that's more descriptive than "Untitled template".
  function promptToName(p) {
    const first = String(p).split(/[.\n]/)[0].trim();
    const clipped = first.length > 60 ? first.slice(0, 57) + '…' : first;
    return clipped.charAt(0).toUpperCase() + clipped.slice(1) || 'Plantilla con IA';
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide pop" onClick={e=>e.stopPropagation()} style={{maxWidth:720}}>
        <div className="modal-head">
          <div style={{width:32,height:32,borderRadius:8,background:'var(--accent)',color:'#fff',display:'grid',placeItems:'center'}}>
            <I.sparkles size={16}/>
          </div>
          <div style={{flex:1}}>
            <h3>Generar plantilla con IA</h3>
            <div className="sub">Describe el correo que quieres y la IA arma los bloques por ti. Siempre puedes editarlos después.</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={15}/></button>
        </div>
        <div className="modal-body">
          {!configured && (
            <div style={{display:'flex',gap:10,padding:'12px 14px',background:'color-mix(in oklab, var(--warn) 10%, var(--surface))',border:'1px solid color-mix(in oklab, var(--warn) 30%, var(--line))',borderRadius:'var(--r-md)',marginBottom:16,alignItems:'center'}}>
              <I.info size={16} style={{color:'var(--warn)',flexShrink:0}}/>
              <div style={{flex:1,fontSize:12}}>
                Aún no has configurado el proveedor de IA. Ve a <b>Ajustes → Inteligencia artificial</b> para añadir tu API key.
              </div>
              <button className="btn sm">Ir a Ajustes</button>
            </div>
          )}

          <div className="prop-label" style={{marginBottom:8}}>Describe el correo</div>
          <textarea className="field" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)}
            placeholder="Ej.: Un correo para invitar a clientes frecuentes a la preventa de nuestra nueva colección de otoño. Tono cálido, con descuento del 20% durante 48 horas, botón a la tienda, y testimonio de una clienta."
            style={{fontSize:13,lineHeight:1.5}}/>

          <div className="prop-label" style={{marginTop:18,marginBottom:8}}>O empieza con una idea</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {IDEAS.map(i => (
              <button key={i.t} onClick={()=>setPrompt(i.d)} style={{
                textAlign:'left',padding:'10px 12px',
                border:'1px solid var(--line)',borderRadius:'var(--r-md)',
                background:'var(--surface)',cursor:'pointer',
              }}>
                <div style={{fontSize:12.5,fontWeight:500}}>{i.t}</div>
                <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2,lineHeight:1.4}}>{i.d}</div>
              </button>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:18}}>
            <div>
              <div className="prop-label" style={{marginBottom:6}}>Tono</div>
              <select className="field" value={tone} onChange={e=>setTone(e.target.value)}>
                <option value="neutral">Neutral y claro</option>
                <option value="calido">Cálido y cercano</option>
                <option value="profesional">Profesional</option>
                <option value="divertido">Divertido</option>
                <option value="directo">Directo y breve</option>
              </select>
            </div>
            <div>
              <div className="prop-label" style={{marginBottom:6}}>Largo</div>
              <select className="field" value={length} onChange={e=>setLength(e.target.value)}>
                <option value="corto">Corto (≈ 80 palabras)</option>
                <option value="medio">Medio (≈ 180 palabras)</option>
                <option value="largo">Largo (≈ 350 palabras)</option>
              </select>
            </div>
          </div>

          <div className="prop-label" style={{marginTop:18,marginBottom:8}}>Bloques a incluir</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {BLOCKS_OPT.map(b => {
              const on = blocks.includes(b.id);
              return (
                <button key={b.id} onClick={()=>toggleBlock(b.id)} style={{
                  padding:'5px 10px',
                  border: on?'1px solid var(--accent)':'1px solid var(--line)',
                  borderRadius:999,
                  background: on?'var(--accent-soft)':'var(--surface)',
                  color: on?'var(--accent)':'var(--fg-2)',
                  fontSize:12,cursor:'pointer',
                  display:'flex',alignItems:'center',gap:4,
                }}>
                  {on && <I.check size={10}/>}
                  {b.name}
                </button>
              );
            })}
          </div>

          {error && (
            <div style={{
              marginTop:16,padding:12,
              background:'color-mix(in oklab, var(--danger) 12%, transparent)',
              borderRadius:'var(--r-md)',
              fontSize:12,color:'var(--danger)',
              display:'flex',gap:8,
            }}>
              <I.x size={14} style={{marginTop:1,flexShrink:0}}/>
              <div><b>No pudimos generar la plantilla.</b> {error}</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <div style={{fontSize:11,color:'var(--fg-3)',flex:1}}>
            Usando <b style={{color:'var(--fg-2)'}}>{aiCfg.provider==='openai'?'OpenAI':aiCfg.provider==='google'?'Gemini':aiCfg.provider==='ollama'?'Ollama':aiCfg.provider==='openrouter'?'OpenRouter':'Claude'}</b> · {aiCfg.model || 'modelo por defecto'}
          </div>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={!prompt.trim() || loading || !configured} onClick={handleGen}>
            {loading ? <><I.clock size={13}/> Generando…</> : <><I.sparkles size={13}/> Generar plantilla</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Gallery of starter templates. Names and category labels are keyed — the
// underlying `cat` id stays stable in English so we can match it against
// a template's legacy folder string later.
function Gallery({ onBack, onPick }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const STARTERS = [
    { id:'g0',  catId:'all',        color:'#ffffff', variant:'blank', blank:true },
    { id:'g1',  catId:'newsletters',color:'#e8e7fe', variant:'newsletter' },
    { id:'g2',  catId:'welcome',    color:'#ece3fc', variant:'welcome' },
    { id:'g3',  catId:'thanks',     color:'#dce9f7', variant:'receipt' },
    { id:'g4',  catId:'sales',      color:'#dde2fb', variant:'promo' },
    { id:'g5',  catId:'sales',      color:'#e9e0f7', variant:'cart' },
    { id:'g6',  catId:'surveys',    color:'#e3e3f5', variant:'survey' },
    { id:'g7',  catId:'notices',    color:'#e4eaf6', variant:'receipt' },
    { id:'g8',  catId:'events',     color:'#ecdbea', variant:'welcome' },
    { id:'g9',  catId:'notices',    color:'#e8e5f3', variant:'internal' },
    { id:'g10', catId:'thanks',     color:'#f4e3db', variant:'welcome' },
    { id:'g11', catId:'sales',      color:'#f0ddd5', variant:'promo' },
  ];
  const CATS = ['all','welcome','newsletters','sales','thanks','events','notices','surveys'];
  const [cat, setCat] = React.useState('all');
  const items = STARTERS.filter(s => cat==='all' || s.catId===cat);
  // Each starter becomes a "template" with a translated name + category label,
  // plus a `folder` string for downstream code that expects that shape.
  const decorate = (s) => ({
    ...s,
    name: t(`gallery.starter.${s.id}.name`),
    cat:  t(`gallery.cat.${s.catId}`),
    folder: t(`gallery.cat.${s.catId}`),
  });
  return (
    <div className="editor">
      <div className="editor-top">
        <button className="btn ghost sm" onClick={onBack}><I.chevronL size={14}/> {t('gallery.back')}</button>
        <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,letterSpacing:-0.2}}>{t('gallery.title')}</div>
        <div className="grow"/>
        <div className="search">
          <span className="si"><I.search size={14}/></span>
          <input placeholder={t('gallery.search.placeholder')}/>
        </div>
        <ThemeToggleBtn/>
      </div>
      <div style={{display:'flex',gap:6,padding:'12px 24px',borderBottom:'1px solid var(--line)',background:'var(--surface)',overflowX:'auto'}}>
        {CATS.map(c => (
          <button key={c} className={`btn sm ${cat===c?'primary':''}`} onClick={()=>setCat(c)}>{t(`gallery.cat.${c}`)}</button>
        ))}
      </div>
      <div className="dash-body">
        {items.length === 0 ? (
          <EmptyState
            illustration="gallery"
            title={t('gallery.empty.title', {cat: t(`gallery.cat.${cat}`)})}
            msg={t('gallery.empty.msg')}
            primaryAction={{ label:t('gallery.empty.btn.viewAll'), icon:'grid', onClick:()=>setCat('all') }}
            secondaryAction={{ label:t('gallery.empty.btn.blank'), icon:'plus', onClick:()=>onPick(decorate(STARTERS[0])) }}
          />
        ) : (
        <div className="grid-tpl">
          {items.map(s => {
            const d = decorate(s);
            return (
              <div key={s.id} className="tpl-card" onClick={()=>onPick(d)}>
                <div className="tpl-thumb">
                  <TplThumb t={d}/>
                </div>
                <div className="tpl-meta">
                  <div className="tpl-title">{d.name}</div>
                  <div className="tpl-sub">{d.cat}</div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, Gallery, TplThumb });
