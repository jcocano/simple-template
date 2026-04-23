// Pre-flight Review Panel — checklist antes de enviar
// Se abre como panel lateral derecho desde el editor o el command palette

function ReviewPanel({ onClose, onGoSettings }) {
  const [running, setRunning] = React.useState(true);
  const [results, setResults] = React.useState([]);
  const [fixed, setFixed] = React.useState({});

  React.useEffect(() => {
    // Simula análisis progresivo
    const checks = ALL_CHECKS;
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      if (i >= checks.length) {
        setRunning(false);
        return;
      }
      const item = checks[i];
      i++;
      if (item) setResults(r => [...r, item]);
      setTimeout(tick, 140);
    };
    const id = setTimeout(tick, 140);
    return () => { cancelled = true; clearTimeout(id); };
  }, []);

  const summary = React.useMemo(() => {
    const s = { ok:0, warn:0, error:0, info:0 };
    results.forEach(r => { if (!fixed[r.id]) s[r.kind] = (s[r.kind]||0) + 1; else s.ok++; });
    return s;
  }, [results, fixed]);

  const grouped = React.useMemo(() => {
    const g = {};
    results.forEach(r => { (g[r.cat] = g[r.cat] || []).push(r); });
    return g;
  }, [results]);

  const score = results.length === 0 ? 0 :
    Math.round(((results.filter(r=>r.kind==='ok'||fixed[r.id]).length) / results.length) * 100);

  const markFixed = (id) => {
    setFixed(f => ({...f, [id]:true}));
    window.toast && window.toast({ kind:'ok', title:'Arreglado', msg:'Se aplicó la corrección automática.' });
  };

  return (
    <div onClick={onClose} style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,.35)',
      zIndex:100,backdropFilter:'blur(4px)',
      display:'flex',justifyContent:'flex-end',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'min(480px, 100vw)',height:'100vh',
        background:'var(--surface)',
        borderLeft:'1px solid var(--line)',
        boxShadow:'-12px 0 40px -12px rgba(0,0,0,.3)',
        display:'flex',flexDirection:'column',
      }}>
        {/* Head */}
        <div style={{padding:'18px 22px 14px',borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <div style={{
              width:30,height:30,borderRadius:8,
              background:'var(--accent)',color:'#fff',
              display:'grid',placeItems:'center',
            }}><I.eye size={15}/></div>
            <div style={{flex:1}}>
              <h3 style={{margin:0,fontSize:15,fontWeight:600,fontFamily:'var(--font-display)'}}>Revisar antes de enviar</h3>
              <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:2}}>Chequeo completo del correo</div>
            </div>
            <button className="btn icon ghost" onClick={onClose}><I.x size={14}/></button>
          </div>

          {/* Score bar */}
          <div style={{
            marginTop:14,padding:'12px 14px',
            background:'var(--surface-2)',
            borderRadius:'var(--r-md)',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <div style={{
                fontSize:22,fontWeight:600,
                color: score >= 90 ? 'var(--ok)' : score >= 70 ? 'var(--warn)' : 'var(--danger)',
                fontFamily:'var(--font-display)',
              }}>{score}<span style={{fontSize:14,color:'var(--fg-3)'}}>/100</span></div>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:500}}>
                  {running ? 'Analizando…' : score >= 90 ? '¡Listo para enviar!' : score >= 70 ? 'Hay algunas sugerencias' : 'Tiene problemas a revisar'}
                </div>
                <div style={{fontSize:11,color:'var(--fg-3)'}}>
                  {results.length} revisiones · {summary.ok} bien · {summary.warn} avisos · {summary.error} fallas
                </div>
              </div>
            </div>
            <div style={{height:6,borderRadius:3,background:'var(--surface)',overflow:'hidden'}}>
              <div style={{
                height:'100%',width:`${score}%`,
                background: score >= 90 ? 'var(--ok)' : score >= 70 ? 'var(--warn)' : 'var(--danger)',
                transition:'width 300ms, background 200ms',
              }}/>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div style={{flex:1,overflow:'auto',padding:'14px 22px 20px'}}>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{marginBottom:20}}>
              <div style={{
                fontSize:10.5,fontWeight:600,color:'var(--fg-3)',
                textTransform:'uppercase',letterSpacing:'.06em',
                marginBottom:8,
              }}>{cat}</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {items.map(r => (
                  <ReviewItem key={r.id} r={r} fixed={!!fixed[r.id]} onFix={()=>markFixed(r.id)} onGoSettings={onGoSettings}/>
                ))}
              </div>
            </div>
          ))}
          {running && (
            <div style={{padding:'10px 14px',fontSize:12,color:'var(--fg-3)',display:'flex',alignItems:'center',gap:8}}>
              <div className="spinner" style={{width:12,height:12,border:'2px solid var(--line)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
              Analizando el correo…
            </div>
          )}
        </div>

        {/* Foot */}
        <div style={{
          padding:'14px 22px',borderTop:'1px solid var(--line)',
          background:'var(--surface-2)',
          display:'flex',gap:8,alignItems:'center',
        }}>
          <div style={{flex:1,fontSize:11,color:'var(--fg-3)'}}>
            {running ? 'Analizando…' : summary.error > 0 ? 'Corrige las fallas antes de enviar' : '¡Ya puedes enviarlo con confianza!'}
          </div>
          <button className="btn" onClick={onClose}>Cerrar</button>
          <button className="btn primary" disabled={running || summary.error > 0}>
            <I.send size={12}/> Enviar prueba
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } } @keyframes slideInRight { from { transform:translateX(100%); } to { transform:none; } }`}</style>
    </div>
  );
}

function ReviewItem({ r, fixed, onFix, onGoSettings }) {
  const [expanded, setExpanded] = React.useState(r.kind === 'error');
  const kindColor = fixed ? 'var(--ok)' : r.kind === 'ok' ? 'var(--ok)' : r.kind === 'warn' ? 'var(--warn)' : r.kind === 'error' ? 'var(--danger)' : 'var(--fg-3)';
  const kindIco = fixed ? I.check : r.kind === 'ok' ? I.check : r.kind === 'warn' ? I.info : r.kind === 'error' ? I.x : I.info;
  const Ico = kindIco;
  return (
    <div style={{
      border:'1px solid var(--line)',borderRadius:'var(--r-md)',
      overflow:'hidden',background:'var(--surface)',
      borderLeft: `3px solid ${kindColor}`,
    }}>
      <div onClick={()=>setExpanded(e=>!e)} style={{
        display:'flex',alignItems:'center',gap:10,
        padding:'10px 12px',cursor:'pointer',
      }}>
        <div style={{
          width:20,height:20,borderRadius:'50%',flexShrink:0,
          background: `color-mix(in oklab, ${kindColor} 18%, transparent)`,
          color:kindColor,
          display:'grid',placeItems:'center',
        }}><Ico size={10}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12.5,fontWeight:500,color: fixed ? 'var(--fg-3)' : 'var(--fg)',textDecoration: fixed?'line-through':'none'}}>{r.title}</div>
          {!expanded && r.detail && <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.detail}</div>}
        </div>
        <I.chevronD size={12} style={{color:'var(--fg-3)',transform:expanded?'rotate(180deg)':'none',transition:'transform 150ms'}}/>
      </div>
      {expanded && (
        <div style={{padding:'0 12px 12px',fontSize:11.5,color:'var(--fg-2)',lineHeight:1.5}}>
          {r.detail && <div style={{marginBottom:r.fixes?8:0}}>{r.detail}</div>}
          {r.fixes && !fixed && (
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
              {r.fixes.map((f,i) => (
                <button key={i} className="btn sm" onClick={()=>{ f.goSettings ? onGoSettings(f.goSettings) : onFix(); }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
          {fixed && <div style={{color:'var(--ok)',fontSize:11,marginTop:4}}>✓ Corregido</div>}
        </div>
      )}
    </div>
  );
}

// Mock checks — cubre categorías reales de email marketing
const ALL_CHECKS = [
  // Contenido
  { id:'c1', cat:'Contenido',      kind:'ok',    title:'Asunto no está vacío',              detail:'"Hola {{nombre}}, novedades de noviembre" · 38 caracteres (bien)' },
  { id:'c2', cat:'Contenido',      kind:'warn',  title:'Preview text corto',                 detail:'Solo 22 caracteres. Se recomienda entre 40 y 90 para que los clientes de correo lo muestren completo.', fixes:[{label:'Generar con IA'},{label:'Edité manualmente'}] },
  { id:'c3', cat:'Contenido',      kind:'ok',    title:'Hay al menos un botón CTA',          detail:'1 botón · "Ver colección"' },
  { id:'c4', cat:'Contenido',      kind:'error', title:'Etiqueta {{nombre}} sin valor por defecto', detail:'Si un contacto no tiene nombre, aparecerá "Hola , novedades…".', fixes:[{label:'Poner "amigo" como default'},{label:'Ir a Etiquetas',goSettings:'vars'}] },
  { id:'c5', cat:'Contenido',      kind:'ok',    title:'Longitud total adecuada',            detail:'184 palabras · correos de 100-300 palabras tienen mejor engagement' },

  // Accesibilidad
  { id:'a1', cat:'Accesibilidad',  kind:'error', title:'Imagen sin texto alternativo',       detail:'La imagen "hero-otono.jpg" no tiene atributo alt. Los lectores de pantalla no sabrán qué es.', fixes:[{label:'Sugerir alt con IA'},{label:'Ir al bloque'}] },
  { id:'a2', cat:'Accesibilidad',  kind:'warn',  title:'Contraste bajo en un botón',         detail:'Botón azul sobre fondo lila tiene contraste 3.1:1. Mínimo recomendado: 4.5:1 (AA).', fixes:[{label:'Oscurecer el fondo'},{label:'Aclarar el texto'}] },
  { id:'a3', cat:'Accesibilidad',  kind:'ok',    title:'Tamaño de tipografía legible',       detail:'Texto del cuerpo en 16px, títulos ≥ 22px' },
  { id:'a4', cat:'Accesibilidad',  kind:'ok',    title:'Estructura semántica correcta',      detail:'Un solo H1, jerarquía lógica de H2/H3' },

  // Compatibilidad
  { id:'k1', cat:'Compatibilidad', kind:'warn',  title:'Uso de CSS no soportado en Outlook', detail:'Se detectaron 2 usos de "flexbox" y 1 de "background-image en div". Outlook los ignora silenciosamente.', fixes:[{label:'Convertir a tablas'},{label:'Ignorar Outlook'}] },
  { id:'k2', cat:'Compatibilidad', kind:'ok',    title:'HTML válido',                        detail:'Sin etiquetas no cerradas. Pasa validación W3C.' },
  { id:'k3', cat:'Compatibilidad', kind:'ok',    title:'Ancho máximo 600px',                  detail:'El correo se ve bien tanto en web como en clientes móviles' },
  { id:'k4', cat:'Compatibilidad', kind:'info',  title:'Modo oscuro de Gmail',                detail:'Gmail invierte los colores automáticamente. Tu correo se verá razonable pero considera probarlo.' },

  // Imágenes y pesos
  { id:'i1', cat:'Imágenes y peso', kind:'warn', title:'Imagen pesada detectada',            detail:'"hero-otono.jpg" pesa 2.3 MB. Recomendado <500 KB para que cargue rápido en 4G.', fixes:[{label:'Comprimir automáticamente'}] },
  { id:'i2', cat:'Imágenes y peso', kind:'ok',   title:'Total del correo: 1.8 MB',           detail:'Por debajo del límite de Gmail (102 KB truncan el correo, pero tu peso total es aceptable)' },

  // Enlaces
  { id:'l1', cat:'Enlaces',         kind:'ok',   title:'Todos los enlaces funcionan',         detail:'4 enlaces revisados, todos devuelven 200 OK' },
  { id:'l2', cat:'Enlaces',         kind:'ok',   title:'Sin enlaces mailto: sin dirección',   detail:'0 enlaces rotos de tipo mailto' },

  // Legal y entrega
  { id:'g1', cat:'Legal y entrega', kind:'ok',   title:'Link de desuscripción presente',      detail:'Detectado en el footer · obligatorio por GDPR/CAN-SPAM' },
  { id:'g2', cat:'Legal y entrega', kind:'ok',   title:'Dirección física en el footer',       detail:'"Acme SA · Av. Reforma 123, CDMX" · requerido por CAN-SPAM' },
  { id:'g3', cat:'Legal y entrega', kind:'warn', title:'No hay versión texto plano',          detail:'Algunos filtros de spam castigan correos que solo son HTML. Generar el fallback textual mejora entregabilidad.', fixes:[{label:'Generar versión texto plano'}] },
  { id:'g4', cat:'Legal y entrega', kind:'info', title:'Spam score estimado: 2.1/10',         detail:'Muy bajo. No hay palabras gatillo frecuentes ("gratis", "urgente", excesos de signos)' },
];

Object.assign(window, { ReviewPanel });
