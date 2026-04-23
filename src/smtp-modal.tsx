// Delivery settings — connect an account to send template previews (up to 5 recipients)
// Used both as a standalone modal and embedded inside SettingsPanel

function extractDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const at = email.indexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase().trim() : null;
}

// Minimal stand-in template used when the user runs "Guardar y probar" from
// Settings without an editor open — we still want to send a real email so the
// user can confirm deliverability end-to-end.
function buildConnectivityTestTemplate(fromEmail = '') {
  return {
    name: 'Simple Template — prueba de conexión',
    vars: [],
    meta: { subject: 'Simple Template — prueba de conexión' },
    doc: {
      sections: [{
        id: 'sec-test', layout: '1col',
        style: { bg: '#ffffff', text: '#1a1a17', padding: 32, align: 'center', font: 'inter' },
        columns: [{ w: 100, blocks: [
          { id: 'b-head', type: 'heading', data: { content: { text: '✅ Tu SMTP está funcionando' }, style: { size: 22, align: 'center', weight: 600 } } },
          { id: 'b-body', type: 'text', data: { content: { body: `Este correo fue enviado desde Simple Template usando la configuración SMTP que acabás de guardar${fromEmail ? ` (${fromEmail})` : ''}. Si lo ves en tu bandeja, podés empezar a mandar pruebas de tus plantillas.` }, style: { size: 14, align: 'center' } } },
        ]}],
      }],
    },
  };
}

// Each appPassword provider is just SMTP under the hood with pre-configured
// host/port/security. The `appPasswordUrl` opens the user's browser directly
// at the provider's app-password generation page; for providers that require
// 2FA first, the UI copy flags that.
const DELIVERY_PROVIDERS = [
  {
    id:'gmail', name:'Gmail', color:'#ea4335', letter:'G', kind:'appPassword',
    hint:'Conectá con una contraseña de aplicación de Google',
    smtp: { host:'smtp.gmail.com', port:587, security:'tls' },
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    steps: [
      'Activá la verificación en 2 pasos en tu cuenta de Google si aún no la tenés.',
      'Abrí "Contraseñas de aplicación" y generá una llamada "Simple Template".',
      'Pegá la contraseña (16 caracteres sin espacios) acá abajo.',
    ],
  },
  {
    id:'outlook', name:'Outlook', color:'#0078d4', letter:'O', kind:'appPassword',
    hint:'Conectá con una contraseña de aplicación de Microsoft',
    smtp: { host:'smtp-mail.outlook.com', port:587, security:'tls' },
    appPasswordUrl: 'https://account.microsoft.com/security',
    steps: [
      'Activá la verificación en 2 pasos en tu cuenta Microsoft si aún no la tenés.',
      'En "Seguridad avanzada", creá una contraseña de aplicación.',
      'Pegala acá abajo. Solo funciona con cuentas personales (outlook.com, hotmail.com, live.com).',
    ],
    note: 'Las cuentas corporativas (Microsoft 365) requieren OAuth y no están soportadas todavía.',
  },
  {
    id:'yahoo', name:'Yahoo Mail', color:'#6001d2', letter:'Y', kind:'appPassword',
    hint:'Conectá con una contraseña de aplicación de Yahoo',
    smtp: { host:'smtp.mail.yahoo.com', port:587, security:'tls' },
    appPasswordUrl: 'https://login.yahoo.com/account/security',
    steps: [
      'Abrí la seguridad de tu cuenta de Yahoo.',
      'Generá una contraseña de aplicación para "Simple Template".',
      'Pegala acá abajo.',
    ],
  },
  {
    id:'icloud', name:'iCloud Mail', color:'#1f1f1f', letter:'', kind:'appPassword',
    hint:'Conectá con una contraseña específica de Apple ID',
    smtp: { host:'smtp.mail.me.com', port:587, security:'tls' },
    appPasswordUrl: 'https://appleid.apple.com',
    steps: [
      'Entrá a tu Apple ID.',
      'En "Inicio de sesión y seguridad", elegí "Contraseñas específicas de app".',
      'Generá una nueva y pegala acá abajo.',
    ],
  },
  {
    id:'gmail-oauth', name:'Gmail Workspace (OAuth)', color:'#ea4335', letter:'G', kind:'oauth',
    hint:'Para cuentas corporativas — registrás tu propia app OAuth',
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    appLabel: 'Google Cloud Console',
    requiresClientSecret: true,
    requiresTenant: false,
    steps: [
      'Abrí Google Cloud Console → creá un proyecto (o usá uno existente).',
      'En "APIs y servicios" → "Pantalla de consentimiento de OAuth", configurá la app (External, nombre, tu correo, scope sensible gmail.send).',
      'En "Credenciales" → creá un Client ID tipo "Desktop app".',
      'Copiá el Client ID y el Client Secret que Google te da, y pegalos acá abajo.',
    ],
    note: 'Google exige verificación de app para scope gmail.send en apps públicas. Como la app es tuya, se mantiene en modo "Testing" con hasta 100 usuarios de prueba sin verificación.',
  },
  {
    id:'microsoft-oauth', name:'Microsoft 365 (OAuth)', color:'#0078d4', letter:'M', kind:'oauth',
    hint:'Para cuentas corporativas M365 — registrás tu propia app en Azure',
    setupUrl: 'https://portal.azure.com/',
    appLabel: 'Azure Portal',
    requiresClientSecret: false,
    requiresTenant: true,
    steps: [
      'Abrí Azure Portal → Microsoft Entra ID (Azure AD) → Registros de aplicaciones → Nueva.',
      'Tipo "Public client (mobile/desktop)". Redirect URI: http://localhost (agregar "Permitir flujos públicos" en Authentication).',
      'API permissions → Microsoft Graph → Delegated → SMTP.Send + offline_access.',
      'Copiá Application (client) ID y Directory (tenant) ID, y pegalos acá abajo. Usá "common" como tenant para multi-tenant.',
    ],
  },
  {
    id:'smtp', name:'Correo personalizado', color:'#5b5bf0', letter:'✱', kind:'smtp',
    hint:'Configura tu propio servidor SMTP',
  },
];

const MAX_RECIPIENTS = 5;

function DeliveryModal({ onClose, embedded = false }) {
  // Defaults pulled from the user's global account profile so the SMTP form
  // arrives pre-filled with the right "from" name/email instead of hardcoded
  // demo values. Per-workspace SMTP credentials still live in safeStorage.
  const account = window.stStorage.getSetting('account', {}) || {};
  const accountEmail = account.email || '';
  const accountName = account.name || '';
  const DEFAULT_CFG = {
    fromName: accountName,
    fromEmail: accountEmail,
    recipients: accountEmail ? [accountEmail] : [],
    host:'', port:587, user:'', pass:'', security:'tls',
  };

  const [provider, setProvider] = React.useState(() => window.stStorage.getWSSetting('delivery:provider', null));
  const [cfg, setCfg] = React.useState(DEFAULT_CFG);
  const [state, setState] = React.useState('idle'); // idle | sending | sent | err
  const [error, setError] = React.useState(null);
  const [connected, setConnected] = React.useState(() => window.stStorage.getWSSetting('delivery:connected', false));
  const [recipInput, setRecipInput] = React.useState('');
  const [authorizing, setAuthorizing] = React.useState(false);

  // Credentials live in safeStorage (encrypted) and are scoped to the
  // current workspace via the `ws:<id>:` key prefix from secrets.wsKey().
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const id = provider || 'gmail';
      try {
        const raw = await window.stStorage.secrets.get(window.stStorage.secrets.wsKey(`delivery:cfg:${id}`));
        if (!alive) return;
        if (raw) { try { setCfg(JSON.parse(raw)); return; } catch {} }
        setCfg(DEFAULT_CFG);
      } catch {
        if (alive) setCfg(DEFAULT_CFG);
      }
    })();
    return () => { alive = false; };
  }, [provider]);

  const p = DELIVERY_PROVIDERS.find(x => x.id === provider);

  const choose = (id) => {
    setProvider(id);
    setState('idle');
    // For guided providers (Gmail/Outlook/Yahoo/iCloud), seed the SMTP fields
    // with the provider's hardcoded host/port/security so the user never sees
    // or edits them. They only need to supply their email + app password.
    const pr = DELIVERY_PROVIDERS.find(x => x.id === id);
    if (pr?.kind === 'appPassword' && pr.smtp) {
      setCfg(c => ({
        ...c,
        host: pr.smtp.host,
        port: pr.smtp.port,
        security: pr.smtp.security,
      }));
    }
  };
  const update = (k,v) => setCfg(c => ({...c, [k]:v}));

  // When the SMTP user changes to an email from a different domain than the
  // current "from" address, auto-sync fromEmail. The vast majority of SMTP
  // servers will accept any From: at the SMTP layer, but downstream anti-spam
  // filters (Gmail DMARC, etc.) silently drop the message if the sender's
  // domain doesn't match the authenticating account's domain.
  const updateUser = (value) => {
    setCfg(c => {
      const userDomain = extractDomain(value);
      const fromDomain = extractDomain(c.fromEmail);
      if (userDomain && fromDomain !== userDomain) {
        return { ...c, user: value, fromEmail: value };
      }
      return { ...c, user: value };
    });
  };

  const userDomain = extractDomain(cfg.user);
  const fromDomain = extractDomain(cfg.fromEmail);
  const domainMismatch = userDomain && fromDomain && userDomain !== fromDomain;
  const addRecip = () => {
    const e = recipInput.trim().replace(/,$/,'');
    if (!e || !e.includes('@')) return;
    setCfg(c => {
      const next = [...(c.recipients||[])];
      if (!next.includes(e) && next.length < MAX_RECIPIENTS) next.push(e);
      return {...c, recipients:next};
    });
    setRecipInput('');
  };
  const removeRecip = (i) => {
    setCfg(c => ({...c, recipients:c.recipients.filter((_,x)=>x!==i)}));
  };
  const canSend = () => {
    if (!cfg.recipients || cfg.recipients.length === 0) return false;
    if (p?.kind === 'smtp' || p?.kind === 'appPassword') {
      return cfg.host && cfg.user && cfg.pass && cfg.fromEmail;
    }
    if (p?.kind === 'oauth') {
      // OAuth providers require the BYO credentials + an authorized access
      // token. Host/port come from stOAuth.getSmtpConfig(provider) at send
      // time, not from cfg — so no host check needed.
      return !!cfg.clientId && !!cfg.user && !!cfg.fromEmail && !!cfg.tokens?.accessToken;
    }
    return false;
  };

  const openAppPasswordPage = () => {
    if (p?.appPasswordUrl && window.shell) {
      window.shell.openExternal(p.appPasswordUrl);
    }
  };

  const openSetupPage = () => {
    if (p?.setupUrl && window.shell) {
      window.shell.openExternal(p.setupUrl);
    }
  };

  const canAuthorize = (
    p?.kind === 'oauth'
    && !!cfg.clientId
    && (!p.requiresClientSecret || !!cfg.clientSecret)
    && !!cfg.user
  );

  const handleAuthorize = async () => {
    if (!p || p.kind !== 'oauth') return;
    setAuthorizing(true);
    setError(null);
    const result = await window.stOAuth.authorize(provider, cfg);
    setAuthorizing(false);
    if (!result.ok) {
      setState('err');
      setError(result.error || 'Falló la autorización OAuth.');
      return;
    }
    // Persist tokens + cfg immediately so auth survives even if the user
    // closes the modal without hitting "Guardar y probar".
    const updated = {
      ...cfg,
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      },
    };
    setCfg(updated);
    window.stStorage.setWSSetting('delivery:provider', provider);
    try {
      await window.stStorage.secrets.set(
        window.stStorage.secrets.wsKey(`delivery:cfg:${provider}`),
        JSON.stringify(updated),
      );
    } catch (err) {
      console.error('[oauth] save cfg after authorize', err);
    }
  };
  const sendTest = async () => {
    setState('sending');
    setError(null);

    // Persist provider + cfg BEFORE attempting the send so the helper can
    // load them from secrets. If the send fails, the cfg still stays saved —
    // user can re-open the modal and retry without re-typing credentials.
    window.stStorage.setWSSetting('delivery:provider', provider);
    try {
      await window.stStorage.secrets.set(
        window.stStorage.secrets.wsKey(`delivery:cfg:${provider}`),
        JSON.stringify(cfg),
      );
    } catch (err) {
      console.error('[delivery] save secret', err);
    }

    // Prefer the editor's open template so the recipient sees real content.
    // When opened from Settings with no editor, fall back to a minimal
    // connectivity-test payload so the user still gets a usable signal.
    const ed = window.__stEditor;
    const hasTemplate = ed && typeof ed.getTemplateId === 'function' && ed.getTemplateId();

    const result = hasTemplate
      ? await window.stTestSend.sendFromEditor(cfg.recipients || [], { name: cfg.fromName, email: cfg.fromEmail })
      : await window.stTestSend.send({
          template: buildConnectivityTestTemplate(cfg.fromEmail || cfg.user),
          recipients: cfg.recipients || [],
          fromOverride: { name: cfg.fromName, email: cfg.fromEmail },
        });

    if (result.ok) {
      setState('sent');
      setConnected(true);
      window.stStorage.setWSSetting('delivery:connected', true);
      window.notify && window.notify('testDone', {
        kind: 'ok',
        title: `Prueba enviada a ${(cfg.recipients || []).length} destinatario${(cfg.recipients||[]).length>1?'s':''}`,
        msg: 'Suele tardar un par de minutos en llegar.',
      });
    } else {
      setState('err');
      setError(result.error || 'Error desconocido al enviar.');
    }
  };
  const disconnect = () => {
    setConnected(false);
    setProvider(null);
    setState('idle');
    window.stStorage.setWSSetting('delivery:connected', false);
  };

  // ── Step 1 body ──
  const step1Body = (
    <>
      <div style={{padding:'4px 0 8px',fontSize:13,color:'var(--fg-2)',lineHeight:1.55,marginBottom:16}}>
        Elige desde qué cuenta quieres enviar las pruebas de este template. Podrás enviar hasta <b>{MAX_RECIPIENTS} destinatarios simultáneos</b> por prueba.
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {DELIVERY_PROVIDERS.map(pr => (
          <button key={pr.id} onClick={()=>choose(pr.id)} style={{
            display:'flex',alignItems:'center',gap:14,
            padding:'16px 18px',
            background:'var(--surface)',
            border:'1px solid var(--line)',
            borderRadius:'var(--r-md)',
            cursor:'pointer',
            textAlign:'left',
            transition:'border-color 120ms, background 120ms',
            gridColumn: pr.id==='smtp' ? '1 / -1' : undefined,
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-soft)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';e.currentTarget.style.background='var(--surface)';}}>
            <div style={{
              width:40,height:40,borderRadius:'var(--r-md)',
              background:pr.color,color:'#fff',
              display:'grid',placeItems:'center',
              fontWeight:700,fontSize:18,flexShrink:0,
              fontFamily:'var(--font-display)',
            }}>{pr.letter}</div>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:14,fontWeight:500,marginBottom:2,display:'flex',alignItems:'center',gap:6}}>
                {pr.name}
                {pr.kind==='smtp' && <span className="chip" style={{height:18,fontSize:10}}>Avanzado</span>}
              </div>
              <div style={{fontSize:11.5,color:'var(--fg-3)'}}>{pr.hint}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{marginTop:18,padding:12,background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:12,color:'var(--fg-2)',lineHeight:1.55,display:'flex',gap:10}}>
        <I.info size={14} style={{color:'var(--fg-3)',marginTop:2,flexShrink:0}}/>
        <div>
          Estos ajustes son <b>solo para pruebas del template</b> (máx. {MAX_RECIPIENTS} destinatarios por envío).
          Para campañas masivas a listas de contactos es una función aparte.
        </div>
      </div>
    </>
  );

  // ── Step 2 body ──
  const step2Body = p ? (
    <>
      {/* Provider header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 0 16px',borderBottom:'1px solid var(--line)',marginBottom:18}}>
        <div style={{
          width:36,height:36,borderRadius:'var(--r-md)',
          background:p.color,color:'#fff',
          display:'grid',placeItems:'center',
          fontWeight:700,fontSize:16,
          fontFamily:'var(--font-display)',
        }}>{p.letter}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:500}}>{p.name}</div>
          <div style={{fontSize:11.5,color:'var(--fg-3)'}}>{p.hint}</div>
        </div>
        {connected && <span className="chip ok"><I.check size={10}/> Conectado</span>}
      </div>

      {/* App-password flow (gmail/outlook/yahoo/icloud) */}
      {p.kind==='appPassword' && !connected && (
        <div className="col" style={{gap:14}}>
          {/* Step-by-step instructions + open-browser button */}
          <div style={{
            padding:14,
            background:'var(--surface-2)',
            borderRadius:'var(--r-md)',
            display:'flex',flexDirection:'column',gap:10,
          }}>
            <div style={{fontSize:12.5,fontWeight:500,color:'var(--fg)'}}>
              {p.name} usa una contraseña de aplicación
            </div>
            <ol style={{margin:0,paddingLeft:18,fontSize:12,color:'var(--fg-2)',lineHeight:1.6,display:'flex',flexDirection:'column',gap:2}}>
              {(p.steps || []).map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            {p.note && (
              <div style={{
                padding:'8px 10px',
                background:'color-mix(in oklab, var(--warn, #d97757) 12%, transparent)',
                borderRadius:'var(--r-sm)',
                fontSize:11,color:'var(--warn, #d97757)',lineHeight:1.5,
                display:'flex',gap:6,
              }}>
                <I.info size={12} style={{marginTop:2,flexShrink:0}}/>
                <span>{p.note}</span>
              </div>
            )}
            <button
              className="btn"
              onClick={openAppPasswordPage}
              style={{alignSelf:'flex-start'}}>
              <I.send size={13}/> Abrir {p.name} para generar contraseña
            </button>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Tu correo de {p.name}</label>
            <input
              className="field"
              type="email"
              value={cfg.user}
              onChange={e=>updateUser(e.target.value)}
              placeholder="tu.correo@ejemplo.com"/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Contraseña de aplicación</label>
            <input
              className="field"
              type="password"
              value={cfg.pass}
              onChange={e=>update('pass',e.target.value)}
              placeholder="••••••••••••••••"/>
            <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4,lineHeight:1.5}}>
              No es tu contraseña normal — es la que generaste en el paso 2.
            </div>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Correo desde el que envías</label>
            <input
              className="field"
              type="email"
              value={cfg.fromEmail}
              onChange={e=>update('fromEmail',e.target.value)}
              placeholder={cfg.user || 'tu.correo@ejemplo.com'}/>
            {domainMismatch && (
              <div style={{
                marginTop:6,padding:'8px 10px',
                background:'color-mix(in oklab, var(--warn, #d97757) 12%, transparent)',
                borderRadius:'var(--r-sm)',
                fontSize:11.5,color:'var(--warn, #d97757)',lineHeight:1.5,
                display:'flex',gap:6,
              }}>
                <I.info size={12} style={{marginTop:2,flexShrink:0}}/>
                <span>
                  El "From" usa <b>@{fromDomain}</b> pero la cuenta es <b>@{userDomain}</b>.
                  {p.name} descarta correos cuyo From no coincide con la cuenta autenticada.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMTP form */}
      {p.kind==='smtp' && !connected && (
        <div className="col" style={{gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Servidor SMTP</label>
              <input className="field" value={cfg.host} onChange={e=>update('host',e.target.value)} placeholder="smtp.tuempresa.com"/>
            </div>
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Puerto</label>
              <input className="field" type="number" value={cfg.port} onChange={e=>update('port',Number(e.target.value))}/>
            </div>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Seguridad</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                {id:'tls',label:'TLS',d:'Puerto 587 (recomendado)'},
                {id:'ssl',label:'SSL',d:'Puerto 465'},
              ].map(o => (
                <label key={o.id} style={{
                  padding:'10px 12px',
                  border:'1px solid '+(cfg.security===o.id?'var(--accent)':'var(--line)'),
                  background:cfg.security===o.id?'var(--accent-soft)':'var(--surface)',
                  borderRadius:'var(--r-md)',cursor:'pointer',
                  display:'flex',flexDirection:'column',gap:2,
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="radio" checked={cfg.security===o.id} onChange={()=>update('security',o.id)}/>
                    <span style={{fontSize:13,fontWeight:500}}>{o.label}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--fg-3)',paddingLeft:22}}>{o.d}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="divider"/>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Usuario</label>
            <input className="field" value={cfg.user} onChange={e=>updateUser(e.target.value)} placeholder="tu-cuenta@tuempresa.com"/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Contraseña</label>
            <input className="field" type="password" value={cfg.pass} onChange={e=>update('pass',e.target.value)} placeholder="••••••••••••"/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Correo desde el que envías</label>
            <input className="field" type="email" value={cfg.fromEmail} onChange={e=>update('fromEmail',e.target.value)} placeholder="pruebas@tuempresa.com"/>
            {domainMismatch && (
              <div style={{
                marginTop:6,padding:'8px 10px',
                background:'color-mix(in oklab, var(--warn, #d97757) 12%, transparent)',
                borderRadius:'var(--r-sm)',
                fontSize:11.5,color:'var(--warn, #d97757)',lineHeight:1.5,
                display:'flex',gap:6,
              }}>
                <I.info size={12} style={{marginTop:2,flexShrink:0}}/>
                <span>
                  El "From" usa <b>@{fromDomain}</b> pero el servidor SMTP es <b>@{userDomain}</b>.
                  Gmail y otros filtros descartan como spam los correos con dominios que no coinciden.
                  Cambiá el From a una dirección <b>@{userDomain}</b> para que tu prueba llegue.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OAuth (BYO) flow — Gmail Workspace / Microsoft 365 */}
      {p.kind==='oauth' && !connected && (
        <div className="col" style={{gap:14}}>
          {/* Step-by-step instructions + open-console button */}
          <div style={{
            padding:14,
            background:'var(--surface-2)',
            borderRadius:'var(--r-md)',
            display:'flex',flexDirection:'column',gap:10,
          }}>
            <div style={{fontSize:12.5,fontWeight:500,color:'var(--fg)'}}>
              Registrá tu propia app OAuth en {p.appLabel}
            </div>
            <ol style={{margin:0,paddingLeft:18,fontSize:12,color:'var(--fg-2)',lineHeight:1.6,display:'flex',flexDirection:'column',gap:2}}>
              {(p.steps || []).map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            {p.note && (
              <div style={{
                padding:'8px 10px',
                background:'color-mix(in oklab, var(--warn, #d97757) 12%, transparent)',
                borderRadius:'var(--r-sm)',
                fontSize:11,color:'var(--warn, #d97757)',lineHeight:1.5,
                display:'flex',gap:6,
              }}>
                <I.info size={12} style={{marginTop:2,flexShrink:0}}/>
                <span>{p.note}</span>
              </div>
            )}
            <button className="btn" onClick={openSetupPage} style={{alignSelf:'flex-start'}}>
              <I.send size={13}/> Abrir {p.appLabel}
            </button>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Client ID</label>
            <input
              className="field"
              value={cfg.clientId || ''}
              onChange={e=>update('clientId', e.target.value.trim())}
              placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"/>
          </div>

          {p.requiresTenant && (
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Tenant ID</label>
              <input
                className="field"
                value={cfg.tenantId || ''}
                onChange={e=>update('tenantId', e.target.value.trim())}
                placeholder="common (multi-tenant) o el ID de tu organización"/>
              <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4,lineHeight:1.5}}>
                Usá <code style={{fontFamily:'var(--font-mono)'}}>common</code> si registraste la app como multi-tenant.
              </div>
            </div>
          )}

          {p.requiresClientSecret && (
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Client Secret</label>
              <input
                className="field"
                type="password"
                value={cfg.clientSecret || ''}
                onChange={e=>update('clientSecret', e.target.value)}
                placeholder="GOCSPX-••••••••••••"/>
              <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4,lineHeight:1.5}}>
                Google exige un "secret" incluso para apps desktop. Se guarda cifrado en tu equipo.
              </div>
            </div>
          )}

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Tu correo de {p.name.split(' ')[0]}</label>
            <input
              className="field"
              type="email"
              value={cfg.user}
              onChange={e=>updateUser(e.target.value)}
              placeholder="tu.correo@ejemplo.com"/>
          </div>

          {/* Authorize / re-authorize button */}
          {!cfg.tokens?.accessToken ? (
            <button
              className="btn primary"
              onClick={handleAuthorize}
              disabled={!canAuthorize || authorizing}
              style={{alignSelf:'flex-start'}}>
              {authorizing
                ? <><I.loader size={13}/> Abriendo navegador…</>
                : <><I.check size={13}/> Autorizar con {p.name.split(' ')[0]}</>}
            </button>
          ) : (
            <div style={{
              padding:'10px 12px',
              background:'color-mix(in oklab, var(--ok, #22a06b) 12%, transparent)',
              borderRadius:'var(--r-md)',
              fontSize:12.5,color:'var(--ok, #22a06b)',
              display:'flex',alignItems:'center',gap:10,
            }}>
              <I.check size={14}/>
              <span style={{flex:1}}>Autorizado. Token válido.</span>
              <button className="btn sm" onClick={handleAuthorize} disabled={authorizing}>
                {authorizing ? <><I.loader size={12}/> …</> : 'Re-autorizar'}
              </button>
            </div>
          )}

          {cfg.tokens?.accessToken && (
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>Correo desde el que envías</label>
              <input
                className="field"
                type="email"
                value={cfg.fromEmail}
                onChange={e=>update('fromEmail', e.target.value)}
                placeholder={cfg.user || 'tu.correo@ejemplo.com'}/>
              {domainMismatch && (
                <div style={{
                  marginTop:6,padding:'8px 10px',
                  background:'color-mix(in oklab, var(--warn, #d97757) 12%, transparent)',
                  borderRadius:'var(--r-sm)',
                  fontSize:11.5,color:'var(--warn, #d97757)',lineHeight:1.5,
                  display:'flex',gap:6,
                }}>
                  <I.info size={12} style={{marginTop:2,flexShrink:0}}/>
                  <span>
                    El "From" usa <b>@{fromDomain}</b> pero la cuenta es <b>@{userDomain}</b>.
                    {p.name.split(' ')[0]} rechaza correos cuyo From no coincide con la cuenta autorizada.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recipients + connected state — same for smtp, appPassword, and oauth */}
      {(connected || p.kind==='smtp' || p.kind==='appPassword' || (p.kind==='oauth' && cfg.tokens?.accessToken)) && (
        <>
          {connected && (
            <div style={{
              padding:14,
              background:'color-mix(in oklab, var(--ok) 10%, transparent)',
              borderRadius:'var(--r-md)',
              display:'flex',gap:10,alignItems:'center',
              marginBottom:14,
            }}>
              <I.check size={16} style={{color:'var(--ok)',flexShrink:0}}/>
              <div style={{flex:1,fontSize:13}}>
                Conectado como <b>{cfg.fromEmail || cfg.user || 'tu cuenta'}</b>
              </div>
            </div>
          )}

          {connected && (
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>
                Tu nombre al enviar
              </label>
              <input
                className="field"
                value={cfg.fromName}
                onChange={e=>update('fromName',e.target.value)}
                placeholder={accountName || 'Tu nombre'}/>
            </div>
          )}

          <div style={{padding:14,background:'var(--surface-2)',borderRadius:'var(--r-md)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <label style={{fontSize:12.5,fontWeight:500}}>Destinatarios de prueba</label>
              <span style={{fontSize:11,color:'var(--fg-3)',fontVariantNumeric:'tabular-nums'}}>
                {(cfg.recipients||[]).length} / {MAX_RECIPIENTS}
              </span>
            </div>
            <div style={{
              display:'flex',flexWrap:'wrap',gap:6,
              padding:6,minHeight:44,
              background:'var(--surface)',
              border:'1px solid var(--line)',
              borderRadius:'var(--r-md)',
            }}>
              {(cfg.recipients||[]).map((e,i) => (
                <span key={i} className="chip" style={{height:26,fontSize:12,paddingLeft:10}}>
                  {e}
                  <button
                    className="btn icon sm ghost"
                    style={{height:18,width:18,marginLeft:2}}
                    onClick={()=>removeRecip(i)}>
                    <I.x size={10}/>
                  </button>
                </span>
              ))}
              {(cfg.recipients||[]).length < MAX_RECIPIENTS && (
                <input
                  value={recipInput}
                  onChange={e=>setRecipInput(e.target.value)}
                  onKeyDown={e=>{
                    if (e.key==='Enter' || e.key===',' || e.key===' ') { e.preventDefault(); addRecip(); }
                    if (e.key==='Backspace' && !recipInput && cfg.recipients?.length) {
                      removeRecip(cfg.recipients.length-1);
                    }
                  }}
                  onBlur={addRecip}
                  placeholder={cfg.recipients?.length ? 'añadir otro…' : 'correo@ejemplo.com'}
                  style={{flex:1,minWidth:140,border:'none',outline:'none',background:'transparent',fontSize:13,padding:'0 4px',height:26}}/>
              )}
            </div>
            <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:8,lineHeight:1.5}}>
              Escribe un correo y presiona <span className="kbd">Enter</span>.
              Máximo <b>{MAX_RECIPIENTS} destinatarios</b> por prueba — pensado para que tu equipo revise el template antes de publicarlo.
            </div>
          </div>
        </>
      )}

      {/* Status banner */}
      {state==='sent' && (
        <div style={{
          marginTop:16,padding:14,
          background:'color-mix(in oklab, var(--ok) 12%, transparent)',
          borderRadius:'var(--r-md)',
          fontSize:13,color:'var(--ok)',
          display:'flex',gap:10,alignItems:'flex-start',
        }}>
          <I.check size={16} style={{marginTop:1,flexShrink:0}}/>
          <div>
            <b>¡Enviado!</b> La prueba salió a {(cfg.recipients||[]).length} destinatario{(cfg.recipients||[]).length!==1?'s':''}.
            Suele llegar en menos de un minuto.
          </div>
        </div>
      )}
      {state==='err' && (
        <div style={{
          marginTop:16,padding:14,
          background:'color-mix(in oklab, var(--danger) 12%, transparent)',
          borderRadius:'var(--r-md)',
          fontSize:13,color:'var(--danger)',
          display:'flex',gap:10,
        }}>
          <I.x size={16} style={{marginTop:1,flexShrink:0}}/>
          <div><b>No pudimos enviar.</b> {error || 'Revisá el servidor, usuario y contraseña.'}</div>
        </div>
      )}

      {/* Embedded-mode action buttons (modal variant uses footer) */}
      {embedded && (
        <div style={{display:'flex',gap:8,marginTop:20,paddingTop:16,borderTop:'1px solid var(--line)'}}>
          {connected ? (
            <>
              <button className="btn danger" onClick={disconnect} style={{marginRight:'auto'}}>Desconectar</button>
              <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                {state==='sending' ? <><I.loader size={13}/> Enviando…</> : <><I.send size={13}/> Enviar prueba</>}
              </button>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={()=>{setProvider(null);setState('idle');}} style={{marginRight:'auto'}}>← Cambiar proveedor</button>
              {(p.kind==='smtp' || p.kind==='appPassword' || p.kind==='oauth') && (
                <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                  {state==='sending' ? <><I.loader size={13}/> Guardando…</> : <><I.check size={13}/> Guardar y probar</>}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  ) : null;

  // ── Embedded rendering (inside SettingsPanel) ──
  if (embedded) {
    if (!provider) {
      return <>{step1Body}</>;
    }
    return <>{step2Body}</>;
  }

  // ── Modal rendering (standalone) ──
  if (!provider) {
    return (
      <Modal
        title="Envío de pruebas del template"
        sub="Conecta una cuenta para enviar este diseño a tu equipo de revisión"
        onClose={onClose}
        footer={<button className="btn ghost" onClick={onClose}>Cerrar</button>}>
        {step1Body}
      </Modal>
    );
  }

  return (
    <Modal
      title="Envío de pruebas del template"
      sub={`Conectando con ${p.name}`}
      onClose={onClose}
      footer={<>
        {connected ? (
          <>
            <button className="btn danger" onClick={disconnect} style={{marginRight:'auto'}}>Desconectar</button>
            <button className="btn ghost" onClick={onClose}>Cerrar</button>
            <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
              {state==='sending' ? <><I.loader size={13}/> Enviando…</> : <><I.send size={13}/> Enviar prueba</>}
            </button>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={()=>{setProvider(null);setState('idle');}} style={{marginRight:'auto'}}>← Cambiar proveedor</button>
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            {(p.kind==='smtp' || p.kind==='appPassword' || p.kind==='oauth') && (
              <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                {state==='sending' ? <><I.loader size={13}/> Guardando…</> : <><I.check size={13}/> Guardar y probar</>}
              </button>
            )}
          </>
        )}
      </>}>
      {step2Body}
    </Modal>
  );
}

Object.assign(window, { DeliveryModal, SmtpModal: DeliveryModal });
