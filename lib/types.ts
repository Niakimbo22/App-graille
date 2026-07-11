export type Tag =
  | "rapide"
  | "gourmand"
  | "protéiné"
  | "healthy"
  | "famille"
  | "du monde";

export type Regime = "vegetarien" | "pescetarien" | "sans-gluten" | "sans-lactose";

export type Equipement = "four" | "plaque" | "airfryer";

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
}

/** Réponses collectées au fil du funnel. */
export interface FunnelState {
  magasin: string | null;
  budget: number;
  regimes: Regime[];
  ambiances: Tag[];
  personnes: number;
  equipement: Equipement[];
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
}

export interface MiamState {
  funnel: FunnelState;
  plan: Plan | null;
  /** ids d'articles cochés dans la liste de courses (clé = rayon::nom) */
  cochees: string[];
}
