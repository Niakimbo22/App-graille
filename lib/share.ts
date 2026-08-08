import type { ModeRepas, Plan, Recipe, Rayon } from "./types";
import type { ShoppingArticle } from "./shopping";
import { euros, formatQte } from "./format";
import { joursPourPlats, modeInfo } from "./repas";

// ── Encodage d'un plan dans une URL (aucun backend : tout tient dans le lien) ──

const MODES: ModeRepas[] = ["diner", "restes", "double"];

export interface SharedPlan {
  ids: string[];
  personnes: number;
  magasin: string;
  /** mode de journée du plan partagé ; "diner" pour les anciens liens */
  mode: ModeRepas;
}

function toBase64Url(json: string): string {
  const b64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(data: string): string {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  return typeof window !== "undefined"
    ? decodeURIComponent(escape(window.atob(padded)))
    : Buffer.from(padded, "base64").toString("utf8");
}

/** Encode un plan (recettes + personnes + magasin) dans un fragment compact pour l'URL. */
export function encodePlan(plan: Plan): string {
  const payload: SharedPlan = {
    ids: plan.items.map((i) => i.recipeId),
    personnes: plan.personnes,
    magasin: plan.magasin,
    mode: plan.modeRepas ?? "diner",
  };
  return toBase64Url(JSON.stringify(payload));
}

/** Décode un plan partagé ; renvoie null si le lien est invalide ou corrompu. */
export function decodePlan(data: string): SharedPlan | null {
  try {
    const parsed = JSON.parse(fromBase64Url(data));
    if (!Array.isArray(parsed.ids) || parsed.ids.some((x: unknown) => typeof x !== "string")) return null;
    if (typeof parsed.personnes !== "number" || parsed.personnes < 1 || parsed.personnes > 12) return null;
    if (typeof parsed.magasin !== "string") return null;
    // liens antérieurs au mode de journée : dîner seul
    const mode: ModeRepas = MODES.includes(parsed.mode) ? parsed.mode : "diner";
    return { ids: parsed.ids.slice(0, 14), personnes: parsed.personnes, magasin: parsed.magasin, mode };
  } catch {
    return null;
  }
}

/** URL absolue vers une page de l'app (tient compte du basePath GitHub Pages). */
export function shareUrl(path: string, params?: Record<string, string>): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return `${origin}${prefix}${path}${qs}`;
}

// ── Textes formatés pour le partage (SMS, WhatsApp, presse-papiers…) ──────────

export function recipeShareText(recipe: Recipe, personnes: number): string {
  return [
    `${recipe.emoji} ${recipe.nom}`,
    `${recipe.tempsMin} min · ${euros(recipe.prixParPersonne)}/pers`,
    "",
    `Ingrédients (${personnes} pers) :`,
    ...recipe.ingredients.map((i) => `• ${formatQte(i.qteParPersonne, personnes, i.unite)} ${i.nom}`),
    "",
    "Préparation :",
    ...recipe.etapes.map((e, i) => `${i + 1}. ${e}`),
    "",
    "via Miam 🥗",
  ].join("\n");
}

export function planShareText(
  items: { recipe: Recipe }[],
  personnes: number,
  total: number,
  magasin: string,
  mode: ModeRepas = "diner"
): string {
  const info = modeInfo(mode);
  const jours = joursPourPlats(items.length, mode);
  return [
    "🥗 Mon plan de la semaine — Miam",
    `${items.length} plats · ${jours} jour${jours > 1 ? "s" : ""} · ${personnes} pers · ${magasin}`,
    `${info.emoji} ${info.resume}`,
    "",
    ...items.map((it, i) => `${i + 1}. ${it.recipe.emoji} ${it.recipe.nom}`),
    "",
    `Total estimé : ${euros(total)}`,
  ].join("\n");
}

export function shoppingListShareText(
  parRayon: { rayon: Rayon; articles: ShoppingArticle[] }[],
  total: number
): string {
  const lines = ["🛒 Ma liste de courses — Miam", ""];
  for (const g of parRayon) {
    lines.push(`${g.rayon} :`);
    for (const a of g.articles) lines.push(`• ${formatQte(a.qte, 1, a.unite)} ${a.nom}`);
    lines.push("");
  }
  lines.push(`Total : ${euros(total)}`);
  return lines.join("\n");
}

export function appShareText(): string {
  return [
    "🥗 Miam — plan de repas de la semaine",
    "Une appli gratuite qui compose ton menu de la semaine selon ton budget et te sort la liste de courses.",
    "Sans compte, sans pub, ça marche même hors connexion une fois installée.",
  ].join("\n");
}

// ── Partage natif (Web Share API) avec repli presse-papiers ───────────────────

export interface ShareInput {
  title: string;
  text: string;
  url?: string;
}

export type ShareResult = "shared" | "copied" | "failed";

export async function shareOrCopy(input: ShareInput): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(input);
      return "shared";
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "failed";
      // en échec du partage natif, on retente via le presse-papiers ci-dessous
    }
  }
  const full = [input.text, input.url].filter(Boolean).join("\n\n");
  try {
    await navigator.clipboard.writeText(full);
    return "copied";
  } catch {
    return "failed";
  }
}
