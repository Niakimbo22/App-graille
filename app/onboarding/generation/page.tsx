"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { RECIPES } from "@/lib/recipes";
import { generatePlan } from "@/lib/planner";
import { coefMagasin } from "@/lib/stores";

const STEPS = [
  "Analyse du budget et de tes préférences",
  "Création de ton plan de repas",
  "Génération de la liste de courses",
];

export default function GenerationPage() {
  const { state, setPlan, resetCochees, hydrated } = useMiam();
  const router = useRouter();
  const [done, setDone] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;

    // génère et enregistre le plan
    const coef = coefMagasin(state.funnel.magasin);
    const result = generatePlan({ recipes: RECIPES, funnel: state.funnel, coef, nbRepas: state.funnel.nbRepas });
    setPlan({
      items: result.items,
      magasin: state.funnel.magasin ?? "Carrefour",
      personnes: state.funnel.personnes,
      budget: state.funnel.budget,
      coutEstime: result.coutEstime,
      seed: result.seed,
    });
    resetCochees();

    // checklist animée
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setDone(i + 1), (i + 1) * 1200));
    });
    timers.push(setTimeout(() => router.push("/plan"), STEPS.length * 1200 + 600));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-8 text-center">
      <div className="mb-8 animate-pop-in text-7xl">🛒</div>
      <h1 className="text-3xl font-extrabold lowercase text-forest">on prépare ta semaine…</h1>
      <p className="mt-2 text-base text-black/50">encore quelques secondes</p>

      <div className="mt-10 w-full space-y-3">
        {STEPS.map((label, i) => {
          const isDone = done > i;
          const isActive = done === i;
          return (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left shadow-soft transition-all ${
                isDone ? "border-leaf" : "border-transparent"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  isDone ? "bg-leaf text-white" : isActive ? "bg-leaf/20 text-forest" : "bg-black/10 text-black/40"
                }`}
              >
                {isDone ? "✓" : isActive ? <span className="animate-pulse">•</span> : i + 1}
              </span>
              <span className={`text-sm font-semibold ${isDone ? "text-forest" : "text-black/50"}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
