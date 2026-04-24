// IPC error localizer. Electron main-process handlers can't reach
// window.stI18n, so the contract is: they return
//   { ok:false, errorKey:'cdn.err.xxx', errorParams:{...}, error:'English fallback' }
// and the renderer runs this helper to turn that into a localized string
// before showing it to the user.
//
// - If errorKey exists, we translate via stI18n.t(errorKey, errorParams).
// - If not, we fall back to result.error (English fallback string from main).
// - If neither is present, we return common.err.unknown.
//
// Consumers:
//   const msg = window.stIpcErr.localize(result);
//   window.toast({ kind:'err', title: msg });

function localize(result) {
  if (!result || result.ok) return null;
  const t = window.stI18n && typeof window.stI18n.t === 'function' ? window.stI18n.t : null;
  if (result.errorKey && t) {
    return t(result.errorKey, result.errorParams || {});
  }
  if (result.error) return result.error;
  return t ? t('common.err.unknown') : 'Unknown error';
}

Object.assign(window, { stIpcErr: { localize } });
