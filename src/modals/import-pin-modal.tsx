// Triggered when the OS hands the app a `simpletemplete://import?u=...`
// deep link. The bundle on the other end is encrypted with a 6-char PIN
// that the sender shared through a separate channel; we ask for it here
// before calling the facade.
//
// Errors surface inline (toast feels noisy in a modal). WRONG_PIN is the
// common path — the user re-types and submits without leaving the modal.

function ImportPinModal({ url, name, onClose, onImported }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();

  const [pin, setPin] = React.useState('');
  const [phase, setPhase] = React.useState('idle'); // idle | loading | error
  const [errorCode, setErrorCode] = React.useState(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const submit = async () => {
    const normalized = window.stSharingCrypto.normalizePin(pin);
    if (!normalized) {
      setErrorCode('INVALID_PIN_FORMAT');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setErrorCode(null);
    try {
      const result = await window.stShare.importFromDeepLink(url, normalized);
      setPhase('idle');
      if (typeof onImported === 'function') onImported(result);
      onClose();
    } catch (err) {
      const code = (err && (err.message || err.code)) || 'UNKNOWN';
      setErrorCode(code);
      setPhase('error');
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && phase !== 'loading') {
      e.preventDefault();
      submit();
    }
  };

  let errorMsg = null;
  if (errorCode === 'WRONG_PIN') errorMsg = t('share.import.error.wrongPin');
  else if (errorCode === 'INVALID_PIN_FORMAT') errorMsg = t('share.import.error.invalidPinFormat');
  else if (errorCode === 'EXPIRED') errorMsg = t('share.import.error.expired');
  else if (
    errorCode === 'INVALID_BUNDLE'
    || errorCode === 'INVALID_SCHEME'
    || errorCode === 'INVALID_DEEPLINK'
    || errorCode === 'INVALID_URL'
    || errorCode === 'UNSUPPORTED_VERSION'
  ) errorMsg = t('share.import.error.invalid');
  else if (errorCode) errorMsg = t('share.import.error.generic');

  const titleText = name
    ? t('share.import.pin.title.named', { name })
    : t('share.import.pin.title');

  const footer = (
    <>
      <button className="btn" onClick={onClose} disabled={phase === 'loading'}>
        {t('modals.common.cancel')}
      </button>
      <button className="btn primary" onClick={submit} disabled={phase === 'loading' || !pin.trim()}>
        {phase === 'loading'
          ? <><I.loader size={12} style={{animation:'spin 1s linear infinite'}}/> {t('share.import.pin.importing')}</>
          : <><I.download size={12}/> {t('share.import.pin.cta')}</>}
      </button>
    </>
  );

  return (
    <Modal title={t('share.import.pin.title')} sub={t('share.import.pin.sub')} onClose={onClose} size="sm" footer={footer}>
      <div style={{padding:'16px 0', display:'flex', flexDirection:'column', gap:12}}>
        {name ? (
          <div style={{fontSize:13, color:'var(--fg-2)'}}>
            {t('share.import.pin.target', { name })}
          </div>
        ) : null}
        <div>
          <label style={{fontSize:11, color:'var(--fg-3)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6}}>
            {t('share.modal.pinLabel')}
          </label>
          <input
            ref={inputRef}
            className="field"
            value={pin}
            onChange={(e) => { setPin(e.target.value); if (phase === 'error') { setPhase('idle'); setErrorCode(null); } }}
            onKeyDown={onKey}
            placeholder={t('share.import.pin.placeholder')}
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
            style={{
              width:'100%',
              fontFamily:'var(--font-mono, ui-monospace, monospace)',
              fontSize:20,
              textAlign:'center',
              letterSpacing:'.2em',
              fontWeight:600,
              textTransform:'uppercase',
            }}
          />
        </div>
        {errorMsg ? (
          <div style={{fontSize:12, color:'var(--warn)', display:'flex', gap:6, alignItems:'flex-start'}}>
            <I.info size={12} style={{marginTop:2, flexShrink:0}}/>
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div style={{fontSize:12, color:'var(--fg-3)'}}>
            {t('share.import.pin.hint')}
          </div>
        )}
      </div>
    </Modal>
  );
}

Object.assign(window, { ImportPinModal });
