function renderResult(container, onNext) {
  const state = window.SessionState.getState();
  const drink = state.selectedDrink;

  const tagsLine = drink.tags.join(" · ");
  const ingredientsLine = drink.ingredients.join("  •  ");
  const nameParts = drink.name.split(" ");
  const half = Math.ceil(nameParts.length / 2);
  const nameHtml = nameParts.slice(0, half).join(" ") + "<br /><strong>" + nameParts.slice(half).join(" ") + "</strong>";

  container.innerHTML = `
    <div class="screen bg-gradient-deep">
      ${window.Chrome.renderChrome(true)}
      <div class="result-layout">
        <div class="result-info">
          <p class="eyebrow">Tu fórmula Lenovo LAB es</p>
          <h1 class="brand-title">${nameHtml}</h1>
          <p class="result-ingredient-label">Tú ingrediente clave es</p>
          <span class="result-ingredient-pill">${drink.keyIngredient}</span>
          <p class="result-tags-line">${tagsLine}</p>
        </div>
        <div class="result-visual-wrap">
          <img class="result-visual" id="result-img" src="assets/img/ingredients/${drink.id}.png" alt="${drink.keyIngredient}" />
          <p class="result-ingredients-full">${ingredientsLine}</p>
        </div>
      </div>
      <button class="cta-button" id="btn-accept">Aceptar bebida</button>
    </div>
  `;

  const img = container.querySelector("#result-img");
  img.addEventListener("error", () => {
    img.src = `assets/img/drinks/${drink.id}.png`;
    img.onerror = () => {
      img.outerHTML = `<div class="result-visual no-image">${drink.name.charAt(0)}</div>`;
    };
  });

  container.querySelector("#btn-accept").addEventListener("click", onNext);
}

window.Screens = window.Screens || {};
window.Screens.result = renderResult;