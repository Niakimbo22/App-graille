// Tests de l'algorithme de sélection. Lancer avec: npm test
import recipesData from "../data/recipes.json";
import type { Recipe, FunnelState } from "./types";
import { generatePlan, filterRecipes, satisfiesRegime, hasAddedSugar, isLowGI, proteinCategory, isHalal, besoinHalal, prixTotalRecette } from "./planner";
import { estDeSaison, saisonnaliteRecette, produitPour } from "./saison";
import { creneauxPlan, facteurPortions, platsPourJours, portionsAcheter, seConserveBien } from "./repas";
import { buildShoppingList } from "./shopping";

const recipes = recipesData as Recipe[];

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log("  ✓ " + msg);
  } else {
    failed++;
    console.error("  ✗ " + msg);
  }
}

function baseFunnel(overrides: Partial<FunnelState> = {}): FunnelState {
  return {
    magasin: "Carrefour",
    budget: 120,
    regimes: [],
    ambiances: [],
    personnes: 2,
    nbRepas: 5,
    modeRepas: "diner",
    equipement: ["four", "plaque", "airfryer"],
    preferences: [],
    saison: false,
    ...overrides,
  };
}

// --- Cas 1: plan standard ---
console.log("Cas 1 — plan standard (budget large, 2 personnes)");
{
  const res = generatePlan({ recipes, funnel: baseFunnel(), coef: 1.0, seed: 1 });
  assert(res.items.length === 5, "5 recettes sélectionnées");
  assert(res.coutEstime <= 120, `coût ${res.coutEstime}€ ≤ budget 120€`);
  assert(!res.budgetDepasse, "budget non dépassé");
  const ids = new Set(res.items.map((i) => i.recipeId));
  assert(ids.size === 5, "pas de doublon dans le plan");
}

// --- Cas 2: végétarien strict ---
console.log("Cas 2 — végétarien strict");
{
  const funnel = baseFunnel({ regimes: ["vegetarien"] });
  const res = generatePlan({ recipes, funnel, coef: 1.0, seed: 7 });
  assert(res.items.length === 5, "5 recettes trouvées");
  for (const item of res.items) {
    const r = recipes.find((x) => x.id === item.recipeId)!;
    assert(r.regimes.includes("vegetarien"), `${r.id} est végétarien`);
  }
}

// --- Cas 3: air fryer only ---
console.log("Cas 3 — équipement air fryer uniquement");
{
  const funnel = baseFunnel({ equipement: ["airfryer"] });
  const filtered = filterRecipes(recipes, funnel);
  assert(filtered.length > 0, `${filtered.length} recettes air-fryer disponibles`);
  for (const r of filtered) {
    assert(
      r.equipement.every((e) => e === "airfryer"),
      `${r.id} n'exige que l'air fryer`
    );
  }
}

// --- Cas 4: budget très serré ---
console.log("Cas 4 — budget très serré (15€, 4 personnes)");
{
  const funnel = baseFunnel({ budget: 15, personnes: 4 });
  const res = generatePlan({ recipes, funnel, coef: 1.0, seed: 3 });
  assert(res.items.length === 5, "5 recettes malgré le budget serré");
  assert(res.budgetDepasse, "le vrai total dépasse le budget (signalé)");
  // vérifie qu'on a bien privilégié des recettes peu chères
  const moyenne = res.coutEstime / 5;
  assert(moyenne < 12, `coût moyen par repas raisonnable (${moyenne.toFixed(2)}€)`);
}

// --- Cas 5: sans-gluten exclut bien le gluten ---
console.log("Cas 5 — sans gluten");
{
  const funnel = baseFunnel({ regimes: ["sans-gluten"] });
  const res = generatePlan({ recipes, funnel, coef: 1.0, seed: 9 });
  for (const item of res.items) {
    const r = recipes.find((x) => x.id === item.recipeId)!;
    assert(!r.allergenes.includes("gluten"), `${r.id} sans gluten`);
  }
  assert(satisfiesRegime(recipes[0], "sans-gluten") !== undefined, "satisfiesRegime défini");
}

// --- Cas 6: régénérer donne un plan différent ---
console.log("Cas 6 — régénérer varie le plan");
{
  const funnel = baseFunnel({ ambiances: ["gourmand"] });
  const a = generatePlan({ recipes, funnel, coef: 1.0, seed: 100 });
  const b = generatePlan({ recipes, funnel, coef: 1.0, seed: 200 });
  const idsA = a.items.map((i) => i.recipeId).join(",");
  const idsB = b.items.map((i) => i.recipeId).join(",");
  assert(idsA !== idsB, "deux seeds produisent des plans différents");
  const a2 = generatePlan({ recipes, funnel, coef: 1.0, seed: 100 });
  assert(idsA === a2.items.map((i) => i.recipeId).join(","), "même seed → même plan (déterministe)");
}

// --- Cas 7: coef magasin appliqué ---
console.log("Cas 7 — coefficient magasin");
{
  const funnel = baseFunnel();
  const plein = generatePlan({ recipes, funnel, coef: 1.0, seed: 42 });
  const lidl = generatePlan({ recipes, funnel, coef: 0.85, seed: 42 });
  assert(lidl.coutEstime < plein.coutEstime, `Lidl (${lidl.coutEstime}€) moins cher que Carrefour (${plein.coutEstime}€)`);
}

// --- Cas 8: sans sucre ajouté ---
console.log("Cas 8 — sans sucre ajouté");
{
  const funnel = baseFunnel({ regimes: ["sans-sucre"] });
  const res = generatePlan({ recipes, funnel, coef: 1.0, seed: 11 });
  assert(res.items.length === 5, "5 recettes trouvées sans sucre ajouté");
  for (const item of res.items) {
    const r = recipes.find((x) => x.id === item.recipeId)!;
    assert(!hasAddedSugar(r), `${r.id} sans sucre ajouté`);
  }
}

// --- Cas 9: indice glycémique bas ---
console.log("Cas 9 — indice glycémique bas");
{
  const funnel = baseFunnel({ regimes: ["indice-glycemique-bas"] });
  const res = generatePlan({ recipes, funnel, coef: 1.0, seed: 13 });
  assert(res.items.length === 5, "5 recettes trouvées IG bas");
  for (const item of res.items) {
    const r = recipes.find((x) => x.id === item.recipeId)!;
    assert(isLowGI(r), `${r.id} est IG bas`);
  }
  const riz = recipes.find((x) => x.id === "riz-cantonais");
  if (riz) assert(!isLowGI(riz), "riz cantonais n'est pas IG bas (riz + sucre absents mais féculent raffiné)");
}

// --- Cas 10: envies de protéines (plus de poulet) ---
console.log("Cas 10 — envie de poulet privilégiée");
{
  const base = baseFunnel({ ambiances: [], budget: 200 });
  const envie = baseFunnel({ preferences: ["volaille"], budget: 200 });
  // sur plusieurs seeds, l'envie doit augmenter la présence de volaille
  let volailleBase = 0;
  let volailleEnvie = 0;
  for (let seed = 1; seed <= 40; seed++) {
    for (const item of generatePlan({ recipes, funnel: base, coef: 1, seed }).items) {
      if (proteinCategory(recipes.find((r) => r.id === item.recipeId)!) === "volaille") volailleBase++;
    }
    for (const item of generatePlan({ recipes, funnel: envie, coef: 1, seed }).items) {
      if (proteinCategory(recipes.find((r) => r.id === item.recipeId)!) === "volaille") volailleEnvie++;
    }
  }
  assert(volailleEnvie > volailleBase, `plus de volaille avec l'envie (${volailleEnvie} vs ${volailleBase})`);
}

// --- Cas 11: fruits & légumes de saison ---
console.log("Cas 11 — option saison");
{
  const funnel = baseFunnel({ saison: true, budget: 200 });
  const res = generatePlan({ recipes, funnel, coef: 1, seed: 5 });
  assert(res.items.length === 5, "5 recettes trouvées avec l'option saison");
  // le calendrier reconnaît les produits et calcule la saisonnalité
  assert(estDeSaison("Ail") === true, "l'ail est dispo toute l'année");
  assert(produitPour("Tomates cerises")?.nom === "tomate", "les tomates cerises mappent sur tomate");
  const enJanvier = estDeSaison("Tomate", 1);
  const enJuillet = estDeSaison("Tomate", 7);
  assert(enJanvier === false && enJuillet === true, "la tomate est de saison en juillet, pas en janvier");
  const s = saisonnaliteRecette(recipes[0]);
  assert(s.ratio >= 0 && s.ratio <= 1, "ratio de saison borné [0,1]");
}

// --- Cas 12: halal (sans porc ni alcool) ---
console.log("Cas 12 — halal");
{
  const funnel = baseFunnel({ regimes: ["halal"] });
  const res = generatePlan({ recipes, funnel, coef: 1, seed: 21 });
  assert(res.items.length === 5, "5 recettes halal trouvées");
  const HARAM = /\b(porc|lardons?|bacon|jambon|chorizo|saucisson|saucisse|vin|rhum|biere)\b/;
  for (const item of res.items) {
    const r = recipes.find((x) => x.id === item.recipeId)!;
    const noms = r.ingredients.map((i) => i.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
    assert(!noms.some((n) => HARAM.test(n)), `${r.id} sans porc ni alcool`);
  }
  // vérifs unitaires ciblées
  const carbonara = recipes.find((x) => x.id === "pates-carbonara");
  if (carbonara) assert(!isHalal(carbonara), "les carbonara (lardons) ne sont pas halal");
  const couscous = recipes.find((x) => x.id === "couscous-poulet-merguez");
  if (couscous) assert(isHalal(couscous), "le couscous poulet-merguez est halal");
  // la vinaigrette ne doit pas être confondue avec du vin
  assert(!HARAM.test("vinaigrette"), "‘vinaigrette’ n'est pas du vin");
  // rappel halal : viande oui, poisson non
  assert(besoinHalal("Cuisse de poulet") && besoinHalal("Merguez"), "poulet & merguez → à choisir halal");
  assert(!besoinHalal("Dos de cabillaud") && !besoinHalal("Crevettes"), "poisson & crevettes → pas de rappel");
}

// --- Cas 13: halal + envie de porc = neutralisée en amont (UI), plan cohérent ---
console.log("Cas 13 — halal ignore une envie de porc résiduelle");
{
  // même si des préférences "porc" traînaient, aucune recette porc ne passe le filtre halal
  const funnel = baseFunnel({ regimes: ["halal"], preferences: ["porc"] });
  const res = generatePlan({ recipes, funnel, coef: 1, seed: 4 });
  for (const item of res.items) {
    const r = recipes.find((x) => x.id === item.recipeId)!;
    assert(isHalal(r), `${r.id} reste halal malgré l'envie porc`);
  }
}

// --- Cas 14: mode « dîner + restes le midi » ---
console.log("Cas 14 — mode restes (on cuisine en double)");
{
  assert(facteurPortions("restes") === 2 && facteurPortions("diner") === 1, "le mode restes double les parts");
  assert(portionsAcheter(2, "restes") === 4, "2 personnes en mode restes → 4 parts");
  assert(platsPourJours(5, "restes") === 5, "5 jours en mode restes → 5 plats (cuisinés en double)");

  const solo = baseFunnel({ budget: 300 });
  const restes = baseFunnel({ budget: 300, modeRepas: "restes" });
  const b = generatePlan({ recipes, funnel: restes, coef: 1, seed: 77 });
  assert(b.items.length === 5, "5 plats pour 5 jours");
  // chaque plat est facturé pour 4 parts et non 2
  const prixDouble = b.items.every((it) => {
    const r = recipes.find((x) => x.id === it.recipeId)!;
    return Math.abs(it.prixTotal - prixTotalRecette(r, 4, 1)) < 0.01;
  });
  assert(prixDouble, `chaque plat est compté pour ${portionsAcheter(2, "restes")} parts`);

  // la liste de courses est bien calculée sur les parts doublées
  const ids = b.items.map((i) => i.recipeId);
  const simple = buildShoppingList(ids, 2, 1);
  const double = buildShoppingList(ids, portionsAcheter(2, "restes"), 1);
  assert(double.total > simple.total, `liste plus fournie (${double.total}€ vs ${simple.total}€)`);

  // et on privilégie les plats qui se réchauffent bien
  let gardablesSolo = 0;
  let gardablesRestes = 0;
  for (let seed = 1; seed <= 40; seed++) {
    for (const it of generatePlan({ recipes, funnel: solo, coef: 1, seed }).items) {
      if (seConserveBien(recipes.find((r) => r.id === it.recipeId)!)) gardablesSolo++;
    }
    for (const it of generatePlan({ recipes, funnel: restes, coef: 1, seed }).items) {
      if (seConserveBien(recipes.find((r) => r.id === it.recipeId)!)) gardablesRestes++;
    }
  }
  assert(
    gardablesRestes > gardablesSolo,
    `plus de plats qui se gardent en mode restes (${gardablesRestes} vs ${gardablesSolo})`
  );
  // vérifs unitaires de l'heuristique
  const chili = recipes.find((r) => r.id === "chili-con-carne");
  if (chili) assert(seConserveBien(chili), "le chili se garde très bien");
  const nuggets = recipes.find((r) => r.id === "nuggets-maison-frites");
  if (nuggets) assert(!seConserveBien(nuggets), "les nuggets-frites ne se gardent pas");
}

// --- Cas 15: mode « midi et soir » (deux plats différents par jour) ---
console.log("Cas 15 — mode midi et soir");
{
  assert(platsPourJours(5, "double") === 10, "5 jours × 2 repas = 10 plats");
  assert(portionsAcheter(2, "double") === 2, "les parts par plat ne changent pas");

  const funnel = baseFunnel({ modeRepas: "double", budget: 300 });
  const res = generatePlan({ recipes, funnel, coef: 1, seed: 33 });
  assert(res.items.length === 10, "10 plats composés");
  assert(new Set(res.items.map((i) => i.recipeId)).size === 10, "10 plats différents (aucun doublon)");

  const creneaux = creneauxPlan(res.items.length, "double");
  assert(creneaux[0].jour === "lundi" && creneaux[0].creneau === "midi", "1er plat = lundi midi");
  assert(creneaux[1].jour === "lundi" && creneaux[1].creneau === "soir", "2e plat = lundi soir");
  assert(creneaux[2].jour === "mardi", "3e plat = mardi");

  // le midi doit être plus rapide en moyenne que le soir
  let midi = 0;
  let soir = 0;
  let n = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const plan = generatePlan({ recipes, funnel, coef: 1, seed });
    plan.items.forEach((it, i) => {
      const r = recipes.find((x) => x.id === it.recipeId)!;
      if (i % 2 === 0) midi += r.tempsMin;
      else soir += r.tempsMin;
      if (i % 2 === 0) n++;
    });
  }
  assert(midi / n < soir / n, `midi plus rapide que le soir (${(midi / n).toFixed(1)} min vs ${(soir / n).toFixed(1)} min)`);
}

// --- Cas 16: créneaux du mode dîner et repli sur les anciens plans ---
console.log("Cas 16 — créneaux et compatibilité");
{
  const c = creneauxPlan(3, "diner");
  assert(c.length === 3 && c.every((x) => x.creneau === "diner"), "mode dîner : 1 créneau par jour");
  assert(c[0].moment === "dîner" && c[1].jour === "mardi", "libellés jour/moment corrects");
  const r = creneauxPlan(2, "restes");
  assert(r[0].moment.includes("midi"), "mode restes : le libellé rappelle la boîte du midi");
  // plan enregistré avant l'ajout du mode : on retombe sur "dîner"
  assert(facteurPortions(undefined) === 1 && platsPourJours(5, undefined) === 5, "mode absent = dîner seul");
}

// --- Cas 17: assez de recettes pour tenir 7 jours en midi et soir ---
console.log("Cas 17 — 14 plats sans doublon");
{
  const funnel = baseFunnel({ modeRepas: "double", nbRepas: 7, budget: 400 });
  const res = generatePlan({ recipes, funnel, coef: 1, seed: 8 });
  assert(res.items.length === 14, "14 plats composés");
  assert(new Set(res.items.map((i) => i.recipeId)).size === 14, "aucun doublon sur 14 plats");
  // même en végétarien, la base doit suivre
  const vege = baseFunnel({ modeRepas: "double", nbRepas: 7, budget: 400, regimes: ["vegetarien"] });
  const resVege = generatePlan({ recipes, funnel: vege, coef: 1, seed: 8 });
  assert(resVege.items.length === 14, "14 plats végétariens différents");
}

console.log(`\n${passed} assertions OK, ${failed} échecs`);
if (failed > 0) process.exit(1);
