// App — orchestrates screens, tweaks, modals

function App() {
  // Restore last screen from storage, but force back to dashboard if the
  // persisted screen needs a template (editor/preview): the active template
  // is React state and doesn't survive a renderer reload.
  const [screen, setScreen] = React.useState(() => {
    const s = window.stStorage.getSetting('screen', 'dashboard');
    return (s === 'editor' || s === 'preview') ? 'dashboard' : s;
  });
  const [tpl, setTpl] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const [settingsSection, setSettingsSection] = React.useState('account');
  const [onboard, setOnboard] = React.useState(() => !window.stStorage.getSetting('onboard', false));
  const [tweaks, setTweaks] = React.useState(() => ({...window.TWEAKS, ...window.stStorage.getSetting('tweaks', {})}));
  React.useEffect(() => {
    window.stStorage.setSetting('tweaks', tweaks);
    window.__mcTweaks = tweaks;
    window.dispatchEvent(new CustomEvent('st:tweaks-change'));
  }, [tweaks]);
  window.__mcTweaks = tweaks; // keep synchronous mirror for first paint
  window.__mcSetTweaks = setTweaks; // allow settings panel / cmd-k to mutate
  const [tweaksVisible, setTweaksVisible] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // ⌘K / Ctrl+K → abre command palette
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setReviewOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    const openH = () => setPaletteOpen(true);
    window.addEventListener('st:cmd-open', openH);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('st:cmd-open', openH);
    };
  }, []);

  React.useEffect(() => { window.stStorage.setSetting('screen', screen); }, [screen]);

  // When the workspace changes (from the dropdown or command palette),
  // editor/preview belong to the previous workspace → route back to dashboard.
  React.useEffect(() => {
    const h = () => {
      if (screen === 'editor' || screen === 'preview') {
        setScreen('dashboard');
        setTpl(null);
        window.toast && window.toast({
          kind: 'info',
          title: 'Cambiaste de espacio',
          msg: 'Volvimos al tablero para que elijas una plantilla del nuevo espacio.',
        });
      }
    };
    window.addEventListener('st:workspace-change', h);
    return () => window.removeEventListener('st:workspace-change', h);
  }, [screen]);

  // Tweaks protocol
  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksVisible(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksVisible(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Apply theme/density/radius to :root
  React.useEffect(() => {
    const theme = `${tweaks.theme}-${tweaks.mode}`;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-density', tweaks.density);
    document.documentElement.setAttribute('data-radius', tweaks.radius);
    document.documentElement.setAttribute('data-panels', tweaks.layoutPanels);
    const fontMap = {
      'inter-tight':'"Inter Tight", system-ui, sans-serif',
      'inter':'"Inter", system-ui, sans-serif',
      'instrument-serif':'"Instrument Serif", Georgia, serif',
    };
    document.documentElement.style.setProperty('--font-sans', fontMap[tweaks.font] || fontMap['inter-tight']);
  }, [tweaks]);

  const finishOnboarding = () => {
    window.stStorage.setSetting('onboard', true);
    setOnboard(false);
  };

  const openEditor = (t) => {
    setTpl(t);
    setScreen('editor');
  };

  const openFromGallery = async (preset) => {
    const seedDoc = preset.blank
      ? { sections: [] }
      : { sections: JSON.parse(JSON.stringify(window.DEFAULT_DOC || [])) };
    const newTpl = await window.stTemplates.create({
      name: preset.name,
      folder: preset.cat || 'Sin carpeta',
      variant: preset.variant,
      color: preset.color,
      status: 'draft',
      starred: false,
      doc: seedDoc,
    });
    if (!newTpl) return;
    openEditor(newTpl);
    window.toast && window.toast({
      kind: 'ok',
      title: `«${newTpl.name}» abierta`,
      msg: 'Ya puedes editarla. Se guarda sola cada cambio.',
    });
  };

  return (
    <>
      <div className="shell" data-screen-label={`Screen: ${screen}`}>
        <div className="drag-strip" aria-hidden="true"/>
        {screen==='dashboard' && (
          <Dashboard
            onOpen={(s,t)=>{
              if (s==='editor') openEditor(t);
              else if (s==='gallery') setScreen('gallery');
              else if (s==='library') setScreen('library');
              else if (s==='settings') { setSettingsSection(t || 'account'); setModal('settings'); }
              else if (s==='smtp') { setSettingsSection('delivery'); setModal('settings'); }
            }}
            onNew={()=>setScreen('gallery')}
          />
        )}

        {screen==='gallery' && (
          <Gallery
            onBack={()=>setScreen('dashboard')}
            onPick={openFromGallery}
          />
        )}

        {screen==='editor' && (
          <Editor
            template={tpl}
            onBack={()=>setScreen('dashboard')}
            onPreview={()=>setScreen('preview')}
            onExport={()=>setModal('export')}
            onTestSend={()=>setModal('test')}
            onOpenVars={()=>setModal('vars')}
            onReview={()=>setReviewOpen(true)}
          />
        )}

        {screen==='preview' && (
          <Preview template={tpl} onBack={()=>setScreen('editor')}/>
        )}

        {screen==='library' && (
          <Library onBack={()=>setScreen('dashboard')}/>
        )}
      </div>

      {onboard && <Onboarding onDone={finishOnboarding}/>}

      {modal==='export' && <ExportModal onClose={()=>setModal(null)}/>}
      {modal==='test' && <TestSendModal onClose={()=>setModal(null)}/>}
      {modal==='vars' && <VariablesModal onClose={()=>setModal(null)}/>}
      {modal==='settings' && <SettingsPanel onClose={()=>setModal(null)} initialSection={settingsSection}/>}

      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} visible={tweaksVisible}/>

      <Toasts/>
      <UnsavedChangesModal/>
      {paletteOpen && <CommandPalette
        onClose={()=>setPaletteOpen(false)}
        onNavigate={(target, data)=>{
          setPaletteOpen(false);
          if (target === 'review') setReviewOpen(true);
          else if (target === 'settings') { setSettingsSection('account'); setModal('settings'); }
          else if (target === 'export') setModal('export');
          else if (target === 'test') setModal('test');
          else if (target === 'vars') setModal('vars');
          else if (target === 'ai-generate') { setScreen('dashboard'); setTimeout(()=>window.dispatchEvent(new CustomEvent('st:ai-generate')), 50); }
          else if (target === 'theme:light') { setTweaks(t=>({...t, mode:'light'})); window.toast && window.toast({kind:'ok', title:'Tema claro activado'}); }
          else if (target === 'theme:dark')  { setTweaks(t=>({...t, mode:'dark'})); window.toast && window.toast({kind:'ok', title:'Tema oscuro activado'}); }
          else if (target === 'theme:toggle') { setTweaks(t=>({...t, mode: t.mode==='dark'?'light':'dark'})); }
          else if (target && target.startsWith('settings:')) { setSettingsSection(target.slice(9)); setModal('settings'); }
          else if (target && target.startsWith('template:')) {
            if (data) openEditor(data);
          }
          else if (target && target.startsWith('insert:')) {
            setScreen('editor');
            setTimeout(()=>window.dispatchEvent(new CustomEvent('st:insert-block', {detail:{type:target.slice(7)}})), 60);
          }
          else setScreen(target);
        }}
      />}
      {reviewOpen && <ReviewPanel
        onClose={()=>setReviewOpen(false)}
        onGoSettings={(sec)=>{ setReviewOpen(false); setSettingsSection(sec || 'account'); setModal('settings'); }}
      />}
    </>
  );
}

// Blocks workspace switch while the editor has unsaved changes.
// Triggered by `st:workspace-switch-blocked` from src/lib/workspaces.tsx.
function UnsavedChangesModal() {
  const [pending, setPending] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const h = (e) => {
      setPending(e.detail);
      setError(null);
      setBusy(false);
    };
    window.addEventListener('st:workspace-switch-blocked', h);
    return () => window.removeEventListener('st:workspace-switch-blocked', h);
  }, []);

  if (!pending) return null;

  const onSave = async () => {
    setBusy(true);
    setError(null);
    try {
      await pending.confirm();
      setPending(null);
    } catch (err) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };
  const onCancel = () => {
    try { pending.cancel(); } catch {}
    setPending(null);
  };

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="modal pop" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div className="modal-head">
          <div style={{flex:1}}>
            <h3>Cambios sin guardar</h3>
            <div className="sub">Tienes cambios en esta plantilla que aún no se guardaron. Vamos a guardarlos antes de cambiar de espacio.</div>
          </div>
        </div>
        {error && (
          <div className="modal-body" style={{color:'var(--err, #e04f4f)',fontSize:12}}>
            {error}
          </div>
        )}
        <div className="modal-foot">
          <button className="btn ghost" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button className="btn primary" onClick={onSave} disabled={busy}>
            {busy ? 'Guardando…' : error ? 'Reintentar guardado' : 'Guardar y cambiar'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { App, UnsavedChangesModal });
