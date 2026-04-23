// Editor — section-based canvas

// Maps a saved block's `kind` to the i18n key that labels its category in
// the library. Reused by the editor breadcrumb and the "Mis bloques" panel
// in ContentPanel.
const KIND_LABEL_KEY = {
  header: 'library.cat.headers',
  footer: 'library.cat.footers',
  cta: 'library.cat.ctas',
  testimonial: 'library.cat.testimonials',
  product: 'library.cat.products',
  social: 'library.cat.social',
  signature: 'library.cat.signatures',
  custom: 'library.cat.custom',
};

function BlockTile({ b, onClick }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
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
      <div>{b.nameKey ? t(b.nameKey) : b.name}</div>
    </div>
  );
}

function ContentPanel({ onAddBlock, onAddSection, onAddSavedBlock }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [q, setQ] = React.useState('');
  // `onAddSection` / `onAddSavedBlock` are null in block-editing mode, where
  // inserting new sections or the library would make no sense.
  const cats = [
    onAddSection ? { h:t('editor.category.sectionsReady'), isSection:true, items: SECTION_PRESETS } : null,
    { h:t('editor.category.basics'), items: BLOCKS_BASIC },
    { h:t('editor.category.content'), items: BLOCKS_CONTENT },
    { h:t('editor.category.ecom'), items: BLOCKS_ECOM },
    { h:t('editor.category.social'), items: BLOCKS_SOCIAL },
    { h:t('editor.category.media'), items: BLOCKS_MEDIA },
    { h:t('editor.category.advanced'), items: BLOCKS_ADV },
  ].filter(Boolean);
  const nameOf = (b) => (b.nameKey ? t(b.nameKey) : b.name) || '';
  const f = (arr) => arr.filter(b => nameOf(b).toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',flexShrink:0}}>
        <div className="search">
          <span className="si"><I.search size={13}/></span>
          <input placeholder={t('editor.contentPanel.searchPlaceholder')} value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div style={{fontSize:11,color:'var(--fg-3)',marginTop:8,lineHeight:1.5}}>{t('editor.contentPanel.hint')}</div>
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
                      <div style={{padding:'6px 4px',fontSize:11}}>{p.nameKey ? t(p.nameKey) : p.name}</div>
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
        {onAddSavedBlock && <SavedBlocksPanel q={q} onAdd={onAddSavedBlock} />}
      </div>
    </div>
  );
}

// "Mis bloques" panel inside the editor's left Content tab. Lists the
// workspace's saved blocks grouped by kind; each tile is draggable with
// `text/x-mc-saved-block` (consumed by SectionInsertBtn + the empty
// canvas drop zone). Click inserts at the end of the doc.
function SavedBlocksPanel({ q, onAdd }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const rows = window.useBlocks();
  const [open, setOpen] = React.useState(() => {
    try { return localStorage.getItem('mc:editor:myBlocksOpen') === '1'; } catch { return false; }
  });
  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try { localStorage.setItem('mc:editor:myBlocksOpen', next ? '1' : '0'); } catch {}
      return next;
    });
  };
  const needle = (q || '').toLowerCase().trim();
  const searching = needle.length > 0;
  const filtered = React.useMemo(
    () => rows.filter((r) => !needle || (r.name || '').toLowerCase().includes(needle)),
    [rows, needle]
  );
  if (rows.length === 0) return null;
  const total = filtered.length;
  if (searching && total === 0) return null;
  const grouped = filtered.reduce((acc, r) => {
    const key = r.kind || 'custom';
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});
  const order = ['header', 'footer', 'cta', 'testimonial', 'product', 'social', 'signature', 'custom'];
  const expanded = open || searching;
  return (
    <div className="block-cat" style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 0',
          margin: '0 0 8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--fg-3)',
          textAlign: 'left',
        }}
      >
        <span style={{
          display: 'inline-flex',
          transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 120ms',
        }}><I.chevronD size={12} /></span>
        <span style={{
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 600,
          flex: 1,
        }}>{t('editor.category.savedBlocks')}</span>
        <span style={{
          fontSize: 10,
          color: 'var(--fg-3)',
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '1px 7px',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
        }}>{total}</span>
      </button>
      {expanded && order.map((k) => {
        const list = grouped[k];
        if (!list || list.length === 0) return null;
        return (
          <div key={k} style={{ marginBottom: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--fg-2)',
              fontWeight: 500,
              padding: '2px 0 4px',
            }}>
              <span style={{ flex: 1 }}>{t(KIND_LABEL_KEY[k] || 'library.cat.custom')}</span>
              <span style={{
                fontSize: 10,
                color: 'var(--fg-3)',
                fontVariantNumeric: 'tabular-nums',
              }}>{list.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
              {list.map((r) => (
                <button
                  key={r.id}
                  className="block-tile"
                  draggable
                  onClick={() => onAdd(r.id)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/x-mc-saved-block', r.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  title={r.name}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    height: 32,
                    padding: '0 10px',
                    gap: 8,
                  }}
                >
                  <div className="block-ic"><I.layers size={13} /></div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    flex: 1,
                  }}>{r.name}</div>
                  {r.starred && <I.star2 size={10} style={{ color: 'var(--warn)', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionPresetPreview({ preview }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const bar = (w,h=4,mb=3)=> <div style={{width:`${w}%`,height:h,background:'var(--fg-3)',opacity:0.35,borderRadius:1,marginBottom:mb}}/>;
  const box = (h,bg='var(--surface-3)')=> <div style={{width:'100%',height:h,background:bg,borderRadius:2,marginBottom:3}}/>;
  const layouts = {
    blank: <div style={{padding:8,opacity:0.4,fontSize:10,textAlign:'center'}}>{t('editor.preview.empty')}</div>,
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
  const t = window.stI18n.t;
  window.stI18n.useLang();
  return (
    <div className="side-body">
      <div style={{fontSize:11,color:'var(--fg-3)',letterSpacing:0.04,textTransform:'uppercase',marginBottom:10,fontWeight:600}}>{t('editor.category.sectionsReady')}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {SECTION_PRESETS.map(p => (
          <button key={p.id} className="block-tile" style={{height:'auto',padding:0,flexDirection:'column',gap:0,overflow:'hidden'}} onClick={()=>onAdd(p)}>
            <div style={{width:'100%',background:'var(--surface-2)',borderBottom:'1px solid var(--line)'}}>
              <SectionPresetPreview preview={p.preview}/>
            </div>
            <div style={{padding:'6px 4px',fontSize:11}}>{p.nameKey ? t(p.nameKey) : p.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LayersPanel({ doc, selected, onSelect, onSelectBlock }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  return (
    <div className="side-body">
      <div style={{fontSize:11,color:'var(--fg-3)',letterSpacing:0.04,textTransform:'uppercase',marginBottom:8,fontWeight:600}}>{t('editor.layers.structure')}</div>
      <div style={{fontSize:12,padding:'4px 6px',display:'flex',alignItems:'center',gap:6,background:'var(--surface-2)',borderRadius:4,marginBottom:4}}>
        <I.mail size={13}/><span style={{fontWeight:500}}>{t('editor.layers.wholeEmail')}</span>
        <span style={{marginLeft:'auto',fontSize:11,color:'var(--fg-3)'}}>{t('editor.layers.widthPx', { width: 600 })}</span>
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
  const t = window.stI18n.t;
  window.stI18n.useLang();
  return (
    <div className="side-body">
      <div style={{fontSize:11,color:'var(--fg-3)',letterSpacing:0.04,textTransform:'uppercase',marginBottom:10,fontWeight:600}}>{t('editor.history.title')}</div>
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
          {!h.current && <button className="btn icon sm ghost" title={t('editor.history.restore')}><I.history size={12}/></button>}
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
  const t = window.stI18n.t;
  window.stI18n.useLang();
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
  if (brand.fontDisplay) items.push({ label: brand.fontDisplay, role: t('editor.brandFonts.display') });
  if (brand.fontBody) items.push({ label: brand.fontBody, role: t('editor.brandFonts.body') });
  if (items.length === 0) return null;

  return (
    <div className="prop-group">
      <div className="prop-label">{t('editor.brandFonts.title')}</div>
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

// ────────────────────────────────────────────────────────────────
// R1 · Section-complete + R2 · Columns custom — SectionProps groups
// ────────────────────────────────────────────────────────────────
// Collapsible wrapper — a prop-group whose body toggles on click.
function CollapsibleGroup({ title, defaultOpen = true, children }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div className="prop-group">
      <div
        className="prop-label"
        onClick={() => setOpen(o => !o)}
        style={{ cursor:'pointer', userSelect:'none', marginBottom: open ? 6 : 0 }}
      >
        <span>{title}</span>
        <I.chevronD size={11} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform 140ms' }}/>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

// Tri-state pill: OFF / Desktop / Mobile. `value` ∈ {none, desktop, mobile}
// where 'none' means "always visible" (no hidden flag).
function HideOnPill({ hidden, onChange }) {
  const t = window.stI18n.t;
  const state = hidden?.desktop ? 'desktop' : hidden?.mobile ? 'mobile' : 'none';
  const set = (next) => {
    if (next === 'none') onChange(undefined);
    else if (next === 'desktop') onChange({ desktop: true });
    else onChange({ mobile: true });
  };
  return (
    <div className="seg" style={{ width:'100%' }}>
      <button className={state==='none'?'on':''} onClick={()=>set('none')}>
        {t('section.hideOn.none')}
      </button>
      <button className={state==='desktop'?'on':''} onClick={()=>set('desktop')} title={t('section.hideOn.desktop')}>
        <I.monitor size={11}/>
      </button>
      <button className={state==='mobile'?'on':''} onClick={()=>set('mobile')} title={t('section.hideOn.mobile')}>
        <I.phone size={11}/>
      </button>
    </div>
  );
}

// Border editor with toggle for per-side widths ("More options").
function BorderEditor({ value, onChange }) {
  const t = window.stI18n.t;
  const b = value || {};
  const [perSide, setPerSide] = React.useState(!!(b.sides));
  const set = (patch) => onChange({ ...b, ...patch });
  return (
    <div>
      <div className="prop-row">
        <label>{t('section.field.borderWidth')}</label>
        <Num value={b.w || 0} onChange={v => set({ w: v })} min={0} max={20}/>
      </div>
      <div className="prop-row">
        <label>{t('section.field.borderStyle')}</label>
        <div className="seg" style={{ width:'100%' }}>
          {['solid','dashed','dotted'].map(s => (
            <button key={s} className={(b.style||'solid')===s?'on':''} onClick={()=>set({ style:s })}>{t('section.borderStyle.'+s)}</button>
          ))}
        </div>
      </div>
      <div className="prop-row">
        <label>{t('section.field.borderColor')}</label>
        <ColorInput value={b.color || '#d6d6d6'} onChange={v => set({ color:v })}/>
      </div>
      <button
        className="btn sm ghost"
        style={{ width:'100%', marginTop:4, fontSize:11 }}
        onClick={()=>{
          if (perSide) {
            const next = { ...b };
            delete next.sides;
            onChange(next);
            setPerSide(false);
          } else {
            const w = b.w || 0;
            onChange({ ...b, sides: { top:w, right:w, bottom:w, left:w } });
            setPerSide(true);
          }
        }}>{perSide ? t('section.moreOptions.less') : t('section.moreOptions.more')}</button>
      {perSide && b.sides && (
        <div style={{ marginTop:6 }}>
          {['top','right','bottom','left'].map(side => (
            <div key={side} className="prop-row">
              <label>{t('section.borderSide.'+side)}</label>
              <Num value={b.sides[side] || 0} onChange={v => set({ sides: { ...b.sides, [side]: v } })} min={0} max={20}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Radius editor with toggle for per-corner values.
function RadiusEditor({ value, corners, onChangeRadius, onChangeCorners }) {
  const t = window.stI18n.t;
  const [perCorner, setPerCorner] = React.useState(!!corners);
  return (
    <div>
      {!perCorner && (
        <div className="prop-row">
          <label>{t('section.field.radius')}</label>
          <Num value={value || 0} onChange={onChangeRadius} min={0} max={60}/>
        </div>
      )}
      <button
        className="btn sm ghost"
        style={{ width:'100%', marginTop:4, fontSize:11 }}
        onClick={()=>{
          if (perCorner) {
            onChangeCorners(undefined);
            setPerCorner(false);
          } else {
            const rs = value || 0;
            onChangeCorners({ tl:rs, tr:rs, br:rs, bl:rs });
            setPerCorner(true);
          }
        }}>{perCorner ? t('section.moreOptions.less') : t('section.moreOptions.more')}</button>
      {perCorner && corners && (
        <div style={{ marginTop:6 }}>
          {[['tl','radiusCorner.tl'],['tr','radiusCorner.tr'],['br','radiusCorner.br'],['bl','radiusCorner.bl']].map(([k, lkey]) => (
            <div key={k} className="prop-row">
              <label>{t('section.'+lkey)}</label>
              <Num value={corners[k] || 0} onChange={v => onChangeCorners({ ...corners, [k]: v })} min={0} max={60}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Per-side padding editor (T/R/B/L) with "More options" toggle. Accepts a
// scalar number OR an object {top,right,bottom,left}. Emits a scalar when
// all sides are equal (so existing scalar consumers still work); otherwise
// an object.
function PaddingEditor({ value, onChange }) {
  const t = window.stI18n.t;
  const scalar = typeof value === 'number' ? value : null;
  const obj = (value && typeof value === 'object') ? value : null;
  const [perSide, setPerSide] = React.useState(!!obj);
  return (
    <div>
      {!perSide && (
        <div className="prop-row">
          <label>{t('editor.sectionProps.padding')}</label>
          <Num value={typeof scalar === 'number' ? scalar : 0} onChange={v => onChange(v)} min={0} max={80}/>
        </div>
      )}
      <button
        className="btn sm ghost"
        style={{ width:'100%', marginTop:4, fontSize:11 }}
        onClick={()=>{
          if (perSide) {
            const v = obj || {};
            const avg = Math.round(((v.top||0)+(v.right||0)+(v.bottom||0)+(v.left||0))/4);
            onChange(avg);
            setPerSide(false);
          } else {
            const n = typeof scalar === 'number' ? scalar : 0;
            onChange({ top:n, right:n, bottom:n, left:n });
            setPerSide(true);
          }
        }}>{perSide ? t('section.moreOptions.less') : t('section.moreOptions.more')}</button>
      {perSide && obj && (
        <div style={{ marginTop:6 }}>
          {['top','right','bottom','left'].map(side => (
            <div key={side} className="prop-row">
              <label>{t('section.borderSide.'+side)}</label>
              <Num value={obj[side] || 0} onChange={v => onChange({ ...obj, [side]: v })} min={0} max={120}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Columns structure editor — horizontal bar showing each column block,
// add/delete controls, and ± buttons to tweak widths.
function ColumnsStructureGroup({ section, onChange, selectedColIdx, onSelectCol }) {
  const t = window.stI18n.t;
  const cols = section.columns || [];
  const totalW = cols.reduce((s, c) => s + (c.w || 0), 0) || 100;

  const addColumn = () => {
    if (cols.length >= 6) return;
    const newW = Math.floor(100 / (cols.length + 1));
    // Rebalance existing columns to share remaining width evenly.
    const remainder = 100 - newW;
    const adjusted = cols.map(c => ({ ...c, w: Math.floor(remainder / cols.length) }));
    const next = [...adjusted, { w: 100 - adjusted.reduce((s,c)=>s+c.w,0), blocks: [] }];
    const layout = next.length === 1 ? '1col' : next.length === 2 ? '2col' : next.length === 3 ? '3col' : 'custom';
    onChange({ ...section, columns: next, layout });
  };
  const removeColumn = (i) => {
    if (cols.length <= 1) return;
    const removed = cols[i];
    const remaining = cols.filter((_, idx) => idx !== i);
    // Move removed blocks into the nearest remaining column (the one at idx-1
    // or the new first column) to preserve user content.
    const target = Math.max(0, i - 1);
    remaining[target] = { ...remaining[target], blocks: [...(remaining[target].blocks||[]), ...(removed.blocks||[])] };
    const share = Math.floor(100 / remaining.length);
    const next = remaining.map((c, idx) => ({ ...c, w: idx === remaining.length - 1 ? 100 - share * (remaining.length - 1) : share }));
    const layout = next.length === 1 ? '1col' : next.length === 2 ? '2col' : next.length === 3 ? '3col' : 'custom';
    onChange({ ...section, columns: next, layout });
    if (selectedColIdx === i && onSelectCol) onSelectCol(null);
  };
  const bumpWidth = (i, delta) => {
    const unit = Math.round(100 / 12); // 1 grid unit ≈ 8.33%
    const nextCols = cols.map(c => ({ ...c }));
    const newW = Math.max(unit, Math.min(100 - unit * Math.max(1, cols.length - 1), (nextCols[i].w || 0) + delta * unit));
    const diff = newW - (nextCols[i].w || 0);
    if (diff === 0) return;
    // Take/give the difference from the next column (wrap around).
    const neighbor = i === cols.length - 1 ? i - 1 : i + 1;
    if (neighbor < 0) return;
    const neighborW = (nextCols[neighbor].w || 0) - diff;
    if (neighborW < unit) return;
    nextCols[i].w = newW;
    nextCols[neighbor].w = neighborW;
    onChange({ ...section, columns: nextCols });
  };

  // Slider: move column boundaries by grid units (12-col).
  return (
    <CollapsibleGroup title={t('section.group.columns')} defaultOpen>
      <div style={{ fontSize:11, color:'var(--fg-3)', marginBottom:6 }}>
        {t('section.columns.count', { n: cols.length })}
      </div>
      <div style={{
        display:'flex', gap:4, width:'100%',
        border:'1px solid var(--line)', borderRadius:4, padding:3,
        background:'var(--surface-2)',
      }}>
        {cols.map((c, i) => {
          const pct = Math.round(((c.w || 0) / totalW) * 100);
          const on = selectedColIdx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectCol && onSelectCol(i)}
              className={on ? 'on' : ''}
              style={{
                flex: `0 0 ${pct}%`, minWidth: 24,
                background: on ? 'var(--accent-soft)' : 'var(--surface)',
                color: on ? 'var(--accent)' : 'var(--fg-2)',
                border:'1px solid var(--line)', borderRadius:3,
                padding:'6px 4px', fontSize:10, fontFamily:'var(--font-mono)',
                cursor:'pointer', position:'relative',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
              title={t('section.columns.selectHint', { n: i+1 })}
            >
              {pct}%
              {cols.length > 1 && (
                <span
                  onClick={(e)=>{ e.stopPropagation(); removeColumn(i); }}
                  style={{
                    position:'absolute', top:-6, right:-4,
                    width:14, height:14, borderRadius:'50%',
                    background:'var(--danger, #c04a4a)', color:'#fff',
                    display:'grid', placeItems:'center',
                    fontSize:9, cursor:'pointer',
                  }}
                  title={t('section.columns.delete')}
                >×</span>
              )}
            </button>
          );
        })}
      </div>
      {selectedColIdx !== null && selectedColIdx !== undefined && cols[selectedColIdx] && (
        <div className="prop-row" style={{ marginTop:10 }}>
          <label>{t('section.columns.widthUnits')}</label>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button className="btn icon sm ghost" onClick={()=>bumpWidth(selectedColIdx, -1)} title={t('common.decrease')}><I.minus size={11}/></button>
            <div style={{ flex:1, textAlign:'center', fontSize:11, fontFamily:'var(--font-mono)' }}>{Math.round((cols[selectedColIdx].w||0))}%</div>
            <button className="btn icon sm ghost" onClick={()=>bumpWidth(selectedColIdx, 1)} title={t('common.increase')}><I.plus size={11}/></button>
          </div>
        </div>
      )}
      {cols.length < 6 && (
        <button className="btn sm ghost" style={{ width:'100%', marginTop:8 }} onClick={addColumn}>
          <I.plus size={11}/> {t('section.columns.add')}
        </button>
      )}
    </CollapsibleGroup>
  );
}

// Per-column editor (inside Layout tab). Shows column background, padding,
// border, align + hide-on + mobile-width.
function ColumnEditorGroup({ section, colIdx, onChange }) {
  const t = window.stI18n.t;
  const col = section.columns[colIdx];
  if (!col) return null;
  const style = col.style || {};
  const mobile = col.mobile;
  const setCol = (patch) => {
    const nextCols = section.columns.map((c, i) => i === colIdx ? { ...c, ...patch } : c);
    onChange({ ...section, columns: nextCols });
  };
  const updStyle = (k, v) => setCol({ style: { ...style, [k]: v } });
  const updMobile = (k, v) => {
    const next = window.setDeviceOverride(mobile, k, v);
    setCol({ mobile: next });
  };
  const clearMobile = (k) => setCol({ mobile: window.setDeviceOverride(mobile, k, undefined) });

  return (
    <CollapsibleGroup title={t('section.group.column', { n: colIdx + 1 })} defaultOpen>
      {/* Mobile width override */}
      <window.DeviceField
        label={t('column.field.mobileWidth')}
        desktopValue={col.w || 0}
        mobileValue={mobile?.w}
        onChangeDesktop={(v)=> setCol({ w: v })}
        onChangeMobile={(v)=> setCol({ mobile: window.setDeviceOverride(mobile, 'w', v) })}
        onClearMobile={()=> setCol({ mobile: window.setDeviceOverride(mobile, 'w', undefined) })}
      >
        {(value, setValue) => <Num value={value || 0} onChange={setValue} min={0} max={100} suffix="%"/>}
      </window.DeviceField>

      {/* Background color */}
      <window.DeviceField
        label={t('column.field.bg')}
        desktopValue={style.bg || 'transparent'}
        mobileValue={mobile?.bg}
        onChangeDesktop={(v)=> updStyle('bg', v)}
        onChangeMobile={(v)=> updMobile('bg', v)}
        onClearMobile={()=> clearMobile('bg')}
      >
        {(value, setValue) => <ColorInput value={value === 'transparent' ? '#ffffff' : value} onChange={setValue}/>}
      </window.DeviceField>

      {/* Padding (scalar or per-side) */}
      <window.DeviceField
        label={t('column.field.padding')}
        desktopValue={style.padding ?? 0}
        mobileValue={mobile?.padding}
        onChangeDesktop={(v)=> updStyle('padding', v)}
        onChangeMobile={(v)=> updMobile('padding', v)}
        onClearMobile={()=> clearMobile('padding')}
      >
        {(value, setValue) => <PaddingEditor value={value} onChange={setValue}/>}
      </window.DeviceField>

      {/* Border */}
      <div style={{ marginTop:10 }}>
        <div className="prop-label">{t('column.field.border')}</div>
        <BorderEditor value={style.border || {}} onChange={(v) => updStyle('border', v)}/>
      </div>

      {/* Alignment */}
      <div className="prop-row" style={{ marginTop:10 }}>
        <label>{t('column.field.align')}</label>
        <div className="seg" style={{ width:'100%' }}>
          {['left','center','right'].map(a => (
            <button key={a} className={(style.align||'left')===a?'on':''} onClick={()=>updStyle('align', a)}>
              {a==='left'?<I.alignL size={12}/>:a==='center'?<I.alignC size={12}/>:<I.alignR size={12}/>}
            </button>
          ))}
        </div>
      </div>

      {/* Hide on */}
      <div className="prop-row" style={{ marginTop:10 }}>
        <label>{t('column.field.hideOn')}</label>
        <HideOnPill hidden={col.hidden} onChange={(v)=> setCol({ hidden: v })}/>
      </div>
    </CollapsibleGroup>
  );
}

function SectionProps({ section, onChange }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [tab,setTab] = React.useState('style');
  const [selectedCol, setSelectedCol] = React.useState(null);
  // Reset column selection when section changes.
  const prevSecId = React.useRef(section?.id);
  React.useEffect(() => {
    if (prevSecId.current !== section?.id) {
      setSelectedCol(null);
      prevSecId.current = section?.id;
    }
  }, [section?.id]);
  if (!section) return null;
  const mob = section.mobile || {};
  const hid = section.hidden;
  const updStyle = (k,v) => onChange({ ...section, style: {...section.style, [k]:v} });
  const updMobile = (k,v) => onChange({ ...section, mobile: window.setDeviceOverride(mob, k, v) });
  const clearMobile = (k) => onChange({ ...section, mobile: window.setDeviceOverride(mob, k, undefined) });
  const upd = (k,v) => onChange({ ...section, [k]:v });
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,minWidth:0}}>
      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <div style={{width:24,height:24,borderRadius:'var(--r-sm)',background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center'}}>
          <I.hero size={12}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <input value={section.name} onChange={e=>upd('name',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:500,width:'100%'}}/>
          <div style={{fontSize:10,color:'var(--fg-3)'}}>{t('editor.sectionProps.subtitle')}</div>
        </div>
        <button className="btn icon sm ghost" title={t('common.duplicate')}><I.copy size={13}/></button>
        <button className="btn icon sm ghost" title={t('common.delete')}><I.trash size={13}/></button>
      </div>
      <div className="side-tabs" style={{flexShrink:0}}>
        <Tab label={t('editor.sectionProps.tab.style')} active={tab==='style'} onClick={()=>setTab('style')}/>
        <Tab label={t('editor.sectionProps.tab.layout')} active={tab==='layout'} onClick={()=>setTab('layout')}/>
        <Tab label={t('editor.sectionProps.tab.type')} active={tab==='type'} onClick={()=>setTab('type')}/>
      </div>
      <div className="side-body">
        {tab==='style' && (
          <>
            <div className="prop-group">
              <div className="prop-label">{t('editor.sectionProps.quickPresets')}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                {SECTION_STYLE_PRESETS.map(p => (
                  <button key={p.id} className="block-tile" style={{height:54,padding:0,overflow:'hidden',background:p.bg,color:p.text,border:'1px solid var(--line)',flexDirection:'column',gap:0}}
                    onClick={()=>onChange({...section, style:{...section.style, bg:p.bg, text:p.text}})}>
                    <div style={{fontSize:10,fontWeight:500,padding:'4px 0'}}>{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ───── Backgrounds ───── */}
            <CollapsibleGroup title={t('section.group.backgrounds')} defaultOpen>
              <SectionOuterGroup section={section} updStyle={updStyle}/>
              <div style={{ marginTop:10 }}>
                <div className="prop-label">{t('editor.sectionProps.contentBg')}</div>
                <window.DeviceField
                  label={t('editor.sectionProps.color')}
                  desktopValue={section.style.bg}
                  mobileValue={mob.bg}
                  onChangeDesktop={(v)=> updStyle('bg', v)}
                  onChangeMobile={(v)=> updMobile('bg', v)}
                  onClearMobile={()=> clearMobile('bg')}
                >
                  {(value, setValue) => <ColorInput value={value} onChange={setValue}/>}
                </window.DeviceField>
              </div>
              <div style={{ marginTop:10 }}>
                <div className="prop-label">{t('section.field.bgImage')}</div>
                <div className="prop-row">
                  <label>{t('section.field.bgImage')}</label>
                  <input
                    className="field"
                    value={section.style.bgImage || ''}
                    placeholder={t('section.placeholder.bgImage')}
                    onChange={(e)=>updStyle('bgImage', e.target.value || undefined)}
                  />
                </div>
                {section.style.bgImage && (
                  <>
                    <div className="prop-row">
                      <label>{t('section.field.bgImagePosition')}</label>
                      <div className="seg" style={{ width:'100%' }}>
                        {['left top','center top','right top','center center','center bottom'].map((p, idx) => (
                          <button
                            key={p}
                            className={(section.style.bgImagePosition || 'center center') === p ? 'on' : ''}
                            onClick={()=>updStyle('bgImagePosition', p)}
                            title={p}
                            style={{ fontSize:9, fontFamily:'var(--font-mono)' }}
                          >{['LT','CT','RT','C','CB'][idx]}</button>
                        ))}
                      </div>
                    </div>
                    <div className="prop-row">
                      <label>{t('section.field.bgImageRepeat')}</label>
                      <div className="seg" style={{ width:'100%' }}>
                        {['no-repeat','repeat','repeat-x','repeat-y'].map(r => (
                          <button key={r} className={(section.style.bgImageRepeat||'no-repeat')===r?'on':''} onClick={()=>updStyle('bgImageRepeat', r)}
                            style={{ fontSize:9 }}
                          >{t('section.bgRepeat.'+r)}</button>
                        ))}
                      </div>
                    </div>
                    <div className="prop-row">
                      <label>{t('section.field.bgImageSize')}</label>
                      <div className="seg" style={{ width:'100%' }}>
                        {['cover','contain','auto'].map(sz => (
                          <button key={sz} className={(section.style.bgImageSize||'cover')===sz?'on':''} onClick={()=>updStyle('bgImageSize', sz)}>{t('section.bgSize.'+sz)}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleGroup>

            {/* ───── Borders ───── */}
            <CollapsibleGroup title={t('section.group.borders')} defaultOpen={false}>
              <div className="prop-label">{t('section.field.border')}</div>
              <BorderEditor value={section.style.border || {}} onChange={(v) => updStyle('border', v)}/>
              <div style={{ height:1, background:'var(--line)', margin:'10px 0' }}/>
              <div className="prop-label">{t('section.field.radiusCorners')}</div>
              <RadiusEditor
                value={section.style.radius}
                corners={section.style.radiusCorners}
                onChangeRadius={(v)=>updStyle('radius', v)}
                onChangeCorners={(v)=>updStyle('radiusCorners', v)}
              />
            </CollapsibleGroup>

            {/* ───── Layout ───── */}
            <CollapsibleGroup title={t('section.group.layout')} defaultOpen>
              <div className="prop-label">{t('editor.sectionProps.text')}</div>
              <div className="prop-row">
                <label>{t('editor.sectionProps.color')}</label>
                <ColorInput value={section.style.text} onChange={v=>updStyle('text',v)}/>
              </div>
              <div className="prop-row">
                <label>{t('editor.sectionProps.align')}</label>
                <div className="seg" style={{width:'100%'}}>
                  {['left','center','right'].map(a => (
                    <button key={a} className={section.style.align===a?'on':''} onClick={()=>updStyle('align',a)}>
                      {a==='left'?<I.alignL size={12}/>:a==='center'?<I.alignC size={12}/>:<I.alignR size={12}/>}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height:1, background:'var(--line)', margin:'10px 0' }}/>

              {/* Content-area padding with Mobile chip */}
              <window.DeviceField
                label={t('editor.sectionProps.padding')}
                desktopValue={section.style.padding}
                mobileValue={mob.padding}
                onChangeDesktop={(v)=> updStyle('padding', v)}
                onChangeMobile={(v)=> updMobile('padding', v)}
                onClearMobile={()=> clearMobile('padding')}
              >
                {(value, setValue) => <Num value={value} onChange={setValue} min={0} max={80}/>}
              </window.DeviceField>

              {/* Section width */}
              <window.DeviceField
                label={t('editor.sectionProps.widthLabel')}
                desktopValue={section.style.width || 600}
                mobileValue={mob.width}
                onChangeDesktop={(v)=> updStyle('width', v)}
                onChangeMobile={(v)=> updMobile('width', v)}
                onClearMobile={()=> clearMobile('width')}
              >
                {(value, setValue) => <Num value={value} onChange={setValue} min={320} max={800}/>}
              </window.DeviceField>
              <div style={{fontSize:11,color:'var(--fg-3)',marginTop:-2,marginBottom:8,lineHeight:1.5}}>
                {t('editor.sectionProps.widthHint')}
              </div>

              {/* Outer padding Y */}
              <window.DeviceField
                label={t('editor.sectionOuter.paddingY')}
                desktopValue={section.style.outerPadY || 0}
                mobileValue={mob.outerPadY}
                onChangeDesktop={(v)=> updStyle('outerPadY', v)}
                onChangeMobile={(v)=> updMobile('outerPadY', v)}
                onClearMobile={()=> clearMobile('outerPadY')}
              >
                {(value, setValue) => <Num value={value || 0} onChange={setValue} min={0} max={120}/>}
              </window.DeviceField>

              {/* Vertical align between columns */}
              <window.DeviceField
                label={t('section.field.vAlign')}
                desktopValue={section.style.vAlign || 'top'}
                mobileValue={mob.vAlign}
                onChangeDesktop={(v)=> updStyle('vAlign', v)}
                onChangeMobile={(v)=> updMobile('vAlign', v)}
                onClearMobile={()=> clearMobile('vAlign')}
              >
                {(value, setValue) => (
                  <div className="seg" style={{ width:'100%' }}>
                    {['top','middle','bottom'].map(a => (
                      <button key={a} className={value===a?'on':''} onClick={()=>setValue(a)}>{t('section.vAlign.'+a)}</button>
                    ))}
                  </div>
                )}
              </window.DeviceField>

              {/* Stack on mobile */}
              <div className="prop-row" style={{ marginTop:10 }}>
                <label>{t('section.field.stackOnMobile')}</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={section.stackOnMobile !== false}
                    onChange={(e)=>upd('stackOnMobile', e.target.checked)}
                  />
                  <span/>
                </label>
              </div>

              {/* Hide on */}
              <div className="prop-row" style={{ marginTop:10 }}>
                <label>{t('section.field.hideOn')}</label>
                <HideOnPill hidden={hid} onChange={(v)=>upd('hidden', v)}/>
              </div>
            </CollapsibleGroup>
          </>
        )}
        {tab==='layout' && (
          <>
            <div className="prop-group">
              <div className="prop-label">{t('editor.sectionProps.columns')}</div>
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
                    setSelectedCol(null);
                  }}>{o.l}</button>
                ))}
              </div>
              <div style={{fontSize:11,color:'var(--fg-3)',marginTop:10,lineHeight:1.5}}>{t('editor.sectionProps.columnsHint')}</div>
            </div>
            <ColumnsStructureGroup
              section={section}
              onChange={onChange}
              selectedColIdx={selectedCol}
              onSelectCol={setSelectedCol}
            />
            {selectedCol !== null && section.columns[selectedCol] && (
              <ColumnEditorGroup
                section={section}
                colIdx={selectedCol}
                onChange={onChange}
              />
            )}
          </>
        )}
        {tab==='type' && (
          <>
            <BrandFontsGroup current={section.style.font} onPick={v=>updStyle('font',v)}/>
            <div className="prop-group">
              <div className="prop-label">{t('editor.sectionProps.fontFamily')}</div>
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
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const base = { display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' };
  if (saveState === 'idle') {
    return (
      <div className="btn ghost sm" title={t('editor.save.allSaved')}
        style={{...base, color:'#2bb07f', cursor:'default', pointerEvents:'none'}}>
        <I.check size={13}/>
        <span>{t('editor.save.allSaved')}</span>
      </div>
    );
  }
  if (saveState === 'saving') {
    return (
      <div className="btn ghost sm" title={t('editor.save.saving')}
        style={{...base, color:'var(--fg-3)', opacity:0.85, pointerEvents:'none'}}>
        <I.loader size={13} className="spin"/>
        <span>{t('editor.save.saving')}</span>
      </div>
    );
  }
  if (saveState === 'error') {
    return (
      <button className="btn primary sm" onClick={onClick} title={t('editor.save.errorTooltip')}
        style={{...base, background:'#e04f4f', borderColor:'#e04f4f', color:'#fff'}}>
        <I.info size={13}/>
        <span>{t('editor.save.retry')}</span>
      </button>
    );
  }
  // dirty
  return (
    <button className="btn primary sm" onClick={onClick} title={t('editor.save.saveNow')}
      style={base}>
      <I.upload size={13}/>
      <span>{t('editor.save.save')}</span>
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

function Editor({ template, block, onBack, onPreview, onExport, onTestSend, onOpenVars, onReview }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  // Mode: template (full email, many sections) vs block (a single reusable
  // section). Drives the load/save path, the title/back semantics, and which
  // chrome is hidden (section-add, preview/export/test buttons, etc.).
  const isBlockMode = !!block && !template;
  const entity = isBlockMode ? block : template;
  const [doc, setDoc] = React.useState([]);
  const [vars, setVars] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [sel, setSel] = React.useState({type:'section',id:'s1'});
  const [device, setDevice] = React.useState('desktop');
  const [leftTab, setLeftTab] = React.useState('content');
  const [rightTab, setRightTab] = React.useState('props');
  const [name, setName] = React.useState(entity?.name || t('editor.untitledTemplate'));
  const [zoom, setZoom] = React.useState(100);
  const [improveBlock, setImproveBlock] = React.useState(null);
  // When the user clicks an empty image placeholder in the canvas we want to
  // jump straight to the library picker, skipping "select → open props tab →
  // click button". Holds { sectionId, block } while the picker is open.
  const [picker, setPicker] = React.useState(null);
  const [saveState, setSaveState] = React.useState('idle'); // idle | dirty | saving | error
  const [showTour, setShowTour] = React.useState(() => {
    try { return !window.stStorage.getSetting('tour-seen', false); } catch(e) { return false; }
  });
  const editorPrefs = useEditorPrefs();

  const templateIdRef = React.useRef(entity?.id || null);
  const templateJsonRef = React.useRef(null);
  const isBlockModeRef = React.useRef(isBlockMode);
  isBlockModeRef.current = isBlockMode;
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

  // ─── Undo / redo for `doc` ───────────────────────────────────────
  // Snapshots are pushed by a useEffect that watches `doc`. Bursts of edits
  // within HISTORY_COALESCE_MS collapse into a single undo step (typing in a
  // text field shouldn't create dozens of entries). The skip flag suppresses
  // the snapshot when the change is itself an undo/redo. Stack capped at
  // HISTORY_MAX entries to bound memory.
  const HISTORY_MAX = 50;
  const HISTORY_COALESCE_MS = 500;
  const undoStackRef = React.useRef([]);
  const redoStackRef = React.useRef([]);
  const lastSnapshotRef = React.useRef(null);
  const lastPushAtRef = React.useRef(0);
  const skipHistoryRef = React.useRef(true);
  const [historyState, setHistoryState] = React.useState({ canUndo:false, canRedo:false });
  const refreshHistoryState = React.useCallback(() => {
    setHistoryState({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    });
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      lastSnapshotRef.current = doc;
      return;
    }
    const now = Date.now();
    const coalesce = (now - lastPushAtRef.current) < HISTORY_COALESCE_MS && undoStackRef.current.length > 0;
    if (!coalesce) {
      undoStackRef.current.push(lastSnapshotRef.current);
      if (undoStackRef.current.length > HISTORY_MAX) undoStackRef.current.shift();
      redoStackRef.current = [];
    }
    lastSnapshotRef.current = doc;
    lastPushAtRef.current = now;
    refreshHistoryState();
  }, [doc, loaded, refreshHistoryState]);

  // Reset history when switching template — old snapshots belong to old doc.
  React.useEffect(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    lastSnapshotRef.current = null;
    lastPushAtRef.current = 0;
    skipHistoryRef.current = true;
    refreshHistoryState();
  }, [entity?.id, refreshHistoryState]);

  const undo = React.useCallback(() => {
    if (!undoStackRef.current.length) return;
    redoStackRef.current.push(lastSnapshotRef.current);
    const prev = undoStackRef.current.pop();
    skipHistoryRef.current = true;
    lastSnapshotRef.current = prev;
    setDoc(prev);
    refreshHistoryState();
  }, [refreshHistoryState]);

  const redo = React.useCallback(() => {
    if (!redoStackRef.current.length) return;
    undoStackRef.current.push(lastSnapshotRef.current);
    const next = redoStackRef.current.pop();
    skipHistoryRef.current = true;
    lastSnapshotRef.current = next;
    setDoc(next);
    refreshHistoryState();
  }, [refreshHistoryState]);

  const undoRef = React.useRef(undo);
  const redoRef = React.useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  // ⌘Z / ⌘⇧Z (Ctrl+Z / Ctrl+Shift+Z, Ctrl+Y on Win). Only intercept when we
  // actually have something to do — otherwise let the browser handle native
  // input undo (e.g. user typing in template-name field).
  React.useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      const isRedo = (k === 'z' && e.shiftKey) || (k === 'y' && !e.shiftKey);
      const isUndo = (k === 'z' && !e.shiftKey);
      if (isRedo) {
        if (!redoStackRef.current.length) return;
        e.preventDefault();
        redoRef.current();
      } else if (isUndo) {
        if (!undoStackRef.current.length) return;
        e.preventDefault();
        undoRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Editor shortcuts (⌘S / ⌘D / ⌫ / ⌘P / ⌘⇧T). ⌫/Delete must respect the
  // activeElement guard or we'd nuke the selection while the user is typing
  // in any input (template name, block text fields, etc.).
  React.useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      const ae = document.activeElement;
      const tag = ae?.tagName?.toLowerCase();
      const inField = tag === 'input' || tag === 'textarea' || ae?.isContentEditable;
      if (mod && k === 's' && !e.shiftKey) {
        e.preventDefault();
        flushSaveRef.current();
        return;
      }
      if (mod && k === 'd' && !e.shiftKey) {
        e.preventDefault();
        if (sel?.type === 'block') duplicateBlock(sel.sectionId, sel.id);
        else if (sel?.type === 'section') duplicateSection(sel.id);
        return;
      }
      if (mod && k === 'p' && !e.shiftKey) {
        e.preventDefault();
        (async () => { await flushSaveRef.current(); onPreview(); })();
        return;
      }
      if (mod && e.shiftKey && k === 't') {
        e.preventDefault();
        onTestSend();
        return;
      }
      if ((k === 'backspace' || k === 'delete') && !mod && !e.shiftKey && !e.altKey) {
        if (inField) return;
        if (sel?.type === 'block') {
          e.preventDefault();
          deleteBlock(sel.sectionId, sel.id);
        } else if (sel?.type === 'section' && doc.length > 1) {
          e.preventDefault();
          deleteSection(sel.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, doc, onPreview, onTestSend]);

  React.useEffect(() => {
    const h = (e) => setImproveBlock(e.detail.block);
    window.addEventListener('st:improve', h);
    const t = () => setShowTour(true);
    window.addEventListener('st:start-tour', t);
    const pick = (e) => {
      const { sectionId, blockId } = e.detail || {};
      if (!sectionId || !blockId) return;
      const section = docRef.current.find(s => s.id === sectionId);
      if (!section) return;
      let found = null;
      for (const col of section.columns || []) {
        found = (col.blocks || []).find(b => b.id === blockId);
        if (found) break;
      }
      if (found) setPicker({ sectionId, block: found });
    };
    window.addEventListener('st:pick-image-for-block', pick);
    return () => {
      window.removeEventListener('st:improve', h);
      window.removeEventListener('st:start-tour', t);
      window.removeEventListener('st:pick-image-for-block', pick);
    };
  }, []);

  // ─── Load doc from storage when the entity id changes ──────────
  // Two modes converge into the same doc shape (an array of sections).
  // Templates carry {sections:[...]}; blocks carry a single `section` that
  // we wrap into a 1-section array so the rest of the editor is oblivious.
  React.useEffect(() => {
    if (!entity?.id) { setLoaded(true); return; }
    let cancelled = false;
    templateIdRef.current = entity.id;
    skipNextSaveRef.current = true;
    (async () => {
      if (isBlockMode) {
        const blk = await window.stBlocks.read(entity.id);
        if (cancelled) return;
        templateJsonRef.current = blk;
        const section = blk?.section;
        const sections = section ? [section] : [];
        setDoc(sections);
        // Blocks reuse the workspace default vars — no per-block override yet.
        setVars(window.stStorage.getWSSetting('vars', null) || window.VARIABLES || []);
        setName(blk?.name || entity.name || t('editor.untitledTemplate'));
        setSel(section ? { type:'section', id: section.id } : null);
      } else {
        const tpl = await window.stTemplates.read(entity.id);
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
        setName(tpl?.name || entity.name || t('editor.untitledTemplate'));
        const firstId = Array.isArray(sections) && sections[0]?.id;
        setSel(firstId ? { type:'section', id:firstId } : null);
      }
      setLoaded(true);
      setSaveState('idle');
    })();
    return () => { cancelled = true; };
  }, [entity?.id, isBlockMode]);

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
      let patched;
      let result;
      if (isBlockModeRef.current) {
        // A block persists its full object with the edited section written
        // back in. Sections past index 0 are ignored — the block model is
        // single-section, and the section-insert chrome is hidden anyway.
        const section = docRef.current[0] || null;
        patched = {
          ...(templateJsonRef.current || {}),
          id: templateIdRef.current,
          schemaVersion: 1,
          name: nameRef.current,
          section,
        };
        result = await window.stBlocks.write(templateIdRef.current, patched);
      } else {
        patched = {
          ...(templateJsonRef.current || {}),
          id: templateIdRef.current,
          schemaVersion: 1,
          name: nameRef.current,
          doc: { sections: docRef.current },
          vars: varsRef.current,
        };
        result = await window.stTemplates.write(templateIdRef.current, patched);
      }
      if (result) {
        templateJsonRef.current = patched;
        setSaveState('idle');
        // Optional notification, gated by notif.saved (off by default).
        window.notify && window.notify('saved', {
          kind: 'ok',
          title: t('editor.toast.saved'),
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

  // Canvas frame width = the widest section's content width. Sections narrower
  // than this render their outer band wider than their content, exposing the
  // outerBg as a visible "wall" on either side. Min 600 to keep the frame
  // visually meaningful when all sections are smaller.
  const docMaxWidth = doc.reduce((m, s) => Math.max(m, s.style?.width || 600), 600);

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
      copy.name = orig.name + ' ' + t('editor.section.copySuffix');
      copy.columns.forEach(c => c.blocks.forEach(b => b.id = 'b'+Math.random().toString(36).slice(2,8)));
      return [...d.slice(0,i+1), copy, ...d.slice(i+1)];
    });
  };
  const duplicateBlock = (sectionId, blockId) => {
    setDoc(d => d.map(s => {
      if (s.id !== sectionId) return s;
      return {...s, columns: s.columns.map(col => {
        const i = col.blocks.findIndex(b => b.id===blockId);
        if (i < 0) return col;
        const copy = JSON.parse(JSON.stringify(col.blocks[i]));
        copy.id = 'b'+Math.random().toString(36).slice(2,8);
        return {...col, blocks: [...col.blocks.slice(0,i+1), copy, ...col.blocks.slice(i+1)]};
      })};
    }));
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
    const defaultData = blockType==='text' ? {body:t('editor.block.textDefault')} : {};
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
    const newSection = { id:newId, name:t('editor.section.defaultName'), layout:'1col', style:defaultSectionStyle({padding:40}), columns:[{w:100,blocks:[]}] };
    setDoc(d => {
      const copy = [...d];
      copy.splice(atIndex, 0, newSection);
      return copy;
    });
    setSel({type:'section',id:newId});
  };

  // Inserts a saved block's section at `atIndex`. Clones with fresh ids so
  // re-using the same saved block twice in a template doesn't collide on
  // React keys or editor selection. Template mode only — the ContentPanel
  // and drop handlers that invoke this are hidden in block mode.
  const addSavedBlock = async (blockId, atIndex=null) => {
    const blk = await window.stBlocks.read(blockId);
    const src = blk?.section;
    if (!src) return;
    const mkId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
    const newSection = {
      id: mkId('s'),
      name: blk.name || t('editor.section.defaultName'),
      layout: src.layout || '1col',
      style: { ...(src.style || defaultSectionStyle()) },
      columns: (src.columns || []).map((col) => ({
        w: col.w,
        blocks: (col.blocks || []).map((b) => ({ ...b, id: mkId('b') })),
      })),
    };
    setDoc(d => {
      if (atIndex === null || atIndex >= d.length) return [...d, newSection];
      const copy = [...d];
      copy.splice(atIndex, 0, newSection);
      return copy;
    });
    setSel({ type:'section', id: newSection.id });
  };

  return (
    <div className="editor" data-view={device}>
      <div className="editor-top">
        {/* Zone A — context */}
        <button className="btn icon ghost sm" onClick={async ()=>{ await flushSaveRef.current(); onBack(); }} title={t('editor.back.tooltip')} aria-label={t('editor.back.aria')}><I.chevronL size={14}/></button>
        <div className="name">
          <input value={name} onChange={e=>setName(e.target.value)}/>
          <div className="meta">
            {isBlockMode
              ? <>{t('editor.blockBadge')}{block?.kind ? <> · {t(KIND_LABEL_KEY[block.kind] || 'library.cat.custom')}</> : null}</>
              : <>{template?.folder || templateJsonRef.current?.folder || t('editor.noFolder')} · {t('editor.sectionsCount', { n: doc.length })}</>}
          </div>
        </div>

        {/* Zone B — view mode (centered) */}
        <div className="grow"/>
        <div className="device-toggle" data-tour="device-toggle">
          <button className={device==='desktop'?'on':''} onClick={()=>setDevice('desktop')} title={t('editor.device.desktopTooltip')} aria-label={t('editor.device.desktop')}><I.monitor size={13}/></button>
          <button className={device==='mobile'?'on':''} onClick={()=>setDevice('mobile')} title={t('editor.device.mobileTooltip')} aria-label={t('editor.device.mobile')}><I.phone size={13}/></button>
        </div>
        <div className="grow"/>

        {/* Zone C — utility cluster */}
        <div className="icon-cluster">
          <button className="btn icon ghost sm" title={t('editor.toolbar.undoTooltip')} aria-label={t('editor.toolbar.undo')} disabled={!historyState.canUndo} onClick={undo}><I.undo size={13}/></button>
          <button className="btn icon ghost sm" title={t('editor.toolbar.redoTooltip')} aria-label={t('editor.toolbar.redo')} disabled={!historyState.canRedo} onClick={redo}><I.redo size={13}/></button>
          <SaveBtn saveState={saveState} onClick={()=>flushSaveRef.current()}/>
          <ThemeToggleBtn/>
          <button className="btn icon ghost sm" onClick={()=>window.dispatchEvent(new CustomEvent('st:cmd-open'))} title={t('editor.toolbar.searchTooltip')} aria-label={t('editor.toolbar.search')}><I.search size={13}/></button>
        </div>

        {/* Zone D — actions. Blocks don't have variables or a send flow, so
             only the "back" (via name input) and save state chrome remain. */}
        {!isBlockMode && (
          <>
            <button className="btn ghost sm" onClick={onOpenVars}><I.braces size={13}/> {t('editor.action.tags')}</button>
            <button className="btn ghost sm" onClick={async ()=>{ await flushSaveRef.current(); onPreview(); }}><I.eye size={13}/> {t('editor.action.preview')}</button>
            <button className="btn ghost sm" onClick={onReview} title={t('editor.action.reviewTooltip')} data-tour="review-btn"><I.check size={13}/> {t('editor.action.review')}</button>
            <button className="btn sm" onClick={onTestSend}><I.send size={13}/> {t('editor.action.testSend')}</button>
            <button className="btn primary sm" onClick={onExport} data-tour="export-btn"><I.download size={13}/> {t('editor.action.export')}</button>
          </>
        )}
      </div>

      <div className="editor-body">
        <aside className="side-panel left" data-tour="left-panel">
          <div className="side-tabs" style={{padding:'8px 8px 4px'}}>
            <Tab label={t('editor.leftTab.content')} active={leftTab==='content'} onClick={()=>setLeftTab('content')}/>
            <Tab label={t('editor.leftTab.layers')} active={leftTab==='layers'} onClick={()=>setLeftTab('layers')}/>
            <Tab label={t('editor.leftTab.history')} active={leftTab==='history'} onClick={()=>setLeftTab('history')}/>
          </div>
          {leftTab==='content' && (
            <ContentPanel
              onAddBlock={addBlockToEnd}
              onAddSection={isBlockMode ? null : addSection}
              onAddSavedBlock={isBlockMode ? null : (id)=>addSavedBlock(id, null)}
            />
          )}
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
            <div className="canvas-frame" style={{
              transform:`scale(${zoom/100})`,
              transformOrigin:'top center',
              ['--canvas-w']: device==='mobile' ? '375px' : `${docMaxWidth}px`,
            }}>
              {doc.length === 0 ? (
                <div
                  style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-md)',padding:'20px 0'}}
                  onDragOver={(e)=>{
                    if (isBlockMode) return;
                    const types = Array.from(e.dataTransfer.types);
                    if (types.includes('text/x-mc-section') || types.includes('text/x-mc-saved-block')) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }
                  }}
                  onDrop={(e)=>{
                    if (isBlockMode) return;
                    const savedId = e.dataTransfer.getData('text/x-mc-saved-block');
                    if (savedId) {
                      e.preventDefault();
                      addSavedBlock(savedId, 0);
                      return;
                    }
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
                    title={t('editor.empty.title')}
                    msg={t('editor.empty.msg')}
                    primaryAction={{ label:t('editor.empty.addBlank'), icon:'plus', onClick:()=>addBlankSection(0) }}
                    tips={[
                      t('editor.empty.tip1'),
                      t('editor.empty.tip2'),
                    ]}
                  />
                </div>
              ) : doc.flatMap((s, si) => {
                const items = [];
                if (si === 0 && !isBlockMode) {
                  items.push(
                    <SectionInsertBtn
                      key={`ins-${s.id}-before`}
                      onClick={()=>addBlankSection(0)}
                      onDropPreset={(id)=>{ const p=resolvePreset(id); if (p) addSection(p, 0); }}
                      onDropSavedBlock={(id)=>addSavedBlock(id, 0)}
                    />
                  );
                }
                items.push(
                  <SectionView
                    key={`sec-${s.id}`}
                    section={s}
                    selected={sel?.type==='section' && sel.id===s.id}
                    selectedBlockId={sel?.type==='block' ? sel.id : null}
                    device={device}
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
                );
                if (!isBlockMode) {
                  items.push(
                    <SectionInsertBtn
                      key={`ins-${s.id}-after`}
                      onClick={()=>addBlankSection(si+1)}
                      onDropPreset={(id)=>{ const p=resolvePreset(id); if (p) addSection(p, si+1); }}
                      onDropSavedBlock={(id)=>addSavedBlock(id, si+1)}
                    />
                  );
                }
                return items;
              })}
            </div>
          </div>
          <div className="canvas-foot">
            <button className="btn icon sm ghost" onClick={()=>setZoom(z=>Math.max(50,z-10))}>−</button>
            <div style={{fontSize:12,padding:'0 6px',minWidth:40,textAlign:'center'}}>{zoom}%</div>
            <button className="btn icon sm ghost" onClick={()=>setZoom(z=>Math.min(200,z+10))}>+</button>
            <div className="vdivider"/>
            <button className="btn sm ghost" onClick={()=>setZoom(100)} style={{fontSize:11}}>{t('editor.zoom.fit')}</button>
          </div>
        </div>

        <window.DevicePanelProvider device={device} setDevice={setDevice}>
          <aside className="side-panel" data-tour="right-panel">
            <div className="side-tabs" style={{padding:'8px 8px 4px'}}>
              <Tab label={selBlock?t('editor.rightTab.block'):t('editor.rightTab.section')} active={rightTab==='props'} onClick={()=>setRightTab('props')}/>
              <Tab label={t('editor.rightTab.design')} active={rightTab==='design'} onClick={()=>setRightTab('design')}/>
            </div>
            {rightTab==='props' && selBlock && <BlockProps block={selBlock} onChange={updateBlock} onDelete={()=>deleteBlock(sel.sectionId, sel.id)}/>}
            {rightTab==='props' && !selBlock && selSection && <SectionProps section={selSection} onChange={updateSection}/>}
            {rightTab==='props' && !selBlock && !selSection && <div className="side-body"><div style={{fontSize:12,color:'var(--fg-3)'}}>{t('editor.rightPanel.selectPrompt')}</div></div>}
            {rightTab==='design' && <DesignPanel/>}
          </aside>
        </window.DevicePanelProvider>
      </div>
      {improveBlock && <ImproveAIModal block={improveBlock} onClose={()=>setImproveBlock(null)} onApply={(newBlock)=>{ updateBlock(newBlock); setImproveBlock(null); }}/>}
      <ImagePickerModal
        open={!!picker}
        onClose={()=>setPicker(null)}
        onSelect={(img)=>{
          if (!picker) return;
          const patch = { content: {} };
          if (img.url) patch.content.src = img.url;
          if (img.name) patch.content.alt = img.alt || img.name;
          editBlockContent(picker.sectionId, picker.block, patch);
        }}
      />
      {showTour && !isBlockMode && <EditorTour onClose={()=>setShowTour(false)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Improve AI Modal — reescribe el texto de un bloque seleccionado
// ════════════════════════════════════════════════════════════════
function ImproveAIModal({ block, onClose, onApply }) {
  const t = window.stI18n.t;
  const lang = window.stI18n.useLang();
  const aiCfg = window.stStorage.getSetting('ai', {});
  const [action, setAction] = React.useState('rewrite');
  const [extra, setExtra] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [variants, setVariants] = React.useState([]);
  const [error, setError] = React.useState(null);

  const ACTIONS = React.useMemo(() => [
    {id:'rewrite',  t:t('editor.improveAi.action.rewrite'),   d:t('editor.improveAi.action.rewrite.desc'),   icon:'wand'},
    {id:'shorten',  t:t('editor.improveAi.action.shorten'),   d:t('editor.improveAi.action.shorten.desc'),   icon:'minus'},
    {id:'expand',   t:t('editor.improveAi.action.expand'),    d:t('editor.improveAi.action.expand.desc'),    icon:'plus'},
    {id:'tone',     t:t('editor.improveAi.action.tone'),      d:t('editor.improveAi.action.tone.desc'),      icon:'palette'},
    {id:'translate',t:t('editor.improveAi.action.translate'), d:t('editor.improveAi.action.translate.desc'), icon:'braces'},
    {id:'fix',      t:t('editor.improveAi.action.fix'),       d:t('editor.improveAi.action.fix.desc'),       icon:'check'},
  ], [lang]);

  const currentText = block.data?.content?.text || block.data?.content?.label || block.data?.text || block.data?.label || t('editor.improveAi.noText');

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const result = await window.stAI.improveText({ block, action, extra });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || t('editor.improveAi.errorDefault'));
      setVariants([]);
      return;
    }
    setVariants(result.variants.map((txt, i) => ({
      t: txt,
      label: t('editor.improveAi.variantN', { n: i + 1 }),
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
            <h3>{t('editor.improveAi.title')}</h3>
            <div className="sub">{t('editor.improveAi.subtitleBefore')}<b>{block.type}</b>{t('editor.improveAi.subtitleAfter')}</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={15}/></button>
        </div>
        <div className="modal-body">
          <div style={{padding:'10px 12px',background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:12.5,lineHeight:1.5,marginBottom:16,color:'var(--fg-2)',borderLeft:'3px solid var(--accent)'}}>
            <div style={{fontSize:10.5,color:'var(--fg-3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{t('editor.improveAi.currentText')}</div>
            {currentText}
          </div>

          <div className="prop-label" style={{marginBottom:8}}>{t('editor.improveAi.whatToDo')}</div>
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

          <div className="prop-label" style={{marginBottom:6}}>{t('editor.improveAi.extraLabel')}</div>
          <input className="field" value={extra} onChange={e=>setExtra(e.target.value)} placeholder={action==='tone'?t('editor.improveAi.extra.tone'):action==='translate'?t('editor.improveAi.extra.translate'):t('editor.improveAi.extra.default')}/>

          {error && (
            <div style={{
              marginTop:14,padding:12,
              background:'color-mix(in oklab, var(--danger) 12%, transparent)',
              borderRadius:'var(--r-md)',
              fontSize:12,color:'var(--danger)',
              display:'flex',gap:8,
            }}>
              <I.x size={14} style={{marginTop:1,flexShrink:0}}/>
              <div><b>{t('editor.improveAi.couldNotGenerate')}</b> {error}</div>
            </div>
          )}

          {variants.length > 0 && (
            <>
              <div className="prop-label" style={{marginTop:20,marginBottom:8}}>{t('editor.improveAi.proposals', { n: variants.length })}</div>
              <div className="col" style={{gap:8}}>
                {variants.map((v, i) => (
                  <div key={i} style={{padding:'12px 14px',border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--surface)'}}>
                    <div style={{fontSize:10.5,color:'var(--fg-3)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>{v.label}</div>
                    <div style={{fontSize:13,lineHeight:1.5,marginBottom:8}}>{v.t}</div>
                    <div className="row" style={{gap:6}}>
                      <button className="btn sm" onClick={()=>applyVariant(v.t)}><I.check size={11}/> {t('editor.improveAi.useThis')}</button>
                      <button className="btn sm ghost"><I.copy size={11}/> {t('common.copy')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-foot">
          <div style={{fontSize:11,color:'var(--fg-3)',flex:1}}>
            {t('editor.improveAi.using')}<b style={{color:'var(--fg-2)'}}>{aiCfg.provider==='openai'?'OpenAI':aiCfg.provider==='google'?'Gemini':aiCfg.provider==='ollama'?'Ollama':'Claude'}</b>
          </div>
          <button className="btn" onClick={onClose}>{t('common.close')}</button>
          <button className="btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><I.clock size={13}/> {t('editor.improveAi.thinking')}</> : <><I.sparkles size={13}/> {t('editor.improveAi.generate')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionInsertBtn({ onClick, onDropPreset, onDropSavedBlock }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [over, setOver] = React.useState(false);
  return (
    <div
      className={`section-insert${over?' drop-active':''}`}
      onDragOver={(e)=>{
        const types = Array.from(e.dataTransfer.types);
        const hasPreset = onDropPreset && types.includes('text/x-mc-section');
        const hasSaved  = onDropSavedBlock && types.includes('text/x-mc-saved-block');
        if (!hasPreset && !hasSaved) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setOver(true);
      }}
      onDragLeave={()=>setOver(false)}
      onDrop={(e)=>{
        const savedId = onDropSavedBlock ? e.dataTransfer.getData('text/x-mc-saved-block') : '';
        if (savedId) {
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          onDropSavedBlock(savedId);
          return;
        }
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
      <button className="section-insert-btn" onClick={onClick} title={t('editor.insert.emptySection')}>
        <I.plus size={14}/>
      </button>
      <div className="section-insert-line"/>
    </div>
  );
}

function BlockInsertBtn({ onClick, onDropBlock }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
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
      <button className="block-insert-btn" title={t('editor.insert.emptyBlock')} onClick={e=>{e.stopPropagation(); onClick();}}>
        <I.plus size={12}/>
      </button>
      <div className="block-insert-line"/>
    </div>
  );
}

// Serializes a padding value that may be a number or {top,right,bottom,left}
// into a CSS padding string. Falls back to 0 when undefined/null.
function resolvePaddingCss(p) {
  if (p == null) return 0;
  if (typeof p === 'number') return p;
  if (typeof p === 'object') {
    const tp = p.top || 0, rt = p.right || 0, bt = p.bottom || 0, lf = p.left || 0;
    return `${tp}px ${rt}px ${bt}px ${lf}px`;
  }
  return p;
}

// Produces CSS `border` shorthand (or shorthand per side) from a style's
// `border` field. Returns an object with optional borderTop/Right/Bottom/Left
// styles or a single `border` shorthand to spread into inline-style.
function resolveBorderStyle(b) {
  if (!b || typeof b !== 'object') return {};
  const w = typeof b.w === 'number' ? b.w : (typeof b.w === 'string' ? parseInt(b.w,10)||0 : 0);
  const s = b.style || 'solid';
  const c = b.color || 'transparent';
  if (b.sides && typeof b.sides === 'object') {
    const out = {};
    const sides = ['top','right','bottom','left'];
    for (const side of sides) {
      const sw = b.sides[side];
      const swn = typeof sw === 'number' ? sw : (typeof sw === 'string' ? parseInt(sw,10)||0 : w);
      const Cap = side.charAt(0).toUpperCase() + side.slice(1);
      out[`border${Cap}`] = `${swn}px ${s} ${c}`;
    }
    return out;
  }
  if (w > 0) return { border: `${w}px ${s} ${c}` };
  return {};
}

function resolveRadiusStyle(rs, corners) {
  const out = {};
  if (corners && typeof corners === 'object') {
    out.borderTopLeftRadius = typeof corners.tl === 'number' ? corners.tl : (rs || 0);
    out.borderTopRightRadius = typeof corners.tr === 'number' ? corners.tr : (rs || 0);
    out.borderBottomRightRadius = typeof corners.br === 'number' ? corners.br : (rs || 0);
    out.borderBottomLeftRadius = typeof corners.bl === 'number' ? corners.bl : (rs || 0);
    return out;
  }
  if (typeof rs === 'number' && rs > 0) out.borderRadius = rs;
  return out;
}

function SectionView({ section, selected, selectedBlockId, onSelectSection, onSelectBlock, onMoveUp, onMoveDown, onDuplicate, onDelete, onMoveBlock, onDeleteBlock, onAddBlankBlock, onDropBlock, onEditBlock, device }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const dev = device || 'desktop';
  const st = window.resolveStyle(section.style, section.mobile, dev);
  const font = FONT_OPTIONS.find(f => f.id===st.font) || FONT_OPTIONS[0];
  const [hover, setHover] = React.useState(false);
  const showChrome = selected || hover;
  const outerBg = st.outerBg || 'transparent';
  const outerPadY = st.outerPadY || 0;
  const innerWidth = st.width || 600;
  const visible = window.isVisibleOn(section.hidden, dev);
  const cols = section.columns || [];
  const stackOnMobile = section.stackOnMobile !== false; // default true
  const hiddenBadge = !visible ? (dev === 'mobile' ? t('section.badge.hiddenOnMobile') : t('section.badge.hiddenOnDesktop')) : null;

  // Determine columns layout (per-device)
  const colLayouts = cols.map((c) => {
    const mobW = c.mobile && typeof c.mobile.w === 'number' ? c.mobile.w : null;
    const colVisible = window.isVisibleOn(c.hidden, dev);
    const effW = dev === 'mobile'
      ? (mobW !== null ? mobW : (stackOnMobile ? 100 : (c.w || 0)))
      : (c.w || 0);
    return { colVisible, effW, stackedOnMobile: dev === 'mobile' && stackOnMobile && mobW === null };
  });

  // On mobile, if every column stacks (no mobile.w set and stackOnMobile true),
  // render as block (one column per row). Otherwise preserve horizontal layout
  // with effective widths (respecting hidden columns reducing effective span).
  const allStacked = dev === 'mobile' && colLayouts.every(x => x.stackedOnMobile);

  const vAlign = st.vAlign || 'top';
  const alignItems = vAlign === 'middle' ? 'center' : vAlign === 'bottom' ? 'flex-end' : 'flex-start';

  const borderStyles = resolveBorderStyle(st.border);
  const radiusStyles = resolveRadiusStyle(st.radius, st.radiusCorners);
  const bgImageStyles = st.bgImage ? {
    backgroundImage: `url(${st.bgImage})`,
    backgroundPosition: st.bgImagePosition || 'center center',
    backgroundRepeat: st.bgImageRepeat || 'no-repeat',
    backgroundSize: st.bgImageSize || 'cover',
  } : {};

  return (
    <div
      onClick={e=>{ e.stopPropagation(); onSelectSection(); }}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        position:'relative',
        background: outerBg,
        padding: `${outerPadY}px 0`,
        cursor:'pointer',
        outline: selected ? '2px solid var(--accent)' : hover ? '1px solid color-mix(in oklab, var(--accent) 50%, transparent)' : '1px solid transparent',
        outlineOffset:-1,
        transition:'outline-color 120ms',
        opacity: visible ? 1 : 0.3,
      }}
    >
      {hiddenBadge && (
        <div style={{
          position:'absolute',top:6,right:10,zIndex:11,
          background:'var(--warn, #b45309)',color:'#fff',
          padding:'2px 8px',borderRadius:12,fontSize:10,
          fontFamily:'var(--font-mono)',letterSpacing:'0.04em',
          pointerEvents:'none',
        }}>{hiddenBadge}</div>
      )}
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
            <button disabled={!onMoveUp} onClick={e=>{e.stopPropagation(); onMoveUp && onMoveUp();}} title={t('common.moveUp')}><I.chevronD size={11} style={{transform:'rotate(180deg)'}}/></button>
            <button disabled={!onMoveDown} onClick={e=>{e.stopPropagation(); onMoveDown && onMoveDown();}} title={t('common.moveDown')}><I.chevronD size={11}/></button>
            <button onClick={e=>{e.stopPropagation(); onDuplicate();}} title={t('common.duplicate')}><I.copy size={11}/></button>
            <button disabled={!onDelete} onClick={e=>{e.stopPropagation(); onDelete && onDelete();}} title={t('common.delete')} className="danger"><I.minus size={13}/></button>
          </div>
        </div>
      )}

      <div style={{
        background:st.bg,
        color:st.text,
        padding:resolvePaddingCss(st.padding),
        fontFamily:font.css,
        textAlign:st.align,
        maxWidth: dev === 'mobile' ? '100%' : innerWidth,
        margin: '0 auto',
        ...borderStyles,
        ...radiusStyles,
        ...bgImageStyles,
      }}>
        <div style={{
          display: allStacked ? 'block' : 'flex',
          gap:16,
          alignItems,
        }}>
          {cols.map((col, ci) => {
            const info = colLayouts[ci];
            if (!info.colVisible) {
              // Ghost: small dashed placeholder so user sees hidden column exists.
              return (
                <div key={ci} style={{
                  flex: allStacked ? 'none' : `0 0 ${info.effW || 5}%`,
                  width: allStacked ? '100%' : undefined,
                  border:'1px dashed color-mix(in oklab, currentColor 25%, transparent)',
                  opacity:0.4, padding:8, borderRadius:4,
                  fontSize:10, fontFamily:'var(--font-mono)',
                  textAlign:'center',
                  marginBottom: allStacked ? 12 : 0,
                }}>{dev === 'mobile' ? t('column.ghost.hiddenMobile') : t('column.ghost.hiddenDesktop')}</div>
              );
            }
            return (
              <div key={ci} style={{
                flex: allStacked ? 'none' : `0 0 calc(${info.effW}% - 8px)`,
                width: allStacked ? '100%' : undefined,
                marginBottom: allStacked && ci < cols.length - 1 ? 16 : 0,
              }}>
                <ColumnView
                  column={col}
                  colIdx={ci}
                  sectionId={section.id}
                  totalBlocks={col.blocks.length}
                  selectedBlockId={selectedBlockId}
                  device={dev}
                  onSelectBlock={(b)=>onSelectBlock(b, ci)}
                  onMoveBlock={(blockId,dir)=>onMoveBlock(ci,blockId,dir)}
                  onDeleteBlock={onDeleteBlock}
                  onAddBlankBlock={(atIdx)=>onAddBlankBlock(ci, atIdx)}
                  onDropBlock={(atIdx, blockType)=>onDropBlock(ci, atIdx, blockType)}
                  onEditBlock={onEditBlock}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ColumnView({ column, colIdx, sectionId, totalBlocks, selectedBlockId, onSelectBlock, onMoveBlock, onDeleteBlock, onAddBlankBlock, onDropBlock, onEditBlock, device }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [dragOver, setDragOver] = React.useState(false);
  const dev = device || 'desktop';
  const cStyle = window.resolveStyle(column.style || {}, column.mobile, dev);
  const colBg = cStyle.bg && cStyle.bg !== 'transparent' ? cStyle.bg : undefined;
  const hasCustomPadding = cStyle.padding !== undefined && cStyle.padding !== null
    && !(typeof cStyle.padding === 'number' && cStyle.padding === 0);
  const colPaddingCss = hasCustomPadding ? resolvePaddingCss(cStyle.padding) : null;
  const colBorder = resolveBorderStyle(cStyle.border);
  const colAlignMap = { left: 'left', center: 'center', right: 'right' };
  const textAlign = cStyle.align && colAlignMap[cStyle.align] ? cStyle.align : undefined;
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
        border: column.blocks.length || Object.keys(colBorder).length ? 'none' : '1px dashed color-mix(in oklab, currentColor 22%, transparent)',
        borderRadius:4,
        padding: (colPaddingCss !== null ? colPaddingCss : (column.blocks.length ? 0 : 12)),
        background: colBg,
        textAlign,
        display:'flex',flexDirection:'column',gap:2,
        position:'relative',
        outline: dragOver ? '2px dashed var(--accent)' : undefined,
        outlineOffset: dragOver ? 2 : undefined,
        ...colBorder,
        ...(dragOver ? { background: 'color-mix(in oklab, var(--accent) 10%, transparent)' } : {}),
        transition:'outline-color 120ms, background 120ms',
      }}
    >
      {column.blocks.length === 0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'12px 0'}}>
          <div style={{fontSize:11,opacity:0.5,fontFamily:'var(--font-mono)'}}>{dragOver ? t('editor.column.dropHere') : t('editor.column.empty')}</div>
          <button className="round-add" onClick={e=>{e.stopPropagation(); onAddBlankBlock(0);}} title={t('editor.column.addBlock')}>
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
              onClick={e=>{
                e.stopPropagation();
                onSelectBlock(b);
                // Shortcut: clicking an image block that has no src drops
                // you straight into the library picker. Any other block (or
                // image that already has a src) just selects and opens props.
                if (b.type === 'image') {
                  const src = b.data?.content?.src || b.data?.src;
                  if (!src && sectionId) {
                    window.dispatchEvent(new CustomEvent('st:pick-image-for-block', {
                      detail: { sectionId, blockId: b.id },
                    }));
                  }
                }
              }}
              style={{
                position:'relative',
                outline: isSel ? '2px solid var(--accent)' : '1px solid transparent',
                outlineOffset:2,
                cursor:'pointer',
                borderRadius:2,
              }}
            >
              {R
                ? <R data={b.data} device={dev} onEdit={onEditBlock ? (patch)=>onEditBlock(b, patch) : undefined}/>
                : <div style={{padding:12,opacity:0.5,fontFamily:'var(--font-mono)',fontSize:11}}>&lt;{b.type}/&gt;</div>}
              <div className="elem-actions block-actions" style={{opacity:isSel?1:undefined}}>
                <button disabled={bi===0} onClick={e=>{e.stopPropagation(); onMoveBlock(b.id,-1);}} title={t('common.moveUp')}><I.chevronD size={11} style={{transform:'rotate(180deg)'}}/></button>
                <button disabled={bi===column.blocks.length-1} onClick={e=>{e.stopPropagation(); onMoveBlock(b.id,1);}} title={t('common.moveDown')}><I.chevronD size={11}/></button>
                <button onClick={e=>{e.stopPropagation(); onDeleteBlock(b.id);}} title={t('common.delete')} className="danger"><I.minus size={13}/></button>
              </div>
            </div>
            <BlockInsertBtn onClick={()=>onAddBlankBlock(bi+1)} onDropBlock={(type)=>onDropBlock(bi+1, type)}/>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Outer-bg controls for SectionProps' Estilo tab. The full-width "wall" behind
// this section. `transparent` (default) = no wall, the canvas/inbox shows
// through. We use a Switch to opt in because <input type=color> can't hold
// 'transparent'; the last solid color is remembered for re-enable.
// Post-R1: rendered inside the Backgrounds collapsible group, so it no longer
// wraps itself in a .prop-group.
function SectionOuterGroup({ section, updStyle }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const outerBg = section.style.outerBg || 'transparent';
  const hasOuter = outerBg !== 'transparent';
  const lastBgRef = React.useRef(hasOuter ? outerBg : '#f6f5f1');
  if (hasOuter) lastBgRef.current = outerBg;
  return (
    <div>
      <div className="prop-label">{t('editor.sectionOuter.title')}</div>
      <div className="prop-row">
        <label>{t('editor.sectionOuter.show')}</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={hasOuter}
            onChange={e => updStyle('outerBg', e.target.checked ? lastBgRef.current : 'transparent')}
          />
          <span/>
        </label>
      </div>
      {hasOuter && (
        <div className="prop-row">
          <label>{t('editor.sectionProps.color')}</label>
          <ColorInput value={outerBg} onChange={v => updStyle('outerBg', v)}/>
        </div>
      )}
      <div style={{fontSize:11,color:'var(--fg-3)',marginTop:6,lineHeight:1.5}}>
        {t('editor.sectionOuter.hint')}
      </div>
    </div>
  );
}

function DesignPanel() {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  return (
    <div className="side-body">
      <div className="prop-group">
        <div style={{fontSize:12,color:'var(--fg-3)',lineHeight:1.6}}>
          {t('editor.design.hint')}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Editor });
