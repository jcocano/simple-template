// Modal de selección de imagen — 3 tabs: Biblioteca local / URL / CDN
// + Emoji picker para bloque Icono
//
// La biblioteca lee del store real (stImages), que es workspace-scoped y
// persiste en SQLite. Al subir un archivo, se sube al provider configurado
// (stCDN) y luego se guarda el registro para que aparezca en la grid y en
// la pantalla dedicada Biblioteca de imágenes.

function formatBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Hook pequeño: leer y suscribirse al cache de stImages. Cargamos on mount
// si el cache está frío. Devuelve siempre la lista más reciente.
function useImageLibrary() {
  const [items, setItems] = React.useState(() => window.stImages?.listCached?.() || []);
  React.useEffect(() => {
    const refresh = () => setItems(window.stImages?.listCached?.() || []);
    window.addEventListener('st:images-change', refresh);
    // Kick off an async reload so the cache reflects reality after reloads.
    window.stImages?.list?.().catch(() => {});
    return () => window.removeEventListener('st:images-change', refresh);
  }, []);
  return items;
}

function ImageThumb({ item, large=false }) {
  return (
    <div style={{
      width:'100%', aspectRatio: large ? '4/3' : '1/1',
      background:'var(--surface-2)', overflow:'hidden',
      borderRadius: large ? 'var(--r-md)' : 'var(--r-sm)',
    }}>
      {item?.url ? (
        <img
          src={item.url}
          alt={item.name || ''}
          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
          loading="lazy"
        />
      ) : (
        <div style={{width:'100%',height:'100%',display:'grid',placeItems:'center',color:'var(--fg-3)',fontSize:11}}>
          <I.image size={20}/>
        </div>
      )}
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
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const library = useImageLibrary();

  if (!open) return null;

  const cdnConfig = window.stStorage.getWSSetting('storage', {}).mode || 'local';

  // Upload any file through stCDN and persist it to the workspace's image
  // library (stImages) on success. The newly-saved entry is the authoritative
  // reference — the grid re-renders from the cache.
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
      const dim = await window.stImages.readImageSize(file);
      const saved = await window.stImages.save({
        url: result.url,
        name: file.name || 'imagen',
        folder: 'Subidas',
        mime: file.type || null,
        sizeBytes: file.size || null,
        width: dim.width,
        height: dim.height,
        provider: result.mode || cdnConfig,
        localPath: result.localPath || null,
      });
      if (saved) setSel(saved);
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

  const items = library
    .filter((i) => folder === 'all' || i.folder === folder)
    .filter((i) => !q || (i.name || '').toLowerCase().includes(q.toLowerCase()));

  // Folders derived from the live library. "Toda la biblioteca" is always
  // first; the rest are sorted by the facade (alphabetical).
  const folderList = [
    { id:'all', name:'Toda la biblioteca', count: library.length },
    ...window.stImages.folders().map(f => ({ id: f.folder, name: f.folder, count: f.count })),
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
            <div style={{fontSize:11.5,color:'var(--fg-3)'}}>
              {cdnConfig === 'local'
                ? 'Biblioteca del espacio · Guardadas en tu equipo'
                : cdnConfig === 'base64'
                  ? 'Biblioteca del espacio · Las imágenes se embeben en Base64'
                  : `Biblioteca del espacio · Subidas van a ${cdnConfig.toUpperCase()}`}
            </div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={14}/></button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:2,padding:'6px 10px 0',borderBottom:'1px solid var(--line)'}}>
          {[
            {id:'library', icon:'folder', label:'Biblioteca', badge:library.length},
            {id:'url',     icon:'external', label:'URL externa'},
            {id:'cdn',     icon:'server', label:`CDN · ${cdnConfig==='local'||cdnConfig==='base64'?'no configurado':cdnConfig}`, disabled:cdnConfig==='local'||cdnConfig==='base64'},
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
                {folderList.map(f => (
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
                {library.length === 0 && (
                  <div style={{
                    marginTop:8,padding:'10px 8px',
                    fontSize:11,color:'var(--fg-3)',lineHeight:1.4,
                  }}>
                    Aún no subes imágenes. Arrastra una al panel o pulsa «Subir».
                  </div>
                )}
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
                        {cdnConfig === 'local'
                          ? 'Se guardará en tu equipo'
                          : cdnConfig === 'base64'
                            ? 'Se embeberá en Base64'
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
                          <div style={{fontSize:10,color:'var(--fg-3)',fontFamily:'var(--font-mono)',marginTop:1}}>
                            {it.width && it.height ? `${it.width}×${it.height}` : '—'} · {formatBytes(it.sizeBytes)}
                          </div>
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
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Dimensiones</div><div style={{fontFamily:'var(--font-mono)'}}>{sel.width && sel.height ? `${sel.width}×${sel.height}` : '—'}</div></div>
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Tamaño</div><div style={{fontFamily:'var(--font-mono)'}}>{formatBytes(sel.sizeBytes)}</div></div>
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Carpeta</div><div>{sel.folder}</div></div>
                    <div><div style={{color:'var(--fg-3)',fontSize:10}}>Origen</div><div style={{fontFamily:'var(--font-mono)',textTransform:'uppercase'}}>{sel.provider || '—'}</div></div>
                  </div>
                  <button className="btn primary" style={{width:'100%',marginTop:12}}
                    onClick={()=>{onSelect && onSelect(sel); onClose();}}>
                    <I.check size={13}/> Usar esta imagen
                  </button>
                  <button className="btn ghost" style={{width:'100%',marginTop:6,color:'var(--danger)'}}
                    onClick={async ()=>{
                      if (!window.confirm(`Quitar «${sel.name}» de la biblioteca? No se borra del CDN.`)) return;
                      await window.stImages.remove(sel.id);
                      setSel(null);
                    }}>
                    <I.trash size={12}/> Quitar de la biblioteca
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

Object.assign(window, { ImagePickerModal, EmojiPicker, ImageThumb });
