import pricesData from "@/data/prices.fr.json";

export interface PriceMeta {
  devise: string;
  /** mois de dernière mise à jour, ex "2026-07" */
  maj: string;
  /** enseigne de référence (coef 1.0) */
  base: string;
  note: string;
}

export const PRICE_META = (pricesData as { meta: PriceMeta }).meta;

/** "07/2026" à partir de "2026-07" */
export function majLisible(maj: string = PRICE_META.maj): string {
  const [an, mois] = maj.split("-");
  return mois && an ? `${mois}/${an}` : maj;
}
