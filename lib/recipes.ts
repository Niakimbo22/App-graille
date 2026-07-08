import recipesData from "@/data/recipes.json";
import type { Recipe } from "./types";

export const RECIPES = recipesData as Recipe[];

const byId = new Map(RECIPES.map((r) => [r.id, r]));

export function getRecipe(id: string): Recipe | undefined {
  return byId.get(id);
}
