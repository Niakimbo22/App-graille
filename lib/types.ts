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
}

/** Réponses collectées au fil du funnel. */
export interface FunnelState {
  magasin: string | null;
  budget: number;
  regimes: Regime[];
  ambiances: Tag[];
  personnes: number;
  equipement: Equipement[];
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
