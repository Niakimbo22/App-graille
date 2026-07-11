import recipesData from "@/data/recipes.json";
import worldData from "@/data/recipes.world.json";
import type { Recipe } from "./types";

const CURATED = recipesData as Recipe[];
// Recettes du monde importées au build (TheMealDB). Tableau vide en local ;
// rempli par scripts/fetch-recipes.mjs pendant le build CI.
const WORLD = worldData as Recipe[];

export const RECIPES: Recipe[] = [...CURATED, ...WORLD];

/** Nombre de recettes du monde effectivement chargées. */
export const NB_MONDE = WORLD.length;

const byId = new Map(RECIPES.map((r) => [r.id, r]));

export function getRecipe(id: string): Recipe | undefined {
  return byId.get(id);
}
