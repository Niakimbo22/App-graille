import type { Plan } from "./types";

// ── Profils locaux (pas de vrais comptes : tout reste dans le localStorage) ───

export interface SemaineFavorite {
  id: string;
  nom: string;
  creeLe: string; // ISO
  /** copie complète du plan au moment de la sauvegarde */
  plan: Plan;
}

export interface Profil {
  id: string;
  pseudo: string;
  avatar: string; // emoji
  creeLe: string; // ISO
  semaines: SemaineFavorite[];
  /** ids des recettes favorites */
  plats: string[];
}

export const AVATARS = ["🦊", "🐻", "🐸", "🐱", "🐼", "🦁", "🐙", "🦄", "🐝", "🐧", "🍓", "🥑"];

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function nomSemaine(date = new Date()): string {
  return `semaine du ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

/** Deux plans sont "les mêmes" si mêmes recettes dans le même ordre, mêmes personnes et magasin. */
export function memePlan(a: Plan, b: Plan): boolean {
  return (
    a.personnes === b.personnes &&
    a.magasin === b.magasin &&
    a.items.length === b.items.length &&
    a.items.every((it, i) => it.recipeId === b.items[i].recipeId)
  );
}
