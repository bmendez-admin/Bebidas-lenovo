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
  window.Router.goTo("result", goToClosing, goToMenu);
}

function goToMenu() {
  window.Router.goTo("menu", goToMenuConfirm, goToElegirEnBarra);
}

function goToMenuConfirm(drink) {
  window.SessionState.setManualDrink(drink);
  window.Router.goTo("menuConfirm", goToResultManual, goToMenu);
}

function goToResultManual() {
  const state = window.SessionState.getState();
  if (state.orderId) {
    window.Leads.actualizarEstadoPedido(state.orderId, "pendiente", state.selectedDrink.name);
  }
  window.Router.goTo("result", goToClosing, goToMenu);
}

function goToElegirEnBarra() {
  goToClosing();
}

function goToClosing() {
  window.Router.goTo("closing", goToWelcome);
}

bootstrap();