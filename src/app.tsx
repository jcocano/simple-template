// App — orchestrates screens, tweaks, modals

function App() {
  // persistent screen in localStorage
  const [screen, setScreen] = React.useState(() => localStorage.getItem('mc:screen') || 'dashboard');
  const [tpl, setTpl] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const [onboard, setOnboard] = React.useState(() => localStorage.getItem('mc:onboard') !== 'done');
  const [tweaks, setTweaks] = React.useState(() => {
    const saved = localStorage.getItem('mc:tweaks');
    if (saved) { try { return {...window.TWEAKS, ...JSON.parse(saved)}; } catch {} }
    return {...window.TWEAKS};
  });
  React.useEffect(() => {
    localStorage.setItem('mc:tweaks', JSON.stringify(tweaks));
    window.__mcTweaks = tweaks;
    window.dispatchEvent(new CustomEvent('mc:tweaks-change'));
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
    window.addEventListener('mc:cmd-open', openH);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mc:cmd-open', openH);
    };
  }, []);

  React.useEffect(() => { localStorage.setItem('mc:screen', screen); }, [screen]);

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
    localStorage.setItem('mc:onboard','done');
    setOnboard(false);
  };

  const openEditor = (t) => {
    setTpl(t);
    setScreen('editor');
    // Simular auto-guardado cada 45s mientras se edita
    clearInterval(window.__mcAutoSave);
    window.__mcAutoSave = setInterval(() => {
      window.toast && window.toast({kind:'info', title:'Se guardó sola', msg:'Cada cambio queda a salvo. Nada que pulsar.', ttl:2800});
    }, 45000);
  };

  return (
    <>
      <div className="shell" data-screen-label={`Screen: ${screen}`}>
        <div className="drag-strip" aria-hidden="true"/>
        {screen==='dashboard' && (
          <Dashboard
            onOpen={(s,t)=>{ if(s==='editor') openEditor(t); else if(s==='gallery') setScreen('gallery'); else if(s==='library') setScreen('library'); else if(s==='settings'||s==='smtp') setModal('settings'); }}
            onNew={()=>setScreen('gallery')}
          />
        )}

        {screen==='gallery' && (
          <Gallery
            onBack={()=>setScreen('dashboard')}
            onPick={(t)=>{
              openEditor(t);
              window.toast && window.toast({kind:'ok', title:`«${t.name}» abierta`, msg:'Ya puedes editarla. Se guarda sola cada cambio.'});
            }}
          />
        )}

        {screen==='editor' && (
          <Editor
            template={tpl}
            onBack={()=>{ clearInterval(window.__mcAutoSave); setScreen('dashboard'); }}
            onPreview={()=>setScreen('preview')}
            onExport={()=>setModal('export')}
            onTestSend={()=>setModal('test')}
            onOpenVars={()=>setModal('vars')}
            onReview={()=>setReviewOpen(true)}
          />
        )}

        {screen==='preview' && (
          <Preview onBack={()=>setScreen('editor')}/>
        )}

        {screen==='library' && (
          <Library onBack={()=>setScreen('dashboard')}/>
        )}
      </div>

      {onboard && <Onboarding onDone={finishOnboarding}/>}

      {modal==='export' && <ExportModal onClose={()=>setModal(null)}/>}
      {modal==='test' && <TestSendModal onClose={()=>setModal(null)}/>}
      {modal==='vars' && <VariablesModal onClose={()=>setModal(null)}/>}
      {modal==='smtp' && <SettingsPanel onClose={()=>setModal(null)} initialSection="delivery"/>}
      {modal==='settings' && <SettingsPanel onClose={()=>setModal(null)}/>}

      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} visible={tweaksVisible}/>

      <Toasts/>
      <AIImproveModal/>
      {paletteOpen && <CommandPalette
        onClose={()=>setPaletteOpen(false)}
        onNavigate={(target, data)=>{
          setPaletteOpen(false);
          if (target === 'review') setReviewOpen(true);
          else if (target === 'settings') setModal('settings');
          else if (target === 'export') setModal('export');
          else if (target === 'test') setModal('test');
          else if (target === 'vars') setModal('vars');
          else if (target === 'ai-generate') { setScreen('dashboard'); setTimeout(()=>window.dispatchEvent(new CustomEvent('mc:ai-generate')), 50); }
          else if (target === 'theme:light') { setTweaks(t=>({...t, mode:'light'})); window.toast && window.toast({kind:'ok', title:'Tema claro activado'}); }
          else if (target === 'theme:dark')  { setTweaks(t=>({...t, mode:'dark'})); window.toast && window.toast({kind:'ok', title:'Tema oscuro activado'}); }
          else if (target === 'theme:toggle') { setTweaks(t=>({...t, mode: t.mode==='dark'?'light':'dark'})); }
          else if (target && target.startsWith('settings:')) setModal('settings');
          else if (target && target.startsWith('template:')) {
            if (data) openEditor(data);
          }
          else if (target && target.startsWith('insert:')) {
            setScreen('editor');
            setTimeout(()=>window.dispatchEvent(new CustomEvent('mc:insert-block', {detail:{type:target.slice(7)}})), 60);
          }
          else setScreen(target);
        }}
      />}
      {reviewOpen && <ReviewPanel
        onClose={()=>setReviewOpen(false)}
        onGoSettings={(sec)=>{ setReviewOpen(false); setModal('settings'); }}
      />}
    </>
  );
}

Object.assign(window, { App });
