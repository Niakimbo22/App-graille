import type { Recipe, FunnelState, Regime, ProteinPref, Plan } from "./types";
import { round2 } from "./format";
import { saisonnaliteRecette } from "./saison";
import { buildShoppingListFor } from "./shopping";

export interface PlanInput {
  recipes: Recipe[];
  funnel: FunnelState;
  coef: number;
  seed?: number;
  nbRepas?: number;
}

export interface PlannedItem {
  recipeId: string;
  /** part de la liste de courses imputée à cette recette (voir `repartirPanier`) */
  prixTotal: number;
}

export interface PlanResult {
  items: PlannedItem[];
  /** coût du panier réel : paquets entiers, pas somme des grammages utilisés */
  coutEstime: number;
  seed: number;
  /** vrai si le budget n'a pas permis de tenir les 5 repas */
  budgetDepasse: boolean;
}

/** RNG déterministe (mulberry32) pour rendre les plans reproductibles et régénérables. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ingrédients apportant du sucre ajouté (correspondance exacte, pas de sous-chaîne
// pour éviter les faux positifs comme "confit de canard").
const SUCRE_AJOUTE = new Set(["sucre", "miel", "sirop d'érable", "ketchup"]);

/** Vrai si la recette contient un ingrédient de sucre ajouté. */
export function hasAddedSugar(recipe: Recipe): boolean {
  return recipe.ingredients.some((i) => SUCRE_AJOUTE.has(i.nom.toLowerCase().trim()));
}

// Féculents raffinés à indice glycémique élevé (approximation pratique : on exclut
// volontairement le riz basmati, le boulgour, le quinoa et les légumineuses, qui
// ont un IG plus bas). Ce n'est pas un avis médical, juste une estimation utile
// pour composer un menu.
const FECULENTS_IG_HAUT = new Set([
  "chapelure", "coquillettes", "croûtons", "farine", "feuilles de lasagne", "frites",
  "galette de sarrasin", "gnocchi", "macaroni", "nouilles", "nouilles chinoises",
  "nouilles de riz", "nouilles soba", "orecchiette", "pain", "pain burger", "pain de mie",
  "pain pita", "penne", "polenta", "pomme de terre", "pommes de terre", "pâte brisée",
  "pâte à pizza", "pâte feuilletée", "riz", "riz arborio", "rigatoni", "semoule",
  "spaghetti", "tagliatelles", "tortilla", "tortillas", "vermicelles",
]);

/** Vrai si la recette évite les féculents à IG élevé et le sucre ajouté (estimation). */
export function isLowGI(recipe: Recipe): boolean {
  if (hasAddedSugar(recipe)) return false;
  return !recipe.ingredients.some((i) => FECULENTS_IG_HAUT.has(i.nom.toLowerCase().trim()));
}

// Ingrédients haram (porc et dérivés, alcool). On teste par mot entier après
// normalisation des accents : `\bvin\b` matche « vin blanc » mais pas « vinaigrette ».
const HARAM_RE = /\b(porc|lardons?|bacon|jambon|chorizo|saucisson|saucisse|pancetta|prosciutto|vin|rhum|biere)\b/;
// Exceptions halal : une « saucisse/jambon de volaille » reste halal.
const HALAL_SAUF_RE = /(volaille|poulet|dinde)/;

function sansAccents(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/** Vrai si la recette ne contient ni porc/charcuterie ni alcool. */
export function isHalal(recipe: Recipe): boolean {
  return !recipe.ingredients.some((i) => {
    const n = sansAccents(i.nom);
    if (HALAL_SAUF_RE.test(n)) return false;
    return HARAM_RE.test(n);
  });
}

// Viandes & volailles à sourcer halal (le poisson et les fruits de mer, eux,
// sont toujours halal — pas de rappel nécessaire).
const VIANDE_RE = /(poulet|volaille|dinde|canard|escalope|cordon|nugget|boeuf|bœuf|veau|agneau|kefta|kebab|merguez|steak|viande)/;
const POISSON_RE = /(saumon|cabillaud|colin|thon|dorade|sardine|poisson|crevette|\bmoule|anchois|crustac|calmar|sepia|seiche)/;

/** Vrai si l'article est une viande/volaille qui doit être achetée halal. */
export function besoinHalal(nom: string): boolean {
  const n = sansAccents(nom);
  if (POISSON_RE.test(n)) return false;
  return VIANDE_RE.test(n);
}

/** Régime satisfait par une recette (un plat végé convient à un pescétarien). */
export function satisfiesRegime(recipe: Recipe, regime: Regime): boolean {
  switch (regime) {
    case "vegetarien":
      return recipe.regimes.includes("vegetarien");
    case "pescetarien":
      return recipe.regimes.includes("pescetarien") || recipe.regimes.includes("vegetarien");
    case "halal":
      return isHalal(recipe);
    case "sans-gluten":
      return !recipe.allergenes.includes("gluten");
    case "sans-lactose":
      return !recipe.allergenes.includes("lait");
    case "sans-sucre":
      return !hasAddedSugar(recipe);
    case "indice-glycemique-bas":
      return isLowGI(recipe);
    default:
      return true;
  }
}

/** Catégorie de protéine dominante, utilisée pour la diversité du plan. */
export function proteinCategory(recipe: Recipe): string {
  const text = (recipe.nom + " " + recipe.ingredients.map((i) => i.nom).join(" ")).toLowerCase();
  if (/(saumon|cabillaud|colin|thon|dorade|sardine|poisson|crevette|\bmoule|anchois|crustac|sépia|calmar)/.test(text))
    return "poisson";
  if (/(poulet|volaille|dinde|canard|escalope|cordon|nugget)/.test(text)) return "volaille";
  if (/(lardon|bacon|jambon|saucisse|porc)/.test(text)) return "porc";
  if (/(bœuf|boeuf|veau|agneau|kefta|kebab|merguez)/.test(text)) return "rouge";
  if (/(tofu|pois chiche|lentille|haricot|falafel)/.test(text)) return "vegetal";
  if (/(œuf|oeuf)/.test(text)) return "oeuf";
  return "autre";
}

/** Filtre les recettes compatibles avec les contraintes du funnel. */
export function filterRecipes(recipes: Recipe[], funnel: FunnelState): Recipe[] {
  const equipDispo = funnel.equipement.length > 0 ? funnel.equipement : (["four", "plaque", "airfryer"] as const);
  return recipes.filter((r) => {
    // recettes du monde importées: seulement si l'utilisateur les a activées
    if (r.origine === "monde" && !funnel.inclureMonde) return false;
    for (const regime of funnel.regimes) {
      if (!satisfiesRegime(r, regime)) return false;
    }
    if (!r.equipement.every((e) => (equipDispo as readonly string[]).includes(e))) return false;
    return true;
  });
}

// Bonus de score attribué à une recette qui matche une envie de protéine.
const BONUS_ENVIE = 3;
// Bonus si la recette est pleinement de saison (au moins un F&L de saison, aucun hors-saison).
const BONUS_SAISON = 3;
// Pénalité par ingrédient F&L hors saison quand l'option saison est activée.
const MALUS_HORS_SAISON = 2;

/**
 * Score d'affinité d'une recette avec les choix du funnel :
 * ambiances, envies de protéines, et fruits & légumes de saison.
 */
export function scoreRecipe(recipe: Recipe, funnel: FunnelState): number {
  let score = 0;
  for (const tag of recipe.tags) {
    if (funnel.ambiances.includes(tag)) score += 2;
  }
  if (funnel.ambiances.includes("rapide") && recipe.tempsMin <= 25) score += 1;

  // envies de protéines : on privilégie les recettes de la catégorie voulue
  const prefs = funnel.preferences ?? [];
  if (prefs.length > 0 && prefs.includes(proteinCategory(recipe) as ProteinPref)) {
    score += BONUS_ENVIE;
  }

  // fruits & légumes de saison : bonus si de saison, malus par ingrédient hors saison
  if (funnel.saison) {
    const s = saisonnaliteRecette(recipe);
    if (s.ok && s.deSaison > 0) score += BONUS_SAISON;
    else if (s.horsSaison.length > 0) score -= MALUS_HORS_SAISON * s.horsSaison.length;
  }

  return score;
}

/** Poids de tirage (toujours strictement positif malgré d'éventuels malus). */
function poids(score: number): number {
  return Math.max(0.25, score + 1);
}

/**
 * Part d'ingrédients d'une recette : somme des grammages utilisés, au prorata.
 * Ce n'est PAS ce qu'on paie en caisse (on achète des paquets entiers, souvent
 * partagés entre plusieurs recettes) — c'est la clé de répartition du panier.
 */
export function prixTotalRecette(recipe: Recipe, personnes: number, coef: number): number {
  return round2(recipe.prixParPersonne * personnes * coef);
}

/** Coût réel du panier pour ces recettes : conditionnements arrondis, coef inclus. */
export function coutPanier(recipes: Recipe[], personnes: number, coef: number): number {
  return buildShoppingListFor(recipes, personnes, coef).total;
}

/**
 * Répartit le coût réel du panier entre les recettes, au prorata de leur part
 * d'ingrédients. Un paquet de pâtes ou un pot de cumin sert souvent à plusieurs
 * dîners : plutôt que d'imputer le paquet entier au premier, chaque recette
 * porte sa quote-part. La somme des `prixTotal` retombe donc sur le total de la
 * liste de courses (au centime d'arrondi près, absorbé par la dernière ligne).
 */
export function repartirPanier(
  recipes: Recipe[],
  personnes: number,
  coef: number
): { items: PlannedItem[]; total: number } {
  const total = coutPanier(recipes, personnes, coef);
  const parts = recipes.map((r) => prixTotalRecette(r, personnes, coef));
  const sommeParts = parts.reduce((s, p) => s + p, 0);

  let reste = total;
  const items = recipes.map((recipe, i) => {
    const dernier = i === recipes.length - 1;
    const part = sommeParts > 0 ? parts[i] / sommeParts : 1 / recipes.length;
    const prixTotal = dernier ? round2(reste) : round2(total * part);
    reste = round2(reste - prixTotal);
    return { recipeId: recipe.id, prixTotal };
  });

  return { items, total };
}

/**
 * Recalcule les prix d'un plan déjà enregistré (localStorage, semaine gardée en
 * favori). Les plans sauvegardés avant une révision de la table de prix — ou
 * avant le passage au chiffrage au paquet entier — portent des montants
 * périmés : sans ça, les cartes afficheraient l'ancien prix et le total le
 * nouveau. Les recettes disparues du catalogue sont retirées.
 */
export function rechiffrerPlan(recipes: Recipe[], plan: Plan, coef: number): Plan {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const presentes = plan.items
    .map((i) => byId.get(i.recipeId))
    .filter((r): r is Recipe => r !== undefined);
  if (presentes.length === 0) return plan;

  const { items, total } = repartirPanier(presentes, plan.personnes, coef);
  return { ...plan, items, coutEstime: total };
}

function weightedPick<T>(items: { item: T; weight: number }[], rng: () => number): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)].item;
  let x = rng() * total;
  for (const i of items) {
    x -= i.weight;
    if (x <= 0) return i.item;
  }
  return items[items.length - 1].item;
}

/**
 * Génère un plan de repas.
 * - filtre par régimes / équipement
 * - score par ambiances
 * - tirage pondéré par le score (part d'aléatoire via le seed) avec diversité de protéines
 * - respecte le budget ; si trop serré, privilégie les moins chères et renvoie le vrai total
 */
export function generatePlan(input: PlanInput): PlanResult {
  const nbRepas = input.nbRepas ?? 5;
  const seed = input.seed ?? Math.floor(Math.random() * 1_000_000);
  const rng = mulberry32(seed);
  const { funnel, coef } = input;

  const candidates = filterRecipes(input.recipes, funnel).map((recipe) => ({
    recipe,
    score: scoreRecipe(recipe, funnel),
    prix: prixTotalRecette(recipe, funnel.personnes, coef),
    prot: proteinCategory(recipe),
  }));

  const prefs = funnel.preferences ?? [];
  const chosen: typeof candidates = [];
  let lastProt: string | null = null;
  const remaining = [...candidates];

  // Coût réel du panier si on ajoutait cette recette aux déjà choisies. On
  // raisonne sur le panier entier et non sur la somme des recettes : deux plats
  // qui partagent un paquet de riz ne le font payer qu'une fois.
  const coutAvec = (c: (typeof candidates)[number]) =>
    coutPanier([...chosen.map((x) => x.recipe), c.recipe], funnel.personnes, coef);

  while (chosen.length < nbRepas && remaining.length > 0) {
    // diversité: éviter la même protéine deux fois de suite — sauf si c'est
    // une envie assumée (ex: "plus de poulet"), auquel cas on l'autorise à revenir.
    let pool = remaining.filter(
      (c) => c.prot !== lastProt || prefs.includes(c.prot as ProteinPref)
    );
    if (pool.length === 0) pool = remaining;

    // coût du panier pour chaque candidat de ce tour (calculé une seule fois)
    const chiffre = pool.map((c) => ({ c, cout: coutAvec(c) }));
    const inBudget = chiffre.filter((x) => x.cout <= funnel.budget);

    let pick: (typeof candidates)[number] | null;
    if (inBudget.length > 0) {
      // tirage pondéré par le score (poids minimal pour garder de l'aléatoire)
      pick = weightedPick(
        inBudget.map((x) => ({ item: x.c, weight: poids(x.c.score) })),
        rng
      );
    } else {
      // budget trop serré: celle qui alourdit le moins le panier
      pick = chiffre.reduce((min, x) => (x.cout < min.cout ? x : min), chiffre[0]).c;
    }

    if (!pick) break;
    chosen.push(pick);
    lastProt = pick.prot;
    remaining.splice(remaining.indexOf(pick), 1);
  }

  const { items, total } = repartirPanier(
    chosen.map((c) => c.recipe),
    funnel.personnes,
    coef
  );

  return {
    items,
    coutEstime: total,
    seed,
    budgetDepasse: total > funnel.budget,
  };
}

/**
 * Trouve une recette de remplacement compatible et non déjà utilisée, et renvoie
 * le plan entier ré-chiffré : changer un plat modifie le panier commun (un
 * paquet de riz qui n'est plus partagé, un pot d'épices devenu inutile), donc
 * toutes les parts bougent, pas seulement celle qu'on remplace.
 */
export function swapRecipe(
  recipes: Recipe[],
  funnel: FunnelState,
  coef: number,
  currentId: string,
  usedIds: string[],
  seed?: number
): { recipeId: string; items: PlannedItem[]; coutEstime: number } | null {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 1_000_000));
  const used = new Set(usedIds);
  const options = filterRecipes(recipes, funnel).filter((r) => r.id !== currentId && !used.has(r.id));
  if (options.length === 0) return null;
  const weighted = options.map((r) => ({ item: r, weight: poids(scoreRecipe(r, funnel)) }));
  const pick = weightedPick(weighted, rng);
  if (!pick) return null;

  const byId = new Map(recipes.map((r) => [r.id, r]));
  const nouvelles = usedIds
    .map((id) => (id === currentId ? pick : byId.get(id)))
    .filter((r): r is Recipe => r !== undefined);

  const { items, total } = repartirPanier(nouvelles, funnel.personnes, coef);
  return { recipeId: pick.id, items, coutEstime: total };
}
