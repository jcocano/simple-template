// Delivery settings — connect an account to send template previews (up to 5 recipients)
// Used both as a standalone modal and embedded inside SettingsPanel

const DELIVERY_PROVIDERS = [
  { id:'gmail',    name:'Gmail',                color:'#ea4335', letter:'G', kind:'oauth',  hint:'Inicia sesión con tu cuenta de Google' },
  { id:'outlook',  name:'Outlook',              color:'#0078d4', letter:'O', kind:'oauth',  hint:'Inicia sesión con tu cuenta de Microsoft' },
  { id:'yahoo',    name:'Yahoo Mail',           color:'#6001d2', letter:'Y', kind:'oauth',  hint:'Inicia sesión con tu cuenta de Yahoo' },
  { id:'icloud',   name:'iCloud Mail',          color:'#1f1f1f', letter:'', kind:'oauth',  hint:'Inicia sesión con tu Apple ID' },
  { id:'smtp',     name:'Correo personalizado', color:'#5b5bf0', letter:'✱', kind:'smtp',   hint:'Configura tu propio servidor SMTP' },
];

const MAX_RECIPIENTS = 5;

function DeliveryModal({ onClose, embedded = false }) {
  const DEFAULT_CFG = {
    fromName:'Carmen Luna',
    fromEmail:'carmen@acme.com',
    recipients:['carmen@acme.com'],
    host:'', port:587, user:'', pass:'', security:'tls',
  };

  const [provider, setProvider] = React.useState(() => window.stStorage.getSetting('delivery:provider', null));
  const [cfg, setCfg] = React.useState(DEFAULT_CFG);
  const [state, setState] = React.useState('idle'); // idle | sending | sent | err
  const [connected, setConnected] = React.useState(() => window.stStorage.getSetting('delivery:connected', false));
  const [recipInput, setRecipInput] = React.useState('');

  // Credentials live in safeStorage (encrypted); load async when the provider changes.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const id = provider || 'gmail';
      try {
        const raw = await window.stStorage.secrets.get(`delivery:cfg:${id}`);
        if (!alive) return;
        if (raw) { try { setCfg(JSON.parse(raw)); return; } catch {} }
        setCfg(DEFAULT_CFG);
      } catch {
        if (alive) setCfg(DEFAULT_CFG);
      }
    })();
    return () => { alive = false; };
  }, [provider]);

  const p = DELIVERY_PROVIDERS.find(x => x.id === provider);

  const choose = (id) => {
    setProvider(id);
    setState('idle');
  };
  const update = (k,v) => setCfg(c => ({...c, [k]:v}));
  const addRecip = () => {
    const e = recipInput.trim().replace(/,$/,'');
    if (!e || !e.includes('@')) return;
    setCfg(c => {
      const next = [...(c.recipients||[])];
      if (!next.includes(e) && next.length < MAX_RECIPIENTS) next.push(e);
      return {...c, recipients:next};
    });
    setRecipInput('');
  };
  const removeRecip = (i) => {
    setCfg(c => ({...c, recipients:c.recipients.filter((_,x)=>x!==i)}));
  };
  const canSend = () => {
    if (!cfg.recipients || cfg.recipients.length === 0) return false;
    if (p?.kind === 'smtp') return cfg.host && cfg.user && cfg.pass && cfg.fromEmail;
    return true;
  };
  const sendTest = () => {
    setState('sending');
    setTimeout(async () => {
      setState('sent');
      setConnected(true);
      window.stStorage.setSetting('delivery:connected', true);
      window.stStorage.setSetting('delivery:provider', provider);
      try {
        await window.stStorage.secrets.set(`delivery:cfg:${provider}`, JSON.stringify(cfg));
      } catch (err) {
        console.error('[delivery] save secret', err);
      }
    }, 1400);
  };
  const disconnect = () => {
    setConnected(false);
    setProvider(null);
    setState('idle');
    window.stStorage.setSetting('delivery:connected', false);
  };

  // ── Step 1 body ──
  const step1Body = (
    <>
      <div style={{padding:'4px 0 8px',fontSize:13,color:'var(--fg-2)',lineHeight:1.55,marginBottom:16}}>
        Elige desde qué cuenta quieres enviar las pruebas de este template. Podrás enviar hasta <b>{MAX_RECIPIENTS} destinatarios simultáneos</b> por prueba.
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {DELIVERY_PROVIDERS.map(pr => (
          <button key={pr.id} onClick={()=>choose(pr.id)} style={{
            display:'flex',alignItems:'center',gap:14,
            padding:'16px 18px',
            background:'var(--surface)',
            border:'1px solid var(--line)',
            borderRadius:'var(--r-md)',
            cursor:'pointer',
            textAlign:'left',
            transition:'border-color 120ms, background 120ms',
            gridColumn: pr.id==='smtp' ? '1 / -1' : undefined,
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-soft)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';e.currentTarget.style.background='var(--surface)';}}>
            <div style={{
              width:40,height:40,borderRadius:'var(--r-md)',
              background:pr.color,color:'#fff',
              display:'grid',placeItems:'center',
              fontWeight:700,fontSize:18,flexShrink:0,
              fontFamily:'var(--font-display)',
            }}>{pr.letter}</div>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:14,fontWeight:500,marginBottom:2,display:'flex',alignItems:'center',gap:6}}>
                {pr.name}
                {pr.kind==='smtp' && <span className="chip" style={{height:18,fontSize:10}}>Avanzado</span>}
              </div>
              <div style={{fontSize:11.5,color:'var(--fg-3)'}}>{pr.hint}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{marginTop:18,padding:12,background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:12,color:'var(--fg-2)',lineHeight:1.55,display:'flex',gap:10}}>
        <I.info size={14} style={{color:'var(--fg-3)',marginTop:2,flexShrink:0}}/>
        <div>
          Estos ajustes son <b>solo para pruebas del template</b> (máx. {MAX_RECIPIENTS} destinatarios por envío).
          Para campañas masivas a listas de contactos es una función aparte.
        </div>
      </div>
    </>
  );

  // ── Step 2 body ──
  const step2Body = p ? (
    <>
      {/* Provider header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 0 16px',borderBottom:'1px solid var(--line)',marginBottom:18}}>
        <div style={{
          width:36,height:36,borderRadius:'var(--r-md)',
          background:p.color,color:'#fff',
          display:'grid',placeItems:'center',
          fontWeight:700,fontSize:16,
          fontFamily:'var(--font-display)',
        }}>{p.letter}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:500}}>{p.name}</div>
          <div style={{fontSize:11.5,color:'var(--fg-3)'}}>{p.hint}</div>
        </div>
        {connected && <span className="chip ok"><I.check size={10}/> Conectado</span>}
      </div>

      {/* OAuth flow */}
      {p.kind==='oauth' && !connected && (
        <div style={{marginBottom:16}}>
          <button
            onClick={sendTest}
            disabled={state==='sending'}
            style={{
              width:'100%',padding:'14px 16px',
              background:p.color,color:'#fff',
              border:'none',borderRadius:'var(--r-md)',
              fontSize:14,fontWeight:500,cursor:state==='sending'?'wait':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:10,
              opacity:state==='sending'?.8:1,
            }}>
            {state==='sending'
              ? <><I.loader size={16}/> Conectando…</>
              : <><I.mail size={16}/> Iniciar sesión con {p.name}</>}
          </button>
          <div style={{fontSize:12,color:'var(--fg-3)',marginTop:10,textAlign:'center',lineHeight:1.55}}>
            Te llevaremos a {p.name} para autorizar el acceso.<br/>
            Solo podremos enviar correos desde tu cuenta — no leeremos tu bandeja.
          </div>
        </div>
      )}

      {/* SMTP form */}
      {p.kind==='smtp' && !connected && (
        <div className="col" style={{gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Servidor SMTP</label>
              <input className="field" value={cfg.host} onChange={e=>update('host',e.target.value)} placeholder="smtp.tuempresa.com"/>
            </div>
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Puerto</label>
              <input className="field" type="number" value={cfg.port} onChange={e=>update('port',Number(e.target.value))}/>
            </div>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Seguridad</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                {id:'tls',label:'TLS',d:'Puerto 587 (recomendado)'},
                {id:'ssl',label:'SSL',d:'Puerto 465'},
              ].map(o => (
                <label key={o.id} style={{
                  padding:'10px 12px',
                  border:'1px solid '+(cfg.security===o.id?'var(--accent)':'var(--line)'),
                  background:cfg.security===o.id?'var(--accent-soft)':'var(--surface)',
                  borderRadius:'var(--r-md)',cursor:'pointer',
                  display:'flex',flexDirection:'column',gap:2,
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="radio" checked={cfg.security===o.id} onChange={()=>update('security',o.id)}/>
                    <span style={{fontSize:13,fontWeight:500}}>{o.label}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--fg-3)',paddingLeft:22}}>{o.d}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="divider"/>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Usuario</label>
            <input className="field" value={cfg.user} onChange={e=>update('user',e.target.value)} placeholder="tu-cuenta@tuempresa.com"/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Contraseña</label>
            <input className="field" type="password" value={cfg.pass} onChange={e=>update('pass',e.target.value)} placeholder="••••••••••••"/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Correo desde el que envías</label>
            <input className="field" type="email" value={cfg.fromEmail} onChange={e=>update('fromEmail',e.target.value)} placeholder="pruebas@tuempresa.com"/>
          </div>
        </div>
      )}

      {/* Recipients + connected state */}
      {(connected || p.kind==='smtp') && (
        <>
          {connected && (
            <div style={{
              padding:14,
              background:'color-mix(in oklab, var(--ok) 10%, transparent)',
              borderRadius:'var(--r-md)',
              display:'flex',gap:10,alignItems:'center',
              marginBottom:14,
            }}>
              <I.check size={16} style={{color:'var(--ok)',flexShrink:0}}/>
              <div style={{flex:1,fontSize:13}}>
                Conectado como <b>{cfg.fromEmail || cfg.user || 'tu cuenta'}</b>
              </div>
            </div>
          )}

          {connected && (
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>
                Tu nombre al enviar
              </label>
              <input
                className="field"
                value={cfg.fromName}
                onChange={e=>update('fromName',e.target.value)}
                placeholder="Carmen Luna"/>
            </div>
          )}

          <div style={{padding:14,background:'var(--surface-2)',borderRadius:'var(--r-md)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <label style={{fontSize:12.5,fontWeight:500}}>Destinatarios de prueba</label>
              <span style={{fontSize:11,color:'var(--fg-3)',fontVariantNumeric:'tabular-nums'}}>
                {(cfg.recipients||[]).length} / {MAX_RECIPIENTS}
              </span>
            </div>
            <div style={{
              display:'flex',flexWrap:'wrap',gap:6,
              padding:6,minHeight:44,
              background:'var(--surface)',
              border:'1px solid var(--line)',
              borderRadius:'var(--r-md)',
            }}>
              {(cfg.recipients||[]).map((e,i) => (
                <span key={i} className="chip" style={{height:26,fontSize:12,paddingLeft:10}}>
                  {e}
                  <button
                    className="btn icon sm ghost"
                    style={{height:18,width:18,marginLeft:2}}
                    onClick={()=>removeRecip(i)}>
                    <I.x size={10}/>
                  </button>
                </span>
              ))}
              {(cfg.recipients||[]).length < MAX_RECIPIENTS && (
                <input
                  value={recipInput}
                  onChange={e=>setRecipInput(e.target.value)}
                  onKeyDown={e=>{
                    if (e.key==='Enter' || e.key===',' || e.key===' ') { e.preventDefault(); addRecip(); }
                    if (e.key==='Backspace' && !recipInput && cfg.recipients?.length) {
                      removeRecip(cfg.recipients.length-1);
                    }
                  }}
                  onBlur={addRecip}
                  placeholder={cfg.recipients?.length ? 'añadir otro…' : 'correo@ejemplo.com'}
                  style={{flex:1,minWidth:140,border:'none',outline:'none',background:'transparent',fontSize:13,padding:'0 4px',height:26}}/>
              )}
            </div>
            <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:8,lineHeight:1.5}}>
              Escribe un correo y presiona <span className="kbd">Enter</span>.
              Máximo <b>{MAX_RECIPIENTS} destinatarios</b> por prueba — pensado para que tu equipo revise el template antes de publicarlo.
            </div>
          </div>
        </>
      )}

      {/* Status banner */}
      {state==='sent' && (
        <div style={{
          marginTop:16,padding:14,
          background:'color-mix(in oklab, var(--ok) 12%, transparent)',
          borderRadius:'var(--r-md)',
          fontSize:13,color:'var(--ok)',
          display:'flex',gap:10,alignItems:'flex-start',
        }}>
          <I.check size={16} style={{marginTop:1,flexShrink:0}}/>
          <div>
            <b>¡Enviado!</b> La prueba salió a {(cfg.recipients||[]).length} destinatario{(cfg.recipients||[]).length!==1?'s':''}.
            Suele llegar en menos de un minuto.
          </div>
        </div>
      )}
      {state==='err' && (
        <div style={{
          marginTop:16,padding:14,
          background:'color-mix(in oklab, var(--danger) 12%, transparent)',
          borderRadius:'var(--r-md)',
          fontSize:13,color:'var(--danger)',
          display:'flex',gap:10,
        }}>
          <I.x size={16} style={{marginTop:1,flexShrink:0}}/>
          <div><b>No pudimos conectar.</b> Revisa el servidor, usuario y contraseña e inténtalo de nuevo.</div>
        </div>
      )}

      {/* Embedded-mode action buttons (modal variant uses footer) */}
      {embedded && (
        <div style={{display:'flex',gap:8,marginTop:20,paddingTop:16,borderTop:'1px solid var(--line)'}}>
          {connected ? (
            <>
              <button className="btn danger" onClick={disconnect} style={{marginRight:'auto'}}>Desconectar</button>
              <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                {state==='sending' ? <><I.loader size={13}/> Enviando…</> : <><I.send size={13}/> Enviar prueba</>}
              </button>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={()=>{setProvider(null);setState('idle');}} style={{marginRight:'auto'}}>← Cambiar proveedor</button>
              {p.kind==='smtp' && (
                <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                  {state==='sending' ? <><I.loader size={13}/> Guardando…</> : <><I.check size={13}/> Guardar y probar</>}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  ) : null;

  // ── Embedded rendering (inside SettingsPanel) ──
  if (embedded) {
    if (!provider) {
      return <>{step1Body}</>;
    }
    return <>{step2Body}</>;
  }

  // ── Modal rendering (standalone) ──
  if (!provider) {
    return (
      <Modal
        title="Envío de pruebas del template"
        sub="Conecta una cuenta para enviar este diseño a tu equipo de revisión"
        onClose={onClose}
        footer={<button className="btn ghost" onClick={onClose}>Cerrar</button>}>
        {step1Body}
      </Modal>
    );
  }

  return (
    <Modal
      title="Envío de pruebas del template"
      sub={`Conectando con ${p.name}`}
      onClose={onClose}
      footer={<>
        {connected ? (
          <>
            <button className="btn danger" onClick={disconnect} style={{marginRight:'auto'}}>Desconectar</button>
            <button className="btn ghost" onClick={onClose}>Cerrar</button>
            <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
              {state==='sending' ? <><I.loader size={13}/> Enviando…</> : <><I.send size={13}/> Enviar prueba</>}
            </button>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={()=>{setProvider(null);setState('idle');}} style={{marginRight:'auto'}}>← Cambiar proveedor</button>
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            {p.kind==='smtp' && (
              <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                {state==='sending' ? <><I.loader size={13}/> Guardando…</> : <><I.check size={13}/> Guardar y probar</>}
              </button>
            )}
          </>
        )}
      </>}>
      {step2Body}
    </Modal>
  );
}

Object.assign(window, { DeliveryModal, SmtpModal: DeliveryModal });
