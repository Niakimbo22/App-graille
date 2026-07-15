export interface Magasin {
  nom: string;
  coef: number;
  emoji: string;
  /** couleur pastel de la tuile */
  couleur: string;
}

// Coefficient prix appliqué au coût des recettes.
// Référence = E.Leclerc (coef 1.0), l'enseigne la moins chère du palmarès
// UFC-Que Choisir 2026 sur marques nationales ET marques de distributeur.
// Écarts calés sur ce palmarès (panier comparable, base E.Leclerc = 0 %) :
//   Intermarché +3,2 %  ·  Super U/Hyper U +3,4 %  ·  Carrefour +6,7 %
//   Auchan +7,9 à +14,1 % (drive → supermarché), soit l'enseigne la plus chère
//   Lidl ≈ −2,5 %, Aldi ≈ +2 % vs Leclerc sur panier comparable ; sur des
//   ingrédients génériques (marque distributeur), le hard-discount reste
//   légèrement moins cher → 0,92-0,93.
//   Grand Frais (spécialiste frais) et Franprix (proximité ville) : plus chers
//   que la moyenne, ~+15 à +18 %.
export const MAGASINS: Magasin[] = [
  { nom: "E.Leclerc", coef: 1.0, emoji: "🏬", couleur: "#FFE4D6" },
  { nom: "Lidl", coef: 0.92, emoji: "💙", couleur: "#FFF3C4" },
  { nom: "Aldi", coef: 0.93, emoji: "💠", couleur: "#D6F5E3" },
  { nom: "Intermarché", coef: 1.03, emoji: "🛍️", couleur: "#E6E0FF" },
  { nom: "Super U", coef: 1.04, emoji: "🅿️", couleur: "#D6ECFF" },
  { nom: "Carrefour", coef: 1.07, emoji: "🛒", couleur: "#DBE9FF" },
  { nom: "Auchan", coef: 1.1, emoji: "🏪", couleur: "#FFE0E6" },
  { nom: "Grand Frais", coef: 1.15, emoji: "🥬", couleur: "#DFF5D0" },
  { nom: "Franprix", coef: 1.18, emoji: "🏙️", couleur: "#FFE6F0" },
];

export function coefMagasin(nom: string | null): number {
  const m = MAGASINS.find((x) => x.nom === nom);
  return m ? m.coef : 1.0;
}
