"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import OnboardingLayout from "@/components/OnboardingLayout";

const MIN = 1;
const MAX = 7;

export default function JoursPage() {
  const { state, setFunnel } = useMiam();
  const router = useRouter();
  const n = state.funnel.nbRepas;

  const set = (v: number) => setFunnel({ nbRepas: Math.max(MIN, Math.min(MAX, v)) });

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
      step={7}
      total={9}
      title="combien de jours ?"
      subtitle="on couvre autant de journées, et la liste qui va avec"
      onContinue={() => router.push("/onboarding/repas")}
    >
      <div className="flex items-center justify-center gap-6">
        <Btn label="−" onClick={() => set(n - 1)} disabled={n <= MIN} />
        <div className="text-center">
          <span className="bg-gradient-to-br from-leaf to-forest bg-clip-text text-8xl font-extrabold text-transparent">
            {n}
          </span>
          <p className="mt-1 text-base text-black/50">{n > 1 ? "jours" : "jour"}</p>
        </div>
        <Btn label="+" onClick={() => set(n + 1)} disabled={n >= MAX} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {[3, 4, 5, 6, 7].map((v) => (
          <button
            key={v}
            onClick={() => set(v)}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-soft transition ${
              n === v ? "bg-gradient-to-br from-leaf to-forest text-white" : "bg-white text-forest"
            }`}
          >
            {v} jours
          </button>
        ))}
      </div>
    </OnboardingLayout>
  );
}
