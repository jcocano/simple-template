// Controles reutilizables para propiedades de bloque
// Slider con valor visible, ColorPop, AlignBar, FontPicker, SpacingBox

function Slider({ value, onChange, min=0, max=100, step=1, suffix='px', compact=false }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8, minWidth:0}}>
      <input
        type="range" min={min} max={max} step={step}
        value={value} onChange={e=>onChange(parseInt(e.target.value,10))}
        style={{flex:1, minWidth:0, accentColor:'var(--accent)'}}
      />
      <input
        value={value}
        onChange={e=>{
          const n = parseInt((e.target.value||'').replace(/[^\d-]/g,''), 10);
          if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        style={{
          width: compact?42:56, height:26,
          background:'var(--surface-2)', border:'1px solid var(--line)',
          borderRadius:'var(--r-sm)', fontSize:11,
          padding:'0 6px', textAlign:'center', fontFamily:'var(--font-mono)',
        }}
      />
      {suffix && <span style={{fontSize:10,color:'var(--fg-3)',fontFamily:'var(--font-mono)'}}>{suffix}</span>}
    </div>
  );
}

// Quick-access brand palette for ColorInput. Reads brand.colors from the
// current workspace; refreshes on workspace switch + on brand setting change.
function useBrandColors() {
  const get = () => {
    const b = window.stStorage?.getWSSetting('brand', {}) || {};
    return Array.isArray(b.colors) ? b.colors : [];
  };
  const [colors, setColors] = React.useState(get);
  React.useEffect(() => {
    const refresh = () => setColors(get());
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
  return colors;
}

function ColorInput({ value='#000000', onChange }) {
  const brandColors = useBrandColors();
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',padding:'2px 4px 2px 2px'}}>
        <label style={{
          width:24, height:24, borderRadius:3,
          background:value, cursor:'pointer',
          border:'1px solid color-mix(in oklab, currentColor 10%, transparent)',
          flexShrink:0,
        }}>
          <input type="color" value={value} onChange={e=>onChange(e.target.value)}
            style={{opacity:0,width:0,height:0,pointerEvents:'auto'}}/>
        </label>
        <input
          value={value} onChange={e=>onChange(e.target.value)}
          style={{flex:1,minWidth:0,border:'none',background:'transparent',outline:'none',fontSize:11,fontFamily:'var(--font-mono)',textTransform:'uppercase'}}
        />
      </div>
      {brandColors.length > 0 && (
        <div style={{display:'flex',gap:4,flexWrap:'wrap',paddingLeft:2}}>
          {brandColors.slice(0,8).map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={()=>onChange(c)}
              title={`Marca · ${c}`}
              style={{
                width:16, height:16, borderRadius:3,
                background:c, cursor:'pointer',
                border:value?.toLowerCase()===c.toLowerCase()
                  ? '2px solid var(--accent)'
                  : '1px solid color-mix(in oklab, currentColor 18%, transparent)',
                padding:0,
                outline:'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlignBar({ value='left', onChange, options=['left','center','right','justify'] }) {
  const ic = { left:'align-l', center:'align-c', right:'align-r', justify:'align-j' };
  const labels = { left:'⟸', center:'≡', right:'⟹', justify:'≣' };
  return (
    <div className="seg" style={{width:'100%'}}>
      {options.map(o => (
        <button key={o} className={value===o?'on':''} onClick={()=>onChange(o)} title={o}
          style={{flex:1,fontFamily:'monospace',fontSize:13}}>
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <label className="switch" style={{display:'inline-flex'}}>
      <input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)}/><span/>
    </label>
  );
}

function FontPicker({ value='inter', onChange }) {
  const fonts = [
    { id:'inter', name:'Inter', stack:'Inter, sans-serif' },
    { id:'inter-tight', name:'Inter Tight', stack:'"Inter Tight", sans-serif' },
    { id:'fraunces', name:'Fraunces', stack:'Fraunces, serif' },
    { id:'dm-serif', name:'DM Serif', stack:'"DM Serif Display", serif' },
    { id:'instrument', name:'Instrument Serif', stack:'"Instrument Serif", serif' },
    { id:'playfair', name:'Playfair', stack:'"Playfair Display", serif' },
    { id:'space-grotesk', name:'Space Grotesk', stack:'"Space Grotesk", sans-serif' },
    { id:'ibm-plex', name:'IBM Plex', stack:'"IBM Plex Sans", sans-serif' },
    { id:'ibm-plex-mono', name:'IBM Plex Mono', stack:'"IBM Plex Mono", monospace' },
    { id:'georgia', name:'Georgia', stack:'Georgia, serif' },
    { id:'helvetica', name:'Helvetica', stack:'Helvetica, Arial, sans-serif' },
    { id:'system', name:'Sistema', stack:'-apple-system, system-ui, sans-serif' },
  ];
  const cur = fonts.find(f=>f.id===value) || fonts[0];
  return (
    <select className="field" value={value} onChange={e=>onChange(e.target.value)}
      style={{fontFamily:cur.stack}}>
      {fonts.map(f => <option key={f.id} value={f.id} style={{fontFamily:f.stack}}>{f.name}</option>)}
    </select>
  );
}

function Row({ label, children, hint }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'82px 1fr',gap:10,alignItems:'center',padding:'4px 0'}}>
      <label style={{fontSize:11.5,color:'var(--fg-3)',lineHeight:1.3}} title={hint}>{label}</label>
      <div style={{minWidth:0}}>{children}</div>
    </div>
  );
}

function Group({ title, children, collapsible=false, defaultOpen=true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{
      padding:'12px 14px',
      borderBottom:'1px solid var(--line)',
    }}>
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.06em',
        color:'var(--fg-3)',fontWeight:600,marginBottom:open?10:0,
        cursor:collapsible?'pointer':'default',
      }} onClick={()=>collapsible&&setOpen(!open)}>
        {title}
        {collapsible && <span style={{fontSize:12,color:'var(--fg-3)'}}>{open?'−':'+'}</span>}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

// SpacingBox — caja visual para padding/margin (4 lados)
function SpacingBox({ value=[0,0,0,0], onChange, label='Padding', max=80 }) {
  const [top,right,bottom,left] = value;
  const upd = (i, v) => {
    const n = [...value]; n[i] = v; onChange(n);
  };
  const [linked, setLinked] = React.useState(
    top===right && right===bottom && bottom===left
  );
  const setAll = (v) => { onChange([v,v,v,v]); };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <span style={{fontSize:11.5,color:'var(--fg-3)'}}>{label}</span>
        <button
          onClick={()=>setLinked(!linked)}
          title={linked?'Valores enlazados':'Valores individuales'}
          style={{
            width:22,height:22,borderRadius:4,
            border:'1px solid var(--line)',
            background: linked?'var(--accent-soft)':'var(--surface-2)',
            color: linked?'var(--accent)':'var(--fg-3)',
            cursor:'pointer',fontSize:11,display:'grid',placeItems:'center',
          }}
        >
          {linked ? '⚯' : '⚭'}
        </button>
      </div>

      {linked ? (
        <Slider value={top} onChange={setAll} max={max}/>
      ) : (
        <div style={{
          padding:10,
          border:'1px dashed var(--line-2)',
          borderRadius:'var(--r-sm)',
          background:'var(--surface-2)',
          display:'grid',
          gridTemplateColumns:'1fr 1fr 1fr',
          gridTemplateRows:'auto auto auto',
          gap:4, textAlign:'center',
        }}>
          <div/>
          <SpacingField v={top} onChange={v=>upd(0,v)} max={max}/>
          <div/>
          <SpacingField v={left} onChange={v=>upd(3,v)} max={max}/>
          <div style={{
            background:'var(--accent-soft)',borderRadius:3,
            minHeight:32,display:'grid',placeItems:'center',
            fontSize:9,color:'var(--accent)',fontFamily:'var(--font-mono)',
          }}>{label[0]}</div>
          <SpacingField v={right} onChange={v=>upd(1,v)} max={max}/>
          <div/>
          <SpacingField v={bottom} onChange={v=>upd(2,v)} max={max}/>
          <div/>
        </div>
      )}
    </div>
  );
}

function SpacingField({ v, onChange, max=80 }) {
  return (
    <input
      value={v||0}
      onChange={e=>{
        const n = parseInt((e.target.value||'').replace(/\D/g,''),10);
        if (!isNaN(n)) onChange(Math.min(max,Math.max(0,n)));
      }}
      style={{
        width:'100%',height:28,
        border:'1px solid var(--line)',background:'var(--surface)',
        borderRadius:3,fontSize:11,fontFamily:'var(--font-mono)',
        textAlign:'center',outline:'none',
      }}
    />
  );
}

Object.assign(window, { Slider, ColorInput, AlignBar, Toggle, FontPicker, Row, Group, SpacingBox });
