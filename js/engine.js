let DRINKS = [];
let QUESTIONS = [];
let CONSUMPTION_MAPPING = {};

async function loadCatalog() {
  const [drinksRes, questionsRes, mappingRes] = await Promise.all([
    fetch("data/drinks.json"),
    fetch("data/questions.json"),
    fetch("data/consumptionMapping.json"),
  ]);
  DRINKS = await drinksRes.json();
  QUESTIONS = await questionsRes.json();
  CONSUMPTION_MAPPING = await mappingRes.json();
}

function pickRandomQuestion(bank, excludeIds = []) {
  const pool = QUESTIONS.filter(
    (q) => q.bank === bank && !excludeIds.includes(q.id)
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

function filterByAlcohol(allowAlcohol) {
  return allowAlcohol ? DRINKS.slice() : DRINKS.filter((d) => !d.alcoholic);
}

function scoreDrinks(eligibleDrinks, tagsA, tagsB, moodTag) {
  const favoredByMood = CONSUMPTION_MAPPING[moodTag] || [];

  return eligibleDrinks.map((drink) => {
    let score = 0;

    for (const [tag, value] of Object.entries(tagsA)) {
      if (drink.tags.includes(tag)) score += value;
    }
    for (const [tag, value] of Object.entries(tagsB)) {
      if (drink.tags.includes(tag)) score += value;
    }
    if (favoredByMood.includes(drink.id)) score += 3;
    if (drink.alcoholic) score += 2;

    return { ...drink, score };
  });
}

function buildTop3(scoredDrinks) {
  const shuffled = scoredDrinks
    .map((d) => ({ ...d, tieBreak: Math.random() }))
    .sort((a, b) => b.score - a.score || b.tieBreak - a.tieBreak);
  return shuffled.slice(0, 3);
}

function weightedRandomSelect(top3) {
  let weights;
  if (top3.length === 3) weights = [55, 30, 15];
  else if (top3.length === 2) weights = [65, 35];
  else return top3[0];

  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;

  for (let i = 0; i < top3.length; i++) {
    if (roll < weights[i]) return top3[i];
    roll -= weights[i];
  }
  return top3[top3.length - 1];
}

function runEngine(allowAlcohol, answerTags) {
  const eligible = filterByAlcohol(allowAlcohol);
  const scored = scoreDrinks(eligible, answerTags.A, answerTags.B, answerTags.C);
  const top3 = buildTop3(scored);
  const selected = weightedRandomSelect(top3);
  return { top3, selected };
}

window.DrinkEngine = {
  loadCatalog,
  pickRandomQuestion,
  runEngine,
  getDrinks: () => DRINKS,
  getQuestions: () => QUESTIONS,
};