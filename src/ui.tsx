// Reusable UI primitives

function IconBtn({ icon, onClick, title, size = 'md', active, ...rest }) {
  const Ico = window.I[icon];
  return (
    <button className={`btn icon ${size==='sm'?'sm':''} ${active?'primary':'ghost'}`} onClick={onClick} title={title} {...rest}>
      {Ico && <Ico size={size==='sm'?14:16}/>}
    </button>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value===o.value?'on':''} onClick={()=>onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

function Num({ value, onChange, min=0, max=400, suffix='px' }) {
  return (
    <div className="num-field">
      <button onClick={()=>onChange(Math.max(min, value-1))}>−</button>
      <input value={`${value}${suffix}`} onChange={e=>{
        const n = parseInt(e.target.value.replace(/\D/g,''))||0;
        onChange(Math.min(max, Math.max(min, n)));
      }}/>
      <button onClick={()=>onChange(Math.min(max, value+1))}>+</button>
    </div>
  );
}

function Swatch({ color, onClick, label }) {
  return (
    <div className="color-field" onClick={onClick}>
      <div className="color-swatch" style={{background:color}}/>
      <input value={color} readOnly/>
    </div>
  );
}

function Avatar({ name, size=24, color }) {
  const initials = name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  const bg = color || `oklch(0.75 0.08 ${(name.charCodeAt(0)*37)%360})`;
  return (
    <div style={{
      width:size,height:size,borderRadius:'50%',
      background:bg,color:'#1a1a17',
      display:'grid',placeItems:'center',
      fontSize:size*0.42,fontWeight:600,flexShrink:0,
    }}>{initials}</div>
  );
}

function Tab({ label, active, onClick, icon }) {
  const Ico = icon && window.I[icon];
  return (
    <button className={`side-tab ${active?'on':''}`} onClick={onClick}>
      {Ico && <Ico size={13} />} {label}
    </button>
  );
}

function Tooltip({ label, children, side='bottom' }) {
  return <span title={label}>{children}</span>;
}

// Shared app-theme (light/dark) toggle. Subscribes to App's tweaks via
// `mc:tweaks-change` so every instance stays in sync regardless of screen.
function ThemeToggleBtn({ size = 'sm', ...rest }) {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const onChange = () => force();
    window.addEventListener('mc:tweaks-change', onChange);
    return () => window.removeEventListener('mc:tweaks-change', onChange);
  }, []);
  const mode = (window.__mcTweaks && window.__mcTweaks.mode) || 'light';
  return (
    <IconBtn
      icon={mode==='dark' ? 'sun' : 'moon'}
      size={size}
      title={mode==='dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={()=>window.__mcSetTweaks && window.__mcSetTweaks(t=>({...t, mode: t.mode==='dark'?'light':'dark'}))}
      {...rest}
    />
  );
}

Object.assign(window, { IconBtn, Seg, Num, Swatch, Avatar, Tab, Tooltip, ThemeToggleBtn });
