"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { MAGASINS } from "@/lib/stores";
import OnboardingLayout from "@/components/OnboardingLayout";

export default function MagasinPage() {
  const { state, setFunnel } = useMiam();
  const router = useRouter();
  const selected = state.funnel.magasin;

  return (
    <OnboardingLayout
      step={1}
      total={6}
      title="où fais-tu tes courses ?"
      subtitle="on adapte les prix à ton enseigne"
      onContinue={() => router.push("/onboarding/budget")}
      continueDisabled={!selected}
      back="/"
    >
      <div className="grid grid-cols-3 gap-3">
        {MAGASINS.map((m) => {
          const active = selected === m.nom;
          return (
            <button
              key={m.nom}
              onClick={() => setFunnel({ magasin: m.nom })}
              style={!active ? { backgroundColor: m.couleur } : undefined}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-3xl border-[3px] p-2 text-center transition-all active:scale-95 ${
                active ? "border-leaf bg-forest text-white shadow-glow" : "border-transparent text-forest shadow-soft"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-bold leading-tight">{m.nom}</span>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
