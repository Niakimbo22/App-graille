// Tests de l'algorithme de sélection. Lancer avec: npm test
import recipesData from "../data/recipes.json";
import type { Recipe, FunnelState } from "./types";
import { generatePlan, filterRecipes, satisfiesRegime, hasAddedSugar, isLowGI } from "./planner";

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
    equipement: ["four", "plaque", "airfryer"],
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

console.log(`\n${passed} assertions OK, ${failed} échecs`);
if (failed > 0) process.exit(1);
