import { fourchette, fourchetteDetail, fourchetteLisible } from "@/lib/fourchette";
import { majLisible } from "@/lib/prices";

interface Props {
  /** total estimé du panier (€) */
  total: number;
  /** part du total venant du placard (épices, huile, farine…) */
  placard?: number;
  /** enseigne choisie, pour rappeler que le coefficient est déjà appliqué */
  magasin?: string | null;
  /** "bloc" sous un gros montant, "ligne" en note discrète */
  variant?: "bloc" | "ligne";
  /** variante "ligne" : rappel de ce que chiffre la fourchette, ex. "≈ 15,39 € pour 2 pers" */
  label?: string;
  className?: string;
}

/**
 * Avertissement affiché partout où Miam annonce un prix : le montant est une
 * estimation, et voici la fourchette dans laquelle il tombe vraiment.
 */
export default function PriceNote({
  total,
  placard = 0,
  magasin,
  variant = "bloc",
  label,
  className = "",
}: Props) {
  const f = fourchette(total, placard);

  if (variant === "ligne") {
    return (
      <p className={`text-[11px] leading-tight text-black/40 ${className}`}>
        {label ? `${label} · ` : ""}prix estimé, compte {fourchetteLisible(f)} selon ton magasin
        et les promos
      </p>
    );
  }

  return (
    <div className={`rounded-2xl bg-sun/15 px-3.5 py-3 ${className}`}>
      <p className="text-sm font-bold text-forest">
        ⚠️ prix estimé — compte {fourchetteLisible(f)}
      </p>
      <p className="mt-1 text-xs leading-snug text-forest/70">
        {fourchetteDetail(f)}.
      </p>
      <p className="mt-1.5 text-[11px] leading-tight text-black/40">
        moyennes supermarché France · maj {majLisible()}
        {magasin ? ` · ajustées pour ${magasin}` : ""}
      </p>
    </div>
  );
}
