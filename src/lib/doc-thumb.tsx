// Lightweight doc thumbnail primitives — shared by Dashboard template cards
// and saved-blocks Library cards. Walks sections + blocks and emits a tiny
// faithful render per block type. All styles inline so themes don't bleed
// into the mini "email".

function thumbHasContent(doc) {
  if (!doc || !Array.isArray(doc.sections)) return false;
  for (const s of doc.sections) {
    const cols = Array.isArray(s?.columns) ? s.columns : [];
    for (const c of cols) {
      if (Array.isArray(c?.blocks) && c.blocks.length > 0) return true;
    }
  }
  return false;
}

// Read canonical content fields tolerating both the nested `data.content.X`
// and the legacy flat `data.X` shapes (see `getContent()` in email-blocks.tsx).
function thumbBlockContent(block) {
  const d = (block && block.data) || {};
  const c = (d && d.content) || {};
  return {
    text:    c.text    ?? d.text    ?? '',
    heading: c.heading ?? d.heading ?? '',
    body:    c.body    ?? d.body    ?? '',
    label:   c.label   ?? d.label   ?? '',
    url:     c.url     ?? d.url     ?? '',
    brand:   c.brand   ?? d.brand   ?? '',
    sub:     c.sub     ?? d.sub     ?? '',
    name:    c.name    ?? d.name    ?? '',
    price:   c.price   ?? d.price   ?? '',
  };
}

function MiniBlock({ block }) {
  const c = thumbBlockContent(block);
  const type = block && block.type;
  const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
  const clamp3 = { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

  if (type === 'heading') {
    const label = c.text || c.heading || 'Título';
    return <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.15, margin: 0, ...clamp2 }}>{label}</div>;
  }
  if (type === 'hero') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {c.heading && <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1, ...clamp2 }}>{c.heading}</div>}
        {c.body && <div style={{ fontSize: 6, opacity: 0.75, lineHeight: 1.4, ...clamp3 }}>{c.body}</div>}
        {!c.heading && !c.body && <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.4 }}>Hero</div>}
      </div>
    );
  }
  if (type === 'text') {
    const label = c.body || c.text || '';
    if (!label) return <div style={{ height: 5, background: 'currentColor', opacity: 0.08, borderRadius: 1 }}/>;
    return <div style={{ fontSize: 6, opacity: 0.75, lineHeight: 1.4, ...clamp3 }}>{label}</div>;
  }
  if (type === 'button') {
    const label = c.label || c.text || 'Botón';
    return (
      <div style={{ display: 'inline-block', background: '#1a1a17', color: '#fff', fontSize: 5, fontWeight: 600, padding: '2px 5px', borderRadius: 2, alignSelf: 'flex-start' }}>
        {label}
      </div>
    );
  }
  if (type === 'image' || type === 'gif') {
    return <div style={{ aspectRatio: '16/9', background: '#e6e3d9', borderRadius: 1 }}/>;
  }
  if (type === 'divider') {
    return <div style={{ height: 1, background: 'currentColor', opacity: 0.15 }}/>;
  }
  if (type === 'spacer') {
    return <div style={{ height: 6 }}/>;
  }
  if (type === 'header') {
    const brand = c.brand || c.text || 'Marca';
    const sub = c.sub || '';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 6, fontWeight: 700, letterSpacing: 0.3, borderBottom: '0.5px solid rgba(0,0,0,0.08)', paddingBottom: 2 }}>
        <span>{brand}</span>
        {sub && <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 5 }}>{sub}</span>}
      </div>
    );
  }
  if (type === 'footer') {
    const label = c.text || c.body || 'Pie de página';
    return (
      <div style={{ fontSize: 5, opacity: 0.6, textAlign: 'center', paddingTop: 3, borderTop: '0.5px solid rgba(0,0,0,0.08)', ...clamp2 }}>
        {label}
      </div>
    );
  }
  if (type === 'product') {
    const name = c.name || 'Producto';
    const price = c.price || '';
    return (
      <div style={{ background: '#f5f3ec', borderRadius: 2, padding: 4 }}>
        <div style={{ aspectRatio: '3/2', background: '#e6e3d9', borderRadius: 1, marginBottom: 3 }}/>
        <div style={{ fontSize: 5, fontWeight: 600, ...clamp2 }}>{name}</div>
        {price && <div style={{ fontSize: 5, opacity: 0.7, marginTop: 1 }}>{price}</div>}
      </div>
    );
  }
  if (type === 'icon') {
    return <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#e6e3d9', margin: '0 auto' }}/>;
  }
  if (type === 'cta') {
    const label = c.label || c.text || 'CTA';
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
        <div style={{ background: '#1a1a17', color: '#fff', fontSize: 5, fontWeight: 600, padding: '2px 6px', borderRadius: 2 }}>{label}</div>
      </div>
    );
  }
  // Unknown / long-tail types — neutral rect labeled with the type so the
  // thumb doesn't collapse and the user can tell *something* is there.
  return (
    <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 1, padding: '4px 5px', fontSize: 4, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {type || ''}
    </div>
  );
}

function MiniSection({ section }) {
  const style = (section && section.style) || {};
  const bg = style.bg || '#fff';
  const text = style.text || '#1a1a17';
  // Section padding scaled ~20%; email padding is usually 20–48px, we want 4–10px.
  const pad = Math.min(10, Math.max(3, Math.round((style.padding != null ? style.padding : 16) * 0.22)));
  const align = style.align || 'left';
  const layout = (section && section.layout) || '1col';
  const cols = (section && section.columns) || [];

  const wrapper = {
    background: bg,
    color: text,
    padding: `${pad}px ${pad + 2}px`,
    textAlign: align,
    flexShrink: 0,
  };

  if (layout === '1col') {
    const blocks = ((cols[0] && cols[0].blocks) || []).slice(0, 4);
    return (
      <div style={wrapper}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {blocks.map((b, i) => <MiniBlock key={(b && b.id) || i} block={b}/>)}
        </div>
      </div>
    );
  }

  const n = layout === '3col' ? 3 : 2;
  const gridCols = layout === '3col' ? '1fr 1fr 1fr' : '1fr 1fr';
  return (
    <div style={{ ...wrapper, display: 'grid', gridTemplateColumns: gridCols, gap: 4 }}>
      {cols.slice(0, n).map((c, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          {(((c && c.blocks) || []).slice(0, 3)).map((b, bi) => <MiniBlock key={(b && b.id) || bi} block={b}/>)}
        </div>
      ))}
    </div>
  );
}

const THUMB_PAPER = {
  background: '#fff', width: '100%', height: '100%',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
  color: '#1a1a17', fontSize: 6, lineHeight: 1.35,
};

// Full-doc thumbnail — used by template cards. Renders up to the first 4
// sections stacked.
function DocThumb({ t }) {
  const sections = ((t && t.doc && t.doc.sections) || []).slice(0, 4);
  return (
    <div style={THUMB_PAPER}>
      {sections.map((s, i) => <MiniSection key={(s && s.id) || i} section={s}/>)}
    </div>
  );
}

// Single-section thumbnail — used by saved-blocks Library cards. A saved
// block is one section wrapped as `{section, ...}`.
function SectionThumb({ section }) {
  if (!section) return null;
  return (
    <div style={THUMB_PAPER}>
      <MiniSection section={section}/>
    </div>
  );
}

Object.assign(window, {
  stDocThumb: {
    hasContent: thumbHasContent,
    blockContent: thumbBlockContent,
    MiniBlock,
    MiniSection,
    DocThumb,
    SectionThumb,
  },
});
