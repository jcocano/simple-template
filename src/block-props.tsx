// BlockProps — Panel derecho de propiedades por bloque
// 3 pestañas: Contenido · Estilo · Espaciado
// Soporta todos los tipos de bloque: text, heading, image, icon, button, divider, spacer,
//                                     header, footer, product, social

function BlockProps({ block, onChange, onDelete }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const [tab, setTab] = React.useState('content');
  const [imgOpen, setImgOpen] = React.useState(false);
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [countdownTimerOpen, setCountdownTimerOpen] = React.useState(false);

  // Wire custom events from ContentTab deep inputs. Only react when the event's
  // block id matches — prevents cross-block modal opens when multiple are on screen.
  React.useEffect(() => {
    const onOpenMap = (e) => {
      if (!e.detail?.block || e.detail.block.id === block.id) setMapOpen(true);
    };
    const onOpenCountdown = (e) => {
      if (!e.detail?.block || e.detail.block.id === block.id) setCountdownTimerOpen(true);
    };
    window.addEventListener('st:open-map-picker', onOpenMap);
    window.addEventListener('st:open-countdown-timer', onOpenCountdown);
    return () => {
      window.removeEventListener('st:open-map-picker', onOpenMap);
      window.removeEventListener('st:open-countdown-timer', onOpenCountdown);
    };
  }, [block.id]);

  const upd = (path, value) => {
    // path like "style.size" o "content.label" o "spacing.padding"
    // Writes into block.data.{style|content|spacing|mobile|mobileSpacing|hidden}
    //
    // Clearing a device override:
    //   - passing `value === undefined` deletes the key, and if the parent
    //     object becomes empty, the parent is removed too (so `data.mobile`
    //     disappears once the last override is cleared, restoring pure
    //     desktop render).
    const keys = path.split('.');
    const next = JSON.parse(JSON.stringify(block));
    next.data = next.data || {};
    const stack = [next.data];
    let cur = next.data;
    for (let i=0;i<keys.length-1;i++) {
      cur[keys[i]] = cur[keys[i]] || {};
      cur = cur[keys[i]];
      stack.push(cur);
    }
    const leaf = keys[keys.length-1];
    if (value === undefined) {
      delete cur[leaf];
    } else {
      cur[leaf] = value;
    }
    // Prune empty ancestor objects (only parents we just traversed) so
    // clearing the last mobile override fully removes `data.mobile`.
    for (let i = stack.length - 1; i > 0; i--) {
      const obj = stack[i];
      if (obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length === 0) {
        const parent = stack[i-1];
        const key = keys[i-1];
        delete parent[key];
      } else {
        break;
      }
    }
    onChange && onChange(next);
  };

  const s = block.data?.style || {};
  // Backward-compat: merge flat data with nested content
  const { style:_s, content:_c, spacing:_sp, ...flat } = (block.data || {});
  const c = { ...flat, ...(block.data?.content || {}) };
  const sp = block.data?.spacing || { padding:[0,0,0,0], margin:[0,0,0,0] };

  const typeLabelMap = {
    text:'blockProps.type.text', heading:'blockProps.type.heading', image:'blockProps.type.image', icon:'blockProps.type.icon',
    button:'blockProps.type.button', divider:'blockProps.type.divider', spacer:'blockProps.type.spacer',
    header:'blockProps.type.header', footer:'blockProps.type.footer', product:'blockProps.type.product',
    social:'blockProps.type.social', hero:'blockProps.type.hero', html:'blockProps.type.html',
    video:'blockProps.type.video', gif:'blockProps.type.gif', qr:'blockProps.type.qr', countdown:'blockProps.type.countdown',
    testimonial:'blockProps.type.testimonial', signature:'blockProps.type.signature',
    accordion:'blockProps.type.accordion', attachment:'blockProps.type.attachment',
    cart:'blockProps.type.cart', receipt:'blockProps.type.receipt', map:'blockProps.type.map',
  };
  const typeLabel = typeLabelMap[block.type] ? t(typeLabelMap[block.type]) : block.type;

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
        <button className="btn icon sm ghost" title={t('common.duplicate')}><I.duplicate size={12}/></button>
        {(['text','heading','button','footer','hero'].includes(block.type)) && (
          <button className="btn icon sm ghost" title={t('blockProps.improveAi.tooltip')}
            style={{color:'var(--accent)'}}
            onClick={()=>window.dispatchEvent(new CustomEvent('st:improve', {detail:{block}}))}>
            <I.sparkles size={12}/>
          </button>
        )}
        <button className="btn icon sm ghost" onClick={onDelete} title={t('common.delete')}><I.minus size={13}/></button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--line)',padding:'6px 8px 0'}}>
        <PropTab label={t('blockProps.tab.content')} icon="type" active={tab==='content'} onClick={()=>setTab('content')}/>
        <PropTab label={t('blockProps.tab.style')}    icon="paint" active={tab==='style'}   onClick={()=>setTab('style')}/>
        <PropTab label={t('blockProps.tab.spacing')} icon="spacer" active={tab==='spacing'} onClick={()=>setTab('spacing')}/>
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
        onSelect={img => {
          // Build a single patched block so both src and alt land in the
          // same dispatch. Two consecutive upd() calls would race — the
          // second one clones from the still-stale `block` prop and
          // overwrites the first (dropping the src).
          const next = JSON.parse(JSON.stringify(block));
          next.data = next.data || {};
          next.data.content = next.data.content || {};
          if (img.url) next.data.content.src = img.url;
          if (img.name) next.data.content.alt = img.alt || img.name;
          onChange && onChange(next);
        }}/>
      {window.MapPickerModal && (
        <window.MapPickerModal open={mapOpen} onClose={()=>setMapOpen(false)}
          initial={block.data?.content || {}}
          onSave={(result) => {
            const next = JSON.parse(JSON.stringify(block));
            next.data = next.data || {};
            next.data.content = { ...(next.data.content||{}), ...result };
            onChange && onChange(next);
          }}/>
      )}
      {window.CountdownTimerModal && (
        <window.CountdownTimerModal open={countdownTimerOpen} onClose={()=>setCountdownTimerOpen(false)}
          initial={block.data?.content || {}}
          onSave={(result) => {
            const next = JSON.parse(JSON.stringify(block));
            next.data = next.data || {};
            next.data.content = { ...(next.data.content||{}), ...result, mode:'live' };
            onChange && onChange(next);
          }}/>
      )}
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
    video:'image', gif:'image', qr:'grid', countdown:'clock',
    testimonial:'star', signature:'user',
    accordion:'layers', attachment:'download',
    cart:'product', receipt:'product', map:'folder',
  };
  const Ico = I[map[type] || 'square'];
  return Ico ? <Ico size={14}/> : null;
}

// ═══════════════════════════════════════════════════════════
// TAB: CONTENIDO
// ═══════════════════════════════════════════════════════════
function ContentTab({ block, upd, onPickImage, onPickEmoji, emojiOpen }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const { style:_s, content:_c, spacing:_sp, ...flat } = block.data||{};
  const c = { ...flat, ...(block.data?.content || {}) };
  const bt = block.type;

  if (bt==='text') {
    return (
      <Group title={t('blockProps.type.text')}>
        <Row label={t('blockProps.field.body')}>
          <textarea className="field" rows={5} value={c.body||''}
            onChange={e=>upd('content.body', e.target.value)}
            style={{fontFamily:'inherit',resize:'vertical',padding:8}}
            placeholder={t('blockProps.placeholder.paragraph')}/>
        </Row>
        <Row label={t('blockProps.field.linkColor')}><ColorInput value={block.data?.style?.linkColor||'#5b5bf0'} onChange={v=>upd('style.linkColor',v)}/></Row>
      </Group>
    );
  }

  if (bt==='heading') {
    return (
      <Group title={t('blockProps.type.heading')}>
        <Row label={t('blockProps.field.text')}><input className="field" value={c.text||''} onChange={e=>upd('content.text',e.target.value)}/></Row>
        <Row label={t('blockProps.field.level')}>
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

  if (bt==='image') {
    return (
      <Group title={t('blockProps.type.image')}>
        <Row label={t('blockProps.field.source')}>
          <button className="field" onClick={onPickImage}
            style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {c.image || t('blockProps.image.pickFromLibrary')}
            </span>
          </button>
        </Row>
        <Row label={t('blockProps.field.altText')}><input className="field" value={c.alt||''} onChange={e=>upd('content.alt',e.target.value)} placeholder={t('blockProps.placeholder.altText')}/></Row>
        <Row label={t('blockProps.field.linkUrl')}><input className="field" value={c.url||''} onChange={e=>upd('content.url',e.target.value)} placeholder="https://…"/></Row>
      </Group>
    );
  }

  if (bt==='icon') {
    const mode = block.data?.style?.mode || 'icon';
    return (
      <>
        <Group title={t('blockProps.tab.content')}>
          <Row label={t('blockProps.field.mode')}>
            <div className="seg">
              <button className={mode==='icon'?'on':''} onClick={()=>upd('style.mode','icon')}>{t('blockProps.icon.modeIconOnly')}</button>
              <button className={mode==='icon-text'?'on':''} onClick={()=>upd('style.mode','icon-text')}>{t('blockProps.icon.modeIconText')}</button>
              <button className={mode==='text'?'on':''} onClick={()=>upd('style.mode','text')}>{t('blockProps.icon.modeTextOnly')}</button>
            </div>
          </Row>
          {mode!=='text' && (
            <Row label={t('blockProps.field.emoji')}>
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
            <Row label={t('blockProps.field.text')}>
              <input className="field" value={c.text||''} onChange={e=>upd('content.text',e.target.value)} placeholder={t('blockProps.placeholder.label')}/>
            </Row>
          )}
        </Group>
      </>
    );
  }

  if (bt==='button') {
    return (
      <Group title={t('blockProps.type.button')}>
        <Row label={t('blockProps.field.text')}><input className="field" value={c.label||''} onChange={e=>upd('content.label',e.target.value)}/></Row>
        <Row label={t('blockProps.field.url')}><input className="field" value={c.url||''} onChange={e=>upd('content.url',e.target.value)} placeholder="https://…"/></Row>
        <Row label={t('blockProps.field.newTab')}>
          <Toggle value={c.newTab} onChange={v=>upd('content.newTab',v)}/>
        </Row>
      </Group>
    );
  }

  if (bt==='divider') {
    return <Group title={t('blockProps.type.divider')}><div style={{fontSize:12,color:'var(--fg-3)'}}>{t('blockProps.divider.note')}</div></Group>;
  }

  if (bt==='spacer') {
    return <Group title={t('blockProps.type.spacer')}><div style={{fontSize:12,color:'var(--fg-3)'}}>{t('blockProps.spacer.note')}</div></Group>;
  }

  if (bt==='header') {
    return (
      <Group title={t('blockProps.type.header')}>
        <Row label={t('blockProps.field.brand')}><input className="field" value={c.brand||''} onChange={e=>upd('content.brand',e.target.value)}/></Row>
        <Row label={t('blockProps.field.sub')}><input className="field" value={c.sub||''} onChange={e=>upd('content.sub',e.target.value)} placeholder={t('blockProps.placeholder.subHeader')}/></Row>
        <Row label={t('blockProps.field.logo')}>
          <button className="field" onClick={onPickImage}
            style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {c.logo || t('common.select')}
            </span>
          </button>
        </Row>
      </Group>
    );
  }

  if (bt==='footer') {
    return (
      <Group title={t('blockProps.type.footer')}>
        <Row label={t('blockProps.field.company')}><input className="field" value={c.company||''} onChange={e=>upd('content.company',e.target.value)}/></Row>
        <Row label={t('blockProps.field.notice')}><textarea className="field" rows={2} value={c.notice||''} onChange={e=>upd('content.notice',e.target.value)}/></Row>
        <Row label={t('blockProps.field.unsubUrl')}><input className="field" value={c.unsubUrl||''} onChange={e=>upd('content.unsubUrl',e.target.value)}/></Row>
        <Row label={t('blockProps.field.unsubLabel')}><input className="field" value={c.unsubLabel||''} onChange={e=>upd('content.unsubLabel',e.target.value)}/></Row>
      </Group>
    );
  }

  if (bt==='product') {
    return (
      <Group title={t('blockProps.type.product')}>
        <Row label={t('blockProps.field.name')}><input className="field" value={c.name||''} onChange={e=>upd('content.name',e.target.value)}/></Row>
        <Row label={t('blockProps.field.price')}><input className="field" value={c.price||''} onChange={e=>upd('content.price',e.target.value)}/></Row>
        <Row label={t('blockProps.field.description')}><textarea className="field" rows={2} value={c.desc||''} onChange={e=>upd('content.desc',e.target.value)}/></Row>
        <Row label={t('blockProps.type.image')}>
          <button className="field" onClick={onPickImage} style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/><span>{c.image || t('common.select')}</span>
          </button>
        </Row>
        <Row label={t('blockProps.field.ctaUrl')}><input className="field" value={c.url||''} onChange={e=>upd('content.url',e.target.value)}/></Row>
      </Group>
    );
  }

  if (bt==='social') {
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
      <Group title={t('blockProps.type.social')}>
        {networks.map(n => (
          <Row key={n.id} label={n.name}>
            <Toggle value={active.includes(n.id)} onChange={()=>toggle(n.id)}/>
          </Row>
        ))}
      </Group>
    );
  }

  if (bt==='html') {
    return (
      <Group title={t('blockProps.type.html')}>
        <div style={{fontSize:11.5,color:'var(--fg-3)',lineHeight:1.55,marginBottom:10}}>
          {t('blockProps.html.intro')}
        </div>
        <Row label={t('blockProps.field.htmlCode')}>
          <textarea className="field" rows={10}
            value={c.code||''}
            onChange={e=>upd('content.code',e.target.value)}
            style={{fontFamily:'var(--font-mono)',fontSize:11.5,lineHeight:1.55,resize:'vertical',padding:10,whiteSpace:'pre'}}
            placeholder={'<div style="padding:20px;text-align:center;">\n  Mi HTML personalizado\n</div>'}/>
        </Row>
        <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
          <span style={{color:'var(--warn, #b45309)',flexShrink:0,marginTop:1}}>⚠</span>
          <span>{t('blockProps.html.warningStart')} <code style={{fontFamily:'var(--font-mono)',fontSize:10.5,background:'var(--surface)',padding:'0 4px',borderRadius:3}}>&lt;script&gt;</code>, <code style={{fontFamily:'var(--font-mono)',fontSize:10.5,background:'var(--surface)',padding:'0 4px',borderRadius:3}}>position:fixed</code> {t('blockProps.html.warningEnd')}</span>
        </div>
      </Group>
    );
  }

  if (bt==='video') {
    const info = (window.parseVideoUrl ? window.parseVideoUrl(c.videoUrl||'') : {provider:'custom'});
    const providerLabel = info.provider==='youtube' ? 'YouTube' : info.provider==='vimeo' ? 'Vimeo' : t('blockProps.video.providerCustom');
    return (
      <Group title={t('blockProps.type.video')}>
        <Row label={t('blockProps.field.videoUrl')}>
          <input className="field" value={c.videoUrl||''}
            onChange={e=>upd('content.videoUrl',e.target.value)}
            placeholder="https://youtube.com/watch?v=… / https://vimeo.com/…"/>
        </Row>
        {c.videoUrl && (
          <div style={{fontSize:11,color:'var(--fg-3)',marginTop:-4,marginBottom:6}}>
            {t('blockProps.video.detected', {provider:providerLabel})}
          </div>
        )}
        <Row label={t('blockProps.field.thumbnail')}>
          <button className="field" onClick={onPickImage}
            style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {c.thumbnail || (info.autoThumb
                ? t('blockProps.video.autoThumb')
                : t('blockProps.video.pickThumb'))}
            </span>
          </button>
        </Row>
        <Row label={t('blockProps.field.caption')}>
          <input className="field" value={c.caption||''}
            onChange={e=>upd('content.caption',e.target.value)}
            placeholder={t('blockProps.placeholder.caption')}/>
        </Row>
        <Row label={t('blockProps.field.linkUrl')}>
          <input className="field" value={c.url||''}
            onChange={e=>upd('content.url',e.target.value)}
            placeholder={t('blockProps.video.linkHint')}/>
        </Row>
        <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
          <span style={{color:'var(--accent)',flexShrink:0,marginTop:1}}>ℹ</span>
          <span>{t('blockProps.video.emailNote')}</span>
        </div>
      </Group>
    );
  }

  if (bt==='gif') {
    return (
      <Group title={t('blockProps.type.gif')}>
        <Row label={t('blockProps.field.source')}>
          <button className="field" onClick={onPickImage}
            style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {c.src || t('blockProps.gif.pickFromLibrary')}
            </span>
          </button>
        </Row>
        <Row label={t('blockProps.field.altText')}>
          <input className="field" value={c.alt||''}
            onChange={e=>upd('content.alt',e.target.value)}
            placeholder={t('blockProps.placeholder.altText')}/>
        </Row>
        <Row label={t('blockProps.field.linkUrl')}>
          <input className="field" value={c.url||''}
            onChange={e=>upd('content.url',e.target.value)} placeholder="https://…"/>
        </Row>
        <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
          <span style={{color:'var(--warn, #b45309)',flexShrink:0,marginTop:1}}>⚠</span>
          <span>{t('blockProps.gif.outlookNote')}</span>
        </div>
      </Group>
    );
  }

  if (bt==='qr') {
    return (
      <Group title={t('blockProps.type.qr')}>
        <Row label={t('blockProps.field.qrContent')}>
          <textarea className="field" rows={3}
            value={c.qrContent||''}
            onChange={e=>upd('content.qrContent',e.target.value)}
            placeholder="https://example.com / +52 555 / WIFI:S:...;P:...;;"/>
        </Row>
        <Row label={t('blockProps.field.caption')}>
          <input className="field" value={c.caption||''}
            onChange={e=>upd('content.caption',e.target.value)}
            placeholder={t('blockProps.qr.captionPlaceholder')}/>
        </Row>
        <div style={{fontSize:11,color:'var(--fg-3)',lineHeight:1.5,marginTop:6}}>
          {t('blockProps.qr.intro')}
        </div>
      </Group>
    );
  }

  if (bt==='testimonial') {
    const rating = parseInt(c.rating) || 0;
    return (
      <Group title={t('blockProps.type.testimonial')}>
        <Row label={t('blockProps.field.quote')}>
          <textarea className="field" rows={3} value={c.quote||''}
            onChange={e=>upd('content.quote',e.target.value)}
            style={{fontFamily:'inherit',resize:'vertical',padding:8}}
            placeholder={t('blockProps.placeholder.quote')}/>
        </Row>
        <Row label={t('blockProps.field.rating')}>
          <div className="seg">
            {[0,1,2,3,4,5].map(n => (
              <button key={n} className={rating===n?'on':''}
                onClick={()=>upd('content.rating',n)}>{n===0?'—':n}</button>
            ))}
          </div>
        </Row>
        <Row label={t('blockProps.field.name')}>
          <input className="field" value={c.name||''}
            onChange={e=>upd('content.name',e.target.value)}
            placeholder={t('blockProps.placeholder.personName')}/>
        </Row>
        <Row label={t('blockProps.field.role')}>
          <input className="field" value={c.role||''}
            onChange={e=>upd('content.role',e.target.value)}
            placeholder={t('blockProps.placeholder.role')}/>
        </Row>
        <Row label={t('blockProps.field.company')}>
          <input className="field" value={c.company||''}
            onChange={e=>upd('content.company',e.target.value)}
            placeholder={t('blockProps.placeholder.company')}/>
        </Row>
        <Row label={t('blockProps.field.avatar')}>
          <button className="field" onClick={onPickImage}
            style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
            <I.image size={13}/>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {c.avatar || t('blockProps.testimonial.pickAvatar')}
            </span>
          </button>
        </Row>
      </Group>
    );
  }

  if (bt==='signature') {
    const socials = Array.isArray(c.socials) ? c.socials : [];
    const nets = window.SIG_SOCIAL_NETS || [];
    const setSocials = (next) => upd('content.socials', next);
    const addSocial = () => {
      const used = new Set(socials.map(s=>s.type));
      const next = nets.find(n => !used.has(n.id)) || nets[0];
      if (next) setSocials([...socials, {type:next.id, url:''}]);
    };
    return (
      <>
        <Group title={t('blockProps.type.signature')}>
          <Row label={t('blockProps.field.avatar')}>
            <button className="field" onClick={onPickImage}
              style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              <I.image size={13}/>
              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
                {c.avatar || t('blockProps.signature.pickAvatar')}
              </span>
            </button>
          </Row>
          <Row label={t('blockProps.field.name')}>
            <input className="field" value={c.name||''}
              onChange={e=>upd('content.name',e.target.value)}
              placeholder={t('blockProps.placeholder.personName')}/>
          </Row>
          <Row label={t('blockProps.field.title')}>
            <input className="field" value={c.title||''}
              onChange={e=>upd('content.title',e.target.value)}
              placeholder={t('blockProps.placeholder.jobTitle')}/>
          </Row>
          <Row label={t('blockProps.field.company')}>
            <input className="field" value={c.company||''}
              onChange={e=>upd('content.company',e.target.value)}
              placeholder={t('blockProps.placeholder.company')}/>
          </Row>
          <Row label={t('blockProps.field.email')}>
            <input className="field" type="email" value={c.email||''}
              onChange={e=>upd('content.email',e.target.value)}
              placeholder="you@acme.com"/>
          </Row>
          <Row label={t('blockProps.field.phone')}>
            <input className="field" type="tel" value={c.phone||''}
              onChange={e=>upd('content.phone',e.target.value)}
              placeholder="+1 555 0123"/>
          </Row>
        </Group>
        <Group title={t('blockProps.group.socials')}>
          {socials.length===0 && (
            <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8}}>
              {t('blockProps.signature.noSocials')}
            </div>
          )}
          {socials.map((sc, i) => (
            <div key={i} style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
              <select className="field" value={sc.type||nets[0]?.id||'li'} style={{flex:'0 0 120px'}}
                onChange={e=>{
                  const next = socials.slice();
                  next[i] = {...sc, type:e.target.value};
                  setSocials(next);
                }}>
                {nets.map(n => (
                  <option key={n.id} value={n.id}>{t(n.nameKey)}</option>
                ))}
              </select>
              <input className="field" value={sc.url||''} style={{flex:1,minWidth:0}}
                placeholder="https://…"
                onChange={e=>{
                  const next = socials.slice();
                  next[i] = {...sc, url:e.target.value};
                  setSocials(next);
                }}/>
              <button className="btn icon sm ghost" title={t('common.delete')}
                onClick={()=>{
                  const next = socials.slice();
                  next.splice(i,1);
                  setSocials(next);
                }}>
                <I.minus size={13}/>
              </button>
            </div>
          ))}
          <button className="btn sm" style={{marginTop:4}}
            onClick={addSocial}
            disabled={socials.length >= nets.length}>
            <I.plus size={12}/> {t('blockProps.signature.addSocial')}
          </button>
        </Group>
      </>
    );
  }

  if (bt==='countdown') {
    const lang = window.stI18n?.getLang ? window.stI18n.getLang() : 'en';
    const defs = (window.defaultCountdownLabels ? window.defaultCountdownLabels(lang) : {template:'',singular:'',zero:'',expired:''});
    const dateLocal = c.targetDate ? c.targetDate.slice(0,16) : '';
    const mode = c.mode || 'static';
    const liveHost = window.hostFromUrl ? window.hostFromUrl(c.imageUrl || '') : '';
    return (
      <>
        <Group title={t('blockProps.type.countdown')}>
          <Row label={t('blockProps.field.countdownMode')}>
            <div className="seg">
              <button className={mode==='static'?'on':''} onClick={()=>upd('content.mode','static')}>{t('blockProps.countdown.modeStatic')}</button>
              <button className={mode==='live'?'on':''} onClick={()=>upd('content.mode','live')}>{t('blockProps.countdown.modeLive')}</button>
            </div>
          </Row>
        </Group>
        {mode === 'static' && (
          <Group title={t('blockProps.countdown.groupStatic')}>
            <Row label={t('blockProps.field.targetDate')}>
              <input className="field" type="datetime-local" value={dateLocal}
                onChange={e=>{
                  const v = e.target.value;
                  upd('content.targetDate', v ? new Date(v).toISOString() : '');
                }}/>
            </Row>
            <Row label={t('blockProps.field.labelTemplate')}>
              <input className="field" value={c.template||''}
                onChange={e=>upd('content.template',e.target.value)}
                placeholder={defs.template}/>
            </Row>
            <Row label={t('blockProps.field.labelSingular')}>
              <input className="field" value={c.singular||''}
                onChange={e=>upd('content.singular',e.target.value)}
                placeholder={defs.singular}/>
            </Row>
            <Row label={t('blockProps.field.labelZero')}>
              <input className="field" value={c.zero||''}
                onChange={e=>upd('content.zero',e.target.value)}
                placeholder={defs.zero}/>
            </Row>
            <Row label={t('blockProps.field.labelExpired')}>
              <input className="field" value={c.expired||''}
                onChange={e=>upd('content.expired',e.target.value)}
                placeholder={defs.expired}/>
            </Row>
            <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
              <span style={{color:'var(--warn, #b45309)',flexShrink:0,marginTop:1}}>⚠</span>
              <span>{t('blockProps.countdown.frozenWarning')}</span>
            </div>
          </Group>
        )}
        {mode === 'live' && (
          <Group title={t('blockProps.countdown.groupLive')}>
            <Row label={t('blockProps.field.liveImage')}>
              <button className="field"
                onClick={()=>window.dispatchEvent(new CustomEvent('st:open-countdown-timer', {detail:{block}}))}
                style={{textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                <I.clock size={13}/>
                <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
                  {c.imageUrl
                    ? (liveHost || t('blockProps.countdown.editTimer'))
                    : t('blockProps.countdown.configureTimer')}
                </span>
              </button>
            </Row>
            {c.imageUrl && (
              <>
                <Row label={t('blockProps.field.altText')}>
                  <input className="field" value={c.alt||''}
                    onChange={e=>upd('content.alt',e.target.value)}
                    placeholder={t('blockProps.placeholder.altText')}/>
                </Row>
                <Row label={t('blockProps.field.fallbackText')}>
                  <input className="field" value={c.fallbackText||''}
                    onChange={e=>upd('content.fallbackText',e.target.value)}
                    placeholder={t('blockProps.placeholder.fallbackText')}/>
                </Row>
                <Row label={t('blockProps.field.linkUrl')}>
                  <input className="field" value={c.linkUrl||''}
                    onChange={e=>upd('content.linkUrl',e.target.value)}
                    placeholder="https://…"/>
                </Row>
                <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
                  <span style={{color:'var(--warn, #b45309)',flexShrink:0,marginTop:1}}>⚠</span>
                  <span>{t('warning.countdown.externalService', {host: liveHost || '—'})}</span>
                </div>
              </>
            )}
          </Group>
        )}
      </>
    );
  }

  if (bt==='accordion') {
    const items = Array.isArray(c.items) ? c.items : [];
    const setItems = (next) => upd('content.items', next);
    const addItem = () => setItems([...items, { title: '', body: '' }]);
    const updItem = (i, patch) => {
      const next = items.slice();
      next[i] = { ...next[i], ...patch };
      setItems(next);
    };
    const moveItem = (i, dir) => {
      const j = i + dir;
      if (j < 0 || j >= items.length) return;
      const next = items.slice();
      [next[i], next[j]] = [next[j], next[i]];
      setItems(next);
    };
    const removeItem = (i) => {
      const next = items.slice();
      next.splice(i, 1);
      setItems(next);
    };
    return (
      <Group title={t('blockProps.type.accordion')}>
        {items.length === 0 && (
          <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8}}>
            {t('blockProps.accordion.empty')}
          </div>
        )}
        {items.map((it, i) => (
          <div key={i} style={{
            border:'1px solid var(--line)', borderRadius:'var(--r-sm)',
            padding:10, marginBottom:8, background:'var(--surface-2)',
          }}>
            <div style={{display:'flex',gap:4,marginBottom:8,alignItems:'center'}}>
              <span style={{fontSize:11,color:'var(--fg-3)',flex:1,fontWeight:500}}>
                {t('blockProps.accordion.itemN', {n: i+1})}
              </span>
              <button className="btn icon sm ghost" title={t('common.moveUp')}
                onClick={()=>moveItem(i,-1)} disabled={i===0}>
                <I.chevronD size={11} style={{transform:'rotate(180deg)'}}/>
              </button>
              <button className="btn icon sm ghost" title={t('common.moveDown')}
                onClick={()=>moveItem(i,1)} disabled={i===items.length-1}>
                <I.chevronD size={11}/>
              </button>
              <button className="btn icon sm ghost" title={t('common.delete')}
                onClick={()=>removeItem(i)}><I.minus size={12}/></button>
            </div>
            <input className="field" value={it.title||''}
              placeholder={t('blockProps.accordion.titlePlaceholder')}
              onChange={e=>updItem(i,{title:e.target.value})}
              style={{marginBottom:6}}/>
            <textarea className="field" rows={3} value={it.body||''}
              placeholder={t('blockProps.accordion.bodyPlaceholder')}
              onChange={e=>updItem(i,{body:e.target.value})}
              style={{fontFamily:'inherit',resize:'vertical',padding:8}}/>
          </div>
        ))}
        <button className="btn sm" onClick={addItem} style={{marginTop:4}}>
          <I.plus size={12}/> {t('blockProps.accordion.addItem')}
        </button>
        <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
          <span style={{color:'var(--accent)',flexShrink:0,marginTop:1}}>ℹ</span>
          <span>{t('blockProps.accordion.alwaysExpandedNote')}</span>
        </div>
      </Group>
    );
  }

  if (bt==='attachment') {
    const ext = (c.ext || (window.guessExt ? window.guessExt(c.filename||'') : ''));
    return (
      <Group title={t('blockProps.type.attachment')}>
        <Row label={t('blockProps.field.fileUrl')}>
          <input className="field" value={c.fileUrl||''}
            onChange={e=>upd('content.fileUrl',e.target.value)}
            placeholder="https://…"/>
        </Row>
        <Row label={t('blockProps.field.filename')}>
          <input className="field" value={c.filename||''}
            onChange={e=>{
              const v = e.target.value;
              upd('content.filename', v);
              // Auto-fill ext if we can derive one and user hasn't set their own.
              if (!c.ext) {
                const derived = window.guessExt ? window.guessExt(v) : '';
                if (derived) upd('content.ext', derived);
              }
            }}
            placeholder="report-q4.pdf"/>
        </Row>
        <Row label={t('blockProps.field.fileExt')}>
          <input className="field" value={ext||''}
            onChange={e=>upd('content.ext', e.target.value.toLowerCase())}
            placeholder="pdf"/>
        </Row>
        <Row label={t('blockProps.field.fileSize')}>
          <input className="field" value={c.size||''}
            onChange={e=>upd('content.size',e.target.value)}
            placeholder="2.4 MB"/>
        </Row>
        <Row label={t('blockProps.field.ctaLabel')}>
          <input className="field" value={c.ctaLabel||''}
            onChange={e=>upd('content.ctaLabel',e.target.value)}
            placeholder={t('blockProps.placeholder.downloadCta')}/>
        </Row>
        <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
          <span style={{color:'var(--accent)',flexShrink:0,marginTop:1}}>ℹ</span>
          <span>{t('blockProps.attachment.note')}</span>
        </div>
      </Group>
    );
  }

  if (bt==='cart') {
    const items = Array.isArray(c.items) ? c.items : [];
    const setItems = (next) => upd('content.items', next);
    const addItem = () => setItems([...items, { name:'', image:'', price:'', qty:1 }]);
    const updItem = (i, patch) => {
      const next = items.slice();
      next[i] = { ...next[i], ...patch };
      setItems(next);
    };
    const moveItem = (i, dir) => {
      const j = i+dir;
      if (j<0 || j>=items.length) return;
      const next = items.slice();
      [next[i], next[j]] = [next[j], next[i]];
      setItems(next);
    };
    const removeItem = (i) => {
      const next = items.slice();
      next.splice(i,1);
      setItems(next);
    };
    return (
      <>
        <Group title={t('blockProps.group.cartItems')}>
          {items.length===0 && (
            <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8}}>
              {t('blockProps.cart.empty')}
            </div>
          )}
          {items.map((it, i) => (
            <div key={i} style={{
              border:'1px solid var(--line)', borderRadius:'var(--r-sm)',
              padding:10, marginBottom:8, background:'var(--surface-2)',
            }}>
              <div style={{display:'flex',gap:4,marginBottom:8,alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--fg-3)',flex:1,fontWeight:500}}>
                  {t('blockProps.cart.itemN',{n:i+1})}
                </span>
                <button className="btn icon sm ghost" title={t('common.moveUp')}
                  onClick={()=>moveItem(i,-1)} disabled={i===0}><I.arrowUp size={11}/></button>
                <button className="btn icon sm ghost" title={t('common.moveDown')}
                  onClick={()=>moveItem(i,1)} disabled={i===items.length-1}><I.arrowDown size={11}/></button>
                <button className="btn icon sm ghost" title={t('common.delete')}
                  onClick={()=>removeItem(i)}><I.minus size={12}/></button>
              </div>
              <input className="field" value={it.name||''}
                placeholder={t('blockProps.placeholder.itemName')}
                onChange={e=>updItem(i,{name:e.target.value})}
                style={{marginBottom:6}}/>
              <input className="field" value={it.image||''}
                placeholder={t('blockProps.placeholder.itemImageUrl')}
                onChange={e=>updItem(i,{image:e.target.value})}
                style={{marginBottom:6}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:6}}>
                <input className="field" value={it.price||''}
                  placeholder={t('blockProps.placeholder.itemPrice')}
                  onChange={e=>updItem(i,{price:e.target.value})}/>
                <input className="field" value={it.qty==null?'':it.qty}
                  placeholder={t('blockProps.placeholder.itemQty')}
                  onChange={e=>updItem(i,{qty:e.target.value})}/>
              </div>
            </div>
          ))}
          <button className="btn sm" onClick={addItem} style={{marginTop:4}}>
            <I.plus size={12}/> {t('blockProps.cart.addItem')}
          </button>
        </Group>
        <Group title={t('blockProps.group.cartTotals')}>
          <Row label={t('blockProps.field.currency')}>
            <input className="field" value={c.currency||''}
              onChange={e=>upd('content.currency',e.target.value.toUpperCase())}
              placeholder="USD / EUR / MXN"/>
          </Row>
          <Row label={t('blockProps.field.subtotal')}>
            <input className="field" value={c.subtotal==null?'':c.subtotal}
              onChange={e=>upd('content.subtotal',e.target.value)}
              placeholder="0"/>
          </Row>
          <Row label={t('blockProps.field.shipping')}>
            <input className="field" value={c.shipping==null?'':c.shipping}
              onChange={e=>upd('content.shipping',e.target.value)}
              placeholder="0"/>
          </Row>
          <Row label={t('blockProps.field.tax')}>
            <input className="field" value={c.tax==null?'':c.tax}
              onChange={e=>upd('content.tax',e.target.value)}
              placeholder="0"/>
          </Row>
          <Row label={t('blockProps.field.total')}>
            <input className="field" value={c.total==null?'':c.total}
              onChange={e=>upd('content.total',e.target.value)}
              placeholder="0"/>
          </Row>
        </Group>
        <Group title={t('blockProps.group.cta')}>
          <Row label={t('blockProps.field.ctaUrl')}>
            <input className="field" value={c.ctaUrl||''}
              onChange={e=>upd('content.ctaUrl',e.target.value)}
              placeholder="https://…"/>
          </Row>
          <Row label={t('blockProps.field.ctaLabel')}>
            <input className="field" value={c.ctaLabel||''}
              onChange={e=>upd('content.ctaLabel',e.target.value)}
              placeholder={t('blockProps.placeholder.ctaCheckout')}/>
          </Row>
        </Group>
      </>
    );
  }

  if (bt==='receipt') {
    const items = Array.isArray(c.items) ? c.items : [];
    const setItems = (next) => upd('content.items', next);
    const addItem = () => setItems([...items, { name:'', qty:1, price:'' }]);
    const updItem = (i, patch) => {
      const next = items.slice();
      next[i] = { ...next[i], ...patch };
      setItems(next);
    };
    const moveItem = (i, dir) => {
      const j = i+dir;
      if (j<0 || j>=items.length) return;
      const next = items.slice();
      [next[i], next[j]] = [next[j], next[i]];
      setItems(next);
    };
    const removeItem = (i) => {
      const next = items.slice();
      next.splice(i,1);
      setItems(next);
    };
    return (
      <>
        <Group title={t('blockProps.group.orderInfo')}>
          <Row label={t('blockProps.field.orderNumber')}>
            <input className="field" value={c.orderNumber||''}
              onChange={e=>upd('content.orderNumber',e.target.value)}
              placeholder="A-4821"/>
          </Row>
          <Row label={t('blockProps.field.orderDate')}>
            <input className="field" value={c.orderDate||''}
              onChange={e=>upd('content.orderDate',e.target.value)}
              placeholder={t('blockProps.placeholder.orderDate')}/>
          </Row>
          <Row label={t('blockProps.field.customerName')}>
            <input className="field" value={c.customerName||''}
              onChange={e=>upd('content.customerName',e.target.value)}
              placeholder={t('blockProps.placeholder.personName')}/>
          </Row>
          <Row label={t('blockProps.field.address')}>
            <textarea className="field" rows={2} value={c.address||''}
              onChange={e=>upd('content.address',e.target.value)}
              placeholder={t('blockProps.placeholder.address')}
              style={{fontFamily:'inherit',resize:'vertical',padding:8}}/>
          </Row>
        </Group>
        <Group title={t('blockProps.group.receiptItems')}>
          {items.length===0 && (
            <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8}}>
              {t('blockProps.receipt.empty')}
            </div>
          )}
          {items.map((it, i) => (
            <div key={i} style={{
              border:'1px solid var(--line)', borderRadius:'var(--r-sm)',
              padding:10, marginBottom:8, background:'var(--surface-2)',
            }}>
              <div style={{display:'flex',gap:4,marginBottom:8,alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--fg-3)',flex:1,fontWeight:500}}>
                  {t('blockProps.receipt.itemN',{n:i+1})}
                </span>
                <button className="btn icon sm ghost" title={t('common.moveUp')}
                  onClick={()=>moveItem(i,-1)} disabled={i===0}><I.arrowUp size={11}/></button>
                <button className="btn icon sm ghost" title={t('common.moveDown')}
                  onClick={()=>moveItem(i,1)} disabled={i===items.length-1}><I.arrowDown size={11}/></button>
                <button className="btn icon sm ghost" title={t('common.delete')}
                  onClick={()=>removeItem(i)}><I.minus size={12}/></button>
              </div>
              <input className="field" value={it.name||''}
                placeholder={t('blockProps.placeholder.itemName')}
                onChange={e=>updItem(i,{name:e.target.value})}
                style={{marginBottom:6}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:6}}>
                <input className="field" value={it.price||''}
                  placeholder={t('blockProps.placeholder.itemPrice')}
                  onChange={e=>updItem(i,{price:e.target.value})}/>
                <input className="field" value={it.qty==null?'':it.qty}
                  placeholder={t('blockProps.placeholder.itemQty')}
                  onChange={e=>updItem(i,{qty:e.target.value})}/>
              </div>
            </div>
          ))}
          <button className="btn sm" onClick={addItem} style={{marginTop:4}}>
            <I.plus size={12}/> {t('blockProps.receipt.addItem')}
          </button>
        </Group>
        <Group title={t('blockProps.group.cartTotals')}>
          <Row label={t('blockProps.field.currency')}>
            <input className="field" value={c.currency||''}
              onChange={e=>upd('content.currency',e.target.value.toUpperCase())}
              placeholder="USD / EUR / MXN"/>
          </Row>
          <Row label={t('blockProps.field.subtotal')}>
            <input className="field" value={c.subtotal==null?'':c.subtotal}
              onChange={e=>upd('content.subtotal',e.target.value)}
              placeholder="0"/>
          </Row>
          <Row label={t('blockProps.field.tax')}>
            <input className="field" value={c.tax==null?'':c.tax}
              onChange={e=>upd('content.tax',e.target.value)}
              placeholder="0"/>
          </Row>
          <Row label={t('blockProps.field.total')}>
            <input className="field" value={c.total==null?'':c.total}
              onChange={e=>upd('content.total',e.target.value)}
              placeholder="0"/>
          </Row>
        </Group>
        <Group title={t('blockProps.group.cta')}>
          <Row label={t('blockProps.field.ctaUrl')}>
            <input className="field" value={c.ctaUrl||''}
              onChange={e=>upd('content.ctaUrl',e.target.value)}
              placeholder="https://…"/>
          </Row>
          <Row label={t('blockProps.field.ctaLabel')}>
            <input className="field" value={c.ctaLabel||''}
              onChange={e=>upd('content.ctaLabel',e.target.value)}
              placeholder={t('blockProps.placeholder.ctaViewOrder')}/>
          </Row>
        </Group>
      </>
    );
  }

  if (bt==='map') {
    const thumb = c.imageUrl;
    return (
      <Group title={t('blockProps.type.map')}>
        <button className="btn" style={{width:'100%',marginBottom:10,justifyContent:'center'}}
          onClick={()=>window.dispatchEvent(new CustomEvent('st:open-map-picker', {detail:{block}}))}>
          <I.folder size={13}/> {c.imageUrl ? t('blockProps.map.editMap') : t('blockProps.map.configureMap')}
        </button>
        {thumb && (
          <div style={{
            border:'1px solid var(--line)', borderRadius:'var(--r-sm)',
            overflow:'hidden', marginBottom:10, background:'var(--surface-2)',
          }}>
            <img src={thumb} alt={c.label||c.address||''}
              style={{display:'block',width:'100%',height:'auto',maxHeight:140,objectFit:'cover'}}/>
          </div>
        )}
        {c.address && (
          <div style={{fontSize:12,color:'var(--fg-2)',marginBottom:6,lineHeight:1.4}}>
            {c.address}
          </div>
        )}
        <Row label={t('blockProps.field.mapLabel')}>
          <input className="field" value={c.label||''}
            onChange={e=>upd('content.label',e.target.value)}
            placeholder={t('blockProps.placeholder.mapLabel')}/>
        </Row>
        <Row label={t('blockProps.field.destinationUrl')}>
          <input className="field" value={c.destinationUrl||''}
            onChange={e=>upd('content.destinationUrl',e.target.value)}
            placeholder="https://maps.google.com/…"/>
        </Row>
        <div style={{marginTop:10,padding:10,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5,display:'flex',gap:8}}>
          <span style={{color:'var(--accent)',flexShrink:0,marginTop:1}}>ℹ</span>
          <span>{t('blockProps.map.note')}</span>
        </div>
      </Group>
    );
  }

  return <Group title={t('blockProps.tab.content')}><div style={{fontSize:12,color:'var(--fg-3)'}}>{t('blockProps.content.none')}</div></Group>;
}

// ═══════════════════════════════════════════════════════════
// TAB: ESTILO
// ═══════════════════════════════════════════════════════════
// Tri-state pill identical in behavior to the section-level HideOnPill.
// Kept local to avoid crossing module boundaries and to let us customize
// tooltips via i18n keys under blockProps.hideOn.*.
function BlockHideOnPill({ hidden, onChange }) {
  const t = window.stI18n.t;
  const state = hidden?.desktop ? 'desktop' : hidden?.mobile ? 'mobile' : 'none';
  const set = (next) => {
    if (next === 'none') onChange(undefined);
    else if (next === 'desktop') onChange({ desktop: true });
    else onChange({ mobile: true });
  };
  return (
    <div className="seg" style={{ width:'100%' }}>
      <button className={state==='none'?'on':''} onClick={()=>set('none')}
        title={t('blockProps.hideOn.tooltip.none')}>
        {t('blockProps.hideOn.none')}
      </button>
      <button className={state==='desktop'?'on':''} onClick={()=>set('desktop')}
        title={t('blockProps.hideOn.tooltip.desktop')}
        aria-label={t('blockProps.hideOn.desktop')}>
        <I.monitor size={11}/>
      </button>
      <button className={state==='mobile'?'on':''} onClick={()=>set('mobile')}
        title={t('blockProps.hideOn.tooltip.mobile')}
        aria-label={t('blockProps.hideOn.mobile')}>
        <I.phone size={11}/>
      </button>
    </div>
  );
}

// Shared Visibility group, injected at the top of every StyleTab case.
function VisibilityGroup({ block, upd }) {
  const t = window.stI18n.t;
  return (
    <Group title={t('blockProps.group.visibility')}>
      <Row label={t('section.field.hideOn')}>
        <BlockHideOnPill hidden={block.data?.hidden} onChange={(v)=>upd('hidden', v)}/>
      </Row>
    </Group>
  );
}

function StyleTab({ block, upd }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const s = block.data?.style || {};
  const mob = block.data?.mobile || {};
  const bt = block.type;

  // Tipografía compartida
  // Responsive fields (size, weight, color, align) are wrapped in <DeviceField>
  // so the user can override them per-device. Prefixed variants (e.g. 'title',
  // 'body' used by hero) keep the same pattern.
  const TypoGroup = ({ prefix='', sizeDefault=14, withWeight=true, withAlign=true }) => (
    <Group title={t('blockProps.group.typography')}>
      <Row label={t('blockProps.field.font')}><FontPicker value={s[prefix+'font']||s.font} onChange={v=>upd(`style.${prefix}font`,v)}/></Row>
      <DeviceField label={t('blockProps.field.size')}
        desktopValue={s[prefix+'size']||sizeDefault}
        mobileValue={mob[prefix+'size']}
        onChangeDesktop={v=>upd(`style.${prefix}size`,v)}
        onChangeMobile={v=>upd(`mobile.${prefix}size`,v)}
        onClearMobile={()=>upd(`mobile.${prefix}size`,undefined)}>
        {(value, setValue) => <Slider value={value} onChange={setValue} min={8} max={120} suffix="px"/>}
      </DeviceField>
      {withWeight && (
        <DeviceField label={t('blockProps.field.weight')}
          desktopValue={s[prefix+'weight']||500}
          mobileValue={mob[prefix+'weight']}
          onChangeDesktop={v=>upd(`style.${prefix}weight`,v)}
          onChangeMobile={v=>upd(`mobile.${prefix}weight`,v)}
          onClearMobile={()=>upd(`mobile.${prefix}weight`,undefined)}>
          {(value, setValue) => (
            <div className="seg">
              {[400,500,600,700,800].map(w => (
                <button key={w} className={value===w?'on':''} onClick={()=>setValue(w)}>{w}</button>
              ))}
            </div>
          )}
        </DeviceField>
      )}
      <Row label={t('blockProps.field.lineHeight')}><Slider value={Math.round((s[prefix+'lh']||1.5)*10)} onChange={v=>upd(`style.${prefix}lh`,v/10)} min={8} max={30} suffix="" /></Row>
      <Row label={t('blockProps.field.tracking')}><Slider value={s[prefix+'tracking']||0} onChange={v=>upd(`style.${prefix}tracking`,v)} min={-4} max={10} suffix="px"/></Row>
      <DeviceField label={t('blockProps.field.color')}
        desktopValue={s[prefix+'color']||'#0b0b0d'}
        mobileValue={mob[prefix+'color']}
        onChangeDesktop={v=>upd(`style.${prefix}color`,v)}
        onChangeMobile={v=>upd(`mobile.${prefix}color`,v)}
        onClearMobile={()=>upd(`mobile.${prefix}color`,undefined)}>
        {(value, setValue) => <ColorInput value={value} onChange={setValue}/>}
      </DeviceField>
      {withAlign && (
        <DeviceField label={t('blockProps.field.align')}
          desktopValue={s.align||'left'}
          mobileValue={mob.align}
          onChangeDesktop={v=>upd('style.align',v)}
          onChangeMobile={v=>upd('mobile.align',v)}
          onClearMobile={()=>upd('mobile.align',undefined)}>
          {(value, setValue) => <AlignBar value={value} onChange={setValue}/>}
        </DeviceField>
      )}
    </Group>
  );

  if (bt==='text') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <TypoGroup/>
        <Group title={t('blockProps.group.decoration')}>
          <Row label={t('blockProps.field.italic')}><Toggle value={s.italic} onChange={v=>upd('style.italic',v)}/></Row>
          <Row label={t('blockProps.field.underline')}><Toggle value={s.underline} onChange={v=>upd('style.underline',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='heading') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.hierarchy')}>
          <Row label={t('blockProps.field.level')}>
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

  if (bt==='image') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.dimensions')}>
          <DeviceField label={t('blockProps.field.width')}
            desktopValue={s.width||100} mobileValue={mob.width}
            onChangeDesktop={v=>upd('style.width',v)}
            onChangeMobile={v=>upd('mobile.width',v)}
            onClearMobile={()=>upd('mobile.width',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={10} max={100} suffix="%"/>}
          </DeviceField>
          <Row label={t('blockProps.field.ratio')}>
            <select className="field" value={s.ratio||'2/1'} onChange={e=>upd('style.ratio',e.target.value)}>
              <option value="1/1">{t('blockProps.ratio.square')}</option>
              <option value="4/3">4:3</option>
              <option value="3/2">3:2</option>
              <option value="16/9">16:9</option>
              <option value="2/1">{t('blockProps.ratio.banner')}</option>
              <option value="3/1">{t('blockProps.ratio.wideHero')}</option>
            </select>
          </Row>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.bordersShadow')}>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius||0} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={48} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.border')}><Slider value={s.border?.w||0} onChange={v=>upd('style.border',{w:v,color:s.border?.color||'#000',style:s.border?.style||'solid'})} min={0} max={10} suffix="px"/></Row>
          <Row label={t('blockProps.field.borderColor')}><ColorInput value={s.border?.color||'#000000'} onChange={v=>upd('style.border',{w:s.border?.w||0,color:v,style:s.border?.style||'solid'})}/></Row>
          <Row label={t('blockProps.field.shadow')}>
            <select className="field" value={s.shadow||'none'} onChange={e=>upd('style.shadow', e.target.value==='none'?null:e.target.value)}>
              <option value="none">{t('blockProps.shadow.none')}</option>
              <option value="0 2px 4px rgba(0,0,0,0.06)">{t('blockProps.shadow.subtle')}</option>
              <option value="0 4px 12px rgba(0,0,0,0.10)">{t('blockProps.shadow.medium')}</option>
              <option value="0 12px 28px rgba(0,0,0,0.18)">{t('blockProps.shadow.strong')}</option>
            </select>
          </Row>
        </Group>
      </>
    );
  }

  if (bt==='icon') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.sizeColor')}>
          <DeviceField label={t('blockProps.field.iconSize')}
            desktopValue={s.size||32} mobileValue={mob.size}
            onChangeDesktop={v=>upd('style.size',v)}
            onChangeMobile={v=>upd('mobile.size',v)}
            onClearMobile={()=>upd('mobile.size',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={12} max={120} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.iconColor')}><ColorInput value={s.color||'#1a1a17'} onChange={v=>upd('style.color',v)}/></Row>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.gap')}
            desktopValue={s.gap!=null?s.gap:10} mobileValue={mob.gap}
            onChangeDesktop={v=>upd('style.gap',v)}
            onChangeMobile={v=>upd('mobile.gap',v)}
            onClearMobile={()=>upd('mobile.gap',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={40} suffix="px"/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.textIfAny')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.textSize||14} mobileValue={mob.textSize}
            onChangeDesktop={v=>upd('style.textSize',v)}
            onChangeMobile={v=>upd('mobile.textSize',v)}
            onClearMobile={()=>upd('mobile.textSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={10} max={40} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.weight')}>
            <div className="seg">{[400,500,600,700].map(w => (
              <button key={w} className={(s.textWeight||500)===w?'on':''} onClick={()=>upd('style.textWeight',w)}>{w}</button>
            ))}</div>
          </Row>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.textColor||'#0b0b0d'} onChange={v=>upd('style.textColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='button') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.appearance')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'#1a1a17'} onChange={v=>upd('style.bg',v)}/></Row>
          <Row label={t('blockProps.field.textColor')}><ColorInput value={s.color||'#ffffff'} onChange={v=>upd('style.color',v)}/></Row>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius!=null?s.radius:4} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={48} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.border')}><Slider value={s.borderW||0} onChange={v=>upd('style.borderW',v)} min={0} max={8} suffix="px"/></Row>
          {(s.borderW||0)>0 && <Row label={t('blockProps.field.borderColor')}><ColorInput value={s.borderColor||'#000000'} onChange={v=>upd('style.borderColor',v)}/></Row>}
          <Row label={t('blockProps.field.shadow')}>
            <select className="field" value={s.shadow||'none'} onChange={e=>upd('style.shadow', e.target.value==='none'?null:e.target.value)}>
              <option value="none">{t('blockProps.shadow.none')}</option>
              <option value="0 1px 2px rgba(0,0,0,0.08)">XS</option>
              <option value="0 2px 6px rgba(0,0,0,0.12)">SM</option>
              <option value="0 6px 18px rgba(0,0,0,0.18)">MD</option>
              <option value="0 14px 36px rgba(0,0,0,0.22)">LG</option>
            </select>
          </Row>
        </Group>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.size||14} mobileValue={mob.size}
            onChangeDesktop={v=>upd('style.size',v)}
            onChangeMobile={v=>upd('mobile.size',v)}
            onClearMobile={()=>upd('mobile.size',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={10} max={28} suffix="px"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.weight')}
            desktopValue={s.weight||500} mobileValue={mob.weight}
            onChangeDesktop={v=>upd('style.weight',v)}
            onChangeMobile={v=>upd('mobile.weight',v)}
            onClearMobile={()=>upd('mobile.weight',undefined)}>
            {(value, setValue) => (
              <div className="seg">{[400,500,600,700].map(w => (
                <button key={w} className={value===w?'on':''} onClick={()=>setValue(w)}>{w}</button>
              ))}</div>
            )}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.layout')}>
          <DeviceField label={t('blockProps.field.width')}
            desktopValue={s.width||'auto'} mobileValue={mob.width}
            onChangeDesktop={v=>upd('style.width',v)}
            onChangeMobile={v=>upd('mobile.width',v)}
            onClearMobile={()=>upd('mobile.width',undefined)}>
            {(value, setValue) => (
              <div className="seg">
                <button className={value!=='full'?'on':''} onClick={()=>setValue('auto')}>{t('blockProps.width.auto')}</button>
                <button className={value==='full'?'on':''} onClick={()=>setValue('full')}>{t('blockProps.width.full')}</button>
              </div>
            )}
          </DeviceField>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.padX')}
            desktopValue={s.padX||22} mobileValue={mob.padX}
            onChangeDesktop={v=>upd('style.padX',v)}
            onChangeMobile={v=>upd('mobile.padX',v)}
            onClearMobile={()=>upd('mobile.padX',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={80} suffix="px"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.padY')}
            desktopValue={s.padY||12} mobileValue={mob.padY}
            onChangeDesktop={v=>upd('style.padY',v)}
            onChangeMobile={v=>upd('mobile.padY',v)}
            onClearMobile={()=>upd('mobile.padY',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={40} suffix="px"/>}
          </DeviceField>
        </Group>
      </>
    );
  }

  if (bt==='divider') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.type.divider')}>
          <Row label={t('blockProps.tab.style')}>
            <div className="seg">
              <button className={(s.style||'solid')==='solid'?'on':''} onClick={()=>upd('style.style','solid')}>{t('blockProps.divider.solid')}</button>
              <button className={s.style==='dashed'?'on':''} onClick={()=>upd('style.style','dashed')}>{t('blockProps.divider.dashed')}</button>
              <button className={s.style==='dotted'?'on':''} onClick={()=>upd('style.style','dotted')}>{t('blockProps.divider.dotted')}</button>
            </div>
          </Row>
          <DeviceField label={t('blockProps.field.thickness')}
            desktopValue={s.thickness||1} mobileValue={mob.thickness}
            onChangeDesktop={v=>upd('style.thickness',v)}
            onChangeMobile={v=>upd('mobile.thickness',v)}
            onClearMobile={()=>upd('mobile.thickness',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={1} max={12} suffix="px"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.color')}
            desktopValue={s.color||'#dddbd4'} mobileValue={mob.color}
            onChangeDesktop={v=>upd('style.color',v)}
            onChangeMobile={v=>upd('mobile.color',v)}
            onClearMobile={()=>upd('mobile.color',undefined)}>
            {(value, setValue) => <ColorInput value={value} onChange={setValue}/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.width')}
            desktopValue={s.width||100} mobileValue={mob.width}
            onChangeDesktop={v=>upd('style.width',v)}
            onChangeMobile={v=>upd('mobile.width',v)}
            onClearMobile={()=>upd('mobile.width',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={10} max={100} suffix="%"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
        </Group>
      </>
    );
  }

  if (bt==='spacer') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.type.spacer')}>
          <DeviceField label={t('blockProps.field.height')}
            desktopValue={s.h||24} mobileValue={mob.h}
            onChangeDesktop={v=>upd('style.h',v)}
            onChangeMobile={v=>upd('mobile.h',v)}
            onClearMobile={()=>upd('mobile.h',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={2} max={200} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='header') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.layout')}>
          <DeviceField label={t('blockProps.field.arrangement')}
            desktopValue={s.layout||'between'} mobileValue={mob.layout}
            onChangeDesktop={v=>upd('style.layout',v)}
            onChangeMobile={v=>upd('mobile.layout',v)}
            onClearMobile={()=>upd('mobile.layout',undefined)}>
            {(value, setValue) => (
              <div className="seg">
                <button className={value==='between'?'on':''} onClick={()=>setValue('between')}>{t('blockProps.header.between')}</button>
                <button className={value==='center'?'on':''} onClick={()=>setValue('center')}>{t('blockProps.header.center')}</button>
              </div>
            )}
          </DeviceField>
          <DeviceField label={t('blockProps.field.logoSize')}
            desktopValue={s.logoSize||18} mobileValue={mob.logoSize}
            onChangeDesktop={v=>upd('style.logoSize',v)}
            onChangeMobile={v=>upd('mobile.logoSize',v)}
            onClearMobile={()=>upd('mobile.logoSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={12} max={60} suffix="px"/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.colors')}>
          <Row label={t('blockProps.field.brand')}><ColorInput value={s.color||'#0b0b0d'} onChange={v=>upd('style.color',v)}/></Row>
          <Row label={t('blockProps.field.sub')}><ColorInput value={s.subColor||'#6b6a63'} onChange={v=>upd('style.subColor',v)}/></Row>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='footer') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.size||12} mobileValue={mob.size}
            onChangeDesktop={v=>upd('style.size',v)}
            onChangeMobile={v=>upd('mobile.size',v)}
            onClearMobile={()=>upd('mobile.size',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={9} max={20} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.color||'#6b6a63'} onChange={v=>upd('style.color',v)}/></Row>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.background')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='product') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.appearance')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius||8} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={40} suffix="px"/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label={t('blockProps.field.nameColor')}><ColorInput value={s.nameColor||'#0b0b0d'} onChange={v=>upd('style.nameColor',v)}/></Row>
          <Row label={t('blockProps.field.priceColor')}><ColorInput value={s.priceColor||'#5b5bf0'} onChange={v=>upd('style.priceColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='social') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.icons')}>
          <Row label={t('blockProps.field.shape')}>
            <div className="seg">
              <button className={(s.shape||'circle')==='circle'?'on':''} onClick={()=>upd('style.shape','circle')}>{t('blockProps.shape.circle')}</button>
              <button className={s.shape==='square'?'on':''} onClick={()=>upd('style.shape','square')}>{t('blockProps.shape.square')}</button>
            </div>
          </Row>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.size||28} mobileValue={mob.size}
            onChangeDesktop={v=>upd('style.size',v)}
            onChangeMobile={v=>upd('mobile.size',v)}
            onClearMobile={()=>upd('mobile.size',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={16} max={60} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.color||'#1a1a17'} onChange={v=>upd('style.color',v)}/></Row>
          <DeviceField label={t('blockProps.field.spacing')}
            desktopValue={s.gap||12} mobileValue={mob.gap}
            onChangeDesktop={v=>upd('style.gap',v)}
            onChangeMobile={v=>upd('mobile.gap',v)}
            onClearMobile={()=>upd('mobile.gap',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={40} suffix="px"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
        </Group>
      </>
    );
  }

  if (bt==='video') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.dimensions')}>
          <DeviceField label={t('blockProps.field.width')}
            desktopValue={s.width||100} mobileValue={mob.width}
            onChangeDesktop={v=>upd('style.width',v)}
            onChangeMobile={v=>upd('mobile.width',v)}
            onClearMobile={()=>upd('mobile.width',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={20} max={100} suffix="%"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius||0} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={40} suffix="px"/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.playButton')}>
          <DeviceField label={t('blockProps.field.playSize')}
            desktopValue={s.playSize||64} mobileValue={mob.playSize}
            onChangeDesktop={v=>upd('style.playSize',v)}
            onChangeMobile={v=>upd('mobile.playSize',v)}
            onClearMobile={()=>upd('mobile.playSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={32} max={128} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.playColor')}><ColorInput value={s.playColor||'#ffffff'} onChange={v=>upd('style.playColor',v)}/></Row>
          <Row label={t('blockProps.field.playBg')}>
            <input className="field" value={s.playBg||'rgba(0,0,0,0.55)'}
              onChange={e=>upd('style.playBg',e.target.value)}
              placeholder="rgba(0,0,0,0.55)"/>
          </Row>
        </Group>
        <Group title={t('blockProps.group.caption')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label={t('blockProps.field.size')}><Slider value={s.captionSize||12} onChange={v=>upd('style.captionSize',v)} min={10} max={20} suffix="px"/></Row>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.captionColor||'#6b6a63'} onChange={v=>upd('style.captionColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='gif') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.dimensions')}>
          <DeviceField label={t('blockProps.field.width')}
            desktopValue={s.width||100} mobileValue={mob.width}
            onChangeDesktop={v=>upd('style.width',v)}
            onChangeMobile={v=>upd('mobile.width',v)}
            onClearMobile={()=>upd('mobile.width',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={10} max={100} suffix="%"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius||0} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={40} suffix="px"/>}
          </DeviceField>
        </Group>
      </>
    );
  }

  if (bt==='qr') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.dimensions')}>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.size||180} mobileValue={mob.size}
            onChangeDesktop={v=>upd('style.size',v)}
            onChangeMobile={v=>upd('mobile.size',v)}
            onClearMobile={()=>upd('mobile.size',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={80} max={400} suffix="px"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          <Row label={t('blockProps.field.radius')}><Slider value={s.radius||0} onChange={v=>upd('style.radius',v)} min={0} max={40} suffix="px"/></Row>
        </Group>
        <Group title={t('blockProps.group.colors')}>
          <Row label={t('blockProps.field.foreground')}><ColorInput value={s.fg||'#000000'} onChange={v=>upd('style.fg',v)}/></Row>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'#ffffff'} onChange={v=>upd('style.bg',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.quality')}>
          <Row label={t('blockProps.field.errorCorrection')}>
            <div className="seg">
              {['L','M','Q','H'].map(lv => (
                <button key={lv} className={(s.level||'M')===lv?'on':''}
                  onClick={()=>upd('style.level',lv)}>{lv}</button>
              ))}
            </div>
          </Row>
          <div style={{fontSize:11,color:'var(--fg-3)',lineHeight:1.5,marginTop:4}}>
            {t('blockProps.qr.levelHint')}
          </div>
        </Group>
        <Group title={t('blockProps.group.caption')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label={t('blockProps.field.size')}><Slider value={s.captionSize||12} onChange={v=>upd('style.captionSize',v)} min={10} max={20} suffix="px"/></Row>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.captionColor||'#6b6a63'} onChange={v=>upd('style.captionColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='testimonial') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.layout')}>
          <Row label={t('blockProps.field.layout')}>
            <div className="seg">
              <button className={(s.layout||'plain')==='plain'?'on':''} onClick={()=>upd('style.layout','plain')}>{t('blockProps.testimonial.layoutPlain')}</button>
              <button className={s.layout==='card'?'on':''} onClick={()=>upd('style.layout','card')}>{t('blockProps.testimonial.layoutCard')}</button>
            </div>
          </Row>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          {s.layout==='card' && (
            <>
              <Row label={t('blockProps.field.borderColor')}><ColorInput value={s.borderColor||'#e5e5e5'} onChange={v=>upd('style.borderColor',v)}/></Row>
              <Row label={t('blockProps.field.radius')}><Slider value={s.radius!=null?s.radius:12} onChange={v=>upd('style.radius',v)} min={0} max={40} suffix="px"/></Row>
              <Row label={t('blockProps.field.cardPadding')}><Slider value={s.cardPadding!=null?s.cardPadding:24} onChange={v=>upd('style.cardPadding',v)} min={0} max={80} suffix="px"/></Row>
            </>
          )}
        </Group>
        <Group title={t('blockProps.group.quote')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.quoteSize||18} mobileValue={mob.quoteSize}
            onChangeDesktop={v=>upd('style.quoteSize',v)}
            onChangeMobile={v=>upd('mobile.quoteSize',v)}
            onClearMobile={()=>upd('mobile.quoteSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={12} max={40} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.weight')}>
            <div className="seg">
              {[300,400,500,600].map(w => (
                <button key={w} className={(s.quoteWeight||400)===w?'on':''} onClick={()=>upd('style.quoteWeight',w)}>{w}</button>
              ))}
            </div>
          </Row>
          <Row label={t('blockProps.field.italic')}><Toggle value={s.quoteItalic} onChange={v=>upd('style.quoteItalic',v)}/></Row>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.quoteColor||'#0b0b0d'} onChange={v=>upd('style.quoteColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.rating')}>
          <Row label={t('blockProps.field.size')}><Slider value={s.ratingSize||16} onChange={v=>upd('style.ratingSize',v)} min={12} max={32} suffix="px"/></Row>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.ratingColor||'#f5a623'} onChange={v=>upd('style.ratingColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.person')}>
          <DeviceField label={t('blockProps.field.avatarSize')}
            desktopValue={s.avatarSize||44} mobileValue={mob.avatarSize}
            onChangeDesktop={v=>upd('style.avatarSize',v)}
            onChangeMobile={v=>upd('mobile.avatarSize',v)}
            onClearMobile={()=>upd('mobile.avatarSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={24} max={96} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.avatarShape')}>
            <div className="seg">
              <button className={(s.avatarShape||'circle')==='circle'?'on':''} onClick={()=>upd('style.avatarShape','circle')}>{t('blockProps.shape.circle')}</button>
              <button className={s.avatarShape==='square'?'on':''} onClick={()=>upd('style.avatarShape','square')}>{t('blockProps.shape.square')}</button>
            </div>
          </Row>
          <Row label={t('blockProps.field.nameColor')}><ColorInput value={s.nameColor||'#0b0b0d'} onChange={v=>upd('style.nameColor',v)}/></Row>
          <Row label={t('blockProps.field.roleColor')}><ColorInput value={s.roleColor||'#6b6a63'} onChange={v=>upd('style.roleColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='signature') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.layout')}>
          <Row label={t('blockProps.field.layout')}>
            <div className="seg">
              <button className={(s.layout||'horizontal')==='horizontal'?'on':''} onClick={()=>upd('style.layout','horizontal')}>{t('blockProps.signature.layoutHorizontal')}</button>
              <button className={s.layout==='stacked'?'on':''} onClick={()=>upd('style.layout','stacked')}>{t('blockProps.signature.layoutStacked')}</button>
            </div>
          </Row>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'left'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.avatar')}>
          <DeviceField label={t('blockProps.field.avatarSize')}
            desktopValue={s.avatarSize||56} mobileValue={mob.avatarSize}
            onChangeDesktop={v=>upd('style.avatarSize',v)}
            onChangeMobile={v=>upd('mobile.avatarSize',v)}
            onClearMobile={()=>upd('mobile.avatarSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={32} max={128} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.avatarShape')}>
            <div className="seg">
              <button className={(s.avatarShape||'circle')==='circle'?'on':''} onClick={()=>upd('style.avatarShape','circle')}>{t('blockProps.shape.circle')}</button>
              <button className={s.avatarShape==='square'?'on':''} onClick={()=>upd('style.avatarShape','square')}>{t('blockProps.shape.square')}</button>
            </div>
          </Row>
        </Group>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label={t('blockProps.field.nameColor')}><ColorInput value={s.nameColor||'#0b0b0d'} onChange={v=>upd('style.nameColor',v)}/></Row>
          <Row label={t('blockProps.field.titleColor')}><ColorInput value={s.titleColor||'#3d3c36'} onChange={v=>upd('style.titleColor',v)}/></Row>
          <Row label={t('blockProps.field.metaColor')}><ColorInput value={s.metaColor||'#6b6a63'} onChange={v=>upd('style.metaColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.divider')}>
          <Row label={t('blockProps.field.divider')}><Toggle value={s.divider!==false} onChange={v=>upd('style.divider',v)}/></Row>
          {(s.divider!==false) && (
            <Row label={t('blockProps.field.dividerColor')}><ColorInput value={s.dividerColor||'#e5e5e5'} onChange={v=>upd('style.dividerColor',v)}/></Row>
          )}
        </Group>
        <Group title={t('blockProps.group.socials')}>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.socialSize||24} mobileValue={mob.socialSize}
            onChangeDesktop={v=>upd('style.socialSize',v)}
            onChangeMobile={v=>upd('mobile.socialSize',v)}
            onClearMobile={()=>upd('mobile.socialSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={14} max={48} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.socialColor||'#1a1a17'} onChange={v=>upd('style.socialColor',v)}/></Row>
          <Row label={t('blockProps.field.shape')}>
            <div className="seg">
              <button className={(s.socialShape||'circle')==='circle'?'on':''} onClick={()=>upd('style.socialShape','circle')}>{t('blockProps.shape.circle')}</button>
              <button className={s.socialShape==='square'?'on':''} onClick={()=>upd('style.socialShape','square')}>{t('blockProps.shape.square')}</button>
            </div>
          </Row>
          <Row label={t('blockProps.field.spacing')}><Slider value={s.socialGap||8} onChange={v=>upd('style.socialGap',v)} min={0} max={24} suffix="px"/></Row>
        </Group>
      </>
    );
  }

  if (bt==='countdown') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <DeviceField label={t('blockProps.field.size')}
            desktopValue={s.size||28} mobileValue={mob.size}
            onChangeDesktop={v=>upd('style.size',v)}
            onChangeMobile={v=>upd('mobile.size',v)}
            onClearMobile={()=>upd('mobile.size',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={14} max={72} suffix="px"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.weight')}
            desktopValue={s.weight||600} mobileValue={mob.weight}
            onChangeDesktop={v=>upd('style.weight',v)}
            onChangeMobile={v=>upd('mobile.weight',v)}
            onClearMobile={()=>upd('mobile.weight',undefined)}>
            {(value, setValue) => (
              <div className="seg">
                {[400,500,600,700,800].map(w => (
                  <button key={w} className={value===w?'on':''} onClick={()=>setValue(w)}>{w}</button>
                ))}
              </div>
            )}
          </DeviceField>
          <Row label={t('blockProps.field.color')}><ColorInput value={s.color||'#0b0b0d'} onChange={v=>upd('style.color',v)}/></Row>
          <Row label={t('blockProps.field.tracking')}><Slider value={s.tracking||0} onChange={v=>upd('style.tracking',v)} min={-2} max={10} suffix="px"/></Row>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.background')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
          <Row label={t('blockProps.field.radius')}><Slider value={s.radius||0} onChange={v=>upd('style.radius',v)} min={0} max={40} suffix="px"/></Row>
        </Group>
      </>
    );
  }

  if (bt==='accordion') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.titleTypo')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <DeviceField label={t('blockProps.field.titleSize')}
            desktopValue={s.titleSize||16} mobileValue={mob.titleSize}
            onChangeDesktop={v=>upd('style.titleSize',v)}
            onChangeMobile={v=>upd('mobile.titleSize',v)}
            onClearMobile={()=>upd('mobile.titleSize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={12} max={32} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.weight')}>
            <div className="seg">
              {[400,500,600,700].map(w => (
                <button key={w} className={(s.titleWeight||600)===w?'on':''} onClick={()=>upd('style.titleWeight',w)}>{w}</button>
              ))}
            </div>
          </Row>
          <Row label={t('blockProps.field.titleColor')}><ColorInput value={s.titleColor||'#0b0b0d'} onChange={v=>upd('style.titleColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.bodyTypo')}>
          <DeviceField label={t('blockProps.field.bodySize')}
            desktopValue={s.bodySize||14} mobileValue={mob.bodySize}
            onChangeDesktop={v=>upd('style.bodySize',v)}
            onChangeMobile={v=>upd('mobile.bodySize',v)}
            onClearMobile={()=>upd('mobile.bodySize',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={10} max={24} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.bodyColor')}><ColorInput value={s.bodyColor||'#3d3c36'} onChange={v=>upd('style.bodyColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.layout')}>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'left'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          <Row label={t('blockProps.field.itemGap')}><Slider value={s.itemGap!=null?s.itemGap:14} onChange={v=>upd('style.itemGap',v)} min={0} max={40} suffix="px"/></Row>
          <Row label={t('blockProps.field.dividerColor')}><ColorInput value={s.dividerColor||'#e5e5e5'} onChange={v=>upd('style.dividerColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.background')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'transparent'} onChange={v=>upd('style.bg',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='attachment') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.appearance')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'#f7f7f4'} onChange={v=>upd('style.bg',v)}/></Row>
          <Row label={t('blockProps.field.borderColor')}><ColorInput value={s.borderColor||'#e5e5e5'} onChange={v=>upd('style.borderColor',v)}/></Row>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius!=null?s.radius:8} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={32} suffix="px"/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.icon')}>
          <Row label={t('blockProps.field.iconBg')}><ColorInput value={s.iconBg||'#6b6a63'} onChange={v=>upd('style.iconBg',v)}/></Row>
          <Row label={t('blockProps.field.iconColor')}><ColorInput value={s.iconColor||'#ffffff'} onChange={v=>upd('style.iconColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label={t('blockProps.field.nameColor')}><ColorInput value={s.nameColor||'#0b0b0d'} onChange={v=>upd('style.nameColor',v)}/></Row>
          <Row label={t('blockProps.field.sizeColor')}><ColorInput value={s.sizeColor||'#6b6a63'} onChange={v=>upd('style.sizeColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.cta')}>
          <Row label={t('blockProps.field.ctaBg')}><ColorInput value={s.ctaBg||'#1a1a17'} onChange={v=>upd('style.ctaBg',v)}/></Row>
          <Row label={t('blockProps.field.ctaColor')}><ColorInput value={s.ctaColor||'#ffffff'} onChange={v=>upd('style.ctaColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='cart') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.appearance')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'#ffffff'} onChange={v=>upd('style.bg',v)}/></Row>
          <Row label={t('blockProps.field.borderColor')}><ColorInput value={s.borderColor||'#e5e5e5'} onChange={v=>upd('style.borderColor',v)}/></Row>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius!=null?s.radius:8} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={32} suffix="px"/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.rows')}>
          <Row label={t('blockProps.field.headerBg')}><ColorInput value={s.headerBg||'#f7f7f4'} onChange={v=>upd('style.headerBg',v)}/></Row>
          <Row label={t('blockProps.field.rowBg')}><ColorInput value={s.rowBg||'#ffffff'} onChange={v=>upd('style.rowBg',v)}/></Row>
          <Row label={t('blockProps.field.rowBorderColor')}><ColorInput value={s.rowBorderColor||'#eeeeea'} onChange={v=>upd('style.rowBorderColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label={t('blockProps.field.textColor')}><ColorInput value={s.textColor||'#0b0b0d'} onChange={v=>upd('style.textColor',v)}/></Row>
          <Row label={t('blockProps.field.totalColor')}><ColorInput value={s.totalColor||'#0b0b0d'} onChange={v=>upd('style.totalColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.cta')}>
          <Row label={t('blockProps.field.ctaBg')}><ColorInput value={s.ctaBg||'#1a1a17'} onChange={v=>upd('style.ctaBg',v)}/></Row>
          <Row label={t('blockProps.field.ctaColor')}><ColorInput value={s.ctaColor||'#ffffff'} onChange={v=>upd('style.ctaColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='receipt') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.appearance')}>
          <Row label={t('blockProps.field.background')}><ColorInput value={s.bg||'#ffffff'} onChange={v=>upd('style.bg',v)}/></Row>
          <Row label={t('blockProps.field.borderColor')}><ColorInput value={s.borderColor||'#e5e5e5'} onChange={v=>upd('style.borderColor',v)}/></Row>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius!=null?s.radius:8} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={32} suffix="px"/>}
          </DeviceField>
          <Row label={t('blockProps.field.rowBorderColor')}><ColorInput value={s.rowBorderColor||'#eeeeea'} onChange={v=>upd('style.rowBorderColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.typography')}>
          <Row label={t('blockProps.field.font')}><FontPicker value={s.font||'inter'} onChange={v=>upd('style.font',v)}/></Row>
          <Row label={t('blockProps.field.textColor')}><ColorInput value={s.textColor||'#0b0b0d'} onChange={v=>upd('style.textColor',v)}/></Row>
          <Row label={t('blockProps.field.headingColor')}><ColorInput value={s.headingColor||'#0b0b0d'} onChange={v=>upd('style.headingColor',v)}/></Row>
        </Group>
        <Group title={t('blockProps.group.cta')}>
          <Row label={t('blockProps.field.ctaBg')}><ColorInput value={s.ctaBg||'#1a1a17'} onChange={v=>upd('style.ctaBg',v)}/></Row>
          <Row label={t('blockProps.field.ctaColor')}><ColorInput value={s.ctaColor||'#ffffff'} onChange={v=>upd('style.ctaColor',v)}/></Row>
        </Group>
      </>
    );
  }

  if (bt==='map') {
    return (
      <>
        <VisibilityGroup block={block} upd={upd}/>
        <Group title={t('blockProps.group.dimensions')}>
          <DeviceField label={t('blockProps.field.width')}
            desktopValue={s.width||100} mobileValue={mob.width}
            onChangeDesktop={v=>upd('style.width',v)}
            onChangeMobile={v=>upd('mobile.width',v)}
            onClearMobile={()=>upd('mobile.width',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={20} max={100} suffix="%"/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.align')}
            desktopValue={s.align||'center'} mobileValue={mob.align}
            onChangeDesktop={v=>upd('style.align',v)}
            onChangeMobile={v=>upd('mobile.align',v)}
            onClearMobile={()=>upd('mobile.align',undefined)}>
            {(value, setValue) => <AlignBar value={value} onChange={setValue} options={['left','center','right']}/>}
          </DeviceField>
          <DeviceField label={t('blockProps.field.radius')}
            desktopValue={s.radius||0} mobileValue={mob.radius}
            onChangeDesktop={v=>upd('style.radius',v)}
            onChangeMobile={v=>upd('mobile.radius',v)}
            onClearMobile={()=>upd('mobile.radius',undefined)}>
            {(value, setValue) => <Slider value={value} onChange={setValue} min={0} max={40} suffix="px"/>}
          </DeviceField>
        </Group>
        <Group title={t('blockProps.group.border')}>
          <Row label={t('blockProps.field.borderWidth')}><Slider value={s.borderWidth||0} onChange={v=>upd('style.borderWidth',v)} min={0} max={8} suffix="px"/></Row>
          {(s.borderWidth||0)>0 && (
            <Row label={t('blockProps.field.borderColor')}><ColorInput value={s.borderColor||'#000000'} onChange={v=>upd('style.borderColor',v)}/></Row>
          )}
        </Group>
      </>
    );
  }

  return (
    <>
      <VisibilityGroup block={block} upd={upd}/>
      <Group title={t('blockProps.tab.style')}><div style={{fontSize:12,color:'var(--fg-3)'}}>{t('blockProps.style.none')}</div></Group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: ESPACIADO
// ═══════════════════════════════════════════════════════════
function SpacingTab({ block, upd }) {
  const t = window.stI18n.t;
  window.stI18n.useLang();
  const sp = block.data?.spacing || { padding:[0,0,0,0], margin:[0,0,0,0] };
  const mobSp = block.data?.mobileSpacing || {};
  const presets = [
    {key:'none',   label:t('blockProps.preset.none'),   p:[0,0,0,0],     m:[0,0,0,0]},
    {key:'compact',label:t('blockProps.preset.compact'),p:[8,12,8,12],   m:[0,0,0,0]},
    {key:'normal', label:t('blockProps.preset.normal'), p:[16,20,16,20], m:[0,0,0,0]},
    {key:'loose',  label:t('blockProps.preset.loose'),  p:[32,28,32,28], m:[12,0,12,0]},
    {key:'section',label:t('blockProps.preset.section'),p:[40,32,40,32], m:[0,0,0,0]},
    {key:'full',   label:t('blockProps.preset.full'),   p:[24,0,24,0],   m:[0,0,0,0]},
  ];
  return (
    <>
      <Group title={t('blockProps.group.paddingInner')}>
        <DeviceField label={t('blockProps.spacing.padding')}
          desktopValue={sp.padding || [0,0,0,0]}
          mobileValue={mobSp.padding}
          onChangeDesktop={v=>upd('spacing.padding',v)}
          onChangeMobile={v=>upd('mobileSpacing.padding',v)}
          onClearMobile={()=>upd('mobileSpacing.padding',undefined)}>
          {(value, setValue) => <SpacingBox value={value || [0,0,0,0]} onChange={setValue} max={120}/>}
        </DeviceField>
      </Group>
      <Group title={t('blockProps.group.marginOuter')}>
        <DeviceField label={t('blockProps.spacing.margin')}
          desktopValue={sp.margin || [0,0,0,0]}
          mobileValue={mobSp.margin}
          onChangeDesktop={v=>upd('spacing.margin',v)}
          onChangeMobile={v=>upd('mobileSpacing.margin',v)}
          onClearMobile={()=>upd('mobileSpacing.margin',undefined)}>
          {(value, setValue) => <SpacingBox value={value || [0,0,0,0]} onChange={setValue} max={120}/>}
        </DeviceField>
      </Group>
      <Group title={t('blockProps.group.presets')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {presets.map(preset => (
            <button key={preset.key}
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
