// Library of saved blocks — reusable email sections persisted in SQLite.
// Mirrors the dashboard pattern: sidebar filters + kind categories + papelera,
// card grid with per-card actions, multi-select bulk ops on trash view.

function formatBlockRelative(sqlDate) {
  if (!sqlDate) return '';
  const t = window.stI18n.t;
  const d = new Date(String(sqlDate).replace(' ', 'T') + 'Z');
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return t('common.time.justNow');
  const m = Math.floor(diff / 60000);
  if (m < 60) return t('common.time.minutes', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('common.time.hours', { n: h });
  const dd = Math.floor(h / 24);
  if (dd < 7) return t('common.time.days', { n: dd });
  const w = Math.floor(dd / 7);
  if (w < 4) return t('common.time.weeks', { n: w });
  const mo = Math.floor(dd / 30);
  return t(mo === 1 ? 'common.time.months.one' : 'common.time.months.other', { n: mo });
}

// Categories are now first-class user-editable records stored per workspace
// (see src/lib/block-categories.tsx). Built-in seeds keep their labelKey
// so language switches still update them. User-created categories are
// shown by name and can be dragged to reorder.

// Renders the saved block's section inside a constrained container. Uses
// EB_RENDERERS to paint real block content; any unsupported block type
// degrades to a mono-font placeholder (same fallback as the editor/preview).
function BlockThumb({ section }) {
  if (!section) return null;
  // Delegate to the shared lightweight renderer used by Dashboard cards —
  // same block-type dispatcher, same tiny sizes, section style (bg/text/
  // padding/align/layout) preserved. Fidelity > pixel-perfect: the prior
  // approach scaled the real EB renderers via transform, which clipped
  // content at card size.
  const ST = window.stDocThumb && window.stDocThumb.SectionThumb;
  return ST ? <ST section={section}/> : null;
}

function Library({ onBack, onOpenBlock }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();

  const rawBlocks = window.useBlocks();
  const trashedBlocks = window.useTrashedBlocks();
  const categories = window.useBlockCategories();
  const [filter, setFilter] = React.useState('all'); // all | favorites | trash | uncategorized | kind:<id>
  const [q, setQ] = React.useState('');
  const [view, setView] = React.useState('grid');
  const [selected, setSelected] = React.useState(() => new Set());
  const [categoryModal, setCategoryModal] = React.useState(null); // { mode:'new'|'edit', category? }
  const [dragOverCat, setDragOverCat] = React.useState(null);
  // Reorder DnD: tracks which category is being dragged and the hover
  // target/position. `position` is 'before' or 'after' relative to target.
  const [dragCat, setDragCat] = React.useState(null);
  const [reorderHover, setReorderHover] = React.useState(null); // { id, position }
  // Inline rename — Electron's renderer with contextIsolation doesn't
  // support window.prompt(), so we swap the title for an input when a
  // rename is in progress. Tracks the id being edited + the draft text.
  const [renameTarget, setRenameTarget] = React.useState(null);
  const [renameDraft, setRenameDraft] = React.useState('');

  const inTrash = filter === 'trash';

  const toggleSelect = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clearSelection = () => setSelected((s) => (s.size === 0 ? s : new Set()));
  React.useEffect(() => {
    if (!inTrash || trashedBlocks.length === 0) clearSelection();
  }, [inTrash, trashedBlocks.length]);

  const categoryById = React.useMemo(() => {
    const map = new Map();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const counts = React.useMemo(() => {
    const byKind = {};
    let uncategorized = 0;
    for (const b of rawBlocks) {
      if (b.kind && categoryById.has(b.kind)) {
        byKind[b.kind] = (byKind[b.kind] || 0) + 1;
      } else {
        uncategorized++;
      }
    }
    return {
      all: rawBlocks.length,
      favorites: rawBlocks.filter((b) => b.starred).length,
      trash: trashedBlocks.length,
      uncategorized,
      byKind,
    };
  }, [rawBlocks, trashedBlocks, categoryById]);

  const items = React.useMemo(() => {
    const source = inTrash ? trashedBlocks : rawBlocks;
    const filtered = source.filter((b) => {
      const matchQ = !q.trim() || (b.name || '').toLowerCase().includes(q.toLowerCase());
      if (!matchQ) return false;
      if (inTrash || filter === 'all') return true;
      if (filter === 'favorites') return !!b.starred;
      if (filter === 'uncategorized') return !b.kind || !categoryById.has(b.kind);
      if (filter.startsWith('kind:')) return b.kind === filter.slice(5);
      return true;
    });
    return filtered;
  }, [rawBlocks, trashedBlocks, inTrash, filter, q, categoryById]);

  const kindLabel = (kindId) => {
    const c = categoryById.get(kindId);
    if (c) return window.stBlockCategories.displayName(c);
    return t('library.category.uncategorized');
  };

  const activeLabel = (() => {
    if (filter === 'all') return t('library.filter.all');
    if (filter === 'favorites') return t('library.filter.favorites');
    if (filter === 'trash') return t('library.filter.trash');
    if (filter === 'uncategorized') return t('library.category.uncategorized');
    if (filter.startsWith('kind:')) return kindLabel(filter.slice(5));
    return t('library.filter.all');
  })();

  const totalSource = inTrash ? trashedBlocks.length : rawBlocks.length;
  const countKey = items.length === 1 ? 'library.count.one' : 'library.count.other';
  const countText = t(countKey, { n: items.length })
    + ((q || filter !== 'all') ? ' ' + t('library.countOf', { total: totalSource }) : '');

  const onCreate = async () => {
    const created = await window.stBlocks.create({
      name: t('library.create.defaultName'),
      kind: filter.startsWith('kind:') ? filter.slice(5) : 'bc-custom',
    });
    if (!created) return;
    if (onOpenBlock) {
      onOpenBlock(created);
    } else {
      window.toast && window.toast({
        kind: 'ok',
        title: t('library.toast.created.title'),
        msg: t('library.toast.created.msg'),
      });
    }
  };

  const onRename = (blk) => {
    setRenameTarget(blk.id);
    setRenameDraft(blk.name || '');
  };

  const commitRename = async (blk) => {
    const trimmed = renameDraft.trim();
    setRenameTarget(null);
    if (!trimmed || trimmed === blk.name) return;
    await window.stBlocks.rename(blk.id, trimmed);
  };

  const cancelRename = () => {
    setRenameTarget(null);
    setRenameDraft('');
  };

  const onDelete = async (id) => { await window.stBlocks.remove(id); };
  const onRestore = async (id) => { await window.stBlocks.restore(id); };
  const onPurge = async (blk) => {
    if (!window.confirm(t('library.confirm.purge', { name: blk.name }))) return;
    await window.stBlocks.purge(blk.id);
  };
  const onDuplicate = async (id) => { await window.stBlocks.duplicate(id); };
  const onToggleStar = async (id) => { await window.stBlocks.toggleStar(id); };

  const onEdit = (blk) => {
    if (!blk || inTrash) return;
    if (onOpenBlock) onOpenBlock(blk);
  };

  const onBulkRestore = async () => {
    const ids = Array.from(selected);
    for (const id of ids) await window.stBlocks.restore(id);
    clearSelection();
  };

  const onBulkPurge = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(t('library.confirm.purgeMany', { n: ids.length }))) return;
    for (const id of ids) await window.stBlocks.purge(id);
    clearSelection();
  };

  const onEmptyTrash = async () => {
    if (trashedBlocks.length === 0) return;
    if (!window.confirm(t('library.confirm.emptyTrash', { n: trashedBlocks.length }))) return;
    for (const b of trashedBlocks) await window.stBlocks.purge(b.id);
    clearSelection();
  };

  // Category DnD — two distinct modes distinguished by the MIME type on the
  // dragged payload:
  //   - 'text/x-mc-saved-block': a block is being dragged onto a category →
  //     reassign the block's `kind` to that category's id (or null when
  //     dropping on "Uncategorized").
  //   - 'text/x-mc-block-category': a category chip is being reordered →
  //     splice it into its new position in the categories array.
  const onDeleteCategory = async (c) => {
    const name = window.stBlockCategories.displayName(c);
    if (!window.confirm(t('library.category.deleteConfirm', { name }))) return;
    await window.stBlockCategories.remove(c.id);
    if (filter === `kind:${c.id}`) setFilter('all');
  };

  const dropPropsForCategory = (catId) => ({
    onDragOver: (e) => {
      const types = Array.from(e.dataTransfer.types);
      if (types.includes('text/x-mc-saved-block')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverCat !== catId) setDragOverCat(catId);
        return;
      }
      if (types.includes('text/x-mc-block-category')) {
        // Reorder: compute before/after based on cursor Y against the row midpoint.
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (catId === 'uncategorized' || catId === null) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const position = (e.clientY - rect.top) < rect.height / 2 ? 'before' : 'after';
        if (!reorderHover || reorderHover.id !== catId || reorderHover.position !== position) {
          setReorderHover({ id: catId, position });
        }
      }
    },
    onDragLeave: (e) => {
      if (e.currentTarget.contains(e.relatedTarget)) return;
      setDragOverCat((cur) => (cur === catId ? null : cur));
      setReorderHover((cur) => (cur && cur.id === catId ? null : cur));
    },
    onDrop: async (e) => {
      const blockId = e.dataTransfer.getData('text/x-mc-saved-block');
      const catSrc = e.dataTransfer.getData('text/x-mc-block-category');
      setDragOverCat(null);
      const reorder = reorderHover;
      setReorderHover(null);
      if (blockId) {
        e.preventDefault();
        // catId can be null for the "Uncategorized" drop target.
        await window.stBlocks.setCategory(blockId, catId === 'uncategorized' ? null : catId);
        return;
      }
      if (catSrc && catSrc !== catId && catId !== 'uncategorized' && catId !== null) {
        e.preventDefault();
        const pos = reorder && reorder.id === catId ? reorder.position : 'before';
        window.stBlockCategories.reorder(catSrc, catId, pos);
      }
    },
  });

  return (
    <div className="editor" style={{ flexDirection: 'row' }}>
      <aside className="sidebar">
        <div className="brand">
          <button className="btn ghost sm" onClick={onBack} title={t('library.back')}>
            <I.chevronL size={14} /> {t('library.back')}
          </button>
        </div>
        <nav>
          <div className="nav-label">{t('library.nav.filters')}</div>
          <div className={`nav-item ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            <I.layers size={15} />
            <span>{t('library.filter.all')}</span>
            <span className="count">{counts.all}</span>
          </div>
          <div className={`nav-item ${filter === 'favorites' ? 'active' : ''}`} onClick={() => setFilter('favorites')}>
            <I.star size={15} />
            <span>{t('library.filter.favorites')}</span>
            <span className="count">{counts.favorites}</span>
          </div>
          <div className={`nav-item ${filter === 'trash' ? 'active' : ''}`} onClick={() => setFilter('trash')}>
            <I.trash size={15} />
            <span>{t('library.filter.trash')}</span>
            <span className="count">{counts.trash}</span>
          </div>

          <div className="nav-label">{t('library.nav.categories')}</div>
          {categories.map((c) => (
            <CategoryNavItem
              key={c.id}
              active={filter === `kind:${c.id}`}
              dropOver={dragOverCat === c.id}
              reorderHint={reorderHover && reorderHover.id === c.id ? reorderHover.position : null}
              draggingSelf={dragCat === c.id}
              color={c.color}
              label={window.stBlockCategories.displayName(c)}
              count={counts.byKind[c.id] || 0}
              onClick={() => setFilter(`kind:${c.id}`)}
              dropProps={dropPropsForCategory(c.id)}
              dragProps={{
                draggable: true,
                onDragStart: (e) => {
                  e.dataTransfer.setData('text/x-mc-block-category', c.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDragCat(c.id);
                },
                onDragEnd: () => { setDragCat(null); setReorderHover(null); },
              }}
              actions={(
                <>
                  <button
                    className="btn icon sm ghost"
                    title={t('library.category.edit')}
                    onClick={(e) => { e.stopPropagation(); setCategoryModal({ mode: 'edit', category: c }); }}
                  ><I.edit size={11} /></button>
                  <button
                    className="btn icon sm ghost"
                    title={t('library.category.delete')}
                    onClick={(e) => { e.stopPropagation(); onDeleteCategory(c); }}
                  ><I.trash size={11} /></button>
                </>
              )}
            />
          ))}

          {counts.uncategorized > 0 && (
            <CategoryNavItem
              active={filter === 'uncategorized'}
              dropOver={dragOverCat === 'uncategorized'}
              label={t('library.category.uncategorized')}
              count={counts.uncategorized}
              onClick={() => setFilter('uncategorized')}
              dropProps={dropPropsForCategory('uncategorized')}
            />
          )}

          <button
            className="nav-item"
            onClick={() => setCategoryModal({ mode: 'new' })}
            style={{
              color: 'var(--fg-3)', background: 'transparent', border: 'none',
              width: '100%', marginTop: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px',
              fontSize: 12.5, textAlign: 'left',
            }}
          >
            <I.plus size={12} />
            <span>{t('library.category.new')}</span>
          </button>
        </nav>
      </aside>

      <main className="dash">
        <div className="dash-head">
          <div className="grow">
            <h1>{t('library.title')}</h1>
            <div className="sub">
              {activeLabel} · <span>{countText}</span>
            </div>
          </div>
          <ThemeToggleBtn />
          {!inTrash && (
            <button className="btn primary" onClick={onCreate}>
              <I.plus size={14} /> {t('library.saveNew')}
            </button>
          )}
        </div>

        <div className="dash-toolbar">
          <div className="search">
            <span className="si"><I.search size={14} /></span>
            <input
              placeholder={t('library.search.placeholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="grow" />
          <div className="seg">
            <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>
              <I.grid size={14} />
            </button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
              <I.layers size={14} />
            </button>
          </div>
        </div>

        {inTrash && trashedBlocks.length > 0 && (
          <div className="dash-toolbar" style={{ background: 'var(--surface-2)' }}>
            {selected.size > 0 ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('library.bulk.selected', { n: selected.size })}
                </span>
                <button className="btn ghost sm" onClick={clearSelection}>
                  <I.x size={12} /> {t('library.bulk.clear')}
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => setSelected(new Set(items.map((x) => x.id)))}
                  disabled={selected.size === items.length}
                >
                  {t('library.bulk.selectAll')}
                </button>
                <div className="grow" />
                <button className="btn sm" onClick={onBulkRestore}>
                  <I.undo size={12} /> {t('library.bulk.restore')}
                </button>
                <button
                  className="btn sm"
                  onClick={onBulkPurge}
                  style={{ color: 'var(--danger)', borderColor: 'color-mix(in oklab, var(--danger) 40%, var(--line))' }}
                >
                  <I.trash size={12} /> {t('library.bulk.purge')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn ghost sm"
                  onClick={() => setSelected(new Set(items.map((x) => x.id)))}
                >
                  <I.check size={12} /> {t('library.bulk.selectAll')}
                </button>
                <div className="grow" />
                <button
                  className="btn sm"
                  onClick={onEmptyTrash}
                  style={{ color: 'var(--danger)', borderColor: 'color-mix(in oklab, var(--danger) 40%, var(--line))' }}
                >
                  <I.trash size={12} /> {t('library.action.emptyTrash')}
                </button>
              </>
            )}
          </div>
        )}

        <div className="dash-body">
          {items.length === 0 && (
            <EmptyState
              illustration={q ? 'search' : 'no-blocks'}
              title={
                q ? t('library.empty.search.title', { q })
                : inTrash ? t('library.empty.trash.title')
                : filter === 'favorites' ? t('library.empty.favorites.title')
                : filter === 'all' ? t('library.empty.none.title')
                : t('library.empty.cat.title', { cat: activeLabel })
              }
              msg={
                q ? t('library.empty.search.msg')
                : inTrash ? t('library.empty.trash.msg')
                : filter === 'favorites' ? t('library.empty.favorites.msg')
                : filter === 'all' ? t('library.empty.none.msg')
                : t('library.empty.cat.msg')
              }
              primaryAction={
                q ? { label: t('library.empty.clearSearch'), icon: 'x', onClick: () => setQ('') }
                : inTrash ? null
                : { label: t('library.empty.createNew'), icon: 'plus', onClick: onCreate }
              }
              secondaryAction={
                !q && filter !== 'all' && filter !== 'trash'
                  ? { label: t('library.empty.viewAll'), icon: 'grid', onClick: () => setFilter('all') }
                  : null
              }
              tips={!q && filter === 'all' ? [t('library.tip.available'), t('library.tip.vars')] : []}
            />
          )}

          {items.length > 0 && view === 'grid' && (
            <div className="grid-tpl">
              {items.map((blk) => {
                const isSelected = inTrash && selected.has(blk.id);
                return (
                  <div
                    key={blk.id}
                    className="tpl-card"
                    draggable={!inTrash}
                    onDragStart={(e) => {
                      if (inTrash) return;
                      e.dataTransfer.setData('text/x-mc-saved-block', blk.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={inTrash ? () => toggleSelect(blk.id) : () => onEdit(blk)}
                    style={inTrash ? {
                      cursor: 'pointer',
                      opacity: isSelected ? 1 : 0.85,
                      outline: isSelected ? '2px solid var(--accent)' : undefined,
                      outlineOffset: isSelected ? 2 : undefined,
                    } : { cursor: 'grab' }}
                  >
                    <div className="tpl-thumb">
                      {inTrash ? (
                        <div className="badge" title={t('library.action.select')}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.92)',
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line-2)'}`,
                            display: 'grid', placeItems: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,.12)',
                            transition: 'background 120ms, border-color 120ms',
                          }}>
                            {isSelected && <I.check size={14} style={{ color: '#fff' }} />}
                          </div>
                        </div>
                      ) : blk.starred && (
                        <div className="badge">
                          <div className="chip accent"><I.star size={10} /> {t('library.badge.favorite')}</div>
                        </div>
                      )}
                      <div className="tpl-actions">
                        {inTrash ? (
                          <>
                            <button
                              className="btn icon sm"
                              title={t('library.action.restore')}
                              onClick={(e) => { e.stopPropagation(); onRestore(blk.id); }}
                            ><I.undo size={12} /></button>
                            <button
                              className="btn icon sm"
                              title={t('library.action.purge')}
                              onClick={(e) => { e.stopPropagation(); onPurge(blk); }}
                            ><I.trash size={12} /></button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn icon sm"
                              title={blk.starred ? t('library.action.star.remove') : t('library.action.star.add')}
                              onClick={(e) => { e.stopPropagation(); onToggleStar(blk.id); }}
                            >{blk.starred ? <I.star2 size={12} /> : <I.star size={12} />}</button>
                            <button
                              className="btn icon sm"
                              title={t('library.action.duplicate')}
                              onClick={(e) => { e.stopPropagation(); onDuplicate(blk.id); }}
                            ><I.copy size={12} /></button>
                            <button
                              className="btn icon sm"
                              title={t('library.action.rename')}
                              onClick={(e) => { e.stopPropagation(); onRename(blk); }}
                            ><I.edit size={12} /></button>
                            <button
                              className="btn icon sm"
                              title={t('library.action.trash')}
                              onClick={(e) => { e.stopPropagation(); onDelete(blk.id); }}
                            ><I.trash size={12} /></button>
                          </>
                        )}
                      </div>
                      <BlockThumbLoader id={blk.id} />
                    </div>
                    <div className="tpl-meta">
                      {renameTarget === blk.id ? (
                        <input
                          className="field"
                          autoFocus
                          value={renameDraft}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={() => commitRename(blk)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(blk); }
                            if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                          }}
                          style={{ fontSize: 13, padding: '4px 6px', width: '100%' }}
                        />
                      ) : (
                        <div className="tpl-title">{blk.name}</div>
                      )}
                      <div className="tpl-sub">
                        <span>{kindLabel(blk.kind)}</span>
                        <span className="tpl-dot" />
                        {inTrash
                          ? <span>{t('library.trash.deletedAt', { when: formatBlockRelative(blk.deleted_at) })}</span>
                          : <span>{formatBlockRelative(blk.updated_at)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && view === 'list' && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr 160px 140px 140px',
                padding: '10px 16px',
                borderBottom: '1px solid var(--line)',
                fontSize: 11,
                color: 'var(--fg-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}>
                <span />
                <span>{t('dash.col.name')}</span>
                <span>{t('library.kind.label')}</span>
                <span>{t('dash.col.lastEdit')}</span>
                <span />
              </div>
              {items.map((blk) => {
                const isSelected = inTrash && selected.has(blk.id);
                return (
                  <div
                    key={blk.id}
                    draggable={!inTrash}
                    onDragStart={(e) => {
                      if (inTrash) return;
                      e.dataTransfer.setData('text/x-mc-saved-block', blk.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={inTrash ? () => toggleSelect(blk.id) : () => onEdit(blk)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr 160px 140px 140px',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--line)',
                      alignItems: 'center',
                      cursor: inTrash ? 'pointer' : 'grab',
                      fontSize: 13,
                      opacity: inTrash && !isSelected ? 0.85 : 1,
                      background: isSelected ? 'color-mix(in oklab, var(--accent) 10%, var(--surface))' : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ''; }}
                  >
                    <div>
                      {inTrash ? (
                        <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line-2)'}`,
                          display: 'grid', placeItems: 'center',
                        }}>
                          {isSelected && <I.check size={12} style={{ color: '#fff' }} />}
                        </div>
                      ) : blk.starred && <I.star2 size={14} style={{ color: 'var(--warn)' }} />}
                    </div>
                    <div style={{ fontWeight: 500 }}>
                      {renameTarget === blk.id ? (
                        <input
                          className="field"
                          autoFocus
                          value={renameDraft}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={() => commitRename(blk)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(blk); }
                            if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                          }}
                          style={{ fontSize: 13, padding: '4px 6px', width: '100%' }}
                        />
                      ) : blk.name}
                    </div>
                    <div style={{ color: 'var(--fg-2)' }}>{kindLabel(blk.kind)}</div>
                    <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>
                      {inTrash
                        ? t('library.trash.deletedAt', { when: formatBlockRelative(blk.deleted_at) })
                        : formatBlockRelative(blk.updated_at)}
                    </div>
                    <div
                      style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {inTrash ? (
                        <>
                          <button
                            className="btn icon sm ghost"
                            title={t('library.action.restore')}
                            onClick={() => onRestore(blk.id)}
                          ><I.undo size={13} /></button>
                          <button
                            className="btn icon sm ghost"
                            title={t('library.action.purge')}
                            onClick={() => onPurge(blk)}
                          ><I.trash size={13} /></button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn icon sm ghost"
                            title={blk.starred ? t('library.action.star.remove') : t('library.action.star.add')}
                            onClick={() => onToggleStar(blk.id)}
                          >{blk.starred ? <I.star2 size={13} /> : <I.star size={13} />}</button>
                          <button
                            className="btn icon sm ghost"
                            title={t('library.action.rename')}
                            onClick={() => onRename(blk)}
                          ><I.edit size={13} /></button>
                          <button
                            className="btn icon sm ghost"
                            title={t('library.action.trash')}
                            onClick={() => onDelete(blk.id)}
                          ><I.trash size={13} /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {categoryModal && (
        <BlockCategoryModal
          mode={categoryModal.mode}
          category={categoryModal.category}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </div>
  );
}

// Sidebar row for a saved-block category. Mirrors the image-library
// FolderNavItem shape but adds reorder hints (top/bottom border flash) so
// the user can see where a dragged category will land.
function CategoryNavItem({
  active, dropOver, reorderHint, draggingSelf,
  color, label, count, icon, onClick, dropProps, dragProps, actions,
}) {
  const hasColor = !!color;
  const borderTop = reorderHint === 'before' ? '2px solid var(--accent)' : '2px solid transparent';
  const borderBottom = reorderHint === 'after' ? '2px solid var(--accent)' : '2px solid transparent';
  return (
    <div
      className={`nav-item ${active ? 'active' : ''} ${dropOver ? 'drop-active' : ''}`}
      onClick={onClick}
      {...(dragProps || {})}
      {...(dropProps || {})}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 9px',
        background: active ? 'var(--accent-soft)' : (dropOver ? 'var(--surface-2)' : 'transparent'),
        color: active ? 'var(--accent)' : 'var(--fg-2)',
        borderRadius: 'var(--r-sm)', cursor: 'pointer',
        fontSize: 12.5, textAlign: 'left', marginBottom: 2,
        borderTop, borderBottom,
        opacity: draggingSelf ? 0.4 : 1,
      }}
    >
      {hasColor
        ? <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
        : (icon || <I.layers size={13} />)}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span className="count" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{count}</span>
      {actions && (
        <div className="oc-actions" onClick={(e) => e.stopPropagation()}>{actions}</div>
      )}
    </div>
  );
}

// Lazy-loads the full saved-block doc (with `section`) for the thumbnail.
// The list rows from the SQLite index don't carry the section payload — we
// fetch it per-card on mount. Workspace-scoped; listens for writes so the
// preview refreshes after edits.
function BlockThumbLoader({ id }) {
  const [section, setSection] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const doc = await window.stBlocks.read(id);
      if (alive) setSection(doc?.section || null);
    };
    refresh();
    const h = (e) => {
      if (!e.detail || e.detail.id === id) refresh();
    };
    window.addEventListener('st:block-change', h);
    return () => {
      alive = false;
      window.removeEventListener('st:block-change', h);
    };
  }, [id]);
  return <BlockThumb section={section} />;
}

window.Library = Library;
