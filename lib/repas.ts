import type { ModeRepas, Recipe } from "./types";

/**
 * Modes de journée : « juste le dîner », « dîner + restes le midi » (on cuisine
 * en double et la part du lendemain part en boîte) et « midi et soir » (deux
 * plats différents dans la même journée).
 *
 * Deux leviers en découlent :
 * - le nombre de plats à composer   → `platsPourJours()`
 * - le nombre de parts à acheter    → `portionsAcheter()`
 */

export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export interface ModeInfo {
  id: ModeRepas;
  emoji: string;
  titre: string;
  desc: string;
  /** résumé court affiché sur la page plan */
  resume: string;
}

export const MODES_REPAS: ModeInfo[] = [
  {
    id: "diner",
    emoji: "🌙",
    titre: "juste le dîner",
    desc: "un plat par jour, le soir.",
    resume: "un dîner par jour",
  },
  {
    id: "restes",
    emoji: "🥡",
    titre: "dîner + restes le midi",
    desc: "on cuisine en double : la part du midi part en boîte le lendemain.",
    resume: "dîners cuisinés en double, midi en boîte",
  },
  {
    id: "double",
    emoji: "🍽️",
    titre: "midi et soir",
    desc: "deux plats différents dans la journée, jamais deux fois la même chose.",
    resume: "deux plats différents par jour",
  },
];

export function modeInfo(mode: ModeRepas | undefined): ModeInfo {
  return MODES_REPAS.find((m) => m.id === mode) ?? MODES_REPAS[0];
}

/** Nombre de plats à cuisiner pour couvrir `nbJours` (2 par jour en mode « midi et soir »). */
export function platsPourJours(nbJours: number, mode: ModeRepas | undefined): number {
  return mode === "double" ? nbJours * 2 : nbJours;
}

/** Nombre de jours couverts par un plan de `nbPlats` plats. */
export function joursPourPlats(nbPlats: number, mode: ModeRepas | undefined): number {
  return mode === "double" ? Math.ceil(nbPlats / 2) : nbPlats;
}

/** Facteur appliqué aux quantités : en mode restes, on cuisine (et on achète) le double. */
export function facteurPortions(mode: ModeRepas | undefined): number {
  return mode === "restes" ? 2 : 1;
}

/** Nombre de parts à prévoir par plat, une fois le mode pris en compte. */
export function portionsAcheter(personnes: number, mode: ModeRepas | undefined): number {
  return personnes * facteurPortions(mode);
}

export type Creneau = "diner" | "midi" | "soir";

export interface CreneauPlat {
  /** jour de la semaine (lundi, mardi…) */
  jour: string;
  /** créneau logique, utilisé par l'algorithme */
  creneau: Creneau;
  /** libellé affiché sur la carte recette */
  moment: string;
}

/** Créneau de chaque plat du plan, dans l'ordre. */
export function creneauxPlan(nbPlats: number, mode: ModeRepas | undefined): CreneauPlat[] {
  return Array.from({ length: nbPlats }, (_, i) => {
    if (mode === "double") {
      const midi = i % 2 === 0;
      return {
        jour: JOURS[Math.floor(i / 2) % JOURS.length],
        creneau: midi ? ("midi" as const) : ("soir" as const),
        moment: midi ? "midi" : "soir",
      };
    }
    return {
      jour: JOURS[i % JOURS.length],
      creneau: "diner" as const,
      moment: mode === "restes" ? "dîner + boîte du midi" : "dîner",
    };
  });
}

// ── Plats qui se réchauffent (ou se mangent froids) le lendemain ──────────────

// Mijotés, gratins, soupes, plats à base de céréales/légumineuses, salades
// composées froides : tout ce qui est meilleur — ou au moins aussi bon — réchauffé
// ou sorti du frigo le lendemain midi.
const RESTES_OUI =
  /(mijot|curry|chili|dahl|dal\b|tajine|gratin|soupe|veloute|lasagne|bolognaise|blanquette|bourguignon|parmentier|hachis|pot-au-feu|couscous|boulettes|risotto|pilaf|riz|quinoa|boulgour|semoule|taboule|lentille|pois chiche|haricot|ratatouille|tian|farci|crumble|quiche|tarte|frittata|tortilla|chakchouka|shakshuka|biryani|yassa|paella|minestrone|stroganoff|moussaka|one-pot|bowl|roti|saute de porc|chou)/;

// À l'inverse : fritures, pains garnis, œufs coulants, panures et poêlées
// croustillantes ne survivent pas à une nuit au frigo.
const RESTES_NON =
  /(frite|nugget|croque|croquette|gaufre|pancake|cesar|bruschetta|tartine|sandwich|pizza|burger|wrap|tacos|kebab|omelette|oeufs? cocotte|galette|panure|milanaise|cordon bleu|mi-cuit|moules|nems|poche)/;

function sansAccents(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/** Vrai si le plat se garde bien pour le lendemain (batch cooking / boîte à emporter). */
export function seConserveBien(recipe: Recipe): boolean {
  const nom = sansAccents(recipe.nom);
  if (RESTES_NON.test(nom)) return false;
  if (RESTES_OUI.test(nom)) return true;
  // repli : le nom ne dit rien, on regarde les ingrédients de fond (céréales,
  // légumineuses, sauce) qui tiennent bien une nuit.
  const ings = recipe.ingredients.map((i) => sansAccents(i.nom)).join(" ");
  return /(lentille|pois chiche|haricot|riz|quinoa|boulgour|semoule|polenta|tomates concassees|sauce tomate|lait de coco)/.test(
    ings
  );
}
