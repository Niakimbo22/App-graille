export function euros(n: number): string {
  return (
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Quantité ajustée au nombre de personnes, avec unité. */
export function formatQte(qteParPersonne: number, personnes: number, unite: string): string {
  const total = qteParPersonne * personnes;
  const rounded = Math.round(total * 100) / 100;
  const value = Number.isInteger(rounded) ? rounded.toString() : rounded.toString().replace(".", ",");
  return `${value} ${unite}`.trim();
}
