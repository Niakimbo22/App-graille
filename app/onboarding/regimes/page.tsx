"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import type { Regime } from "@/lib/types";
import OnboardingLayout from "@/components/OnboardingLayout";
import SelectCard from "@/components/SelectCard";

const OPTIONS: { regime: Regime | "aucun"; label: string; emoji: string }[] = [
  { regime: "aucun", label: "Aucun", emoji: "🍽️" },
  { regime: "vegetarien", label: "Végétarien", emoji: "🥕" },
  { regime: "pescetarien", label: "Pescétarien", emoji: "🐟" },
  { regime: "sans-gluten", label: "Sans gluten", emoji: "🌾" },
  { regime: "sans-lactose", label: "Sans lactose", emoji: "🥛" },
];

export default function RegimesPage() {
  const { state, setFunnel, toggleRegime } = useMiam();
  const router = useRouter();
  const regimes = state.funnel.regimes;

  const aucunActif = regimes.length === 0;

  return (
    <OnboardingLayout
      step={3}
      total={6}
      title="des besoins alimentaires ?"
      subtitle="plusieurs choix possibles"
      onContinue={() => router.push("/onboarding/ambiance")}
    >
      <div className="space-y-3">
        {OPTIONS.map((o) => {
          const selected = o.regime === "aucun" ? aucunActif : regimes.includes(o.regime as Regime);
          return (
            <SelectCard
              key={o.regime}
              selected={selected}
              emoji={o.emoji}
              title={o.label}
              onClick={() => {
                if (o.regime === "aucun") setFunnel({ regimes: [] });
                else toggleRegime(o.regime as Regime);
              }}
            />
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
