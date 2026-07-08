"use client";

import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { gradientFor } from "@/lib/gradient";
import { euros } from "@/lib/format";
import TagPill from "./TagPill";

interface Props {
  recipe: Recipe;
  jour?: string;
  prixTotal?: number;
  personnes?: number;
  href?: string;
}

export default function RecipeCard({ recipe, jour, prixTotal, personnes, href }: Props) {
  const body = (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft transition active:scale-[0.99]">
      {jour && (
        <div className="bg-forest px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
          {jour}
        </div>
      )}
      <div className="flex items-center justify-center py-7 text-6xl" style={{ background: gradientFor(recipe.id) }}>
        {recipe.emoji}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold leading-snug text-forest">{recipe.nom}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black/60">
          {prixTotal != null && <span className="font-bold text-forest">{euros(prixTotal)}</span>}
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
