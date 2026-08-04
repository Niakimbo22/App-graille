/**
 * Fourchette de prix — le montant affiché par Miam est une ESTIMATION.
 *
 * Trois choses le font bouger dans la vraie vie, et aucune n'est connue de
 * l'app :
 *  1. le placard : si tu as déjà le cumin, l'huile et la farine, tu ne les
 *     rachètes pas cette semaine → le bas de la fourchette les retire ;
 *  2. les marques et les promos : premier prix / MDD contre marque nationale,
 *     c'est facilement ±15% sur le même caddie ;
 *  3. la région et le format du magasin : une supérette de centre-ville n'a
 *     pas les prix d'un hyper de périphérie (déjà partiellement pris par le
 *     coefficient enseigne).
 *
 * On assume donc une marge asymétrique : −8% sur le panier hors placard (le
 * cas « je fais attention »), +18% sur le total (le cas « marques + magasin
 * cher »). Les bornes sont arrondies à l'euro : afficher « entre 47,32 € et
 * 68,91 € » donnerait une fausse impression de précision.
 */

/** Marge basse appliquée au panier hors placard (promos, MDD, premier prix). */
const MARGE_BASSE = 0.08;
/** Marge haute appliquée au total (marques nationales, magasin cher, région). */
const MARGE_HAUTE = 0.18;

export interface Fourchette {
  /** borne basse, en euros entiers */
  bas: number;
  /** borne haute, en euros entiers */
  haut: number;
  /** part du panier venant du placard (épices, huile, farine…), en euros */
  placard: number;
}

/**
 * Fourchette réaliste autour d'un total de liste de courses.
 * @param total   ticket de caisse estimé, tout compris
 * @param placard part de ce total qui vient des produits de placard
 */
export function fourchette(total: number, placard = 0): Fourchette {
  const sansPlacard = Math.max(0, total - placard);
  const bas = Math.max(0, Math.floor(sansPlacard * (1 - MARGE_BASSE)));
  const haut = Math.ceil(total * (1 + MARGE_HAUTE));
  return { bas, haut: Math.max(haut, bas), placard: Math.round(placard) };
}

/** "42 à 71 €" (espaces insécables : la borne ne doit jamais passer à la ligne seule) */
export function fourchetteLisible(f: Fourchette): string {
  return `${f.bas} à ${f.haut} €`;
}

/**
 * Phrase d'explication affichée sous un prix. Mentionne le placard seulement
 * s'il pèse assez pour justifier l'écart (sinon c'est du bruit).
 */
export function fourchetteDetail(f: Fourchette): string {
  const base =
    "selon les promos, les marques et ton magasin";
  if (f.placard >= 3) {
    return `${base}. le bas suppose que tu as déjà les épices, l'huile et les basiques du placard (~${f.placard} € ici)`;
  }
  return base;
}
