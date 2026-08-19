function renderAlcoholFilter(container, onNext) {
  container.innerHTML = `
    <div class="screen bg-gradient-deep">
      ${window.Chrome.renderChrome(true)}
      <p class="eyebrow">Antes de empezar...</p>
      <h1 class="brand-title">¿Incluimos bebidas<br /><strong>con alcohol?</strong></h1>
      <div class="option-list">
        <button class="option-card" id="btn-alcohol-yes">Sí, incluir alcohol</button>
        <button class="option-card" id="btn-alcohol-no">Prefiero sin alcohol</button>
      </div>
    </div>
  `;

  container.querySelector("#btn-alcohol-yes").addEventListener("click", () => {
    window.SessionState.setAlcoholFilter(true);
    onNext();
  });

  container.querySelector("#btn-alcohol-no").addEventListener("click", () => {
    window.SessionState.setAlcoholFilter(false);
    onNext();
  });
}

window.Screens = window.Screens || {};
window.Screens.alcoholFilter = renderAlcoholFilter;