// Delivery settings — connect an account to send template previews (up to 5 recipients)
// Used both as a standalone modal and embedded inside SettingsPanel

function extractDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const at = email.indexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase().trim() : null;
}

// Minimal stand-in template used when the user runs "Save and test" from
// Settings without an editor open — we still want to send a real email so the
// user can confirm deliverability end-to-end.
function buildConnectivityTestTemplate(fromEmail = '') {
  const t = window.stI18n.t;
  const subject = t('smtp.connTest.subject');
  const heading = t('smtp.connTest.heading');
  const body = t('smtp.connTest.body', { fromEmail: fromEmail ? ` (${fromEmail})` : '' });
  return {
    name: subject,
    vars: [],
    meta: { subject },
    doc: {
      sections: [{
        id: 'sec-test', layout: '1col',
        style: { bg: '#ffffff', text: '#1a1a17', padding: 32, align: 'center', font: 'inter' },
        columns: [{ w: 100, blocks: [
          { id: 'b-head', type: 'heading', data: { content: { text: heading }, style: { size: 22, align: 'center', weight: 600 } } },
          { id: 'b-body', type: 'text', data: { content: { body }, style: { size: 14, align: 'center' } } },
        ]}],
      }],
    },
  };
}

// Each appPassword provider is just SMTP under the hood with pre-configured
// host/port/security. The `appPasswordUrl` opens the user's browser directly
// at the provider's app-password generation page; for providers that require
// 2FA first, the UI copy flags that.
// Translatable strings (name [for smtp only], hint, steps, note, appLabel) are
// looked up via t('smtp.provider.<id>.<field>') — see getProviders().
const DELIVERY_PROVIDERS = [
  {
    id:'gmail', name:'Gmail', color:'#ea4335', letter:'G', kind:'appPassword',
    smtp: { host:'smtp.gmail.com', port:587, security:'tls' },
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    stepsCount: 3,
  },
  {
    id:'outlook', name:'Outlook', color:'#0078d4', letter:'O', kind:'appPassword',
    smtp: { host:'smtp-mail.outlook.com', port:587, security:'tls' },
    appPasswordUrl: 'https://account.microsoft.com/security',
    stepsCount: 3,
    hasNote: true,
  },
  {
    id:'yahoo', name:'Yahoo Mail', color:'#6001d2', letter:'Y', kind:'appPassword',
    smtp: { host:'smtp.mail.yahoo.com', port:587, security:'tls' },
    appPasswordUrl: 'https://login.yahoo.com/account/security',
    stepsCount: 3,
  },
  {
    id:'icloud', name:'iCloud Mail', color:'#1f1f1f', letter:'', kind:'appPassword',
    smtp: { host:'smtp.mail.me.com', port:587, security:'tls' },
    appPasswordUrl: 'https://appleid.apple.com',
    stepsCount: 3,
  },
  {
    id:'gmail-oauth', name:'Gmail Workspace (OAuth)', color:'#ea4335', letter:'G', kind:'oauth',
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    appLabel: 'Google Cloud Console',
    requiresClientSecret: true,
    requiresTenant: false,
    stepsCount: 4,
    hasNote: true,
  },
  {
    id:'microsoft-oauth', name:'Microsoft 365 (OAuth)', color:'#0078d4', letter:'M', kind:'oauth',
    setupUrl: 'https://portal.azure.com/',
    appLabel: 'Azure Portal',
    requiresClientSecret: false,
    requiresTenant: true,
    stepsCount: 4,
  },
  {
    id:'smtp', color:'#5b5bf0', letter:'✱', kind:'smtp',
    // `name` comes from t('smtp.provider.smtp.name') — translated.
  },
];

// Return DELIVERY_PROVIDERS enriched with localized `name` (only for smtp),
// `hint`, `steps`, and `note` based on the current language.
function getProviders() {
  const t = window.stI18n.t;
  return DELIVERY_PROVIDERS.map(p => {
    const steps = [];
    for (let i = 1; i <= (p.stepsCount || 0); i++) {
      steps.push(t(`smtp.provider.${p.id}.step.${i}`));
    }
    const out = {
      ...p,
      name: p.name || t(`smtp.provider.${p.id}.name`),
      hint: t(`smtp.provider.${p.id}.hint`),
    };
    if (p.stepsCount) out.steps = steps;
    if (p.hasNote) out.note = t(`smtp.provider.${p.id}.note`);
    return out;
  });
}

const MAX_RECIPIENTS = 5;

function DeliveryModal({ onClose, embedded = false }) {
  const t = window.stI18n.t;
  const lang = window.stI18n.useLang();
  // Defaults pulled from the user's global account profile so the SMTP form
  // arrives pre-filled with the right "from" name/email instead of hardcoded
  // demo values. Per-workspace SMTP credentials still live in safeStorage.
  const account = window.stStorage.getSetting('account', {}) || {};
  const accountEmail = account.email || '';
  const accountName = account.name || '';
  const providers = React.useMemo(() => getProviders(), [lang]);
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

  const p = providers.find(x => x.id === provider);

  const choose = (id) => {
    setProvider(id);
    setState('idle');
    // For guided providers (Gmail/Outlook/Yahoo/iCloud), seed the SMTP fields
    // with the provider's hardcoded host/port/security so the user never sees
    // or edits them. They only need to supply their email + app password.
    const pr = providers.find(x => x.id === id);
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
      setError(window.stIpcErr.localize(result));
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
      const n = (cfg.recipients || []).length;
      window.notify && window.notify('testDone', {
        kind: 'ok',
        title: t(n === 1 ? 'smtp.toast.sent.title.one' : 'smtp.toast.sent.title.other', { n }),
        msg: t('smtp.toast.sent.msg'),
      });
    } else {
      setState('err');
      setError(result.error || t('smtp.error.unknown'));
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
        {t('smtp.step1.intro.prefix')} <b>{t('smtp.step1.intro.max', { n: MAX_RECIPIENTS })}</b> {t('smtp.step1.intro.suffix')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {providers.map(pr => (
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
                {pr.kind==='smtp' && <span className="chip" style={{height:18,fontSize:10}}>{t('smtp.badge.advanced')}</span>}
              </div>
              <div style={{fontSize:11.5,color:'var(--fg-3)'}}>{pr.hint}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{marginTop:18,padding:12,background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:12,color:'var(--fg-2)',lineHeight:1.55,display:'flex',gap:10}}>
        <I.info size={14} style={{color:'var(--fg-3)',marginTop:2,flexShrink:0}}/>
        <div>
          {t('smtp.step1.note.prefix')} <b>{t('smtp.step1.note.bold')}</b> {t('smtp.step1.note.suffix', { n: MAX_RECIPIENTS })}
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
        {connected && <span className="chip ok"><I.check size={10}/> {t('smtp.status.connected')}</span>}
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
              {t('smtp.appPass.heading', { name: p.name })}
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
              <I.send size={13}/> {t('smtp.appPass.openBtn', { name: p.name })}
            </button>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.email.label', { name: p.name })}</label>
            <input
              className="field"
              type="email"
              value={cfg.user}
              onChange={e=>updateUser(e.target.value)}
              placeholder={t('smtp.field.email.placeholder')}/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.appPass.label')}</label>
            <input
              className="field"
              type="password"
              value={cfg.pass}
              onChange={e=>update('pass',e.target.value)}
              placeholder="••••••••••••••••"/>
            <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4,lineHeight:1.5}}>
              {t('smtp.field.appPass.hint')}
            </div>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.fromEmail.label')}</label>
            <input
              className="field"
              type="email"
              value={cfg.fromEmail}
              onChange={e=>update('fromEmail',e.target.value)}
              placeholder={cfg.user || t('smtp.field.email.placeholder')}/>
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
                  {t('smtp.warn.domainMismatch.appPass', { fromDomain, userDomain, name: p.name })}
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
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.host.label')}</label>
              <input className="field" value={cfg.host} onChange={e=>update('host',e.target.value)} placeholder={t('smtp.field.host.placeholder')}/>
            </div>
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.port.label')}</label>
              <input className="field" type="number" value={cfg.port} onChange={e=>update('port',Number(e.target.value))}/>
            </div>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.security.label')}</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                {id:'tls',label:'TLS',d: t('smtp.security.tls.desc')},
                {id:'ssl',label:'SSL',d: t('smtp.security.ssl.desc')},
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
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.user.label')}</label>
            <input className="field" value={cfg.user} onChange={e=>updateUser(e.target.value)} placeholder={t('smtp.field.user.placeholder')}/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.password.label')}</label>
            <input className="field" type="password" value={cfg.pass} onChange={e=>update('pass',e.target.value)} placeholder="••••••••••••"/>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.fromEmail.label')}</label>
            <input className="field" type="email" value={cfg.fromEmail} onChange={e=>update('fromEmail',e.target.value)} placeholder={t('smtp.field.fromEmail.placeholder')}/>
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
                  {t('smtp.warn.domainMismatch.smtp', { fromDomain, userDomain })}
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
              {t('smtp.oauth.heading', { appLabel: p.appLabel })}
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
              <I.send size={13}/> {t('smtp.oauth.openBtn', { appLabel: p.appLabel })}
            </button>
          </div>

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.clientId.label')}</label>
            <input
              className="field"
              value={cfg.clientId || ''}
              onChange={e=>update('clientId', e.target.value.trim())}
              placeholder={t('smtp.field.clientId.placeholder')}/>
          </div>

          {p.requiresTenant && (
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.tenantId.label')}</label>
              <input
                className="field"
                value={cfg.tenantId || ''}
                onChange={e=>update('tenantId', e.target.value.trim())}
                placeholder={t('smtp.field.tenantId.placeholder')}/>
              <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4,lineHeight:1.5}}>
                {t('smtp.field.tenantId.hint.prefix')} <code style={{fontFamily:'var(--font-mono)'}}>common</code> {t('smtp.field.tenantId.hint.suffix')}
              </div>
            </div>
          )}

          {p.requiresClientSecret && (
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.clientSecret.label')}</label>
              <input
                className="field"
                type="password"
                value={cfg.clientSecret || ''}
                onChange={e=>update('clientSecret', e.target.value)}
                placeholder="GOCSPX-••••••••••••"/>
              <div style={{fontSize:11,color:'var(--fg-3)',marginTop:4,lineHeight:1.5}}>
                {t('smtp.field.clientSecret.hint')}
              </div>
            </div>
          )}

          <div>
            <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.email.label', { name: p.name.split(' ')[0] })}</label>
            <input
              className="field"
              type="email"
              value={cfg.user}
              onChange={e=>updateUser(e.target.value)}
              placeholder={t('smtp.field.email.placeholder')}/>
          </div>

          {/* Authorize / re-authorize button */}
          {!cfg.tokens?.accessToken ? (
            <button
              className="btn primary"
              onClick={handleAuthorize}
              disabled={!canAuthorize || authorizing}
              style={{alignSelf:'flex-start'}}>
              {authorizing
                ? <><I.loader size={13}/> {t('smtp.oauth.openingBrowser')}</>
                : <><I.check size={13}/> {t('smtp.oauth.authorizeBtn', { name: p.name.split(' ')[0] })}</>}
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
              <span style={{flex:1}}>{t('smtp.oauth.authorized')}</span>
              <button className="btn sm" onClick={handleAuthorize} disabled={authorizing}>
                {authorizing ? <><I.loader size={12}/> …</> : t('smtp.oauth.reauthorize')}
              </button>
            </div>
          )}

          {cfg.tokens?.accessToken && (
            <div>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>{t('smtp.field.fromEmail.label')}</label>
              <input
                className="field"
                type="email"
                value={cfg.fromEmail}
                onChange={e=>update('fromEmail', e.target.value)}
                placeholder={cfg.user || t('smtp.field.email.placeholder')}/>
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
                    {t('smtp.warn.domainMismatch.oauth', { fromDomain, userDomain, name: p.name.split(' ')[0] })}
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
                {t('smtp.connectedAs.prefix')} <b>{cfg.fromEmail || cfg.user || t('smtp.connectedAs.fallback')}</b>
              </div>
            </div>
          )}

          {connected && (
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12.5,fontWeight:500,display:'block',marginBottom:6}}>
                {t('smtp.field.fromName.label')}
              </label>
              <input
                className="field"
                value={cfg.fromName}
                onChange={e=>update('fromName',e.target.value)}
                placeholder={accountName || t('smtp.field.fromName.placeholder')}/>
            </div>
          )}

          <div style={{padding:14,background:'var(--surface-2)',borderRadius:'var(--r-md)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <label style={{fontSize:12.5,fontWeight:500}}>{t('smtp.recipients.label')}</label>
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
                  placeholder={cfg.recipients?.length ? t('smtp.recipients.addAnother') : t('smtp.recipients.placeholder')}
                  style={{flex:1,minWidth:140,border:'none',outline:'none',background:'transparent',fontSize:13,padding:'0 4px',height:26}}/>
              )}
            </div>
            <div style={{fontSize:11.5,color:'var(--fg-3)',marginTop:8,lineHeight:1.5}}>
              {t('smtp.recipients.hint.prefix')} <span className="kbd">Enter</span>.
              {' '}{t('smtp.recipients.hint.max.prefix')} <b>{t('smtp.recipients.hint.max.bold', { n: MAX_RECIPIENTS })}</b> {t('smtp.recipients.hint.max.suffix')}
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
            <b>{t('smtp.sent.title')}</b> {t((cfg.recipients||[]).length === 1 ? 'smtp.sent.msg.one' : 'smtp.sent.msg.other', { n: (cfg.recipients||[]).length })}
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
          <div><b>{t('smtp.sendFailed')}</b> {error || t('smtp.sendFailed.hint')}</div>
        </div>
      )}

      {/* Embedded-mode action buttons (modal variant uses footer) */}
      {embedded && (
        <div style={{display:'flex',gap:8,marginTop:20,paddingTop:16,borderTop:'1px solid var(--line)'}}>
          {connected ? (
            <>
              <button className="btn danger" onClick={disconnect} style={{marginRight:'auto'}}>{t('smtp.btn.disconnect')}</button>
              <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                {state==='sending' ? <><I.loader size={13}/> {t('smtp.btn.sending')}</> : <><I.send size={13}/> {t('smtp.btn.sendTest')}</>}
              </button>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={()=>{setProvider(null);setState('idle');}} style={{marginRight:'auto'}}>{t('smtp.btn.changeProvider')}</button>
              {(p.kind==='smtp' || p.kind==='appPassword' || p.kind==='oauth') && (
                <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                  {state==='sending' ? <><I.loader size={13}/> {t('smtp.btn.saving')}</> : <><I.check size={13}/> {t('smtp.btn.saveAndTest')}</>}
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
        title={t('smtp.modal.title')}
        sub={t('smtp.modal.sub')}
        onClose={onClose}
        footer={<button className="btn ghost" onClick={onClose}>{t('smtp.btn.close')}</button>}>
        {step1Body}
      </Modal>
    );
  }

  return (
    <Modal
      title={t('smtp.modal.title')}
      sub={t('smtp.modal.connecting', { name: p.name })}
      onClose={onClose}
      footer={<>
        {connected ? (
          <>
            <button className="btn danger" onClick={disconnect} style={{marginRight:'auto'}}>{t('smtp.btn.disconnect')}</button>
            <button className="btn ghost" onClick={onClose}>{t('smtp.btn.close')}</button>
            <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
              {state==='sending' ? <><I.loader size={13}/> {t('smtp.btn.sending')}</> : <><I.send size={13}/> {t('smtp.btn.sendTest')}</>}
            </button>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={()=>{setProvider(null);setState('idle');}} style={{marginRight:'auto'}}>{t('smtp.btn.changeProvider')}</button>
            <button className="btn ghost" onClick={onClose}>{t('smtp.btn.cancel')}</button>
            {(p.kind==='smtp' || p.kind==='appPassword' || p.kind==='oauth') && (
              <button className="btn primary" onClick={sendTest} disabled={state==='sending' || !canSend()}>
                {state==='sending' ? <><I.loader size={13}/> {t('smtp.btn.saving')}</> : <><I.check size={13}/> {t('smtp.btn.saveAndTest')}</>}
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
