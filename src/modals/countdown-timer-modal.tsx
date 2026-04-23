// CountdownTimerModal — configure a live countdown image.
// Three tabs: Use URL · Create new timer · Library.
// The live timer is served as an external image by a third-party provider
// (mailtimers, sendtric, motionmail). We never embed their JS — the image
// does its own animation on the server side and caches per-open.

const COUNTDOWN_PROVIDERS = [
  {
    id: 'mailtimers',
    name: 'MailTimers',
    url: 'https://mailtimers.com',
    descriptionKey: 'provider.mailtimers.desc',
    featuresKey: 'provider.mailtimers.features',
    letter: 'MT',
  },
  {
    id: 'sendtric',
    name: 'Sendtric',
    url: 'https://www.sendtric.com/countdown/',
    descriptionKey: 'provider.sendtric.desc',
    featuresKey: 'provider.sendtric.features',
    letter: 'S',
  },
  {
    id: 'motionmail',
    name: 'MotionMail',
    url: 'https://motionmailapp.com/',
    descriptionKey: 'provider.motionmail.desc',
    featuresKey: 'provider.motionmail.features',
    letter: 'MM',
  },
];

function openExternal(url) {
  if (!url) return;
  if (window.shell && typeof window.shell.openExternal === 'function') {
    window.shell.openExternal(url);
    return;
  }
  window.open(url, '_blank', 'noopener');
}

function useCountdownImageLibrary() {
  const [items, setItems] = React.useState(() => window.stImages?.listCached?.() || []);
  React.useEffect(() => {
    const refresh = () => setItems(window.stImages?.listCached?.() || []);
    window.addEventListener('st:images-change', refresh);
    window.stImages?.list?.().catch(() => {});
    return () => window.removeEventListener('st:images-change', refresh);
  }, []);
  return items;
}

function CountdownTimerModal({ open, onClose, onSave, initial = {} }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();

  const [tab, setTab] = React.useState('url');
  const [imageUrl, setImageUrl] = React.useState(initial.imageUrl || '');
  const [width, setWidth] = React.useState(initial.width || 600);
  const [height, setHeight] = React.useState(initial.height || 150);
  const [alt, setAlt] = React.useState(initial.alt || '');
  const [fallbackText, setFallbackText] = React.useState(initial.fallbackText || '');
  const [linkUrl, setLinkUrl] = React.useState(initial.linkUrl || '');
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null); // 'ok' | 'error' | null
  const [selLibrary, setSelLibrary] = React.useState(null);

  const library = useCountdownImageLibrary();
  const urlInputRef = React.useRef(null);

  if (!open) return null;

  const host = (() => {
    try {
      return new URL(imageUrl).host;
    } catch {
      return '';
    }
  })();

  const onTest = () => {
    if (!imageUrl) return;
    setTesting(true);
    setTestResult(null);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth) setWidth(img.naturalWidth);
      if (img.naturalHeight) setHeight(img.naturalHeight);
      setTesting(false);
      setTestResult('ok');
    };
    img.onerror = () => {
      setTesting(false);
      setTestResult('error');
    };
    img.src = imageUrl;
  };

  const focusUrlTab = () => {
    setTab('url');
    setTimeout(() => urlInputRef.current?.focus(), 50);
  };

  const handleSave = () => {
    let chosenUrl = imageUrl;
    if (tab === 'library' && selLibrary) {
      chosenUrl = selLibrary.url;
    }
    if (!chosenUrl || !alt) return;
    const result = {
      imageUrl: chosenUrl,
      width: parseInt(width, 10) || 600,
      height: parseInt(height, 10) || 150,
      alt,
      fallbackText,
      linkUrl,
    };
    if (onSave) onSave(result);
    onClose && onClose();
  };

  const canSave = (() => {
    if (!alt) return false;
    if (tab === 'library') return !!selLibrary;
    return !!imageUrl;
  })();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,11,13,0.5)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 210,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          width: '100%',
          maxWidth: 840,
          height: '84vh',
          maxHeight: 720,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--r-sm)',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <I.clock size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>
              {t('modal.countdown.title')}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{t('modal.countdown.subtitle')}</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}>
            <I.x size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '6px 10px 0', borderBottom: '1px solid var(--line)' }}>
          {[
            { id: 'url', label: t('modal.countdown.tab.url'), icon: 'link' },
            { id: 'new', label: t('modal.countdown.tab.new'), icon: 'plus' },
            { id: 'library', label: t('modal.countdown.tab.library'), icon: 'folder' },
          ].map((tb) => {
            const Ico = I[tb.icon];
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                style={{
                  padding: '10px 14px 12px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--fg-2)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {Ico && <Ico size={13} />} {tb.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
          {tab === 'url' && (
            <div style={{ maxWidth: 600 }}>
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500 }}>{t('modal.countdown.urlLabel')}</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  ref={urlInputRef}
                  className="field"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://mailtimers.com/v/..."
                  style={{ flex: 1 }}
                />
                <button className="btn" onClick={onTest} disabled={testing || !imageUrl}>
                  {testing ? t('modal.countdown.testing') : t('modal.countdown.test')}
                </button>
              </div>
              {testResult === 'ok' && (
                <div style={{ marginTop: 6, color: 'var(--ok, #1a8a4e)', fontSize: 12 }}>
                  {t('modal.countdown.testOk', { w: width, h: height })}
                </div>
              )}
              {testResult === 'error' && (
                <div style={{ marginTop: 6, color: 'var(--danger)', fontSize: 12 }}>
                  {t('modal.countdown.testError')}
                </div>
              )}
              {host && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-sm)',
                    fontSize: 11,
                    color: 'var(--fg-3)',
                    lineHeight: 1.5,
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <span style={{ color: 'var(--warn, #b45309)', flexShrink: 0, marginTop: 1 }}>⚠</span>
                  <span>{t('warning.countdown.externalService', { host })}</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500 }}>{t('modal.countdown.width')}</label>
                  <input className="field" type="number" value={width} onChange={(e) => setWidth(e.target.value)} style={{ marginTop: 6 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500 }}>{t('modal.countdown.height')}</label>
                  <input className="field" type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={{ marginTop: 6 }} />
                </div>
              </div>
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 14, display: 'block' }}>
                {t('modal.countdown.alt')} <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="field"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder={t('modal.countdown.altPlaceholder')}
                style={{ marginTop: 6 }}
              />
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 10, display: 'block' }}>
                {t('modal.countdown.fallback')}
              </label>
              <input
                className="field"
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                placeholder={t('modal.countdown.fallbackPlaceholder')}
                style={{ marginTop: 6 }}
              />
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 10, display: 'block' }}>
                {t('modal.countdown.link')}
              </label>
              <input className="field" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" style={{ marginTop: 6 }} />
            </div>
          )}

          {tab === 'new' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.55, marginBottom: 14 }}>
                {t('modal.countdown.newIntro')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 10 }}>
                {COUNTDOWN_PROVIDERS.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r-md)',
                      padding: 14,
                      background: 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--r-sm)',
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {p.letter}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.4 }}>{t(p.descriptionKey)}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.4, fontStyle: 'italic' }}>{t(p.featuresKey)}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button className="btn sm" onClick={() => openExternal(p.url)}>
                        <I.external size={11} /> {t('modal.countdown.openBuilder')}
                      </button>
                      <button className="btn sm ghost" onClick={focusUrlTab}>
                        {t('modal.countdown.alreadyCreated')}
                      </button>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    border: '1px dashed var(--line-2)',
                    borderRadius: 'var(--r-md)',
                    padding: 14,
                    background: 'var(--surface-2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--surface)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <I.link size={14} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t('modal.countdown.manualTitle')}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.4 }}>{t('modal.countdown.manualDesc')}</div>
                  <button className="btn sm" onClick={focusUrlTab} style={{ alignSelf: 'flex-start' }}>
                    {t('modal.countdown.manualGo')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'library' && (
            <div>
              {library.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
                  {t('modal.countdown.libraryEmpty')}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 10 }}>
                  {library.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => setSelLibrary(it)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        border: `2px solid ${selLibrary?.id === it.id ? 'var(--accent)' : 'transparent'}`,
                        background: selLibrary?.id === it.id ? 'var(--accent-soft)' : 'transparent',
                        borderRadius: 'var(--r-md)',
                        padding: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
                        {it.url ? (
                          <img src={it.url} alt={it.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        ) : null}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                    </button>
                  ))}
                </div>
              )}
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 14, display: 'block' }}>
                {t('modal.countdown.alt')} <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input className="field" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder={t('modal.countdown.altPlaceholder')} style={{ marginTop: 6 }} />
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 10, display: 'block' }}>
                {t('modal.countdown.fallback')}
              </label>
              <input className="field" value={fallbackText} onChange={(e) => setFallbackText(e.target.value)} placeholder={t('modal.countdown.fallbackPlaceholder')} style={{ marginTop: 6 }} />
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 10, display: 'block' }}>
                {t('modal.countdown.link')}
              </label>
              <input className="field" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" style={{ marginTop: 6 }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: 11, color: 'var(--fg-3)' }}>
            {alt ? '' : t('modal.countdown.altRequired')}
          </div>
          <button className="btn ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" disabled={!canSave} onClick={handleSave}>
            <I.check size={13} /> {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CountdownTimerModal });
