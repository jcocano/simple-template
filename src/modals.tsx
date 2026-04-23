// Modals — Enviar/Exportar, Enviar prueba, Etiquetas

// Variables now live INSIDE each template (see Bundle G.1 / template.vars).
// Resolution order:
//   1. If the editor is mounted, read/write its current template's vars via
//      window.__stEditor.{getVars,setVars}.
//   2. Otherwise (modal opened from dashboard / no template open), fall back
//      to the workspace defaults so the user can still browse them — but the
//      modal becomes read-only and points to Settings for edits.
function useTemplateVars() {
  const fromEditor = () => {
    const ed = window.__stEditor;
    return ed && typeof ed.getVars === 'function' ? ed.getVars() : null;
  };
  const fromWorkspace = () => window.stStorage.getWSSetting('vars', null) || VARIABLES;
  const get = () => fromEditor() || fromWorkspace();
  const [list, setList] = React.useState(get);
  const [hasEditor, setHasEditor] = React.useState(() => !!fromEditor());

  React.useEffect(() => {
    const refresh = () => {
      const ed = !!fromEditor();
      setHasEditor(ed);
      setList(get());
    };
    refresh();
    window.addEventListener('st:template-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    window.addEventListener('st:settings-change', refresh);
    return () => {
      window.removeEventListener('st:template-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
      window.removeEventListener('st:settings-change', refresh);
    };
  }, []);

  const setVars = (next) => {
    const ed = window.__stEditor;
    if (ed && typeof ed.setVars === 'function') {
      ed.setVars(next);
      setList(next);
    }
  };

  return { vars: list, setVars, editable: hasEditor };
}

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
  const [emails, setEmails] = React.useState(() => {
    // Seed from the workspace account email so the user doesn't have to
    // re-type their own address every time.
    const account = window.stStorage.getSetting('account', {}) || {};
    return account.email ? [account.email] : [];
  });
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [cfgError, setCfgError] = React.useState(null);
  const [cfgLoading, setCfgLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const result = await window.stTestSend.checkConfig();
      if (!alive) return;
      setCfgError(result.ok ? null : result.error);
      setCfgLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const ACTIONS = [
    { id:'test',     t:'Enviar prueba',        d:'Mándate el correo a ti o a tu equipo para revisarlo', icon:'send'},
    { id:'copy',     t:'Copiar link privado',  d:'Compártelo por Slack, WhatsApp o correo',              icon:'copy'},
  ];

  const addEmail = () => {
    if (input && input.includes('@')) { setEmails(e=>[...e, input.trim()]); setInput(''); }
  };

  const sendTest = async () => {
    setSending(true);
    setError(null);
    const result = await window.stTestSend.sendFromEditor(emails);
    setSending(false);
    if (result.ok) {
      window.notify && window.notify('testDone', {
        kind: 'ok',
        title: `Prueba enviada a ${emails.length} correo${emails.length>1?'s':''}`,
        msg: 'Suele tardar un par de minutos en llegar.',
      });
      onClose();
    } else {
      setError(result.error || 'Error desconocido al enviar.');
    }
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

      {action==='test' && cfgError && (
        <div style={{
          padding:12,
          background:'color-mix(in oklab, var(--warn, #d97757) 14%, transparent)',
          borderRadius:'var(--r-md)',
          fontSize:12,color:'var(--warn, #d97757)',lineHeight:1.5,
          display:'flex',gap:8,
        }}>
          <I.info size={14} style={{marginTop:1,flexShrink:0}}/>
          <div><b>No podés enviar aún.</b> {cfgError}</div>
        </div>
      )}

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
            Usa la cuenta SMTP configurada en Ajustes → Envío de pruebas. Las etiquetas <code style={{fontFamily:'var(--font-mono)'}}>{`{{nombre}}`}</code> aparecen con los valores de ejemplo.
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
            Los datos de etiquetas aparecen con ejemplos ({`{{nombre}}`} → "Carmen")
          </label>
        </div>
      )}

      {error && action==='test' && (
        <div style={{
          padding:12,
          background:'color-mix(in oklab, var(--danger) 12%, transparent)',
          borderRadius:'var(--r-md)',
          fontSize:12,color:'var(--danger)',
          display:'flex',gap:8,
        }}>
          <I.x size={14} style={{marginTop:1,flexShrink:0}}/>
          <div><b>No pudimos enviar.</b> {error}</div>
        </div>
      )}

      {/* Footer */}
      <div className="row" style={{justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--line)',marginTop:4}}>
        <button className="btn ghost" onClick={onClose} disabled={sending}>Cancelar</button>
        {action==='test' && <button className="btn primary" onClick={sendTest} disabled={sending || emails.length===0 || cfgLoading || !!cfgError}>
          {sending ? <><I.loader size={13}/> Enviando…</> : <><I.send size={13}/> Mandar {emails.length} prueba{emails.length!==1?'s':''}</>}
        </button>}
        {action==='copy' && <button className="btn primary" onClick={onClose}><I.check size={13}/> Listo</button>}
      </div>
    </div>
  );
}

// ─── TAB 2: FOR DEVELOPERS ──────────────────────────────────────
function DevsTab({ onClose }) {
  const [fmt, setFmt] = React.useState('html');
  const [minify, setMinify] = React.useState(false);
  const [includeTxt, setIncludeTxt] = React.useState(false);
  const [template, setTemplate] = React.useState(null);

  // Pull the currently-open template so the renderers have real sections + vars.
  // If no editor is mounted (modal opened from dashboard via command palette),
  // we still want to show something — fall back to a minimal seed so the user
  // can see what the output will look like.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const ed = window.__stEditor;
      const id = ed && typeof ed.getTemplateId === 'function' ? ed.getTemplateId() : null;
      // Flush any pending autosave so the renderer sees the latest edits.
      if (ed && typeof ed.flush === 'function') {
        try { await ed.flush(); } catch {}
      }
      if (id && window.stTemplates) {
        const tpl = await window.stTemplates.read(id);
        if (alive) setTemplate(tpl || null);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Output se computa en un effect porque `inlineImages` es async (lee bytes
  // del disco via IPC por cada st-img:// URL). Para HTML/MJML pasa por inline;
  // TXT no tiene imágenes, va directo.
  const [output, setOutput] = React.useState(null);
  React.useEffect(() => {
    if (!template) { setOutput(null); return; }
    const ex = window.stExport;
    if (!ex) { setOutput(null); return; }
    let alive = true;
    (async () => {
      try {
        const htmlRaw = ex.renderHTML(template, { minify, includeTxt });
        const mjmlRaw = ex.renderMJML(template);
        const [html, mjml] = await Promise.all([
          ex.inlineImages(htmlRaw),
          ex.inlineImages(mjmlRaw),
        ]);
        if (!alive) return;
        setOutput({ html, mjml, txt: ex.renderTXT(template) });
      } catch (err) {
        if (alive) setOutput({ error: err?.message || String(err) });
      }
    })();
    return () => { alive = false; };
  }, [template, minify, includeTxt]);

  const current = output && !output.error ? (output[fmt] || '') : '';
  const sizeKB = current ? Math.max(1, Math.round(new Blob([current]).size / 1024)) : 0;

  const FORMATS = [
    { id:'html', label:'HTML compilado',       d:'Pégalo en Mailchimp, Sendgrid, Klaviyo, Brevo', ext:'html', mime:'text/html' },
    { id:'mjml', label:'MJML (código fuente)', d:'Para editar con herramientas MJML',              ext:'mjml', mime:'text/plain' },
    { id:'txt',  label:'Texto plano',           d:'Versión alternativa, sin formato',              ext:'txt',  mime:'text/plain' },
  ];
  const currentFormat = FORMATS.find(f => f.id === fmt) || FORMATS[0];

  const doCopy = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current);
      window.toast && window.toast({ kind:'ok', title:`${fmt.toUpperCase()} copiado al portapapeles`, msg:'Ya lo puedes pegar donde quieras.' });
    } catch (err) {
      window.toast && window.toast({ kind:'error', title:'No se pudo copiar', msg: err?.message || 'Revisa los permisos del portapapeles.' });
    }
  };

  const doDownload = () => {
    if (!current) return;
    const base = window.stExport.safeFilename(template?.name);
    const filename = `${base}.${currentFormat.ext}`;
    window.stExport.downloadFile(filename, current, currentFormat.mime);
    window.notify && window.notify('exportDone', { kind:'ok', title:'Descarga iniciada', msg: filename });
  };

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
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12,opacity: fmt==='html'?1:0.5}}>
          <input type="checkbox" checked={minify} onChange={e=>setMinify(e.target.checked)} disabled={fmt!=='html'}/>
          Comprimir código
        </label>
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12,opacity: fmt==='html'?1:0.5}}>
          <input type="checkbox" checked={includeTxt} onChange={e=>setIncludeTxt(e.target.checked)} disabled={fmt!=='html'}/>
          Incluir versión de solo texto
        </label>
        <div className="divider"/>
        <div className="prop-label">Resultado</div>
        <div className="row">
          {template ? (
            output?.error
              ? <div className="chip" style={{color:'var(--err,#e04f4f)'}}><I.x size={10}/> Error</div>
              : <div className="chip ok"><I.check size={10}/> Válido</div>
          ) : (
            <div className="chip"><I.clock size={10}/> Sin plantilla</div>
          )}
        </div>
        <div style={{fontSize:12,color:'var(--fg-3)',lineHeight:1.5}}>
          {template ? <>Tamaño: <b style={{color:'var(--fg)'}}>{sizeKB} KB</b><br/></> : null}
          Compatible con: Gmail, Outlook 2019+, iOS, Android
        </div>
      </div>
      <div style={{background:'var(--surface-2)',borderRadius:'var(--r-md)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'8px 12px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
          <I.code size={13}/>
          <span style={{fontFamily:'var(--font-mono)'}}>{template ? window.stExport.safeFilename(template.name) : 'correo'}.{currentFormat.ext}</span>
          <div className="grow"/>
          <button className="btn icon sm ghost" onClick={doCopy} disabled={!current} title="Copiar"><I.copy size={12}/></button>
        </div>
        <pre style={{margin:0,padding:14,fontFamily:'var(--font-mono)',fontSize:11.5,lineHeight:1.6,overflow:'auto',maxHeight:340,color:'var(--fg-2)',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
          {output?.error
            ? `⚠ No se pudo generar: ${output.error}`
            : (current || 'Abre una plantilla en el editor para ver el código exportado aquí.')}
        </pre>
        <div className="row" style={{padding:'10px 12px',borderTop:'1px solid var(--line)',justifyContent:'flex-end'}}>
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
          <button className="btn" onClick={doCopy} disabled={!current}><I.copy size={13}/> Copiar</button>
          <button className="btn primary" onClick={doDownload} disabled={!current}><I.download size={13}/> Descargar {fmt.toUpperCase()}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEST SEND MODAL
// ════════════════════════════════════════════════════════════════
function TestSendModal({ onClose }) {
  const [emails, setEmails] = React.useState(() => {
    const account = window.stStorage.getSetting('account', {}) || {};
    return account.email ? [account.email] : [];
  });
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [cfgError, setCfgError] = React.useState(null);
  const [cfgLoading, setCfgLoading] = React.useState(true);
  const { vars } = useTemplateVars();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const result = await window.stTestSend.checkConfig();
      if (!alive) return;
      setCfgError(result.ok ? null : result.error);
      setCfgLoading(false);
    })();
    return () => { alive = false; };
  }, []);
  const add = () => {
    if (input && input.includes('@')) {
      setEmails(e => [...e, input.trim()]);
      setInput('');
    }
  };
  const sendTest = async () => {
    setSending(true);
    setError(null);
    const result = await window.stTestSend.sendFromEditor(emails);
    setSending(false);
    if (result.ok) {
      window.notify && window.notify('testDone', {
        kind: 'ok',
        title: `Prueba enviada a ${emails.length} correo${emails.length>1?'s':''}`,
        msg: 'Suele tardar un par de minutos en llegar.',
      });
      onClose();
    } else {
      setError(result.error || 'Error desconocido al enviar.');
    }
  };
  return (
    <Modal title="Enviar una prueba a ti mismo" sub="Mándate este correo para ver cómo se verá en tu bandeja de entrada" onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose} disabled={sending}>Cancelar</button>
        <button className="btn primary" onClick={sendTest} disabled={sending || emails.length===0 || cfgLoading || !!cfgError}>
          {sending ? <><I.loader size={13}/> Enviando…</> : <><I.send size={13}/> Mandar {emails.length} prueba{emails.length!==1?'s':''}</>}
        </button>
      </>}>
      <div className="col">
        {cfgError && (
          <div style={{
            padding:12,
            background:'color-mix(in oklab, var(--warn, #d97757) 14%, transparent)',
            borderRadius:'var(--r-md)',
            fontSize:12,color:'var(--warn, #d97757)',lineHeight:1.5,
            display:'flex',gap:8,marginBottom:4,
          }}>
            <I.info size={14} style={{marginTop:1,flexShrink:0}}/>
            <div><b>No podés enviar aún.</b> {cfgError}</div>
          </div>
        )}
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
        <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:6}}>Los valores que aparecerán en lugar de {`{{nombre}}`}, {`{{empresa}}`}, etc.</div>
        <div style={{background:'var(--surface-2)',padding:12,borderRadius:'var(--r-md)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {vars.slice(0,6).map(v => (
            <div key={v.key} style={{display:'flex',flexDirection:'column',gap:2}}>
              <div style={{fontSize:11,color:'var(--fg-3)'}}><b style={{color:'var(--accent)',fontWeight:600,fontFamily:'var(--font-mono)'}}>{`{{${v.key}}}`}</b> — {v.label}</div>
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
        {error && (
          <div style={{
            padding:12,
            background:'color-mix(in oklab, var(--danger) 12%, transparent)',
            borderRadius:'var(--r-md)',
            fontSize:12,color:'var(--danger)',
            display:'flex',gap:8,
          }}>
            <I.x size={14} style={{marginTop:1,flexShrink:0}}/>
            <div><b>No pudimos enviar.</b> {error}</div>
          </div>
        )}
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
  const { vars, setVars, editable } = useTemplateVars();
  const [creating, setCreating] = React.useState(false);
  const [draft, setDraft] = React.useState({ key:'', label:'', sample:'' });

  const updateVar = (i, patch) => {
    if (!editable) return;
    setVars(vars.map((v, vi) => vi === i ? { ...v, ...patch } : v));
  };
  const removeVar = (i) => {
    if (!editable) return;
    setVars(vars.filter((_, vi) => vi !== i));
  };
  const submitNew = () => {
    const key = draft.key.trim().replace(/^@/,'').replace(/\s+/g,'_');
    if (!key) return;
    if (vars.some(v => v.key === key)) {
      window.toast && window.toast({ kind:'err', title:'Ya existe una etiqueta @'+key });
      return;
    }
    setVars([...vars, { key, label: draft.label.trim() || key, sample: draft.sample.trim() || '', type:'texto' }]);
    setCreating(false);
    setDraft({ key:'', label:'', sample:'' });
  };

  return (
    <Modal title="Etiquetas de esta plantilla"
      sub={editable
        ? 'Escribe {{nombre}} (con dobles llaves) en cualquier bloque y se reemplaza por el valor de cada destinatario. Cada plantilla tiene sus propias etiquetas.'
        : 'Abre una plantilla para editar sus etiquetas. Aquí ves los valores por defecto del workspace.'}
      size="wide" onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cerrar</button>
        {editable && !creating && (
          <button className="btn primary" onClick={()=>setCreating(true)}>
            <I.plus size={13}/> Crear etiqueta nueva
          </button>
        )}
      </>}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div>
          <div className="prop-label">Etiquetas disponibles</div>
          <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8,lineHeight:1.5}}>
            {editable
              ? 'Haz clic para copiar la etiqueta tal cual va en el texto. Edita el valor de ejemplo para ajustar lo que verá el destinatario en la vista previa.'
              : 'Solo lectura — abre una plantilla del dashboard para modificar.'}
          </div>
          {creating && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 28px',gap:6,padding:10,marginBottom:10,background:'var(--accent-soft)',borderRadius:'var(--r-md)',alignItems:'center'}}>
              <input className="field" value={draft.key} onChange={e=>setDraft(d=>({...d,key:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')submitNew();if(e.key==='Escape')setCreating(false);}} placeholder="curso (sin {{}})" autoFocus style={{fontSize:12,padding:'4px 6px'}}/>
              <input className="field" value={draft.label} onChange={e=>setDraft(d=>({...d,label:e.target.value}))} placeholder="Etiqueta" style={{fontSize:12,padding:'4px 6px'}}/>
              <input className="field" value={draft.sample} onChange={e=>setDraft(d=>({...d,sample:e.target.value}))} placeholder="Ejemplo" style={{fontSize:12,padding:'4px 6px'}}/>
              <button className="btn icon sm" onClick={submitNew} disabled={!draft.key.trim()} title="Crear"><I.check size={11}/></button>
            </div>
          )}
          <div style={{border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
            {vars.length === 0 && (
              <div style={{padding:'18px 14px',fontSize:12,color:'var(--fg-3)',textAlign:'center'}}>
                Esta plantilla aún no tiene etiquetas. {editable && 'Usa "Crear etiqueta nueva" para empezar.'}
              </div>
            )}
            {vars.map((v,i) => (
              <div key={v.key+'_'+i} style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 20px 20px',gap:10,padding:'10px 12px',borderBottom:i<vars.length-1?'1px solid var(--line)':'none',alignItems:'center',fontSize:12}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--accent)',fontFamily:'var(--font-mono)'}}>{`{{${v.key}}}`}</div>
                  <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2}}>{v.label || v.key}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:10,color:'var(--fg-3)',flexShrink:0}}>Se verá:</span>
                  {editable ? (
                    <input className="field" value={v.sample||''} onChange={e=>updateVar(i,{sample:e.target.value})} style={{fontSize:12,padding:'2px 6px',height:24,fontWeight:500}}/>
                  ) : (
                    <b>{v.sample}</b>
                  )}
                </div>
                <button className="btn icon sm ghost" title={`Copiar {{${v.key}}}`} onClick={()=>{
                  const tag = `{{${v.key}}}`;
                  try { navigator.clipboard?.writeText(tag); } catch(e){}
                  window.toast && window.toast({ kind:'ok', title:`${tag} copiada` });
                }}><I.copy size={11}/></button>
                {editable ? (
                  <button className="btn icon sm ghost" title="Eliminar etiqueta" style={{color:'var(--err,#e04f4f)'}}
                    onClick={()=>{
                      if (window.confirm(`Eliminar {{${v.key}}} de esta plantilla?`)) removeVar(i);
                    }}>
                    <I.trash size={11}/>
                  </button>
                ) : <span/>}
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
              Tú escribiste: <span style={{color:'var(--accent)',fontWeight:600,fontFamily:'var(--font-mono)'}}>Hola {`{{nombre}}`}, aquí está tu pedido {`{{pedido}}`}</span>
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
