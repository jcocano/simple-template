// BlockProps — Panel derecho de propiedades por bloque
// 3 pestañas: Contenido · Estilo · Espaciado
// Soporta todos los tipos de bloque: text, heading, image, icon, button, divider, spacer,
//                                     header, footer, product, social

function BlockProps({ block, onChange, onDelete }) {
  const [tab, setTab] = React.useState('content');
  const [imgOpen, setImgOpen] = React.useState(false);
  const [emojiOpen, setEmojiOpen] = React.useState(false);

  const upd = (path, value) => {
    // path like "style.size" o "content.label" o "spacing.padding"
    // Writes into block.data.{style|content|spacing}
    const keys = path.split('.');
    const next = JSON.parse(JSON.stringify(block));
    next.data = next.data || {};
    let cur = next.data;
    for (let i=0;i<keys.length-1;i++) {
      cur[keys[i]] = cur[keys[i]] || {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length-1]] = value;
    onChange && onChange(next);
  };

  const s = block.data?.style || {};
  // Backward-compat: merge flat data with nested content
  const { style:_s, content:_c, spacing:_sp, ...flat } = (block.data || {});
  const c = { ...flat, ...(block.data?.content || {}) };
  const sp = block.data?.spacing || { padding:[0,0,0,0], margin:[0,0,0,0] };

  const typeLabel = {
    text:'Texto', heading:'Título', image:'Imagen', icon:'Icono',
    button:'Botón', divider:'Divisor', spacer:'Espaciador',
    header:'Cabecera', footer:'Footer', product:'Producto',
    social:'Redes sociales', hero:'Hero', html:'HTML a la medida',
  }[block.type] || block.type;

  return (
    <div className="side-body" style={{padding:0}}>
      {/* Header */}
      <div style={{
        padding:'14px 14px 12px',borderBottom:'1px solid var(--line)',
        display:'flex',alignItems:'center',gap:10,
      }}>
        <div style={{
          width:28,height:28,borderRadius:'var(--r-sm)',
          background:'var(--accent-soft)',color:'var(--accent)',
          display:'grid',placeItems:'center',flexShrink:0,
        }}>
          <BlockTypeIcon type={block.type}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:600}}>{typeLabel}</div>
          <div style={{fontSize:10.5,color:'var(--fg-3)',fontFamily:'var(--font-mono)'}}>#{block.id}</div>
        </div>
        <button className="btn icon sm ghost" title="Duplicar"><I.duplicate size={12}/></button>
        {(['text','heading','button','footer','hero'].includes(block.type)) && (
          <button className="btn icon sm ghost" title="Mejorar con IA: reescribir, acortar, cambiar tono, traducir"
            style={{color:'var(--accent)'}}
            onClick={()=>window.dispatchEvent(new CustomEvent('st:improve', {detail:{block}}))}>
            <I.sparkles size={12}/>
          </button>
        )}
        <button className="btn icon sm ghost" onClick={onDelete} title="Eliminar"><I.minus size={13}/></button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--line)',padding:'6px 8px 0'}}>
        <PropTab label="Contenido" icon="type" active={tab==='content'} onClick={()=>setTab('content')}/>
        <PropTab label="Estilo"    icon="paint" active={tab==='style'}   onClick={()=>setTab('style')}/>
        <PropTab label="Espaciado" icon="spacer" active={tab==='spacing'} onClick={()=>setTab('spacing')}/>
      </div>

      {/* Body */}
      <div style={{maxHeight:'calc(100vh - 220px)',overflow:'auto'}}>
        {tab==='content' && <ContentTab block={block} upd={upd}
                              onPickImage={()=>setImgOpen(true)}
                              onPickEmoji={()=>setEmojiOpen(!emojiOpen)}
                              emojiOpen={emojiOpen}/>}
        {tab==='style' && <StyleTab block={block} upd={upd}/>}
        {tab==='spacing' && <SpacingTab block={block} upd={upd}/>}
      </div>

      <ImagePickerModal open={imgOpen} onClose={()=>setImgOpen(false)}
        onSelect={img => upd('content.image', img.name || img.url)}/>
    </div>
  );
}

function PropTab({ label, icon, active, onClick }) {
  const Ico = I[icon];
  return (
    <button onClick={onClick} style={{
      flex:1,padding:'8px 6px 10px',border:'none',background:'transparent',
      borderBottom: active?'2px solid var(--accent)':'2px solid transparent',
      color: active?'var(--accent)':'var(--fg-2)',
      fontSize:11.5,fontWeight:500,cursor:'pointer',
      display:'flex',alignItems:'center',justifyContent:'center',gap:5,
    }}>
      {Ico && <Ico size={11}/>} {label}
    </button>
  );
}

function BlockTypeIcon({ type }) {
  const map = {
    text:'type', heading:'type', image:'image', icon:'sparkle',
    button:'button', divider:'divider', spacer:'spacer',
    header:'layers', footer:'footer', product:'product',
    social:'heart', hero:'hero', html:'code',
  };
  const Ico = I[map[type] || 'square'];
  return Ico ? <Ico size={14}/> : null;
}

// ═══════════════════════════════════════════════════════════
// TAB: CONTENIDO
// ═══════════════════════════════════════════════════════════
function ContentTab({ block, upd, onPickImage, onPickEmoji, emojiOpen }) {
  const { style:_s, content:_c, spacing:_sp, ...flat } = block.data||{};
  const c = { ...flat, ...(block.data?.content || {}) };
  const t = block.type;

  if (t==='text') {
    return (
      <Group title="Texto">
        <Row label="Cuerpo">
          <textarea className="field" rows={5} value={c.body||''}
            onChange={e=>upd('content.body', e.target.value)}
            style={{fontFamily:'inherit',resize:'vertical',padding:8}}
            placeholder="Escribe el párrafo… usa {{variables}}"/>
        </Row>
        <Row label="Link color"><ColorInput value={block.data?.style?.linkColor||'#5b5bf0'} onChange={v=>upd('style.linkColor',v)}/></Row>
      </Group>
    );
  }

  if (t==='heading') {
    return (
      <Group title="Título">
        <Row label="Texto"><input className="field" value={c.text||''} onChange={e=>upd('content.text',e.target.value)}/></Row>
        <Row label="Nivel">
          <div className="seg">
            {[1,2,3,4,5,6].map(n => (
              <button key={n} className={(block.data?.style?.level||2)===n?'on':''}
                onClick={()=>upd('style.level',n)}>H{n}</button>
            ))}
          </div>
        </Row>
      </Group>
    );
  }

  if (t==='image') {
    return (
      <Group title="Imagen">
        <Row label="Fuente">
          <button className="field" onClick={onPickImage}
            style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {c.image || 'Elegir de biblioteca…'}
            </span>
          </button>
        </Row>
        <Row label="Alt text"><input className="field" value={c.alt||''} onChange={e=>upd('content.alt',e.target.value)} placeholder="Descripción accesible"/></Row>
        <Row label="Link (URL)"><input className="field" value={c.url||''} onChange={e=>upd('content.url',e.target.value)} placeholder="https://…"/></Row>
      </Group>
    );
  }

  if (t==='icon') {
    const mode = block.data?.style?.mode || 'icon';
    return (
      <>
        <Group title="Contenido">
          <Row label="Modo">
            <div className="seg">
              <button className={mode==='icon'?'on':''} onClick={()=>upd('style.mode','icon')}>Solo icono</button>
              <button className={mode==='icon-text'?'on':''} onClick={()=>upd('style.mode','icon-text')}>Icono + texto</button>
              <button className={mode==='text'?'on':''} onClick={()=>upd('style.mode','text')}>Solo texto</button>
            </div>
          </Row>
          {mode!=='text' && (
            <Row label="Emoji">
              <button className="field" onClick={onPickEmoji}
                style={{cursor:'pointer',fontSize:22,padding:'4px 10px',lineHeight:1.4,textAlign:'left'}}>
                {c.emoji || '✨'}
              </button>
            </Row>
          )}
          {emojiOpen && mode!=='text' && (
            <div style={{marginTop:8}}>
              <EmojiPicker onSelect={e => upd('content.emoji', e)}/>
            </div>
          )}
          {mode!=='icon' && (
            <Row label="Texto">
              <input className="field" value={c.text||''} onChange={e=>upd('content.text',e.target.value)} placeholder="Etiqueta"/>
            </Row>
          )}
        </Group>
      </>
    );
  }

  if (t==='button') {
    return (
      <Group title="Botón">
        <Row label="Texto"><input className="field" value={c.label||''} onChange={e=>upd('content.label',e.target.value)}/></Row>
        <Row label="URL"><input className="field" value={c.url||''} onChange={e=>upd('content.url',e.target.value)} placeholder="https://…"/></Row>
        <Row label="Nueva tab">
          <Toggle value={c.newTab} onChange={v=>upd('content.newTab',v)}/>
        </Row>
      </Group>
    );
  }

  if (t==='divider') {
    return <Group title="Divisor"><div style={{fontSize:12,color:'var(--fg-3)'}}>Este bloque no tiene contenido. Edita estilo y espaciado.</div></Group>;
  }

  if (t==='spacer') {
    return <Group title="Espaciador"><div style={{fontSize:12,color:'var(--fg-3)'}}>Altura se edita en la pestaña Estilo.</div></Group>;
  }

  if (t==='header') {
    return (
      <Group title="Cabecera">
        <Row label="Marca"><input className="field" value={c.brand||''} onChange={e=>upd('content.brand',e.target.value)}/></Row>
        <Row label="Sub"><input className="field" value={c.sub||''} onChange={e=>upd('content.sub',e.target.value)} placeholder="Fecha o edición"/></Row>
        <Row label="Logo">
          <button className="field" onClick={onPickImage}
            style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {c.logo || 'Seleccionar…'}
            </span>
          </button>
        </Row>
      </Group>
    );
  }

  if (t==='footer') {
    return (
      <Group title="Footer">
        <Row label="Empresa"><input className="field" value={c.company||''} onChange={e=>upd('content.company',e.target.value)}/></Row>
        <Row label="Aviso"><textarea className="field" rows={2} value={c.notice||''} onChange={e=>upd('content.notice',e.target.value)}/></Row>
        <Row label="Link desub"><input className="field" value={c.unsubUrl||''} onChange={e=>upd('content.unsubUrl',e.target.value)}/></Row>
        <Row label="Texto desub"><input className="field" value={c.unsubLabel||''} onChange={e=>upd('content.unsubLabel',e.target.value)}/></Row>
      </Group>
    );
  }

  if (t==='product') {
    return (
      <Group title="Producto">
        <Row label="Nombre"><input className="field" value={c.name||''} onChange={e=>upd('content.name',e.target.value)}/></Row>
        <Row label="Precio"><input className="field" value={c.price||''} onChange={e=>upd('content.price',e.target.value)}/></Row>
        <Row label="Descripción"><textarea className="field" rows={2} value={c.desc||''} onChange={e=>upd('content.desc',e.target.value)}/></Row>
        <Row label="Imagen">
          <button className="field" onClick={onPickImage} style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/><span>{c.image || 'Seleccionar…'}</span>
          </button>
        </Row>
        <Row label="URL CTA"><input className="field" value={c.url||''} onChange={e=>upd('content.url',e.target.value)}/></Row>
      </Group>
    );
  }

  if (t==='social') {
    const networks = [
      {id:'f', name:'Facebook'},{id:'t', name:'X / Twitter'},{id:'i', name:'Instagram'},
      {id:'in', name:'LinkedIn'},{id:'y', name:'YouTube'},{id:'tt', name:'TikTok'},
      {id:'m', name:'Mastodon'},{id:'th', name:'Threads'},
    ];
    const active = c.active || ['f','t','i','in'];
    const toggle = (id) => {
      const next = active.includes(id) ? active.filter(x=>x!==id) : [...active, id];
      upd('content.active', next);
    };
    return (
      <Group title="Redes sociales">
        {networks.map(n => (
          <Row key={n.id} label={n.name}>
            <Toggle value={active.includes(n.id)} onChange={()=>toggle(n.id)}/>
          </Row>
        ))}
      </Group>
    );
  }

  if (t==='html') {
    return (
      <Group title="HTML a la medida">
        <div style={{fontSize:11.5,color:'var(--fg-3)',lineHeight:1.55,marginBottom:10}}>
          Pega aquí el HTML que quieres insertar tal cual. Útil para código de seguimiento, widgets de terceros o plantillas heredadas.
        </div>
        <Row label="Código HTML">
          <textarea className="field" rows={10}
            value={c.code||''}
            onChange={e=>upd('content.code',e.target.value)}
            style={{fontFamily:'var(--font-mono)',fontSize:11.5,lineHeight:1.55,resize:'vertical',padding:10,whiteSpace:'pre'}}
            placeholder={'<div style="padding:20px;text-align:center;">\n  Mi HTML personalizado\n</div>'}/>
        </Row>
        <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
          <span style={{color:'var(--warn, #b45309)',flexShrink:0,marginTop:1}}>⚠</span>
          <span>El HTML se inserta sin modificaciones. Revisa que sea compatible con clientes de correo (nada de <code style={{fontFamily:'var(--font-mono)',fontSize:10.5,background:'var(--surface)',padding:'0 4px',borderRadius:3}}>&lt;script&gt;</code>, <code style={{fontFamily:'var(--font-mono)',fontSize:10.5,background:'var(--surface)',padding:'0 4px',borderRadius:3}}>position:fixed</code> ni flexbox moderno).</span>
        </div>
      </Group>
    );
  }

  return <Group title="Contenido"><div style={{fontSize:12,color:'var(--fg-3)'}}>Sin opciones de contenido para este bloque.</div></Group>;
}

// ═══════════════════════════════════════════════════════════
// TAB: ESTILO
// ═══════════════════════════════════════════════════════════
function StyleTab({ block, upd }) {
  const s = block.data?.style || {};
  const t = block.type;

  // Tipografía compartida
  const TypoGroup = ({ prefix='', sizeDefault=14, withWeight=true, withAlign=true }) => (
    <Group title="Tipografía">
      <Row label="Fuente"><FontPicker value={s[prefix+'font']||s.font} onChange={v=>upd(`style.${prefix}font`,v)}/></Row>
      <Row label="Tamaño"><Slider value={s[prefix+'size']||sizeDefault} onChange={v=>upd(`style.${prefix}size`,v)} min={8} max={120} suffix="px"/></Row>
      {withWeight && <Row label="Peso">
        <div className="seg">
          {[400,500,600,700,800].map(w => (
            <button key={w} className={(s[prefix+'weight']||500)===w?'on':''} onClick={()=>upd(`style.${prefix}weight`,w)}>{w}</button>
          ))}
        </div>
      </Row>}
      <Row label="Interlínea"><Slider value={Math.round((s[prefix+'lh']||1.5)*10)} onChange={v=>upd(`style.${prefix}lh`,v/10)} min={8} max={30} suffix="" /></Row>
      <Row label="Tracking"><Slider value={s[prefix+'tracking']||0} onChange={v=>upd(`style.${prefix}tracking`,v)} min={-4} max={10} suffix="px"/></Row>
      <Row label="Color"><ColorInput value={s[prefix+'color']||'#0b0b0d'} onChange={v=>upd(`style.${prefix}color`,v)}/></Row>
      {withAlign && <Row label="Alineación"><AlignBar value={s.align||'left'} onChange={v=>upd('style.align',v)}/></Row>}
    </Group>
  );

  if (t==='text') {
    return (
      <>
        <TypoGroup/>
        <Group title="Decoración">
          <Row label="Cursiva"><Toggle value={s.italic} onChange={v=>upd('style.italic',v)}/></Row>
          <Row label="Subrayado"><Toggle value={s.underline} onChange={v=>upd('style.underline',v)}/></Row>
        </Group>
      </>
    );
  }

  if (t==='heading') {
    return (
      <>
        <Group title="Jerarquía">
          <Row label="Nivel">
            <div className="seg">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} className={(s.level||2)===n?'on':''} onClick={()=>upd('style.level',n)}>H{n}</button>
              ))}
            </div>
          </Row>
        </Group>
        <TypoGroup sizeDefault={24}/>
      </>
    );
  }

  if (t==='image') {
    return (
      <>
        <Group title="Dimensiones">
          <Row label="Ancho"><Slider value={s.width||100} onChange={v=>upd('style.width',v)} min={10} max={100} suffix="%"/></Row>
          <Row label="Ratio">
            <select className="field" value={s.ratio||'2/1'} onChange={e=>upd('style.ratio',e.target.value)}>
              <option value="1/1">1:1 Cuadrada</option>
              <option value="4/3">4:3</option>
              <option value="3/2">3:2</option>
              <option value="16/9">16:9</option>
              <option value="2/1">2:1 Banner</option>
              <option value="3/1">3:1 Hero ancho</option>
            </select>
          </Row>
          <Row label="Alineación"><AlignBar value={s.align||'center'} onChange={v=>upd('style.align',v)} options={['left','center','right']}/></Row>
        </Group>
        <Group title="Bordes y sombra">
          <Row label="Redondeo"><Slider value={s.radius||0} onChange={v=>upd('style.radius',v)} min={0} max={48} suffix="px"/></Row>
          <Row label="Borde"><Slider value={s.border?.w||0} onChange={v=>upd('style.border',{w:v,color:s.border?.color||'#000',style:s.border?.style||'solid'})} min={0} max={10} suffix="px"/></Row>
          <Row label="Color borde"><ColorInput value={s.border?.color||'#000000'} onChange={v=>upd('style.border',{w:s.border?.w||0,color:v,style:s.border?.style||'solid'})}/></Row>
          <Row label="Sombra">
            <select className="field" value={s.shadow||'none'} onChange={e=>upd('style.shadow', e.target.value==='none'?null:e.target.value)}>
              <option value="none">Sin sombra</option>
              <option value="0 2px 4px rgba(0,0,0,0.06)">Sutil</option>
              <option value="0 4px 12px rgba(0,0,0,0.10)">Media</option>
              <option value="0 12px 28px rgba(0,0,0,0.18)">Fuerte</option>
            </select>
          </Row>
        </Group>
      </>
    );
  }

  if (t==='icon') {
    return (
      <>
        <Group title="Tamaño y color">
          <Row label="Tamaño icono"><Slider value={s.size||32} onChange={v=>upd('style.size',v)} min={12} max={120} suffix="px"/></Row>
          <Row label="Color icono"><ColorInput value={s.color||'#1a1a17'} onChange={v=>upd('style.color',v)}/></Row>
          <Row label="Alineación"><AlignBar value={s.align||'center'} onChange={v=>upd('style.align',v)} options={['left','center','right']}/></Row>
          <Row label="Gap"><Slider value={s.gap!=null?s.gap:10} onChange={v=>upd('style.gap',v)} min={0} max={40} suffix="px"/></Row>
        </Group>
        <Group title="Texto (si hay)">
          <Row label="Fuente"><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label="Tamaño"><Slider value={s.textSize||14} onChange={v=>upd('style.textSize',v)} min={10} max={40} suffix="px"/></Row>
          <Row label="Peso">
            <div className="seg">{[400,500,600,700].map(w => (
              <button key={w} className={(s.textWeight||500)===w?'on':''} onClick={()=>upd('style.textWeight',w)}>{w}</button>
            ))}</div>
          </Row>
          <Row label="Color"><ColorInput value={s.textColor||'#0b0b0d'} onChange={v=>upd('style.textColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (t==='button') {
    return (
      <>
        <Group title="Apariencia">
          <Row label="Fondo"><ColorInput value={s.bg||'#1a1a17'} onChange={v=>upd('style.bg',v)}/></Row>
          <Row label="Color texto"><ColorInput value={s.color||'#ffffff'} onChange={v=>upd('style.color',v)}/></Row>
          <Row label="Redondeo"><Slider value={s.radius!=null?s.radius:4} onChange={v=>upd('style.radius',v)} min={0} max={48} suffix="px"/></Row>
          <Row label="Borde"><Slider value={s.borderW||0} onChange={v=>upd('style.borderW',v)} min={0} max={8} suffix="px"/></Row>
          {(s.borderW||0)>0 && <Row label="Color borde"><ColorInput value={s.borderColor||'#000000'} onChange={v=>upd('style.borderColor',v)}/></Row>}
          <Row label="Sombra">
            <select className="field" value={s.shadow||'none'} onChange={e=>upd('style.shadow', e.target.value==='none'?null:e.target.value)}>
              <option value="none">Sin sombra</option>
              <option value="0 1px 2px rgba(0,0,0,0.08)">XS</option>
              <option value="0 2px 6px rgba(0,0,0,0.12)">SM</option>
              <option value="0 6px 18px rgba(0,0,0,0.18)">MD</option>
              <option value="0 14px 36px rgba(0,0,0,0.22)">LG</option>
            </select>
          </Row>
        </Group>
        <Group title="Tipografía">
          <Row label="Fuente"><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label="Tamaño"><Slider value={s.size||14} onChange={v=>upd('style.size',v)} min={10} max={28} suffix="px"/></Row>
          <Row label="Peso">
            <div className="seg">{[400,500,600,700].map(w => (
              <button key={w} className={(s.weight||500)===w?'on':''} onClick={()=>upd('style.weight',w)}>{w}</button>
            ))}</div>
          </Row>
        </Group>
        <Group title="Layout">
          <Row label="Ancho">
            <div className="seg">
              <button className={s.width!=='full'?'on':''} onClick={()=>upd('style.width','auto')}>Auto</button>
              <button className={s.width==='full'?'on':''} onClick={()=>upd('style.width','full')}>Completo</button>
            </div>
          </Row>
          <Row label="Alineación"><AlignBar value={s.align||'center'} onChange={v=>upd('style.align',v)} options={['left','center','right']}/></Row>
          <Row label="Padding X"><Slider value={s.padX||22} onChange={v=>upd('style.padX',v)} min={0} max={80} suffix="px"/></Row>
          <Row label="Padding Y"><Slider value={s.padY||12} onChange={v=>upd('style.padY',v)} min={0} max={40} suffix="px"/></Row>
        </Group>
      </>
    );
  }

  if (t==='divider') {
    return (
      <Group title="Divisor">
        <Row label="Estilo">
          <div className="seg">
            <button className={(s.style||'solid')==='solid'?'on':''} onClick={()=>upd('style.style','solid')}>Sólido</button>
            <button className={s.style==='dashed'?'on':''} onClick={()=>upd('style.style','dashed')}>Guiones</button>
            <button className={s.style==='dotted'?'on':''} onClick={()=>upd('style.style','dotted')}>Puntos</button>
          </div>
        </Row>
        <Row label="Grosor"><Slider value={s.thickness||1} onChange={v=>upd('style.thickness',v)} min={1} max={12} suffix="px"/></Row>
        <Row label="Color"><ColorInput value={s.color||'#dddbd4'} onChange={v=>upd('style.color',v)}/></Row>
        <Row label="Ancho"><Slider value={s.width||100} onChange={v=>upd('style.width',v)} min={10} max={100} suffix="%"/></Row>
        <Row label="Alineación"><AlignBar value={s.align||'center'} onChange={v=>upd('style.align',v)} options={['left','center','right']}/></Row>
      </Group>
    );
  }

  if (t==='spacer') {
    return (
      <Group title="Espaciador">
        <Row label="Altura"><Slider value={s.h||24} onChange={v=>upd('style.h',v)} min={2} max={200} suffix="px"/></Row>
        <Row label="Fondo"><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
      </Group>
    );
  }

  if (t==='header') {
    return (
      <>
        <Group title="Layout">
          <Row label="Disposición">
            <div className="seg">
              <button className={(s.layout||'between')==='between'?'on':''} onClick={()=>upd('style.layout','between')}>Izq+Der</button>
              <button className={s.layout==='center'?'on':''} onClick={()=>upd('style.layout','center')}>Centro</button>
            </div>
          </Row>
          <Row label="Tamaño logo"><Slider value={s.logoSize||18} onChange={v=>upd('style.logoSize',v)} min={12} max={60} suffix="px"/></Row>
        </Group>
        <Group title="Colores">
          <Row label="Marca"><ColorInput value={s.color||'#0b0b0d'} onChange={v=>upd('style.color',v)}/></Row>
          <Row label="Sub"><ColorInput value={s.subColor||'#6b6a63'} onChange={v=>upd('style.subColor',v)}/></Row>
          <Row label="Fondo"><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
        </Group>
        <Group title="Tipografía">
          <Row label="Fuente"><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
        </Group>
      </>
    );
  }

  if (t==='footer') {
    return (
      <>
        <Group title="Tipografía">
          <Row label="Fuente"><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label="Tamaño"><Slider value={s.size||12} onChange={v=>upd('style.size',v)} min={9} max={20} suffix="px"/></Row>
          <Row label="Color"><ColorInput value={s.color||'#6b6a63'} onChange={v=>upd('style.color',v)}/></Row>
          <Row label="Alineación"><AlignBar value={s.align||'center'} onChange={v=>upd('style.align',v)} options={['left','center','right']}/></Row>
        </Group>
        <Group title="Fondo">
          <Row label="Fondo"><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
        </Group>
      </>
    );
  }

  if (t==='product') {
    return (
      <>
        <Group title="Apariencia">
          <Row label="Fondo"><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
          <Row label="Redondeo"><Slider value={s.radius||8} onChange={v=>upd('style.radius',v)} min={0} max={40} suffix="px"/></Row>
        </Group>
        <Group title="Tipografía">
          <Row label="Fuente"><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label="Color nombre"><ColorInput value={s.nameColor||'#0b0b0d'} onChange={v=>upd('style.nameColor',v)}/></Row>
          <Row label="Color precio"><ColorInput value={s.priceColor||'#5b5bf0'} onChange={v=>upd('style.priceColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (t==='social') {
    return (
      <>
        <Group title="Iconos">
          <Row label="Forma">
            <div className="seg">
              <button className={(s.shape||'circle')==='circle'?'on':''} onClick={()=>upd('style.shape','circle')}>Círculo</button>
              <button className={s.shape==='square'?'on':''} onClick={()=>upd('style.shape','square')}>Cuadrado</button>
            </div>
          </Row>
          <Row label="Tamaño"><Slider value={s.size||28} onChange={v=>upd('style.size',v)} min={16} max={60} suffix="px"/></Row>
          <Row label="Color"><ColorInput value={s.color||'#1a1a17'} onChange={v=>upd('style.color',v)}/></Row>
          <Row label="Separación"><Slider value={s.gap||12} onChange={v=>upd('style.gap',v)} min={0} max={40} suffix="px"/></Row>
          <Row label="Alineación"><AlignBar value={s.align||'center'} onChange={v=>upd('style.align',v)} options={['left','center','right']}/></Row>
        </Group>
      </>
    );
  }

  return <Group title="Estilo"><div style={{fontSize:12,color:'var(--fg-3)'}}>Sin opciones adicionales.</div></Group>;
}

// ═══════════════════════════════════════════════════════════
// TAB: ESPACIADO
// ═══════════════════════════════════════════════════════════
function SpacingTab({ block, upd }) {
  const sp = block.data?.spacing || { padding:[0,0,0,0], margin:[0,0,0,0] };
  return (
    <>
      <Group title="Padding interno">
        <SpacingBox label="Padding" value={sp.padding || [0,0,0,0]} onChange={v=>upd('spacing.padding',v)} max={120}/>
      </Group>
      <Group title="Margen externo">
        <SpacingBox label="Margen" value={sp.margin || [0,0,0,0]} onChange={v=>upd('spacing.margin',v)} max={120}/>
      </Group>
      <Group title="Presets">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {[
            {label:'Ninguno', p:[0,0,0,0], m:[0,0,0,0]},
            {label:'Compacto', p:[8,12,8,12], m:[0,0,0,0]},
            {label:'Normal', p:[16,20,16,20], m:[0,0,0,0]},
            {label:'Holgado', p:[32,28,32,28], m:[12,0,12,0]},
            {label:'Sección', p:[40,32,40,32], m:[0,0,0,0]},
            {label:'Ancho completo', p:[24,0,24,0], m:[0,0,0,0]},
          ].map(preset => (
            <button key={preset.label}
              onClick={()=>{upd('spacing.padding',preset.p); upd('spacing.margin',preset.m);}}
              style={{
                padding:'10px 8px',border:'1px solid var(--line)',
                borderRadius:'var(--r-sm)',background:'var(--surface)',
                cursor:'pointer',fontSize:11.5,textAlign:'left',
                display:'flex',flexDirection:'column',gap:3,
              }}>
              <span style={{fontWeight:500}}>{preset.label}</span>
              <span style={{fontSize:10,color:'var(--fg-3)',fontFamily:'var(--font-mono)'}}>
                p {preset.p[0]}/{preset.p[1]}/{preset.p[2]}/{preset.p[3]}
              </span>
            </button>
          ))}
        </div>
      </Group>
    </>
  );
}

Object.assign(window, { BlockProps });
