"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import OnboardingLayout from "@/components/OnboardingLayout";

export default function BudgetPage() {
  const { state, setFunnel } = useMiam();
  const router = useRouter();
  const budget = state.funnel.budget;

  return (
    <OnboardingLayout
      step={2}
      total={8}
      title="quel budget ?"
      subtitle="pour tes 5 dîners de la semaine"
      onContinue={() => router.push("/onboarding/regimes")}
    >
      <div className="flex flex-col items-center">
        <div className="text-center">
          <span className="bg-gradient-to-br from-leaf to-forest bg-clip-text text-7xl font-extrabold text-transparent">
            {budget} €
          </span>
          <p className="mt-1 text-base text-black/50">cette semaine</p>
        </div>

        <input
          type="range"
          min={25}
          max={250}
          step={5}
          value={budget}
          onChange={(e) => setFunnel({ budget: Number(e.target.value) })}
          className="mt-10 w-full"
        />
        <div className="mt-2 flex w-full justify-between text-xs font-semibold text-black/40">
          <span>25 €</span>
          <span>250 €</span>
        </div>

        <p className="mt-8 rounded-2xl bg-sun/15 px-4 py-3 text-center text-xs leading-snug text-forest/75">
          on vise le <strong>ticket de caisse réel</strong> : les paquets entiers, pas juste
          les grammes utilisés. Compte ~50-60 € à 2 et ~70-85 € à 4 pour 5 dîners — et les
          prix affichés restent des estimations.
        </p>
      </div>
    </OnboardingLayout>
  );
}
