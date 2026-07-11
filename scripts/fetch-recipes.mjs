#!/usr/bin/env node
/**
 * fetch-recipes.mjs — enrichit le catalogue avec de VRAIES recettes du monde
 * depuis TheMealDB (API 100% gratuite, ouverte, https://www.themealdb.com/api.php).
 *
 * Conçu pour tourner AU BUILD dans GitHub Actions (qui a un accès Internet complet).
 * Écrit data/recipes.world.json — fusionné aux recettes FR curées par lib/recipes.ts.
 *
 * DÉFENSIF : toute erreur réseau/parsing est rattrapée. En cas d'échec on écrit
 * (ou on garde) un tableau vide → le build continue avec les recettes FR seules.
 * Le cœur français n'est JAMAIS cassé par ce script.
 *
 * Les recettes importées portent origine:"monde", prixEstime:true (mesures
 * impériales approximées) et un crédit source.
 *
 *   node scripts/fetch-recipes.mjs            → fetch + écrit data/recipes.world.json
 *   node scripts/fetch-recipes.mjs --selftest → teste la normalisation hors-ligne
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "recipes.world.json");

const API = "https://www.themealdb.com/api/json/v1/1";
// On garde les plats "dîner" salés ; on écarte desserts / petit-déj.
const CATS_OK = new Set([
  "Beef", "Chicken", "Lamb", "Pork", "Seafood", "Pasta",
  "Vegetarian", "Vegan", "Miscellaneous", "Side", "Starter", "Goat",
]);

// ── Dictionnaire ingrédients EN → FR (prix €/kg·L·pièce, rayon) ──────────────
const FL = "Fruits & Légumes", BP = "Boucherie/Poisson", CR = "Crèmerie";
const ES = "Épicerie salée", EC = "Épicerie sucrée", SU = "Surgelés", BO = "Boulangerie";
// [fr, prix, ref, rayon]
const ING = {
  // légumes
  onion: ["oignon", 1.2, "kg", FL], "red onion": ["oignon rouge", 2, "kg", FL],
  "spring onion": ["oignon nouveau", 6, "kg", FL], "green onions": ["oignon nouveau", 6, "kg", FL],
  garlic: ["ail", 8, "kg", FL], "garlic clove": ["ail", 8, "kg", FL],
  tomato: ["tomate", 2.5, "kg", FL], tomatoes: ["tomate", 2.5, "kg", FL],
  "cherry tomatoes": ["tomates cerises", 6, "kg", FL],
  carrot: ["carotte", 1.2, "kg", FL], carrots: ["carotte", 1.2, "kg", FL],
  potato: ["pomme de terre", 1.2, "kg", FL], potatoes: ["pomme de terre", 1.2, "kg", FL],
  courgette: ["courgette", 2.2, "kg", FL], zucchini: ["courgette", 2.2, "kg", FL],
  aubergine: ["aubergine", 3, "kg", FL], eggplant: ["aubergine", 3, "kg", FL],
  "bell pepper": ["poivron", 3.5, "kg", FL], "red pepper": ["poivron", 3.5, "kg", FL],
  "green pepper": ["poivron", 3.5, "kg", FL], pepper: ["poivron", 3.5, "kg", FL],
  mushroom: ["champignons", 4, "kg", FL], mushrooms: ["champignons", 4, "kg", FL],
  spinach: ["épinards", 4, "kg", FL], broccoli: ["brocoli", 3, "kg", FL],
  cabbage: ["chou", 1.5, "kg", FL], cauliflower: ["chou-fleur", 2.5, "kg", FL],
  leek: ["poireau", 2.5, "kg", FL], celery: ["céleri", 2.5, "kg", FL],
  cucumber: ["concombre", 2, "kg", FL], lettuce: ["salade", 4, "kg", FL],
  ginger: ["gingembre", 8, "kg", FL], "green beans": ["haricots verts", 4, "kg", FL],
  peas: ["petits pois", 2.5, "kg", SU], corn: ["maïs", 3, "kg", ES],
  avocado: ["avocat", 0.8, "u", FL], shallot: ["échalote", 4, "kg", FL],
  "sweet potato": ["patate douce", 2.5, "kg", FL], pumpkin: ["potiron", 2, "kg", FL],
  // herbes / épices
  parsley: ["persil", 20, "kg", FL], coriander: ["coriandre", 30, "kg", FL],
  cilantro: ["coriandre", 30, "kg", FL], basil: ["basilic", 30, "kg", FL],
  mint: ["menthe", 30, "kg", FL], thyme: ["thym", 0.02, "u", ES],
  rosemary: ["romarin", 0.02, "u", ES], oregano: ["origan", 0.02, "u", ES],
  cumin: ["cumin", 40, "kg", ES], paprika: ["paprika", 25, "kg", ES],
  turmeric: ["curcuma", 30, "kg", ES], curry: ["curry", 25, "kg", ES],
  "curry powder": ["curry", 25, "kg", ES], cinnamon: ["cannelle", 30, "kg", ES],
  "chilli powder": ["piment", 25, "kg", ES], "chili powder": ["piment", 25, "kg", ES],
  "chilli": ["piment", 0.03, "u", ES], "chili": ["piment", 0.03, "u", ES],
  "bay leaf": ["laurier", 0.02, "u", ES], nutmeg: ["muscade", 0.03, "u", ES],
  salt: ["sel", 0.005, "u", ES], "black pepper": ["poivre", 0.01, "u", ES],
  // viandes / poissons
  chicken: ["poulet", 8, "kg", BP], "chicken breast": ["filet de poulet", 11, "kg", BP],
  "chicken breasts": ["filet de poulet", 11, "kg", BP], "chicken thigh": ["cuisse de poulet", 6, "kg", BP],
  "chicken thighs": ["cuisse de poulet", 6, "kg", BP], beef: ["bœuf", 13, "kg", BP],
  "minced beef": ["bœuf haché", 11, "kg", BP], "ground beef": ["bœuf haché", 11, "kg", BP],
  "beef mince": ["bœuf haché", 11, "kg", BP], pork: ["porc", 9, "kg", BP],
  "pork mince": ["porc haché", 9, "kg", BP], lamb: ["agneau", 16, "kg", BP],
  "minced lamb": ["agneau haché", 14, "kg", BP], bacon: ["bacon", 12, "kg", BP],
  sausage: ["saucisse", 10, "kg", BP], sausages: ["saucisse", 10, "kg", BP],
  ham: ["jambon", 14, "kg", BP], salmon: ["saumon", 24, "kg", BP],
  "salmon fillet": ["pavé de saumon", 24, "kg", BP], tuna: ["thon", 22, "kg", BP],
  cod: ["cabillaud", 20, "kg", BP], prawns: ["crevettes", 18, "kg", BP],
  shrimp: ["crevettes", 18, "kg", BP], "white fish": ["poisson blanc", 16, "kg", BP],
  fish: ["poisson", 16, "kg", BP], mussels: ["moules", 5, "kg", BP],
  // crèmerie / œufs
  milk: ["lait", 1.1, "L", CR], butter: ["beurre", 9, "kg", CR],
  cream: ["crème fraîche", 4, "kg", CR], "double cream": ["crème fraîche", 4, "kg", CR],
  "sour cream": ["crème fraîche", 4, "kg", CR], "creme fraiche": ["crème fraîche", 4, "kg", CR],
  cheese: ["fromage râpé", 10, "kg", CR], "cheddar cheese": ["cheddar", 12, "kg", CR],
  cheddar: ["cheddar", 12, "kg", CR], parmesan: ["parmesan", 22, "kg", CR],
  mozzarella: ["mozzarella", 9, "kg", CR], feta: ["feta", 11, "kg", CR],
  "cream cheese": ["fromage frais", 8, "kg", CR], yogurt: ["yaourt", 2.5, "kg", CR],
  yoghurt: ["yaourt", 2.5, "kg", CR], egg: ["œuf", 0.3, "u", CR], eggs: ["œuf", 0.3, "u", CR],
  // épicerie
  rice: ["riz", 2, "kg", ES], "basmati rice": ["riz basmati", 3, "kg", ES],
  flour: ["farine", 1, "kg", ES], "plain flour": ["farine", 1, "kg", ES],
  pasta: ["pâtes", 2, "kg", ES], spaghetti: ["spaghetti", 2, "kg", ES],
  noodles: ["nouilles", 3, "kg", ES], "soy sauce": ["sauce soja", 6, "L", ES],
  "olive oil": ["huile d'olive", 8, "L", ES], oil: ["huile", 2, "L", ES],
  "vegetable oil": ["huile", 2, "L", ES], "sesame oil": ["huile de sésame", 15, "L", ES],
  "coconut milk": ["lait de coco", 4, "L", ES], "chopped tomatoes": ["tomates concassées", 2, "kg", ES],
  "tomato puree": ["concentré de tomate", 5, "kg", ES], "tomato paste": ["concentré de tomate", 5, "kg", ES],
  "chickpeas": ["pois chiches", 3, "kg", ES], "kidney beans": ["haricots rouges", 3, "kg", ES],
  lentils: ["lentilles", 3.5, "kg", ES], sugar: ["sucre", 1.2, "kg", EC],
  honey: ["miel", 12, "kg", EC], "stock cube": ["bouillon", 0.12, "u", ES],
  "chicken stock": ["bouillon de volaille", 0.12, "u", ES], "vegetable stock": ["bouillon de légumes", 0.12, "u", ES],
  breadcrumbs: ["chapelure", 3, "kg", ES], mustard: ["moutarde", 4, "kg", ES],
  vinegar: ["vinaigre", 2, "L", ES], "white wine": ["vin blanc", 6, "L", ES],
  "red wine": ["vin rouge", 6, "L", ES], "tomato ketchup": ["ketchup", 3, "kg", ES],
  bread: ["pain", 3, "kg", BO], tortilla: ["tortilla", 0.4, "u", BO],
  "peanut butter": ["beurre de cacahuète", 8, "kg", EC], cashews: ["noix de cajou", 20, "kg", EC],
  "peanuts": ["cacahuètes", 10, "kg", EC], sesame: ["sésame", 12, "kg", ES],
  couscous: ["semoule", 2, "kg", ES], quinoa: ["quinoa", 6, "kg", ES],
  tofu: ["tofu ferme", 8, "kg", ES], "lime": ["citron vert", 0.5, "u", FL],
  lemon: ["citron", 0.4, "u", FL],
};

// mots-clés d'inférence (sur nom FR OU EN)
const RE_VIANDE = /(poulet|bœuf|boeuf|porc|agneau|jambon|bacon|saucisse|lardons|canard|veau|merguez|chicken|beef|pork|lamb|ham|sausage|duck|meat|mince|steak|goat)/i;
const RE_POISSON = /(saumon|thon|cabillaud|colin|poisson|crevettes|moules|dorade|sardines|anchois|salmon|tuna|cod|fish|prawn|shrimp|mussel|seafood|anchov)/i;
const RE_LAIT = /(lait|beurre|crème|creme|fromage|parmesan|mozzarella|feta|cheddar|gruyère|emmental|yaourt|chèvre|milk|butter|cream|cheese|yogh?urt|parmesan)/i;
const RE_GLUTEN = /(farine|pâtes|pâte|pain|spaghetti|nouilles|chapelure|semoule|boulgour|lasagne|flour|pasta|bread|noodle|spaghetti|breadcrumb|couscous|soy sauce|sauce soja|wheat)/i;
const RE_OEUF = /(œuf|oeuf|\begg)/i;
const RE_NOIX = /(noix|noisette|cajou|amande|cacahuète|pignon|nut|cashew|almond|peanut|hazelnut)/i;

const CAT_EMOJI = {
  Beef: "🥩", Chicken: "🍗", Lamb: "🐑", Pork: "🥓", Seafood: "🐟",
  Pasta: "🍝", Vegetarian: "🥗", Vegan: "🌱", Side: "🥘", Starter: "🍽️",
  Miscellaneous: "🍲", Goat: "🍖",
};
const CAT_TEMPS = { Beef: 55, Lamb: 55, Pork: 45, Seafood: 30, Pasta: 25, Vegetarian: 30, Vegan: 30, Chicken: 40 };

const slug = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

/** Convertit une mesure TheMealDB (texte libre, impérial) → { qte, unite } en g/ml/u. */
function parseMeasure(raw) {
  if (!raw) return { qte: 1, unite: "u" };
  let s = raw.toLowerCase().trim()
    .replace(/½/g, " 1/2").replace(/¼/g, " 1/4").replace(/¾/g, " 3/4").replace(/⅓/g, " 1/3");
  // extrait un nombre (entier, décimal ou fraction "a b/c" / "b/c")
  const m = s.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/);
  let n = 1;
  if (m) {
    const t = m[1];
    if (t.includes(" ")) { const [a, f] = t.split(/\s+/); const [x, y] = f.split("/"); n = +a + +x / +y; }
    else if (t.includes("/")) { const [x, y] = t.split("/"); n = +x / +y; }
    else n = +t;
  }
  if (/\bkg\b/.test(s)) return { qte: Math.round(n * 1000), unite: "g" };
  if (/\bg\b|gram|\d\s*g\b/.test(s)) return { qte: Math.round(n), unite: "g" };
  if (/\bl\b|litre|liter/.test(s) && !/\bml\b/.test(s)) return { qte: Math.round(n * 1000), unite: "ml" };
  if (/\bml\b|\bcl\b/.test(s)) return { qte: Math.round(/\bcl\b/.test(s) ? n * 10 : n), unite: "ml" };
  if (/tbsp|tbs\b|tablespoon/.test(s)) return { qte: Math.round(n * 15), unite: "ml" };
  if (/tsp|teaspoon/.test(s)) return { qte: Math.round(n * 5), unite: "ml" };
  if (/\bcup/.test(s)) return { qte: Math.round(n * 240), unite: "ml" };
  if (/\boz\b|ounce/.test(s)) return { qte: Math.round(n * 28), unite: "g" };
  if (/\blb\b|pound/.test(s)) return { qte: Math.round(n * 454), unite: "g" };
  if (/clove/.test(s)) return { qte: Math.round(n * 5), unite: "g" };
  if (/pinch|dash/.test(s)) return { qte: 1, unite: "pincée" };
  if (/can|tin/.test(s)) return { qte: Math.round(n * 400), unite: "g" };
  // "1 large onion", "2", "sliced" → à la pièce
  return { qte: Math.max(1, Math.round(n)), unite: "u" };
}

/** Prix d'une portion pour un ingrédient (qte déjà par personne). */
function prixIngredient(dictEntry, qte, unite) {
  const [, prix, ref] = dictEntry;
  let perUnit;
  if (ref === "kg") perUnit = prix / 1000;        // €/g
  else if (ref === "L") perUnit = prix / 1000;     // €/ml
  else perUnit = prix;                             // €/pièce
  // pincée d'un ingrédient au kg → quantité négligeable
  if (unite === "pincée" && ref !== "u") return 0.01;
  return round3(qte * perUnit);
}

const RAYON_DEFAUT = ES;

/** Normalise un plat TheMealDB → Recipe (schéma app). Pure & testable. */
export function normalize(meal, servings = 4) {
  if (!meal || !meal.strMeal) return null;
  const cat = meal.strCategory || "Miscellaneous";
  if (!CATS_OK.has(cat)) return null;

  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const nomEn = (meal[`strIngredient${i}`] || "").trim();
    if (!nomEn) continue;
    const mesure = meal[`strMeasure${i}`] || "";
    const key = nomEn.toLowerCase();
    const dictEntry = ING[key] || ING[key.replace(/s$/, "")] || null;
    const nomFr = dictEntry ? dictEntry[0] : nomEn;
    const rayon = dictEntry ? dictEntry[3] : RAYON_DEFAUT;
    let { qte, unite } = parseMeasure(mesure);
    // total recette → par personne
    if (unite !== "pincée") qte = Math.max(unite === "u" ? 1 : 1, Math.round((qte / servings) * 10) / 10);
    const entry = dictEntry || [nomFr, 8, "kg", rayon]; // défaut 8€/kg si inconnu
    const prix = prixIngredient(entry, qte, unite);
    ingredients.push({ nom: nomFr, qteParPersonne: qte, unite, rayon, prixParPersonne: prix });
  }
  if (ingredients.length === 0) return null;

  const blob = ingredients.map((x) => x.nom).join(" ") + " " + (meal.strMeal || "");
  const viande = RE_VIANDE.test(blob), poisson = RE_POISSON.test(blob);
  const lait = RE_LAIT.test(blob), gluten = RE_GLUTEN.test(blob);
  const oeuf = RE_OEUF.test(blob), noix = RE_NOIX.test(blob);

  const regimes = [];
  if (!viande && !poisson) regimes.push("vegetarien");
  else if (!viande && poisson) regimes.push("pescetarien");
  if (!gluten) regimes.push("sans-gluten");
  if (!lait) regimes.push("sans-lactose");

  const allergenes = [];
  if (gluten) allergenes.push("gluten");
  if (lait) allergenes.push("lait");
  if (oeuf) allergenes.push("œuf");
  if (poisson) allergenes.push("poisson");
  if (noix) allergenes.push("fruits à coque");

  const tags = ["du monde"];
  if (viande || poisson || oeuf) tags.push("protéiné");
  else tags.push("healthy");

  const prixParPersonne = round2(ingredients.reduce((s, x) => s + x.prixParPersonne, 0));
  const etapes = (meal.strInstructions || "")
    .split(/\r?\n+/).map((l) => l.trim()).filter((l) => l.length > 3).slice(0, 8);

  return {
    id: `world-${slug(meal.strMeal)}`,
    nom: meal.strMeal,
    tempsMin: CAT_TEMPS[cat] || 35,
    tags: tags.slice(0, 3),
    regimes,
    allergenes,
    equipement: ["four", "plaque"],
    prixParPersonne,
    kcal: 600,
    macros: { proteines: viande || poisson ? 35 : 20, glucides: 55, lipides: 25 },
    emoji: CAT_EMOJI[cat] || "🌍",
    ingredients,
    etapes: etapes.length ? etapes : ["Voir les instructions détaillées sur TheMealDB."],
    origine: "monde",
    prixEstime: true,
    source: meal.strSource || "TheMealDB",
  };
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "miam-meal-planner" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function fetchAll() {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const seen = new Map();
  for (const l of letters) {
    try {
      const data = await getJson(`${API}/search.php?f=${l}`);
      for (const meal of data.meals || []) if (!seen.has(meal.idMeal)) seen.set(meal.idMeal, meal);
    } catch (e) {
      console.warn(`  ⚠️  lettre ${l}: ${e.message}`);
    }
  }
  return [...seen.values()];
}

async function main() {
  const selftest = process.argv.includes("--selftest");
  if (selftest) return runSelfTest();

  let out = [];
  try {
    console.log("→ Récupération du catalogue TheMealDB…");
    const meals = await fetchAll();
    console.log(`  ${meals.length} plats bruts récupérés.`);
    const seenId = new Set();
    for (const meal of meals) {
      try {
        const rec = normalize(meal);
        if (rec && !seenId.has(rec.id)) { seenId.add(rec.id); out.push(rec); }
      } catch { /* plat ignoré */ }
    }
    console.log(`  ✅ ${out.length} recettes du monde normalisées.`);
  } catch (e) {
    console.warn(`  ⚠️  Échec import (build continue avec les recettes FR): ${e.message}`);
    out = [];
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`→ Écrit ${OUT} (${out.length} recettes).`);
}

// ── auto-test hors-ligne ────────────────────────────────────────────────────
function runSelfTest() {
  const sample = {
    idMeal: "52940",
    strMeal: "Brown Stew Chicken",
    strCategory: "Chicken",
    strArea: "Jamaican",
    strInstructions: "Squeeze lime over chicken.\nCombine spices.\nHeat oil and brown chicken.\nAdd water and simmer 45 minutes.",
    strIngredient1: "Chicken", strMeasure1: "1 whole",
    strIngredient2: "Tomato", strMeasure2: "1 chopped",
    strIngredient3: "Onion", strMeasure3: "2 chopped",
    strIngredient4: "Garlic Clove", strMeasure4: "2 cloves",
    strIngredient5: "Soy Sauce", strMeasure5: "2 tbs",
    strIngredient6: "Vegetable Oil", strMeasure6: "2 tbs",
    strIngredient7: "Lime", strMeasure7: "1",
    strIngredient8: "", strMeasure8: "",
    strSource: "https://www.themealdb.com",
  };
  const rec = normalize(sample);
  const checks = [];
  const ok = (name, cond) => checks.push([name, !!cond]);
  ok("id préfixé world-", rec.id.startsWith("world-"));
  ok("origine monde", rec.origine === "monde");
  ok("prixEstime true", rec.prixEstime === true);
  ok("a des ingrédients", rec.ingredients.length === 7);
  ok("ail traduit", rec.ingredients.some((i) => i.nom === "ail"));
  ok("oignon traduit", rec.ingredients.some((i) => i.nom === "oignon"));
  ok("sauce soja → gluten", rec.allergenes.includes("gluten"));
  ok("poulet → non végé", !rec.regimes.includes("vegetarien"));
  ok("poulet → protéiné", rec.tags.includes("protéiné"));
  ok("prix > 0 et < 15", rec.prixParPersonne > 0 && rec.prixParPersonne < 15);
  ok("étapes extraites", rec.etapes.length === 4);
  ok("tag du monde", rec.tags.includes("du monde"));

  // parseMeasure unitaire
  const pm = (s) => JSON.stringify(parseMeasure(s));
  ok('parse "200g"', pm("200g") === JSON.stringify({ qte: 200, unite: "g" }));
  ok('parse "1 kg"', pm("1 kg") === JSON.stringify({ qte: 1000, unite: "g" }));
  ok('parse "2 tbs"', pm("2 tbs") === JSON.stringify({ qte: 30, unite: "ml" }));
  ok('parse "1/2 cup"', pm("1/2 cup") === JSON.stringify({ qte: 120, unite: "ml" }));
  ok('parse "2 cloves"', pm("2 cloves") === JSON.stringify({ qte: 10, unite: "g" }));
  ok('parse "1 pinch"', pm("1 pinch") === JSON.stringify({ qte: 1, unite: "pincée" }));

  let fail = 0;
  for (const [name, pass] of checks) { console.log(`  ${pass ? "✓" : "✗"} ${name}`); if (!pass) fail++; }
  console.log(`\n${checks.length - fail}/${checks.length} OK`);
  console.log("\nExemple normalisé :");
  console.log(JSON.stringify(rec, null, 2).split("\n").slice(0, 30).join("\n"));
  if (fail) process.exit(1);
}

// N'exécute main() qu'en lancement direct (pas quand normalize est importé ailleurs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
