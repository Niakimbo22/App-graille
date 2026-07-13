import type { Recipe, Rayon } from "./types";
import { getRecipe } from "./recipes";
import { round2 } from "./format";
import { condFor, priceFor } from "./prices";

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

function pluralise(label: string, n: number): string {
  if (n <= 1) return label;
  if (label.endsWith("s") || label.endsWith("x")) return label;
  if (label === "morceau") return "morceaux";
  return label + "s";
}

/** Unités de recette vendues à la pièce (non divisibles). */
const PIECE_UNITS = new Set(["u", "tranches", "cube"]);

/**
 * Agrège les ingrédients du plan par rayon, et facture au conditionnement RÉEL :
 * on arrondit chaque produit à ce qu'on achète en magasin (1 concombre entier,
 * 1 botte de persil, 1 citron…) plutôt qu'au prorata des grammes utilisés.
 */
export function buildShoppingList(
  recipeIds: string[],
  personnes: number,
  coef: number
): { articles: ShoppingArticle[]; parRayon: { rayon: Rayon; articles: ShoppingArticle[] }[]; total: number } {
  // 1) agrège les QUANTITÉS par (rayon, nom, unité)
  const agg = new Map<string, { nom: string; unite: string; rayon: Rayon; qte: number }>();
  for (const id of recipeIds) {
    const recipe: Recipe | undefined = getRecipe(id);
    if (!recipe) continue;
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

    if (cond && (a.unite === "g" || a.unite === "ml")) {
      // produit frais vendu à la pièce/botte/barquette → arrondi au pack
      const nb = Math.max(1, Math.ceil(a.qte / cond.pas));
      qteAff = nb;
      uniteAff = pluralise(cond.label, nb);
      prix = round2(nb * cond.prix * coef);
    } else if (PIECE_UNITS.has(a.unite)) {
      // compté à la pièce (œuf, citron, tortilla…) → arrondi à l'unité entière
      const nb = Math.max(1, Math.ceil(round2(a.qte)));
      const pu = cond ? cond.prix : priceFor(a.nom, a.unite);
      qteAff = nb;
      uniteAff = a.unite === "u" ? (nb > 1 ? "u" : "u") : pluralise(a.unite, nb);
      prix = round2(nb * pu * coef);
    } else {
      // vrac / placard (farine, riz, huile, épices…) → prorata de la quantité utilisée
      const pu = priceFor(a.nom, a.unite);
      qteAff = round2(a.qte);
      uniteAff = a.unite;
      prix = round2(a.qte * pu * coef);
    }

    articles.push({ key, nom: a.nom, unite: uniteAff, rayon: a.rayon, qte: qteAff, prix });
  }

  const total = round2(articles.reduce((s, x) => s + x.prix, 0));

  const parRayon = RAYON_ORDER.map((rayon) => ({
    rayon,
    articles: articles
      .filter((x) => x.rayon === rayon)
      .sort((x, y) => x.nom.localeCompare(y.nom, "fr")),
  })).filter((g) => g.articles.length > 0);

  return { articles, parRayon, total };
}
