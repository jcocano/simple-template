// Share modal — generates a deep link for the given template via the sharing
// facade (`window.stShare.shareTemplate`). Handles four phases:
//
//   profile-required → user needs to fill Settings → Account first
//   loading          → upload in progress
//   done             → deep link ready, copy/expiry UI
//   error            → show code + retry
//
// Pre-flight: checks `account.name` before calling the facade so the UX
// branches clean (the facade would throw PROFILE_REQUIRED otherwise).

function ShareModal({ templateId, templateName, onClose }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();

  const [state, setState] = React.useState({ phase: 'idle', result: null, error: null });
  const [copied, setCopied] = React.useState(null); // 'link' | 'pin' | null

  const account = window.stStorage.getSetting('account', {}) || {};
  const hasProfile = !!(account.name && String(account.name).trim());

  const doShare = async () => {
    setState({ phase: 'loading', result: null, error: null });
    try {
      const result = await window.stShare.shareTemplate(templateId);
      setState({ phase: 'done', result, error: null });
    } catch (err) {
      setState({ phase: 'error', result: null, error: err.code || err.message || 'UNKNOWN' });
    }
  };

  React.useEffect(() => {
    if (hasProfile) doShare();
    else setState({ phase: 'profile-required', result: null, error: null });
  }, []);

  const copyValue = async (which, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000);
    } catch { /* ignore */ }
  };

  const goToSettings = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('st:cmd-open', {
      detail: { id: 'settings', section: 'account' },
    }));
  };

  const title = t('share.modal.title');
  const sub = templateName ? t('share.modal.sub', { name: templateName }) : '';

  let body;
  if (state.phase === 'profile-required') {
    body = (
      <div style={{padding:'24px 0', display:'flex', flexDirection:'column', gap:12}}>
        <div style={{display:'flex', gap:10, alignItems:'flex-start'}}>
          <I.user size={18} style={{color:'var(--warn)', marginTop:2, flexShrink:0}}/>
          <div>
            <div style={{fontWeight:600, marginBottom:4}}>{t('share.modal.profileRequired.title')}</div>
            <div style={{fontSize:13, color:'var(--fg-2)', lineHeight:1.5}}>{t('share.modal.profileRequired.msg')}</div>
          </div>
        </div>
      </div>
    );
  } else if (state.phase === 'loading' || state.phase === 'idle') {
    body = (
      <div style={{padding:'32px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'var(--fg-2)'}}>
        <I.loader size={18} style={{animation:'spin 1s linear infinite'}}/>
        <div style={{fontSize:13}}>{t('share.modal.generating')}</div>
      </div>
    );
  } else if (state.phase === 'error') {
    body = (
      <div style={{padding:'24px 0', display:'flex', flexDirection:'column', gap:12}}>
        <div style={{display:'flex', gap:10, alignItems:'flex-start'}}>
          <I.info size={18} style={{color:'var(--warn)', marginTop:2, flexShrink:0}}/>
          <div>
            <div style={{fontWeight:600, marginBottom:4}}>{t('share.modal.error.title')}</div>
            <div style={{fontSize:13, color:'var(--fg-2)', lineHeight:1.5}}>{t('share.modal.error.msg')}</div>
            {state.error ? (
              <div style={{fontSize:11, color:'var(--fg-3)', marginTop:6, fontFamily:'var(--font-mono, ui-monospace, monospace)'}}>
                {state.error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  } else { // done
    body = (
      <div style={{padding:'16px 0', display:'flex', flexDirection:'column', gap:14}}>
        <div>
          <label style={{fontSize:11, color:'var(--fg-3)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6}}>
            {t('share.modal.linkLabel')}
          </label>
          <div style={{display:'flex', gap:6}}>
            <input
              className="field"
              readOnly
              value={state.result.deepLink}
              onFocus={e => e.target.select()}
              style={{flex:1, fontFamily:'var(--font-mono, ui-monospace, monospace)', fontSize:12}}
            />
            <button className="btn primary sm" onClick={() => copyValue('link', state.result.deepLink)} style={{whiteSpace:'nowrap'}}>
              {copied === 'link'
                ? <><I.check size={12}/> {t('share.modal.copied')}</>
                : <><I.copy size={12}/> {t('share.modal.copy')}</>}
            </button>
          </div>
        </div>
        <div>
          <label style={{fontSize:11, color:'var(--fg-3)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6}}>
            {t('share.modal.pinLabel')}
          </label>
          <div style={{display:'flex', gap:6}}>
            <input
              className="field"
              readOnly
              value={state.result.pinFormatted || state.result.pin}
              onFocus={e => e.target.select()}
              style={{flex:1, fontFamily:'var(--font-mono, ui-monospace, monospace)', fontSize:18, textAlign:'center', letterSpacing:'.15em', fontWeight:600}}
            />
            <button className="btn sm" onClick={() => copyValue('pin', state.result.pin)} style={{whiteSpace:'nowrap'}}>
              {copied === 'pin'
                ? <><I.check size={12}/> {t('share.modal.copied')}</>
                : <><I.copy size={12}/> {t('share.modal.copyPin')}</>}
            </button>
          </div>
        </div>
        <div style={{fontSize:12, color:'var(--fg-3)', display:'flex', gap:6, alignItems:'flex-start'}}>
          <I.info size={12} style={{marginTop:2, flexShrink:0}}/>
          <span>{t('share.modal.pinHint')}</span>
        </div>
        <div style={{fontSize:12, color:'var(--fg-3)', display:'flex', gap:6, alignItems:'flex-start'}}>
          <I.info size={12} style={{marginTop:2, flexShrink:0}}/>
          <span>
            {state.result.expiresHours
              ? t('share.modal.expiry', { hours: state.result.expiresHours })
              : t('share.modal.permanent')}
          </span>
        </div>
      </div>
    );
  }

  let footer;
  if (state.phase === 'profile-required') {
    footer = (
      <>
        <button className="btn" onClick={onClose}>{t('modals.common.cancel')}</button>
        <button className="btn primary" onClick={goToSettings}>
          <I.settings size={12}/> {t('share.modal.profileRequired.cta')}
        </button>
      </>
    );
  } else if (state.phase === 'error') {
    footer = (
      <>
        <button className="btn" onClick={onClose}>{t('modals.common.close')}</button>
        <button className="btn primary" onClick={doShare}>{t('share.modal.retry')}</button>
      </>
    );
  } else if (state.phase === 'done') {
    footer = <button className="btn primary" onClick={onClose}>{t('modals.common.done')}</button>;
  } else {
    footer = <button className="btn" onClick={onClose}>{t('modals.common.cancel')}</button>;
  }

  return (
    <Modal title={title} sub={sub} onClose={onClose} size="md" footer={footer}>
      {body}
    </Modal>
  );
}

Object.assign(window, { ShareModal });
