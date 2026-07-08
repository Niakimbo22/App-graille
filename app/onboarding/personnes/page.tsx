"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import OnboardingLayout from "@/components/OnboardingLayout";

export default function PersonnesPage() {
  const { state, setFunnel } = useMiam();
  const router = useRouter();
  const n = state.funnel.personnes;

  const set = (v: number) => setFunnel({ personnes: Math.max(1, Math.min(8, v)) });

  const Btn = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl font-bold text-forest shadow-soft transition active:scale-90 disabled:opacity-30"
    >
      {label}
    </button>
  );

  return (
    <OnboardingLayout
      step={5}
      total={6}
      title="vous êtes combien ?"
      subtitle="on ajuste les quantités"
      onContinue={() => router.push("/onboarding/equipement")}
    >
      <div className="flex items-center justify-center gap-6">
        <Btn label="−" onClick={() => set(n - 1)} disabled={n <= 1} />
        <div className="text-center">
          <span className="bg-gradient-to-br from-leaf to-forest bg-clip-text text-8xl font-extrabold text-transparent">
            {n}
          </span>
          <p className="mt-1 text-base text-black/50">{n > 1 ? "personnes" : "personne"}</p>
        </div>
        <Btn label="+" onClick={() => set(n + 1)} disabled={n >= 8} />
      </div>
    </OnboardingLayout>
  );
}
