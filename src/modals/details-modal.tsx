// Detalles modal — edita subject, preheader y versión texto plano del correo.
//
// Se abre desde la toolbar del editor (botón "Detalles" entre Preview y Review)
// y también desde los fixes de c1/c2/g3 del Review panel vía el evento
// `st:open-details`.
//
// Persistencia: mutamos templateJsonRef.current.meta del editor a través de
// window.__stEditor.setMeta() y dejamos que flushSave persista — el spread
// existente en flushSave (editor.tsx) ya preserva `meta` entre guardados.
//
// Plain-text: si el campo viene vacío y window.stExport.renderTXT existe, se
// auto-genera al abrir desde el snapshot actual del editor (no desde el prop
// template, que puede estar stale respecto de ediciones no guardadas). El
// usuario puede sobrescribir o pedir "Regenerar" explícitamente.

function DetailsModal({ onClose }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();

  const initial = React.useMemo(() => {
    const ed = window.__stEditor;
    const snap = (ed && typeof ed.getSnapshot === 'function') ? ed.getSnapshot() : null;
    const meta = (snap && snap.meta) || {};
    let plain = typeof meta.plainText === 'string' ? meta.plainText : '';
    let plainAuto = false;
    if (!plain && snap && window.stExport && typeof window.stExport.renderTXT === 'function') {
      try { plain = window.stExport.renderTXT(snap) || ''; plainAuto = true; } catch { plain = ''; }
    }
    return {
      subject: typeof meta.subject === 'string' ? meta.subject : '',
      preview: typeof meta.preview === 'string' ? meta.preview : '',
      plain,
      plainAuto,
      snap,
      vars: (snap && Array.isArray(snap.vars)) ? snap.vars : [],
    };
  }, []);

  const [subject, setSubject] = React.useState(initial.subject);
  const [preview, setPreview] = React.useState(initial.preview);
  const [plain, setPlain] = React.useState(initial.plain);
  const [varPickerOpen, setVarPickerOpen] = React.useState(false);
  const subjectRef = React.useRef(null);

  // Inserta `{{key}}` en la posición actual del cursor del input de subject.
  // Si el input no está foco, lo appendea al final. Mantiene el foco post-inserción.
  const insertVarIntoSubject = (key) => {
    const token = `{{${key}}}`;
    const el = subjectRef.current;
    if (!el) { setSubject(s => s + token); setVarPickerOpen(false); return; }
    const start = typeof el.selectionStart === 'number' ? el.selectionStart : subject.length;
    const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : subject.length;
    const next = subject.slice(0, start) + token + subject.slice(end);
    setSubject(next);
    setVarPickerOpen(false);
    // Reposicionar cursor justo después del token insertado
    requestAnimationFrame(() => {
      if (!el) return;
      try { el.focus(); el.setSelectionRange(start + token.length, start + token.length); } catch { /* ignore */ }
    });
  };
  // `plainAuto` flag: true cuando el valor actual viene del auto-generador y el
  // usuario no lo tocó. Al saltar a la acción Regenerar o al editar, lo
  // actualizamos. No se persiste — solo afecta el hint en UI y el save path.
  const [plainAuto, setPlainAuto] = React.useState(initial.plainAuto);

  const regenerate = () => {
    const ed = window.__stEditor;
    const snap = (ed && typeof ed.getSnapshot === 'function') ? ed.getSnapshot() : initial.snap;
    if (!snap || !window.stExport || typeof window.stExport.renderTXT !== 'function') return;
    try {
      const fresh = window.stExport.renderTXT(snap) || '';
      setPlain(fresh);
      setPlainAuto(true);
    } catch { /* ignore */ }
  };

  const save = async () => {
    const ed = window.__stEditor;
    if (!ed || typeof ed.setMeta !== 'function') { onClose(); return; }
    // Persistimos siempre lo que el usuario ve: si abrió el modal y dejó el
    // auto-generado como está, eso cuenta como "aceptado" y se guarda. Si lo
    // editó, se guarda la versión editada. Cerrar sin tocar nada equivale a
    // confirmar el auto-generado — mismo resultado.
    await ed.setMeta({
      subject,
      preview,
      plainText: plain,
    });
    onClose();
  };

  const subjectLen = subject.length;
  const previewLen = preview.length;

  return (
    <Modal
      title={t('modals.details.title')}
      sub={t('modals.details.sub')}
      size="wide"
      onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>{t('modals.common.cancel')}</button>
        <button className="btn primary" onClick={save}><I.check size={13}/> {t('modals.details.save')}</button>
      </>}
    >
      <div className="col" style={{gap:16}}>
        {/* Subject */}
        <div>
          <div className="prop-label" style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <span>{t('modals.details.subject.label')}</span>
            <span style={{fontSize:11,color: subjectLen === 0 ? 'var(--danger)' : subjectLen > 70 ? 'var(--warn)' : 'var(--fg-3)'}}>
              {subjectLen} / 70
            </span>
          </div>
          <div style={{display:'flex',gap:6,position:'relative'}}>
            <input
              ref={subjectRef}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('modals.details.subject.placeholder')}
              style={{flex:1,padding:'8px 10px',fontSize:13,border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)'}}
            />
            <button
              className="btn sm ghost"
              onClick={() => setVarPickerOpen(v => !v)}
              title={t('modals.details.subject.insertVar')}
              style={{flexShrink:0}}
            >
              <I.braces size={12}/> {t('modals.details.subject.insertVarShort')}
            </button>
            {varPickerOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position:'absolute',top:'100%',right:0,marginTop:4,
                  background:'var(--surface)',border:'1px solid var(--line)',
                  borderRadius:'var(--r-md)',padding:6,minWidth:220,maxHeight:260,
                  overflow:'auto',zIndex:10,
                  boxShadow:'0 8px 24px -8px rgba(0,0,0,.25)',
                }}
              >
                {initial.vars.length === 0 ? (
                  <div style={{padding:'8px 10px',fontSize:11,color:'var(--fg-3)'}}>
                    {t('modals.details.subject.noVars')}
                  </div>
                ) : initial.vars.map(v => (
                  <button
                    key={v.key}
                    onClick={() => insertVarIntoSubject(v.key)}
                    style={{
                      display:'flex',width:'100%',alignItems:'baseline',gap:8,
                      padding:'6px 8px',border:'none',background:'transparent',
                      textAlign:'left',cursor:'pointer',borderRadius:'var(--r-sm)',
                      fontSize:12,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <code style={{fontSize:11,color:'var(--accent)'}}>{`{{${v.key}}}`}</code>
                    <span style={{color:'var(--fg-3)',fontSize:11,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {v.label || v.sample || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4}}>{t('modals.details.subject.hint')}</div>
        </div>

        {/* Preheader */}
        <div>
          <div className="prop-label" style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <span>{t('modals.details.preview.label')}</span>
            <span style={{fontSize:11,color: previewLen === 0 || previewLen > 130 ? 'var(--warn)' : previewLen < 40 ? 'var(--warn)' : 'var(--fg-3)'}}>
              {previewLen} / 90
            </span>
          </div>
          <input
            value={preview}
            onChange={e => setPreview(e.target.value)}
            placeholder={t('modals.details.preview.placeholder')}
            style={{width:'100%',padding:'8px 10px',fontSize:13,border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)'}}
          />
          <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4}}>{t('modals.details.preview.hint')}</div>
        </div>

        {/* Plain-text */}
        <div>
          <div className="prop-label" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>{t('modals.details.plain.label')}</span>
            <button className="btn sm ghost" onClick={regenerate} title={t('modals.details.plain.regen.tip')}>
              <I.wand size={11}/> {t('modals.details.plain.regen')}
            </button>
          </div>
          <textarea
            value={plain}
            onChange={e => { setPlain(e.target.value); setPlainAuto(false); }}
            rows={12}
            placeholder={t('modals.details.plain.placeholder')}
            style={{width:'100%',padding:'10px 12px',fontSize:12,fontFamily:'var(--font-mono, ui-monospace, monospace)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',background:'var(--surface)',resize:'vertical',lineHeight:1.5}}
          />
          <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4}}>
            {plainAuto ? t('modals.details.plain.hint.auto') : t('modals.details.plain.hint.edited')}
          </div>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { DetailsModal });
