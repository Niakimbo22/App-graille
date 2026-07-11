import type { Recipe, FunnelState, Regime } from "./types";
import { round2 } from "./format";

export interface PlanInput {
  recipes: Recipe[];
  funnel: FunnelState;
  coef: number;
  seed?: number;
  nbRepas?: number;
}

export interface PlannedItem {
  recipeId: string;
  prixTotal: number;
}

export interface PlanResult {
  items: PlannedItem[];
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

/** Régime satisfait par une recette (un plat végé convient à un pescétarien). */
export function satisfiesRegime(recipe: Recipe, regime: Regime): boolean {
  switch (regime) {
    case "vegetarien":
      return recipe.regimes.includes("vegetarien");
    case "pescetarien":
      return recipe.regimes.includes("pescetarien") || recipe.regimes.includes("vegetarien");
    case "sans-gluten":
      return !recipe.allergenes.includes("gluten");
    case "sans-lactose":
      return !recipe.allergenes.includes("lait");
    default:
      return true;
  }
}

/** Catégorie de protéine dominante, utilisée pour la diversité du plan. */
export function proteinCategory(recipe: Recipe): string {
  const text = (recipe.nom + " " + recipe.ingredients.map((i) => i.nom).join(" ")).toLowerCase();
  if (/(saumon|cabillaud|colin|thon|dorade|sardine|poisson|crevette|moule|anchois|crustac|sépia|calmar)/.test(text))
    return "poisson";
  if (/(poulet|volaille|dinde|canard|escalope|cordon|nugget)/.test(text)) return "volaille";
  if (/(lardon|bacon|jambon|saucisse|merguez|porc)/.test(text)) return "porc";
  if (/(bœuf|boeuf|veau|agneau|kefta|kebab)/.test(text)) return "rouge";
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
      if (regime === "vegetarien" || regime === "pescetarien" || regime === "sans-gluten" || regime === "sans-lactose") {
        if (!satisfiesRegime(r, regime)) return false;
      }
    }
    if (!r.equipement.every((e) => (equipDispo as readonly string[]).includes(e))) return false;
    return true;
  });
}

/** Score d'affinité d'une recette avec les ambiances choisies. */
export function scoreRecipe(recipe: Recipe, funnel: FunnelState): number {
  let score = 0;
  for (const tag of recipe.tags) {
    if (funnel.ambiances.includes(tag)) score += 2;
  }
  if (funnel.ambiances.includes("rapide") && recipe.tempsMin <= 25) score += 1;
  return score;
}

/** Prix total d'une recette pour le nombre de personnes, coef magasin inclus. */
export function prixTotalRecette(recipe: Recipe, personnes: number, coef: number): number {
  return round2(recipe.prixParPersonne * personnes * coef);
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

  const chosen: typeof candidates = [];
  let budgetLeft = funnel.budget;
  let lastProt: string | null = null;
  const remaining = [...candidates];

  while (chosen.length < nbRepas && remaining.length > 0) {
    // diversité: éviter la même protéine deux fois de suite (relâché si impossible)
    let pool = remaining.filter((c) => c.prot !== lastProt);
    if (pool.length === 0) pool = remaining;

    // recettes tenant dans le budget restant
    const inBudget = pool.filter((c) => c.prix <= budgetLeft);

    let pick: (typeof candidates)[number] | null;
    if (inBudget.length > 0) {
      // tirage pondéré par le score (poids minimal 1 pour garder de l'aléatoire)
      pick = weightedPick(
        inBudget.map((c) => ({ item: c, weight: c.score + 1 })),
        rng
      );
    } else {
      // budget trop serré: on prend la moins chère disponible
      pick = pool.reduce((min, c) => (c.prix < min.prix ? c : min), pool[0]);
    }

    if (!pick) break;
    chosen.push(pick);
    budgetLeft = round2(budgetLeft - pick.prix);
    lastProt = pick.prot;
    remaining.splice(remaining.indexOf(pick), 1);
  }

  const coutEstime = round2(chosen.reduce((s, c) => s + c.prix, 0));
  return {
    items: chosen.map((c) => ({ recipeId: c.recipe.id, prixTotal: c.prix })),
    coutEstime,
    seed,
    budgetDepasse: coutEstime > funnel.budget,
  };
}

/** Trouve une recette de remplacement compatible et non déjà utilisée. */
export function swapRecipe(
  recipes: Recipe[],
  funnel: FunnelState,
  coef: number,
  currentId: string,
  usedIds: string[],
  seed?: number
): { recipeId: string; prixTotal: number } | null {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 1_000_000));
  const used = new Set(usedIds);
  const options = filterRecipes(recipes, funnel).filter((r) => r.id !== currentId && !used.has(r.id));
  if (options.length === 0) return null;
  const weighted = options.map((r) => ({ item: r, weight: scoreRecipe(r, funnel) + 1 }));
  const pick = weightedPick(weighted, rng);
  if (!pick) return null;
  return { recipeId: pick.id, prixTotal: prixTotalRecette(pick, funnel.personnes, coef) };
}
