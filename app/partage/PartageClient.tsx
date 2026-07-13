"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { getRecipe } from "@/lib/recipes";
import { decodePlan } from "@/lib/share";
import { prixTotalRecette } from "@/lib/planner";
import { buildShoppingList } from "@/lib/shopping";
import { coefMagasin } from "@/lib/stores";
import { euros } from "@/lib/format";
import RecipeCard from "@/components/RecipeCard";
import PillButton from "@/components/PillButton";

export default function PartageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { setFunnel, setPlan, resetCochees } = useMiam();

  const data = params.get("d");
  const shared = data ? decodePlan(data) : null;

  if (!shared) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🔗</div>
        <h1 className="text-2xl font-extrabold lowercase text-forest">lien invalide</h1>
        <p className="text-sm text-black/50">ce lien de partage semble abîmé ou incomplet.</p>
        <PillButton onClick={() => router.push("/")}>retour à l'accueil</PillButton>
      </main>
    );
  }

  const recipes = shared.ids.map((id) => getRecipe(id)).filter((r): r is NonNullable<typeof r> => !!r);
  const manquantes = shared.ids.length - recipes.length;

  if (recipes.length === 0) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">😕</div>
        <h1 className="text-2xl font-extrabold lowercase text-forest">recettes introuvables</h1>
        <p className="text-sm text-black/50">ce plan partagé ne correspond plus à des recettes disponibles.</p>
        <PillButton onClick={() => router.push("/")}>retour à l'accueil</PillButton>
      </main>
    );
  }

  const coef = coefMagasin(shared.magasin);
  const { total, articles } = buildShoppingList(
    recipes.map((r) => r.id),
    shared.personnes,
    coef
  );

  const importer = () => {
    setFunnel({ magasin: shared.magasin, personnes: shared.personnes });
    setPlan({
      items: recipes.map((r) => ({ recipeId: r.id, prixTotal: prixTotalRecette(r, shared.personnes, coef) })),
      magasin: shared.magasin,
      personnes: shared.personnes,
      budget: total,
      coutEstime: total,
      seed: Math.floor(Math.random() * 1_000_000),
    });
    resetCochees();
    router.push("/plan");
  };

  return (
    <main className="safe-top safe-bottom mx-auto w-full max-w-md px-5 pb-10">
      <section className="mt-4 rounded-3xl bg-gradient-to-br from-leaf to-forest p-6 text-center text-white shadow-soft">
        <p className="text-sm font-bold uppercase tracking-widest opacity-90">plan partagé</p>
        <h1 className="mt-1 text-2xl font-extrabold lowercase">
          {recipes.length} dîners · {shared.personnes} pers
        </h1>
        <p className="mt-1 text-sm opacity-90">🛒 {shared.magasin}</p>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5 text-center shadow-soft">
        <p className="text-sm text-black/50">total estimé · {articles.length} articles</p>
        <p className="text-3xl font-extrabold text-forest">{euros(total)}</p>
      </section>

      {manquantes > 0 && (
        <p className="mt-3 text-center text-xs font-semibold text-orange-500">
          ⚠️ {manquantes} recette{manquantes > 1 ? "s" : ""} de ce lien ne sont plus disponibles.
        </p>
      )}

      <section className="mt-6 space-y-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            prixTotal={prixTotalRecette(recipe, shared.personnes, coef)}
            personnes={shared.personnes}
            href={`/plan/${recipe.id}`}
          />
        ))}
      </section>

      <div className="mt-6">
        <PillButton onClick={importer}>importer ce plan chez moi</PillButton>
        <p className="mt-2 text-center text-xs text-black/40">remplace ton plan actuel sur cet appareil</p>
      </div>
    </main>
  );
}
