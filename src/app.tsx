// App — orchestrates screens, tweaks, modals

function App() {
  const t = window.stI18n.t;
  window.stI18n.useLang(); // re-render shell on language change
  // Restore last screen from storage, but force back to dashboard if the
  // persisted screen needs a template (editor/preview): the active template
  // is React state and doesn't survive a renderer reload.
  const [screen, setScreen] = React.useState(() => {
    const s = window.stStorage.getSetting('screen', 'dashboard');
    // Editor/preview/block-editor need React state (tpl or block) that
    // doesn't survive a renderer reload — route persisted screens back to
    // somewhere safe.
    if (s === 'editor' || s === 'preview') return 'dashboard';
    if (s === 'editor-block') return 'library';
    return s;
  });
  const [tpl, setTpl] = React.useState(null);
  const [blockBeingEdited, setBlockBeingEdited] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const [settingsSection, setSettingsSection] = React.useState('account');
  const [onboard, setOnboard] = React.useState(() => !window.stStorage.getSetting('onboard', false));
  const [tweaks, setTweaks] = React.useState(() => {
    const saved = window.stStorage.getSetting('tweaks', {});
    if (saved.density === 'comfy') saved.density = 'comfortable';
    return {...window.TWEAKS, ...saved};
  });
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
    const openH = (e) => {
      const d = e && e.detail;
      // Direct-navigate form: { id:'settings', section?:string }. Used by the
      // ShareModal's "Go to Settings" CTA and any other entry point that
      // wants to land on Settings without going through the palette.
      if (d && d.id === 'settings') {
        setSettingsSection(d.section || 'account');
        setModal('settings');
        return;
      }
      setPaletteOpen(true);
    };
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
      if (screen === 'editor' || screen === 'preview' || screen === 'editor-block') {
        setScreen('dashboard');
        setTpl(null);
        setBlockBeingEdited(null);
        window.toast && window.toast({
          kind: 'info',
          title: t('app.workspace.changed.title'),
          msg: t('app.workspace.changed.msg'),
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

  // Review panel fixes (c1/c2/g3) disparan st:open-details para abrir el modal
  // de Detalles. Se cierra el Review al mismo tiempo — el usuario vuelve a
  // abrirlo a mano para ver el re-chequeo.
  React.useEffect(() => {
    const onOpenDetails = () => { setReviewOpen(false); setModal('details'); };
    window.addEventListener('st:open-details', onOpenDetails);
    return () => window.removeEventListener('st:open-details', onOpenDetails);
  }, []);

  // Deep-link listener: the OS hands us a `simpletemplete://import?u=...`
  // URL (single-instance second-launch on Win/Linux, open-url on macOS).
  // We don't auto-import — the bundle is encrypted with a PIN the sender
  // shared separately, so we open the import modal to ask for it.
  const [importPin, setImportPin] = React.useState(null); // {url, name} | null
  React.useEffect(() => {
    if (!window.share || typeof window.share.onDeepLink !== 'function') return;
    const unsubscribe = window.share.onDeepLink((url) => {
      try {
        const parsed = window.stSharingDeepLink.parse(url);
        setImportPin({ url, name: parsed.name || '' });
      } catch {
        const tt = window.stI18n.t;
        window.toast && window.toast({
          kind: 'error',
          title: tt('share.import.error.title'),
          msg: tt('share.import.error.invalid'),
        });
      }
    });
    return unsubscribe;
  }, []);

  const onImported = React.useCallback((result) => {
    const tt = window.stI18n.t;
    window.toast && window.toast({
      kind: 'ok',
      title: tt('share.import.toast.title'),
      msg: tt('share.import.toast.msg', {
        name: result.name || '',
        sharedBy: result.sharedFrom?.name || '',
      }),
    });
    setScreen('dashboard');
  }, []);

  // Apply theme/density/radius to :root
  React.useEffect(() => {
    const applyTheme = () => {
      const effective = tweaks.mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : tweaks.mode;
      document.documentElement.setAttribute('data-theme', `${tweaks.theme}-${effective}`);
    };
    applyTheme();
    document.documentElement.setAttribute('data-density', tweaks.density);
    document.documentElement.setAttribute('data-radius', tweaks.radius);
    document.documentElement.setAttribute('data-panels', tweaks.layoutPanels);
    const fontMap = {
      'inter-tight':'"Inter Tight", system-ui, sans-serif',
      'inter':'"Inter", system-ui, sans-serif',
      'instrument-serif':'"Instrument Serif", Georgia, serif',
    };
    document.documentElement.style.setProperty('--font-sans', fontMap[tweaks.font] || fontMap['inter-tight']);
    if (tweaks.mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [tweaks]);

  const finishOnboarding = () => {
    window.stStorage.setSetting('onboard', true);
    setOnboard(false);
  };

  const openEditor = (t) => {
    setTpl(t);
    setBlockBeingEdited(null);
    setScreen('editor');
  };

  const openBlockEditor = (blk) => {
    setBlockBeingEdited(blk);
    setTpl(null);
    setScreen('editor-block');
  };

  const openFromGallery = async (preset) => {
    const seedDoc = preset.blank
      ? { sections: [] }
      : JSON.parse(JSON.stringify(window.DEFAULT_DOC));
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
              else if (s==='images') setScreen('images');
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
            onOpenDetails={()=>setModal('details')}
            onReview={()=>setReviewOpen(true)}
          />
        )}

        {screen==='preview' && (
          <Preview template={tpl} onBack={()=>setScreen('editor')}/>
        )}

        {screen==='library' && (
          <Library
            onBack={()=>setScreen('dashboard')}
            onOpenBlock={(blk)=>openBlockEditor(blk)}
          />
        )}

        {screen==='editor-block' && (
          <Editor
            block={blockBeingEdited}
            onBack={()=>{ setBlockBeingEdited(null); setScreen('library'); }}
          />
        )}

        {screen==='images' && (
          <ImageLibraryScreen
            onBack={()=>setScreen('dashboard')}
            onOpenSettings={(sec)=>{ setSettingsSection(sec || 'storage'); setModal('settings'); }}
          />
        )}
      </div>

      {onboard && <Onboarding onDone={finishOnboarding}/>}

      {modal==='export' && <ExportModal onClose={()=>setModal(null)}/>}
      {modal==='test' && <TestSendModal onClose={()=>setModal(null)}/>}
      {modal==='vars' && <VariablesModal onClose={()=>setModal(null)}/>}
      {modal==='details' && <DetailsModal onClose={()=>setModal(null)}/>}
      {modal==='settings' && <SettingsPanel onClose={()=>setModal(null)} initialSection={settingsSection}/>}

      {importPin && <ImportPinModal
        url={importPin.url}
        name={importPin.name}
        onClose={()=>setImportPin(null)}
        onImported={onImported}
      />}

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
          else if (target === 'theme:light') { setTweaks(t=>({...t, mode:'light'})); window.toast && window.toast({kind:'ok', title:window.stI18n.t('app.theme.light.toast')}); }
          else if (target === 'theme:dark')  { setTweaks(t=>({...t, mode:'dark'})); window.toast && window.toast({kind:'ok', title:window.stI18n.t('app.theme.dark.toast')}); }
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
        tpl={tpl}
        onClose={()=>setReviewOpen(false)}
        onGoSettings={(sec)=>{ setReviewOpen(false); setSettingsSection(sec || 'account'); setModal('settings'); }}
        onFocusBlock={(ref)=>{
          setReviewOpen(false);
          setScreen('editor');
          setTimeout(()=>window.dispatchEvent(new CustomEvent('st:focus-block', { detail: ref })), 60);
        }}
      />}
    </>
  );
}

// Blocks workspace switch while the editor has unsaved changes.
// Triggered by `st:workspace-switch-blocked` from src/lib/workspaces.tsx.
function UnsavedChangesModal() {
  const t = window.stI18n.t;
  window.stI18n.useLang();
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
      setError(err?.message || t('app.unsaved.error'));
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
            <h3>{t('app.unsaved.title')}</h3>
            <div className="sub">{t('app.unsaved.sub')}</div>
          </div>
        </div>
        {error && (
          <div className="modal-body" style={{color:'var(--err, #e04f4f)',fontSize:12}}>
            {error}
          </div>
        )}
        <div className="modal-foot">
          <button className="btn ghost" onClick={onCancel} disabled={busy}>{t('app.unsaved.cancel')}</button>
          <button className="btn primary" onClick={onSave} disabled={busy}>
            {busy ? t('app.unsaved.saving') : error ? t('app.unsaved.retry') : t('app.unsaved.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { App, UnsavedChangesModal });
