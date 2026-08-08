"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { MODES_REPAS, platsPourJours } from "@/lib/repas";
import OnboardingLayout from "@/components/OnboardingLayout";
import SelectCard from "@/components/SelectCard";

export default function RepasPage() {
  const { state, setFunnel } = useMiam();
  const router = useRouter();
  const mode = state.funnel.modeRepas;
  const jours = state.funnel.nbRepas;
  const plats = platsPourJours(jours, mode);

  const recap =
    mode === "restes"
      ? `${plats} plats cuisinés en double : ${plats} dîners + ${plats} midis en boîte`
      : mode === "double"
      ? `${plats} plats différents sur ${jours} jour${jours > 1 ? "s" : ""}`
      : `${plats} dîner${plats > 1 ? "s" : ""}`;

  return (
    <OnboardingLayout
      step={8}
      total={9}
      title="et le midi ?"
      subtitle="dis-nous ce qu'il faut couvrir dans une journée"
      onContinue={() => router.push("/onboarding/equipement")}
    >
      <div className="space-y-3">
        {MODES_REPAS.map((m) => (
          <SelectCard
            key={m.id}
            selected={mode === m.id}
            emoji={m.emoji}
            title={m.titre}
            subtitle={m.desc}
            onClick={() => setFunnel({ modeRepas: m.id })}
          />
        ))}
      </div>

      <p className="mt-5 rounded-3xl bg-white p-4 text-center text-sm font-semibold text-forest shadow-soft">
        🧾 {recap}
      </p>
      {mode !== "diner" && (
        <p className="mt-2 text-center text-xs text-black/45">
          la liste de courses et le budget suivent : deux fois plus à manger, ça se voit sur le
          ticket.
        </p>
      )}
    </OnboardingLayout>
  );
}
