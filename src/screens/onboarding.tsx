// Onboarding — first screen
function Onboarding({ onDone }) {
  return (
    <div className="onboard fade-in">
      <div className="card">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div className="brand-mark" style={{width:32,height:32,fontSize:15}}>S</div>
          <div style={{fontSize:13,color:'var(--fg-3)'}}>Simple Template</div>
        </div>
        <h1>Haz correos bonitos, sin saber de código.</h1>
        <div className="lede">Arrastra bloques, cambia colores y textos, y envía correos que se vean igual de bien en Gmail, Outlook y en el celular. Nada de HTML, nada de complicaciones.</div>
        <ol>
          <li>
            <div className="step-n">1</div>
            <div>
              <div className="step-t">Arma tu correo como un rompecabezas</div>
              <div className="step-d">Elige bloques: una portada, un texto, una imagen, un botón… los acomodas como tú quieras.</div>
            </div>
          </li>
          <li>
            <div className="step-n">2</div>
            <div>
              <div className="step-t">Personaliza con el nombre de cada persona</div>
              <div className="step-d">Escribe <code style={{fontFamily:'var(--font-mono)',fontSize:12,background:'var(--surface-3)',padding:'1px 5px',borderRadius:3}}>{`{{nombre}}`}</code> y cada destinatario verá el suyo. Nosotros nos encargamos del resto.</div>
            </div>
          </li>
          <li>
            <div className="step-n">3</div>
            <div>
              <div className="step-t">Ve cómo se verá antes de enviar</div>
              <div className="step-d">Revisa tu correo en la compu y en el celular, en tema claro y oscuro — lado a lado.</div>
            </div>
          </li>
          <li>
            <div className="step-n">4</div>
            <div>
              <div className="step-t">Envía o guarda para después</div>
              <div className="step-d">Manda una prueba a tu correo, envíalo a tus suscriptores, o guárdalo para que lo use tu equipo.</div>
            </div>
          </li>
        </ol>
        <div className="row" style={{justifyContent:'space-between',alignItems:'center'}}>
          <button className="btn ghost" onClick={onDone}>Ver la app sin el recorrido</button>
          <div className="row">
            <div className="chip">Pulsa <span className="kbd">?</span> cuando necesites ayuda</div>
            <button className="btn primary" onClick={onDone}>Empezar a diseñar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
