// Tests de l'algorithme de sélection. Lancer avec: npm test
import recipesData from "../data/recipes.json";
import type { Recipe, FunnelState } from "./types";
import { generatePlan, filterRecipes, satisfiesRegime, hasAddedSugar, isLowGI, proteinCategory, isHalal, besoinHalal, prixTotalRecette } from "./planner";
import { buildShoppingList } from "./shopping";
import { fourchette } from "./fourchette";
import { estDeSaison, saisonnaliteRecette, produitPour } from "./saison";

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
  // vérifie qu'on a bien privilégié des recettes peu chères : le panier serré
  // doit rester nettement sous un plan sans contrainte de budget
  const libre = generatePlan({ recipes, funnel: baseFunnel({ budget: 250, personnes: 4 }), coef: 1.0, seed: 3 });
  assert(
    res.coutEstime < libre.coutEstime,
    `panier contraint (${res.coutEstime}€) moins cher que le panier libre (${libre.coutEstime}€)`
  );
}

// --- Cas 4 bis: le coût annoncé est bien celui de la liste de courses ---
console.log("Cas 4 bis — coût = vrai panier (paquets entiers)");
{
  const funnel = baseFunnel({ personnes: 2 });
  const res = generatePlan({ recipes, funnel, coef: 1.0, seed: 21 });
  const panier = buildShoppingList(res.items.map((i) => i.recipeId), 2, 1.0);
  assert(
    Math.abs(res.coutEstime - panier.total) < 0.01,
    `coutEstime (${res.coutEstime}€) = total de la liste (${panier.total}€)`
  );
  // la répartition par recette retombe sur le total, aux arrondis près
  const somme = Math.round(res.items.reduce((s, i) => s + i.prixTotal, 0) * 100) / 100;
  assert(Math.abs(somme - panier.total) < 0.01, `somme des parts (${somme}€) = total du panier`);
  // un paquet entier coûte forcément plus que les seuls grammes utilisés
  const parts = res.items.reduce(
    (s, i) => s + prixTotalRecette(recipes.find((r) => r.id === i.recipeId)!, 2, 1.0),
    0
  );
  assert(panier.total > parts, `panier réel (${panier.total}€) > somme des grammages (${Math.round(parts * 100) / 100}€)`);
  assert(panier.placard > 0, `le placard est isolé (${panier.placard}€)`);
}

// --- Cas 4 ter: fourchette de prix cohérente ---
console.log("Cas 4 ter — fourchette");
{
  const f = fourchette(60, 15);
  assert(f.bas < 60 && f.haut > 60, `fourchette ${f.bas}–${f.haut} € encadre 60 €`);
  assert(f.bas >= 60 - 15 - 5, "le bas ne retire pas plus que le placard + la marge");
  assert(fourchette(0, 0).bas === 0, "panier vide → fourchette à 0");
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

console.log(`\n${passed} assertions OK, ${failed} échecs`);
if (failed > 0) process.exit(1);
