export interface Magasin {
  nom: string;
  coef: number;
  emoji: string;
  /** couleur pastel de la tuile */
  couleur: string;
  /** vrai logo de l'enseigne (Wikimedia, Special:FilePath) — fallback emoji si l'image ne charge pas */
  logo: string;
}

// Logos officiels hébergés par Wikimedia (Commons ou Wikipédia fr) : URL stable
// Special:FilePath, rendue en PNG à la largeur demandée.
const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=256`;
const frwiki = (file: string) =>
  `https://fr.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=256`;

// Coefficient prix appliqué au coût des recettes.
export const MAGASINS: Magasin[] = [
  { nom: "Carrefour", coef: 1.0, emoji: "🛒", couleur: "#DBE9FF", logo: frwiki("Logo Carrefour.svg") },
  { nom: "E.Leclerc", coef: 1.0, emoji: "🏬", couleur: "#FFE4D6", logo: commons("E.Leclerc logo.svg") },
  { nom: "Auchan", coef: 1.0, emoji: "🏪", couleur: "#FFE0E6", logo: frwiki("Logo Auchan (2015).svg") },
  { nom: "Lidl", coef: 0.85, emoji: "💙", couleur: "#FFF3C4", logo: commons("Lidl-Logo.svg") },
  { nom: "Aldi", coef: 0.85, emoji: "💠", couleur: "#D6F5E3", logo: commons("AldiNord-WorldwideLogo.svg") },
  { nom: "Intermarché", coef: 1.0, emoji: "🛍️", couleur: "#E6E0FF", logo: commons("Intermarché logo 2009 classic.svg") },
  { nom: "Super U", coef: 1.0, emoji: "🅿️", couleur: "#D6ECFF", logo: frwiki("U commerçants logo 2018.svg") },
  { nom: "Grand Frais", coef: 1.25, emoji: "🥬", couleur: "#DFF5D0", logo: frwiki("Logo Grand Frais.svg") },
  { nom: "Franprix", coef: 1.25, emoji: "🏙️", couleur: "#FFE6F0", logo: commons("Logo Franprix - 2015.svg") },
];

export function coefMagasin(nom: string | null): number {
  const m = MAGASINS.find((x) => x.nom === nom);
  return m ? m.coef : 1.0;
}
