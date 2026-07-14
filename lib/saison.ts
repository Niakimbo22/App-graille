import type { Recipe } from "./types";

/**
 * Calendrier des fruits & légumes de saison en France.
 *
 * `mois` liste les mois de PLEINE saison (1 = janvier … 12 = décembre) où le
 * produit est cultivé/récolté en France métropolitaine. Ce n'est pas une vérité
 * absolue (ça varie selon les régions et les serres) mais une estimation utile
 * pour composer un menu de saison, plus économique et plus savoureux.
 *
 * `annee: true` marque les produits disponibles toute l'année en France, soit
 * parce qu'ils se conservent longtemps (oignon, ail, pomme de terre, carotte),
 * soit parce qu'ils sont vendus séchés/importés en continu (gingembre, citron).
 * Ils ne sont jamais comptés « hors saison » mais n'apparaissent pas dans la
 * liste des nouveautés du mois.
 */
export type CategorieSaison = "legume" | "fruit" | "herbe";

export interface ProduitSaison {
  nom: string;
  emoji: string;
  categorie: CategorieSaison;
  /** mois de pleine saison en France (1-12) */
  mois: number[];
  /** disponible toute l'année (conservation ou import continu) */
  annee?: boolean;
  /** autres orthographes rencontrées dans les recettes */
  alias?: string[];
}

const TOUS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CALENDRIER: ProduitSaison[] = [
  // ---------- LÉGUMES ----------
  { nom: "ail", emoji: "🧄", categorie: "legume", mois: TOUS, annee: true },
  { nom: "asperge", emoji: "🌱", categorie: "legume", mois: [4, 5, 6] },
  { nom: "aubergine", emoji: "🍆", categorie: "legume", mois: [6, 7, 8, 9, 10] },
  { nom: "betterave", emoji: "🟣", categorie: "legume", mois: [1, 2, 9, 10, 11, 12] },
  { nom: "blette", emoji: "🥬", categorie: "legume", mois: [4, 5, 6, 7, 8, 9, 10] },
  { nom: "brocoli", emoji: "🥦", categorie: "legume", mois: [6, 7, 8, 9, 10, 11] },
  { nom: "carotte", emoji: "🥕", categorie: "legume", mois: TOUS, annee: true },
  { nom: "céleri", emoji: "🥬", categorie: "legume", mois: [1, 2, 3, 8, 9, 10, 11, 12] },
  {
    nom: "champignon",
    emoji: "🍄",
    categorie: "legume",
    mois: TOUS,
    annee: true,
    alias: ["champignons", "champignons de paris", "champignon de paris"],
  },
  { nom: "chou", emoji: "🥬", categorie: "legume", mois: [1, 2, 3, 4, 9, 10, 11, 12] },
  { nom: "chou rouge", emoji: "🥬", categorie: "legume", mois: [1, 2, 9, 10, 11, 12] },
  { nom: "chou-fleur", emoji: "🥦", categorie: "legume", mois: [1, 2, 3, 4, 9, 10, 11, 12] },
  {
    nom: "chou chinois",
    emoji: "🥬",
    categorie: "legume",
    mois: [1, 2, 10, 11, 12],
    alias: ["pak choï", "pak choi", "pack choi"],
  },
  { nom: "concombre", emoji: "🥒", categorie: "legume", mois: [5, 6, 7, 8, 9] },
  {
    nom: "courge butternut",
    emoji: "🎃",
    categorie: "legume",
    mois: [1, 9, 10, 11, 12],
    alias: ["butternut", "courge"],
  },
  { nom: "courgette", emoji: "🥒", categorie: "legume", mois: [5, 6, 7, 8, 9] },
  { nom: "échalote", emoji: "🧅", categorie: "legume", mois: TOUS, annee: true },
  { nom: "endive", emoji: "🥬", categorie: "legume", mois: [1, 2, 3, 4, 10, 11, 12], alias: ["endives"] },
  {
    nom: "épinard",
    emoji: "🥬",
    categorie: "legume",
    mois: [3, 4, 5, 9, 10, 11],
    alias: ["épinards", "épinards frais", "épinard frais"],
  },
  { nom: "fenouil", emoji: "🌿", categorie: "legume", mois: [6, 7, 8, 9, 10] },
  { nom: "haricot vert", emoji: "🫛", categorie: "legume", mois: [6, 7, 8, 9], alias: ["haricots verts"] },
  { nom: "navet", emoji: "🥬", categorie: "legume", mois: [1, 2, 3, 10, 11, 12] },
  { nom: "oignon", emoji: "🧅", categorie: "legume", mois: TOUS, annee: true },
  { nom: "oignon rouge", emoji: "🧅", categorie: "legume", mois: TOUS, annee: true },
  { nom: "oignon nouveau", emoji: "🧅", categorie: "legume", mois: [4, 5, 6] },
  { nom: "petit pois", emoji: "🟢", categorie: "legume", mois: [5, 6, 7], alias: ["petits pois"] },
  { nom: "poireau", emoji: "🥬", categorie: "legume", mois: [1, 2, 3, 4, 9, 10, 11, 12] },
  { nom: "poivron", emoji: "🫑", categorie: "legume", mois: [7, 8, 9, 10] },
  {
    nom: "pomme de terre",
    emoji: "🥔",
    categorie: "legume",
    mois: TOUS,
    annee: true,
    alias: ["pommes de terre"],
  },
  { nom: "potiron", emoji: "🎃", categorie: "legume", mois: [1, 9, 10, 11, 12], alias: ["citrouille"] },
  { nom: "radis", emoji: "🌶️", categorie: "legume", mois: [3, 4, 5, 6, 7, 8, 9] },
  { nom: "roquette", emoji: "🥬", categorie: "legume", mois: [4, 5, 6, 7, 8, 9, 10] },
  {
    nom: "salade",
    emoji: "🥗",
    categorie: "legume",
    mois: [4, 5, 6, 7, 8, 9, 10],
    alias: ["salade romaine", "laitue", "batavia"],
  },
  {
    nom: "tomate",
    emoji: "🍅",
    categorie: "legume",
    mois: [6, 7, 8, 9],
    alias: ["tomates", "tomate cerise", "tomates cerises"],
  },

  // ---------- FRUITS ----------
  { nom: "abricot", emoji: "🍑", categorie: "fruit", mois: [6, 7, 8] },
  { nom: "avocat", emoji: "🥑", categorie: "fruit", mois: TOUS, annee: true },
  { nom: "cerise", emoji: "🍒", categorie: "fruit", mois: [5, 6, 7] },
  { nom: "citron", emoji: "🍋", categorie: "fruit", mois: TOUS, annee: true },
  { nom: "citron vert", emoji: "🍋", categorie: "fruit", mois: TOUS, annee: true },
  { nom: "clémentine", emoji: "🍊", categorie: "fruit", mois: [1, 11, 12], alias: ["clémentines", "mandarine"] },
  { nom: "figue", emoji: "🫐", categorie: "fruit", mois: [8, 9, 10] },
  { nom: "fraise", emoji: "🍓", categorie: "fruit", mois: [5, 6, 7], alias: ["fraises"] },
  { nom: "framboise", emoji: "🫐", categorie: "fruit", mois: [6, 7, 8, 9], alias: ["framboises"] },
  { nom: "kiwi", emoji: "🥝", categorie: "fruit", mois: [1, 2, 3, 4, 10, 11, 12] },
  { nom: "melon", emoji: "🍈", categorie: "fruit", mois: [6, 7, 8, 9] },
  { nom: "myrtille", emoji: "🫐", categorie: "fruit", mois: [7, 8], alias: ["myrtilles"] },
  { nom: "orange", emoji: "🍊", categorie: "fruit", mois: [1, 2, 3, 11, 12] },
  { nom: "pastèque", emoji: "🍉", categorie: "fruit", mois: [7, 8, 9] },
  { nom: "pêche", emoji: "🍑", categorie: "fruit", mois: [6, 7, 8, 9], alias: ["nectarine", "brugnon"] },
  { nom: "poire", emoji: "🍐", categorie: "fruit", mois: [1, 2, 8, 9, 10, 11, 12] },
  { nom: "pomme", emoji: "🍎", categorie: "fruit", mois: [1, 2, 3, 4, 9, 10, 11, 12] },
  { nom: "prune", emoji: "🍑", categorie: "fruit", mois: [7, 8, 9], alias: ["mirabelle", "quetsche"] },
  { nom: "raisin", emoji: "🍇", categorie: "fruit", mois: [8, 9, 10] },
  { nom: "rhubarbe", emoji: "🌿", categorie: "fruit", mois: [4, 5, 6] },

  // ---------- HERBES & AROMATES (dispo toute l'année) ----------
  { nom: "aneth", emoji: "🌿", categorie: "herbe", mois: TOUS, annee: true },
  { nom: "basilic", emoji: "🌿", categorie: "herbe", mois: [5, 6, 7, 8, 9] },
  { nom: "citronnelle", emoji: "🌿", categorie: "herbe", mois: TOUS, annee: true },
  { nom: "coriandre", emoji: "🌿", categorie: "herbe", mois: TOUS, annee: true },
  { nom: "gingembre", emoji: "🫚", categorie: "herbe", mois: TOUS, annee: true },
  { nom: "menthe", emoji: "🌿", categorie: "herbe", mois: [5, 6, 7, 8, 9], annee: true },
  { nom: "persil", emoji: "🌿", categorie: "herbe", mois: TOUS, annee: true },
];

export const MOIS_LABELS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Enlève les accents et normalise pour la recherche. */
function normalise(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Index normalisé (nom canonique + alias) → produit.
const INDEX = new Map<string, ProduitSaison>();
for (const p of CALENDRIER) {
  INDEX.set(normalise(p.nom), p);
  for (const a of p.alias ?? []) INDEX.set(normalise(a), p);
}

/** Mois courant (1-12). */
export function moisCourant(): number {
  return new Date().getMonth() + 1;
}

/** Retrouve le produit du calendrier correspondant à un nom d'ingrédient. */
export function produitPour(nom: string): ProduitSaison | null {
  const n = normalise(nom);
  const direct = INDEX.get(n);
  if (direct) return direct;
  // repli : cherche un nom canonique contenu dans l'ingrédient
  // (ex : "sauce tomate maison" → tomate). On évite les faux positifs courts.
  for (const [cle, prod] of INDEX) {
    if (cle.length >= 4 && n.includes(cle)) return prod;
  }
  return null;
}

/**
 * Un ingrédient est-il de saison ?
 * - `true`  : produit connu, de saison ce mois-ci (ou dispo toute l'année)
 * - `false` : produit connu mais hors saison
 * - `null`  : produit inconnu du calendrier (neutre)
 */
export function estDeSaison(nom: string, mois: number = moisCourant()): boolean | null {
  const p = produitPour(nom);
  if (!p) return null;
  if (p.annee) return true;
  return p.mois.includes(mois);
}

export interface SaisonRecette {
  /** nb d'ingrédients F&L analysables (connus et à saisonnalité marquée) */
  analysables: number;
  /** nb de ces ingrédients qui sont de saison */
  deSaison: number;
  /** noms des ingrédients hors saison */
  horsSaison: string[];
  /** part de saison (0-1) ; 1 si aucun ingrédient analysable */
  ratio: number;
  /** true si la recette n'utilise aucun F&L hors saison */
  ok: boolean;
}

/**
 * Analyse la saisonnalité d'une recette : ne regarde que les ingrédients du
 * rayon Fruits & Légumes, et ignore ceux disponibles toute l'année (ail,
 * oignon…) ainsi que ceux absents du calendrier.
 */
export function saisonnaliteRecette(recipe: Recipe, mois: number = moisCourant()): SaisonRecette {
  let analysables = 0;
  let deSaison = 0;
  const horsSaison: string[] = [];

  for (const ing of recipe.ingredients) {
    if (ing.rayon !== "Fruits & Légumes") continue;
    const p = produitPour(ing.nom);
    if (!p || p.annee) continue; // inconnu ou dispo toute l'année → neutre
    analysables++;
    if (p.mois.includes(mois)) deSaison++;
    else horsSaison.push(ing.nom);
  }

  const ratio = analysables === 0 ? 1 : deSaison / analysables;
  return { analysables, deSaison, horsSaison, ratio, ok: horsSaison.length === 0 };
}

/** True si la recette met en avant au moins un F&L de saison, sans hors-saison. */
export function recetteDeSaison(recipe: Recipe, mois: number = moisCourant()): boolean {
  const s = saisonnaliteRecette(recipe, mois);
  return s.ok && s.deSaison > 0;
}

/** Produits phares du mois (hors « toute l'année »), pour l'affichage. */
export function produitsDuMois(
  mois: number = moisCourant(),
  categorie?: CategorieSaison
): ProduitSaison[] {
  return CALENDRIER.filter(
    (p) => !p.annee && p.mois.includes(mois) && (!categorie || p.categorie === categorie)
  );
}
