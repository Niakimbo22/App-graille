"use client";

import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { euros } from "@/lib/format";
import { recetteDeSaison } from "@/lib/saison";
import TagPill from "./TagPill";
import RecipePhoto from "./RecipePhoto";

interface Props {
  recipe: Recipe;
  jour?: string;
  /** créneau du plat : « midi », « soir », « dîner + boîte du midi »… */
  moment?: string;
  prixTotal?: number;
  personnes?: number;
  href?: string;
}

export default function RecipeCard({ recipe, jour, moment, prixTotal, personnes, href }: Props) {
  const deSaison = recetteDeSaison(recipe);
  const body = (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft transition active:scale-[0.99]">
      {jour && (
        <div className="flex items-center justify-between gap-2 bg-forest px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
          <span>{jour}</span>
          {moment && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs normal-case tracking-normal">
              {moment}
            </span>
          )}
        </div>
      )}
      <RecipePhoto recipe={recipe} className="h-36" emojiClassName="text-6xl">
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
      </RecipePhoto>
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
