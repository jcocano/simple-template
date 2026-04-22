// Modals — Enviar/Exportar, Enviar prueba, Etiquetas

function Modal({ title, sub, onClose, children, footer, size }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${size||''} pop`} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div style={{flex:1}}>
            <h3>{title}</h3>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={15}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// EXPORT / SEND MODAL — 2 tabs: "Enviar a personas" y "Para devs"
// ════════════════════════════════════════════════════════════════
function ExportModal({ onClose }) {
  const [tab, setTab] = React.useState('share');  // share | devs
  return (
    <Modal title="Compartir o exportar el correo"
      sub="Aún no hay envíos masivos — por ahora puedes mandarte pruebas, compartir un link, o bajar el código."
      size="wide" onClose={onClose}
      footer={null}>
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--line)',marginBottom:18}}>
        <ModalTab label="Compartir y probar" icon="send" active={tab==='share'} onClick={()=>setTab('share')} sub="Prueba a ti mismo o link privado"/>
        <ModalTab label="Para desarrolladores" icon="code" active={tab==='devs'} onClick={()=>setTab('devs')} sub="HTML, MJML, texto plano"/>
      </div>
      {tab==='share' && <SendTab onClose={onClose}/>}
      {tab==='devs' && <DevsTab onClose={onClose}/>}
    </Modal>
  );
}

function ModalTab({ label, icon, active, onClick, sub }) {
  const Ico = I[icon];
  return (
    <button onClick={onClick} style={{
      flex:1,padding:'12px 14px 14px',border:'none',background:'transparent',
      borderBottom: active?'2px solid var(--accent)':'2px solid transparent',
      color: active?'var(--fg)':'var(--fg-3)',
      cursor:'pointer',textAlign:'left',
      display:'flex',alignItems:'flex-start',gap:10,
    }}>
      <div style={{
        width:28,height:28,borderRadius:6,flexShrink:0,
        background: active?'var(--accent-soft)':'var(--surface-2)',
        color: active?'var(--accent)':'var(--fg-3)',
        display:'grid',placeItems:'center',
      }}>{Ico && <Ico size={14}/>}</div>
      <div>
        <div style={{fontSize:13,fontWeight:active?600:500}}>{label}</div>
        {sub && <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2}}>{sub}</div>}
      </div>
    </button>
  );
}

// ─── TAB 1: SEND TO PEOPLE ──────────────────────────────────────
function SendTab({ onClose }) {
  const [action, setAction] = React.useState('test');  // test | copy
  const [emails, setEmails] = React.useState(['carmen@acme.com']);
  const [input, setInput] = React.useState('');

  const ACTIONS = [
    { id:'test',     t:'Enviar prueba',        d:'Mándate el correo a ti o a tu equipo para revisarlo', icon:'send'},
    { id:'copy',     t:'Copiar link privado',  d:'Compártelo por Slack, WhatsApp o correo',              icon:'copy'},
  ];

  const addEmail = () => {
    if (input && input.includes('@')) { setEmails(e=>[...e, input.trim()]); setInput(''); }
  };

  return (
    <div className="col" style={{gap:16}}>
      {/* Big action picker */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {ACTIONS.map(a => {
          const Ico = I[a.icon];
          const on = action===a.id;
          return (
            <button key={a.id} onClick={()=>setAction(a.id)} style={{
              padding:14,textAlign:'left',cursor:'pointer',
              border: on?'1px solid var(--accent)':'1px solid var(--line)',
              background: on?'var(--accent-soft)':'var(--surface)',
              borderRadius:'var(--r-md)',
              display:'flex',flexDirection:'column',gap:6,
            }}>
              <div style={{
                width:32,height:32,borderRadius:8,
                background: on?'var(--accent)':'var(--surface-2)',
                color: on?'var(--accent-fg)':'var(--fg-2)',
                display:'grid',placeItems:'center',
              }}><Ico size={15}/></div>
              <div style={{fontSize:13,fontWeight:600,color:on?'var(--accent)':'var(--fg)'}}>{a.t}</div>
              <div style={{fontSize:11,color:'var(--fg-3)',lineHeight:1.5}}>{a.d}</div>
            </button>
          );
        })}
      </div>

      {action==='test' && (
        <div className="col" style={{gap:12,padding:16,background:'var(--surface-2)',borderRadius:'var(--r-md)'}}>
          <div className="prop-label">¿A qué correos lo enviamos?</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:6,border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--surface)',minHeight:44}}>
            {emails.map((em,i) => (
              <span key={i} className="chip" style={{height:26,fontSize:12}}>
                {em}
                <button className="btn icon sm ghost" style={{height:18,width:18}} onClick={()=>setEmails(e=>e.filter((_,x)=>x!==i))}><I.x size={10}/></button>
              </span>
            ))}
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===',')addEmail()}} style={{flex:1,minWidth:180,border:'none',outline:'none',background:'transparent',fontSize:13,padding:'0 4px'}} placeholder="Escribe un correo y aprieta Enter…"/>
          </div>
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
            <input type="checkbox" defaultChecked/>
            Añadir <b>[PRUEBA]</b> al asunto para distinguirlo
          </label>
          <div style={{fontSize:11,color:'var(--fg-3)',lineHeight:1.5}}>
            Usa la cuenta SMTP configurada en Ajustes → Envío de pruebas. Las etiquetas <code style={{fontFamily:'var(--font-mono)'}}>@nombre</code> aparecen con los valores de ejemplo.
          </div>
        </div>
      )}

      {action==='copy' && (
        <div className="col" style={{gap:12,padding:16,background:'var(--surface-2)',borderRadius:'var(--r-md)'}}>
          <div className="prop-label">Tu link privado</div>
          <div className="row">
            <input className="field" readOnly value="https://simple-template.app/v/k7h2-39pq" style={{flex:1,fontFamily:'var(--font-mono)',fontSize:12}}/>
            <button className="btn" onClick={()=>{
              try { navigator.clipboard?.writeText('https://simple-template.app/v/k7h2-39pq'); } catch(e){}
              window.toast && window.toast({ kind:'ok', title:'Link copiado', msg:'Pégalo donde lo quieras compartir.' });
            }}><I.copy size={13}/> Copiar</button>
          </div>
          <div style={{fontSize:12,color:'var(--fg-3)',lineHeight:1.5}}>
            Cualquiera con este link puede abrir el correo en su navegador. Úsalo para pegarlo en WhatsApp, Slack o para mostrarle al cliente antes de enviar masivo.
          </div>
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
            <input type="checkbox" defaultChecked/>
            Los datos de etiquetas aparecen con ejemplos (@nombre → "Carmen")
          </label>
        </div>
      )}

      {/* Footer */}
      <div className="row" style={{justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--line)',marginTop:4}}>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        {action==='test' && <button className="btn primary" onClick={()=>{
          window.toast && window.toast({ kind:'ok', title:`Prueba enviada a ${emails.length} correo${emails.length>1?'s':''}`, msg:'Suele tardar un par de minutos en llegar.' });
          onClose();
        }}><I.send size={13}/> Mandar {emails.length} prueba{emails.length>1?'s':''}</button>}
        {action==='copy' && <button className="btn primary" onClick={onClose}><I.check size={13}/> Listo</button>}
      </div>
    </div>
  );
}

// ─── TAB 2: FOR DEVELOPERS ──────────────────────────────────────
function DevsTab({ onClose }) {
  const [fmt, setFmt] = React.useState('html');
  const [inline, setInline] = React.useState(true);
  const [minify, setMinify] = React.useState(true);

  const samples = {
    html: `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"/>
<title>Novedades de noviembre</title>
</head>
<body style="background:#f6f5f1;margin:0;padding:0;">
<table role="presentation" width="100%" cellspacing="0"...
  ...
</body>
</html>`,
    mjml: `<mjml>
  <mj-head>
    <mj-title>Novedades de noviembre</mj-title>
    <mj-preview>3 novedades de noviembre</mj-preview>
  </mj-head>
  <mj-body background-color="#f6f5f1">
    <mj-section background-color="#e8eddd" padding="40px 32px">
      <mj-column>
        <mj-text font-size="28px" font-weight="600">
          Hola, @nombre 👋
        </mj-text>
        <mj-text>Gracias por ser parte de @empresa.</mj-text>
      </mj-column>
    </mj-section>
    ...
  </mj-body>
</mjml>`,
    txt: `Hola, @nombre

Gracias por ser parte de @empresa.

Estas son 3 novedades de noviembre:
1. ...
2. ...
3. ...

Desuscribir: @link_baja`,
    amp: `<!doctype html>
<html ⚡4email>
<head><meta charset="utf-8">
<script async src="https://cdn.ampproject.org/v0.js"></script>
...`,
  };
  const FORMATS = [
    { id:'html', label:'HTML compilado',     d:'Pégalo en Mailchimp, Sendgrid, Klaviyo, Brevo' },
    { id:'mjml', label:'MJML (código fuente)', d:'Para editar con herramientas MJML' },
    { id:'txt',  label:'Texto plano',         d:'Versión alternativa, sin formato' },
    { id:'amp',  label:'AMP for Email',       d:'Interactivo — Gmail y Yahoo únicamente' },
  ];

  return (
    <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:20}}>
      <div className="col">
        <div className="prop-label">Formato</div>
        <div className="col" style={{gap:6}}>
          {FORMATS.map(o => (
            <label key={o.id} style={{
              display:'flex',gap:10,padding:10,
              border:'1px solid var(--line)',borderRadius:'var(--r-md)',cursor:'pointer',
              background:fmt===o.id?'var(--accent-soft)':'var(--surface)',
              borderColor:fmt===o.id?'var(--accent)':'var(--line)',
            }}>
              <input type="radio" checked={fmt===o.id} onChange={()=>setFmt(o.id)} style={{marginTop:3}}/>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{o.label}</div>
                <div style={{fontSize:11,color:'var(--fg-3)'}}>{o.d}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="divider"/>
        <div className="prop-label">Opciones</div>
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
          <input type="checkbox" checked={inline} onChange={e=>setInline(e.target.checked)}/>
          Estilos dentro de cada etiqueta (recomendado)
        </label>
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
          <input type="checkbox" checked={minify} onChange={e=>setMinify(e.target.checked)}/>
          Comprimir código
        </label>
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
          <input type="checkbox"/>
          Incluir versión de solo texto
        </label>
        <div className="divider"/>
        <div className="prop-label">Resultado</div>
        <div className="row"><div className="chip ok"><I.check size={10}/> Válido</div></div>
        <div style={{fontSize:12,color:'var(--fg-3)',lineHeight:1.5}}>
          Tamaño: <b style={{color:'var(--fg)'}}>48 KB</b><br/>
          Imágenes: <b style={{color:'var(--fg)'}}>5</b><br/>
          Compatible con: Gmail, Outlook 2019+, iOS, Android
        </div>
      </div>
      <div style={{background:'var(--surface-2)',borderRadius:'var(--r-md)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'8px 12px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
          <I.code size={13}/>
          <span style={{fontFamily:'var(--font-mono)'}}>correo.{fmt}</span>
          <div className="grow"/>
          <button className="btn icon sm ghost"><I.copy size={12}/></button>
        </div>
        <pre style={{margin:0,padding:14,fontFamily:'var(--font-mono)',fontSize:11.5,lineHeight:1.6,overflow:'auto',maxHeight:340,color:'var(--fg-2)'}}>
          {samples[fmt]}
        </pre>
        <div className="row" style={{padding:'10px 12px',borderTop:'1px solid var(--line)',justifyContent:'flex-end'}}>
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
          <button className="btn" onClick={()=>{
            window.toast && window.toast({ kind:'ok', title:`${fmt.toUpperCase()} copiado al portapapeles`, msg:'Ya lo puedes pegar donde quieras.' });
          }}><I.copy size={13}/> Copiar</button>
          <button className="btn primary" onClick={()=>{
            window.toast && window.toast({ kind:'ok', title:`Descarga iniciada`, msg:`correo-noviembre.${fmt}` });
          }}><I.download size={13}/> Descargar {fmt.toUpperCase()}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEST SEND MODAL
// ════════════════════════════════════════════════════════════════
function TestSendModal({ onClose }) {
  const [emails, setEmails] = React.useState(['carmen@acme.com']);
  const [input, setInput] = React.useState('');
  const add = () => {
    if (input && input.includes('@')) {
      setEmails(e => [...e, input.trim()]);
      setInput('');
    }
  };
  return (
    <Modal title="Enviar una prueba a ti mismo" sub="Mándate este correo para ver cómo se verá en tu bandeja de entrada" onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={()=>{
          window.toast && window.toast({ kind:'ok', title:`Prueba enviada a ${emails.length} correo${emails.length>1?'s':''}`, msg:'Suele tardar un par de minutos en llegar.' });
          onClose();
        }}><I.send size={13}/> Mandar {emails.length} prueba{emails.length>1?'s':''}</button>
      </>}>
      <div className="col">
        <div className="prop-label">¿A qué correos lo enviamos?</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:6,border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--surface)',minHeight:44}}>
          {emails.map((em,i) => (
            <span key={i} className="chip" style={{height:26,fontSize:12}}>
              {em}
              <button className="btn icon sm ghost" style={{height:18,width:18}} onClick={()=>setEmails(e=>e.filter((_,x)=>x!==i))}><I.x size={10}/></button>
            </span>
          ))}
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===',')add()}} style={{flex:1,minWidth:180,border:'none',outline:'none',background:'transparent',fontSize:13,padding:'0 4px'}} placeholder="Escribe un correo y aprieta Enter…"/>
        </div>
        <div className="divider"/>
        <div className="prop-label">Datos de ejemplo para las etiquetas</div>
        <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:6}}>Los valores que aparecerán en lugar de @nombre, @empresa, etc.</div>
        <div style={{background:'var(--surface-2)',padding:12,borderRadius:'var(--r-md)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {VARIABLES.slice(0,6).map(v => (
            <div key={v.key} style={{display:'flex',flexDirection:'column',gap:2}}>
              <div style={{fontSize:11,color:'var(--fg-3)'}}><b style={{color:'var(--accent)',fontWeight:600}}>@{v.key}</b> — {v.label}</div>
              <input className="field" defaultValue={v.sample} style={{height:28,fontSize:12}}/>
            </div>
          ))}
        </div>
        <div className="divider"/>
        <div className="row">
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
            <input type="checkbox" defaultChecked/>
            Añadir <b>[PRUEBA]</b> al asunto para distinguirlo
          </label>
        </div>
        <div style={{padding:12,background:'var(--accent-soft)',borderRadius:'var(--r-md)',fontSize:12,color:'var(--accent)',display:'flex',gap:8}}>
          <I.check size={14}/>
          <div>Los envíos de prueba no se cuentan en tu cuota mensual. Puedes mandarte todas las pruebas que quieras.</div>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
// VARIABLES / TAGS MODAL
// ════════════════════════════════════════════════════════════════
function VariablesModal({ onClose }) {
  return (
    <Modal title="Etiquetas que se rellenan solas"
      sub="Escribe @nombre en cualquier texto y cada persona verá el suyo. Nosotros hacemos el trabajo."
      size="wide" onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cerrar</button>
        <button className="btn primary" onClick={()=>{
          window.toast && window.toast({ kind:'ok', title:'Etiqueta nueva creada', msg:'Ya puedes usarla en cualquier bloque de texto.' });
        }}><I.plus size={13}/> Crear etiqueta nueva</button>
      </>}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div>
          <div className="prop-label">Etiquetas disponibles</div>
          <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8,lineHeight:1.5}}>Haz clic en cualquiera para copiarla, o arrástrala a un bloque de texto.</div>
          <div style={{border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
            {VARIABLES.map((v,i) => (
              <div key={v.key} style={{display:'grid',gridTemplateColumns:'1fr 1fr 20px',gap:10,padding:'10px 12px',borderBottom:i<VARIABLES.length-1?'1px solid var(--line)':'none',alignItems:'center',fontSize:12,cursor:'pointer'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--accent)'}}>@{v.key}</div>
                  <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2}}>{v.label}</div>
                </div>
                <div style={{fontSize:11,color:'var(--fg-2)'}}>
                  <span style={{fontSize:10,color:'var(--fg-3)'}}>Se verá como: </span>
                  <b>{v.sample}</b>
                </div>
                <button className="btn icon sm ghost" title="Copiar" onClick={()=>{
                  try { navigator.clipboard?.writeText('@'+v.key); } catch(e){}
                  window.toast && window.toast({ kind:'ok', title:`@${v.key} copiada`, msg:'Pégala en cualquier bloque de texto.' });
                }}><I.copy size={12}/></button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="prop-label">¿De dónde salen estos datos?</div>
          <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8,lineHeight:1.5}}>Elige de dónde queremos sacar el nombre, correo, etc. de cada persona.</div>
          <div className="col" style={{gap:8}}>
            {[
              {n:'Mi lista de contactos', d:'La lista que cargaste en Simple Template', on:true},
              {n:'Archivo CSV', d:'Sube un Excel o Google Sheets', on:false},
              {n:'Mi tienda / CRM',d:'Shopify, HubSpot, Pipedrive, Salesforce', on:false},
              {n:'Mi base de datos', d:'Solo si tu equipo técnico la configuró', on:false},
            ].map(s => (
              <div key={s.n} style={{display:'flex',gap:10,padding:12,background:'var(--surface-2)',borderRadius:'var(--r-md)',alignItems:'center'}}>
                <div style={{width:34,height:34,borderRadius:'var(--r-sm)',background:'var(--surface)',display:'grid',placeItems:'center'}}>
                  <I.braces size={16} style={{color:'var(--fg-2)'}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{s.n}</div>
                  <div style={{fontSize:11,color:'var(--fg-3)'}}>{s.d}</div>
                </div>
                {s.on ? <span className="chip ok"><I.check size={10}/> En uso</span> : <button className="btn sm">Usar este</button>}
              </div>
            ))}
          </div>
          <div className="divider"/>
          <div className="prop-label">Cómo se verá</div>
          <div style={{padding:14,background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:13}}>
            <div style={{color:'var(--fg-3)',fontSize:11,marginBottom:6}}>
              Tú escribiste: <span style={{color:'var(--accent)',fontWeight:600}}>Hola <b>@nombre</b>, aquí está tu pedido <b>@pedido</b></span>
            </div>
            <div style={{color:'var(--fg)',fontWeight:500,padding:'6px 0',borderTop:'1px dashed var(--line)'}}>
              Carmen verá: <b>Hola Carmen, aquí está tu pedido #A-4821</b>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { Modal, ExportModal, TestSendModal, VariablesModal });
