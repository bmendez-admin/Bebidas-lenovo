function renderChrome(showTopLabel) {
  const label = showTopLabel ? '<div class="top-label">Lenovo LAB</div>' : "";
  return `
    <div class="side-tab">
      <img src="assets/img/logo.png" alt="Lenovo" class="side-tab-logo" />
    </div>
    ${label}
  `;
}

window.Chrome = { renderChrome };