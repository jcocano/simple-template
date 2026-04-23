// Email block renderers — consumen data.style, data.spacing y data.content

import QRCode from "qrcode";

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

// Resolve effective style for this block on the given device.
// Shortcut used by every block renderer to apply data.mobile overrides.
function resolveBlockStyle(data = {}, device) {
  const rs = window.resolveStyle || ((b) => b || {});
  return rs(data.style, data.mobile, device);
}
function resolveBlockSpacing(data = {}, device) {
  const rs = window.resolveStyle || ((b) => b || {});
  return rs(data.spacing, data.mobileSpacing, device);
}

// Hidden-block placeholder shown inside the editor when a block is hidden on
// the currently previewed device. The user can still select it (click-through
// is handled by the parent wrapper).
function HiddenBlockGhost({ device, onEdit }) {
  if (!onEdit) return null; // read-only preview: render nothing
  const t = window.stI18n?.t || ((k, p, f) => f || k);
  const label = device === 'mobile'
    ? t('blockProps.badge.hiddenOn', {device: t('blockProps.hideOn.mobile')}, 'Hidden on mobile')
    : t('blockProps.badge.hiddenOn', {device: t('blockProps.hideOn.desktop')}, 'Hidden on desktop');
  return (
    <div style={{
      padding:'12px 14px',
      border:'1px dashed color-mix(in oklab, currentColor 30%, transparent)',
      borderRadius:6,
      background:'color-mix(in oklab, currentColor 3%, transparent)',
      fontFamily:'var(--font-mono)', fontSize:11, textAlign:'center',
      color:'var(--fg-3)', opacity:0.75,
    }}>{label}</div>
  );
}
window.HiddenBlockGhost = HiddenBlockGhost;

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

function EBHeader({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{
      ...bwrap(s, sp),
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

function EBHero({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{...bwrap(s, sp), textAlign:s.align||'inherit', fontFamily:fstack(s.font)}}>
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

function EBImage({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const align = s.align || 'center';
  const width = s.width || 100; // percent
  const hasSrc = !!c.src;
  return (
    <div style={{...bwrap(s, sp), textAlign:align}}>
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
          <ImgPH ratio={s.ratio||'2/1'} label={c.alt || (window.stI18n?.t?.('eb.image.placeholder') || 'Click to pick an image')} radius={s.radius}/>
        )}
      </div>
    </div>
  );
}

function EBHeading({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const Tag = `h${s.level||2}`;
  const sizes = { 1:32, 2:24, 3:20, 4:17, 5:15, 6:13 };
  const editable = !!onEdit;
  const style = {
    ...bwrap(s, sp),
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

function EBText({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const editable = !!onEdit;
  const style = {
    ...bwrap(s, sp),
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

function EBButton({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
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
    <div style={{...bwrap({bg:s.bgOuter}, sp),textAlign:s.align||'center'}}>
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

function EBDivider({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  return (
    <div style={{padding:padCss(sp?.padding),textAlign:s.align||'center'}}>
      <div style={{
        display:'inline-block',
        width:`${s.width||100}%`,
        borderTop:`${s.thickness||1}px ${s.style||'solid'} ${s.color||'currentColor'}`,
        opacity:s.color?1:0.15,
      }}/>
    </div>
  );
}

function EBSpacer({ data={}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  return <div style={{height:s.h || data.h || 24, background:s.bg||'transparent'}}/>;
}

function EBIcon({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const mode = s.mode || 'icon';
  const size = s.size || 32;
  return (
    <div style={{...bwrap(s, sp),
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

function EBProduct({ data={}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{...bwrap(s, sp),fontFamily:fstack(s.font)}}>
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

function EBFooter({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const editable = !!onEdit;
  return (
    <div style={{...bwrap(s, sp),fontSize:s.size||12,lineHeight:1.6,textAlign:s.align||'inherit',fontFamily:fstack(s.font),color:s.color||'inherit'}}>
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

function EBSocial({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const active = c.active || ['f','t','i','in'];
  return (
    <div style={{...bwrap(s, sp),display:'flex',gap:s.gap||12,justifyContent:s.align==='left'?'flex-start':s.align==='right'?'flex-end':'center',padding:padCss(sp?.padding)}}>
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

function EBHtml({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const code = c.code || '<!-- Pega aquí tu HTML a la medida -->\n<div style="padding:20px;text-align:center;">\n  <strong>HTML personalizado</strong>\n</div>';
  return (
    <div style={{...bwrap(s, sp)}}>
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

// ═══════════════════════════════════════════════════════════
// E1 · Media email-safe blocks
// ═══════════════════════════════════════════════════════════

// Video — thumb + play overlay + link. No iframe (email-safe).
// Auto-detecta YouTube/Vimeo; Vimeo fetch-ea OEmbed una sola vez.
const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
function parseVideoUrl(url='') {
  const yt = String(url).match(YT_RE);
  if (yt) return { provider:'youtube', id:yt[1],
    autoThumb: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` };
  const vm = String(url).match(VIMEO_RE);
  if (vm) return { provider:'vimeo', id:vm[1], autoThumb:null };
  return { provider:'custom', id:null, autoThumb:null };
}
window.parseVideoUrl = parseVideoUrl;

function EBVideo({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const info = parseVideoUrl(c.videoUrl);
  const [vimeoThumb, setVimeoThumb] = React.useState(null);
  React.useEffect(() => {
    if (info.provider !== 'vimeo' || c.thumbnail) return;
    if (!c.videoUrl) return;
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(c.videoUrl)}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j && j.thumbnail_url) setVimeoThumb(j.thumbnail_url); })
      .catch(()=>{});
  }, [c.videoUrl, info.provider, c.thumbnail]);
  const thumb = c.thumbnail || info.autoThumb || vimeoThumb;
  const width = s.width || 100;
  const align = s.align || 'center';
  const playColor = s.playColor || '#ffffff';
  const playBg = s.playBg || 'rgba(0,0,0,0.55)';
  const radius = s.radius || 0;
  const url = c.url || c.videoUrl || '#';
  return (
    <div style={{...bwrap(s, sp), textAlign: align}}>
      <a href={url} target="_blank" rel="noopener noreferrer"
         onClick={(e)=>e.preventDefault()}
         style={{display:'inline-block',width:`${width}%`,maxWidth:'100%',
                 position:'relative',textDecoration:'none',lineHeight:0}}>
        {thumb ? (
          <img src={thumb} alt={c.caption || c.alt || ''}
            style={{display:'block',width:'100%',height:'auto',
                    borderRadius: radius, aspectRatio:'16/9', objectFit:'cover'}}/>
        ) : (
          <ImgPH ratio="16/9"
            label={c.videoUrl
              ? (window.stI18n?.t?.('eb.video.loadingThumb') || 'Loading thumbnail…')
              : (window.stI18n?.t?.('eb.video.noUrl') || 'Paste a YouTube or Vimeo URL')}
            radius={radius}/>
        )}
        <span style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width: s.playSize||64, height: s.playSize||64, borderRadius:'50%',
          background: playBg, display:'grid', placeItems:'center',
          pointerEvents:'none',
        }}>
          <span style={{
            width:0, height:0, marginLeft: Math.round((s.playSize||64)*0.08),
            borderTop: `${Math.round((s.playSize||64)*0.22)}px solid transparent`,
            borderBottom: `${Math.round((s.playSize||64)*0.22)}px solid transparent`,
            borderLeft: `${Math.round((s.playSize||64)*0.35)}px solid ${playColor}`,
          }}/>
        </span>
      </a>
      {c.caption && (
        <div style={{fontSize:s.captionSize||12, color:s.captionColor||'var(--fg-3)',
                     marginTop:6, fontFamily:fstack(s.font), lineHeight:1.4}}>
          {c.caption}
        </div>
      )}
    </div>
  );
}

// GIF — image variant. Funciona nativo en email (Outlook desktop muestra 1er frame).
function EBGif({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const width = s.width || 100;
  const align = s.align || 'center';
  const hasSrc = !!c.src;
  const img = hasSrc ? (
    <img src={c.src} alt={c.alt||''}
      style={{display:'block',width:'100%',height:'auto',
              borderRadius: s.radius||0}}/>
  ) : null;
  return (
    <div style={{...bwrap(s, sp), textAlign: align}}>
      <div style={{display:'inline-block',width:`${width}%`,maxWidth:'100%'}}>
        {hasSrc
          ? (c.url
              ? <a href={c.url} onClick={e=>e.preventDefault()}
                   style={{display:'block',lineHeight:0}}>{img}</a>
              : img)
          : <ImgPH ratio={s.ratio||'16/9'}
              label={window.stI18n?.t?.('eb.gif.placeholder') || 'Animated GIF — pick from library'}
              radius={s.radius}/>}
      </div>
    </div>
  );
}

// QR — client-side SVG generation via qrcode lib.
function EBQR({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const content = c.qrContent || '';
  const size = s.size || 180;
  const fg = s.fg || '#000000';
  const bg = s.bg || '#ffffff';
  const level = s.level || 'M';
  const align = s.align || 'center';
  const [svg, setSvg] = React.useState('');
  React.useEffect(() => {
    if (!content) {
      setSvg('');
      if (onEdit && c.dataUrl) onEdit({ content: { dataUrl: undefined } });
      return;
    }
    QRCode.toString(String(content), {
      type:'svg',
      color:{ dark: fg, light: bg },
      errorCorrectionLevel: level,
      margin: 1,
    }, (err, str) => {
      if (err) { setSvg(''); return; }
      setSvg(str);
    });
    QRCode.toDataURL(String(content), {
      color:{ dark: fg, light: bg },
      errorCorrectionLevel: level,
      margin: 1,
    }, (err, url) => {
      if (err || !onEdit) return;
      if (url && url !== c.dataUrl) onEdit({ content: { dataUrl: url } });
    });
  }, [content, fg, bg, level, onEdit, c.dataUrl]);
  return (
    <div style={{...bwrap(s, sp), textAlign: align}}>
      <div style={{display:'inline-block',width:size,height:size,
                   background:bg,borderRadius:s.radius||0,overflow:'hidden',
                   lineHeight:0}}>
        {content && svg ? (
          <div style={{width:'100%',height:'100%'}}
            dangerouslySetInnerHTML={{__html: svg}}/>
        ) : (
          <div style={{width:'100%',height:'100%',display:'grid',placeItems:'center',
                       color:'var(--fg-3)',fontSize:11,textAlign:'center',padding:12,
                       lineHeight:1.4}}>
            {window.stI18n?.t?.('eb.qr.placeholder') || 'Enter content to generate QR'}
          </div>
        )}
      </div>
      {c.caption && (
        <div style={{fontSize:s.captionSize||12, color:s.captionColor||'var(--fg-3)',
                     marginTop:8, fontFamily:fstack(s.font), lineHeight:1.4}}>
          {c.caption}
        </div>
      )}
    </div>
  );
}

// Countdown (mode A) — texto computado (live preview en editor; export lo congela).
function defaultCountdownLabels(lang) {
  const all = {
    en:{ template:'{days} days left',      singular:'1 day left',        zero:'Today is the day', expired:'Expired' },
    es:{ template:'Faltan {days} días',    singular:'Falta 1 día',       zero:'¡Hoy es el día!',  expired:'Expirado' },
    pt:{ template:'Faltam {days} dias',    singular:'Falta 1 dia',       zero:'Hoje é o dia!',    expired:'Expirado' },
    fr:{ template:'Plus que {days} jours', singular:"Plus qu'un jour",   zero:"C'est aujourd'hui !", expired:'Terminé' },
    ja:{ template:'あと{days}日',           singular:'あと1日',            zero:'本日がその日です',   expired:'終了' },
    zh:{ template:'还剩 {days} 天',         singular:'还剩 1 天',          zero:'今天就是这一天',     expired:'已结束' },
  };
  return all[lang] || all.en;
}
function resolveCountdownLabel(days, labels) {
  if (days == null || isNaN(days)) return (labels.template||'').replace('{days}','—');
  if (days < 0) return labels.expired || '';
  if (days === 0) return labels.zero || (labels.template||'').replace('{days}','0');
  if (days === 1) return labels.singular || (labels.template||'').replace('{days}','1');
  return (labels.template||'').replace('{days}', String(days));
}
function daysUntil(targetIso, nowIso) {
  if (!targetIso) return null;
  const now = nowIso ? new Date(nowIso) : new Date();
  const target = new Date(targetIso);
  if (isNaN(target.getTime())) return null;
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (1000*60*60*24));
}
window.resolveCountdownLabel = resolveCountdownLabel;
window.daysUntil = daysUntil;
window.defaultCountdownLabels = defaultCountdownLabels;

// Utility: extract host from a URL (for user-facing banners).
function hostFromUrl(u='') {
  try { return new URL(u).host; } catch { return ''; }
}
window.hostFromUrl = hostFromUrl;

function EBCountdown({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const mode = c.mode || 'static';

  // Mode B (live) — external image as countdown. Email-safe: just <img>.
  if (mode === 'live') {
    const width = c.width || 600;
    const height = c.height || 150;
    const align = s.align || 'center';
    const img = c.imageUrl ? (
      <img src={c.imageUrl}
        alt={c.alt || c.fallbackText || ''}
        width={width} height={height}
        style={{display:'block', maxWidth:'100%', height:'auto',
                borderRadius: s.radius || 0}}/>
    ) : (
      <ImgPH ratio={`${width}/${height}`}
        label={window.stI18n?.t?.('eb.countdown.livePlaceholder') || 'Configure live timer'}
        radius={s.radius}/>
    );
    return (
      <div style={{...bwrap(s, sp), textAlign: align}}>
        <div style={{display:'inline-block', maxWidth:'100%', lineHeight:0}}>
          {c.imageUrl && c.linkUrl
            ? <a href={c.linkUrl} onClick={e=>e.preventDefault()}
                 style={{display:'block', lineHeight:0}}>{img}</a>
            : img}
        </div>
      </div>
    );
  }

  // Mode A (static) — the original frozen-text countdown.
  const lang = (window.stI18n && window.stI18n.getLang) ? window.stI18n.getLang() : 'en';
  const defs = defaultCountdownLabels(lang);
  const labels = {
    template: c.template || defs.template,
    singular: c.singular || defs.singular,
    zero:     c.zero     || defs.zero,
    expired:  c.expired  || defs.expired,
  };
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(n => (n+1)%1e6), 60*1000);
    return () => clearInterval(id);
  }, []);
  const days = daysUntil(c.targetDate);
  const text = c.targetDate
    ? resolveCountdownLabel(days, labels)
    : (labels.template || '').replace('{days}','—');
  return (
    <div style={{
      ...bwrap(s, sp),
      textAlign: s.align||'center',
      fontFamily: fstack(s.font),
      fontSize: s.size||28,
      fontWeight: s.weight||600,
      color: s.color||'inherit',
      lineHeight: 1.2,
      letterSpacing: s.tracking!=null?`${s.tracking}px`:undefined,
    }}>
      <div>{text}</div>
      {!c.targetDate && (
        <div style={{fontSize:11, color:'var(--fg-3)', marginTop:8, fontWeight:400,
                     fontStyle:'italic', letterSpacing:0}}>
          {window.stI18n?.t?.('eb.countdown.setDateHint') || 'Set a target date in the right panel'}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// E2 · Content composites — testimonial, signature
// ═══════════════════════════════════════════════════════════

// Star rating (SVG filled/outline). Email-safe: only inline SVG, no JS.
function EBStars({ value=0, max=5, size=16, color='#f5a623' }) {
  const v = Math.max(0, Math.min(max, parseInt(value) || 0));
  if (v <= 0) return null;
  return (
    <div style={{display:'inline-flex',gap:2,color,verticalAlign:'middle'}}>
      {Array.from({length:max}).map((_,i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i<v?'currentColor':'none'} stroke="currentColor" strokeWidth={2}
          style={{display:'block'}}>
          <path d="m12 2 3 7 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.8l1.8-7.3L1.5 9.6 9 9l3-7Z"/>
        </svg>
      ))}
    </div>
  );
}

// Avatar (img or initial). Email-safe.
function EBAvatar({ src, name='', size=56, shape='circle', radius=6 }) {
  const style = {
    width:size, height:size,
    borderRadius: shape==='square'?radius:'50%',
    objectFit:'cover', display:'block',
  };
  if (src) return <img src={src} alt={name} style={style}/>;
  return (
    <div style={{...style, background:'color-mix(in oklab, currentColor 10%, transparent)',
                 display:'grid', placeItems:'center', color:'currentColor', opacity:0.7,
                 fontSize: Math.round(size*0.35), fontWeight:600}}>
      {(name||'?').charAt(0).toUpperCase()}
    </div>
  );
}

function EBTestimonial({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const editable = !!onEdit;
  const align = s.align || 'center';
  const rating = parseInt(c.rating) || 0;
  const isCard = s.layout === 'card';
  return (
    <div style={{
      ...bwrap(s, sp),
      textAlign: align,
      fontFamily: fstack(s.font),
      color: s.color || 'inherit',
      ...(isCard ? {
        border:`1px solid ${s.borderColor||'color-mix(in oklab, currentColor 15%, transparent)'}`,
        borderRadius: s.radius!=null?s.radius:12,
        padding: s.cardPadding!=null?s.cardPadding:24,
      }:{}),
    }}>
      {rating>0 && (
        <div style={{marginBottom:10}}>
          <EBStars value={rating} size={s.ratingSize||16} color={s.ratingColor||'#f5a623'}/>
        </div>
      )}
      <Editable as="blockquote" editable={editable}
        value={c.quote}
        placeholder={window.stI18n?.t?.('eb.testimonial.quotePlaceholder') || '"This product changed my life."'}
        onCommit={(txt)=>onEdit({content:{quote:txt}})}
        style={{
          fontSize:s.quoteSize||18,
          fontWeight:s.quoteWeight||400,
          fontStyle: s.quoteItalic?'italic':'normal',
          color:s.quoteColor||'inherit',
          lineHeight:1.5,
          margin:0,
          padding:0,
        }}/>
      {(c.name || c.role || c.company || c.avatar) && (
        <div style={{
          marginTop: 16,
          display:'inline-flex',
          alignItems:'center',
          gap: 12,
          textAlign:'left',
        }}>
          <EBAvatar src={c.avatar} name={c.name}
            size={s.avatarSize||44}
            shape={s.avatarShape||'circle'}
            radius={s.avatarRadius||6}/>
          <div>
            <Editable as="div" singleLine editable={editable}
              value={c.name} placeholder={window.stI18n?.t?.('eb.testimonial.namePlaceholder')||'Full name'}
              onCommit={(txt)=>onEdit({content:{name:txt}})}
              style={{fontSize:s.nameSize||14, fontWeight:600,
                      color:s.nameColor||'inherit', lineHeight:1.3}}/>
            {(c.role || c.company) && (
              <div style={{fontSize:s.roleSize||12, color:s.roleColor||'color-mix(in oklab, currentColor 60%, transparent)',
                           marginTop:2, lineHeight:1.3}}>
                <Editable as="span" singleLine editable={editable}
                  value={c.role} placeholder={window.stI18n?.t?.('eb.testimonial.rolePlaceholder')||'Role'}
                  onCommit={(txt)=>onEdit({content:{role:txt}})}/>
                {c.role && c.company && <span>{' · '}</span>}
                <Editable as="span" singleLine editable={editable}
                  value={c.company} placeholder={window.stI18n?.t?.('eb.testimonial.companyPlaceholder')||'Company'}
                  onCommit={(txt)=>onEdit({content:{company:txt}})}/>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Email signatures — avatar + identity + contact + social.
const SIG_SOCIAL_NETS = [
  {id:'li',  nameKey:'social.linkedin',  letter:'in'},
  {id:'tw',  nameKey:'social.twitter',   letter:'X'},
  {id:'ig',  nameKey:'social.instagram', letter:'ig'},
  {id:'fb',  nameKey:'social.facebook',  letter:'f'},
  {id:'yt',  nameKey:'social.youtube',   letter:'Y'},
  {id:'tt',  nameKey:'social.tiktok',    letter:'tt'},
  {id:'gh',  nameKey:'social.github',    letter:'gh'},
  {id:'web', nameKey:'social.website',   letter:'w'},
];
window.SIG_SOCIAL_NETS = SIG_SOCIAL_NETS;

function EBSignature({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const editable = !!onEdit;
  const layout = s.layout || 'horizontal';
  const align = s.align || 'left';
  const avatarSize = s.avatarSize || 56;
  const socials = Array.isArray(c.socials) ? c.socials : [];
  const showDivider = s.divider !== false;

  const avatar = (
    <EBAvatar src={c.avatar} name={c.name}
      size={avatarSize} shape={s.avatarShape||'circle'}
      radius={s.avatarRadius||6}/>
  );

  const Socials = () => socials.length===0 ? null : (
    <div style={{
      display:'flex', gap: s.socialGap||8, marginTop:10,
      justifyContent: (layout==='stacked'?align:'flex-start')==='center'?'center':
                      (layout==='stacked'?align:'flex-start')==='right'?'flex-end':'flex-start',
    }}>
      {socials.map((sc,i) => {
        const net = SIG_SOCIAL_NETS.find(n => n.id===sc.type) || SIG_SOCIAL_NETS[0];
        const size = s.socialSize||24;
        return (
          <a key={i} href={sc.url||'#'} onClick={e=>e.preventDefault()}
            style={{
              width:size, height:size,
              borderRadius:(s.socialShape||'circle')==='square'?4:'50%',
              background: s.socialColor || 'currentColor',
              display:'grid', placeItems:'center',
              textDecoration:'none',
              fontSize:Math.max(9, Math.round(size*0.38)),
              fontWeight:700, lineHeight:1,
              color:'#fff', opacity:0.9,
            }}>{net.letter}</a>
        );
      })}
    </div>
  );

  const textCol = (
    <div style={{textAlign: layout==='stacked'?align:'left', flex:1, minWidth:0}}>
      <Editable as="div" singleLine editable={editable}
        value={c.name} placeholder={window.stI18n?.t?.('eb.signature.namePlaceholder')||'Full name'}
        onCommit={(txt)=>onEdit({content:{name:txt}})}
        style={{fontSize:s.nameSize||16, fontWeight:600,
                color:s.nameColor||'inherit', lineHeight:1.3}}/>
      {(c.title || c.company) && (
        <div style={{fontSize:s.titleSize||13,
                     color:s.titleColor||'color-mix(in oklab, currentColor 70%, transparent)',
                     marginTop:2, lineHeight:1.4}}>
          <Editable as="span" singleLine editable={editable}
            value={c.title} placeholder={window.stI18n?.t?.('eb.signature.titlePlaceholder')||'Title'}
            onCommit={(txt)=>onEdit({content:{title:txt}})}/>
          {c.title && c.company && <span>{' · '}</span>}
          <Editable as="span" singleLine editable={editable}
            value={c.company} placeholder={window.stI18n?.t?.('eb.signature.companyPlaceholder')||'Company'}
            onCommit={(txt)=>onEdit({content:{company:txt}})}/>
        </div>
      )}
      {showDivider && (c.email || c.phone || socials.length>0) && (
        <div style={{
          height:1,
          background: s.dividerColor||'color-mix(in oklab, currentColor 15%, transparent)',
          margin:'10px 0', width:'100%', maxWidth:220,
        }}/>
      )}
      {(c.email || c.phone) && (
        <div style={{fontSize:s.metaSize||12,
                     color:s.metaColor||'color-mix(in oklab, currentColor 60%, transparent)',
                     lineHeight:1.8}}>
          {c.email && (
            <div>
              <span style={{display:'inline-block',width:14,marginRight:6,verticalAlign:'-2px'}}>✉</span>
              <a href={`mailto:${c.email}`} onClick={e=>e.preventDefault()}
                style={{color:'inherit', textDecoration:'none'}}>{c.email}</a>
            </div>
          )}
          {c.phone && (
            <div>
              <span style={{display:'inline-block',width:14,marginRight:6,verticalAlign:'-2px'}}>☎</span>
              <a href={`tel:${String(c.phone).replace(/[^\d+]/g,'')}`} onClick={e=>e.preventDefault()}
                style={{color:'inherit', textDecoration:'none'}}>{c.phone}</a>
            </div>
          )}
        </div>
      )}
      <Socials/>
    </div>
  );

  return (
    <div style={{
      ...bwrap(s, sp),
      fontFamily: fstack(s.font),
      color: s.color||'inherit',
      textAlign: align,
    }}>
      <div style={{
        display: layout==='stacked' ? 'block' : 'flex',
        alignItems: 'flex-start',
        gap: 16,
        justifyContent: align==='center'?'center':align==='right'?'flex-end':'flex-start',
      }}>
        <div style={{
          flexShrink:0,
          ...(layout==='stacked'?{
            marginBottom:12,
            display:'flex',
            justifyContent: align==='center'?'center':align==='right'?'flex-end':'flex-start',
          }:{}),
        }}>
          {avatar}
        </div>
        {textCol}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// E3 · Advanced blocks — accordion, attachment
// ═══════════════════════════════════════════════════════════

// Derive a file extension from a filename (best-effort).
function guessExt(filename='') {
  const m = String(filename).toLowerCase().match(/\.([a-z0-9]{1,6})$/);
  return m ? m[1] : '';
}
window.guessExt = guessExt;

// Map extensions to soft color hues for the attachment badge. Palette only
// — not a hard dependency (falls back to neutral grey).
const ATTACHMENT_EXT_COLORS = {
  pdf: '#e85a4f', doc: '#2a6cdf', docx: '#2a6cdf',
  xls: '#1a8a4e', xlsx: '#1a8a4e', csv: '#1a8a4e',
  ppt: '#d97706', pptx: '#d97706',
  zip: '#6b21a8', rar: '#6b21a8', '7z': '#6b21a8',
  png: '#0ea5e9', jpg: '#0ea5e9', jpeg: '#0ea5e9', gif: '#0ea5e9', webp: '#0ea5e9',
  mp3: '#7c3aed', wav: '#7c3aed',
  mp4: '#db2777', mov: '#db2777',
  txt: '#6b6a63', md: '#6b6a63',
};

function EBAccordion({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const items = Array.isArray(c.items) ? c.items : [];
  const align = s.align || 'left';
  const hintLabel = window.stI18n?.t?.('eb.accordion.alwaysExpanded')
    || 'Always expanded in email — email clients don\'t run JS';
  return (
    <div style={{
      ...bwrap(s, sp),
      fontFamily: fstack(s.font),
      textAlign: align,
      color: s.bodyColor || 'inherit',
    }}>
      {items.length === 0 ? (
        <div style={{fontSize:12, color:'var(--fg-3)', fontStyle:'italic'}}>
          {window.stI18n?.t?.('eb.accordion.empty') || 'No items yet — add one in the right panel.'}
        </div>
      ) : items.map((it, i) => (
        <div key={i} style={{
          borderTop: i>0 ? `1px solid ${s.dividerColor || 'color-mix(in oklab, currentColor 15%, transparent)'}` : 'none',
          paddingTop: i>0 ? (s.itemGap!=null ? s.itemGap : 14) : 0,
          marginTop: i>0 ? (s.itemGap!=null ? s.itemGap : 14) : 0,
        }}>
          <div style={{
            fontSize: s.titleSize || 16,
            fontWeight: s.titleWeight || 600,
            color: s.titleColor || 'inherit',
            lineHeight: 1.3,
            marginBottom: 6,
          }}>{it.title || ''}</div>
          <div style={{
            fontSize: s.bodySize || 14,
            color: s.bodyColor || 'inherit',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}>{it.body || ''}</div>
        </div>
      ))}
      <div style={{fontSize:10.5, color:'var(--fg-3)', fontStyle:'italic', marginTop:10, textAlign:'left'}}>
        {hintLabel}
      </div>
    </div>
  );
}

function EBAttachment({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const ext = (c.ext || guessExt(c.filename || '')).toLowerCase();
  const badgeColor = ATTACHMENT_EXT_COLORS[ext] || s.iconBg || '#6b6a63';
  const radius = s.radius != null ? s.radius : 8;
  const ctaLabel = c.ctaLabel
    || (window.stI18n?.t?.('eb.attachment.download') || 'Download');
  return (
    <div style={{...bwrap(s, sp), fontFamily: fstack(s.font)}}>
      <div style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'14px 16px',
        background: s.bg || 'color-mix(in oklab, currentColor 4%, transparent)',
        border: `1px solid ${s.borderColor || 'color-mix(in oklab, currentColor 15%, transparent)'}`,
        borderRadius: radius,
      }}>
        <div style={{
          width:42, height:50, flexShrink:0,
          borderRadius:6,
          background: s.iconBg || badgeColor,
          color: s.iconColor || '#fff',
          display:'grid', placeItems:'center',
          fontSize:11, fontWeight:700, letterSpacing:0.5,
          textTransform:'uppercase',
        }}>{ext ? ext.slice(0,4) : 'FILE'}</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontSize: s.nameSize || 14, fontWeight: 600,
            color: s.nameColor || 'inherit',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>{c.filename || (window.stI18n?.t?.('eb.attachment.noFile') || 'Untitled file')}</div>
          {c.size && (
            <div style={{
              fontSize: s.sizeSize || 12,
              color: s.sizeColor || 'color-mix(in oklab, currentColor 60%, transparent)',
              fontFamily: 'var(--font-mono)', marginTop:2,
            }}>{c.size}</div>
          )}
        </div>
        <a href={c.fileUrl || '#'} onClick={e=>e.preventDefault()}
          style={{
            flexShrink:0,
            padding:'8px 14px',
            background: s.ctaBg || '#1a1a17',
            color: s.ctaColor || '#fff',
            borderRadius: 4,
            textDecoration:'none',
            fontSize:12, fontWeight:500,
          }}>{ctaLabel}</a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// E4 · Ecommerce composites — cart, receipt
// ═══════════════════════════════════════════════════════════

function fmtMoney(val, currency='USD') {
  if (val == null || val === '') return '';
  // If user typed a pre-formatted string (e.g. "$12.50 MXN"), keep it.
  if (typeof val === 'string' && /[^\d.,\-]/.test(val)) return val;
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n)) return String(val);
  try {
    return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}
window.fmtMoney = fmtMoney;

function EBCart({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const items = Array.isArray(c.items) ? c.items : [];
  const currency = c.currency || 'USD';
  const radius = s.radius != null ? s.radius : 8;
  const cellBorder = `1px solid ${s.rowBorderColor || 'color-mix(in oklab, currentColor 10%, transparent)'}`;
  const totalsRow = (label, value, emphasized) => (value == null || value === '') ? null : (
    <tr>
      <td colSpan={2} style={{
        padding:'10px 14px',
        borderTop: cellBorder,
        textAlign:'right',
        fontSize: emphasized ? 15 : 13,
        fontWeight: emphasized ? 700 : 500,
        color: emphasized ? (s.totalColor || s.textColor || 'inherit') : (s.textColor || 'inherit'),
      }}>{label}</td>
      <td style={{
        padding:'10px 14px',
        borderTop: cellBorder,
        textAlign:'right',
        fontSize: emphasized ? 15 : 13,
        fontWeight: emphasized ? 700 : 500,
        fontFamily: 'var(--font-mono)',
        color: emphasized ? (s.totalColor || s.textColor || 'inherit') : (s.textColor || 'inherit'),
        whiteSpace:'nowrap',
      }}>{fmtMoney(value, currency)}</td>
    </tr>
  );
  const cta = c.ctaLabel || (window.stI18n?.t?.('eb.cart.completeCheckout') || 'Complete checkout');
  return (
    <div style={{...bwrap(s, sp), fontFamily: fstack(s.font), color: s.textColor || 'inherit'}}>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{
        width:'100%', borderCollapse:'collapse',
        background: s.bg || 'transparent',
        border: `1px solid ${s.borderColor || 'color-mix(in oklab, currentColor 15%, transparent)'}`,
        borderRadius: radius,
        overflow:'hidden',
      }}>
        <thead>
          <tr style={{background: s.headerBg || 'color-mix(in oklab, currentColor 6%, transparent)'}}>
            <th colSpan={2} style={{padding:'10px 14px', textAlign:'left', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', color:s.textColor||'inherit'}}>
              {window.stI18n?.t?.('eb.cart.itemHeader') || 'Item'}
            </th>
            <th style={{padding:'10px 14px', textAlign:'right', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', color:s.textColor||'inherit'}}>
              {window.stI18n?.t?.('eb.cart.priceHeader') || 'Price'}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={3} style={{padding:'22px 14px', textAlign:'center', fontSize:12, color:'var(--fg-3)', fontStyle:'italic'}}>
              {window.stI18n?.t?.('eb.cart.empty') || 'No items — add one in the right panel.'}
            </td></tr>
          ) : items.map((it, i) => (
            <tr key={i} style={{background: s.rowBg || 'transparent'}}>
              <td style={{padding:'10px 14px', borderTop: i>0?cellBorder:'none', width:56}}>
                <div style={{width:48, height:48, borderRadius:6, overflow:'hidden',
                             background:'color-mix(in oklab, currentColor 8%, transparent)',
                             display:'grid', placeItems:'center'}}>
                  {it.image
                    ? <img src={it.image} alt={it.name||''} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    : <span style={{fontSize:18, opacity:0.4}}>🛍</span>}
                </div>
              </td>
              <td style={{padding:'10px 14px', borderTop: i>0?cellBorder:'none'}}>
                <div style={{fontSize:13, fontWeight:500, color:s.textColor||'inherit'}}>{it.name || ''}</div>
                {it.qty != null && it.qty !== '' && (
                  <div style={{fontSize:11, color:'color-mix(in oklab, currentColor 55%, transparent)', marginTop:2}}>
                    {(window.stI18n?.t?.('eb.cart.qty') || 'Qty')}: {it.qty}
                  </div>
                )}
              </td>
              <td style={{padding:'10px 14px', borderTop: i>0?cellBorder:'none', textAlign:'right', fontSize:13, fontWeight:500, fontFamily:'var(--font-mono)', whiteSpace:'nowrap', color:s.textColor||'inherit'}}>
                {fmtMoney(it.price, currency)}
              </td>
            </tr>
          ))}
          {totalsRow(window.stI18n?.t?.('eb.cart.subtotal') || 'Subtotal', c.subtotal, false)}
          {totalsRow(window.stI18n?.t?.('eb.cart.shipping') || 'Shipping', c.shipping, false)}
          {totalsRow(window.stI18n?.t?.('eb.cart.tax') || 'Tax', c.tax, false)}
          {totalsRow(window.stI18n?.t?.('eb.cart.total') || 'Total', c.total, true)}
        </tbody>
      </table>
      {(c.ctaUrl || c.ctaLabel) && (
        <div style={{marginTop:14, textAlign:'center'}}>
          <a href={c.ctaUrl || '#'} onClick={e=>e.preventDefault()} style={{
            display:'inline-block',
            padding:'12px 22px',
            background: s.ctaBg || '#1a1a17',
            color: s.ctaColor || '#fff',
            borderRadius: 4,
            textDecoration:'none',
            fontSize:14, fontWeight:500,
          }}>{cta}</a>
        </div>
      )}
    </div>
  );
}

function EBReceipt({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const items = Array.isArray(c.items) ? c.items : [];
  const currency = c.currency || 'USD';
  const radius = s.radius != null ? s.radius : 8;
  const cellBorder = `1px solid ${s.rowBorderColor || 'color-mix(in oklab, currentColor 10%, transparent)'}`;
  const t = window.stI18n?.t || ((k, p, f) => f || k);
  const header = (() => {
    const pieces = [];
    if (c.orderNumber) pieces.push(`${t('eb.receipt.orderLabel', null, 'Order')} #${c.orderNumber}`);
    if (c.orderDate) pieces.push(c.orderDate);
    return pieces.join(' · ');
  })();
  return (
    <div style={{...bwrap(s, sp), fontFamily: fstack(s.font), color: s.textColor || 'inherit'}}>
      <div style={{
        padding:'14px 16px',
        background: s.bg || 'transparent',
        border: `1px solid ${s.borderColor || 'color-mix(in oklab, currentColor 15%, transparent)'}`,
        borderRadius: radius,
      }}>
        {header && (
          <div style={{
            fontSize: 13, fontWeight: 600, color: s.headingColor || s.textColor || 'inherit',
            marginBottom: 12, letterSpacing: 0.1,
          }}>{header}</div>
        )}
        {(c.customerName || c.address) && (
          <div style={{
            fontSize: 12, color: 'color-mix(in oklab, currentColor 70%, transparent)',
            marginBottom: 14, lineHeight: 1.5, whiteSpace:'pre-wrap',
          }}>
            {c.customerName && <div style={{fontWeight:500, color:s.textColor||'inherit'}}>{c.customerName}</div>}
            {c.address && <div>{c.address}</div>}
          </div>
        )}
        <table role="presentation" cellPadding={0} cellSpacing={0} style={{width:'100%', borderCollapse:'collapse'}}>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={3} style={{padding:'14px 0', textAlign:'center', fontSize:12, color:'var(--fg-3)', fontStyle:'italic'}}>
                {t('eb.receipt.empty', null, 'No items — add one in the right panel.')}
              </td></tr>
            ) : items.map((it, i) => (
              <tr key={i}>
                <td style={{padding:'8px 0', borderTop: i>0?cellBorder:'none', fontSize:13, color:s.textColor||'inherit'}}>{it.name||''}</td>
                <td style={{padding:'8px 10px', borderTop: i>0?cellBorder:'none', fontSize:12, color:'color-mix(in oklab, currentColor 60%, transparent)', textAlign:'right', whiteSpace:'nowrap'}}>
                  {it.qty != null && it.qty !== '' ? `×${it.qty}` : ''}
                </td>
                <td style={{padding:'8px 0', borderTop: i>0?cellBorder:'none', fontSize:13, fontFamily:'var(--font-mono)', textAlign:'right', whiteSpace:'nowrap', color:s.textColor||'inherit'}}>
                  {fmtMoney(it.price, currency)}
                </td>
              </tr>
            ))}
            {c.subtotal != null && c.subtotal !== '' && (
              <tr><td colSpan={2} style={{padding:'10px 0 4px', borderTop:cellBorder, textAlign:'right', fontSize:12}}>{t('eb.receipt.subtotal', null, 'Subtotal')}</td>
                  <td style={{padding:'10px 0 4px', borderTop:cellBorder, textAlign:'right', fontSize:12, fontFamily:'var(--font-mono)'}}>{fmtMoney(c.subtotal, currency)}</td></tr>
            )}
            {c.tax != null && c.tax !== '' && (
              <tr><td colSpan={2} style={{padding:'4px 0', textAlign:'right', fontSize:12}}>{t('eb.receipt.tax', null, 'Tax')}</td>
                  <td style={{padding:'4px 0', textAlign:'right', fontSize:12, fontFamily:'var(--font-mono)'}}>{fmtMoney(c.tax, currency)}</td></tr>
            )}
            {c.total != null && c.total !== '' && (
              <tr><td colSpan={2} style={{padding:'8px 0', borderTop:cellBorder, textAlign:'right', fontSize:14, fontWeight:700, color:s.headingColor||s.textColor||'inherit'}}>{t('eb.receipt.total', null, 'Total')}</td>
                  <td style={{padding:'8px 0', borderTop:cellBorder, textAlign:'right', fontSize:14, fontWeight:700, fontFamily:'var(--font-mono)', color:s.headingColor||s.textColor||'inherit'}}>{fmtMoney(c.total, currency)}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {(c.ctaUrl || c.ctaLabel) && (
        <div style={{marginTop:14, textAlign:'center'}}>
          <a href={c.ctaUrl || '#'} onClick={e=>e.preventDefault()} style={{
            display:'inline-block',
            padding:'10px 20px',
            background: s.ctaBg || '#1a1a17',
            color: s.ctaColor || '#fff',
            borderRadius: 4,
            textDecoration:'none',
            fontSize:13, fontWeight:500,
          }}>{c.ctaLabel || t('eb.receipt.viewOrder', null, 'View order')}</a>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// E5 · Map (static image → external link)
// ═══════════════════════════════════════════════════════════

function EBMap({ data = {}, onEdit, device }) {
  if (window.isVisibleOn && !window.isVisibleOn(data.hidden, device)) {
    return <HiddenBlockGhost device={device} onEdit={onEdit}/>;
  }
  const s = resolveBlockStyle(data, device);
  const sp = resolveBlockSpacing(data, device);
  const c = getContent(data);
  const width = s.width || 100;
  const align = s.align || 'center';
  const radius = s.radius || 0;
  const borderW = s.borderWidth || 0;
  const hasImg = !!c.imageUrl;
  const img = hasImg ? (
    <img src={c.imageUrl} alt={c.label || c.address || ''}
      style={{
        display:'block', width:'100%', height:'auto',
        borderRadius: radius,
        border: borderW ? `${borderW}px solid ${s.borderColor||'#000'}` : 'none',
      }}/>
  ) : (
    <ImgPH ratio="2/1"
      label={window.stI18n?.t?.('eb.map.placeholder') || 'Configure map'}
      radius={radius}/>
  );
  return (
    <div style={{...bwrap(s, sp), textAlign: align}}>
      <div style={{display:'inline-block', width:`${width}%`, maxWidth:'100%'}}>
        {hasImg && c.destinationUrl
          ? <a href={c.destinationUrl} onClick={e=>e.preventDefault()}
               style={{display:'block', lineHeight:0}}>{img}</a>
          : img}
      </div>
      {c.label && (
        <div style={{
          fontSize:12, color:s.labelColor||'color-mix(in oklab, currentColor 65%, transparent)',
          marginTop:6, fontFamily:fstack(s.font), lineHeight:1.4,
        }}>{c.label}</div>
      )}
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
  video: EBVideo,
  gif: EBGif,
  qr: EBQR,
  countdown: EBCountdown,
  testimonial: EBTestimonial,
  signature: EBSignature,
  accordion: EBAccordion,
  attachment: EBAttachment,
  cart: EBCart,
  receipt: EBReceipt,
  map: EBMap,
};

window.EB_RENDERERS = EB_RENDERERS;
window.renderVar = renderVar;
window.FONT_STACKS = FONT_STACKS;
