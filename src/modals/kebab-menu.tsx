// Generic reusable kebab / action popover. Closes on outside mousedown + Escape.
// Items with `destructive:true` render in warn color.
//
// API:
//   <KebabMenu
//     menu={{ x, y, items: [{ id, label, icon?, onClick, destructive? }] }}
//     onClose={...}
//   />

function KebabMenu({ menu, onClose }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!menu) return null;

  const top = Math.min(menu.y, window.innerHeight - 240);
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - 232));
  const style = {
    position: 'fixed',
    top,
    left,
    width: 220,
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--r-md)',
    boxShadow: '0 12px 32px rgba(0,0,0,.18)',
    padding: 6,
    zIndex: 1000,
  };

  return (
    <div ref={ref} style={style}>
      {menu.items.map((it) => {
        const Ico = it.icon;
        return (
          <button
            key={it.id}
            className="btn ghost sm"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              gap: 8,
              color: it.destructive ? 'var(--warn)' : undefined,
            }}
            onClick={() => { onClose(); setTimeout(() => it.onClick(), 0); }}
          >
            {Ico ? <Ico size={12}/> : null}
            <span style={{flex:1, textAlign:'left'}}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { KebabMenu });
