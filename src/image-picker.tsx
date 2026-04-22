// Modal de selección de imagen — 3 tabs: Biblioteca local / URL / CDN
// + Emoji picker para bloque Icono

// ---- Mock data de biblioteca local (simulación de SQLite) ----
const IMG_LIB_MOCK = [
  { id:'img1', name:'hero-noviembre.jpg',       folder:'Noviembre',     w:1440, h:720,  size:'182 KB', thumb:'#e8ddff', pattern:'wave' },
  { id:'img2', name:'producto-taza.png',        folder:'Productos',     w:800,  h:800,  size:'92 KB',  thumb:'#ffdccf', pattern:'dots' },
  { id:'img3', name:'producto-cuaderno.png',    folder:'Productos',     w:800,  h:800,  size:'104 KB', thumb:'#d4e8d2', pattern:'grid' },
  { id:'img4', name:'logo-acme.svg',            folder:'Marca',         w:200,  h:80,   size:'3 KB',   thumb:'#fff',    pattern:'mono' },
  { id:'img5', name:'equipo-retrato.jpg',       folder:'Fotografía',    w:1200, h:800,  size:'240 KB', thumb:'#ccd4e8', pattern:'wave' },
  { id:'img6', name:'banner-bienvenida.png',    folder:'Campañas',      w:1600, h:600,  size:'156 KB', thumb:'#f7e3ca', pattern:'grid' },
  { id:'img7', name:'icon-check.svg',           folder:'Iconos',        w:64,   h:64,   size:'1 KB',   thumb:'#d1f5e1', pattern:'mono' },
  { id:'img8', name:'icon-star.svg',            folder:'Iconos',        w:64,   h:64,   size:'1 KB',   thumb:'#fff4c0', pattern:'mono' },
  { id:'img9', name:'paisaje-montaña.jpg',      folder:'Fotografía',    w:1800, h:1200, size:'412 KB', thumb:'#c9d9e5', pattern:'wave' },
  { id:'img10',name:'pattern-lineas.png',       folder:'Texturas',      w:1000, h:1000, size:'48 KB',  thumb:'#ece8dd', pattern:'lines' },
  { id:'img11',name:'boton-cta-sombra.png',     folder:'Componentes',   w:400,  h:100,  size:'22 KB',  thumb:'#1a1a17', pattern:'mono',dark:true },
  { id:'img12',name:'ilustracion-abstracta.svg',folder:'Ilustraciones', w:800,  h:800,  size:'8 KB',   thumb:'#f0e8d8', pattern:'curve' },
];

const IMG_FOLDERS = [
  { id:'all',     name:'Toda la biblioteca', count:12 },
  { id:'Campañas', name:'Campañas', count:1 },
  { id:'Productos', name:'Productos', count:2 },
  { id:'Marca', name:'Marca', count:1 },
  { id:'Fotografía', name:'Fotografía', count:2 },
  { id:'Iconos', name:'Iconos', count:2 },
  { id:'Ilustraciones', name:'Ilustraciones', count:1 },
  { id:'Texturas', name:'Texturas', count:1 },
  { id:'Componentes', name:'Componentes', count:1 },
  { id:'Noviembre', name:'Noviembre', count:1 },
];

function ImageThumb({ item, large=false }) {
  // Real uploaded image — render the actual bytes. Otherwise fall back to
  // the mock pattern placeholders used for seed data.
  if (item?.url) {
    return (
      <div style={{
        width:'100%', aspectRatio: large ? '4/3' : '1/1',
        background:'var(--surface-2)', overflow:'hidden',
        borderRadius: large ? 'var(--r-md)' : 'var(--r-sm)',
      }}>
        <img
          src={item.url}
          alt={item.name || ''}
          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
          loading="lazy"
        />
      </div>
    );
  }
  const patterns = {
    wave: (
      <svg viewBox="0 0 100 60" style={{width:'100%',height:'100%',display:'block'}}>
        <rect width="100" height="60" fill={item.thumb}/>
        <path d="M0 42 Q20 30 40 42 T80 42 T120 42 L120 60 L0 60 Z" fill="color-mix(in oklab, currentColor 10%, transparent)"/>
        <circle cx="78" cy="16" r="8" fill="color-mix(in oklab, currentColor 25%, transparent)"/>
      </svg>
    ),
    dots: (
      <div style={{background:item.thumb,width:'100%',height:'100%',backgroundImage:'radial-gradient(circle, rgba(0,0,0,.12) 1px, transparent 1px)',backgroundSize:'10px 10px'}}/>
    ),
    grid: (
      <div style={{background:item.thumb,width:'100%',height:'100%',backgroundImage:'linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)',backgroundSize:'8px 8px'}}/>
    ),
    lines: (
      <div style={{background:item.thumb,width:'100%',height:'100%',backgroundImage:'repeating-linear-gradient(45deg, rgba(0,0,0,.08) 0 2px, transparent 2px 8px)'}}/>
    ),
    mono: (
      <div style={{background:item.thumb,width:'100%',height:'100%',display:'grid',placeItems:'center',fontFamily:'var(--font-mono)',fontSize:large?14:10,color:item.dark?'#fff':'#1a1a17',opacity:0.65,padding:6,textAlign:'center'}}>
        {item.name.replace(/\.[a-z]+$/,'')}
      </div>
    ),
    curve: (
      <svg viewBox="0 0 100 60" style={{width:'100%',height:'100%',display:'block'}}>
        <rect width="100" height="60" fill={item.thumb}/>
        <path d="M10 50 C 20 10, 40 10, 50 30 S 80 50, 90 10" stroke="color-mix(in oklab, currentColor 40%, transparent)" strokeWidth="2" fill="none"/>
      </svg>
    ),
  };
  return (
    <div style={{
      width:'100%', aspectRatio: large ? '4/3' : '1/1',
      background:'var(--surface-2)', overflow:'hidden',
      borderRadius: large ? 'var(--r-md)' : 'var(--r-sm)',
      position:'relative',
    }}>
      {patterns[item.pattern] || patterns.mono}
    </div>
  );
}

function ImagePickerModal({ open, onClose, onSelect }) {
  const [tab, setTab] = React.useState('library'); // library | url | cdn
  const [folder, setFolder] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(null);
  const [urlInput, setUrlInput] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);
  const [recentUploads, setRecentUploads] = React.useState([]);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef(null);

  if (!open) return null;

  const cdnConfig = window.stStorage.getWSSetting('storage', {}).mode || 'base64';

  // Upload any file through stCDN. On success, push into the in-memory
  // recent-uploads list so it's visible in the grid and pre-selected.
  // Scope: no persistence yet — the list resets when the modal closes.
  const handleFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await window.stCDN.upload(file);
      if (!result.ok) {
        setUploadError(result.error || 'No se pudo subir la imagen.');
        return;
      }
      const entry = {
        id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name || 'imagen',
        url: result.url,
        folder: 'Subidas',
        w: '?', h: '?',
        size: `${Math.round((file.size || 0) / 1024)} KB`,
        uploaded: true,
      };
      setRecentUploads((r) => [entry, ...r]);
      setSel(entry);
    } catch (err) {
      setUploadError(err?.message || 'Error inesperado al subir.');
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    e.target.value = ''; // let user re-select the same file
  };

  const onDropFile = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) await handleFile(file);
  };

  const items = [
    ...recentUploads.filter((i) => folder === 'all' || i.folder === folder)
      .filter((i) => i.name.toLowerCase().includes(q.toLowerCase())),
    ...IMG_LIB_MOCK
      .filter((i) => folder === 'all' || i.folder === folder)
      .filter((i) => i.name.toLowerCase().includes(q.toLowerCase())),
  ];

  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(11,11,13,0.5)',
      display:'grid',placeItems:'center',zIndex:200,padding:20,
    }} onClick={onClose}>
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          background:'var(--surface)', borderRadius:'var(--r-xl)',
          width:'100%', maxWidth:1000, height:'82vh', maxHeight:720,
          display:'flex', flexDirection:'column',
          boxShadow:'0 40px 80px -20px rgba(0,0,0,.5)',
          overflow:'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display:'flex',alignItems:'center',gap:14,
          padding:'14px 18px',borderBottom:'1px solid var(--line)',
        }}>
          <div style={{width:32,height:32,borderRadius:'var(--r-sm)',background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center'}}>
            <I.image size={16}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600}}>Seleccionar imagen</div>
            <div style={{fontSize:11.5,color:'var(--fg-3)'}}>Biblioteca local · Las imágenes se convierten a Base64 para embeberlas en el correo</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={14}/></button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:2,padding:'6px 10px 0',borderBottom:'1px solid var(--line)'}}>
          {[
            {id:'library', icon:'folder', label:'Biblioteca local', badge:IMG_LIB_MOCK.length},
            {id:'url',     icon:'external', label:'URL externa'},
            {id:'cdn',     icon:'server', label:`CDN · ${cdnConfig==='base64'?'no configurado':cdnConfig}`, disabled:cdnConfig==='base64'},
          ].map(t => {
            const Ico = I[t.icon];
            const active = tab===t.id;
            return (
              <button key={t.id}
                onClick={()=>!t.disabled && setTab(t.id)}
                disabled={t.disabled}
                style={{
                  padding:'10px 14px 12px',
                  border:'none',background:'transparent',
                  borderBottom: active?'2px solid var(--accent)':'2px solid transparent',
                  color: t.disabled?'var(--fg-3)':active?'var(--accent)':'var(--fg-2)',
                  fontSize:12,fontWeight:500,cursor: t.disabled?'not-allowed':'pointer',
                  display:'flex',alignItems:'center',gap:6,
                  opacity: t.disabled?0.5:1,
                }}
              >
                {Ico && <Ico size={13}/>} {t.label}
                {t.badge!=null && <span className="chip" style={{fontSize:10,padding:'1px 6px'}}>{t.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{flex:1,minHeight:0,display:'flex',overflow:'hidden'}}>
          {tab==='library' && (
            <>
              {/* Sidebar — carpetas */}
              <div style={{
                width:200, flex:'0 0 200px',
                borderRight:'1px solid var(--line)',
                padding:14, overflow:'auto',
              }}>
                <div style={{fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--fg-3)',fontWeight:600,marginBottom:8}}>Carpetas</div>
                {IMG_FOLDERS.map(f => (
                  <button key={f.id}
                    onClick={()=>setFolder(f.id)}
                    style={{
                      display:'flex',alignItems:'center',gap:8,
                      width:'100%',padding:'6px 8px',
                      border:'none',background: folder===f.id?'var(--accent-soft)':'transparent',
                      color: folder===f.id?'var(--accent)':'var(--fg-2)',
                      borderRadius:'var(--r-sm)', cursor:'pointer',
                      fontSize:12,textAlign:'left',marginBottom:1,
                    }}
                  >
                    <I.folder size={12}/>
                    <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                    <span style={{fontSize:10,color:'var(--fg-3)'}}>{f.count}</span>
                  </button>
                ))}
                <button style={{
                  display:'flex',alignItems:'center',gap:8,
                  width:'100%',padding:'6px 8px',marginTop:8,
                  border:'1px dashed var(--line)',background:'transparent',
                  borderRadius:'var(--r-sm)',cursor:'pointer',
                  fontSize:11.5,color:'var(--fg-3)',
                }}>
                  <I.plus size={11}/> Nueva carpeta
                </button>
              </div>

              {/* Main */}
              <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
                {/* Toolbar */}
                <div style={{
                  display:'flex',alignItems:'center',gap:10,
                  padding:'12px 16px',borderBottom:'1px solid var(--line)',
                }}>
                  <div className="search" style={{flex:1}}>
                    <span className="si"><I.search size={13}/></span>
                    <input placeholder="Buscar imágenes…" value={q} onChange={e=>setQ(e.target.value)}/>
                  </div>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}>
                    {uploading ? <>Subiendo…</> : <><I.upload size={12}/> Subir</>}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onInputChange}
                    style={{display:'none'}}/>
                </div>

                {uploadError && (
                  <div style={{
                    margin:'0 16px',padding:'10px 12px',
                    background:'color-mix(in oklab, var(--danger) 12%, transparent)',
                    borderRadius:'var(--r-sm)',
                    fontSize:12,color:'var(--danger)',
                    display:'flex',gap:8,alignItems:'flex-start',
                  }}>
                    <I.x size={14} style={{marginTop:1,flexShrink:0}}/>
                    <div><b>No pudimos subir.</b> {uploadError}</div>
                  </div>
                )}

                {/* Drop zone + Grid */}
                <div style={{flex:1,overflow:'auto',padding:16}}>
                  <div style={{
                    display:'grid',
                    gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))',
                    gap:10,
                  }}>
                    {/* Drop zone tile */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDropFile}
                      disabled={uploading}
                      style={{
                        aspectRatio:'1/1',
                        background: dragOver ? 'var(--accent-soft)' : 'var(--surface-2)',
                        border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--line-2)'}`,
                        borderRadius:'var(--r-sm)',
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
                        color:'var(--fg-3)',cursor: uploading ? 'wait' : 'pointer',padding:12,fontSize:11,
                        transition:'background 120ms, border-color 120ms',
                      }}>
                      <div style={{
                        width:34,height:34,borderRadius:'50%',
                        background:'var(--surface)',display:'grid',placeItems:'center',
                        color:'var(--accent)',
                      }}>
                        <I.upload size={16}/>
                      </div>
                      <div style={{fontWeight:500,color:'var(--fg-2)'}}>
                        {uploading ? 'Subiendo…' : 'Arrastra aquí'}
                      </div>
                      <div style={{textAlign:'center',lineHeight:1.3}}>
                        {cdnConfig === 'base64'
                          ? 'Se embeberá en Base64 · máx 500 KB'
                          : `Se subirá a ${cdnConfig.toUpperCase()}`}
                      </div>
                    </button>

                    {items.map(it => (
                      <button key={it.id}
                        onClick={()=>setSel(it)}
                        onDoubleClick={()=>{onSelect && onSelect(it); onClose();}}
                        style={{
                          display:'flex',flexDirection:'column',gap:6,
                          border:`2px solid ${sel?.id===it.id?'var(--accent)':'transparent'}`,
                          background: sel?.id===it.id?'var(--accent-soft)':'transparent',
                          borderRadius:'var(--r-md)', padding:6, cursor:'pointer',
                          textAlign:'left',
                        }}
                      >
                        <ImageThumb item={it}/>
                        <div style={{padding:'0 2px'}}>
                          <div style={{fontSize:11,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{it.name}</div>
                          <div style={{fontSize:10,color:'var(--fg-3)',fontFamily:'var(--font-mono)',marginTop:1}}>{it.w}×{it.h} · {it.size}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — preview detail */}
              {sel && (
                <div style={{
                  width:250,flex:'0 0 250px',
                  borderLeft:'1px solid var(--line)',
                  padding:14,background:'var(--surface-2)',
                  overflow:'auto',
                }}>
                  <ImageThumb item={sel} large/>
                  <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:600,marginTop:12,wordBreak:'break-word'}}>{sel.name}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:10,fontSize:11}}>
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Dimensiones</div><div style={{fontFamily:'var(--font-mono)'}}>{sel.w}×{sel.h}</div></div>
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Tamaño</div><div style={{fontFamily:'var(--font-mono)'}}>{sel.size}</div></div>
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Carpeta</div><div>{sel.folder}</div></div>
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Formato</div><div style={{fontFamily:'var(--font-mono)',textTransform:'uppercase'}}>{(sel.name.split('.').pop()||'').toUpperCase()}</div></div>
                  </div>
                  <div style={{marginTop:14,padding:10,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',fontSize:10.5,color:'var(--fg-3)',lineHeight:1.5}}>
                    <div style={{color:'var(--fg-2)',fontWeight:500,marginBottom:2}}>Al usar esta imagen</div>
                    Se embedará en el correo como Base64 ({sel.size} aprox.). Cambia el proveedor en Ajustes → Almacenamiento para subir a un CDN.
                  </div>
                  <button className="btn primary" style={{width:'100%',marginTop:12}}
                    onClick={()=>{onSelect && onSelect(sel); onClose();}}>
                    <I.check size={13}/> Usar esta imagen
                  </button>
                </div>
              )}
            </>
          )}

          {tab==='url' && (
            <div style={{flex:1,padding:'40px 60px',overflow:'auto'}}>
              <div style={{maxWidth:500,margin:'0 auto'}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:6}}>Cargar desde URL</div>
                <p style={{fontSize:13,color:'var(--fg-3)',lineHeight:1.6,marginBottom:20}}>
                  Pega el enlace directo de la imagen. Simple Template la referenciará tal cual en el correo — asegúrate de que la URL sea pública y permanente.
                </p>
                <label style={{fontSize:11.5,color:'var(--fg-3)',fontWeight:500}}>URL de la imagen</label>
                <input
                  className="field" value={urlInput} onChange={e=>setUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  style={{marginTop:6,marginBottom:12}}
                />
                {urlInput && (
                  <div style={{
                    padding:14,background:'var(--surface-2)',
                    border:'1px solid var(--line)',borderRadius:'var(--r-md)',
                    marginBottom:14,
                  }}>
                    <div style={{fontSize:11,color:'var(--fg-3)',marginBottom:8}}>Vista previa</div>
                    <div style={{
                      aspectRatio:'16/9',background:'var(--surface)',
                      border:'1px solid var(--line)',borderRadius:'var(--r-sm)',
                      display:'grid',placeItems:'center',color:'var(--fg-3)',fontSize:12,
                    }}>Cargando…</div>
                  </div>
                )}
                <div style={{display:'flex',gap:8}}>
                  <button className="btn ghost" onClick={onClose}>Cancelar</button>
                  <div style={{flex:1}}/>
                  <button className="btn primary" disabled={!urlInput}
                    onClick={()=>{onSelect && onSelect({url:urlInput,name:'imagen.jpg',w:'?',h:'?'}); onClose();}}>
                    Usar URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab==='cdn' && (
            <div style={{flex:1,padding:'40px 60px',overflow:'auto'}}>
              <div style={{maxWidth:500,margin:'0 auto',textAlign:'center'}}>
                <div style={{width:56,height:56,borderRadius:'50%',background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center',margin:'0 auto 16px'}}>
                  <I.server size={24}/>
                </div>
                <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:6}}>
                  Explorar tu CDN
                </div>
                <p style={{fontSize:13,color:'var(--fg-3)',lineHeight:1.6,marginBottom:20}}>
                  Aquí aparecerán las imágenes alojadas en el proveedor configurado. Si aún no has conectado uno, ve a Ajustes → Almacenamiento de imágenes.
                </p>
                <button className="btn" onClick={onClose}>Ir a Ajustes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────── Emoji picker ──────────
const EMOJI_CATS = [
  { id:'smileys',  name:'Caras y emociones', icon:'😀',
    items:'😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀👽👻👾🤖🎃😺😸😹😻😼😽🙀😿😾'.match(/.{2,4}/gu) || [],
  },
  { id:'gestures', name:'Gestos y personas', icon:'👋',
    items:'👋🤚🖐✋🖖👌🤌🤏✌🤞🤟🤘🤙👈👉👆🖕👇👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏✍💅🤳💪🦾🦵🦶👂🦻👃🧠🫀🫁🦷🦴👀👁👅👄💋🩸'.match(/.{2,4}/gu) || [],
  },
  { id:'animals',  name:'Animales y naturaleza', icon:'🐶',
    items:'🐶🐱🐭🐹🐰🦊🐻🐼🐻‍❄️🐨🐯🦁🐮🐷🐽🐸🐵🙈🙉🙊🐒🐔🐧🐦🐤🐣🐥🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🪰🪱🪳🦗🕷🕸🦂🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🦍🦧🐘🦣🦛🦏🐪🐫🦒🦘🦬🐃🐂🐄🐎🐖🐏🐑🦙🐐🦌🐕🐩🦮🐈🐓🦃🦤🦚🦜🦢🦩🕊🐇🦝🦨🦡🦫🦦🦥🐁🐀🐿🦔🌵🎄🌲🌳🌴🪵🌱🌿☘🍀🎍🪴🎋🍃🍂🍁🍄🐚🪨🌾💐🌷🌹🥀🪻🪷🌺🌸🌼🌻🌞🌝🌛🌜🌚🌕🌖🌗🌘🌑🌒🌓🌔🌙🌎🌍🌏🪐💫⭐🌟✨⚡☄💥🔥🌪🌈☀🌤⛅🌥☁🌦🌧⛈🌩🌨❄☃⛄🌬💨💧💦🫧☔☂🌊🌫'.match(/.{2,4}/gu) || [],
  },
  { id:'food',     name:'Comida y bebida', icon:'🍎',
    items:'🍎🍏🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶🫑🌽🥕🫒🧄🧅🥔🍠🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🦴🌭🍔🍟🍕🫓🥪🥙🧆🌮🌯🫔🥗🥘🫕🥫🍝🍜🍲🍛🍣🍱🥟🦪🍤🍙🍚🍘🍥🥠🥮🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🌰🥜🍯🥛🍼🫖☕🍵🧃🥤🧋🍶🍺🍻🥂🍷🥃🍸🍹🧉🍾🧊🥄🍴🍽🥣🥡🥢🧂'.match(/.{2,4}/gu) || [],
  },
  { id:'activity', name:'Actividades', icon:'⚽',
    items:'⚽🏀🏈⚾🥎🎾🏐🏉🥏🎱🪀🏓🏸🏒🏑🥍🏏🪃🥅⛳🪁🏹🎣🤿🥊🥋🎽🛹🛼🛷⛸🥌🎿⛷🏂🪂🏋🤼🤸⛹🤺🤾🏌🏇🧘🏄🏊🤽🚣🧗🚵🚴🏆🥇🥈🥉🏅🎖🏵🎗🎫🎟🎪🤹🎭🩰🎨🎬🎤🎧🎼🎹🥁🪘🎷🎺🪗🎸🪕🎻🎲♟🎯🎳🎮🎰🧩'.match(/.{2,4}/gu) || [],
  },
  { id:'travel',   name:'Viajes y lugares', icon:'🚗',
    items:'🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🛻🚚🚛🚜🦯🦽🦼🛴🚲🛵🏍🛺🚨🚔🚍🚘🚖🚡🚠🚟🚃🚋🚞🚝🚄🚅🚈🚂🚆🚇🚊🚉✈🛫🛬🛩💺🛰🚀🛸🚁🛶⛵🚤🛥🛳⛴🚢⚓🪝⛽🚧🚦🚥🚏🗺🗿🗽🗼🏰🏯🏟🎡🎢🎠⛲⛱🏖🏝🏜🌋⛰🏔🗻🏕⛺🛖🏠🏡🏘🏚🏗🏭🏢🏬🏣🏤🏥🏦🏨🏪🏫🏩💒🏛⛪🕌🕍🛕🕋⛩'.match(/.{2,4}/gu) || [],
  },
  { id:'objects',  name:'Objetos', icon:'💡',
    items:'⌚📱📲💻⌨🖥🖨🖱🖲🕹🗜💽💾💿📀📼📷📸📹🎥📽🎞📞☎📟📠📺📻🎙🎚🎛🧭⏱⏲⏰🕰⌛⏳📡🔋🔌💡🔦🕯🪔🧯🛢💸💵💴💶💷🪙💰💳💎⚖🪜🧰🪛🔧🔨⚒🛠⛏🪚🔩⚙🪤🧱⛓🧲🔫💣🧨🪓🔪🗡⚔🛡🚬⚰🪦⚱🏺🔮📿🧿💈🔭🔬🕳🩹🩺💊💉🩸🧬🦠🧫🧪🌡🧹🪠🧺🧻🚽🚰🚿🛁🛀🧼🪥🪒🧽🪣🧴🛎🔑🗝🚪🪑🛋🛏🛌🧸🪆🖼🪞🪟🛍🛒🎁🎈🎏🎀🪄🪅🎊🎉🎎🏮🎐🧧✉📩📨📧💌📥📤📦🏷🪧📪📫📬📭📮📯📜📃📄📑🧾📊📈📉🗒🗓📆📅🗑📇🗃🗳🗄📋📁📂🗂🗞📰📓📔📒📕📗📘📙📚📖🔖🧷🔗📎🖇📐📏🧮📌📍✂🖊🖋✒🖌🖍📝✏🔍🔎🔏🔐🔒🔓'.match(/.{2,4}/gu) || [],
  },
  { id:'symbols',  name:'Símbolos', icon:'❤',
    items:'❤🧡💛💚💙💜🖤🤍🤎💔❣💕💞💓💗💖💘💝💟☮✝☪🕉☸✡🔯🕎☯☦🛐⛎♈♉♊♋♌♍♎♏♐♑♒♓🆔⚛🉑☢☣📴📳🈶🈚🈸🈺🈷✴🆚💮🉐㊙㊗🈴🈵🈹🈲🅰🅱🆎🆑🅾🆘❌⭕🛑⛔📛🚫💯💢♨🚷🚯🚳🚱🔞📵🚭❗❕❓❔‼⁉🔅🔆〽⚠🚸🔱⚜🔰♻✅🈯💹❇✳❎🌐💠Ⓜ🌀💤🏧🚾♿🅿🈳🈂🛂🛃🛄🛅🚹🚺🚼🚻🚮🎦📶🈁🔣ℹ🔤🔡🔠🆖🆗🆙🆒🆕🆓0⃣1⃣2⃣3⃣4⃣5⃣6⃣7⃣8⃣9⃣🔟🔢#⃣*⃣⏏▶⏸⏯⏹⏺⏭⏮⏩⏪⏫⏬◀🔼🔽➡⬅⬆⬇↗↘↙↖↕↔↪↩⤴⤵🔀🔁🔂🔄🔃🎵🎶➕➖➗✖♾💲💱™©®〰➰➿🔚🔙🔛🔝🔜✔☑🔘🔴🟠🟡🟢🔵🟣⚫⚪🟤🔺🔻🔸🔹🔶🔷🔳🔲▪▫◾◽◼◻🟥🟧🟨🟩🟦🟪⬛⬜🟫🔈🔇🔉🔊🔔🔕📣📢👁‍🗨💬💭🗯♠♣♥♦🃏🎴🀄🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧'.match(/.{2,4}/gu) || [],
  },
  { id:'flags',    name:'Banderas', icon:'🏁',
    items:'🏁🚩🎌🏴🏳🏳‍🌈🏳‍⚧🏴‍☠🇦🇨🇦🇩🇦🇪🇦🇫🇦🇬🇦🇮🇦🇱🇦🇲🇦🇴🇦🇷🇦🇸🇦🇹🇦🇺🇦🇼🇦🇽🇦🇿🇧🇦🇧🇧🇧🇩🇧🇪🇧🇫🇧🇬🇧🇭🇧🇮🇧🇯🇧🇱🇧🇲🇧🇳🇧🇴🇧🇶🇧🇷🇧🇸🇧🇹🇧🇼🇧🇾🇧🇿🇨🇦🇨🇨🇨🇩🇨🇫🇨🇬🇨🇭🇨🇮🇨🇰🇨🇱🇨🇲🇨🇳🇨🇴🇨🇷🇨🇺🇨🇻🇨🇼🇨🇾🇨🇿🇩🇪🇩🇯🇩🇰🇩🇲🇩🇴🇩🇿🇪🇨🇪🇪🇪🇬🇪🇷🇪🇸🇪🇹🇪🇺🇫🇮🇫🇯🇫🇲🇫🇴🇫🇷🇬🇦🇬🇧🇬🇩🇬🇪🇬🇭🇬🇮🇬🇱🇬🇲🇬🇳🇬🇷🇬🇹🇬🇺🇬🇼🇬🇾🇭🇰🇭🇳🇭🇷🇭🇹🇭🇺🇮🇨🇮🇩🇮🇪🇮🇱🇮🇲🇮🇳🇮🇶🇮🇷🇮🇸🇮🇹🇯🇲🇯🇴🇯🇵🇰🇪🇰🇬🇰🇭🇰🇮🇰🇲🇰🇳🇰🇵🇰🇷🇰🇼🇰🇾🇰🇿🇱🇦🇱🇧🇱🇨🇱🇮🇱🇰🇱🇷🇱🇸🇱🇹🇱🇺🇱🇻🇱🇾🇲🇦🇲🇨🇲🇩🇲🇪🇲🇬🇲🇭🇲🇰🇲🇱🇲🇲🇲🇳🇲🇴🇲🇵🇲🇶🇲🇷🇲🇸🇲🇹🇲🇺🇲🇻🇲🇼🇲🇽🇲🇾🇲🇿🇳🇦🇳🇪🇳🇫🇳🇬🇳🇮🇳🇱🇳🇴🇳🇵🇳🇷🇳🇺🇳🇿🇴🇲🇵🇦🇵🇪🇵🇫🇵🇬🇵🇭🇵🇰🇵🇱🇵🇲🇵🇷🇵🇸🇵🇹🇵🇼🇵🇾🇶🇦🇷🇴🇷🇸🇷🇺🇷🇼🇸🇦🇸🇧🇸🇨🇸🇩🇸🇪🇸🇬🇸🇭🇸🇮🇸🇰🇸🇱🇸🇲🇸🇳🇸🇴🇸🇷🇸🇸🇸🇹🇸🇻🇸🇾🇸🇿🇹🇩🇹🇫🇹🇬🇹🇭🇹🇯🇹🇰🇹🇱🇹🇲🇹🇳🇹🇴🇹🇷🇹🇹🇹🇻🇹🇼🇹🇿🇺🇦🇺🇬🇺🇸🇺🇾🇺🇿🇻🇦🇻🇨🇻🇪🇻🇬🇻🇮🇻🇳🇻🇺🇼🇫🇼🇸🇽🇰🇾🇪🇾🇹🇿🇦🇿🇲🇿🇼'.match(/.{2,8}/gu) || [],
  },
];

function EmojiPicker({ onSelect }) {
  const [cat, setCat] = React.useState('smileys');
  const [q, setQ] = React.useState('');
  const current = EMOJI_CATS.find(c => c.id===cat);

  return (
    <div style={{
      background:'var(--surface)',
      border:'1px solid var(--line)',
      borderRadius:'var(--r-md)',
      overflow:'hidden',
      display:'flex',flexDirection:'column',
      height:360,
    }}>
      {/* Category tabs */}
      <div style={{
        display:'flex',gap:2,padding:6,
        borderBottom:'1px solid var(--line)',
        background:'var(--surface-2)',
        overflowX:'auto',flexShrink:0,
      }}>
        {EMOJI_CATS.map(c => (
          <button key={c.id}
            onClick={()=>setCat(c.id)}
            title={c.name}
            style={{
              padding:'6px 8px',border:'none',
              background: cat===c.id?'var(--surface)':'transparent',
              borderRadius:'var(--r-sm)',cursor:'pointer',
              fontSize:18,flexShrink:0,
              boxShadow: cat===c.id?'0 1px 3px rgba(0,0,0,0.08)':'none',
            }}
          >{c.icon}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{padding:'8px 10px',borderBottom:'1px solid var(--line)',flexShrink:0}}>
        <div className="search">
          <span className="si"><I.search size={12}/></span>
          <input placeholder="Buscar emoji…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
      </div>

      {/* Grid */}
      <div style={{flex:1,overflow:'auto',padding:10}}>
        <div style={{
          fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.06em',
          color:'var(--fg-3)',fontWeight:600,marginBottom:8,
        }}>{current?.name}</div>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(32px,1fr))',
          gap:2,
        }}>
          {(current?.items||[]).map((e,i) => (
            <button key={i}
              onClick={()=>onSelect && onSelect(e)}
              style={{
                width:32,height:32,border:'none',
                background:'transparent',cursor:'pointer',
                fontSize:20,lineHeight:1,borderRadius:4,
                display:'grid',placeItems:'center',
              }}
              onMouseEnter={e2=>e2.currentTarget.style.background='var(--surface-2)'}
              onMouseLeave={e2=>e2.currentTarget.style.background='transparent'}
            >{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ImagePickerModal, EmojiPicker, IMG_LIB_MOCK });
