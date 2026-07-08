import type { Recipe, Rayon } from "./types";
import { getRecipe } from "./recipes";
import { round2 } from "./format";

export interface ShoppingArticle {
  key: string;
  nom: string;
  unite: string;
  rayon: Rayon;
  qte: number;
  prix: number;
}

export const RAYON_ORDER: Rayon[] = [
  "Fruits & Légumes",
  "Boucherie/Poisson",
  "Crèmerie",
  "Épicerie salée",
  "Épicerie sucrée",
  "Surgelés",
  "Boulangerie",
];

const RAYON_EMOJI: Record<Rayon, string> = {
  "Fruits & Légumes": "🥬",
  "Boucherie/Poisson": "🥩",
  Crèmerie: "🧀",
  "Épicerie salée": "🥫",
  "Épicerie sucrée": "🍫",
  Surgelés: "❄️",
  Boulangerie: "🥖",
};

export function rayonEmoji(r: Rayon): string {
  return RAYON_EMOJI[r] ?? "🛒";
}

/** Agrège les ingrédients des recettes du plan, par rayon. */
export function buildShoppingList(
  recipeIds: string[],
  personnes: number,
  coef: number
): { articles: ShoppingArticle[]; parRayon: { rayon: Rayon; articles: ShoppingArticle[] }[]; total: number } {
  const map = new Map<string, ShoppingArticle>();

  for (const id of recipeIds) {
    const recipe: Recipe | undefined = getRecipe(id);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const key = `${ing.rayon}::${ing.nom.toLowerCase()}::${ing.unite}`;
      const qte = ing.qteParPersonne * personnes;
      const prix = ing.prixParPersonne * personnes * coef;
      const existing = map.get(key);
      if (existing) {
        existing.qte = round2(existing.qte + qte);
        existing.prix = round2(existing.prix + prix);
      } else {
        map.set(key, {
          key,
          nom: ing.nom,
          unite: ing.unite,
          rayon: ing.rayon,
          qte: round2(qte),
          prix: round2(prix),
        });
      }
    }
  }

  const articles = [...map.values()];
  const total = round2(articles.reduce((s, a) => s + a.prix, 0));

  const parRayon = RAYON_ORDER.map((rayon) => ({
    rayon,
    articles: articles
      .filter((a) => a.rayon === rayon)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
  })).filter((g) => g.articles.length > 0);

  return { articles, parRayon, total };
}
