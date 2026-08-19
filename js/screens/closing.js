function renderClosing(container, onNext) {
  container.innerHTML = `
    <div class="screen bg-gradient-deep">
      ${window.Chrome.renderChrome(true)}
      <h1 class="brand-title">Ready to<br /><strong>serve</strong></h1>
      <p class="brand-subtitle">Muéstrale este resultado al equipo de Lenovo LAB.<br />¡Disfruta tu bebida!</p>
      <button class="cta-button" id="btn-new-formula">Nueva fórmula</button>
    </div>
  `;

  let advanced = false;

  function advance() {
    if (advanced) return;
    advanced = true;
    clearTimeout(autoResetTimer);
    window.SessionState.resetSession();
    onNext();
  }

  const autoResetTimer = setTimeout(advance, 15000);

  container.querySelector("#btn-new-formula").addEventListener("click", advance);
}

window.Screens = window.Screens || {};
window.Screens.closing = renderClosing;