// Editor Tour — overlay with spotlight + tooltip, walks user through editor on first open
// Persistence: setting 'tour-seen'. Reactivable from Ajustes or via window event 'st:start-tour'.

const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null, // centered, no spotlight
    title: '¡Bienvenida al editor de Simple Template!',
    body: 'Te mostramos las partes principales en 6 pasos. Tarda menos de un minuto.',
    icon: 'sparkles',
  },
  {
    id: 'left',
    target: '[data-tour="left-panel"]',
    title: 'Tu caja de piezas',
    body: 'Aquí están las secciones listas y los bloques. Haz clic en uno y se añade al correo. La pestaña Capas te muestra la estructura completa.',
    placement: 'right',
    icon: 'grid',
  },
  {
    id: 'canvas',
    target: '[data-tour="canvas"]',
    title: 'Tu correo en vivo',
    body: 'Aquí compones. Pasa el ratón sobre una sección para ver sus acciones (duplicar, subir, bajar). Haz clic en cualquier bloque para editarlo.',
    placement: 'left',
    icon: 'mail',
  },
  {
    id: 'right',
    target: '[data-tour="right-panel"]',
    title: 'El taller de edición',
    body: 'Al seleccionar un bloque o sección aparecen aquí todas sus opciones: colores, tipografía, espaciado, contenido.',
    placement: 'left',
    icon: 'palette',
  },
  {
    id: 'device',
    target: '[data-tour="device-toggle"]',
    title: 'Escritorio y móvil',
    body: 'Alterna la vista en cualquier momento. Simple Template se encarga de que el correo se vea bien en ambos.',
    placement: 'bottom',
    icon: 'phone',
  },
  {
    id: 'review',
    target: '[data-tour="review-btn"]',
    title: 'Revisar antes de enviar',
    body: 'Una lista de verificación automática: imágenes pesadas, links rotos, texto alternativo que falte… Te evita sustos.',
    placement: 'bottom',
    icon: 'check',
  },
  {
    id: 'export',
    target: '[data-tour="export-btn"]',
    title: 'Exportar o enviar prueba',
    body: 'Cuando tengas listo el correo: envía una prueba a tu buzón, copia un link privado para compartirlo, o descarga el HTML/MJML.',
    placement: 'bottom',
    icon: 'download',
  },
  {
    id: 'done',
    target: null,
    title: '¡Ya estás!',
    body: 'Puedes volver a ver este recorrido en cualquier momento desde Ajustes → General. Ahora a diseñar correos bonitos 💌',
    icon: 'check',
  },
];

function EditorTour({ onClose }) {
  const [stepIdx, setStepIdx] = React.useState(0);
  const [rect, setRect] = React.useState(null);
  const step = TOUR_STEPS[stepIdx];
  const isLast = stepIdx === TOUR_STEPS.length - 1;
  const Ico = (I && I[step.icon]) || (I && I.sparkles);

  // Measure target element
  React.useEffect(() => {
    if (!step.target) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector(step.target);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    const el = document.querySelector(step.target);
    if (el) ro.observe(el);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.target, stepIdx]);

  // Keyboard
  React.useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') handleClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const handleClose = () => {
    window.stStorage.setSetting('tour-seen', true);
    onClose && onClose();
  };
  const handleNext = () => { if (isLast) handleClose(); else setStepIdx(i => i + 1); };
  const handlePrev = () => setStepIdx(i => Math.max(0, i - 1));

  // Tooltip positioning
  const PAD = 14;
  const TT_W = 340;
  let ttStyle;
  if (!rect) {
    // centered
    ttStyle = {
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TT_W,
    };
  } else {
    const p = step.placement || 'bottom';
    const vw = window.innerWidth, vh = window.innerHeight;
    let top, left;
    if (p === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.left + rect.width + PAD;
    } else if (p === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - TT_W - PAD;
    } else if (p === 'top') {
      top = rect.top - PAD;
      left = rect.left + rect.width / 2 - TT_W / 2;
    } else { // bottom
      top = rect.top + rect.height + PAD;
      left = rect.left + rect.width / 2 - TT_W / 2;
    }
    // clamp
    left = Math.max(16, Math.min(left, vw - TT_W - 16));
    top = Math.max(16, Math.min(top, vh - 220));
    ttStyle = {
      top, left, width: TT_W,
      transform: (p === 'right' || p === 'left') ? 'translateY(-50%)' : 'none',
    };
  }

  // Spotlight — full-screen dark overlay with a hole cut via box-shadow trick
  const spotlight = rect ? {
    position: 'fixed',
    top: rect.top - 6,
    left: rect.left - 6,
    width: rect.width + 12,
    height: rect.height + 12,
    borderRadius: 8,
    boxShadow: '0 0 0 9999px rgba(8,8,20,0.62)',
    border: '2px solid var(--accent)',
    pointerEvents: 'none',
    zIndex: 9998,
    transition: 'all 240ms cubic-bezier(.4,0,.2,1)',
  } : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }}>
      {/* Full dark overlay when no target */}
      {!rect && (
        <div
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,20,0.62)', backdropFilter: 'blur(2px)' }}
        />
      )}
      {/* Spotlight ring */}
      {spotlight && <div style={spotlight} />}

      {/* Tooltip */}
      <div
        className="pop"
        style={{
          position: 'fixed',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-lg)',
          padding: 18,
          boxShadow: '0 24px 60px -20px rgba(0,0,0,.5)',
          zIndex: 9999,
          ...ttStyle,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            {Ico && <Ico size={15} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.1px' }}>{step.title}</div>
            <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 1 }}>
              Paso {stepIdx + 1} de {TOUR_STEPS.length}
            </div>
          </div>
          <button
            onClick={handleClose}
            title="Saltar recorrido"
            style={{
              width: 24, height: 24, borderRadius: 6, border: 'none',
              background: 'transparent', color: 'var(--fg-3)', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
            }}
          >
            {I && I.x && <I.x size={14} />}
          </button>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)', marginBottom: 14 }}>
          {step.body}
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStepIdx(i)}
              style={{
                flex: 1, height: 3, borderRadius: 2, cursor: 'pointer',
                background: i <= stepIdx ? 'var(--accent)' : 'var(--surface-3)',
                transition: 'background 180ms',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn ghost sm" onClick={handleClose} style={{ fontSize: 11.5 }}>
            Saltar
          </button>
          <div style={{ flex: 1 }} />
          {stepIdx > 0 && (
            <button className="btn sm" onClick={handlePrev}>Atrás</button>
          )}
          <button className="btn primary sm" onClick={handleNext}>
            {isLast ? '¡Terminar!' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EditorTour });
