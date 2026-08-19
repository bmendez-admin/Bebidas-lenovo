function renderChrome(showTopLabel) {
  const label = showTopLabel ? '<div class="top-label">Lenovo LAB</div>' : "";
  return `
    <div class="side-tab"><span>Lenovo</span></div>
    ${label}
  `;
}

window.Chrome = { renderChrome };