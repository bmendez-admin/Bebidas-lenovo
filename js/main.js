async function bootstrap() {
  await window.DrinkEngine.loadCatalog();
  window.SessionState.resetSession();
  goToWelcome();
}

function goToWelcome() {
  window.Router.goTo("welcome", goToLeadCapture);
}

function goToLeadCapture() {
  window.Router.goTo("leadCapture", goToAlcoholFilter);
}

function goToAlcoholFilter() {
  window.Router.goTo("alcoholFilter", () => goToQuestion("A"));
}

function goToQuestion(bank) {
  const nextBank = { A: "B", B: "C", C: null }[bank];
  window.Router.goTo("question", bank, () => {
    if (nextBank) {
      goToQuestion(nextBank);
    } else {
      goToProcessing();
    }
  });
}

function goToProcessing() {
  window.Router.goTo("processing", goToResult);
}

function goToResult() {
  window.Router.goTo("result", goToClosing);
}

function goToClosing() {
  window.Router.goTo("closing", goToWelcome);
}

bootstrap();