function renderWelcome(container, onNext) {
  container.innerHTML = `
    <div class="screen bg-gradient-deep">
      ${window.Chrome.renderChrome(false)}
      <p class="eyebrow">Bienvenido a</p>
      <img class="brand-logo" src="assets/img/logo.png" alt="Lenovo" />
      <h1 class="brand-title">Descubre la bebida<br /><strong>que combina contigo.</strong></h1>
      <button class="cta-button" id="btn-start">Comenzar</button>
    </div>
  `;

  container.querySelector("#btn-start").addEventListener("click", onNext);
}

window.Screens = window.Screens || {};
window.Screens.welcome = renderWelcome;