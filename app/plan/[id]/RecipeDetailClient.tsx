"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { RECIPES, getRecipe } from "@/lib/recipes";
import { coutPanier, swapRecipe } from "@/lib/planner";
import { coefMagasin } from "@/lib/stores";
import { euros, formatQte } from "@/lib/format";
import { rayonEmoji } from "@/lib/shopping";
import { estDeSaison } from "@/lib/saison";
import { besoinHalal } from "@/lib/planner";
import { recipeShareText, shareUrl } from "@/lib/share";
import TagPill from "@/components/TagPill";
import PillButton from "@/components/PillButton";
import PriceNote from "@/components/PriceNote";
import ShareButton from "@/components/ShareButton";
import FavoriteHeart from "@/components/FavoriteHeart";
import RecipePhoto from "@/components/RecipePhoto";
import type { Rayon } from "@/lib/types";

export default function RecipeDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { state, setPlan, hydrated } = useMiam();
  const recipe = getRecipe(id);

  if (!recipe) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-forest">recette introuvable</p>
        <PillButton onClick={() => router.push("/plan")}>retour au plan</PillButton>
      </main>
    );
  }

  const plan = state.plan;
  const personnes = plan?.personnes ?? state.funnel.personnes;
  const coef = coefMagasin(plan?.magasin ?? state.funnel.magasin);
  const indexInPlan = plan ? plan.items.findIndex((i) => i.recipeId === id) : -1;

  const macros = recipe.macros;
  const macroTotal = macros.proteines + macros.glucides + macros.lipides || 1;

  // Prix affiché : la part de liste de courses imputée à ce plat quand il fait
  // partie du plan (les paquets partagés avec les autres dîners sont répartis).
  // Hors plan, c'est le panier de ce seul plat : tout est acheté rien que pour lui.
  const prixDuPlat =
    indexInPlan >= 0 && plan
      ? plan.items[indexInPlan].prixTotal
      : coutPanier([recipe], personnes, coef);
  const prixParPers = Math.round((prixDuPlat / Math.max(1, personnes)) * 100) / 100;

  const handleSwap = () => {
    if (!plan || indexInPlan < 0) return;
    const usedIds = plan.items.map((i) => i.recipeId);
    // le swap renvoie le plan entier ré-chiffré : changer un plat rebat le panier
    const swap = swapRecipe(RECIPES, state.funnel, coef, id, usedIds);
    if (!swap) return;
    setPlan({ ...plan, items: swap.items, coutEstime: swap.coutEstime });
    router.replace(`/plan/${swap.recipeId}`);
  };

  const MacroBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex-1 text-center">
      <div className="mx-auto mb-2 flex h-24 w-full items-end justify-center rounded-2xl bg-black/5">
        <div
          className="w-full rounded-2xl transition-all"
          style={{ height: `${Math.max(12, (value / macroTotal) * 100)}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-lg font-extrabold text-forest">{value}g</p>
      <p className="text-xs text-black/50">{label}</p>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-md pb-28">
      {/* Header */}
      <RecipePhoto recipe={recipe} className="h-56" emojiClassName="text-8xl">
        <button
          onClick={() => router.push("/plan")}
          className="absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl text-forest shadow-soft"
        >
          ←
        </button>
        <FavoriteHeart
          recipeId={recipe.id}
          className="absolute right-[4.5rem] top-[max(1.25rem,env(safe-area-inset-top))]"
        />
        <ShareButton
          variant="icon"
          className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))]"
          title={recipe.nom}
          text={recipeShareText(recipe, personnes)}
          url={shareUrl(`/plan/${recipe.id}/`)}
        />
      </RecipePhoto>

      <div className="px-5">
        <div className="-mt-6 rounded-3xl bg-white p-5 shadow-soft">
          <h1 className="text-2xl font-extrabold text-forest">{recipe.nom}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-black/5 py-2">
              <p className="text-base font-extrabold text-forest">{recipe.kcal}</p>
              <p className="text-xs text-black/50">kcal</p>
            </div>
            <div className="rounded-2xl bg-black/5 py-2">
              <p className="text-base font-extrabold text-forest">≈ {euros(prixParPers)}</p>
              <p className="text-xs text-black/50">/ pers</p>
            </div>
            <div className="rounded-2xl bg-black/5 py-2">
              <p className="text-base font-extrabold text-forest">{recipe.tempsMin}</p>
              <p className="text-xs text-black/50">min</p>
            </div>
          </div>
          <PriceNote
            total={prixDuPlat}
            variant="ligne"
            label={`≈ ${euros(prixDuPlat)} pour ${personnes} pers`}
            className="mt-3 text-center"
          />
        </div>

        {/* Macros */}
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-lg font-bold lowercase text-forest">valeurs nutritionnelles</h2>
          <div className="flex gap-3">
            <MacroBar label="protéines" value={macros.proteines} color="#EC6A9C" />
            <MacroBar label="glucides" value={macros.glucides} color="#F7C948" />
            <MacroBar label="lipides" value={macros.lipides} color="#4CAF3E" />
          </div>
        </section>

        {/* Allergènes */}
        {recipe.allergenes.length > 0 && (
          <section className="mt-4 rounded-3xl border-2 border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-bold text-orange-700">⚠️ allergènes</p>
            <p className="mt-1 text-sm text-orange-700/80">{recipe.allergenes.join(", ")}</p>
          </section>
        )}

        {/* Ingrédients */}
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold lowercase text-forest">ingrédients</h2>
            <span className="text-sm text-black/50">pour {personnes} {personnes > 1 ? "pers." : "pers."}</span>
          </div>
          <ul className="divide-y divide-black/5">
            {recipe.ingredients.map((ing) => {
              const saison = ing.rayon === "Fruits & Légumes" ? estDeSaison(ing.nom) : null;
              const halalReminder =
                state.funnel.regimes.includes("halal") &&
                ing.rayon === "Boucherie/Poisson" &&
                besoinHalal(ing.nom);
              return (
                <li key={ing.nom} className="flex items-center gap-3 py-2.5">
                  <span className="text-lg">{rayonEmoji(ing.rayon as Rayon)}</span>
                  <span className="flex flex-1 flex-wrap items-center gap-x-2 text-sm font-medium text-forest">
                    {ing.nom}
                    {saison === true && (
                      <span className="rounded-full bg-leaf/15 px-1.5 py-0.5 text-[10px] font-bold text-leaf">🌱 saison</span>
                    )}
                    {saison === false && (
                      <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">hors saison</span>
                    )}
                    {halalReminder && (
                      <span className="rounded-full bg-forest/10 px-1.5 py-0.5 text-[10px] font-bold text-forest">🕌 halal</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-black/60">
                    {formatQte(ing.qteParPersonne, personnes, ing.unite)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Étapes */}
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-lg font-bold lowercase text-forest">préparation</h2>
          <ol className="space-y-4">
            {recipe.etapes.map((etape, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-leaf to-forest text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-forest/90">{etape}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Bouton changer */}
      {hydrated && plan && indexInPlan >= 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-cream via-cream to-transparent px-5 pt-8">
          <PillButton onClick={handleSwap}>🔀 changer cette recette</PillButton>
        </div>
      )}
    </main>
  );
}
