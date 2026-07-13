#!/usr/bin/env node
/**
 * price-fr.mjs — recalcule les prix RÉELS de chaque ingrédient et de chaque
 * recette à partir d'une table de prix supermarché France (mid-market, coef 1.0).
 *
 * - `ref` = unité de référence du prix : "kg" (€/kg), "L" (€/L) ou "u" (€/pièce).
 * - Les recettes stockent des quantités en g / ml / u / pincée / cube / tranches ;
 *   on convertit `prix(ref)` → prix de l'unité utilisée dans la recette.
 * - Un ingrédient sans prix fait échouer le script (couverture 100% obligatoire).
 *
 * Sortie :
 *   data/recipes.json   (prixParPersonne recalculés)
 *   data/prices.fr.json (table + métadonnées : devise, mise à jour, source)
 *
 * Prix : ordres de grandeur relevés en supermarché français (Carrefour/Leclerc),
 * révisables à la main. Date de référence dans META.maj.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RECIPES_PATH = join(ROOT, "data", "recipes.json");
const PRICES_PATH = join(ROOT, "data", "prices.fr.json");

const META = {
  devise: "EUR",
  maj: "2026-07",
  base: "Carrefour/Leclerc (coef 1.0)",
  note:
    "Prix moyens supermarché France, relevés à la main et révisables. " +
    "Le coût affiché reste une estimation : × coefficient enseigne.",
};

// prix = valeur pour l'unité de référence `ref`.
//   ref "kg" → €/kg  (ingrédient en g)
//   ref "L"  → €/L   (ingrédient en ml)
//   ref "u"  → €/pièce (u / tranches / cube / pincée)
const PRICES = {
  // ── Boucherie / Poisson (€/kg) ──────────────────────────────────────────
  "agneau haché": { prix: 14, ref: "kg" },
  bacon: { prix: 12, ref: "kg" },
  "bœuf à mijoter": { prix: 13, ref: "kg" },
  "bœuf à pot-au-feu": { prix: 12, ref: "kg" },
  "bœuf émincé": { prix: 15, ref: "kg" },
  "bœuf haché": { prix: 11, ref: "kg" },
  "confit de canard effiloché": { prix: 22, ref: "kg" },
  "côte de porc": { prix: 9, ref: "kg" },
  crevettes: { prix: 18, ref: "kg" },
  "cuisse de poulet": { prix: 6, ref: "kg" },
  dorade: { prix: 14, ref: "kg" },
  "dos de cabillaud": { prix: 20, ref: "kg" },
  "émincé de poulet": { prix: 11, ref: "kg" },
  "escalope de poulet": { prix: 12, ref: "kg" },
  "filet de colin": { prix: 15, ref: "kg" },
  "filet de poisson blanc": { prix: 16, ref: "kg" },
  "filet de poulet": { prix: 11, ref: "kg" },
  jambon: { prix: 14, ref: "kg" },
  lardons: { prix: 9, ref: "kg" },
  "lardons fumés": { prix: 10, ref: "kg" },
  merguez: { prix: 10, ref: "kg", poids: 60 },
  moules: { prix: 5, ref: "kg" },
  "pavé de saumon": { prix: 24, ref: "kg" },
  sardines: { prix: 8, ref: "kg" },
  "saumon fumé": { prix: 35, ref: "kg" },
  "sauté de porc": { prix: 9, ref: "kg" },
  "sauté de veau": { prix: 18, ref: "kg" },
  "saucisse de toulouse": { prix: 10, ref: "kg" },
  "steak de thon": { prix: 22, ref: "kg" },

  // ── Fruits & Légumes ────────────────────────────────────────────────────
  ail: { prix: 8, ref: "kg" },
  aneth: { prix: 30, ref: "kg" },
  aubergine: { prix: 3, ref: "kg", poids: 250 },
  avocat: { prix: 0.8, ref: "u" },
  basilic: { prix: 30, ref: "kg" },
  brocoli: { prix: 3, ref: "kg" },
  carotte: { prix: 1.2, ref: "kg" },
  céleri: { prix: 2.5, ref: "kg" },
  champignons: { prix: 4, ref: "kg" },
  "champignons de paris": { prix: 4, ref: "kg" },
  chou: { prix: 1.5, ref: "kg" },
  "chou chinois": { prix: 2.5, ref: "kg" },
  "chou rouge": { prix: 2, ref: "kg" },
  "chou-fleur": { prix: 2.5, ref: "kg" },
  citron: { prix: 0.4, ref: "u" },
  "citron vert": { prix: 0.5, ref: "u" },
  citronnelle: { prix: 25, ref: "kg" },
  concombre: { prix: 2, ref: "kg" },
  coriandre: { prix: 30, ref: "kg" },
  "courge butternut": { prix: 2, ref: "kg" },
  courgette: { prix: 2.2, ref: "kg" },
  échalote: { prix: 4, ref: "kg" },
  endives: { prix: 0.5, ref: "u" },
  épinards: { prix: 4, ref: "kg" },
  "épinards frais": { prix: 6, ref: "kg" },
  gingembre: { prix: 8, ref: "kg" },
  menthe: { prix: 30, ref: "kg" },
  navet: { prix: 1.8, ref: "kg" },
  oignon: { prix: 1.2, ref: "kg" },
  "oignon nouveau": { prix: 6, ref: "kg" },
  "oignon rouge": { prix: 2, ref: "kg" },
  "pak choï": { prix: 5, ref: "kg" },
  persil: { prix: 20, ref: "kg" },
  poireau: { prix: 2.5, ref: "kg" },
  poivron: { prix: 3.5, ref: "kg", poids: 150 },
  "pomme de terre": { prix: 1.2, ref: "kg" },
  "pommes de terre": { prix: 1.2, ref: "kg" },
  potiron: { prix: 2, ref: "kg" },
  roquette: { prix: 12, ref: "kg" },
  salade: { prix: 4, ref: "kg" },
  "salade romaine": { prix: 4, ref: "kg" },
  tomate: { prix: 2.5, ref: "kg" },
  "tomates cerises": { prix: 6, ref: "kg" },

  // ── Crèmerie ────────────────────────────────────────────────────────────
  béchamel: { prix: 3, ref: "kg" },
  beurre: { prix: 9, ref: "kg" },
  "bûche de chèvre": { prix: 12, ref: "kg" },
  cheddar: { prix: 12, ref: "kg" },
  "chèvre frais": { prix: 12, ref: "kg" },
  "crème fraîche": { prix: 4, ref: "kg" },
  emmental: { prix: 10, ref: "kg" },
  feta: { prix: 11, ref: "kg" },
  "fromage râpé": { prix: 10, ref: "kg" },
  gorgonzola: { prix: 16, ref: "kg" },
  gruyère: { prix: 14, ref: "kg" },
  "gruyère râpé": { prix: 13, ref: "kg" },
  halloumi: { prix: 16, ref: "kg" },
  lait: { prix: 1.1, ref: "L" },
  mozzarella: { prix: 9, ref: "kg" },
  œuf: { prix: 0.3, ref: "u" },
  parmesan: { prix: 22, ref: "kg" },
  "parmesan râpé": { prix: 25, ref: "kg" },
  ravioles: { prix: 12, ref: "kg" },
  "sauce blanche": { prix: 4, ref: "kg" },
  yaourt: { prix: 2.5, ref: "kg" },

  // ── Épicerie salée ──────────────────────────────────────────────────────
  anchois: { prix: 30, ref: "kg" },
  bouillon: { prix: 0.12, ref: "u" },
  "bouillon de légumes": { prix: 0.12, ref: "u" },
  "bouillon de volaille": { prix: 0.12, ref: "u" },
  boulgour: { prix: 3, ref: "kg" },
  câpres: { prix: 12, ref: "kg" },
  chapelure: { prix: 3, ref: "kg" },
  coquillettes: { prix: 2, ref: "kg" },
  cumin: { prix: 40, ref: "kg" },
  curry: { prix: 25, ref: "kg" },
  "épices ras el hanout": { prix: 40, ref: "kg" },
  farine: { prix: 1, ref: "kg" },
  "feuilles de lasagne": { prix: 3, ref: "kg" },
  gnocchi: { prix: 3.5, ref: "kg" },
  "haricots noirs": { prix: 3, ref: "kg" },
  "haricots rouges": { prix: 3, ref: "kg" },
  "herbes de provence": { prix: 0.02, ref: "u" },
  houmous: { prix: 8, ref: "kg" },
  huile: { prix: 2, ref: "L" },
  "huile d'olive": { prix: 8, ref: "L" },
  "huile de sésame": { prix: 15, ref: "L" },
  ketchup: { prix: 3, ref: "kg" },
  kimchi: { prix: 12, ref: "kg" },
  "lait de coco": { prix: 4, ref: "L" },
  "lentilles corail": { prix: 4, ref: "kg" },
  "lentilles vertes": { prix: 3.5, ref: "kg" },
  levure: { prix: 15, ref: "kg" },
  macaroni: { prix: 2, ref: "kg" },
  maïs: { prix: 3, ref: "kg" },
  maïzena: { prix: 3, ref: "kg" },
  moutarde: { prix: 4, ref: "kg" },
  muscade: { prix: 0.03, ref: "u" },
  nouilles: { prix: 3, ref: "kg" },
  "nouilles chinoises": { prix: 4, ref: "kg" },
  "nouilles de riz": { prix: 4, ref: "kg" },
  "nouilles soba": { prix: 6, ref: "kg" },
  "olives noires": { prix: 8, ref: "kg" },
  orecchiette: { prix: 3, ref: "kg" },
  paprika: { prix: 25, ref: "kg" },
  penne: { prix: 2, ref: "kg" },
  piment: { prix: 0.02, ref: "u" },
  "piment d'espelette": { prix: 0.05, ref: "u" },
  "piment séché": { prix: 0.03, ref: "u" },
  "pois chiches": { prix: 3, ref: "kg" },
  polenta: { prix: 3, ref: "kg" },
  quinoa: { prix: 6, ref: "kg" },
  rigatoni: { prix: 2, ref: "kg" },
  riz: { prix: 2, ref: "kg" },
  "riz arborio": { prix: 4, ref: "kg" },
  "riz basmati": { prix: 3, ref: "kg" },
  "sauce césar": { prix: 5, ref: "kg" },
  "sauce soja": { prix: 6, ref: "L" },
  "sauce tomate": { prix: 2.5, ref: "kg" },
  sel: { prix: 0.005, ref: "u" },
  semoule: { prix: 2, ref: "kg" },
  sésame: { prix: 12, ref: "kg" },
  spaghetti: { prix: 2, ref: "kg" },
  tagliatelles: { prix: 3, ref: "kg" },
  tahini: { prix: 12, ref: "kg" },
  "thon en boîte": { prix: 12, ref: "kg" },
  thym: { prix: 0.02, ref: "u" },
  "tofu ferme": { prix: 8, ref: "kg" },
  "tomates concassées": { prix: 2, ref: "kg" },
  vermicelles: { prix: 3, ref: "kg" },
  "vin blanc": { prix: 6, ref: "L" },
  "vin rouge": { prix: 6, ref: "L" },
  vinaigrette: { prix: 4, ref: "L" },

  // ── Épicerie sucrée ─────────────────────────────────────────────────────
  "beurre de cacahuète": { prix: 8, ref: "kg" },
  cacahuètes: { prix: 10, ref: "kg" },
  "graines de courge": { prix: 12, ref: "kg" },
  miel: { prix: 12, ref: "kg" },
  noisettes: { prix: 20, ref: "kg" },
  noix: { prix: 14, ref: "kg" },
  "noix de cajou": { prix: 20, ref: "kg" },
  pignons: { prix: 60, ref: "kg" },
  "pignons de pin": { prix: 60, ref: "kg" },
  "sirop d'érable": { prix: 18, ref: "L" },
  sucre: { prix: 1.2, ref: "kg" },

  // ── Surgelés ────────────────────────────────────────────────────────────
  "cordon bleu": { prix: 0.9, ref: "u" },
  falafels: { prix: 0.4, ref: "u" },
  frites: { prix: 2, ref: "kg" },
  "petits pois": { prix: 2.5, ref: "kg" },

  // ── Boulangerie ─────────────────────────────────────────────────────────
  croûtons: { prix: 6, ref: "kg" },
  "galette de sarrasin": { prix: 0.6, ref: "u" },
  pain: { prix: 3, ref: "kg" },
  "pain burger": { prix: 0.5, ref: "u" },
  "pain de mie": { prix: 0.08, ref: "u" }, // par tranche
  "pain pita": { prix: 0.6, ref: "u" },
  "pâte à pizza": { prix: 4, ref: "kg" },
  "pâte brisée": { prix: 4, ref: "kg" },
  "pâte feuilletée": { prix: 5, ref: "kg" },
  tortilla: { prix: 0.4, ref: "u" },
  tortillas: { prix: 0.4, ref: "u" },
};

// ── Conditionnement : ce qu'on ACHÈTE vraiment en magasin ────────────────────
// [pas, prix, label] — pas = contenu d'1 unité vendue (dans l'unité de la recette :
// g pour la plupart), prix = € de cette unité vendue, label = mot affiché.
// La liste de courses arrondit au nombre d'unités vendues (on n'achète pas 60 g
// de concombre → 1 concombre entier). Absent = vendu en vrac / placard → prorata.
const COND = {
  // légumes à la pièce
  concombre: [400, 0.9, "pièce"],
  poivron: [150, 0.75, "pièce"],
  courgette: [200, 0.6, "pièce"],
  aubergine: [250, 0.85, "pièce"],
  "courge butternut": [900, 2.2, "pièce"],
  potiron: [1000, 2.5, "part"],
  brocoli: [500, 1.6, "pièce"],
  "chou-fleur": [700, 1.9, "pièce"],
  chou: [800, 1.6, "pièce"],
  "chou rouge": [800, 2, "pièce"],
  "chou chinois": [600, 1.8, "pièce"],
  salade: [200, 0.95, "pièce"],
  "salade romaine": [300, 1.2, "pièce"],
  navet: [150, 0.4, "pièce"],
  poireau: [150, 0.6, "pièce"],
  céleri: [400, 1.3, "pièce"],
  "pak choï": [200, 1.2, "pièce"],
  // sachets / barquettes
  roquette: [100, 1.4, "sachet"],
  épinards: [150, 1.5, "sachet"],
  "épinards frais": [150, 1.5, "sachet"],
  champignons: [250, 1.4, "barquette"],
  "champignons de paris": [250, 1.4, "barquette"],
  "tomates cerises": [250, 1.6, "barquette"],
  "graines de courge": [100, 1.8, "sachet"],
  // herbes fraîches (botte / pot)
  persil: [30, 0.8, "botte"],
  coriandre: [30, 0.9, "botte"],
  basilic: [25, 1.2, "pot"],
  menthe: [25, 0.9, "botte"],
  aneth: [20, 0.9, "botte"],
  citronnelle: [20, 1.2, "sachet"],
  "oignon nouveau": [100, 0.8, "botte"],
  gingembre: [80, 0.6, "morceau"],
};

/** Convertit le prix de référence vers le prix de l'unité utilisée en recette. */
function prixUnite(entry, unite) {
  const { prix, ref, poids } = entry;
  if (ref === "kg") {
    if (unite === "g") return prix / 1000;
    // ingrédient compté à la pièce (ex. poivron) → poids moyen d'une pièce
    if (unite === "u" && poids) return (prix / 1000) * poids;
    throw new Error(`ref kg incompatible avec unité "${unite}"`);
  }
  if (ref === "L") {
    if (unite === "ml") return prix / 1000;
    throw new Error(`ref L incompatible avec unité "${unite}"`);
  }
  // ref "u" : u, tranches, cube, pincée → 1 pièce
  if (["u", "tranches", "cube", "pincée"].includes(unite)) return prix;
  throw new Error(`ref u incompatible avec unité "${unite}"`);
}

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

function main() {
  const recipes = JSON.parse(readFileSync(RECIPES_PATH, "utf8"));
  const manquants = new Set();

  for (const rec of recipes) {
    let total = 0;
    for (const ing of rec.ingredients) {
      const key = ing.nom.toLowerCase().trim();
      const entry = PRICES[key];
      if (!entry) {
        manquants.add(`${key} [${ing.unite}]`);
        continue;
      }
      const pu = prixUnite(entry, ing.unite);
      ing.prixParPersonne = round3(ing.qteParPersonne * pu);
      total += ing.prixParPersonne;
    }
    rec.prixParPersonne = round2(total);
  }

  if (manquants.size) {
    console.error(`\n❌ ${manquants.size} ingrédient(s) sans prix :`);
    console.error([...manquants].sort().join("\n"));
    process.exit(1);
  }

  // Fusionne le conditionnement dans la table de prix exportée.
  const prixOut = {};
  for (const [key, entry] of Object.entries(PRICES)) {
    prixOut[key] = COND[key] ? { ...entry, cond: COND[key] } : { ...entry };
  }

  writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2) + "\n");
  writeFileSync(
    PRICES_PATH,
    JSON.stringify({ meta: META, prix: prixOut }, null, 2) + "\n"
  );

  // Récap
  const prixs = recipes.map((r) => r.prixParPersonne).sort((a, b) => a - b);
  const moy = prixs.reduce((s, p) => s + p, 0) / prixs.length;
  console.log(`✅ ${recipes.length} recettes reprixées depuis ${Object.keys(PRICES).length} ingrédients.`);
  console.log(`   €/personne : min ${prixs[0]}  méd ${prixs[Math.floor(prixs.length / 2)]}  moy ${round2(moy)}  max ${prixs[prixs.length - 1]}`);
}

main();
