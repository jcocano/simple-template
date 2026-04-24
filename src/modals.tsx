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
  window.stI18n.useLang();
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
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [tab, setTab] = React.useState('share');  // share | devs
  return (
    <Modal title={t('modals.export.title')}
      sub={t('modals.export.sub')}
      size="wide" onClose={onClose}
      footer={null}>
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--line)',marginBottom:18}}>
        <ModalTab label={t('modals.export.tab.share')} icon="send" active={tab==='share'} onClick={()=>setTab('share')} sub={t('modals.export.tab.share.sub')}/>
        <ModalTab label={t('modals.export.tab.devs')} icon="code" active={tab==='devs'} onClick={()=>setTab('devs')} sub={t('modals.export.tab.devs.sub')}/>
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
  const t = window.stI18n.t;
  const lang = window.stI18n.useLang();
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

  const ACTIONS = React.useMemo(() => [
    { id:'test',     t: t('modals.export.action.test.title'),  d: t('modals.export.action.test.desc'), icon:'send'},
    { id:'copy',     t: t('modals.export.action.copy.title'),  d: t('modals.export.action.copy.desc'), icon:'copy'},
  ], [lang]);

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
        title: t(emails.length === 1 ? 'modals.test.toast.title.one' : 'modals.test.toast.title.other', { n: emails.length }),
        msg: t('modals.test.toast.msg'),
      });
      onClose();
    } else {
      setError(result.error || t('modals.test.error.unknown'));
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
          <div><b>{t('modals.test.cannotSend')}</b> {cfgError}</div>
        </div>
      )}

      {action==='test' && (
        <div className="col" style={{gap:12,padding:16,background:'var(--surface-2)',borderRadius:'var(--r-md)'}}>
          <div className="prop-label">{t('modals.test.recipients.label')}</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:6,border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--surface)',minHeight:44}}>
            {emails.map((em,i) => (
              <span key={i} className="chip" style={{height:26,fontSize:12}}>
                {em}
                <button className="btn icon sm ghost" style={{height:18,width:18}} onClick={()=>setEmails(e=>e.filter((_,x)=>x!==i))}><I.x size={10}/></button>
              </span>
            ))}
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===',')addEmail()}} style={{flex:1,minWidth:180,border:'none',outline:'none',background:'transparent',fontSize:13,padding:'0 4px'}} placeholder={t('modals.test.recipients.placeholder')}/>
          </div>
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
            <input type="checkbox" defaultChecked/>
            {t('modals.test.tag.prefix')} <b>{t('modals.test.tag.badge')}</b> {t('modals.test.tag.suffix')}
          </label>
          <div style={{fontSize:11,color:'var(--fg-3)',lineHeight:1.5}}>
            {t('modals.test.smtp.hint.prefix')} <code style={{fontFamily:'var(--font-mono)'}}>{`{{nombre}}`}</code> {t('modals.test.smtp.hint.suffix')}
          </div>
        </div>
      )}

      {action==='copy' && (
        <div className="col" style={{gap:12,padding:16,background:'var(--surface-2)',borderRadius:'var(--r-md)'}}>
          <div className="prop-label">{t('modals.export.link.label')}</div>
          <div className="row">
            <input className="field" readOnly value="https://simple-template.app/v/k7h2-39pq" style={{flex:1,fontFamily:'var(--font-mono)',fontSize:12}}/>
            <button className="btn" onClick={()=>{
              try { navigator.clipboard?.writeText('https://simple-template.app/v/k7h2-39pq'); } catch(e){}
              window.toast && window.toast({ kind:'ok', title: t('modals.export.link.copied.title'), msg: t('modals.export.link.copied.msg') });
            }}><I.copy size={13}/> {t('modals.export.btn.copy')}</button>
          </div>
          <div style={{fontSize:12,color:'var(--fg-3)',lineHeight:1.5}}>
            {t('modals.export.link.description')}
          </div>
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}>
            <input type="checkbox" defaultChecked/>
            {t('modals.export.link.sampleHint')} ({`{{nombre}}`} → "Carmen")
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
          <div><b>{t('modals.test.sendFailed')}</b> {error}</div>
        </div>
      )}

      {/* Footer */}
      <div className="row" style={{justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--line)',marginTop:4}}>
        <button className="btn ghost" onClick={onClose} disabled={sending}>{t('modals.common.cancel')}</button>
        {action==='test' && <button className="btn primary" onClick={sendTest} disabled={sending || emails.length===0 || cfgLoading || !!cfgError}>
          {sending ? <><I.loader size={13}/> {t('modals.test.sending')}</> : <><I.send size={13}/> {t(emails.length === 1 ? 'modals.test.btn.send.one' : 'modals.test.btn.send.other', { n: emails.length })}</>}
        </button>}
        {action==='copy' && <button className="btn primary" onClick={onClose}><I.check size={13}/> {t('modals.common.done')}</button>}
      </div>
    </div>
  );
}

// ─── TAB 2: FOR DEVELOPERS ──────────────────────────────────────
function DevsTab({ onClose }) {
  const t = window.stI18n.t;
  const lang = window.stI18n.useLang();
  // Lectura inicial desde Settings → Export (`getWSSetting('export', {})`).
  // Sólo en mount; no re-sincronizamos si el user cambia Settings con el modal
  // abierto (overkill para un caso borde).
  const [fmt, setFmt] = React.useState(() => {
    const ex = window.stStorage?.getWSSetting?.('export', {}) || {};
    const f = ex.format;
    return (f === 'html' || f === 'mjml' || f === 'txt' || f === 'zip') ? f : 'html';
  });
  const [minify, setMinify] = React.useState(() => {
    const ex = window.stStorage?.getWSSetting?.('export', {}) || {};
    return ex.minify !== false; // default ON, igual que Settings
  });
  const [includeTxt, setIncludeTxt] = React.useState(() => {
    const ex = window.stStorage?.getWSSetting?.('export', {}) || {};
    // Opt-in explícito: sólo ON si el user lo marcó `true` en Settings.
    // Settings UI lo trata como `!== false` (ON por default), pero el modal
    // históricamente arranca OFF — no cambiamos el comportamiento para users
    // que nunca tocaron Settings.
    return ex.plaintext === true;
  });
  // R5 · Dialect selector for merge tags. Applies only to HTML fmt.
  const [dialect, setDialect] = React.useState('native'); // native | sendgrid | mailgun | mailchimp
  const [template, setTemplate] = React.useState(null);
  const [warnings, setWarnings] = React.useState([]);

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
  //
  // R5: HTML ahora pasa por `window.docToEmailHtml` (email-safe, table-based,
  // soporta mergeDialect). MJML/TXT siguen usando stExport.
  const [output, setOutput] = React.useState(null);
  React.useEffect(() => {
    if (!template) { setOutput(null); setWarnings([]); return; }
    const ex = window.stExport;
    if (!ex) { setOutput(null); return; }
    let alive = true;
    (async () => {
      try {
        let html = '';
        let collectedWarnings = [];
        const docFn = window.docToEmailHtml;
        if (typeof docFn !== 'function' || !template.doc) {
          throw new Error(window.stI18n.t('export.err.docToHtmlUnavailable'));
        }
        const result = docFn(template.doc, {
          lang,
          mergeDialect: dialect,
          subject: template.meta?.subject || template.name || '',
          preheader: template.meta?.preheader || '',
          minify,
        });
        html = result.html;
        collectedWarnings = result.warnings || [];
        if (includeTxt) {
          html += `\n<!-- [TXT]\n${ex.renderTXT(template)}\n[/TXT] -->`;
        }
        const htmlInlined = await ex.inlineImages(html);
        const mjmlRaw = ex.renderMJML(template);
        const mjml = await ex.inlineImages(mjmlRaw);
        if (!alive) return;
        setOutput({ html: htmlInlined, mjml, txt: ex.renderTXT(template) });
        setWarnings(collectedWarnings);
      } catch (err) {
        if (alive) setOutput({ error: err?.message || String(err) });
      }
    })();
    return () => { alive = false; };
  }, [template, minify, includeTxt, dialect, lang]);

  const current = fmt === 'zip' ? '' : (output && !output.error ? (output[fmt] || '') : '');
  const sizeKB = current ? Math.max(1, Math.round(new Blob([current]).size / 1024)) : 0;

  const FORMATS = React.useMemo(() => [
    { id:'html', label: t('modals.export.fmt.html'),       d: t('modals.export.fmt.html.desc'), ext:'html', mime:'text/html' },
    { id:'mjml', label: t('modals.export.fmt.mjml'),       d: t('modals.export.fmt.mjml.desc'), ext:'mjml', mime:'text/plain' },
    { id:'txt',  label: t('modals.export.fmt.txt'),        d: t('modals.export.fmt.txt.desc'),  ext:'txt',  mime:'text/plain' },
    { id:'zip',  label: t('modals.export.fmt.zip'),        d: t('modals.export.fmt.zip.desc'),  ext:'zip',  mime:'application/zip' },
  ], [lang]);
  const currentFormat = FORMATS.find(f => f.id === fmt) || FORMATS[0];

  const doCopy = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current);
      window.toast && window.toast({ kind:'ok', title: t('modals.export.copy.toast.title', { fmt: fmt.toUpperCase() }), msg: t('modals.export.copy.toast.msg') });
    } catch (err) {
      window.toast && window.toast({ kind:'error', title: t('modals.export.copy.failed.title'), msg: err?.message || t('modals.export.copy.failed.msg') });
    }
  };

  const doDownload = () => {
    if (!current) return;
    const base = window.stExport.safeFilename(template?.name);
    const filename = `${base}.${currentFormat.ext}`;
    window.stExport.downloadFile(filename, current, currentFormat.mime);
    window.notify && window.notify('exportDone', { kind:'ok', title: t('modals.export.download.toast.title'), msg: filename });
  };

  const doDownloadZip = async () => {
    if (!template) return;
    try {
      const { blob, filename } = await window.stExport.buildZip(template, { mergeDialect: dialect, minify, lang });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      window.notify && window.notify('exportDone', { kind:'ok', title: t('modals.export.download.toast.title'), msg: filename });
    } catch (err) {
      window.toast && window.toast({ kind:'error', title: t('modals.export.generate.failed'), msg: err?.message || String(err) });
    }
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:20}}>
      <div className="col">
        <div className="prop-label">{t('modals.export.format')}</div>
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
        {/* R5 · Dialect selector (HTML only) */}
        <div className="prop-label" style={{opacity: fmt==='html'?1:0.5}}>{t('export.dialect.label')}</div>
        <div className="col" style={{gap:4,opacity: fmt==='html'?1:0.5}}>
          {[
            { id:'native',    label: t('export.dialect.native') },
            { id:'sendgrid',  label: t('export.dialect.sendgrid') },
            { id:'mailgun',   label: t('export.dialect.mailgun') },
            { id:'mailchimp', label: t('export.dialect.mailchimp') },
          ].map(o => (
            <label key={o.id} style={{display:'flex',gap:8,alignItems:'center',fontSize:12,cursor:fmt==='html'?'pointer':'default'}}>
              <input type="radio" name="export-dialect" checked={dialect===o.id} onChange={()=>setDialect(o.id)} disabled={fmt!=='html'}/>
              {o.label}
            </label>
          ))}
        </div>
        <div className="divider"/>
        <div className="prop-label">{t('modals.export.options')}</div>
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12,opacity: fmt==='html'?1:0.5}}>
          <input type="checkbox" checked={minify} onChange={e=>setMinify(e.target.checked)} disabled={fmt!=='html'}/>
          {t('export.option.minify', null, t('modals.export.opt.minify'))}
        </label>
        {fmt==='html' && (
          <div style={{fontSize:11,color:'var(--fg-3)',lineHeight:1.45,paddingLeft:22}}>
            {t('export.option.minify.hint')}
          </div>
        )}
        <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12,opacity: fmt==='html'?1:0.5}}>
          <input type="checkbox" checked={includeTxt} onChange={e=>setIncludeTxt(e.target.checked)} disabled={fmt!=='html'}/>
          {t('modals.export.opt.includeTxt')}
        </label>
        <div className="divider"/>
        <div className="prop-label">{t('modals.export.result')}</div>
        <div className="row">
          {template ? (
            output?.error
              ? <div className="chip" style={{color:'var(--err,#e04f4f)'}}><I.x size={10}/> {t('modals.export.status.error')}</div>
              : <div className="chip ok"><I.check size={10}/> {t('modals.export.status.valid')}</div>
          ) : (
            <div className="chip"><I.clock size={10}/> {t('modals.export.status.noTemplate')}</div>
          )}
        </div>
        <div style={{fontSize:12,color:'var(--fg-3)',lineHeight:1.5}}>
          {template && fmt !== 'zip' ? <>{t('modals.export.size')}: <b style={{color:'var(--fg)'}}>{sizeKB} KB</b><br/></> : null}
          {t('modals.export.compat')}
        </div>
      </div>
      <div style={{background:'var(--surface-2)',borderRadius:'var(--r-md)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {/* R5 · Warnings banner (e.g. alt missing, scripts stripped, QR not baked) */}
        {fmt==='html' && warnings.length > 0 && (
          <div style={{padding:'8px 12px',background:'color-mix(in oklab, var(--warn, #d97757) 14%, transparent)',borderBottom:'1px solid var(--line)',fontSize:11.5,color:'var(--warn, #d97757)',lineHeight:1.5}}>
            <div style={{fontWeight:600,marginBottom:4,display:'flex',alignItems:'center',gap:6}}><I.info size={12}/> {t('export.warnings.title')}</div>
            <ul style={{margin:0,paddingLeft:18}}>
              {warnings.map((w, i) => {
                let msg = w;
                if (w.startsWith('altMissing')) msg = t('export.warning.altMissing', { ref: w.split(':')[1] || '' });
                else if (w === 'scriptStripped') msg = t('export.warning.scriptStripped');
                else if (w === 'qrNotBaked') msg = t('export.warning.qrNotBaked');
                else if (w.startsWith('htmlTagStripped:')) msg = t('export.warning.htmlTagStripped', { tag: w.split(':')[1] || 'unknown' });
                else if (w.startsWith('attrStripped:')) msg = t('export.warning.attrStripped', { attr: w.split(':')[1] || 'unknown' });
                else if (w.startsWith('mergeTagDotNotation:')) {
                  const parts = w.split(':');
                  msg = t('export.warning.mergeTag.dotNotation', { dialect: parts[1] || 'unknown', key: parts[2] || '' });
                } else if (w.startsWith('mergeTagRawNotSupported:')) {
                  const parts = w.split(':');
                  msg = t('export.warning.mergeTag.rawNotSupported', { dialect: parts[1] || 'unknown', key: parts[2] || '' });
                }
                return <li key={i}>{msg}</li>;
              })}
            </ul>
          </div>
        )}
        <div style={{padding:'8px 12px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
          <I.code size={13}/>
          <span style={{fontFamily:'var(--font-mono)'}}>{template ? window.stExport.safeFilename(template.name) : 'correo'}.{currentFormat.ext}</span>
          <div className="grow"/>
          <button className="btn icon sm ghost" onClick={doCopy} disabled={fmt==='zip' || !current} title={t('modals.export.btn.copy')}><I.copy size={12}/></button>
        </div>
        {fmt === 'zip' ? (
          <div style={{padding:14,fontSize:12,color:'var(--fg-3)',lineHeight:1.5}}>
            {t('modals.export.zip.preview')}
          </div>
        ) : (
          <pre style={{margin:0,padding:14,fontFamily:'var(--font-mono)',fontSize:11.5,lineHeight:1.6,overflow:'auto',maxHeight:340,color:'var(--fg-2)',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
            {output?.error
              ? `⚠ ${t('modals.export.generate.failed')}: ${output.error}`
              : (current || t('modals.export.empty'))}
          </pre>
        )}
        <div className="row" style={{padding:'10px 12px',borderTop:'1px solid var(--line)',justifyContent:'flex-end'}}>
          <button className="btn ghost" onClick={onClose}>{t('modals.common.close')}</button>
          <button className="btn" onClick={doCopy} disabled={fmt==='zip' || !current}><I.copy size={13}/> {t('modals.export.btn.copy')}</button>
          <button className="btn primary" onClick={fmt==='zip' ? doDownloadZip : doDownload} disabled={fmt==='zip' ? !template : !current}><I.download size={13}/> {t('modals.export.btn.download', { fmt: fmt.toUpperCase() })}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEST SEND MODAL
// ════════════════════════════════════════════════════════════════
function TestSendModal({ onClose }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
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
        title: t(emails.length === 1 ? 'modals.test.toast.title.one' : 'modals.test.toast.title.other', { n: emails.length }),
        msg: t('modals.test.toast.msg'),
      });
      onClose();
    } else {
      setError(result.error || t('modals.test.error.unknown'));
    }
  };
  return (
    <Modal title={t('modals.test.title')} sub={t('modals.test.sub')} onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose} disabled={sending}>{t('modals.common.cancel')}</button>
        <button className="btn primary" onClick={sendTest} disabled={sending || emails.length===0 || cfgLoading || !!cfgError}>
          {sending ? <><I.loader size={13}/> {t('modals.test.sending')}</> : <><I.send size={13}/> {t(emails.length === 1 ? 'modals.test.btn.send.one' : 'modals.test.btn.send.other', { n: emails.length })}</>}
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
            <div><b>{t('modals.test.cannotSend')}</b> {cfgError}</div>
          </div>
        )}
        <div className="prop-label">{t('modals.test.recipients.label')}</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:6,border:'1px solid var(--line)',borderRadius:'var(--r-md)',background:'var(--surface)',minHeight:44}}>
          {emails.map((em,i) => (
            <span key={i} className="chip" style={{height:26,fontSize:12}}>
              {em}
              <button className="btn icon sm ghost" style={{height:18,width:18}} onClick={()=>setEmails(e=>e.filter((_,x)=>x!==i))}><I.x size={10}/></button>
            </span>
          ))}
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===',')add()}} style={{flex:1,minWidth:180,border:'none',outline:'none',background:'transparent',fontSize:13,padding:'0 4px'}} placeholder={t('modals.test.recipients.placeholder')}/>
        </div>
        <div className="divider"/>
        <div className="prop-label">{t('modals.test.sampleData.label')}</div>
        <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:6}}>{t('modals.test.sampleData.hint')}</div>
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
            {t('modals.test.tag.prefix')} <b>{t('modals.test.tag.badge')}</b> {t('modals.test.tag.suffix')}
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
            <div><b>{t('modals.test.sendFailed')}</b> {error}</div>
          </div>
        )}
        <div style={{padding:12,background:'var(--accent-soft)',borderRadius:'var(--r-md)',fontSize:12,color:'var(--accent)',display:'flex',gap:8}}>
          <I.check size={14}/>
          <div>{t('modals.test.quota.note')}</div>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
// VARIABLES / TAGS MODAL
// ════════════════════════════════════════════════════════════════
function VariablesModal({ onClose }) {
  const t = window.stI18n.t;
  const lang = window.stI18n.useLang();
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
      window.toast && window.toast({ kind:'err', title: t('modals.vars.alreadyExists', { key }) });
      return;
    }
    setVars([...vars, { key, label: draft.label.trim() || key, sample: draft.sample.trim() || '', type:'texto' }]);
    setCreating(false);
    setDraft({ key:'', label:'', sample:'' });
  };

  const sources = React.useMemo(() => [
    { n: t('modals.vars.source.contacts.name'), d: t('modals.vars.source.contacts.desc'), on:true},
    { n: t('modals.vars.source.csv.name'),      d: t('modals.vars.source.csv.desc'),      on:false},
    { n: t('modals.vars.source.crm.name'),      d: t('modals.vars.source.crm.desc'),      on:false},
    { n: t('modals.vars.source.db.name'),       d: t('modals.vars.source.db.desc'),       on:false},
  ], [lang]);

  return (
    <Modal title={t('modals.vars.title')}
      sub={editable
        ? t('modals.vars.sub.editable')
        : t('modals.vars.sub.readonly')}
      size="wide" onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>{t('modals.common.close')}</button>
        {editable && !creating && (
          <button className="btn primary" onClick={()=>setCreating(true)}>
            <I.plus size={13}/> {t('modals.vars.btn.create')}
          </button>
        )}
      </>}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div>
          <div className="prop-label">{t('modals.vars.available')}</div>
          <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8,lineHeight:1.5}}>
            {editable
              ? t('modals.vars.hint.editable')
              : t('modals.vars.hint.readonly')}
          </div>
          {creating && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 28px',gap:6,padding:10,marginBottom:10,background:'var(--accent-soft)',borderRadius:'var(--r-md)',alignItems:'center'}}>
              <input className="field" value={draft.key} onChange={e=>setDraft(d=>({...d,key:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')submitNew();if(e.key==='Escape')setCreating(false);}} placeholder={t('modals.vars.placeholder.key')} autoFocus style={{fontSize:12,padding:'4px 6px'}}/>
              <input className="field" value={draft.label} onChange={e=>setDraft(d=>({...d,label:e.target.value}))} placeholder={t('modals.vars.placeholder.label')} style={{fontSize:12,padding:'4px 6px'}}/>
              <input className="field" value={draft.sample} onChange={e=>setDraft(d=>({...d,sample:e.target.value}))} placeholder={t('modals.vars.placeholder.sample')} style={{fontSize:12,padding:'4px 6px'}}/>
              <button className="btn icon sm" onClick={submitNew} disabled={!draft.key.trim()} title={t('modals.vars.btn.create.tooltip')}><I.check size={11}/></button>
            </div>
          )}
          <div style={{border:'1px solid var(--line)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
            {vars.length === 0 && (
              <div style={{padding:'18px 14px',fontSize:12,color:'var(--fg-3)',textAlign:'center'}}>
                {t('modals.vars.empty')} {editable && t('modals.vars.empty.cta')}
              </div>
            )}
            {vars.map((v,i) => (
              <div key={v.key+'_'+i} style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 20px 20px',gap:10,padding:'10px 12px',borderBottom:i<vars.length-1?'1px solid var(--line)':'none',alignItems:'center',fontSize:12}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--accent)',fontFamily:'var(--font-mono)'}}>{`{{${v.key}}}`}</div>
                  <div style={{fontSize:11,color:'var(--fg-3)',marginTop:2}}>{v.label || v.key}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:10,color:'var(--fg-3)',flexShrink:0}}>{t('modals.vars.willShow')}</span>
                  {editable ? (
                    <input className="field" value={v.sample||''} onChange={e=>updateVar(i,{sample:e.target.value})} style={{fontSize:12,padding:'2px 6px',height:24,fontWeight:500}}/>
                  ) : (
                    <b>{v.sample}</b>
                  )}
                </div>
                <button className="btn icon sm ghost" title={t('modals.vars.copy.tooltip', { key: v.key })} onClick={()=>{
                  const tag = `{{${v.key}}}`;
                  try { navigator.clipboard?.writeText(tag); } catch(e){}
                  window.toast && window.toast({ kind:'ok', title: t('modals.vars.copied.toast', { tag }) });
                }}><I.copy size={11}/></button>
                {editable ? (
                  <button className="btn icon sm ghost" title={t('modals.vars.delete.tooltip')} style={{color:'var(--err,#e04f4f)'}}
                    onClick={()=>{
                      if (window.confirm(t('modals.vars.delete.confirm', { key: v.key }))) removeVar(i);
                    }}>
                    <I.trash size={11}/>
                  </button>
                ) : <span/>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="prop-label">{t('modals.vars.source.title')}</div>
          <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8,lineHeight:1.5}}>{t('modals.vars.source.hint')}</div>
          <div className="col" style={{gap:8}}>
            {sources.map(s => (
              <div key={s.n} style={{display:'flex',gap:10,padding:12,background:'var(--surface-2)',borderRadius:'var(--r-md)',alignItems:'center'}}>
                <div style={{width:34,height:34,borderRadius:'var(--r-sm)',background:'var(--surface)',display:'grid',placeItems:'center'}}>
                  <I.braces size={16} style={{color:'var(--fg-2)'}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{s.n}</div>
                  <div style={{fontSize:11,color:'var(--fg-3)'}}>{s.d}</div>
                </div>
                {s.on ? <span className="chip ok"><I.check size={10}/> {t('modals.vars.source.inUse')}</span> : <button className="btn sm">{t('modals.vars.source.useThis')}</button>}
              </div>
            ))}
          </div>
          <div className="divider"/>
          <div className="prop-label">{t('modals.vars.preview.title')}</div>
          <div style={{padding:14,background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:13}}>
            <div style={{color:'var(--fg-3)',fontSize:11,marginBottom:6}}>
              {t('modals.vars.preview.youWrote')} <span style={{color:'var(--accent)',fontWeight:600,fontFamily:'var(--font-mono)'}}>{t('modals.vars.preview.template')}</span>
            </div>
            <div style={{color:'var(--fg)',fontWeight:500,padding:'6px 0',borderTop:'1px dashed var(--line)'}}>
              {t('modals.vars.preview.theySee')} <b>{t('modals.vars.preview.rendered')}</b>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { Modal, ExportModal, TestSendModal, VariablesModal });
