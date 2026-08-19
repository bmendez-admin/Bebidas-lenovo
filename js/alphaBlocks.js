function renderAlphaBlocks(variant) {
  const color = variant === "pale" ? "rgba(30,0,19,0.5)" : "rgba(255,255,255,0.5)";
  return `
    <svg class="alpha-blocks" viewBox="0 0 100 100" preserveAspectRatio="none">
      <circle cx="88" cy="12" r="8" fill="${color}" />
      <polygon points="80,90 95,90 95,70" fill="${color}" />
      <path d="M 5 5 L 20 5 A 15 15 0 0 1 5 20 Z" fill="${color}" />
    </svg>
  `;
}

window.AlphaBlocks = { renderAlphaBlocks };