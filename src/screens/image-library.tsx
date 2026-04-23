// Biblioteca de imágenes — pantalla completa estilo WordPress Media Library.
// Lee de stImages (workspace-scoped, persistido en SQLite). El modal
// ImagePickerModal comparte la misma fuente, así que lo que subas aquí
// aparece al insertar imágenes desde el editor.

function fmtBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso) {
  if (!iso) return '';
  // SQLite stores UTC without Z — parse as UTC so local rendering is correct.
  const normalized = iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z';
  try {
    return new Date(normalized).toLocaleString('es', { dateStyle:'medium', timeStyle:'short' });
  } catch { return iso; }
}

function ImageLibraryScreen({ onBack, onOpenSettings }) {
  const [folder, setFolder] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [renameMode, setRenameMode] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState('');
  const fileInputRef = React.useRef(null);

  const [items, setItems] = React.useState(() => window.stImages.listCached());
  React.useEffect(() => {
    const refresh = () => setItems(window.stImages.listCached());
    window.addEventListener('st:images-change', refresh);
    window.stImages.list().catch(() => {});
    return () => window.removeEventListener('st:images-change', refresh);
  }, []);

  // Re-lookup the selected item whenever the cache changes so the right pane
  // reflects the latest folder/name after edits.
  React.useEffect(() => {
    if (!sel) return;
    const fresh = items.find((i) => i.id === sel.id);
    if (fresh && fresh !== sel) setSel(fresh);
    if (!fresh && sel) setSel(null);
  }, [items]);

  const cdnConfig = window.stStorage.getWSSetting('storage', {}).mode || 'local';

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of files) {
        const result = await window.stCDN.upload(file);
        if (!result.ok) {
          setUploadError(result.error || `No se pudo subir ${file.name}.`);
          break;
        }
        const dim = await window.stImages.readImageSize(file);
        const saved = await window.stImages.save({
          url: result.url,
          name: file.name || 'imagen',
          folder: folder === 'all' ? 'Subidas' : folder,
          mime: file.type || null,
          sizeBytes: file.size || null,
          width: dim.width,
          height: dim.height,
          provider: result.mode || cdnConfig,
          localPath: result.localPath || null,
        });
        if (saved) setSel(saved);
      }
    } catch (err) {
      setUploadError(err?.message || 'Error inesperado al subir.');
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = async (e) => {
    await handleFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    await handleFiles(Array.from(e.dataTransfer?.files || []));
  };

  const folders = [
    { id:'all', name:'Toda la biblioteca', count: items.length },
    ...window.stImages.folders().map(f => ({ id: f.folder, name: f.folder, count: f.count })),
  ];

  const filtered = items
    .filter((i) => folder === 'all' || i.folder === folder)
    .filter((i) => !q || (i.name || '').toLowerCase().includes(q.toLowerCase()));

  const onDelete = async (img) => {
    if (!window.confirm(`Quitar «${img.name}» de la biblioteca?\n\nEsto solo elimina el registro local. El archivo en el CDN no se borra.`)) return;
    await window.stImages.remove(img.id);
  };

  const onMoveFolder = async (img) => {
    const current = img.folder || 'Sin carpeta';
    const name = window.prompt('Mover a carpeta (nombre libre)', current);
    if (name == null) return;
    const clean = name.trim() || 'Sin carpeta';
    await window.stImages.updateFolder(img.id, clean);
  };

  const onRenameSubmit = async () => {
    if (!sel) return;
    const clean = renameDraft.trim();
    if (!clean || clean === sel.name) {
      setRenameMode(false);
      return;
    }
    await window.stImages.rename(sel.id, clean);
    setRenameMode(false);
  };

  const onCopyUrl = async (img) => {
    try {
      await navigator.clipboard.writeText(img.url);
      window.toast && window.toast({ kind:'ok', title:'URL copiada' });
    } catch {
      window.toast && window.toast({ kind:'err', title:'No se pudo copiar' });
    }
  };

  return (
    <div className="editor" onDragOver={(e)=>{ e.preventDefault(); }} onDrop={onDrop}>
      <div className="editor-top">
        <button className="btn ghost sm" onClick={onBack}><I.chevronL size={14}/> Volver</button>
        <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,letterSpacing:-0.2}}>Biblioteca de imágenes</div>
        <span className="chip">{filtered.length} {filtered.length===1?'imagen':'imágenes'}{q||folder!=='all'?` de ${items.length}`:''}</span>
        <div className="grow"/>
        <div className="search">
          <span className="si"><I.search size={14}/></span>
          <input placeholder="Buscar imágenes…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div style={{fontSize:11,color:'var(--fg-3)',padding:'0 6px'}}>
          Destino: <b style={{color:'var(--fg-2)',textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>{cdnConfig}</b>
        </div>
        <button className="btn primary sm" onClick={()=>fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Subiendo…' : <><I.upload size={13}/> Subir imágenes</>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onInputChange}
          style={{display:'none'}}/>
      </div>

      {uploadError && (
        <div style={{
          margin:'0 24px',marginTop:12,padding:'10px 12px',
          background:'color-mix(in oklab, var(--danger) 12%, transparent)',
          borderRadius:'var(--r-sm)',fontSize:12,color:'var(--danger)',
          display:'flex',gap:8,alignItems:'flex-start',
        }}>
          <I.x size={14} style={{marginTop:1,flexShrink:0}}/>
          <div><b>No pudimos subir.</b> {uploadError}</div>
        </div>
      )}

      <div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>
        {/* Sidebar — carpetas */}
        <aside style={{
          width:220, flex:'0 0 220px',
          borderRight:'1px solid var(--line)',
          padding:16, overflow:'auto',
        }}>
          <div style={{fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--fg-3)',fontWeight:600,marginBottom:8}}>Carpetas</div>
          {folders.map(f => (
            <button key={f.id}
              onClick={()=>setFolder(f.id)}
              style={{
                display:'flex',alignItems:'center',gap:8,
                width:'100%',padding:'7px 9px',
                border:'none',background: folder===f.id?'var(--accent-soft)':'transparent',
                color: folder===f.id?'var(--accent)':'var(--fg-2)',
                borderRadius:'var(--r-sm)', cursor:'pointer',
                fontSize:12.5,textAlign:'left',marginBottom:2,
              }}
            >
              <I.folder size={13}/>
              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
              <span style={{fontSize:10.5,color:'var(--fg-3)'}}>{f.count}</span>
            </button>
          ))}
          <div style={{marginTop:14,padding:10,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5}}>
            Las carpetas se crean solas cuando asignas una al mover una imagen. Son solo un nombre; no hay anidamiento.
          </div>
          {onOpenSettings && (
            <button className="btn sm" style={{marginTop:14,width:'100%'}} onClick={()=>onOpenSettings('storage')}>
              <I.server size={12}/> Ajustes de almacenamiento
            </button>
          )}
        </aside>

        {/* Main — grid */}
        <main style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{flex:1,overflow:'auto',padding:18}}
            onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
            onDragLeave={()=>setDragOver(false)}>
            {items.length === 0 ? (
              <EmptyState
                illustration="no-blocks"
                title="Aún no hay imágenes en esta biblioteca"
                msg="Subí tu primera imagen desde aquí o arrastrala a la pantalla. Después podrás usarla en cualquier plantilla — el editor lee de esta misma biblioteca."
                primaryAction={{ label:'Subir imagen', icon:'upload', onClick:()=>fileInputRef.current?.click() }}
                tips={[
                  cdnConfig==='local'
                    ? 'Destino actual: tu equipo (disco local). Las imágenes se embeben automáticamente al exportar o enviar.'
                    : cdnConfig==='base64'
                      ? 'Destino actual: Base64 embebido dentro del HTML del correo.'
                      : `Destino actual: ${cdnConfig.toUpperCase()}. Las imágenes se suben a tu CDN al guardarlas.`,
                  'Cambia el proveedor en Ajustes → Almacenamiento si querés publicar las imágenes en un CDN.',
                  'Al insertar una imagen en un bloque, Simple Template la selecciona desde aquí.',
                ]}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                illustration="search"
                title={q ? `Nada que coincida con «${q}»` : `Nada en «${folder}» todavía`}
                msg="Prueba con otro término o vuelve a toda la biblioteca."
                primaryAction={{ label:'Ver todas', icon:'grid', onClick:()=>{setQ(''); setFolder('all');} }}
              />
            ) : (
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))',
                gap:12,
              }}>
                {/* Drop-zone tile */}
                <button
                  type="button"
                  onClick={()=>fileInputRef.current?.click()}
                  style={{
                    aspectRatio:'1/1',
                    background: dragOver ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--line-2)'}`,
                    borderRadius:'var(--r-md)',
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
                    color:'var(--fg-3)',cursor: uploading ? 'wait' : 'pointer',padding:12,fontSize:11,
                    transition:'background 120ms, border-color 120ms',
                  }}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:'var(--surface)',display:'grid',placeItems:'center',color:'var(--accent)'}}>
                    <I.upload size={18}/>
                  </div>
                  <div style={{fontWeight:500,color:'var(--fg-2)'}}>
                    {uploading ? 'Subiendo…' : 'Subir imagen'}
                  </div>
                  <div style={{textAlign:'center',lineHeight:1.3}}>
                    Arrastra aquí o haz click
                  </div>
                </button>

                {filtered.map(it => (
                  <button key={it.id}
                    onClick={()=>{ setSel(it); setRenameMode(false); }}
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
                      <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{it.name}</div>
                      <div style={{fontSize:10.5,color:'var(--fg-3)',fontFamily:'var(--font-mono)',marginTop:1}}>
                        {it.width && it.height ? `${it.width}×${it.height}` : '—'} · {fmtBytes(it.sizeBytes)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right — preview/detail */}
        {sel && (
          <aside style={{
            width:300,flex:'0 0 300px',
            borderLeft:'1px solid var(--line)',
            padding:18,background:'var(--surface-2)',
            overflow:'auto',display:'flex',flexDirection:'column',gap:12,
          }}>
            <ImageThumb item={sel} large/>

            {renameMode ? (
              <div style={{display:'flex',gap:6}}>
                <input
                  className="field"
                  value={renameDraft}
                  autoFocus
                  onChange={e=>setRenameDraft(e.target.value)}
                  onKeyDown={e=>{ if (e.key==='Enter') onRenameSubmit(); if (e.key==='Escape') setRenameMode(false); }}
                  style={{flex:1}}/>
                <button className="btn sm primary" onClick={onRenameSubmit}>OK</button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:600,wordBreak:'break-word',flex:1}}>{sel.name}</div>
                <button className="btn icon sm" title="Renombrar"
                  onClick={()=>{ setRenameDraft(sel.name||''); setRenameMode(true); }}>
                  <I.edit size={12}/>
                </button>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:11.5}}>
              <div><div style={{color:'var(--fg-3)',fontSize:10}}>Dimensiones</div><div style={{fontFamily:'var(--font-mono)'}}>{sel.width && sel.height ? `${sel.width}×${sel.height}` : '—'}</div></div>
              <div><div style={{color:'var(--fg-3)',fontSize:10}}>Tamaño</div><div style={{fontFamily:'var(--font-mono)'}}>{fmtBytes(sel.sizeBytes)}</div></div>
              <div><div style={{color:'var(--fg-3)',fontSize:10}}>Carpeta</div><div>{sel.folder}</div></div>
              <div><div style={{color:'var(--fg-3)',fontSize:10}}>Origen</div><div style={{fontFamily:'var(--font-mono)',textTransform:'uppercase'}}>{sel.provider || '—'}</div></div>
              <div style={{gridColumn:'1 / -1'}}>
                <div style={{color:'var(--fg-3)',fontSize:10}}>Subida</div>
                <div style={{fontSize:11}}>{fmtDate(sel.createdAt)}</div>
              </div>
            </div>

            <div>
              <div style={{color:'var(--fg-3)',fontSize:10,marginBottom:4}}>URL</div>
              <div style={{
                padding:'6px 8px',background:'var(--surface)',border:'1px solid var(--line)',
                borderRadius:'var(--r-sm)',fontFamily:'var(--font-mono)',fontSize:10.5,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
              }} title={sel.url}>{sel.url}</div>
            </div>

            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <button className="btn sm" onClick={()=>onCopyUrl(sel)}>
                <I.copy size={12}/> Copiar URL
              </button>
              <button className="btn sm" onClick={()=>onMoveFolder(sel)}>
                <I.folder size={12}/> Mover a carpeta
              </button>
            </div>

            <div style={{flex:1}}/>
            <button className="btn sm" style={{color:'var(--danger)'}} onClick={()=>onDelete(sel)}>
              <I.trash size={12}/> Quitar de la biblioteca
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ImageLibraryScreen });
