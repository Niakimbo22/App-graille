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
  const { state, toggleEquipement } = useMiam();
  const router = useRouter();
  const equip = state.funnel.equipement;

  return (
    <OnboardingLayout
      step={6}
      total={6}
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
    </OnboardingLayout>
  );
}
