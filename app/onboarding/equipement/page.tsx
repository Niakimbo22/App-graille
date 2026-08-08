"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import type { Equipement } from "@/lib/types";
import OnboardingLayout from "@/components/OnboardingLayout";
import SelectCard from "@/components/SelectCard";

const OPTIONS: { equip: Equipement; label: string; emoji: string; sub: string }[] = [
  { equip: "plaque", label: "Plaque / poêle", emoji: "🍳", sub: "casserole, poêle, wok" },
  { equip: "four", label: "Four", emoji: "🔥", sub: "gratins, rôtis, tartes" },
  { equip: "airfryer", label: "Air fryer", emoji: "🌀", sub: "friteuse à air" },
];

export default function EquipementPage() {
  const { state, toggleEquipement, setFunnel } = useMiam();
  const router = useRouter();
  const equip = state.funnel.equipement;
  const monde = state.funnel.inclureMonde ?? false;

  return (
    <OnboardingLayout
      step={9}
      total={9}
      title="ton équipement ?"
      subtitle="on ne propose que des recettes que tu peux cuisiner"
      onContinue={() => router.push("/onboarding/generation")}
      continueLabel="générer le plan"
      continueDisabled={equip.length === 0}
    >
      <div className="space-y-3">
        {OPTIONS.map((o) => (
          <SelectCard
            key={o.equip}
            selected={equip.includes(o.equip)}
            emoji={o.emoji}
            title={o.label}
            subtitle={o.sub}
            onClick={() => toggleEquipement(o.equip)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFunnel({ inclureMonde: !monde })}
        className={`mt-5 flex w-full items-center gap-3 rounded-3xl border-2 bg-white p-4 text-left shadow-soft transition ${
          monde ? "border-leaf" : "border-transparent"
        }`}
      >
        <span className="text-2xl">🌍</span>
        <span className="flex-1">
          <span className="block text-base font-bold text-forest">recettes du monde</span>
          <span className="block text-sm text-black/50">
            +des centaines de recettes internationales · prix estimés
          </span>
        </span>
        <span
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${monde ? "bg-leaf" : "bg-black/15"}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              monde ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </OnboardingLayout>
  );
}
