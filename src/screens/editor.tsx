// Editor — section-based canvas

function BlockTile({ b, onClick }) {
  const Ico = I[b.icon] || I.grid;
  return (
    <div
      className="block-tile"
      draggable
      onClick={onClick}
      onDragStart={(e)=>{
        e.dataTransfer.setData('text/x-mc-block', b.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <div className="block-ic"><Ico size={18}/></div>
      <div>{b.name}</div>
    </div>
  );
}

function ContentPanel({ onAddBlock, onAddSection }) {
  const [q, setQ] = React.useState('');
  const cats = [
    { h:'Secciones listas', isSection:true, items: SECTION_PRESETS },
    { h:'Básicos', items: BLOCKS_BASIC },
    { h:'Contenido', items: BLOCKS_CONTENT },
    { h:'Productos y ventas', items: BLOCKS_ECOM },
    { h:'Redes sociales', items: BLOCKS_SOCIAL },
    { h:'Multimedia', items: BLOCKS_MEDIA },
    { h:'Avanzados', items: BLOCKS_ADV },
  ];
  const f = (arr) => arr.filter(b => b.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',flexShrink:0}}>
        <div className="search">
          <span className="si"><I.search size={13}/></span>
          <input placeholder="Busca un bloque o una sección…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div style={{fontSize:11,color:'var(--fg-3)',marginTop:8,lineHeight:1.5}}>Haz clic en un bloque para añadirlo al correo.</div>
      </div>
      <div className="side-body">
        {cats.map(c => {
          const items = f(c.items);
          if (!items.length) return null;
          if (c.isSection) {
            return (
              <div className="block-cat" key={c.h}>
                <h4>{c.h}</h4>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {items.map(p => (
                    <button
                      key={p.id}
                      className="block-tile"
                      style={{height:'auto',padding:0,flexDirection:'column',gap:0,overflow:'hidden'}}
                      draggable
                      onClick={()=>onAddSection(p)}
                      onDragStart={(e)=>{
                        e.dataTransfer.setData('text/x-mc-section', p.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                    >
                      <div style={{width:'100%',background:'var(--surface-2)',borderBottom:'1px solid var(--line)'}}>
                        <SectionPresetPreview preview={p.preview}/>
                      </div>
                      <div style={{padding:'6px 4px',fontSize:11}}>{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div className="block-cat" key={c.h}>
              <h4>{c.h}</h4>
              <div className="block-grid">{items.map(b => <BlockTile key={b.id} b={b} onClick={()=>onAddBlock(b.id)}/>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionPresetPreview({ preview }) {
  const bar = (w,h=4,mb=3)=> <div style={{width:`${w}%`,height:h,background:'var(--fg-3)',opacity:0.35,borderRadius:1,marginBottom:mb}}/>;
  const box = (h,bg='var(--surface-3)')=> <div style={{width:'100%',height:h,background:bg,borderRadius:2,marginBottom:3}}/>;
  const layouts = {
    blank: <div style={{padding:8,opacity:0.4,fontSize:10,textAlign:'center'}}>( vacía )</div>,
    hero: <div style={{padding:8,textAlign:'center'}}>{bar(60,6,4)}{bar(80,3)}{bar(70,3)}<div style={{width:'30%',height:8,background:'var(--accent)',margin:'4px auto 0',borderRadius:2}}/></div>,
    '2col': <div style={{padding:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}><div>{box(26)}{bar(80,3)}{bar(60,3)}</div><div>{box(26)}{bar(80,3)}{bar(60,3)}</div></div>,
    '3col': <div style={{padding:8,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:3}}>{[0,1,2].map(i=><div key={i}>{box(20)}{bar(90,3)}</div>)}</div>,
    cta: <div style={{padding:12,textAlign:'center'}}>{bar(70,4,5)}<div style={{width:'40%',height:10,background:'var(--accent)',margin:'0 auto',borderRadius:2}}/></div>,
    imgtext: <div style={{padding:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>{box(32)}<div>{bar(90,3)}{bar(85,3)}{bar(60,3)}</div></div>,
    products: <div style={{padding:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}><div>{box(30)}{bar(70,3)}</div><div>{box(30)}{bar(70,3)}</div></div>,
    footer: <div style={{padding:12,textAlign:'center'}}>{bar(50,3,3)}{bar(70,2,3)}{bar(40,2)}</div>,
  };
  return <div style={{width:'100%',height:70}}>{layouts[preview] || layouts.blank}</div>;
}

function SectionPresetPanel({ onAdd }) {
  return (
    <div className="side-body">
      <div style={{fontSize:11,color:'var(--fg-3)',letterSpacing:0.04,textTransform:'uppercase',marginBottom:10,fontWeight:600}}>Secciones listas</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {SECTION_PRESETS.map(p => (
          <button key={p.id} className="block-tile" style={{height:'auto',padding:0,flexDirection:'column',gap:0,overflow:'hidden'}} onClick={()=>onAdd(p)}>
            <div style={{width:'100%',background:'var(--surface-2)',borderBottom:'1px solid var(--line)'}}>
              <SectionPresetPreview preview={p.preview}/>
            </div>
            <div style={{padding:'6px 4px',fontSize:11}}>{p.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LayersPanel({ doc, selected, onSelect, onSelectBlock }) {
  return (
    <div className="side-body">
      <div style={{fontSize:11,color:'var(--fg-3)',letterSpacing:0.04,textTransform:'uppercase',marginBottom:8,fontWeight:600}}>Estructura</div>
      <div style={{fontSize:12,padding:'4px 6px',display:'flex',alignItems:'center',gap:6,background:'var(--surface-2)',borderRadius:4,marginBottom:4}}>
        <I.mail size={13}/><span style={{fontWeight:500}}>Todo el correo</span>
        <span style={{marginLeft:'auto',fontSize:11,color:'var(--fg-3)'}}>600 px de ancho</span>
      </div>
      <div style={{paddingLeft:6}}>
        {doc.map(s => (
          <React.Fragment key={s.id}>
            <div className={`layer-row ${selected?.type==='section' && selected.id===s.id?'on':''}`} onClick={()=>onSelect({type:'section',id:s.id})}>
              <span className="ic"><I.drag size={11}/></span>
              <span className="ic"><I.hero size={13}/></span>
              <span style={{fontWeight:500}}>{s.name}</span>
              <span style={{marginLeft:'auto',fontSize:10,color:'var(--fg-3)'}}>{s.layout}</span>
            </div>
            <div style={{paddingLeft:16}}>
              {s.columns.map((col,ci) => col.blocks.map(b => (
                <div key={b.id} className={`layer-row ${selected?.type==='block' && selected.id===b.id?'on':''}`} onClick={()=>onSelect({type:'block',id:b.id,sectionId:s.id,colIdx:ci})}>
                  <span className="ic"><I.drag size={10}/></span>
                  <span className="ic"><I.type size={11}/></span>
                  <span style={{fontSize:11}}>{b.type}</span>
                </div>
              )))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="side-body">
      <div style={{fontSize:11,color:'var(--fg-3)',letterSpacing:0.04,textTransform:'uppercase',marginBottom:10,fontWeight:600}}>Versiones guardadas de los últimos 7 días</div>
      {HISTORY.map(h => (
        <div key={h.id} style={{
          display:'flex',gap:10,padding:'10px 8px',borderRadius:'var(--r-md)',
          background:h.current?'var(--accent-soft)':'transparent',
          marginBottom:2,cursor:'pointer',
        }}>
          <div style={{width:6,marginTop:5}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:h.current?'var(--accent)':'var(--line-2)'}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:h.current?600:500,color:h.current?'var(--accent)':'var(--fg)'}}>{h.label}</div>
            <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2}}>{h.ts} · {h.author}</div>
          </div>
          {!h.current && <button className="btn icon sm ghost" title="Restaurar"><I.history size={12}/></button>}
        </div>
      ))}
    </div>
  );
}

// Pixel ruler that sits above the canvas. Renders tick marks every 50px and
// numbered labels every 100px. Honors editor.ruler per workspace.
function CanvasRuler() {
  const ticks = [];
  for (let x = 0; x <= 1200; x += 10) {
    const major = x % 100 === 0;
    const mid = x % 50 === 0;
    ticks.push(
      <div key={x} style={{
        position:'absolute',
        left:`calc(50% + ${x - 600}px)`,
        bottom:0,
        width:1,
        height: major ? 10 : mid ? 6 : 3,
        background:'var(--fg-3)',
        opacity: major ? 0.7 : mid ? 0.45 : 0.25,
      }}/>
    );
    if (major && x > 0) {
      ticks.push(
        <div key={'l'+x} style={{
          position:'absolute',
          left:`calc(50% + ${x - 600}px)`,
          bottom:11,
          fontSize:9,
          color:'var(--fg-3)',
          fontFamily:'var(--font-mono)',
          transform:'translateX(-50%)',
        }}>{x}</div>
      );
    }
  }
  return (
    <div style={{
      position:'relative',
      height:24,
      borderBottom:'1px solid var(--line)',
      background:'var(--surface-2)',
      overflow:'hidden',
      flexShrink:0,
    }}>
      {ticks}
    </div>
  );
}

// Quick chips for the workspace's brand display/body fonts. Falls back to
// nothing if the workspace hasn't configured any brand fonts.
function BrandFontsGroup({ current, onPick }) {
  const [brand, setBrand] = React.useState(() => window.stStorage?.getWSSetting('brand', {}) || {});
  React.useEffect(() => {
    const refresh = () => setBrand(window.stStorage?.getWSSetting('brand', {}) || {});
    const onSettings = (e) => {
      if (e.detail?.scope === 'workspace' && e.detail?.key === 'brand') refresh();
    };
    window.addEventListener('st:settings-change', onSettings);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      window.removeEventListener('st:settings-change', onSettings);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);

  const items = [];
  if (brand.fontDisplay) items.push({ label: brand.fontDisplay, role: 'Título de marca' });
  if (brand.fontBody) items.push({ label: brand.fontBody, role: 'Cuerpo de marca' });
  if (items.length === 0) return null;

  return (
    <div className="prop-group">
      <div className="prop-label">Fuentes de marca</div>
      <div style={{display:'grid',gap:4}}>
        {items.map((it) => (
          <button
            key={it.label+'_'+it.role}
            className={`btn ${current===it.label?'primary':''}`}
            style={{justifyContent:'space-between',fontFamily:it.label}}
            onClick={()=>onPick(it.label)}>
            <span>{it.label}</span>
            <span style={{fontSize:10.5,opacity:0.7,fontFamily:'var(--font-sans)'}}>{it.role}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionProps({ section, onChange }) {
  const [tab,setTab] = React.useState('style');
  if (!section) return null;
  const updStyle = (k,v) => onChange({ ...section, style: {...section.style, [k]:v} });
  const upd = (k,v) => onChange({ ...section, [k]:v });
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:24,height:24,borderRadius:'var(--r-sm)',background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center'}}>
          <I.hero size={12}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <input value={section.name} onChange={e=>upd('name',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:500,width:'100%'}}/>
          <div style={{fontSize:10,color:'var(--fg-3)'}}>Bloque de sección</div>
        </div>
        <button className="btn icon sm ghost" title="Duplicar"><I.copy size={13}/></button>
        <button className="btn icon sm ghost" title="Eliminar"><I.trash size={13}/></button>
      </div>
      <div className="side-tabs">
        <Tab label="Estilo" active={tab==='style'} onClick={()=>setTab('style')}/>
        <Tab label="Layout" active={tab==='layout'} onClick={()=>setTab('layout')}/>
        <Tab label="Tipografía" active={tab==='type'} onClick={()=>setTab('type')}/>
      </div>
      <div className="side-body">
        {tab==='style' && (
          <>
            <div className="prop-group">
              <div className="prop-label">Presets rápidos</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                {SECTION_STYLE_PRESETS.map(p => (
                  <button key={p.id} className="block-tile" style={{height:54,padding:0,overflow:'hidden',background:p.bg,color:p.text,border:'1px solid var(--line)',flexDirection:'column',gap:0}}
                    onClick={()=>onChange({...section, style:{...section.style, bg:p.bg, text:p.text}})}>
                    <div style={{fontSize:10,fontWeight:500,padding:'4px 0'}}>{p.name}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="prop-group">
              <div className="prop-label">Fondo</div>
              <div className="prop-row">
                <label>Color</label>
                <ColorInput value={section.style.bg} onChange={v=>updStyle('bg',v)}/>
              </div>
            </div>
            <div className="prop-group">
              <div className="prop-label">Texto</div>
              <div className="prop-row">
                <label>Color</label>
                <ColorInput value={section.style.text} onChange={v=>updStyle('text',v)}/>
              </div>
              <div className="prop-row">
                <label>Alineación</label>
                <div className="seg" style={{width:'100%'}}>
                  {['left','center','right'].map(a => (
                    <button key={a} className={section.style.align===a?'on':''} onClick={()=>updStyle('align',a)}>
                      {a==='left'?<I.alignL size={12}/>:a==='center'?<I.alignC size={12}/>:<I.alignR size={12}/>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="prop-group">
              <div className="prop-label">Espaciado</div>
              <div className="prop-row">
                <label>Padding</label>
                <Num value={section.style.padding} onChange={v=>updStyle('padding',v)} min={0} max={80}/>
              </div>
            </div>
          </>
        )}
        {tab==='layout' && (
          <div className="prop-group">
            <div className="prop-label">Columnas</div>
            <div className="seg" style={{width:'100%'}}>
              {[
                {v:'1col',l:'1'}, {v:'2col',l:'2'}, {v:'3col',l:'3'}, {v:'sidebar',l:'1:2'}
              ].map(o => (
                <button key={o.v} className={section.layout===o.v?'on':''} onClick={()=>{
                  const cols = o.v==='1col'?[{w:100,blocks:section.columns.flatMap(c=>c.blocks)}]
                    : o.v==='2col'?[{w:50,blocks:section.columns[0]?.blocks||[]},{w:50,blocks:section.columns[1]?.blocks||[]}]
                    : o.v==='3col'?[{w:33,blocks:section.columns[0]?.blocks||[]},{w:33,blocks:section.columns[1]?.blocks||[]},{w:34,blocks:section.columns[2]?.blocks||[]}]
                    : [{w:33,blocks:section.columns[0]?.blocks||[]},{w:67,blocks:section.columns[1]?.blocks||[]}];
                  onChange({...section, layout:o.v, columns:cols});
                }}>{o.l}</button>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--fg-3)',marginTop:10,lineHeight:1.5}}>Las columnas se apilan en móvil automáticamente.</div>
          </div>
        )}
        {tab==='type' && (
          <>
            <BrandFontsGroup current={section.style.font} onPick={v=>updStyle('font',v)}/>
            <div className="prop-group">
              <div className="prop-label">Familia tipográfica</div>
              <div style={{display:'grid',gap:4}}>
                {FONT_OPTIONS.map(f => (
                  <button key={f.id} className={`btn ${section.style.font===f.id?'primary':''}`} style={{justifyContent:'flex-start',fontFamily:f.css}} onClick={()=>updStyle('font',f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SaveBtn({ saveState, onClick }) {
  const base = { display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' };
  if (saveState === 'idle') {
    return (
      <div className="btn ghost sm" title="Todo guardado"
        style={{...base, color:'#2bb07f', cursor:'default', pointerEvents:'none'}}>
        <I.check size={13}/>
        <span>Todo guardado</span>
      </div>
    );
  }
  if (saveState === 'saving') {
    return (
      <div className="btn ghost sm" title="Guardando…"
        style={{...base, color:'var(--fg-3)', opacity:0.85, pointerEvents:'none'}}>
        <I.loader size={13} className="spin"/>
        <span>Guardando…</span>
      </div>
    );
  }
  if (saveState === 'error') {
    return (
      <button className="btn primary sm" onClick={onClick} title="No se pudo guardar — clic para reintentar"
        style={{...base, background:'#e04f4f', borderColor:'#e04f4f', color:'#fff'}}>
        <I.info size={13}/>
        <span>Reintentar</span>
      </button>
    );
  }
  // dirty
  return (
    <button className="btn primary sm" onClick={onClick} title="Guardar ahora"
      style={base}>
      <I.upload size={13}/>
      <span>Guardar</span>
    </button>
  );
}

// Editor preferences pulled from the current workspace's editor settings.
// Defaults match the <Switch> defaults in EditorSection (ruler/autosave on,
// grid 16px). Refreshes when the user changes the prefs in Settings or
// switches workspace.
function useEditorPrefs() {
  const get = () => {
    const e = window.stStorage?.getWSSetting('editor', {}) || {};
    return {
      autosave: e.autosave !== false,
      grid: typeof e.grid === 'number' && e.grid > 0 ? e.grid : 16,
      ruler: e.ruler !== false,
    };
  };
  const [prefs, setPrefs] = React.useState(get);
  React.useEffect(() => {
    const refresh = () => setPrefs(get());
    const onSettings = (e) => {
      if (e.detail?.scope === 'workspace' && e.detail?.key === 'editor') refresh();
    };
    window.addEventListener('st:settings-change', onSettings);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      window.removeEventListener('st:settings-change', onSettings);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return prefs;
}

function Editor({ template, onBack, onPreview, onExport, onTestSend, onOpenVars, onReview }) {
  const [doc, setDoc] = React.useState([]);
  const [vars, setVars] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [sel, setSel] = React.useState({type:'section',id:'s1'});
  const [device, setDevice] = React.useState('desktop');
  const [leftTab, setLeftTab] = React.useState('content');
  const [rightTab, setRightTab] = React.useState('props');
  const [name, setName] = React.useState(template?.name || 'Plantilla sin título');
  const [zoom, setZoom] = React.useState(100);
  const [improveBlock, setImproveBlock] = React.useState(null);
  const [saveState, setSaveState] = React.useState('idle'); // idle | dirty | saving | error
  const [showTour, setShowTour] = React.useState(() => {
    try { return !window.stStorage.getSetting('tour-seen', false); } catch(e) { return false; }
  });
  const editorPrefs = useEditorPrefs();

  const templateIdRef = React.useRef(template?.id || null);
  const templateJsonRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);
  const savingRef = React.useRef(false);
  const skipNextSaveRef = React.useRef(true);
  // Ref mirrors of doc/name/vars so flushSave always reads the latest content —
  // even when called from outside (workspace-switch guard, onBack, etc.).
  const nameRef = React.useRef(name);
  const docRef = React.useRef(doc);
  const varsRef = React.useRef(vars);
  nameRef.current = name;
  docRef.current = doc;
  varsRef.current = vars;

  React.useEffect(() => {
    const h = (e) => setImproveBlock(e.detail.block);
    window.addEventListener('st:improve', h);
    const t = () => setShowTour(true);
    window.addEventListener('st:start-tour', t);
    return () => {
      window.removeEventListener('st:improve', h);
      window.removeEventListener('st:start-tour', t);
    };
  }, []);

  // ─── Load doc from storage when the template id changes ──────────
  React.useEffect(() => {
    if (!template?.id) { setLoaded(true); return; }
    let cancelled = false;
    templateIdRef.current = template.id;
    skipNextSaveRef.current = true;
    (async () => {
      const tpl = await window.stTemplates.read(template.id);
      if (cancelled) return;
      templateJsonRef.current = tpl;
      const sections = tpl?.doc?.sections;
      setDoc(Array.isArray(sections) ? sections : []);
      // Backward-compat: pre-Bundle G.1 templates don't have a `vars` field.
      // Inherit from workspace defaults so they're not blank — the next save
      // will persist the inherited list into this template.
      const loadedVars = Array.isArray(tpl?.vars)
        ? tpl.vars
        : (window.stStorage.getWSSetting('vars', null) || window.VARIABLES || []);
      setVars(loadedVars);
      setName(tpl?.name || template.name || 'Plantilla sin título');
      // Reset selection to the first section (or clear if empty)
      const firstId = Array.isArray(sections) && sections[0]?.id;
      setSel(firstId ? { type:'section', id:firstId } : null);
      setLoaded(true);
      setSaveState('idle');
    })();
    return () => { cancelled = true; };
  }, [template?.id]);

  // ─── Debounced save ──────────────────────────────────────────────
  // Serialized: if a save is in flight, a new flush waits for it to complete
  // before starting — so workspace-switch → confirm.flush never returns
  // before the pending IPC resolves against the old workspace.
  const flushSave = React.useCallback(async () => {
    if (!templateIdRef.current) return;
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    while (savingRef.current) {
      await new Promise((r) => setTimeout(r, 20));
    }
    savingRef.current = true;
    setSaveState('saving');
    try {
      const patched = {
        ...(templateJsonRef.current || {}),
        id: templateIdRef.current,
        schemaVersion: 1,
        name: nameRef.current,
        doc: { sections: docRef.current },
        vars: varsRef.current,
      };
      const result = await window.stTemplates.write(templateIdRef.current, patched);
      if (result) {
        templateJsonRef.current = patched;
        setSaveState('idle');
        // Optional notification, gated by notif.saved (off by default).
        window.notify && window.notify('saved', {
          kind: 'ok',
          title: 'Se guardó la plantilla',
          msg: nameRef.current,
          ttl: 1800,
        });
      } else {
        setSaveState('error');
      }
    } catch (err) {
      console.error('[Editor] save failed', err);
      setSaveState('error');
    } finally {
      savingRef.current = false;
    }
  }, []);

  const flushSaveRef = React.useRef(flushSave);
  React.useEffect(() => { flushSaveRef.current = flushSave; }, [flushSave]);

  // Schedule a save whenever doc/name/vars changes (except on initial hydration).
  // Honors editor.autosave per workspace: if disabled, leaves the editor in
  // 'dirty' state until the user clicks Guardar manually.
  React.useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return; }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState('dirty');
    if (!editorPrefs.autosave) return;
    saveTimerRef.current = setTimeout(() => { flushSaveRef.current(); }, 800);
  }, [doc, name, vars, loaded, editorPrefs.autosave]);

  // Expose contract for the workspace-switch guard in src/lib/workspaces.tsx
  // and for VariablesModal / TestSendModal which read template vars.
  React.useEffect(() => {
    window.__stEditor = {
      isDirty: () => saveState === 'dirty' || savingRef.current || !!saveTimerRef.current,
      flush: () => flushSaveRef.current(),
      getTemplateId: () => templateIdRef.current,
      getVars: () => varsRef.current,
      setVars: (next) => setVars(next || []),
    };
  }, [saveState]);

  // On unmount: flush pending write and release the global.
  React.useEffect(() => () => {
    if (flushSaveRef.current) flushSaveRef.current();
    if (window.__stEditor) delete window.__stEditor;
  }, []);

  const selSection = sel?.type==='section' ? doc.find(s=>s.id===sel.id) : doc.find(s=>s.id===sel?.sectionId);
  const selBlock = sel?.type==='block' ? selSection?.columns.flatMap(c=>c.blocks).find(b=>b.id===sel.id) : null;

  const updateSection = (updated) => setDoc(d => d.map(s => s.id===updated.id ? updated : s));
  const updateBlock = (updated) => setDoc(d => d.map(s => s.id===sel.sectionId ? {
    ...s, columns: s.columns.map(col => ({...col, blocks: col.blocks.map(b => b.id===updated.id ? updated : b)}))
  } : s));
  // Inline-canvas edit: deep-merge a content patch into the block's data.
  // Called by each block renderer via `onEdit(patch)` on blur. Doesn't need
  // the block to be pre-selected — sectionId comes from the SectionView.
  const editBlockContent = (sectionId, block, patch) => setDoc(d => d.map(s => s.id===sectionId ? {
    ...s, columns: s.columns.map(col => ({...col, blocks: col.blocks.map(b => {
      if (b.id !== block.id) return b;
      const nextData = { ...(b.data || {}) };
      for (const k of Object.keys(patch || {})) {
        const v = patch[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          nextData[k] = { ...(nextData[k] || {}), ...v };
        } else {
          nextData[k] = v;
        }
      }
      return { ...b, data: nextData };
    })}))
  } : s));
  const deleteBlock = (sectionId, blockId) => {
    setDoc(d => d.map(s => s.id===sectionId ? {
      ...s, columns: s.columns.map(col => ({...col, blocks: col.blocks.filter(b => b.id!==blockId)}))
    } : s));
    if (sel?.type==='block' && sel.id===blockId) setSel({type:'section',id:sectionId});
  };
  const moveBlock = (sectionId, colIdx, blockId, dir) => {
    setDoc(d => d.map(s => {
      if (s.id !== sectionId) return s;
      return {...s, columns: s.columns.map((c,ci) => {
        if (ci !== colIdx) return c;
        const i = c.blocks.findIndex(b => b.id===blockId);
        const j = i + dir;
        if (i<0 || j<0 || j>=c.blocks.length) return c;
        const copy = [...c.blocks];
        [copy[i],copy[j]] = [copy[j],copy[i]];
        return {...c, blocks: copy};
      })};
    }));
  };
  const addSection = (preset, atIndex=null) => {
    const newId = 's'+Date.now();
    const cols = preset.layout==='2col' ? [{w:50,blocks:[]},{w:50,blocks:[]}]
      : preset.layout==='3col' ? [{w:33,blocks:[]},{w:33,blocks:[]},{w:34,blocks:[]}]
      : [{w:100,blocks:[]}];
    const newSection = { id:newId, name:preset.name, layout:preset.layout, style:defaultSectionStyle(), columns:cols };
    setDoc(d => {
      if (atIndex === null || atIndex >= d.length) return [...d, newSection];
      const copy = [...d];
      copy.splice(atIndex, 0, newSection);
      return copy;
    });
    setSel({type:'section',id:newId});
  };
  const deleteSection = (id) => {
    setDoc(d => d.filter(s => s.id!==id));
    setSel(null);
  };
  const duplicateSection = (id) => {
    setDoc(d => {
      const i = d.findIndex(s => s.id===id);
      const orig = d[i];
      const copy = JSON.parse(JSON.stringify(orig));
      copy.id = 's'+Date.now();
      copy.name = orig.name + ' (copia)';
      copy.columns.forEach(c => c.blocks.forEach(b => b.id = 'b'+Math.random().toString(36).slice(2,8)));
      return [...d.slice(0,i+1), copy, ...d.slice(i+1)];
    });
  };
  const moveSection = (id, dir) => {
    setDoc(d => {
      const i = d.findIndex(s => s.id===id);
      const j = i + dir;
      if (j<0 || j>=d.length) return d;
      const copy = [...d];
      [copy[i],copy[j]] = [copy[j],copy[i]];
      return copy;
    });
  };
  const addBlockToEnd = (blockType) => {
    const id = 'b'+Math.random().toString(36).slice(2,8);
    const newBlock = { id, type:blockType, data:{} };
    // Add to selected section's first column, or last section's first column
    const targetSectionId = selSection?.id || doc[doc.length-1]?.id;
    if (!targetSectionId) return;
    setDoc(d => d.map(s => s.id===targetSectionId ? {
      ...s, columns: s.columns.map((c,i) => i===0 ? {...c, blocks:[...c.blocks, newBlock]} : c)
    } : s));
    setSel({type:'block', id, sectionId:targetSectionId, colIdx:0});
  };
  const addBlankBlockInColumn = (sectionId, colIdx, atIndex, blockType='text') => {
    const id = 'b'+Math.random().toString(36).slice(2,8);
    const defaultData = blockType==='text' ? {body:'Nuevo bloque — edita aquí.'} : {};
    const newBlock = { id, type:blockType, data:defaultData };
    setDoc(d => d.map(s => s.id===sectionId ? {
      ...s, columns: s.columns.map((c,i) => {
        if (i !== colIdx) return c;
        const blocks = [...c.blocks];
        blocks.splice(atIndex, 0, newBlock);
        return {...c, blocks};
      })
    } : s));
    setSel({type:'block', id, sectionId, colIdx});
  };
  // Resolve a section preset id from SECTION_PRESETS — used by drop handlers
  // that only carry the preset id over `text/x-mc-section`.
  const resolvePreset = (id) => SECTION_PRESETS.find(x => x.id === id);
  const addBlankSection = (atIndex) => {
    const newId = 's'+Date.now();
    const newSection = { id:newId, name:'Sección', layout:'1col', style:defaultSectionStyle({padding:40}), columns:[{w:100,blocks:[]}] };
    setDoc(d => {
      const copy = [...d];
      copy.splice(atIndex, 0, newSection);
      return copy;
    });
    setSel({type:'section',id:newId});
  };

  return (
    <div className="editor" data-view={device}>
      <div className="editor-top">
        {/* Zone A — context */}
        <button className="btn icon ghost sm" onClick={async ()=>{ await flushSaveRef.current(); onBack(); }} title="Volver a mis plantillas" aria-label="Volver"><I.chevronL size={14}/></button>
        <div className="name">
          <input value={name} onChange={e=>setName(e.target.value)}/>
          <div className="meta">
            {template?.folder || templateJsonRef.current?.folder || 'Sin carpeta'} · {doc.length} secciones
          </div>
        </div>

        {/* Zone B — view mode (centered) */}
        <div className="grow"/>
        <div className="device-toggle" data-tour="device-toggle">
          <button className={device==='desktop'?'on':''} onClick={()=>setDevice('desktop')} title="Escritorio (600 px)" aria-label="Escritorio"><I.monitor size={13}/></button>
          <button className={device==='mobile'?'on':''} onClick={()=>setDevice('mobile')} title="Móvil (375 px)" aria-label="Móvil"><I.phone size={13}/></button>
        </div>
        <div className="grow"/>

        {/* Zone C — utility cluster */}
        <div className="icon-cluster">
          <button className="btn icon ghost sm" title="Deshacer (⌘Z)" aria-label="Deshacer"><I.undo size={13}/></button>
          <button className="btn icon ghost sm" title="Rehacer (⌘⇧Z)" aria-label="Rehacer"><I.redo size={13}/></button>
          <SaveBtn saveState={saveState} onClick={()=>flushSaveRef.current()}/>
          <ThemeToggleBtn/>
          <button className="btn icon ghost sm" onClick={()=>window.dispatchEvent(new CustomEvent('st:cmd-open'))} title="Buscar (⌘K)" aria-label="Buscar"><I.search size={13}/></button>
        </div>

        {/* Zone D — actions */}
        <button className="btn ghost sm" onClick={onOpenVars}><I.braces size={13}/> Etiquetas</button>
        <button className="btn ghost sm" onClick={async ()=>{ await flushSaveRef.current(); onPreview(); }}><I.eye size={13}/> Vista previa</button>
        <button className="btn ghost sm" onClick={onReview} title="Revisar antes de enviar (⌘⇧R)" data-tour="review-btn"><I.check size={13}/> Revisar</button>
        <button className="btn sm" onClick={onTestSend}><I.send size={13}/> Enviar prueba</button>
        <button className="btn primary sm" onClick={onExport} data-tour="export-btn"><I.download size={13}/> Exportar</button>
      </div>

      <div className="editor-body">
        <aside className="side-panel left" data-tour="left-panel">
          <div className="side-tabs" style={{padding:'8px 8px 4px'}}>
            <Tab label="Contenido" active={leftTab==='content'} onClick={()=>setLeftTab('content')}/>
            <Tab label="Capas" active={leftTab==='layers'} onClick={()=>setLeftTab('layers')}/>
            <Tab label="Historial" active={leftTab==='history'} onClick={()=>setLeftTab('history')}/>
          </div>
          {leftTab==='content' && <ContentPanel onAddBlock={addBlockToEnd} onAddSection={addSection}/>}
          {leftTab==='layers' && <LayersPanel doc={doc} selected={sel} onSelect={setSel}/>}
          {leftTab==='history' && <HistoryPanel/>}
        </aside>

        <div className="canvas-col" data-tour="canvas">
          {editorPrefs.ruler && <CanvasRuler/>}
          <div className="canvas-rulers" style={{
            // editor.grid (per-workspace) overrides the CSS-default 24px grid.
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${editorPrefs.grid-1}px, color-mix(in oklab, var(--line) 40%, transparent) ${editorPrefs.grid-1}px ${editorPrefs.grid}px), repeating-linear-gradient(90deg, transparent 0 ${editorPrefs.grid-1}px, color-mix(in oklab, var(--line) 40%, transparent) ${editorPrefs.grid-1}px ${editorPrefs.grid}px)`,
            backgroundColor: 'var(--bg)',
          }}>
            <div className="canvas-frame" style={{transform:`scale(${zoom/100})`,transformOrigin:'top center'}}>
              {doc.length === 0 ? (
                <div
                  style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-md)',padding:'20px 0'}}
                  onDragOver={(e)=>{
                    if (Array.from(e.dataTransfer.types).includes('text/x-mc-section')) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }
                  }}
                  onDrop={(e)=>{
                    const id = e.dataTransfer.getData('text/x-mc-section');
                    if (!id) return;
                    const p = resolvePreset(id);
                    if (!p) return;
                    e.preventDefault();
                    addSection(p, 0);
                  }}
                >
                  <EmptyState
                    illustration="editor-empty"
                    title="Empieza añadiendo una sección"
                    msg="Cada correo se arma con secciones (una fila que contiene columnas de bloques). Elige una de la izquierda o empieza en blanco."
                    primaryAction={{ label:'Añadir sección en blanco', icon:'plus', onClick:()=>addBlankSection(0) }}
                    tips={[
                      'Pulsa una plantilla de sección de la izquierda («Portada», «Dos columnas», «Llamada a la acción»…) y aparece aquí.',
                      'Arrastra bloques sobre cualquier sección para rellenarla.',
                    ]}
                  />
                </div>
              ) : (<>
              <SectionInsertBtn
                onClick={()=>addBlankSection(0)}
                onDropPreset={(id)=>{ const p=resolvePreset(id); if (p) addSection(p, 0); }}
              />
              {doc.map((s, si) => (
                <React.Fragment key={s.id}>
                  <SectionView
                    section={s}
                    selected={sel?.type==='section' && sel.id===s.id}
                    selectedBlockId={sel?.type==='block' ? sel.id : null}
                    onSelectSection={()=>setSel({type:'section',id:s.id})}
                    onSelectBlock={(b, colIdx)=>setSel({type:'block',id:b.id,sectionId:s.id,colIdx})}
                    onMoveUp={si>0 ? ()=>moveSection(s.id,-1) : null}
                    onMoveDown={si<doc.length-1 ? ()=>moveSection(s.id,1) : null}
                    onDuplicate={()=>duplicateSection(s.id)}
                    onDelete={doc.length>1 ? ()=>deleteSection(s.id) : null}
                    onMoveBlock={(colIdx,blockId,dir)=>moveBlock(s.id,colIdx,blockId,dir)}
                    onDeleteBlock={(blockId)=>deleteBlock(s.id,blockId)}
                    onAddBlankBlock={(colIdx,atIdx)=>addBlankBlockInColumn(s.id,colIdx,atIdx)}
                    onDropBlock={(colIdx, atIdx, blockType)=>addBlankBlockInColumn(s.id, colIdx, atIdx, blockType)}
                    onEditBlock={(block, patch)=>editBlockContent(s.id, block, patch)}
                  />
                  <SectionInsertBtn
                    onClick={()=>addBlankSection(si+1)}
                    onDropPreset={(id)=>{ const p=resolvePreset(id); if (p) addSection(p, si+1); }}
                  />
                </React.Fragment>
              ))}
              </>)}
            </div>
          </div>
          <div className="canvas-foot">
            <button className="btn icon sm ghost" onClick={()=>setZoom(z=>Math.max(50,z-10))}>−</button>
            <div style={{fontSize:12,padding:'0 6px',minWidth:40,textAlign:'center'}}>{zoom}%</div>
            <button className="btn icon sm ghost" onClick={()=>setZoom(z=>Math.min(200,z+10))}>+</button>
            <div className="vdivider"/>
            <button className="btn sm ghost" onClick={()=>setZoom(100)} style={{fontSize:11}}>Ajustar</button>
          </div>
        </div>

        <aside className="side-panel" data-tour="right-panel">
          <div className="side-tabs" style={{padding:'8px 8px 4px'}}>
            <Tab label={selBlock?'Bloque':'Sección'} active={rightTab==='props'} onClick={()=>setRightTab('props')}/>
            <Tab label="Diseño global" active={rightTab==='design'} onClick={()=>setRightTab('design')}/>
          </div>
          {rightTab==='props' && selBlock && <BlockProps block={selBlock} onChange={updateBlock} onDelete={()=>deleteBlock(sel.sectionId, sel.id)}/>}
          {rightTab==='props' && !selBlock && selSection && <SectionProps section={selSection} onChange={updateSection}/>}
          {rightTab==='props' && !selBlock && !selSection && <div className="side-body"><div style={{fontSize:12,color:'var(--fg-3)'}}>Selecciona una sección o bloque en el canvas.</div></div>}
          {rightTab==='design' && <DesignPanel/>}
        </aside>
      </div>
      {improveBlock && <ImproveAIModal block={improveBlock} onClose={()=>setImproveBlock(null)} onApply={(newBlock)=>{ updateBlock(newBlock); setImproveBlock(null); }}/>}
      {showTour && <EditorTour onClose={()=>setShowTour(false)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Improve AI Modal — reescribe el texto de un bloque seleccionado
// ════════════════════════════════════════════════════════════════
function ImproveAIModal({ block, onClose, onApply }) {
  const aiCfg = window.stStorage.getSetting('ai', {});
  const [action, setAction] = React.useState('rewrite');
  const [extra, setExtra] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [variants, setVariants] = React.useState([]);
  const [error, setError] = React.useState(null);

  const ACTIONS = [
    {id:'rewrite', t:'Reescribir', d:'Manteniendo el sentido, con otras palabras', icon:'wand'},
    {id:'shorten', t:'Acortar',    d:'Más conciso, mismo mensaje',                icon:'minus'},
    {id:'expand',  t:'Ampliar',    d:'Más contexto, un poco más largo',            icon:'plus'},
    {id:'tone',    t:'Cambiar tono', d:'Más cálido, profesional, divertido…',      icon:'palette'},
    {id:'translate', t:'Traducir',  d:'A inglés, portugués u otro idioma',         icon:'braces'},
    {id:'fix',     t:'Corregir',   d:'Ortografía, gramática, claridad',           icon:'check'},
  ];

  const currentText = block.data?.content?.text || block.data?.content?.label || block.data?.text || block.data?.label || '(sin texto)';

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const result = await window.stAI.improveText({ block, action, extra });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || 'No se pudo generar variantes.');
      setVariants([]);
      return;
    }
    setVariants(result.variants.map((t, i) => ({
      t,
      label: `Variante ${i + 1}`,
    })));
  };

  const applyVariant = (t) => {
    const next = JSON.parse(JSON.stringify(block));
    next.data = next.data || {};
    next.data.content = next.data.content || {};
    if (block.type==='button') next.data.content.label = t;
    else next.data.content.text = t;
    onApply(next);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pop" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}>
        <div className="modal-head">
          <div style={{width:32,height:32,borderRadius:8,background:'var(--accent)',color:'#fff',display:'grid',placeItems:'center'}}>
            <I.sparkles size={16}/>
          </div>
          <div style={{flex:1}}>
            <h3>Mejorar este bloque con IA</h3>
            <div className="sub">Bloque tipo <b>{block.type}</b> · Elige qué hacer y te propongo varias versiones.</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={15}/></button>
        </div>
        <div className="modal-body">
          <div style={{padding:'10px 12px',background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:12.5,lineHeight:1.5,marginBottom:16,color:'var(--fg-2)',borderLeft:'3px solid var(--accent)'}}>
            <div style={{fontSize:10.5,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Texto actual</div>
            {currentText}
          </div>

          <div className="prop-label" style={{marginBottom:8}}>¿Qué hacemos con este texto?</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:14}}>
            {ACTIONS.map(a => {
              const Ico = I[a.icon] || I.wand;
              const on = action === a.id;
              return (
                <button key={a.id} onClick={()=>setAction(a.id)} style={{
                  textAlign:'left',padding:'9px 10px',
                  border: on?'1.5px solid var(--accent)':'1px solid var(--line)',
                  borderRadius:'var(--r-md)',
                  background: on?'var(--accent-soft)':'var(--surface)',
                  cursor:'pointer',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:500}}>
                    <Ico size={12}/> {a.t}
                  </div>
                  <div style={{fontSize:10.5,color:'var(--fg-3)',marginTop:2,lineHeight:1.3}}>{a.d}</div>
                </button>
              );
            })}
          </div>

          <div className="prop-label" style={{marginBottom:6}}>Instrucción extra (opcional)</div>
          <input className="field" value={extra} onChange={e=>setExtra(e.target.value)} placeholder={action==='tone'?'Ej.: más cálido, como un amigo':action==='translate'?'Ej.: al portugués':'Ej.: mencionar envío gratis'}/>

          {error && (
            <div style={{
              marginTop:14,padding:12,
              background:'color-mix(in oklab, var(--danger) 12%, transparent)',
              borderRadius:'var(--r-md)',
              fontSize:12,color:'var(--danger)',
              display:'flex',gap:8,
            }}>
              <I.x size={14} style={{marginTop:1,flexShrink:0}}/>
              <div><b>No pudimos generar.</b> {error}</div>
            </div>
          )}

          {variants.length > 0 && (
            <>
              <div className="prop-label" style={{marginTop:20,marginBottom:8}}>Propuestas ({variants.length})</div>
              <div className="col" style={{gap:8}}>
                {variants.map((v, i) => (
                  <div key={i} style={{padding:'12px 14px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--surface)'}}>
                    <div style={{fontSize:10.5,color:'var(--fg-3)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>{v.label}</div>
                    <div style={{fontSize:13,lineHeight:1.5,marginBottom:8}}>{v.t}</div>
                    <div className="row" style={{gap:6}}>
                      <button className="btn sm" onClick={()=>applyVariant(v.t)}><I.check size={11}/> Usar esta</button>
                      <button className="btn sm ghost"><I.copy size={11}/> Copiar</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-foot">
          <div style={{fontSize:11,color:'var(--fg-3)',flex:1}}>
            Usando <b style={{color:'var(--fg-2)'}}>{aiCfg.provider==='openai'?'OpenAI':aiCfg.provider==='google'?'Gemini':aiCfg.provider==='ollama'?'Ollama':'Claude'}</b>
          </div>
          <button className="btn" onClick={onClose}>Cerrar</button>
          <button className="btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><I.clock size={13}/> Pensando…</> : <><I.sparkles size={13}/> Generar propuestas</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionInsertBtn({ onClick, onDropPreset }) {
  const [over, setOver] = React.useState(false);
  return (
    <div
      className={`section-insert${over?' drop-active':''}`}
      onDragOver={(e)=>{
        if (!onDropPreset) return;
        if (Array.from(e.dataTransfer.types).includes('text/x-mc-section')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setOver(true);
        }
      }}
      onDragLeave={()=>setOver(false)}
      onDrop={(e)=>{
        if (!onDropPreset) return;
        const id = e.dataTransfer.getData('text/x-mc-section');
        if (!id) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDropPreset(id);
      }}
    >
      <div className="section-insert-line"/>
      <button className="section-insert-btn" onClick={onClick} title="Insertar sección vacía">
        <I.plus size={14}/>
      </button>
      <div className="section-insert-line"/>
    </div>
  );
}

function BlockInsertBtn({ onClick, onDropBlock }) {
  const [over, setOver] = React.useState(false);
  return (
    <div
      className={`block-insert${over?' drop-active':''}`}
      onClick={onClick}
      onDragOver={(e)=>{
        if (!onDropBlock) return;
        if (Array.from(e.dataTransfer.types).includes('text/x-mc-block')) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          setOver(true);
        }
      }}
      onDragLeave={()=>setOver(false)}
      onDrop={(e)=>{
        if (!onDropBlock) return;
        const type = e.dataTransfer.getData('text/x-mc-block');
        if (!type) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDropBlock(type);
      }}
    >
      <div className="block-insert-line"/>
      <button className="block-insert-btn" title="Insertar bloque vacío" onClick={e=>{e.stopPropagation(); onClick();}}>
        <I.plus size={12}/>
      </button>
      <div className="block-insert-line"/>
    </div>
  );
}

function SectionView({ section, selected, selectedBlockId, onSelectSection, onSelectBlock, onMoveUp, onMoveDown, onDuplicate, onDelete, onMoveBlock, onDeleteBlock, onAddBlankBlock, onDropBlock, onEditBlock }) {
  const font = FONT_OPTIONS.find(f => f.id===section.style.font) || FONT_OPTIONS[0];
  const [hover, setHover] = React.useState(false);
  const showChrome = selected || hover;
  return (
    <div
      onClick={e=>{ e.stopPropagation(); onSelectSection(); }}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        position:'relative',
        background:section.style.bg,
        color:section.style.text,
        padding:section.style.padding,
        fontFamily:font.css,
        textAlign:section.style.align,
        outline: selected ? '2px solid var(--accent)' : hover ? '1px solid color-mix(in oklab, var(--accent) 50%, transparent)' : '1px solid transparent',
        outlineOffset:-1,
        cursor:'pointer',
        transition:'outline-color 120ms',
      }}
    >
      {showChrome && (
        <div style={{
          position:'absolute',top:-26,left:-2,right:-2,
          display:'flex',alignItems:'center',gap:2,
          zIndex:10,pointerEvents:'none',
        }}>
          <div style={{
            background:'var(--accent)',color:'var(--accent-fg)',
            padding:'3px 8px',borderRadius:'3px 3px 0 0',fontSize:10,fontWeight:500,
            fontFamily:'var(--font-mono)',letterSpacing:'0.04em',
            display:'flex',alignItems:'center',gap:6,
          }}>
            <I.hero size={10}/>
            {section.name}
          </div>
          <div style={{flex:1}}/>
          <div className="elem-actions" style={{pointerEvents:'auto'}}>
            <button disabled={!onMoveUp} onClick={e=>{e.stopPropagation(); onMoveUp && onMoveUp();}} title="Subir"><I.chevronD size={11} style={{transform:'rotate(180deg)'}}/></button>
            <button disabled={!onMoveDown} onClick={e=>{e.stopPropagation(); onMoveDown && onMoveDown();}} title="Bajar"><I.chevronD size={11}/></button>
            <button onClick={e=>{e.stopPropagation(); onDuplicate();}} title="Duplicar"><I.copy size={11}/></button>
            <button disabled={!onDelete} onClick={e=>{e.stopPropagation(); onDelete && onDelete();}} title="Eliminar" className="danger"><I.minus size={13}/></button>
          </div>
        </div>
      )}

      <div style={{
        display:'grid',
        gridTemplateColumns:section.columns.map(c=>`${c.w}fr`).join(' '),
        gap:16,
      }}>
        {section.columns.map((col, ci) => (
          <ColumnView
            key={ci}
            column={col}
            colIdx={ci}
            totalBlocks={col.blocks.length}
            selectedBlockId={selectedBlockId}
            onSelectBlock={(b)=>onSelectBlock(b, ci)}
            onMoveBlock={(blockId,dir)=>onMoveBlock(ci,blockId,dir)}
            onDeleteBlock={onDeleteBlock}
            onAddBlankBlock={(atIdx)=>onAddBlankBlock(ci, atIdx)}
            onDropBlock={(atIdx, blockType)=>onDropBlock(ci, atIdx, blockType)}
            onEditBlock={onEditBlock}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnView({ column, colIdx, totalBlocks, selectedBlockId, onSelectBlock, onMoveBlock, onDeleteBlock, onAddBlankBlock, onDropBlock, onEditBlock }) {
  const [dragOver, setDragOver] = React.useState(false);
  return (
    <div
      onDragOver={(e)=>{
        if (!onDropBlock) return;
        if (Array.from(e.dataTransfer.types).includes('text/x-mc-block')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setDragOver(true);
        }
      }}
      onDragLeave={(e)=>{
        // Only clear when leaving the column itself, not internal children
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDragOver(false);
      }}
      onDrop={(e)=>{
        if (!onDropBlock) return;
        const type = e.dataTransfer.getData('text/x-mc-block');
        if (!type) return;
        e.preventDefault();
        setDragOver(false);
        onDropBlock(column.blocks.length, type);
      }}
      style={{
        minHeight: column.blocks.length ? 'auto' : 80,
        border: column.blocks.length ? 'none' : '1px dashed color-mix(in oklab, currentColor 22%, transparent)',
        borderRadius:4,
        padding: column.blocks.length ? 0 : 12,
        display:'flex',flexDirection:'column',gap:2,
        position:'relative',
        outline: dragOver ? '2px dashed var(--accent)' : undefined,
        outlineOffset: dragOver ? 2 : undefined,
        background: dragOver ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : undefined,
        transition:'outline-color 120ms, background 120ms',
      }}
    >
      {column.blocks.length === 0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'12px 0'}}>
          <div style={{fontSize:11,opacity:0.5,fontFamily:'var(--font-mono)'}}>{dragOver ? 'Soltar aquí' : 'Columna vacía'}</div>
          <button className="round-add" onClick={e=>{e.stopPropagation(); onAddBlankBlock(0);}} title="Añadir bloque">
            <I.plus size={14}/>
          </button>
        </div>
      )}
      {column.blocks.length > 0 && (
        <BlockInsertBtn onClick={()=>onAddBlankBlock(0)} onDropBlock={(type)=>onDropBlock(0, type)}/>
      )}
      {column.blocks.map((b, bi) => {
        const R = EB_RENDERERS[b.type];
        const isSel = selectedBlockId === b.id;
        return (
          <React.Fragment key={b.id}>
            <div
              className="block-wrap"
              onClick={e=>{ e.stopPropagation(); onSelectBlock(b); }}
              style={{
                position:'relative',
                outline: isSel ? '2px solid var(--accent)' : '1px solid transparent',
                outlineOffset:2,
                cursor:'pointer',
                borderRadius:2,
              }}
            >
              {R
                ? <R data={b.data} onEdit={onEditBlock ? (patch)=>onEditBlock(b, patch) : undefined}/>
                : <div style={{padding:12,opacity:0.5,fontFamily:'var(--font-mono)',fontSize:11}}>&lt;{b.type}/&gt;</div>}
              <div className="elem-actions block-actions" style={{opacity:isSel?1:undefined}}>
                <button disabled={bi===0} onClick={e=>{e.stopPropagation(); onMoveBlock(b.id,-1);}} title="Subir"><I.chevronD size={11} style={{transform:'rotate(180deg)'}}/></button>
                <button disabled={bi===column.blocks.length-1} onClick={e=>{e.stopPropagation(); onMoveBlock(b.id,1);}} title="Bajar"><I.chevronD size={11}/></button>
                <button onClick={e=>{e.stopPropagation(); onDeleteBlock(b.id);}} title="Eliminar" className="danger"><I.minus size={13}/></button>
              </div>
            </div>
            <BlockInsertBtn onClick={()=>onAddBlankBlock(bi+1)} onDropBlock={(type)=>onDropBlock(bi+1, type)}/>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DesignPanel() {
  return (
    <div className="side-body">
      <div className="prop-group">
        <div className="prop-label">Estilos globales del correo</div>
        <div className="prop-row"><label>Ancho</label><Num value={600} onChange={()=>{}} min={320} max={800}/></div>
        <div className="prop-row"><label>Fondo</label><Swatch color="#f5f6fb"/></div>
        <div className="prop-row"><label>Acento</label><Swatch color="#5b5bf0"/></div>
      </div>
        <div className="prop-group">
        <div className="prop-label">Datos del correo</div>
        <div className="prop-row"><label>Asunto</label><input className="field" defaultValue="Hola {{nombre}}"/></div>
        <div className="prop-row"><label>Vista previa</label><input className="field" defaultValue="3 novedades de noviembre"/></div>
        <div className="prop-row"><label>Remitente</label><input className="field" defaultValue="Acme <hola@acme.com>"/></div>
      </div>
    </div>
  );
}

Object.assign(window, { Editor });
