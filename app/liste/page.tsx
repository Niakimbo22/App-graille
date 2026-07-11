"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { buildShoppingList, rayonEmoji } from "@/lib/shopping";
import { coefMagasin } from "@/lib/stores";
import { euros, formatQte } from "@/lib/format";
import { majLisible } from "@/lib/prices";
import PillButton from "@/components/PillButton";

export default function ListePage() {
  const { state, toggleCoche, hydrated } = useMiam();
  const router = useRouter();
  const plan = state.plan;

  if (!hydrated) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-forest">chargement…</div>;
  }

  if (!plan) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="text-2xl font-extrabold lowercase text-forest">pas encore de liste</h1>
        <PillButton onClick={() => router.push("/onboarding/magasin")}>créer mon plan</PillButton>
      </main>
    );
  }

  const coef = coefMagasin(plan.magasin);
  const { parRayon, total, articles } = buildShoppingList(
    plan.items.map((i) => i.recipeId),
    plan.personnes,
    coef
  );

  const nbCochees = articles.filter((a) => state.cochees.includes(a.key)).length;

  return (
    <main className="safe-top mx-auto w-full max-w-md px-5 pb-32">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => router.push("/plan")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-forest shadow-soft"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-extrabold lowercase text-forest">liste de courses</h1>
          <p className="text-sm text-black/50">
            {nbCochees}/{articles.length} · {plan.magasin}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {parRayon.map((groupe) => (
          <section key={groupe.rayon}>
            <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wide text-forest/60">
              <span>{rayonEmoji(groupe.rayon)}</span>
              {groupe.rayon}
            </h2>
            <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
              {groupe.articles.map((a) => {
                const checked = state.cochees.includes(a.key);
                return (
                  <button
                    key={a.key}
                    onClick={() => toggleCoche(a.key)}
                    className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left last:border-0 transition active:bg-black/[0.02]"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white transition ${
                        checked ? "border-leaf bg-leaf" : "border-black/15"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className={`flex-1 text-sm font-medium ${checked ? "text-black/35 line-through" : "text-forest"}`}>
                      {a.nom}
                    </span>
                    <span className={`text-sm ${checked ? "text-black/25" : "text-black/55"}`}>
                      {formatQte(a.qte, 1, a.unite)}
                    </span>
                    <span className={`w-14 text-right text-sm font-semibold ${checked ? "text-black/25" : "text-forest"}`}>
                      {euros(a.prix)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Total */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-black/5 bg-white/95 px-5 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-black/60">total estimé</span>
          <span className="text-2xl font-extrabold text-forest">{euros(total)}</span>
        </div>
        <p className="pt-1 text-[11px] leading-tight text-black/35">
          prix moyens supermarché France · maj {majLisible()} · ajustés pour {plan.magasin}
        </p>
      </div>
    </main>
  );
}
