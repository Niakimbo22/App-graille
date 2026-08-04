import pricesData from "@/data/prices.fr.json";

export interface PriceMeta {
  devise: string;
  /** mois de dernière mise à jour, ex "2026-08" */
  maj: string;
  /** enseigne de référence (coef 1.0) */
  base: string;
  note: string;
}

export interface PriceEntry {
  prix: number;
  ref: "kg" | "L" | "u";
  /** poids moyen d'une pièce (g) pour les ingrédients comptés à la pièce */
  poids?: number;
  /** conditionnement d'achat : [pas, prix, label] */
  cond?: [number, number, string];
  /** produit de placard (épices, huile, farine…) : tu l'as sûrement déjà */
  placard?: boolean;
}

const DATA = pricesData as unknown as { meta: PriceMeta; prix: Record<string, PriceEntry> };

export const PRICE_META = DATA.meta;
const PRIX = DATA.prix;

const norm = (nom: string) => nom.toLowerCase().trim();

/** Prix (€) d'une unité de recette (1 g / 1 ml / 1 pièce…) pour cet ingrédient. */
export function priceFor(nom: string, unite: string): number {
  const e = PRIX[norm(nom)];
  if (!e) return 0;
  if (e.ref === "kg") {
    if (unite === "g") return e.prix / 1000;
    if (unite === "u" && e.poids) return (e.prix / 1000) * e.poids;
    return 0;
  }
  if (e.ref === "L") {
    if (unite === "ml") return e.prix / 1000;
    return 0;
  }
  // ref "u"
  return e.prix;
}

export interface Conditionnement {
  pas: number;
  prix: number;
  label: string;
}

/** Conditionnement d'achat (paquet vendu) d'un ingrédient, ou null si vendu au poids. */
export function condFor(nom: string): Conditionnement | null {
  const c = PRIX[norm(nom)]?.cond;
  return c ? { pas: c[0], prix: c[1], label: c[2] } : null;
}

/** Vrai si l'ingrédient est un produit de placard (épices, huile, farine…). */
export function estPlacard(nom: string): boolean {
  return PRIX[norm(nom)]?.placard === true;
}

/** "08/2026" à partir de "2026-08" */
export function majLisible(maj: string = PRICE_META.maj): string {
  const [an, mois] = maj.split("-");
  return mois && an ? `${mois}/${an}` : maj;
}
