import type { Recipe, Rayon } from "./types";
import { getRecipe } from "./recipes";
import { round2 } from "./format";
import { condFor, estPlacard, priceFor } from "./prices";

export interface ShoppingArticle {
  key: string;
  nom: string;
  unite: string;
  rayon: Rayon;
  qte: number;
  prix: number;
  /** produit de placard (épices, huile, farine…) : tu l'as sûrement déjà */
  placard: boolean;
}

export interface ShoppingList {
  articles: ShoppingArticle[];
  parRayon: { rayon: Rayon; articles: ShoppingArticle[] }[];
  /** total du ticket de caisse, tout compris */
  total: number;
  /** part du total qui vient du placard (à déduire si tu l'as déjà) */
  placard: number;
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

function pluralise(label: string, n: number): string {
  if (n <= 1) return label;
  if (label.endsWith("s") || label.endsWith("x")) return label;
  if (label === "morceau") return "morceaux";
  if (label === "boîte de 6") return "boîtes de 6";
  return label + "s";
}

/** Unités de recette vendues à la pièce (non divisibles). */
const PIECE_UNITS = new Set(["u", "tranches", "cube"]);

/**
 * Agrège les ingrédients du plan par rayon, et facture au conditionnement RÉEL :
 * on arrondit chaque produit à ce qu'on achète en magasin (1 botte de persil,
 * 1 pot de thym, 1 boîte de 6 œufs, 1 paquet de pâtes…) plutôt qu'au prorata
 * des grammes utilisés. C'est ce qui fait l'écart entre « la somme des
 * ingrédients » et le vrai ticket de caisse.
 *
 * Restent au prorata les produits qu'on achète vraiment au poids voulu :
 * viande et poisson en barquette à poids variable, fromage à la coupe, et
 * légumes vendus en vrac (oignon, carotte, pomme de terre, tomate, ail…).
 */
export function buildShoppingList(
  recipeIds: string[],
  personnes: number,
  coef: number
): ShoppingList {
  const recipes = recipeIds
    .map((id) => getRecipe(id))
    .filter((r): r is Recipe => r !== undefined);
  return buildShoppingListFor(recipes, personnes, coef);
}

/** Même chose, à partir des recettes elles-mêmes (utile hors du catalogue global). */
export function buildShoppingListFor(
  recipes: Recipe[],
  personnes: number,
  coef: number
): ShoppingList {
  // 1) agrège les QUANTITÉS par (rayon, nom, unité)
  const agg = new Map<string, { nom: string; unite: string; rayon: Rayon; qte: number }>();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.rayon}::${ing.nom.toLowerCase()}::${ing.unite}`;
      const qte = ing.qteParPersonne * personnes;
      const cur = agg.get(key);
      if (cur) cur.qte += qte;
      else agg.set(key, { nom: ing.nom, unite: ing.unite, rayon: ing.rayon, qte });
    }
  }

  // 2) facture chaque ligne au conditionnement réel
  const articles: ShoppingArticle[] = [];
  for (const [key, a] of agg) {
    const cond = condFor(a.nom);
    let qteAff: number;
    let uniteAff: string;
    let prix: number;

    if (cond) {
      // vendu en paquet fixe (botte, pot, boîte, sachet…) → on paie le paquet
      // entier, quelle que soit l'unité de la recette (g, ml, pièce, pincée…).
      const nb = Math.max(1, Math.ceil(round2(a.qte) / cond.pas));
      qteAff = nb;
      uniteAff = pluralise(cond.label, nb);
      prix = round2(nb * cond.prix * coef);
    } else if (PIECE_UNITS.has(a.unite)) {
      // compté à la pièce et vendu en vrac (citron, avocat…) → unité entière
      const nb = Math.max(1, Math.ceil(round2(a.qte)));
      qteAff = nb;
      uniteAff = a.unite === "u" ? "u" : pluralise(a.unite, nb);
      prix = round2(nb * priceFor(a.nom, a.unite) * coef);
    } else {
      // vendu au poids choisi (viande, fromage à la coupe, légumes en vrac)
      qteAff = round2(a.qte);
      uniteAff = a.unite;
      prix = round2(a.qte * priceFor(a.nom, a.unite) * coef);
    }

    articles.push({
      key,
      nom: a.nom,
      unite: uniteAff,
      rayon: a.rayon,
      qte: qteAff,
      prix,
      placard: estPlacard(a.nom),
    });
  }

  const total = round2(articles.reduce((s, x) => s + x.prix, 0));
  const placard = round2(articles.reduce((s, x) => s + (x.placard ? x.prix : 0), 0));

  const parRayon = RAYON_ORDER.map((rayon) => ({
    rayon,
    articles: articles
      .filter((x) => x.rayon === rayon)
      // le placard en fin de rayon : ce sont les lignes qu'on saute le plus souvent
      .sort((x, y) => Number(x.placard) - Number(y.placard) || x.nom.localeCompare(y.nom, "fr")),
  })).filter((g) => g.articles.length > 0);

  return { articles, parRayon, total, placard };
}
