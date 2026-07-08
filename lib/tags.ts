import type { Tag } from "./types";

// Couleur pastel par tag (fond + texte).
export const TAG_STYLES: Record<Tag, { bg: string; text: string; label: string; emoji: string }> = {
  rapide: { bg: "#FDECC8", text: "#8A6100", label: "rapide", emoji: "⚡" },
  gourmand: { bg: "#FFE0C7", text: "#9A4A17", label: "gourmand", emoji: "😋" },
  protéiné: { bg: "#FBD5E4", text: "#9B2F5C", label: "protéiné", emoji: "💪" },
  healthy: { bg: "#CDEFD6", text: "#1D6B3B", label: "healthy", emoji: "🥗" },
  "du monde": { bg: "#E3D4F7", text: "#5B2E9E", label: "du monde", emoji: "🌍" },
  famille: { bg: "#D2E5FB", text: "#1E5AA8", label: "famille", emoji: "👨‍👩‍👧" },
};

export const AMBIANCES: { tag: Tag; label: string; emoji: string; bg: string }[] = [
  { tag: "rapide", label: "Rapide & facile", emoji: "⚡", bg: "#FDECC8" },
  { tag: "protéiné", label: "Riche en protéines", emoji: "💪", bg: "#FBD5E4" },
  { tag: "famille", label: "En famille", emoji: "👨‍👩‍👧", bg: "#D2E5FB" },
  { tag: "healthy", label: "Healthy", emoji: "🥗", bg: "#CDEFD6" },
  { tag: "gourmand", label: "Gourmand", emoji: "😋", bg: "#FFE0C7" },
  { tag: "du monde", label: "Saveurs du monde", emoji: "🌍", bg: "#E3D4F7" },
];
