// Email block renderers — consumen data.style, data.spacing y data.content

function escapeHtml(s='') {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Editor-mode render: highlight {{key}} as a clickable variable chip.
const renderVar = (s='') => String(s).replace(/\{\{([^}]+)\}\}/g, '<span class="var">{{$1}}</span>');

// Preview / display mode: substitute {{key}} with the sample value from the
// workspace vars list. Falls back to keeping the literal `{{key}}` if no
// matching var. Both branches escape user content to prevent HTML injection.
function renderForDisplay(s='') {
  const vars = window.__stPreviewVars;
  if (!vars || !Array.isArray(vars) || vars.length === 0) {
    // No preview context: highlight (editor-style).
    return renderVar(s);
  }
  const map = {};
  for (const v of vars) if (v && v.key) map[v.key] = v.sample;
  // Replace each {{key}} with the sample (escaped). Whitespace-tolerant.
  return String(s).replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, key) =>
    map[key] != null ? escapeHtml(String(map[key])) : escapeHtml('{{' + key + '}}')
  );
}

// Inline-editable text. When `editable` is true, the element becomes
// contentEditable and calls `onCommit(newText)` on blur if the text changed.
// When read-only, renders with renderVar so {{variables}} are highlighted.
// Kept uncontrolled during typing (DOM owns the text while focused) to avoid
// cursor jumps from React re-renders.
function Editable({ as='div', value='', placeholder='', editable, onCommit, singleLine, style, className }) {
  const ref = React.useRef(null);
  const Tag = as;

  // When `value` changes externally (e.g. template reload, undo), push it to
  // the DOM — but only if the element is not focused, so we don't wipe the
  // user's in-progress edit.
  React.useEffect(() => {
    if (!editable) return;
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    const target = value || '';
    if (ref.current.innerText !== target) {
      ref.current.innerText = target;
    }
  }, [value, editable]);

  if (!editable) {
    return (
      <Tag
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: renderForDisplay(value || placeholder) }}
      />
    );
  }

  return React.createElement(Tag, {
    ref,
    className,
    style,
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: true,
    'data-eb-editable': true,
    onKeyDown: singleLine ? (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
    } : undefined,
    onBlur: (e) => {
      const txt = e.currentTarget.innerText;
      if (txt !== (value || '')) onCommit && onCommit(txt);
    },
    dangerouslySetInnerHTML: { __html: escapeHtml(value || placeholder || '') },
  });
}

// Helper for renderers: deep-merge a content patch into existing block data.
function mergeContent(data = {}, patch = {}) {
  const out = { ...data };
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = { ...(out[k] || {}), ...v };
    } else {
      out[k] = v;
    }
  }
  return out;
}

const padCss = (sp=[0,0,0,0]) => `${sp[0]||0}px ${sp[1]||0}px ${sp[2]||0}px ${sp[3]||0}px`;
const marginCss = (m=[0,0,0,0]) => `${m[0]||0}px ${m[1]||0}px ${m[2]||0}px ${m[3]||0}px`;

function bwrap(style, spacing, content) {
  // Common wrapper for blocks — applies padding/margin/bg
  return {
    padding: padCss(spacing?.padding),
    margin: marginCss(spacing?.margin),
    background: style?.bg || 'transparent',
    borderRadius: (style?.radius||0)+'px',
    ...(style?.border?.w ? { border: `${style.border.w}px ${style.border.style||'solid'} ${style.border.color||'#000'}` } : {}),
    ...(style?.shadow ? { boxShadow: style.shadow } : {}),
  };
}

const FONT_STACKS = {
  'inter':'Inter, sans-serif',
  'inter-tight':'"Inter Tight", sans-serif',
  'fraunces':'Fraunces, serif',
  'dm-serif':'"DM Serif Display", serif',
  'instrument':'"Instrument Serif", serif',
  'playfair':'"Playfair Display", serif',
  'space-grotesk':'"Space Grotesk", sans-serif',
  'ibm-plex':'"IBM Plex Sans", sans-serif',
  'ibm-plex-mono':'"IBM Plex Mono", monospace',
  'georgia':'Georgia, serif',
  'helvetica':'Helvetica, Arial, sans-serif',
  'system':'-apple-system, system-ui, sans-serif',
};
// Resolve a font id/name to a CSS font-family stack. If the id is one of the
// pre-mapped FONT_STACKS, use that. Otherwise, treat the value as a literal
// font name (works for brand fonts like "Fraunces" — wraps in quotes if it
// contains whitespace).
const fstack = (f) => {
  if (!f) return 'inherit';
  if (FONT_STACKS[f]) return FONT_STACKS[f];
  return /\s/.test(f) ? `"${f}", system-ui, sans-serif` : `${f}, system-ui, sans-serif`;
};

// Backward-compat: old data was flat ({heading, body, text, label, ...}).
// New data nests under .content. This helper merges both with content winning.
function getContent(data = {}) {
  const { style, content, spacing, ...flat } = data;
  return { ...flat, ...(content||{}) };
}

const ImgPH = ({ ratio='3/2', label='Imagen — arrastra o sube', bg, radius }) => (
  <div className="eb-img-ph" style={{aspectRatio:ratio, background:bg||undefined, borderRadius:radius||undefined}}>{label}</div>
);

function EBHeader({ data = {}, onEdit }) {
  const s = data.style || {};
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{
      ...bwrap(s, data.spacing),
      display:'flex',alignItems:'center',
      justifyContent: s.layout==='center'?'center':'space-between',
      gap:12, fontFamily:fstack(s.font),
    }}>
      <Editable as="div" singleLine editable={editable}
        value={c.brand} placeholder="Acme"
        onCommit={(txt)=>onEdit({content:{brand:txt}})}
        style={{fontWeight:700,fontSize:s.logoSize||18,letterSpacing:-0.3,color:s.color||'inherit'}}/>
      {s.layout!=='center' && (
        <Editable as="div" singleLine editable={editable}
          value={c.sub} placeholder="Noviembre 2026"
          onCommit={(txt)=>onEdit({content:{sub:txt}})}
          style={{fontSize:12,opacity:0.6,fontFamily:'var(--font-mono)',color:s.subColor||'inherit'}}/>
      )}
    </div>
  );
}

function EBHero({ data = {}, onEdit }) {
  const s = data.style || {};
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{...bwrap(s, data.spacing), textAlign:s.align||'inherit', fontFamily:fstack(s.font)}}>
      <Editable as="h1" singleLine editable={editable}
        value={c.heading} placeholder="Tu mensaje más importante aquí"
        onCommit={(txt)=>onEdit({content:{heading:txt}})}
        style={{
          fontSize:s.titleSize||30,lineHeight:1.15,letterSpacing:-0.5,
          fontWeight:s.titleWeight||600,margin:'0 0 12px',color:s.titleColor||'inherit',
        }}/>
      <Editable as="p" editable={editable}
        value={c.body} placeholder="Una línea de apoyo que invita a seguir leyendo."
        onCommit={(txt)=>onEdit({content:{body:txt}})}
        style={{
          fontSize:s.bodySize||15,lineHeight:1.55,margin:0,opacity:0.82,
          color:s.bodyColor||'inherit',
        }}/>
    </div>
  );
}

function EBImage({ data = {} }) {
  const s = data.style || {};
  const c = getContent(data);
  const align = s.align || 'center';
  const width = s.width || 100; // percent
  const hasSrc = !!c.src;
  return (
    <div style={{...bwrap(s, data.spacing), textAlign:align}}>
      <div style={{display:'inline-block',width:`${width}%`,maxWidth:'100%'}}>
        {hasSrc ? (
          <img
            src={c.src}
            alt={c.alt || ''}
            style={{
              display:'block',width:'100%',height:'auto',
              aspectRatio: s.ratio || 'auto',
              objectFit: 'cover',
              borderRadius: s.radius || 0,
            }}
          />
        ) : (
          <ImgPH ratio={s.ratio||'2/1'} label={c.alt || 'Haz click para elegir una imagen'} radius={s.radius}/>
        )}
      </div>
    </div>
  );
}

function EBHeading({ data = {}, onEdit }) {
  const s = data.style || {};
  const c = getContent(data);
  const Tag = `h${s.level||2}`;
  const sizes = { 1:32, 2:24, 3:20, 4:17, 5:15, 6:13 };
  const editable = !!onEdit;
  const style = {
    ...bwrap(s, data.spacing),
    fontSize:s.size || sizes[s.level||2],
    lineHeight:s.lh||1.2,
    letterSpacing:s.tracking!=null?`${s.tracking}px`:-0.3,
    fontWeight:s.weight||600,
    color:s.color||'inherit',
    textAlign:s.align||'inherit',
    fontFamily:fstack(s.font),
    margin:0,
  };
  return (
    <Editable as={Tag} singleLine editable={editable}
      value={c.text} placeholder="Un título"
      onCommit={(txt)=>onEdit({content:{text:txt}})}
      style={style}/>
  );
}

function EBText({ data = {}, onEdit }) {
  const s = data.style || {};
  const c = getContent(data);
  const editable = !!onEdit;
  const style = {
    ...bwrap(s, data.spacing),
    fontSize:s.size||14,
    lineHeight:s.lh||1.55,
    letterSpacing:s.tracking!=null?`${s.tracking}px`:undefined,
    color:s.color||'inherit',
    textAlign:s.align||'inherit',
    fontFamily:fstack(s.font),
    fontWeight:s.weight||400,
    fontStyle:s.italic?'italic':'normal',
    textDecoration:s.underline?'underline':'none',
    margin:0,
  };
  return (
    <Editable as="p" editable={editable}
      value={c.body} placeholder="Un párrafo simple. Usa {{variables}} para personalizar."
      onCommit={(txt)=>onEdit({content:{body:txt}})}
      style={style}/>
  );
}

function EBButton({ data = {}, onEdit }) {
  const s = data.style || {};
  const c = getContent(data);
  const fullWidth = s.width==='full';
  const editable = !!onEdit;
  const btnStyle = {
    display: fullWidth?'block':'inline-block',
    padding:`${s.padY||12}px ${s.padX||22}px`,
    background:s.bg||'#1a1a17',
    color:s.color||'#fff',
    fontWeight:s.weight||500,
    borderRadius:s.radius!=null?s.radius:4,
    textDecoration:'none',
    fontSize:s.size||14,
    fontFamily:fstack(s.font),
    border: s.borderW ? `${s.borderW}px solid ${s.borderColor||'#000'}` : 'none',
    boxShadow: s.shadow || 'none',
    width: fullWidth?'100%':'auto',
    textAlign:'center',
  };
  return (
    <div style={{...bwrap({bg:s.bgOuter}, data.spacing),textAlign:s.align||'center'}}>
      {editable ? (
        <Editable as="span" singleLine editable
          value={c.label} placeholder="Llámame a la acción"
          onCommit={(txt)=>onEdit({content:{label:txt}})}
          style={btnStyle}/>
      ) : (
        <a href={c.url||'#'} onClick={e=>e.preventDefault()} style={btnStyle}>
          {c.label || 'Llámame a la acción'}
        </a>
      )}
    </div>
  );
}

function EBDivider({ data = {} }) {
  const s = data.style || {};
  return (
    <div style={{padding:padCss(data.spacing?.padding),textAlign:s.align||'center'}}>
      <div style={{
        display:'inline-block',
        width:`${s.width||100}%`,
        borderTop:`${s.thickness||1}px ${s.style||'solid'} ${s.color||'currentColor'}`,
        opacity:s.color?1:0.15,
      }}/>
    </div>
  );
}

function EBSpacer({ data={} }) {
  const s = data.style || {};
  return <div style={{height:s.h || data.h || 24, background:s.bg||'transparent'}}/>;
}

function EBIcon({ data = {} }) {
  const s = data.style || {};
  const c = getContent(data);
  const mode = s.mode || 'icon';
  const size = s.size || 32;
  return (
    <div style={{...bwrap(s, data.spacing),
      display:'flex',alignItems:'center',
      justifyContent:s.align==='left'?'flex-start':s.align==='right'?'flex-end':'center',
      gap:s.gap!=null?s.gap:10,
    }}>
      {(mode==='icon' || mode==='icon-text') && (
        <span style={{fontSize:size,lineHeight:1,color:s.color||'inherit'}}>{c.emoji || '✨'}</span>
      )}
      {(mode==='text' || mode==='icon-text') && (
        <span style={{
          fontSize:s.textSize||14,
          fontWeight:s.textWeight||500,
          fontFamily:fstack(s.font),
          color:s.textColor||'inherit',
        }}>{c.text || 'Con emoji'}</span>
      )}
    </div>
  );
}

function EBProduct({ data={}, onEdit }) {
  const s = data.style || {};
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{...bwrap(s, data.spacing),fontFamily:fstack(s.font)}}>
      <ImgPH ratio="1/1" label={c.name || 'Producto'} radius={s.radius}/>
      <Editable as="div" singleLine editable={editable}
        value={c.name} placeholder="Producto"
        onCommit={(txt)=>onEdit({content:{name:txt}})}
        style={{padding:'10px 0 0',fontSize:s.nameSize||13,fontWeight:500,color:s.nameColor||'inherit'}}/>
      <Editable as="div" singleLine editable={editable}
        value={c.price} placeholder="$0 MXN"
        onCommit={(txt)=>onEdit({content:{price:txt}})}
        style={{fontSize:12,opacity:0.7,fontFamily:'var(--font-mono)',color:s.priceColor||'inherit'}}/>
    </div>
  );
}

function EBFooter({ data = {}, onEdit }) {
  const s = data.style || {};
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{...bwrap(s, data.spacing),fontSize:s.size||12,lineHeight:1.6,textAlign:s.align||'inherit',fontFamily:fstack(s.font),color:s.color||'inherit'}}>
      <Editable as="div" editable={editable}
        value={c.company} placeholder="Acme · Av. Reforma 222, CDMX"
        onCommit={(txt)=>onEdit({content:{company:txt}})}
        style={{marginBottom:6,fontWeight:500}}/>
      <Editable as="div" editable={editable}
        value={c.notice} placeholder="Recibes este correo porque te suscribiste"
        onCommit={(txt)=>onEdit({content:{notice:txt}})}
        style={{opacity:0.8}}/>
    </div>
  );
}

function EBSocial({ data = {} }) {
  const s = data.style || {};
  const c = getContent(data);
  const active = c.active || ['f','t','i','in'];
  return (
    <div style={{...bwrap(s, data.spacing),display:'flex',gap:s.gap||12,justifyContent:s.align==='left'?'flex-start':s.align==='right'?'flex-end':'center',padding:padCss(data.spacing?.padding)}}>
      {active.map(l => (
        <div key={l} style={{
          width:s.size||28,height:s.size||28,
          borderRadius: s.shape==='square'?4:'50%',
          background:s.color||'currentColor',
          opacity:0.85,display:'grid',placeItems:'center',
          fontSize:11,fontWeight:600,
        }}>
          <span style={{color:'#fff',mixBlendMode:'difference'}}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function EBHtml({ data = {} }) {
  const s = data.style || {};
  const c = getContent(data);
  const code = c.code || '<!-- Pega aquí tu HTML a la medida -->\n<div style="padding:20px;text-align:center;">\n  <strong>HTML personalizado</strong>\n</div>';
  return (
    <div style={{...bwrap(s, data.spacing)}}>
      <div style={{
        border:'1px dashed color-mix(in oklab, currentColor 30%, transparent)',
        borderRadius:6, padding:'10px 12px',
        background:'color-mix(in oklab, currentColor 4%, transparent)',
        fontFamily:'var(--font-mono)', fontSize:11, lineHeight:1.55,
        color:'inherit', opacity:0.85,
        whiteSpace:'pre-wrap', overflow:'hidden', maxHeight:140,
      }}>
        <div style={{fontSize:10, opacity:0.6, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em'}}>HTML a la medida</div>
        {code}
      </div>
    </div>
  );
}

const EB_RENDERERS = {
  header: EBHeader,
  hero: EBHero,
  image: EBImage,
  heading: EBHeading,
  text: EBText,
  button: EBButton,
  divider: EBDivider,
  spacer: EBSpacer,
  icon: EBIcon,
  product: EBProduct,
  footer: EBFooter,
  social: EBSocial,
  html: EBHtml,
};

window.EB_RENDERERS = EB_RENDERERS;
window.renderVar = renderVar;
window.FONT_STACKS = FONT_STACKS;
