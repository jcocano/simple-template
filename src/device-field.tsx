// device-field.tsx — UI primitive for per-device editable props.
//
// Renders a labeled field with a "Mobile" chip next to the label. Editing mode
// comes from the global editor viewport (desktop/mobile).
// - When `overrideValue` is defined → the chip shows a solid dot indicator.
// - Clicking the chip clears the mobile override (inherits desktop again).
//
// Consumer pattern:
//   <DeviceField label="Padding"
//                desktopValue={s.padding}
//                mobileValue={mob.padding}
//                onChangeDesktop={v => upd('style.padding', v)}
//                onChangeMobile={v => upd('mobile.padding', v)}>
//     {(value, setValue) => <Slider value={value} onChange={setValue} ... />}
//   </DeviceField>
//
// The render prop receives the currently-edited value + the correct
// setter, so downstream inputs don't need to know about device modes.

function DeviceField({
  label,
  desktopValue,
  mobileValue,
  onChangeDesktop,
  onChangeMobile,
  onClearMobile,
  children,
}) {
  const t = window.stI18n?.t || ((k) => k);
  const panel = React.useContext(window.DevicePanelContext || React.createContext({ device: 'desktop' }));
  const device = panel?.device === 'mobile' ? 'mobile' : 'desktop';
  const hasOverride = mobileValue !== undefined;
  const editingMobile = device === 'mobile';

  const currentValue = editingMobile
    ? (mobileValue !== undefined ? mobileValue : desktopValue)
    : desktopValue;
  const setCurrentValue = editingMobile ? onChangeMobile : onChangeDesktop;

  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <div style={{fontSize:11.5,color:'var(--fg-2)',flex:1,minWidth:0,
                     overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {label}
        </div>
        <button
          type="button"
          onClick={() => {
            if (hasOverride && onClearMobile) onClearMobile();
          }}
          disabled={!hasOverride || !onClearMobile}
          title={hasOverride
            ? t('deviceField.chip.clear')
            : t('deviceField.chip.tooltip')}
          style={{
            display:'inline-flex',alignItems:'center',gap:4,
            fontSize:10,padding:'2px 8px',
            borderRadius:12,
            border:'1px solid var(--line)',
            background: editingMobile?'var(--accent-soft)':'transparent',
            color: editingMobile?'var(--accent)':'var(--fg-3)',
            cursor:hasOverride ? 'pointer' : 'default',
            opacity:hasOverride ? 1 : 0.9,
            fontWeight:500,lineHeight:1.4,
          }}>
          <I.phone size={10}/>
          <span>{t('deviceField.chip.mobile')}</span>
          {hasOverride && (
            <span style={{
              width:5,height:5,borderRadius:'50%',
              background:editingMobile?'var(--accent)':'var(--warn, #b45309)',
              display:'inline-block',marginLeft:1,
            }}/>
          )}
        </button>
      </div>
      {children(currentValue, setCurrentValue, editingMobile)}
    </div>
  );
}

Object.assign(window, { DeviceField });
