// AI Improve Modal — se abre al hacer clic en ✨ en la toolbar de un bloque
// Escucha el evento window 'st:improve' y muestra variantes con toasts

function AIImproveModal() {
  const [block, setBlock] = React.useState(null);
  const [tone, setTone] = React.useState('clearer');
  const [lang, setLang] = React.useState('es');
  const [busy, setBusy] = React.useState(false);
  const [variants, setVariants] = React.useState([]);

  React.useEffect(() => {
    const h = (e) => {
      setBlock(e.detail.block);
      setVariants([]);
      setTone('clearer');
      setBusy(false);
    };
    window.addEventListener('st:improve', h);
    return () => window.removeEventListener('st:improve', h);
  }, []);

  if (!block) return null;

  const TONES = [
    { id:'clearer',   t:'Más claro',      d:'Frases cortas, menos palabras de relleno',      icon:'check' },
    { id:'friendly',  t:'Más cercano',    d:'Tono conversacional, como hablar con un amigo', icon:'sparkles' },
    { id:'pro',       t:'Más profesional',d:'Formal, sin modismos, tono corporativo',        icon:'settings' },
    { id:'short',     t:'Acortar',        d:'La mitad de palabras, mismo mensaje',           icon:'minus' },
    { id:'expand',    t:'Ampliar',        d:'Añade contexto y detalles útiles',              icon:'plus' },
    { id:'translate', t:'Traducir',       d:'Cambia el idioma manteniendo el tono',          icon:'info' },
  ];

  const handleGenerate = () => {
    setBusy(true);
    setVariants([]);
    // Mock: 3 variantes
    setTimeout(() => {
      const source = block.props?.text || block.props?.content || 'Texto de ejemplo que se va a mejorar con inteligencia artificial.';
      const fakeVariants = [
        source.split('.')[0] + '. Directo al grano.',
        '👋 ' + source.slice(0, 90) + '…',
        source.replace(/\./g, ' —') + ' Gracias por leer.',
      ];
      setVariants(fakeVariants);
      setBusy(false);
      window.toast && window.toast({
        kind:'ai',
        title:'3 variantes listas',
        msg:'Elige la que más te guste o pídenos otra ronda.',
      });
    }, 1400);
  };

  const handleApply = (v, i) => {
    window.toast && window.toast({
      kind:'ok',
      title:`Variante ${i+1} aplicada`,
      msg:'El bloque se actualizó con la nueva versión.',
      action: { label:'Deshacer', onClick:()=>window.toast({kind:'info', title:'Se restauró el texto anterior'}) },
    });
    setBlock(null);
  };

  return (
    <div className="modal-backdrop" onClick={()=>setBlock(null)}>
      <div className="modal wide pop" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="title" style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:24,height:24,borderRadius:6,background:'color-mix(in oklab, var(--accent) 15%, transparent)',color:'var(--accent)',display:'grid',placeItems:'center'}}>
                <I.sparkles size={13}/>
              </div>
              Mejorar este bloque con IA
            </div>
            <div className="sub">Elige el ajuste que quieres y te damos 3 versiones para que escojas.</div>
          </div>
          <button className="btn icon ghost" onClick={()=>setBlock(null)}><I.x size={15}/></button>
        </div>
        <div className="modal-body">
          {/* Preview del texto actual */}
          <div style={{marginBottom:16}}>
            <div className="prop-label">Texto actual</div>
            <div style={{padding:12,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',fontSize:13,lineHeight:1.5,color:'var(--fg-2)',maxHeight:90,overflow:'auto'}}>
              {block.props?.text || block.props?.content || 'Texto de ejemplo que se va a mejorar con inteligencia artificial.'}
            </div>
          </div>

          {/* Selector de tono */}
          <div style={{marginBottom:16}}>
            <div className="prop-label">¿Qué quieres cambiar?</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:8}}>
              {TONES.map(tn => {
                const Ico = I[tn.icon] || I.sparkles;
                return (
                  <button key={tn.id} className={`tile ${tone===tn.id?'sel':''}`}
                    onClick={()=>setTone(tn.id)}
                    style={{
                      textAlign:'left',padding:'10px 12px',
                      background: tone===tn.id ? 'color-mix(in oklab, var(--accent) 10%, var(--surface))' : 'var(--surface)',
                      border: tone===tn.id ? '1px solid var(--accent)' : '1px solid var(--line)',
                      borderRadius:'var(--r-sm)',cursor:'pointer',
                      display:'flex',flexDirection:'column',gap:4,
                    }}>
                    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,fontWeight:500,color:'var(--fg)'}}>
                      <Ico size={12}/> {tn.t}
                    </div>
                    <div style={{fontSize:10.5,color:'var(--fg-3)',lineHeight:1.4}}>{tn.d}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {tone === 'translate' && (
            <div style={{marginBottom:16}}>
              <div className="prop-label">Idioma destino</div>
              <select className="field" value={lang} onChange={e=>setLang(e.target.value)} style={{width:240}}>
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
                <option value="fr">Francés</option>
                <option value="de">Alemán</option>
                <option value="it">Italiano</option>
              </select>
            </div>
          )}

          {/* Variantes generadas */}
          {variants.length > 0 && (
            <div>
              <div className="prop-label">Elige una versión</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {variants.map((v, i) => (
                  <div key={i} style={{
                    padding:12,
                    background:'var(--surface)',
                    border:'1px solid var(--line)',
                    borderRadius:'var(--r-sm)',
                    display:'flex',alignItems:'flex-start',gap:10,
                  }}>
                    <div style={{width:22,height:22,borderRadius:6,background:'color-mix(in oklab, var(--accent) 15%, transparent)',color:'var(--accent)',display:'grid',placeItems:'center',flexShrink:0,fontSize:11,fontWeight:600}}>
                      {i+1}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,lineHeight:1.5,color:'var(--fg)'}}>{v}</div>
                    </div>
                    <button className="btn sm primary" onClick={()=>handleApply(v, i)}>
                      <I.check size={11}/> Usar esta
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {busy && (
            <div style={{padding:20,textAlign:'center',color:'var(--fg-3)',fontSize:12}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
                <div className="spinner" style={{width:14,height:14,border:'2px solid var(--line)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                Generando 3 versiones…
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={()=>setBlock(null)}>Cancelar</button>
          <button className="btn primary" onClick={handleGenerate} disabled={busy}>
            <I.sparkles size={13}/> {variants.length ? 'Regenerar' : 'Generar 3 versiones'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AIImproveModal });
