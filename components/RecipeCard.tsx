"use client";

import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { gradientFor } from "@/lib/gradient";
import { euros } from "@/lib/format";
import { recetteDeSaison } from "@/lib/saison";
import TagPill from "./TagPill";

interface Props {
  recipe: Recipe;
  jour?: string;
  prixTotal?: number;
  personnes?: number;
  href?: string;
}

export default function RecipeCard({ recipe, jour, prixTotal, personnes, href }: Props) {
  const deSaison = recetteDeSaison(recipe);
  const body = (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft transition active:scale-[0.99]">
      {jour && (
        <div className="bg-forest px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
          {jour}
        </div>
      )}
      <div className="relative flex items-center justify-center py-7 text-6xl" style={{ background: gradientFor(recipe.id) }}>
        {recipe.emoji}
        {recipe.origine === "monde" && (
          <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-bold text-forest shadow-soft">
            🌍 du monde
          </span>
        )}
        {deSaison && (
          <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-bold text-leaf shadow-soft">
            🌱 de saison
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold leading-snug text-forest">{recipe.nom}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black/60">
          {prixTotal != null && (
            <span className="font-bold text-forest">
              {euros(prixTotal)}
              {recipe.prixEstime && <span className="font-normal text-black/40"> ≈</span>}
            </span>
          )}
          <span>⏱ {recipe.tempsMin} min</span>
          {personnes != null && <span>👤 {personnes}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.tags.map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
