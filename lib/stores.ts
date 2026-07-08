export interface Magasin {
  nom: string;
  coef: number;
  emoji: string;
  /** couleur pastel de la tuile */
  couleur: string;
}

// Coefficient prix appliqué au coût des recettes.
export const MAGASINS: Magasin[] = [
  { nom: "Carrefour", coef: 1.0, emoji: "🛒", couleur: "#DBE9FF" },
  { nom: "E.Leclerc", coef: 1.0, emoji: "🏬", couleur: "#FFE4D6" },
  { nom: "Auchan", coef: 1.0, emoji: "🏪", couleur: "#FFE0E6" },
  { nom: "Lidl", coef: 0.85, emoji: "💙", couleur: "#FFF3C4" },
  { nom: "Aldi", coef: 0.85, emoji: "💠", couleur: "#D6F5E3" },
  { nom: "Intermarché", coef: 1.0, emoji: "🛍️", couleur: "#E6E0FF" },
  { nom: "Super U", coef: 1.0, emoji: "🅿️", couleur: "#D6ECFF" },
  { nom: "Grand Frais", coef: 1.25, emoji: "🥬", couleur: "#DFF5D0" },
  { nom: "Franprix", coef: 1.25, emoji: "🏙️", couleur: "#FFE6F0" },
];

export function coefMagasin(nom: string | null): number {
  const m = MAGASINS.find((x) => x.nom === nom);
  return m ? m.coef : 1.0;
}
