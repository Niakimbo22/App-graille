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
      total={7}
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
          max={200}
          step={5}
          value={budget}
          onChange={(e) => setFunnel({ budget: Number(e.target.value) })}
          className="mt-10 w-full"
        />
        <div className="mt-2 flex w-full justify-between text-xs font-semibold text-black/40">
          <span>25 €</span>
          <span>200 €</span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
