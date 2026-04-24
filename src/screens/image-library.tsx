// Full-screen media library backed by workspace-scoped `stImages` (SQLite).
// Shares the same source as ImagePicker, so uploads become immediately available.
//
// Folders are first-class records ({id, name, color}) persisted in workspace
// settings — see `src/lib/image-folders.tsx`. Images link to a folder by id
// via the `folder` column on the images table. Legacy string-based folders
// from earlier versions are migrated on mount.

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
  const t = window.stI18n.t;
  window.stI18n.useLang();
  // folder: 'all' | 'unassigned' | <folderId>
  const [folder, setFolder] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [renameMode, setRenameMode] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState('');
  const [dragOverFolder, setDragOverFolder] = React.useState(null);
  const [folderModal, setFolderModal] = React.useState(null); // { mode:'new'|'edit', folder? }
  const [moveMenuOpen, setMoveMenuOpen] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const [items, setItems] = React.useState(() => window.stImages.listCached());
  const folders = window.useImageFolders();

  React.useEffect(() => {
    const refresh = () => setItems(window.stImages.listCached());
    window.addEventListener('st:images-change', refresh);
    window.stImages.list().then(() => {
      // Migrate legacy string-based folders into proper records. One-shot:
      // subsequent mounts find nothing to migrate and exit immediately.
      window.stImageFolders?.migrateLegacy?.().catch(() => {});
    }).catch(() => {});
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

  // Upload into the currently-visible folder. When on 'all' or 'unassigned',
  // images stay unassigned — user moves them manually or drags into a folder.
  const uploadFolderId = (folder !== 'all' && folder !== 'unassigned') ? folder : null;

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of files) {
        const result = await window.stCDN.upload(file);
        if (!result.ok) {
          setUploadError(window.stIpcErr.localize(result));
          break;
        }
        let width = result.width ?? null;
        let height = result.height ?? null;
        if (width == null || height == null) {
          const dim = await window.stImages.readImageSize(file);
          width = dim.width;
          height = dim.height;
        }
        const saved = await window.stImages.save({
          url: result.url,
          name: file.name || t('imageLib.fallback.name'),
          folder: uploadFolderId,
          mime: result.mime ?? file.type ?? null,
          sizeBytes: result.sizeBytes ?? file.size ?? null,
          width,
          height,
          provider: result.mode || cdnConfig,
          localPath: result.localPath || null,
        });
        if (saved) setSel(saved);
      }
    } catch (err) {
      setUploadError(err?.message || t('imageLib.error.unexpected'));
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

  // Resolve each image to its folder record so we can compute counts and
  // render badges. Images whose `folder` column points to a missing id are
  // considered unassigned (the folder was deleted).
  const folderById = React.useMemo(() => {
    const map = new Map();
    for (const f of folders) map.set(f.id, f);
    return map;
  }, [folders]);

  const counts = React.useMemo(() => {
    const byFolder = new Map();
    let unassigned = 0;
    for (const img of items) {
      if (img.folder && folderById.has(img.folder)) {
        byFolder.set(img.folder, (byFolder.get(img.folder) || 0) + 1);
      } else {
        unassigned++;
      }
    }
    return { byFolder, unassigned };
  }, [items, folderById]);

  const filtered = items
    .filter((i) => {
      if (folder === 'all') return true;
      if (folder === 'unassigned') return !i.folder || !folderById.has(i.folder);
      return i.folder === folder;
    })
    .filter((i) => !q || (i.name || '').toLowerCase().includes(q.toLowerCase()));

  const resolvedSelFolder = sel && sel.folder && folderById.get(sel.folder);
  const selFolderName = resolvedSelFolder ? resolvedSelFolder.name : t('imageLib.folder.unassigned');

  const onDelete = async (img) => {
    if (!window.confirm(t('imageLib.confirm.delete', { name: img.name }))) return;
    await window.stImages.remove(img.id);
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
      window.toast && window.toast({ kind:'ok', title: t('imageLib.toast.urlCopied') });
    } catch {
      window.toast && window.toast({ kind:'err', title: t('imageLib.toast.copyFail') });
    }
  };

  const moveImageToFolder = async (imgId, folderId) => {
    await window.stImages.updateFolder(imgId, folderId || null);
  };

  // Folder drop: accepts dragged images (text/x-mc-image) and moves them.
  const folderDropProps = (folderId) => ({
    onDragOver: (e) => {
      if (!Array.from(e.dataTransfer.types).includes('text/x-mc-image')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverFolder !== folderId) setDragOverFolder(folderId);
    },
    onDragLeave: (e) => {
      if (e.currentTarget.contains(e.relatedTarget)) return;
      setDragOverFolder((cur) => (cur === folderId ? null : cur));
    },
    onDrop: (e) => {
      const imgId = e.dataTransfer.getData('text/x-mc-image');
      setDragOverFolder(null);
      if (!imgId) return;
      e.preventDefault();
      moveImageToFolder(imgId, folderId);
    },
  });

  const onDeleteFolder = async (f) => {
    const msg = t('imageLib.folder.deleteConfirm', { name: f.name });
    if (!window.confirm(msg)) return;
    await window.stImageFolders.remove(f.id);
    if (folder === f.id) setFolder('all');
  };

  return (
    <div className="editor" onDragOver={(e)=>{ e.preventDefault(); }} onDrop={onDrop}>
      <div className="editor-top">
        <button className="btn ghost sm" onClick={onBack}><I.chevronL size={14}/> {t('imageLib.back')}</button>
        <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,letterSpacing:-0.2}}>{t('imageLib.title')}</div>
        <span className="chip">{t(filtered.length===1?'imageLib.count.one':'imageLib.count.other', { n: filtered.length })}{(q||folder!=='all')?' '+t('imageLib.countOf', { total: items.length }):''}</span>
        <div className="grow"/>
        <div className="search">
          <span className="si"><I.search size={14}/></span>
          <input placeholder={t('imageLib.search.placeholder')} value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div style={{fontSize:11,color:'var(--fg-3)',padding:'0 6px'}}>
          {t('imageLib.destination')}: <b style={{color:'var(--fg-2)',textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>{cdnConfig}</b>
        </div>
        <button className="btn primary sm" onClick={()=>fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? t('imageLib.uploading') : <><I.upload size={13}/> {t('imageLib.upload')}</>}
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
          <div><b>{t('imageLib.error.title')}</b> {uploadError}</div>
        </div>
      )}

      <div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>
        <aside style={{
          width:220, flex:'0 0 220px',
          borderRight:'1px solid var(--line)',
          padding:16, overflow:'auto',
        }}>
          <div style={{fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--fg-3)',fontWeight:600,marginBottom:8}}>{t('imageLib.folders')}</div>

          <FolderNavItem
            active={folder === 'all'}
            onClick={()=>setFolder('all')}
            label={t('imageLib.folder.all')}
            count={items.length}
            icon={<I.folder size={13}/>}
          />

          {folders.map((f) => (
            <FolderNavItem
              key={f.id}
              active={folder === f.id}
              dropOver={dragOverFolder === f.id}
              onClick={()=>setFolder(f.id)}
              color={f.color}
              label={f.name}
              count={counts.byFolder.get(f.id) || 0}
              dropProps={folderDropProps(f.id)}
              actions={(
                <>
                  <button className="btn icon sm ghost" title={t('imageLib.folder.edit')}
                    onClick={(e)=>{ e.stopPropagation(); setFolderModal({ mode:'edit', folder: f }); }}>
                    <I.edit size={11}/>
                  </button>
                  <button className="btn icon sm ghost" title={t('imageLib.folder.delete')}
                    onClick={(e)=>{ e.stopPropagation(); onDeleteFolder(f); }}>
                    <I.trash size={11}/>
                  </button>
                </>
              )}
            />
          ))}

          {counts.unassigned > 0 && (
            <FolderNavItem
              active={folder === 'unassigned'}
              dropOver={dragOverFolder === 'unassigned'}
              onClick={()=>setFolder('unassigned')}
              label={t('imageLib.folder.unassigned')}
              count={counts.unassigned}
              icon={<I.folder size={13}/>}
              dropProps={folderDropProps(null)}
            />
          )}

          <button className="nav-item" onClick={()=>setFolderModal({ mode:'new' })}
            style={{color:'var(--fg-3)',background:'transparent',border:'none',width:'100%',marginTop:4,cursor:'pointer',
              display:'flex',alignItems:'center',gap:8,padding:'7px 9px',fontSize:12.5,textAlign:'left',
            }}>
            <I.plus size={12}/>
            <span>{t('imageLib.folder.new')}</span>
          </button>

          <div style={{marginTop:14,padding:10,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:'var(--r-sm)',fontSize:11,color:'var(--fg-3)',lineHeight:1.5}}>
            {t('imageLib.folders.hint')}
          </div>
          {onOpenSettings && (
            <button className="btn sm" style={{marginTop:14,width:'100%'}} onClick={()=>onOpenSettings('storage')}>
              <I.server size={12}/> {t('imageLib.storageSettings')}
            </button>
          )}
        </aside>

        <main style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{flex:1,overflow:'auto',padding:18}}
            onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
            onDragLeave={()=>setDragOver(false)}>
            {items.length === 0 ? (
              <EmptyState
                illustration="no-blocks"
                title={t('imageLib.empty.title')}
                msg={t('imageLib.empty.msg')}
                primaryAction={{ label: t('imageLib.empty.upload'), icon:'upload', onClick:()=>fileInputRef.current?.click() }}
                tips={[
                  cdnConfig==='local'
                    ? t('imageLib.tip.local')
                    : cdnConfig==='base64'
                      ? t('imageLib.tip.base64')
                      : t('imageLib.tip.cdn', { provider: cdnConfig.toUpperCase() }),
                  t('imageLib.tip.changeProvider'),
                  t('imageLib.tip.insert'),
                ]}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                illustration="search"
                title={q ? t('imageLib.empty.search.title', { q }) : t('imageLib.empty.folder.title', { folder: (folderById.get(folder)?.name || t('imageLib.folder.unassigned')) })}
                msg={t('imageLib.empty.search.msg')}
                primaryAction={{ label: t('imageLib.empty.viewAll'), icon:'grid', onClick:()=>{setQ(''); setFolder('all');} }}
              />
            ) : (
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))',
                gap:12,
              }}>
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
                    {uploading ? t('imageLib.uploading') : t('imageLib.empty.upload')}
                  </div>
                  <div style={{textAlign:'center',lineHeight:1.3}}>
                    {t('imageLib.dropHint')}
                  </div>
                </button>

                {filtered.map(it => (
                  <button key={it.id}
                    draggable
                    onDragStart={(e)=>{
                      e.dataTransfer.setData('text/x-mc-image', it.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={()=>{ setSel(it); setRenameMode(false); setMoveMenuOpen(false); }}
                    style={{
                      display:'flex',flexDirection:'column',gap:6,
                      border:`2px solid ${sel?.id===it.id?'var(--accent)':'transparent'}`,
                      background: sel?.id===it.id?'var(--accent-soft)':'transparent',
                      borderRadius:'var(--r-md)', padding:6, cursor:'grab',
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
                <button className="btn sm primary" onClick={onRenameSubmit}>{t('imageLib.ok')}</button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:600,wordBreak:'break-word',flex:1}}>{sel.name}</div>
                <button className="btn icon sm" title={t('imageLib.rename')}
                  onClick={()=>{ setRenameDraft(sel.name||''); setRenameMode(true); }}>
                  <I.edit size={12}/>
                </button>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:11.5}}>
              <div><div style={{color:'var(--fg-3)',fontSize:10}}>{t('imageLib.meta.dimensions')}</div><div style={{fontFamily:'var(--font-mono)'}}>{sel.width && sel.height ? `${sel.width}×${sel.height}` : '—'}</div></div>
              <div><div style={{color:'var(--fg-3)',fontSize:10}}>{t('imageLib.meta.size')}</div><div style={{fontFamily:'var(--font-mono)'}}>{fmtBytes(sel.sizeBytes)}</div></div>
              <div>
                <div style={{color:'var(--fg-3)',fontSize:10}}>{t('imageLib.meta.folder')}</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {resolvedSelFolder && (
                    <span style={{width:8,height:8,borderRadius:2,background:resolvedSelFolder.color,flexShrink:0}}/>
                  )}
                  <span>{selFolderName}</span>
                </div>
              </div>
              <div><div style={{color:'var(--fg-3)',fontSize:10}}>{t('imageLib.meta.origin')}</div><div style={{fontFamily:'var(--font-mono)',textTransform:'uppercase'}}>{sel.provider || '—'}</div></div>
              <div style={{gridColumn:'1 / -1'}}>
                <div style={{color:'var(--fg-3)',fontSize:10}}>{t('imageLib.meta.uploaded')}</div>
                <div style={{fontSize:11}}>{fmtDate(sel.createdAt)}</div>
              </div>
            </div>

            <div>
              <div style={{color:'var(--fg-3)',fontSize:10,marginBottom:4}}>{t('imageLib.meta.url')}</div>
              <div style={{
                padding:'6px 8px',background:'var(--surface)',border:'1px solid var(--line)',
                borderRadius:'var(--r-sm)',fontFamily:'var(--font-mono)',fontSize:10.5,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
              }} title={sel.url}>{sel.url}</div>
            </div>

            <div style={{display:'flex',gap:6,flexWrap:'wrap',position:'relative'}}>
              <button className="btn sm" onClick={()=>onCopyUrl(sel)}>
                <I.copy size={12}/> {t('imageLib.copyUrl')}
              </button>
              <button className="btn sm" onClick={()=>setMoveMenuOpen((v)=>!v)}>
                <I.folder size={12}/> {t('imageLib.moveFolder')}
              </button>
              {moveMenuOpen && (
                <MoveToFolderMenu
                  folders={folders}
                  currentFolderId={sel.folder && folderById.has(sel.folder) ? sel.folder : null}
                  onPick={async (targetId)=>{
                    await moveImageToFolder(sel.id, targetId);
                    setMoveMenuOpen(false);
                  }}
                  onNewFolder={()=>{
                    setMoveMenuOpen(false);
                    setFolderModal({ mode:'new', assignOnCreateImgId: sel.id });
                  }}
                  onClose={()=>setMoveMenuOpen(false)}
                />
              )}
            </div>

            <div style={{flex:1}}/>
            <button className="btn sm" style={{color:'var(--danger)'}} onClick={()=>onDelete(sel)}>
              <I.trash size={12}/> {t('imageLib.remove')}
            </button>
          </aside>
        )}
      </div>

      {folderModal && (
        <FolderModal
          mode={folderModal.mode}
          folder={folderModal.folder}
          onClose={()=>setFolderModal(null)}
          onCreated={async (created)=>{
            // When invoked from "Move to" → "+ New folder", immediately
            // assign the selected image to the freshly-created folder.
            if (folderModal.assignOnCreateImgId) {
              await moveImageToFolder(folderModal.assignOnCreateImgId, created.id);
            }
          }}
        />
      )}
    </div>
  );
}

function FolderNavItem({ active, dropOver, onClick, label, count, icon, color, actions, dropProps }) {
  const hasColor = !!color;
  return (
    <div
      className={`nav-item ${active?'active':''} ${dropOver?'drop-active':''}`}
      onClick={onClick}
      {...(dropProps || {})}
      style={{
        display:'flex',alignItems:'center',gap:8,
        width:'100%',padding:'7px 9px',
        background: active?'var(--accent-soft)':'transparent',
        color: active?'var(--accent)':'var(--fg-2)',
        borderRadius:'var(--r-sm)', cursor:'pointer',
        fontSize:12.5,textAlign:'left',marginBottom:2,
        border:'none',
      }}
    >
      {hasColor
        ? <span style={{width:10,height:10,borderRadius:2,background:color,flexShrink:0}}/>
        : icon}
      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
      <span className="count oc-count-hideable" style={{fontSize:10.5,color:'var(--fg-3)'}}>{count}</span>
      {actions && (
        <div className="oc-actions" onClick={(e)=>e.stopPropagation()}>{actions}</div>
      )}
    </div>
  );
}

// Popover anchored to the "Move to folder" button. Plays the same role as
// MoveMenuPopover in the dashboard — lists folders with color dots and lets
// the user create a new one inline.
function MoveToFolderMenu({ folders, currentFolderId, onPick, onNewFolder, onClose }) {
  const t = window.stI18n.t;
  const ref = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position:'absolute', top:'calc(100% + 4px)', left:0,
      background:'var(--surface)', border:'1px solid var(--line)',
      borderRadius:'var(--r-sm)', padding:4, minWidth:200,
      boxShadow:'0 6px 24px rgba(0,0,0,.24)', zIndex:10,
    }}>
      <button onClick={()=>onPick(null)} style={moveMenuBtnStyle(currentFolderId == null)}>
        <span style={{width:10,height:10,borderRadius:2,background:'transparent',border:'1px dashed var(--line-2)',flexShrink:0}}/>
        <span style={{flex:1}}>{t('imageLib.folder.unassigned')}</span>
      </button>
      {folders.length > 0 && <div style={{height:1,background:'var(--line)',margin:'4px 0'}}/>}
      {folders.map((f) => (
        <button key={f.id} onClick={()=>onPick(f.id)} style={moveMenuBtnStyle(currentFolderId === f.id)}>
          <span style={{width:10,height:10,borderRadius:2,background:f.color,flexShrink:0}}/>
          <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
        </button>
      ))}
      <div style={{height:1,background:'var(--line)',margin:'4px 0'}}/>
      <button onClick={onNewFolder} style={{...moveMenuBtnStyle(false), color:'var(--fg-3)'}}>
        <I.plus size={12}/>
        <span style={{flex:1}}>{t('imageLib.folder.new')}</span>
      </button>
    </div>
  );
}

function moveMenuBtnStyle(on) {
  return {
    display:'flex',alignItems:'center',gap:8,
    width:'100%',padding:'6px 8px',
    background: on ? 'var(--accent-soft)' : 'transparent',
    color: on ? 'var(--accent)' : 'var(--fg-2)',
    border:'none', borderRadius:'var(--r-sm)',
    fontSize:12, textAlign:'left', cursor:'pointer',
  };
}

// Create / edit a folder record. Matches OccasionModal in dashboard but lives
// here to keep the image library self-contained — the two flows evolve
// independently, so copying the small surface is cheaper than sharing.
function FolderModal({ mode, folder, onClose, onCreated }) {
  const t = window.stI18n.t;
  const palette = window.stOccasions?.PALETTE || [{ value:'#0F766E' }];
  const [name, setName] = React.useState(folder?.name || '');
  const [color, setColor] = React.useState(folder?.color || palette[0].value);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (mode === 'edit' && folder) {
      window.stImageFolders.update(folder.id, { name: trimmed, color });
      onClose();
    } else {
      const created = window.stImageFolders.add({ name: trimmed, color });
      await onCreated?.(created);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pop" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div className="modal-head">
          <div style={{width:32,height:32,borderRadius:8,background:color,display:'grid',placeItems:'center',transition:'background 120ms'}}>
            <div style={{width:12,height:12,borderRadius:3,background:'rgba(255,255,255,.82)'}}/>
          </div>
          <div style={{flex:1}}>
            <h3>{mode === 'edit' ? t('imageLib.newFolder.title.edit') : t('imageLib.newFolder.title.new')}</h3>
            <div className="sub">{t('imageLib.newFolder.sub')}</div>
          </div>
          <button className="btn icon ghost" onClick={onClose}><I.x size={15}/></button>
        </div>
        <div className="modal-body">
          <div className="prop-label" style={{marginBottom:6}}>{t('imageLib.newFolder.nameLabel')}</div>
          <input ref={inputRef} className="field" value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onClose();
            }}
            placeholder={t('imageLib.newFolder.namePlaceholder')}/>
          <div className="prop-label" style={{marginTop:16,marginBottom:8}}>{t('imageLib.newFolder.colorLabel')}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(9, 1fr)',gap:8}}>
            {palette.map(p => {
              const on = color === p.value;
              return (
                <button key={p.id || p.value} onClick={()=>setColor(p.value)} title={p.name}
                  style={{
                    aspectRatio:'1',
                    borderRadius:'50%',
                    background:p.value,
                    border:'none',
                    cursor:'pointer',
                    position:'relative',
                    outline: on ? '2px solid var(--fg)' : 'none',
                    outlineOffset: 2,
                  }}>
                  {on && <I.check size={12} style={{color:'#fff',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t('imageLib.newFolder.cancel')}</button>
          <button className="btn primary" onClick={submit} disabled={!name.trim()}>
            {mode === 'edit' ? t('imageLib.newFolder.save') : t('imageLib.newFolder.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ImageLibraryScreen });
