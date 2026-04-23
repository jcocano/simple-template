// Command Palette — atajo ⌘K / Ctrl+K
// API: window.dispatchEvent(new CustomEvent('st:cmd-open'))
// Comandos registrados desde fuera vía window.registerCommands([...])

function CommandPalette({ onNavigate, onClose }) {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);

  // Auto-focus on mount
  React.useEffect(() => {
    setQ(''); setSel(0);
    setTimeout(() => inputRef.current?.focus(), 20);
    const keyH = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keyH);
    return () => window.removeEventListener('keydown', keyH);
  }, []);

  // Comandos — construidos desde data y navegación
  const cmds = React.useMemo(() => {
    const TEMPLATES = window.TEMPLATES || [];
    const BLOCK_CATALOG = window.BLOCK_CATALOG || [];
    const base = [
      // Acciones rápidas
      { id:'new',     t:'Crear plantilla nueva',        s:'Abre la galería de ejemplos', g:'Acciones', icon:'plus',      run:()=>onNavigate('gallery') },
      { id:'ai-gen',  t:'Generar plantilla con IA',     s:'Describe el correo y la IA lo arma',       g:'Acciones', icon:'sparkles',  run:()=>onNavigate('ai-generate') },
      { id:'review',  t:'Revisar antes de enviar',      s:'Checklist pre-envío: alt-text, contraste, links…', g:'Acciones', icon:'eye', run:()=>onNavigate('review') },
      { id:'export',  t:'Exportar o enviar prueba',     s:'HTML, MJML o correo de prueba',            g:'Acciones', icon:'send',      run:()=>onNavigate('export') },
      { id:'vars',    t:'Etiquetas de la plantilla',    s:'Editar las {{etiquetas}} de este correo',   g:'Acciones', icon:'braces',    run:()=>onNavigate('vars') },
      // Navegación
      { id:'n-dash',  t:'Ir a Mis plantillas',          s:'Biblioteca principal',                      g:'Ir a',    icon:'grid',      run:()=>onNavigate('dashboard') },
      { id:'n-gal',   t:'Ir a Galería de ejemplos',     s:'Plantillas listas por ocasión',             g:'Ir a',    icon:'layers',    run:()=>onNavigate('gallery') },
      { id:'n-lib',   t:'Ir a Bloques guardados',       s:'Tus bloques reutilizables',                 g:'Ir a',    icon:'folder',    run:()=>onNavigate('library') },
      { id:'n-img',   t:'Ir a Biblioteca de imágenes',  s:'Todas tus imágenes subidas',                g:'Ir a',    icon:'image',     run:()=>onNavigate('images') },
      { id:'n-prev',  t:'Ver vista previa',             s:'Multi-dispositivo',                         g:'Ir a',    icon:'eye',       run:()=>onNavigate('preview') },
      // Ajustes
      { id:'s-all',   t:'Abrir ajustes',                s:'Perfil, marca, envío, IA…',                 g:'Ajustes', icon:'settings',  run:()=>onNavigate('settings') },
      { id:'s-ai',    t:'Ajustes → Inteligencia artificial', s:'API key, proveedor, modelo',         g:'Ajustes', icon:'sparkles',  run:()=>onNavigate('settings:ai') },
      { id:'s-brand', t:'Ajustes → Marca',              s:'Colores, fuente, logo, footer legal',       g:'Ajustes', icon:'palette',   run:()=>onNavigate('settings:brand') },
      { id:'s-store', t:'Ajustes → Almacenamiento',     s:'Dónde se alojan tus imágenes',              g:'Ajustes', icon:'image',     run:()=>onNavigate('settings:storage') },
      { id:'s-deli',  t:'Ajustes → Envío de pruebas',   s:'Cuenta SMTP para pruebas',                  g:'Ajustes', icon:'send',      run:()=>onNavigate('settings:delivery') },
      // Tema
      { id:'theme-t', t:'Alternar tema claro/oscuro',  s:'Cambia al opuesto',                         g:'Apariencia', icon:'sun',    run:()=>onNavigate('theme:toggle') },
      { id:'theme-l', t:'Cambiar a tema claro',         s:'Modo día',                                  g:'Apariencia', icon:'sun',    run:()=>onNavigate('theme:light') },
      { id:'theme-d', t:'Cambiar a tema oscuro',        s:'Modo noche',                                g:'Apariencia', icon:'moon',   run:()=>onNavigate('theme:dark') },
    ];
    // Plantillas reales
    const tpls = TEMPLATES.slice(0, 20).map(t => ({
      id:'t-'+t.id, t:t.name, s:`Plantilla · ${t.folder}`, g:'Plantillas', icon:'mail',
      run:()=>onNavigate('template:'+t.id, t)
    }));
    // Bloques del catálogo
    const blocks = BLOCK_CATALOG.slice(0, 15).map(b => ({
      id:'b-'+b.type, t:`Insertar bloque: ${b.name}`, s:`Tipo ${b.type}`, g:'Bloques', icon:b.icon||'grid',
      run:()=>onNavigate('insert:'+b.type)
    }));
    return [...base, ...tpls, ...blocks];
  }, [onNavigate]);

  const filtered = React.useMemo(() => {
    if (!q.trim()) return cmds;
    const needle = q.toLowerCase();
    return cmds.filter(c => c.t.toLowerCase().includes(needle) || (c.s||'').toLowerCase().includes(needle) || c.g.toLowerCase().includes(needle));
  }, [q, cmds]);

  const grouped = React.useMemo(() => {
    const g = {};
    filtered.forEach(c => { (g[c.g] = g[c.g] || []).push(c); });
    return g;
  }, [filtered]);

  const flat = filtered;

  React.useEffect(() => { setSel(0); }, [q]);

  const runAt = (idx) => {
    const c = flat[idx];
    if (!c) return;
    c.run();
    onClose();
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s+1, flat.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s-1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); runAt(sel); }
  };

  if (!flat) return null;

  let runIdx = -1;
  return (
    <div className="modal-backdrop" onClick={onClose} style={{alignItems:'flex-start',paddingTop:'12vh',background:'rgba(0,0,0,.35)'}}>
      <div className="pop" onClick={e=>e.stopPropagation()} style={{
        width:'min(640px, calc(100vw - 48px))',
        background:'var(--surface)',
        borderRadius:'var(--r-lg)',
        border:'1px solid var(--line)',
        boxShadow:'0 24px 80px -20px rgba(0,0,0,.4)',
        overflow:'hidden',
        display:'flex',flexDirection:'column',
        maxHeight:'70vh',
      }}>
        <div style={{
          display:'flex',alignItems:'center',gap:10,
          padding:'14px 18px',borderBottom:'1px solid var(--line)',
        }}>
          <I.search size={15} style={{color:'var(--fg-3)'}}/>
          <input
            ref={inputRef}
            value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Busca una acción, plantilla, bloque…"
            style={{
              flex:1,background:'transparent',border:'none',outline:'none',
              fontSize:15,color:'var(--fg)',
            }}
          />
          <span className="kbd" style={{fontSize:10.5}}>esc</span>
        </div>

        <div style={{flex:1,overflow:'auto',padding:'6px 0'}}>
          {flat.length === 0 && (
            <EmptyState
              illustration="search"
              title={`Nada que coincida con «${q}»`}
              msg="Prueba con otras palabras. Puedes buscar por acción («exportar»), por bloque («botón»), o por sección de ajustes."
              compact
              tips={[
                'Escribe ⇥ para navegar con teclado',
                'Pulsa Esc para cerrar esta búsqueda',
              ]}
            />
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} style={{marginBottom:6}}>
              <div style={{
                padding:'8px 18px 4px',fontSize:10.5,color:'var(--fg-3)',
                textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600,
              }}>{group}</div>
              {items.map(c => {
                runIdx++;
                const isSel = runIdx === sel;
                const Ico = I[c.icon] || I.chevronR;
                const myIdx = runIdx;
                return (
                  <div key={c.id}
                    onMouseEnter={()=>setSel(myIdx)}
                    onClick={()=>runAt(myIdx)}
                    style={{
                      display:'flex',alignItems:'center',gap:12,
                      padding:'8px 18px',cursor:'pointer',
                      background: isSel ? 'var(--accent-soft)' : 'transparent',
                      color: isSel ? 'var(--accent)' : 'var(--fg)',
                    }}>
                    <div style={{
                      width:26,height:26,borderRadius:6,flexShrink:0,
                      background: isSel ? 'color-mix(in oklab, var(--accent) 15%, transparent)' : 'var(--surface-2)',
                      display:'grid',placeItems:'center',color:'currentColor',
                    }}>
                      <Ico size={13}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:isSel?500:400,color:isSel?'var(--accent)':'var(--fg)'}}>{c.t}</div>
                      {c.s && <div style={{fontSize:11,color:'var(--fg-3)',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.s}</div>}
                    </div>
                    {isSel && <span className="kbd" style={{fontSize:10}}>↵</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{
          padding:'8px 18px',borderTop:'1px solid var(--line)',background:'var(--surface-2)',
          display:'flex',alignItems:'center',gap:14,fontSize:11,color:'var(--fg-3)',
        }}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span className="kbd" style={{fontSize:10}}>↑↓</span> navegar</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span className="kbd" style={{fontSize:10}}>↵</span> ejecutar</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span className="kbd" style={{fontSize:10}}>esc</span> cerrar</span>
          <div style={{flex:1}}/>
          <span>{flat.length} comando{flat.length===1?'':'s'}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette });
