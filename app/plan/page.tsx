"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMiam } from "@/context/MiamContext";
import { useProfil } from "@/context/ProfilContext";
import { RECIPES, getRecipe } from "@/lib/recipes";
import { generatePlan } from "@/lib/planner";
import { buildShoppingList } from "@/lib/shopping";
import { coefMagasin } from "@/lib/stores";
import { euros } from "@/lib/format";
import { majLisible } from "@/lib/prices";
import { encodePlan, planShareText, shareUrl } from "@/lib/share";
import RecipeCard from "@/components/RecipeCard";
import PillButton from "@/components/PillButton";
import ShareButton from "@/components/ShareButton";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export default function PlanPage() {
  const { state, setPlan, resetCochees, hydrated } = useMiam();
  const { profil, garderSemaine, retirerSemaine, semaineGardee } = useProfil();
  const router = useRouter();
  const plan = state.plan;

  if (!hydrated) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-forest">chargement…</div>;
  }

  if (!plan) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🍽️</div>
        <h1 className="text-2xl font-extrabold lowercase text-forest">aucun plan pour le moment</h1>
        <PillButton onClick={() => router.push("/onboarding/magasin")}>créer mon plan</PillButton>
      </main>
    );
  }

  const coef = coefMagasin(plan.magasin);
  const { articles, total } = buildShoppingList(
    plan.items.map((i) => i.recipeId),
    plan.personnes,
    coef
  );

  // coût affiché = vrai total de la liste de courses (conditionnement réel)
  const pct = Math.min(100, Math.round((total / plan.budget) * 100));
  const depasse = total > plan.budget;

  const regenerer = () => {
    const result = generatePlan({ recipes: RECIPES, funnel: state.funnel, coef, nbRepas: state.funnel.nbRepas });
    setPlan({
      items: result.items,
      magasin: plan.magasin,
      personnes: plan.personnes,
      budget: plan.budget,
      coutEstime: result.coutEstime,
      seed: result.seed,
    });
    resetCochees();
  };

  const recipesForShare = plan.items
    .map((item) => ({ recipe: getRecipe(item.recipeId)! }))
    .filter((x) => x.recipe);
  const partageLien = shareUrl("/partage/", { d: encodePlan(plan) });

  const gardee = semaineGardee(plan);
  const onGarder = () => {
    if (!profil) {
      // pas encore de profil : on va en créer un, la semaine sera gardée juste après
      router.push("/favoris?garder=semaine");
      return;
    }
    if (gardee) retirerSemaine(gardee.id);
    else garderSemaine(plan);
  };

  return (
    <main className="safe-top safe-bottom mx-auto w-full max-w-md px-5 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-forest shadow-soft">
          ←
        </Link>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-forest shadow-soft">
          🛒 prévu pour {plan.magasin}
        </span>
        <Link
          href="/favoris"
          aria-label="mes favoris"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-soft"
        >
          ❤️
        </Link>
      </div>

      {/* Bandeau */}
      <section className="rounded-3xl bg-gradient-to-br from-leaf to-forest p-6 text-center text-white shadow-soft">
        <p className="text-sm font-bold uppercase tracking-widest opacity-90">ta semaine est prête</p>
        <h1 className="mt-1 text-3xl font-extrabold lowercase">bon appétit ! 🎉</h1>
      </section>

      {/* Coût estimé */}
      <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-black/50">coût estimé</p>
            <p className={`text-3xl font-extrabold ${depasse ? "text-orange-500" : "text-forest"}`}>
              {euros(total)}
            </p>
          </div>
          <p className="pb-1 text-sm font-semibold text-black/50">budget {euros(plan.budget)}</p>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full transition-all ${depasse ? "bg-orange-400" : "bg-gradient-to-r from-leaf to-forest"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {depasse && (
          <p className="mt-2 text-xs font-semibold text-orange-500">
            budget un peu juste — on a gardé les recettes les moins chères.
          </p>
        )}
        <p className="mt-3 text-[11px] leading-tight text-black/35">
          prix moyens supermarché France · maj {majLisible()} · ajustés pour {plan.magasin}
        </p>
      </section>

      {/* Liste de courses */}
      <Link href="/liste" className="mt-4 block">
        <div className="flex items-center justify-between rounded-3xl bg-sun p-5 shadow-soft transition active:scale-[0.99]">
          <div>
            <p className="text-lg font-extrabold text-forest">{articles.length} articles</p>
            <p className="text-sm font-semibold text-forest/70">liste de courses triée par rayon</p>
          </div>
          <span className="text-3xl">🛒</span>
        </div>
      </Link>

      {/* Recettes */}
      <section className="mt-6 space-y-4">
        {plan.items.map((item, i) => {
          const recipe = getRecipe(item.recipeId);
          if (!recipe) return null;
          return (
            <RecipeCard
              key={item.recipeId}
              recipe={recipe}
              jour={JOURS[i]}
              prixTotal={item.prixTotal}
              personnes={plan.personnes}
              href={`/plan/${recipe.id}`}
            />
          );
        })}
      </section>

      <div className="mt-6 space-y-3">
        <PillButton variant="ghost" onClick={onGarder}>
          {gardee ? "💛 gardée — retirer des favoris" : "🤍 garder cette semaine en favoris"}
        </PillButton>
        <PillButton variant="ghost" onClick={regenerer}>
          🔄 régénérer la semaine
        </PillButton>
        <ShareButton
          title="Mon plan de la semaine — Miam"
          text={planShareText(recipesForShare, plan.personnes, total, plan.magasin)}
          url={partageLien}
          label="partager ma semaine"
        />
      </div>
    </main>
  );
}
