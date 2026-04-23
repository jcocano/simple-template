// Tweaks panel + app wiring

function TweaksPanel({ tweaks, setTweaks, visible }) {
  const themes = [
    { id:'indigo', name:'Indigo', color:'#5b5bf0' },
    { id:'ocean',  name:'Ocean',  color:'#2b6cb0' },
    { id:'violet', name:'Violet', color:'#7c3aed' },
  ];
  const update = (k,v) => {
    const next = {...tweaks,[k]:v};
    setTweaks(next);
    window.parent.postMessage({type:'__edit_mode_set_keys',edits:{[k]:v}},'*');
  };
  return (
    <div className={`tweaks ${visible?'':'hidden'}`}>
      <div className="th">
        <I.sparkle size={14} style={{color:'var(--accent)'}}/>
        <h4>Tweaks</h4>
        <div className="grow"/>
        <span style={{fontSize:10,color:'var(--fg-3)'}}>Variante visual</span>
      </div>
      <div className="tb">
        <div className="tw-row">
          <label>Dirección estética</label>
          <div className="seg">
            {themes.map(t => (
              <button key={t.id} className={tweaks.theme===t.id?'on':''} onClick={()=>update('theme',t.id)}>{t.name}</button>
            ))}
          </div>
        </div>

        <div className="tw-row">
          <label>Modo</label>
          <div className="seg">
            <button className={tweaks.mode==='light'?'on':''} onClick={()=>update('mode','light')}><I.sun size={12}/> Claro</button>
            <button className={tweaks.mode==='dark'?'on':''} onClick={()=>update('mode','dark')}><I.moon size={12}/> Oscuro</button>
          </div>
        </div>

        <div className="tw-row">
          <label>Densidad</label>
          <div className="seg">
            <button className={tweaks.density==='compact'?'on':''} onClick={()=>update('density','compact')}>Compacta</button>
            <button className={tweaks.density==='comfortable'?'on':''} onClick={()=>update('density','comfortable')}>Cómoda</button>
          </div>
        </div>

        <div className="tw-row">
          <label>Radio</label>
          <div className="seg">
            <button className={tweaks.radius==='sharp'?'on':''} onClick={()=>update('radius','sharp')}>Marcado</button>
            <button className={tweaks.radius==='soft'?'on':''} onClick={()=>update('radius','soft')}>Suave</button>
            <button className={tweaks.radius==='round'?'on':''} onClick={()=>update('radius','round')}>Redondo</button>
          </div>
        </div>

        <div className="tw-row">
          <label>Layout editor</label>
          <div className="seg">
            <button className={tweaks.layoutPanels===2?'on':''} onClick={()=>update('layoutPanels',2)}>2 paneles</button>
            <button className={tweaks.layoutPanels===3?'on':''} onClick={()=>update('layoutPanels',3)}>3 paneles</button>
          </div>
        </div>

        <div className="tw-row">
          <label>Fuente de interfaz</label>
          <select className="field" value={tweaks.font} onChange={e=>update('font',e.target.value)}>
            <option value="inter-tight">Inter Tight (por defecto)</option>
            <option value="inter">Inter</option>
            <option value="instrument-serif">Instrument Serif (títulos)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
