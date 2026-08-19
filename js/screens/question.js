const BANK_STEP = { A: 1, B: 2, C: 3 };

function renderQuestion(container, bank, onNext) {
  const question = window.SessionState.pickQuestion(bank);
  const step = BANK_STEP[bank];

  const segmentsHtml = [1, 2, 3]
    .map((n) => `<div class="progress-segment ${n <= step ? "active" : ""}"></div>`)
    .join("");

  const optionsHtml = question.options
    .map((opt) => `<button class="option-card" data-option-id="${opt.id}">${opt.text}</button>`)
    .join("");

  container.innerHTML = `
    <div class="screen bg-gradient-deep">
      ${window.Chrome.renderChrome(true)}
      <p class="progress-counter">0${step}/03</p>
      <div class="progress-bar">${segmentsHtml}</div>
      <h1 class="brand-title">${question.text}</h1>
      <div class="option-list">${optionsHtml}</div>
    </div>
  `;

  container.querySelectorAll(".option-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.SessionState.recordAnswer(bank, btn.dataset.optionId);
      onNext();
    });
  });
}

window.Screens = window.Screens || {};
window.Screens.question = renderQuestion;