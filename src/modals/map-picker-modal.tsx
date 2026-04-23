// MapPickerModal — pick a static map image + destination URL.
// Four tabs: Address · Coordinates · Upload · Library.
// Uses OpenStreetMap-based static map service (staticmap.openstreetmap.de)
// for preview. Geocoding via Nominatim. Destination URL defaults to Google Maps.
//
// The modal never reaches the network for a save — it only writes whatever
// imageUrl/destinationUrl/label/address/lat/lng the user settled on.

function osmStaticUrl({ lat, lng, zoom = 14, width = 600, height = 300 }) {
  if (lat == null || lng == null) return '';
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;
}

function googleMapsSearchUrl(address = '', lat, lng) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return '';
}

async function geocodeAddress(query) {
  if (!query) return { ok: false, reason: 'empty' };
  let timer = null;
  try {
    const ctrl = new AbortController();
    timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' }, signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return { ok: false, reason: 'service' };
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) return { ok: false, reason: 'notFound' };
    const first = data[0];
    return {
      ok: true,
      data: {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
        displayName: first.display_name || query,
      },
    };
  } catch {
    return { ok: false, reason: 'service' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function useMapImageLibrary() {
  const [items, setItems] = React.useState(() => window.stImages?.listCached?.() || []);
  React.useEffect(() => {
    const refresh = () => setItems(window.stImages?.listCached?.() || []);
    window.addEventListener('st:images-change', refresh);
    window.stImages?.list?.().catch(() => {});
    return () => window.removeEventListener('st:images-change', refresh);
  }, []);
  return items;
}

function MapPickerTabButton({ id, label, active, onClick, icon }) {
  const Ico = icon && I[icon];
  return (
    <button
      onClick={onClick}
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
      {Ico && <Ico size={13} />} {label}
    </button>
  );
}

function MapPickerModal({ open, onClose, onSave, initial = {} }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();

  const [tab, setTab] = React.useState('address');
  const [address, setAddress] = React.useState(initial.address || '');
  const [label, setLabel] = React.useState(initial.label || '');
  const [lat, setLat] = React.useState(initial.lat != null ? String(initial.lat) : '');
  const [lng, setLng] = React.useState(initial.lng != null ? String(initial.lng) : '');
  const [zoom, setZoom] = React.useState(14);
  const [searching, setSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(null);
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const [customUrl, setCustomUrl] = React.useState(initial.imageUrl || '');
  const [selLibrary, setSelLibrary] = React.useState(null);

  const library = useMapImageLibrary();
  const fileInputRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);

  if (!open) return null;

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const hasCoords = !isNaN(latNum) && !isNaN(lngNum);

  const previewUrl = (() => {
    if (tab === 'upload' || tab === 'library') return null;
    if (hasCoords) return osmStaticUrl({ lat: latNum, lng: lngNum, zoom });
    return null;
  })();

  React.useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  const onSearchAddress = async () => {
    if (!address.trim()) return;
    setSearching(true);
    setSearchError(null);
    const res = await geocodeAddress(address.trim());
    setSearching(false);
    if (!res?.ok) {
      const isServiceFailure = res?.reason === 'service';
      setSearchError(t(isServiceFailure ? 'map.error.serviceUnavailable' : 'map.error.geocodingFailed'));
      if (isServiceFailure) {
        if (window.toast) window.toast(t('map.error.serviceUnavailable'));
        setTab('upload');
      }
      return;
    }
    const loc = res.data;
    if (!loc) {
      setSearchError(t('map.error.geocodingFailed'));
      return;
    }
    setLat(String(loc.lat));
    setLng(String(loc.lng));
    if (!label) setLabel(address.trim());
  };

  const handlePreviewError = () => {
    if (previewFailed) return;
    setPreviewFailed(true);
    if (window.toast) window.toast(t('map.error.serviceUnavailable'));
    setTab('upload');
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await window.stCDN.upload(file);
      if (!result.ok) {
        setUploadError(result.error || t('modal.map.uploadFailed'));
        return;
      }
      const dim = await window.stImages.readImageSize(file);
      const saved = await window.stImages.save({
        url: result.url,
        name: file.name || 'map.png',
        folder: t('imagePicker.folder.uploads'),
        mime: file.type || null,
        sizeBytes: file.size || null,
        width: dim.width,
        height: dim.height,
        provider: result.mode || 'local',
        localPath: result.localPath || null,
      });
      if (saved) setSelLibrary(saved);
    } catch (err) {
      setUploadError(err?.message || t('modal.map.uploadUnexpected'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    let result = {};
    if (tab === 'library' && selLibrary) {
      result = {
        imageUrl: selLibrary.url,
        destinationUrl: googleMapsSearchUrl(address, hasCoords ? latNum : null, hasCoords ? lngNum : null),
        label,
        address,
      };
    } else if (tab === 'upload' && selLibrary) {
      result = {
        imageUrl: selLibrary.url,
        destinationUrl: googleMapsSearchUrl(address, hasCoords ? latNum : null, hasCoords ? lngNum : null),
        label,
        address,
      };
    } else {
      // Address or Coordinates tab — use OSM static or custom URL.
      const imageUrl = customUrl || previewUrl || '';
      result = {
        imageUrl,
        destinationUrl: googleMapsSearchUrl(address, hasCoords ? latNum : null, hasCoords ? lngNum : null),
        label,
        address,
      };
      if (hasCoords) {
        result.lat = latNum;
        result.lng = lngNum;
      }
    }
    if (onSave) onSave(result);
    onClose && onClose();
  };

  const canSave = (() => {
    if (tab === 'library' || tab === 'upload') return !!selLibrary;
    if (tab === 'coords') return hasCoords;
    return !!(address.trim() && (hasCoords || customUrl));
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
          maxWidth: 820,
          height: '82vh',
          maxHeight: 680,
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
            <I.folder size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>
              {t('modal.map.title')}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{t('modal.map.subtitle')}</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}>
            <I.x size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '6px 10px 0', borderBottom: '1px solid var(--line)' }}>
          <MapPickerTabButton id="address" label={t('modal.map.tab.address')} icon="search" active={tab === 'address'} onClick={() => setTab('address')} />
          <MapPickerTabButton id="coords" label={t('modal.map.tab.coords')} icon="grid" active={tab === 'coords'} onClick={() => setTab('coords')} />
          <MapPickerTabButton id="upload" label={t('modal.map.tab.upload')} icon="upload" active={tab === 'upload'} onClick={() => setTab('upload')} />
          <MapPickerTabButton id="library" label={t('modal.map.tab.library')} icon="folder" active={tab === 'library'} onClick={() => setTab('library')} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
          {tab === 'address' && (
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500 }}>{t('modal.map.addressLabel')}</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  className="field"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('modal.map.addressPlaceholder')}
                  style={{ flex: 1 }}
                />
                <button className="btn" onClick={onSearchAddress} disabled={searching || !address.trim()}>
                  <I.search size={12} /> {searching ? t('modal.map.searching') : t('modal.map.search')}
                </button>
              </div>
              {searchError && (
                <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: 12 }}>{searchError}</div>
              )}

              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 14, display: 'block' }}>
                {t('modal.map.labelField')}
              </label>
              <input
                className="field"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('modal.map.labelPlaceholder')}
                style={{ marginTop: 6 }}
              />

              {hasCoords && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>{t('modal.map.preview')}</div>
                  <img
                    src={previewUrl}
                    alt={label || address}
                    onError={handlePreviewError}
                    style={{ width: '100%', maxWidth: 600, border: '1px solid var(--line)', borderRadius: 'var(--r-md)', display: 'block' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                    {latNum.toFixed(5)}, {lngNum.toFixed(5)}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'coords' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500 }}>
                    {t('modal.map.lat')}
                  </label>
                  <input className="field" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="40.4168" style={{ marginTop: 6 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500 }}>
                    {t('modal.map.lng')}
                  </label>
                  <input className="field" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-3.7038" style={{ marginTop: 6 }} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500 }}>
                  {t('modal.map.zoom')}: {zoom}
                </label>
                <input type="range" min={2} max={19} value={zoom} onChange={(e) => setZoom(parseInt(e.target.value, 10))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 14, display: 'block' }}>
                {t('modal.map.labelField')}
              </label>
              <input
                className="field"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('modal.map.labelPlaceholder')}
                style={{ marginTop: 6 }}
              />
              {hasCoords && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>{t('modal.map.preview')}</div>
                  <img
                    src={previewUrl}
                    alt={label}
                    onError={handlePreviewError}
                    style={{ width: '100%', maxWidth: 600, border: '1px solid var(--line)', borderRadius: 'var(--r-md)', display: 'block' }}
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'upload' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.55, marginBottom: 12 }}>
                {t('modal.map.uploadHint')}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await uploadFile(file);
                  e.target.value = '';
                }}
              />
              <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <I.upload size={13} /> {uploading ? t('modal.map.uploading') : t('modal.map.uploadBtn')}
              </button>
              {uploadError && <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: 12 }}>{uploadError}</div>}
              {selLibrary && (
                <div style={{ marginTop: 14 }}>
                  <img src={selLibrary.url} alt={selLibrary.name} style={{ maxWidth: 600, width: '100%', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', display: 'block' }} />
                </div>
              )}
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 14, display: 'block' }}>
                {t('modal.map.addressLabel')}
              </label>
              <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('modal.map.addressPlaceholder')} style={{ marginTop: 6 }} />
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 10, display: 'block' }}>
                {t('modal.map.labelField')}
              </label>
              <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('modal.map.labelPlaceholder')} style={{ marginTop: 6 }} />
            </div>
          )}

          {tab === 'library' && (
            <div>
              {library.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
                  {t('modal.map.libraryEmpty')}
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
                {t('modal.map.addressLabel')}
              </label>
              <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('modal.map.addressPlaceholder')} style={{ marginTop: 6 }} />
              <label style={{ fontSize: 11.5, color: 'var(--fg-3)', fontWeight: 500, marginTop: 10, display: 'block' }}>
                {t('modal.map.labelField')}
              </label>
              <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('modal.map.labelPlaceholder')} style={{ marginTop: 6 }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: 11, color: 'var(--fg-3)' }}>{t('modal.map.attribution')}</div>
          <button className="btn ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" disabled={!canSave} onClick={handleSave}>
            <I.check size={13} /> {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MapPickerModal });
