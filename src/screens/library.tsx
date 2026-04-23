// Library of saved blocks

function Library({ onBack }) {
  const renderMini = (kind) => {
    const styles = {
      header: <div style={{width:'100%',padding:'10px 14px',background:'#fff',border:'1px solid #eee',display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{fontWeight:700,fontSize:11}}>Acme</div><div style={{fontSize:9,color:'#999'}}>Menu</div></div>,
      footer: <div style={{width:'100%',padding:10,background:'#f3f1ea',fontSize:9,color:'#6a6960',textAlign:'center'}}>Acme · CDMX · Desuscribir · Preferencias</div>,
      cta: <div style={{width:'100%',padding:14,background:'#fff',textAlign:'center'}}><div style={{display:'inline-block',padding:'8px 16px',background:'#c6513b',color:'#fff',borderRadius:3,fontSize:10,fontWeight:500}}>Comprar ahora</div></div>,
      testimonial: <div style={{width:'100%',padding:10,background:'#fff',fontStyle:'italic',fontSize:10,color:'#444'}}>"Gran servicio, muy recomendado." <div style={{fontStyle:'normal',color:'#888',fontSize:9,marginTop:4}}>— María G.</div></div>,
      product: <div style={{width:'100%',padding:10,background:'#fff',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>{[0,1].map(i=><div key={i}><div style={{aspectRatio:'1',background:'#eee',borderRadius:2,marginBottom:4}}/><div style={{fontSize:9}}>Producto {i+1}</div></div>)}</div>,
      social: <div style={{width:'100%',padding:10,background:'#fff',display:'flex',gap:8,justifyContent:'center'}}>{[0,1,2,3].map(i=><div key={i} style={{width:18,height:18,borderRadius:'50%',background:'#1a1a17'}}/>)}</div>,
      signature: <div style={{width:'100%',padding:10,background:'#fff',display:'flex',alignItems:'center',gap:8,fontSize:10}}><div style={{width:24,height:24,borderRadius:'50%',background:'#ddd'}}/><div><div style={{fontWeight:600}}>Carmen Luna</div><div style={{color:'#888',fontSize:9}}>Acme · Fundadora</div></div></div>,
    };
    return styles[kind] || <div>—</div>;
  };
  const [cat, setCat] = React.useState('Todos');
  const [q, setQ] = React.useState('');

  const CATS = ['Todos','Cabeceras','Footers','CTAs','Testimonios','Productos','Social'];
  const CAT_MAP = {
    'Cabeceras':'header', 'Footers':'footer', 'CTAs':'cta',
    'Testimonios':'testimonial', 'Productos':'product', 'Social':'social',
  };
  const filtered = SAVED_BLOCKS.filter(b => {
    const matchCat = cat==='Todos' || b.kind === CAT_MAP[cat];
    const matchQ = !q.trim() || b.name.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="editor">
      <div className="editor-top">
        <button className="btn ghost sm" onClick={onBack}><I.chevronL size={14}/> Biblioteca</button>
        <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,letterSpacing:-0.2}}>Bloques guardados</div>
        <span className="chip">{filtered.length} bloque{filtered.length===1?'':'s'}{q||cat!=='Todos'?` de ${SAVED_BLOCKS.length}`:''}</span>
        <div className="grow"/>
        <div className="search">
          <span className="si"><I.search size={14}/></span>
          <input placeholder="Buscar bloques…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <ThemeToggleBtn/>
        <button className="btn primary sm" onClick={()=>window.toast && window.toast({kind:'ok', title:'Bloque guardado en tu biblioteca', msg:'Podrás reusarlo en cualquier plantilla.'})}><I.plus size={13}/> Guardar nuevo</button>
      </div>

      <div style={{display:'flex',gap:6,padding:'12px 24px',borderBottom:'1px solid var(--line)',background:'var(--surface)',overflowX:'auto'}}>
        {CATS.map(c => (
          <button key={c} className={`btn sm ${c===cat?'primary':''}`} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="dash-body">
        {filtered.length === 0 ? (
          <EmptyState
            illustration={q ? 'search' : 'no-blocks'}
            title={q
              ? `Nada que coincida con «${q}»`
              : cat==='Todos'
                ? 'Aún no guardas bloques'
                : `Nada en «${cat}» todavía`}
            msg={q
              ? 'Prueba con otra palabra, o cambia de categoría en la barra de arriba.'
              : cat==='Todos'
                ? 'Cuando diseñes una cabecera, un botonazo de llamada a la acción o un footer que te guste, guárdalo aquí. Luego lo arrastras a cualquier plantilla.'
                : 'Guarda algo que uses a menudo y lo tendrás a mano en segundos.'}
            primaryAction={q
              ? { label:'Limpiar búsqueda', icon:'x', onClick:()=>setQ('') }
              : { label:'Crear uno nuevo', icon:'plus', onClick:()=>window.toast && window.toast({kind:'info', title:'Abre una plantilla, diseña el bloque y pulsa «Guardar bloque» en su barra.'}) }}
            secondaryAction={cat!=='Todos' && !q ? { label:'Ver todos', icon:'grid', onClick:()=>setCat('Todos') } : null}
            tips={!q && cat==='Todos' ? [
              'Tus bloques quedan disponibles en el editor bajo «Mis bloques».',
              'Las variables {{nombre}} se guardan y se rellenan solas al reusar el bloque.',
            ] : []}
          />
        ) : (
          <div className="lib-grid">
            {filtered.map(b => (
              <div key={b.id} className="lib-block">
                <div className="lp">{renderMini(b.kind)}</div>
                <div className="lm">
                  <div className="lt">{b.name}</div>
                  <div className="ls">Usado en {b.usedIn} plantillas · <span style={{fontFamily:'var(--font-mono)'}}>&lt;mj-{b.kind}&gt;</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.Library = Library;
