function renderMenu(container, onSelect, onBarra) {
  const drinks = window.DrinkEngine.getDrinks();

  const cardsHtml = drinks
    .map(
      (d) => `
      <button class="menu-card" data-id="${d.id}">
        <img class="menu-card-image" src="assets/img/drinks/${d.id}.png" alt="${d.name}" />
        <span class="menu-card-name">${d.name}</span>
        <span class="menu-card-ingredient">${d.keyIngredient}</span>
      </button>
    `
    )
    .join("");

  container.innerHTML = `
    <div class="screen bg-gradient-deep menu-screen">
      ${window.Chrome.renderChrome(true)}
      <p class="eyebrow">Elige tu bebida</p>
      <h1 class="brand-title menu-title">Escoge lo que<br /><strong>más te antoje.</strong></h1>
      <div class="menu-grid">
        ${cardsHtml}
      </div>
      <button class="result-reject-button" id="btn-menu-barra">Prefiero elegir en barra</button>
    </div>
  `;

  container.querySelectorAll(".menu-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const drink = drinks.find((d) => d.id === id);
      onSelect(drink);
    });
  });

  container.querySelector("#btn-menu-barra").addEventListener("click", onBarra);
}

window.Screens = window.Screens || {};
window.Screens.menu = renderMenu;