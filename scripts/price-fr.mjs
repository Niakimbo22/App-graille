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
 * ── Relevé 08/2026 ──────────────────────────────────────────────────────────
 * Révision à la hausse : les prix de la version précédente dataient d'une base
 * pré-2024 et sous-estimaient nettement le ticket de caisse. Points d'ancrage :
 *   • Observatoire Familles Rurales (juin 2026, 118 relevés / 40 départements) :
 *     légumes +10% sur un an, courgette +32%, tomate +31%, haricots verts +24%,
 *     oignon −23%, pomme de terre −13% (1,23 €/kg, produit le moins cher).
 *   • INSEE / FranceAgriMer : alimentaire ≈ +22 à +25% depuis janvier 2021.
 *   • Relevés enseignes 2026 : steak haché 15% MG 14,50 €/kg, filet de saumon
 *     ~22 €/kg en gros (≈28 €/kg en rayon), lait UHT 1,19 €/L, emmental râpé
 *     ~8 €/kg en gros (≈11,50 €/kg en rayon), herbes fraîches en pot 1,49 €.
 * Les prix restent des moyennes : l'app affiche une fourchette, pas un montant
 * ferme (voir lib/fourchette.ts).
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
  maj: "2026-08",
  base: "Carrefour/Leclerc (coef 1.0)",
  note:
    "Prix moyens supermarché France, relevés à la main et révisables. " +
    "Le coût affiché reste une estimation : × coefficient enseigne, " +
    "et la facture réelle dépend des promos, des marques et de la région.",
};

// prix = valeur pour l'unité de référence `ref`.
//   ref "kg" → €/kg  (ingrédient en g)
//   ref "L"  → €/L   (ingrédient en ml)
//   ref "u"  → €/pièce (u / tranches / cube / pincée)
const PRICES = {
  // ── Boucherie / Poisson (€/kg) ──────────────────────────────────────────
  // Vendus en barquettes à poids variable : on peut choisir la barquette au
  // plus près du besoin, donc pas de conditionnement imposé (prorata correct).
  "agneau haché": { prix: 19, ref: "kg" },
  bacon: { prix: 15, ref: "kg" },
  "bœuf à mijoter": { prix: 17, ref: "kg" },
  "bœuf à pot-au-feu": { prix: 15.5, ref: "kg" },
  "bœuf émincé": { prix: 19, ref: "kg" },
  "bœuf haché": { prix: 14.5, ref: "kg" },
  "confit de canard effiloché": { prix: 25, ref: "kg" },
  "côte de porc": { prix: 10.5, ref: "kg" },
  crevettes: { prix: 21, ref: "kg" },
  "cuisse de poulet": { prix: 7.5, ref: "kg" },
  dorade: { prix: 17, ref: "kg" },
  "dos de cabillaud": { prix: 26, ref: "kg" },
  "émincé de poulet": { prix: 14, ref: "kg" },
  "escalope de poulet": { prix: 14.5, ref: "kg" },
  "filet de colin": { prix: 17, ref: "kg" },
  "filet de poisson blanc": { prix: 18, ref: "kg" },
  "filet de poulet": { prix: 14, ref: "kg" },
  jambon: { prix: 16, ref: "kg" },
  lardons: { prix: 11, ref: "kg" },
  "lardons fumés": { prix: 11.5, ref: "kg" },
  merguez: { prix: 12, ref: "kg", poids: 60 },
  moules: { prix: 6, ref: "kg" },
  "pavé de saumon": { prix: 28, ref: "kg" },
  sardines: { prix: 10, ref: "kg" },
  "saumon fumé": { prix: 40, ref: "kg" },
  "sauté de porc": { prix: 11, ref: "kg" },
  "sauté de veau": { prix: 23, ref: "kg" },
  "saucisse de toulouse": { prix: 12, ref: "kg" },
  "steak de thon": { prix: 26, ref: "kg" },

  // ── Fruits & Légumes ────────────────────────────────────────────────────
  ail: { prix: 10, ref: "kg" },
  aneth: { prix: 45, ref: "kg" },
  aubergine: { prix: 3.6, ref: "kg", poids: 250 },
  avocat: { prix: 1.2, ref: "u" },
  basilic: { prix: 55, ref: "kg" },
  brocoli: { prix: 3.5, ref: "kg" },
  carotte: { prix: 1.6, ref: "kg" },
  céleri: { prix: 3, ref: "kg" },
  champignons: { prix: 5.5, ref: "kg" },
  "champignons de paris": { prix: 5.5, ref: "kg" },
  chou: { prix: 2, ref: "kg" },
  "chou chinois": { prix: 3.2, ref: "kg" },
  "chou rouge": { prix: 2.6, ref: "kg" },
  "chou-fleur": { prix: 3.2, ref: "kg" },
  citron: { prix: 0.55, ref: "u" },
  "citron vert": { prix: 0.65, ref: "u" },
  citronnelle: { prix: 40, ref: "kg" },
  concombre: { prix: 2.4, ref: "kg" },
  coriandre: { prix: 45, ref: "kg" },
  "courge butternut": { prix: 2.6, ref: "kg" },
  courgette: { prix: 2.9, ref: "kg" },
  échalote: { prix: 4.5, ref: "kg" },
  endives: { prix: 0.65, ref: "u" },
  épinards: { prix: 5.5, ref: "kg" },
  "épinards frais": { prix: 8, ref: "kg" },
  gingembre: { prix: 10, ref: "kg" },
  menthe: { prix: 45, ref: "kg" },
  navet: { prix: 2.2, ref: "kg" },
  oignon: { prix: 1.6, ref: "kg" },
  "oignon nouveau": { prix: 8, ref: "kg" },
  "oignon rouge": { prix: 2.6, ref: "kg" },
  "pak choï": { prix: 6, ref: "kg" },
  persil: { prix: 40, ref: "kg" },
  poireau: { prix: 3, ref: "kg" },
  poivron: { prix: 4.5, ref: "kg", poids: 150 },
  "pomme de terre": { prix: 1.4, ref: "kg" },
  "pommes de terre": { prix: 1.4, ref: "kg" },
  potiron: { prix: 2.5, ref: "kg" },
  roquette: { prix: 16, ref: "kg" },
  salade: { prix: 5, ref: "kg" },
  "salade romaine": { prix: 5, ref: "kg" },
  tomate: { prix: 3.3, ref: "kg" },
  "tomates cerises": { prix: 7.5, ref: "kg" },

  // ── Crèmerie ────────────────────────────────────────────────────────────
  béchamel: { prix: 3.8, ref: "kg" },
  beurre: { prix: 13, ref: "kg" },
  "bûche de chèvre": { prix: 14, ref: "kg" },
  cheddar: { prix: 13.5, ref: "kg" },
  "chèvre frais": { prix: 14, ref: "kg" },
  "crème fraîche": { prix: 5, ref: "kg" },
  emmental: { prix: 12.5, ref: "kg" },
  feta: { prix: 13, ref: "kg" },
  "fromage râpé": { prix: 11.5, ref: "kg" },
  gorgonzola: { prix: 18, ref: "kg" },
  gruyère: { prix: 15, ref: "kg" },
  "gruyère râpé": { prix: 14, ref: "kg" },
  halloumi: { prix: 19, ref: "kg" },
  lait: { prix: 1.25, ref: "L" },
  mozzarella: { prix: 11, ref: "kg" },
  œuf: { prix: 0.42, ref: "u" },
  parmesan: { prix: 29, ref: "kg" },
  "parmesan râpé": { prix: 32, ref: "kg" },
  ravioles: { prix: 14, ref: "kg" },
  "sauce blanche": { prix: 5, ref: "kg" },
  yaourt: { prix: 3.2, ref: "kg" },

  // ── Épicerie salée ──────────────────────────────────────────────────────
  anchois: { prix: 36, ref: "kg" },
  bouillon: { prix: 0.15, ref: "u" },
  "bouillon de légumes": { prix: 0.15, ref: "u" },
  "bouillon de volaille": { prix: 0.15, ref: "u" },
  boulgour: { prix: 3.5, ref: "kg" },
  câpres: { prix: 15, ref: "kg" },
  chapelure: { prix: 3.5, ref: "kg" },
  coquillettes: { prix: 2.4, ref: "kg" },
  cumin: { prix: 45, ref: "kg" },
  curry: { prix: 35, ref: "kg" },
  "épices ras el hanout": { prix: 45, ref: "kg" },
  farine: { prix: 1.3, ref: "kg" },
  "feuilles de lasagne": { prix: 3.6, ref: "kg" },
  gnocchi: { prix: 4.2, ref: "kg" },
  "haricots noirs": { prix: 4.9, ref: "kg" },
  "haricots rouges": { prix: 4.9, ref: "kg" },
  "herbes de provence": { prix: 0.03, ref: "u" },
  houmous: { prix: 10, ref: "kg" },
  huile: { prix: 2.6, ref: "L" },
  "huile d'olive": { prix: 11, ref: "L" },
  "huile de sésame": { prix: 18, ref: "L" },
  ketchup: { prix: 3.8, ref: "kg" },
  kimchi: { prix: 14, ref: "kg" },
  "lait de coco": { prix: 4.5, ref: "L" },
  "lentilles corail": { prix: 4.5, ref: "kg" },
  "lentilles vertes": { prix: 4, ref: "kg" },
  levure: { prix: 18, ref: "kg" },
  macaroni: { prix: 2.4, ref: "kg" },
  maïs: { prix: 3.7, ref: "kg" },
  maïzena: { prix: 3.6, ref: "kg" },
  moutarde: { prix: 6, ref: "kg" },
  muscade: { prix: 0.04, ref: "u" },
  nouilles: { prix: 3.6, ref: "kg" },
  "nouilles chinoises": { prix: 4.8, ref: "kg" },
  "nouilles de riz": { prix: 5, ref: "kg" },
  "nouilles soba": { prix: 7.5, ref: "kg" },
  "olives noires": { prix: 10, ref: "kg" },
  orecchiette: { prix: 3.6, ref: "kg" },
  paprika: { prix: 30, ref: "kg" },
  penne: { prix: 2.4, ref: "kg" },
  piment: { prix: 0.03, ref: "u" },
  "piment d'espelette": { prix: 0.08, ref: "u" },
  "piment séché": { prix: 0.04, ref: "u" },
  "pois chiches": { prix: 4.5, ref: "kg" },
  polenta: { prix: 3.5, ref: "kg" },
  quinoa: { prix: 7, ref: "kg" },
  rigatoni: { prix: 2.4, ref: "kg" },
  riz: { prix: 2.5, ref: "kg" },
  "riz arborio": { prix: 4.8, ref: "kg" },
  "riz basmati": { prix: 3.8, ref: "kg" },
  "sauce césar": { prix: 6.5, ref: "kg" },
  "sauce soja": { prix: 8, ref: "L" },
  "sauce tomate": { prix: 3.2, ref: "kg" },
  sel: { prix: 0.01, ref: "u" },
  semoule: { prix: 2.4, ref: "kg" },
  sésame: { prix: 15, ref: "kg" },
  spaghetti: { prix: 2.4, ref: "kg" },
  tagliatelles: { prix: 3.6, ref: "kg" },
  tahini: { prix: 15, ref: "kg" },
  "thon en boîte": { prix: 15, ref: "kg" },
  thym: { prix: 0.04, ref: "u" },
  "tofu ferme": { prix: 10, ref: "kg" },
  "tomates concassées": { prix: 2.6, ref: "kg" },
  vermicelles: { prix: 3.6, ref: "kg" },
  "vin blanc": { prix: 7, ref: "L" },
  "vin rouge": { prix: 7, ref: "L" },
  vinaigrette: { prix: 5, ref: "L" },

  // ── Épicerie sucrée ─────────────────────────────────────────────────────
  "beurre de cacahuète": { prix: 10, ref: "kg" },
  cacahuètes: { prix: 12, ref: "kg" },
  "graines de courge": { prix: 15, ref: "kg" },
  miel: { prix: 15, ref: "kg" },
  noisettes: { prix: 24, ref: "kg" },
  noix: { prix: 17, ref: "kg" },
  "noix de cajou": { prix: 24, ref: "kg" },
  pignons: { prix: 75, ref: "kg" },
  "pignons de pin": { prix: 75, ref: "kg" },
  "sirop d'érable": { prix: 22, ref: "L" },
  sucre: { prix: 1.5, ref: "kg" },

  // ── Surgelés ────────────────────────────────────────────────────────────
  "cordon bleu": { prix: 1.15, ref: "u" },
  falafels: { prix: 0.35, ref: "u" },
  frites: { prix: 2.5, ref: "kg" },
  "petits pois": { prix: 3, ref: "kg" },

  // ── Boulangerie ─────────────────────────────────────────────────────────
  croûtons: { prix: 7.5, ref: "kg" },
  "galette de sarrasin": { prix: 0.75, ref: "u" },
  pain: { prix: 3.8, ref: "kg" },
  "pain burger": { prix: 0.65, ref: "u" },
  "pain de mie": { prix: 0.1, ref: "u" }, // par tranche
  "pain pita": { prix: 0.75, ref: "u" },
  "pâte à pizza": { prix: 5, ref: "kg" },
  "pâte brisée": { prix: 5, ref: "kg" },
  "pâte feuilletée": { prix: 6, ref: "kg" },
  tortilla: { prix: 0.5, ref: "u" },
  tortillas: { prix: 0.5, ref: "u" },
};

// ── Conditionnement : ce qu'on ACHÈTE vraiment en magasin ────────────────────
// [pas, prix, label] — pas = contenu d'1 unité vendue, EXPRIMÉ DANS L'UNITÉ DE
// LA RECETTE (g, ml, pièces, pincées, cubes…) ; prix = € de cette unité vendue ;
// label = mot affiché dans la liste de courses.
//
// La liste de courses arrondit au nombre d'unités vendues : on n'achète pas 5 g
// de persil ni 1 pincée de thym, mais 1 botte et 1 pot. C'est LA raison pour
// laquelle un panier réel coûte plus cher que la somme des grammages utilisés.
//
// Sans entrée ici → prorata du grammage. Réservé à ce qui se vend vraiment au
// poids choisi : viande et poisson en barquette à poids variable, fromage à la
// coupe, légumes en vrac (oignon, carotte, pomme de terre, tomate, ail…).
const COND = {
  // ── Fruits & Légumes vendus à la pièce ────────────────────────────────
  concombre: [400, 1.1, "pièce"],
  poivron: [150, 0.95, "pièce"],
  courgette: [200, 0.75, "pièce"],
  aubergine: [250, 0.9, "pièce"],
  "courge butternut": [900, 2.6, "pièce"],
  potiron: [1000, 2.8, "part"],
  brocoli: [500, 1.75, "pièce"],
  "chou-fleur": [700, 2.4, "pièce"],
  chou: [800, 1.9, "pièce"],
  "chou rouge": [800, 2.3, "pièce"],
  "chou chinois": [600, 2.1, "pièce"],
  salade: [200, 1.15, "pièce"],
  "salade romaine": [300, 1.45, "pièce"],
  navet: [150, 0.5, "pièce"],
  poireau: [150, 0.7, "pièce"],
  céleri: [400, 1.4, "pièce"],
  "pak choï": [200, 1.4, "pièce"],
  // ── sachets / barquettes du rayon frais ───────────────────────────────
  roquette: [100, 1.7, "sachet"],
  épinards: [150, 1.8, "sachet"],
  "épinards frais": [150, 1.8, "sachet"],
  champignons: [250, 1.6, "barquette"],
  "champignons de paris": [250, 1.6, "barquette"],
  "tomates cerises": [250, 1.9, "barquette"],
  // ── herbes fraîches (botte / pot) ─────────────────────────────────────
  persil: [30, 1.2, "botte"],
  coriandre: [30, 1.2, "botte"],
  basilic: [25, 1.49, "pot"],
  menthe: [25, 1.2, "botte"],
  aneth: [20, 1.3, "botte"],
  citronnelle: [20, 1.5, "sachet"],
  "oignon nouveau": [100, 1.1, "botte"],
  gingembre: [80, 0.8, "morceau"],
  // ── Crèmerie : pots, boules, briques, boîtes ──────────────────────────
  béchamel: [500, 1.9, "brique"],
  beurre: [250, 3.25, "plaquette"],
  "crème fraîche": [200, 1.0, "pot"],
  "fromage râpé": [200, 2.3, "sachet"],
  "gruyère râpé": [200, 2.8, "sachet"],
  "parmesan râpé": [100, 3.2, "sachet"],
  mozzarella: [125, 1.4, "boule"],
  feta: [200, 2.6, "paquet"],
  halloumi: [225, 4.3, "paquet"],
  "chèvre frais": [150, 2.1, "pot"],
  "bûche de chèvre": [180, 2.5, "bûche"],
  yaourt: [500, 1.6, "pack"],
  ravioles: [180, 2.5, "sachet"],
  "sauce blanche": [300, 1.5, "flacon"],
  lait: [1000, 1.25, "brique"],
  œuf: [6, 2.5, "boîte de 6"],
  // ── Conserves & bocaux ────────────────────────────────────────────────
  "tomates concassées": [400, 1.05, "boîte"],
  "sauce tomate": [400, 1.3, "bocal"],
  "pois chiches": [265, 1.2, "boîte"],
  "haricots rouges": [265, 1.3, "boîte"],
  "haricots noirs": [265, 1.3, "boîte"],
  maïs: [285, 1.05, "boîte"],
  "thon en boîte": [112, 1.7, "boîte"],
  anchois: [50, 1.8, "boîte"],
  "olives noires": [200, 2.0, "bocal"],
  câpres: [100, 1.5, "bocal"],
  "lait de coco": [400, 1.8, "boîte"],
  houmous: [175, 1.75, "pot"],
  kimchi: [300, 4.2, "pot"],
  "tofu ferme": [250, 2.5, "paquet"],
  // ── Féculents secs (paquet entier) ────────────────────────────────────
  spaghetti: [500, 1.2, "paquet"],
  penne: [500, 1.2, "paquet"],
  rigatoni: [500, 1.2, "paquet"],
  macaroni: [500, 1.2, "paquet"],
  coquillettes: [500, 1.2, "paquet"],
  orecchiette: [500, 1.8, "paquet"],
  tagliatelles: [500, 1.8, "paquet"],
  vermicelles: [500, 1.8, "paquet"],
  "feuilles de lasagne": [500, 1.8, "paquet"],
  nouilles: [500, 1.8, "paquet"],
  "nouilles chinoises": [250, 1.2, "paquet"],
  "nouilles de riz": [250, 1.25, "paquet"],
  "nouilles soba": [250, 1.9, "paquet"],
  gnocchi: [500, 2.1, "sachet"],
  riz: [1000, 2.5, "paquet"],
  "riz basmati": [500, 1.9, "paquet"],
  "riz arborio": [500, 2.4, "paquet"],
  semoule: [500, 1.2, "paquet"],
  boulgour: [500, 1.75, "paquet"],
  polenta: [500, 1.75, "paquet"],
  quinoa: [500, 3.5, "paquet"],
  "lentilles corail": [500, 2.25, "paquet"],
  "lentilles vertes": [500, 2.0, "paquet"],
  // ── Épicerie sucrée / fruits secs ─────────────────────────────────────
  "graines de courge": [100, 1.5, "sachet"],
  cacahuètes: [200, 2.4, "sachet"],
  noix: [200, 3.4, "sachet"],
  noisettes: [125, 3.0, "sachet"],
  "noix de cajou": [200, 4.8, "sachet"],
  pignons: [50, 3.75, "sachet"],
  "pignons de pin": [50, 3.75, "sachet"],
  // ── Surgelés ──────────────────────────────────────────────────────────
  frites: [1000, 2.5, "sachet"],
  "petits pois": [750, 2.25, "sachet"],
  "cordon bleu": [4, 4.6, "boîte"],
  falafels: [10, 3.5, "sachet"],
  // ── Boulangerie ───────────────────────────────────────────────────────
  pain: [250, 0.95, "baguette"],
  "pain de mie": [20, 2.0, "paquet"],
  "pain burger": [4, 2.6, "paquet"],
  "pain pita": [6, 4.5, "paquet"],
  tortilla: [8, 4.0, "paquet"],
  tortillas: [8, 4.0, "paquet"],
  "galette de sarrasin": [6, 4.5, "paquet"],
  "pâte à pizza": [260, 1.3, "rouleau"],
  "pâte brisée": [230, 1.15, "rouleau"],
  "pâte feuilletée": [230, 1.4, "rouleau"],
  croûtons: [100, 0.75, "sachet"],
  // ── Placard : pots d'épices, huiles, condiments (voir PLACARD) ────────
  sel: [200, 0.9, "paquet"],
  thym: [50, 1.55, "pot"],
  "herbes de provence": [60, 1.6, "pot"],
  muscade: [80, 2.2, "pot"],
  piment: [60, 1.8, "pot"],
  "piment séché": [50, 2.0, "pot"],
  "piment d'espelette": [40, 3.2, "pot"],
  cumin: [40, 1.8, "pot"],
  curry: [40, 1.4, "pot"],
  paprika: [45, 1.35, "pot"],
  "épices ras el hanout": [40, 1.8, "pot"],
  sésame: [100, 1.5, "sachet"],
  bouillon: [8, 1.2, "boîte"],
  "bouillon de légumes": [8, 1.2, "boîte"],
  "bouillon de volaille": [8, 1.2, "boîte"],
  huile: [1000, 2.6, "bouteille"],
  "huile d'olive": [750, 8.25, "bouteille"],
  "huile de sésame": [250, 4.5, "bouteille"],
  "sauce soja": [250, 2.0, "bouteille"],
  vinaigrette: [500, 2.5, "flacon"],
  "sauce césar": [300, 1.95, "flacon"],
  moutarde: [370, 2.2, "pot"],
  ketchup: [500, 1.9, "flacon"],
  tahini: [300, 4.5, "pot"],
  "beurre de cacahuète": [350, 3.5, "pot"],
  miel: [250, 3.75, "pot"],
  "sirop d'érable": [250, 5.5, "bouteille"],
  farine: [1000, 1.3, "paquet"],
  sucre: [1000, 1.5, "paquet"],
  maïzena: [400, 1.45, "paquet"],
  chapelure: [250, 0.9, "paquet"],
  levure: [55, 1.0, "étui"],
  "vin blanc": [750, 5.25, "bouteille"],
  "vin rouge": [750, 5.25, "bouteille"],
};

// ── Placard : produits que tu as très probablement déjà chez toi ─────────────
// Ils sont facturés au pot/à la bouteille entière comme le reste (c'est ce que
// tu paies la première fois), mais ils sont signalés dans la liste et retirés
// du bas de la fourchette : un pot de cumin dure des mois, pas une semaine.
const PLACARD = new Set([
  "sel", "thym", "herbes de provence", "muscade", "piment", "piment séché",
  "piment d'espelette", "cumin", "curry", "paprika", "épices ras el hanout",
  "sésame", "bouillon", "bouillon de légumes", "bouillon de volaille",
  "huile", "huile d'olive", "huile de sésame", "sauce soja", "vinaigrette",
  "sauce césar", "moutarde", "ketchup", "tahini", "beurre de cacahuète",
  "miel", "sirop d'érable", "farine", "sucre", "maïzena", "chapelure",
  "levure", "vin blanc", "vin rouge",
]);

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

  // Un conditionnement doit toujours désigner un produit connu.
  const condOrphelins = Object.keys(COND).filter((k) => !PRICES[k]);
  const placardOrphelins = [...PLACARD].filter((k) => !PRICES[k]);
  if (condOrphelins.length || placardOrphelins.length) {
    console.error(`\n❌ clés inconnues : ${[...condOrphelins, ...placardOrphelins].join(", ")}`);
    process.exit(1);
  }

  // Fusionne conditionnement et placard dans la table de prix exportée.
  const prixOut = {};
  for (const [key, entry] of Object.entries(PRICES)) {
    const out = { ...entry };
    if (COND[key]) out.cond = COND[key];
    if (PLACARD.has(key)) out.placard = true;
    prixOut[key] = out;
  }

  writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2) + "\n");
  writeFileSync(
    PRICES_PATH,
    JSON.stringify({ meta: META, prix: prixOut }, null, 2) + "\n"
  );

  // Récap
  const prixs = recipes.map((r) => r.prixParPersonne).sort((a, b) => a - b);
  const moy = prixs.reduce((s, p) => s + p, 0) / prixs.length;
  const nbCond = Object.keys(COND).length;
  console.log(`✅ ${recipes.length} recettes reprixées depuis ${Object.keys(PRICES).length} ingrédients.`);
  console.log(`   ${nbCond} conditionnements · ${PLACARD.size} produits de placard`);
  console.log(`   €/personne (part d'ingrédients) : min ${prixs[0]}  méd ${prixs[Math.floor(prixs.length / 2)]}  moy ${round2(moy)}  max ${prixs[prixs.length - 1]}`);
}

main();
