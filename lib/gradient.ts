// Dégradé pastel déterministe généré depuis le hash de l'id d'une recette.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function gradientFor(id: string): string {
  const h = hash(id);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 40)) % 360;
  const c1 = `hsl(${hue1}, 70%, 88%)`;
  const c2 = `hsl(${hue2}, 65%, 80%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}
