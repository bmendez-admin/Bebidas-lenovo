let state = null;

function resetSession() {
  state = {
    leadInfo: null,
    orderId: null,
    allowAlcohol: null,
    questions: { A: null, B: null, C: null },
    answers: { A: null, B: null, C: null },
    moodTag: null,
    top3: null,
    selectedDrink: null,
  };
  return state;
}

function setLeadInfo(leadInfo) {
  state.leadInfo = leadInfo;
}

function setOrderId(orderId) {
  state.orderId = orderId;
}

function setAlcoholFilter(allow) {
  state.allowAlcohol = allow;
}

function pickQuestion(bank) {
  const question = window.DrinkEngine.pickRandomQuestion(bank);
  state.questions[bank] = question;
  return question;
}

function recordAnswer(bank, optionId) {
  const question = state.questions[bank];
  const option = question.options.find((o) => o.id === optionId);
  state.answers[bank] = option.tags;
  if (bank === "C") {
    state.moodTag = Object.keys(option.tags)[0];
  }
  return option;
}

function computeResult() {
  const answerTags = {
    A: state.answers.A,
    B: state.answers.B,
    C: state.moodTag,
  };
  const { top3, selected } = window.DrinkEngine.runEngine(
    state.allowAlcohol,
    answerTags
  );
  state.top3 = top3;
  state.selectedDrink = selected;
  return selected;
}

function getState() {
  return state;
}

resetSession();

window.SessionState = {
  resetSession,
  setLeadInfo,
  setOrderId,
  setAlcoholFilter,
  pickQuestion,
  recordAnswer,
  computeResult,
  getState,
};