"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { AMBIANCES } from "@/lib/tags";
import OnboardingLayout from "@/components/OnboardingLayout";

export default function AmbiancePage() {
  const { state, toggleAmbiance } = useMiam();
  const router = useRouter();
  const ambiances = state.funnel.ambiances;

  return (
    <OnboardingLayout
      step={4}
      total={7}
      title="quelle ambiance cette semaine ?"
      subtitle="jusqu'à 3 envies"
      onContinue={() => router.push("/onboarding/personnes")}
    >
      <div className="grid grid-cols-2 gap-3">
        {AMBIANCES.map((a) => {
          const active = ambiances.includes(a.tag);
          const disabled = !active && ambiances.length >= 3;
          return (
            <button
              key={a.tag}
              disabled={disabled}
              onClick={() => toggleAmbiance(a.tag)}
              style={!active ? { backgroundColor: a.bg } : undefined}
              className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-3xl border-[3px] p-3 text-center transition-all active:scale-95 disabled:opacity-40 ${
                active ? "border-leaf bg-forest text-white shadow-glow" : "border-transparent text-forest shadow-soft"
              }`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className="text-sm font-bold leading-tight">{a.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-black/40">{ambiances.length}/3 sélectionnées</p>
    </OnboardingLayout>
  );
}
