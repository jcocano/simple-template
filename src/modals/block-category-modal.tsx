// Create / edit a saved-block category. Structural twin of FolderModal in
// image-library, kept separate because the two flows are likely to diverge
// (block categories will eventually grow a default-preset picker; folders
// won't). Same palette source, same visual shape.

function BlockCategoryModal({ mode, category, onClose, onCreated }) {
  const t = window.stI18n.t;
  const palette = window.stOccasions?.PALETTE || [{ value: '#0F766E' }];
  const initialName = category
    ? (category.labelKey ? (window.stI18n?.t?.(category.labelKey) || category.name || '') : (category.name || ''))
    : '';
  const [name, setName] = React.useState(initialName);
  const [color, setColor] = React.useState(category?.color || palette[0].value);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (mode === 'edit' && category) {
      window.stBlockCategories.update(category.id, { name: trimmed, color });
      onClose();
    } else {
      const created = window.stBlockCategories.add({ name: trimmed, color });
      await onCreated?.(created);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: color,
            display: 'grid', placeItems: 'center', transition: 'background 120ms',
          }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,.82)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3>{mode === 'edit' ? t('library.newCategory.title.edit') : t('library.newCategory.title.new')}</h3>
            <div className="sub">{t('library.newCategory.sub')}</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={15} /></button>
        </div>
        <div className="modal-body">
          <div className="prop-label" style={{ marginBottom: 6 }}>{t('library.newCategory.nameLabel')}</div>
          <input
            ref={inputRef}
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onClose();
            }}
            placeholder={t('library.newCategory.namePlaceholder')}
          />
          <div className="prop-label" style={{ marginTop: 16, marginBottom: 8 }}>{t('library.newCategory.colorLabel')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8 }}>
            {palette.map((p) => {
              const on = color === p.value;
              return (
                <button
                  key={p.id || p.value}
                  onClick={() => setColor(p.value)}
                  title={p.name}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: p.value,
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    outline: on ? '2px solid var(--fg)' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {on && (
                    <I.check
                      size={12}
                      style={{ color: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t('library.newCategory.cancel')}</button>
          <button className="btn primary" onClick={submit} disabled={!name.trim()}>
            {mode === 'edit' ? t('library.newCategory.save') : t('library.newCategory.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BlockCategoryModal });
