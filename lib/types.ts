export type Tag =
  | "rapide"
  | "gourmand"
  | "protéiné"
  | "healthy"
  | "famille"
  | "du monde";

export type Regime =
  | "vegetarien"
  | "pescetarien"
  | "halal"
  | "sans-gluten"
  | "sans-lactose"
  | "sans-sucre"
  | "indice-glycemique-bas";

export type Equipement = "four" | "plaque" | "airfryer";

/**
 * Ce qu'il faut couvrir dans une journée :
 * - "diner"  : un plat le soir (défaut historique) ;
 * - "restes" : un plat le soir cuisiné en double, la part du midi part en boîte ;
 * - "double" : deux plats différents dans la journée (midi + soir).
 */
export type ModeRepas = "diner" | "restes" | "double";

/**
 * Envies de protéines : catégories que l'utilisateur veut manger *davantage*.
 * Les clés correspondent aux catégories renvoyées par `proteinCategory()`
 * pour se brancher directement sur l'algorithme de sélection.
 */
export type ProteinPref = "volaille" | "rouge" | "poisson" | "porc" | "vegetal" | "oeuf";

export type Rayon =
  | "Fruits & Légumes"
  | "Boucherie/Poisson"
  | "Crèmerie"
  | "Épicerie salée"
  | "Épicerie sucrée"
  | "Surgelés"
  | "Boulangerie";

export interface Ingredient {
  nom: string;
  qteParPersonne: number;
  unite: string;
  rayon: Rayon;
  prixParPersonne: number;
}

export interface Macros {
  proteines: number;
  glucides: number;
  lipides: number;
}

export interface Recipe {
  id: string;
  nom: string;
  tempsMin: number;
  tags: Tag[];
  regimes: Regime[];
  allergenes: string[];
  equipement: Equipement[];
  prixParPersonne: number;
  kcal: number;
  macros: Macros;
  emoji: string;
  ingredients: Ingredient[];
  etapes: string[];
  /** "fr" = recette française curée (défaut), "monde" = importée (TheMealDB) */
  origine?: "fr" | "monde";
  /** true si le prix est une estimation (recettes importées, mesures approximées) */
  prixEstime?: boolean;
  /** crédit source pour les recettes importées */
  source?: string;
  /** vraie photo du plat (Wikimedia Commons, Special:FilePath) — fallback emoji si absente ou en échec */
  photo?: string;
}

/** Réponses collectées au fil du funnel. */
export interface FunnelState {
  magasin: string | null;
  budget: number;
  regimes: Regime[];
  ambiances: Tag[];
  personnes: number;
  /** nombre de jours à couvrir. Défaut: 5 */
  nbRepas: number;
  /** ce qu'on couvre dans la journée : dîner seul, dîner + restes, ou midi et soir. Défaut: "diner" */
  modeRepas: ModeRepas;
  equipement: Equipement[];
  /** envies de protéines à privilégier (ex: manger plus de poulet). Défaut: [] */
  preferences: ProteinPref[];
  /** privilégier les recettes aux fruits & légumes de saison. Défaut: false */
  saison?: boolean;
  /** inclure les recettes du monde importées (prix estimés). Défaut: false */
  inclureMonde?: boolean;
}

export interface PlanItem {
  recipeId: string;
  /** prix total de la recette pour le nb de personnes, coef magasin inclus */
  prixTotal: number;
}

export interface Plan {
  items: PlanItem[];
  magasin: string;
  personnes: number;
  budget: number;
  coutEstime: number;
  /** graine du tirage, utile pour "régénérer" */
  seed: number;
  /** mode de la journée au moment de la génération. Absent = ancien plan → "diner" */
  modeRepas?: ModeRepas;
  /** nombre de jours couverts (en mode "double", 2 plats par jour) */
  nbJours?: number;
}

export interface MiamState {
  funnel: FunnelState;
  plan: Plan | null;
  /** ids d'articles cochés dans la liste de courses (clé = rayon::nom) */
  cochees: string[];
}
