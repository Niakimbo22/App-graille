"use client";

import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import type { ProteinPref } from "@/lib/types";
import { moisCourant, produitsDuMois, MOIS_LABELS } from "@/lib/saison";
import OnboardingLayout from "@/components/OnboardingLayout";

const ENVIES: { pref: ProteinPref; label: string; emoji: string; sub: string }[] = [
  { pref: "volaille", label: "Plus de poulet", emoji: "🍗", sub: "volaille, dinde, escalope" },
  { pref: "rouge", label: "Plus de viande rouge", emoji: "🥩", sub: "bœuf, veau, agneau" },
  { pref: "poisson", label: "Plus de poisson", emoji: "🐟", sub: "poisson, crevettes, fruits de mer" },
  { pref: "porc", label: "Plus de porc", emoji: "🥓", sub: "jambon, lardons, saucisse" },
  { pref: "vegetal", label: "Plus de végétal", emoji: "🌱", sub: "tofu, légumineuses, falafel" },
  { pref: "oeuf", label: "Plus d'œufs", emoji: "🥚", sub: "omelettes, frittatas" },
];

export default function EnviesPage() {
  const { state, togglePreference, toggleSaison } = useMiam();
  const router = useRouter();
  const prefs = state.funnel.preferences ?? [];
  const saison = state.funnel.saison ?? false;
  const halal = state.funnel.regimes.includes("halal");

  // en halal, l'envie « plus de porc » est retirée des choix
  const envies = halal ? ENVIES.filter((e) => e.pref !== "porc") : ENVIES;

  const mois = moisCourant();
  const duMois = produitsDuMois(mois).slice(0, 8);

  return (
    <OnboardingLayout
      step={5}
      total={8}
      title="tes envies cette semaine ?"
      subtitle="on en mettra un peu plus au menu · plusieurs choix possibles"
      onContinue={() => router.push("/onboarding/personnes")}
    >
      <div className="grid grid-cols-2 gap-3">
        {envies.map((e) => {
          const active = prefs.includes(e.pref);
          return (
            <button
              key={e.pref}
              onClick={() => togglePreference(e.pref)}
              className={`flex flex-col items-start gap-1 rounded-3xl border-[3px] p-4 text-left transition-all active:scale-[0.98] ${
                active ? "border-leaf bg-forest text-white shadow-glow" : "border-transparent bg-white text-forest shadow-soft"
              }`}
            >
              <span className="text-3xl">{e.emoji}</span>
              <span className="text-sm font-bold leading-tight">{e.label}</span>
              <span className={`text-xs leading-tight ${active ? "text-white/70" : "text-black/45"}`}>{e.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Fruits & légumes de saison */}
      <button
        type="button"
        onClick={toggleSaison}
        className={`mt-5 flex w-full items-center gap-3 rounded-3xl border-2 bg-white p-4 text-left shadow-soft transition ${
          saison ? "border-leaf" : "border-transparent"
        }`}
      >
        <span className="text-2xl">🌱</span>
        <span className="flex-1">
          <span className="block text-base font-bold text-forest">fruits &amp; légumes de saison</span>
          <span className="block text-sm text-black/50">
            on privilégie les recettes de saison — meilleures et moins chères
          </span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${saison ? "bg-leaf" : "bg-black/15"}`}>
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              saison ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      {saison && duMois.length > 0 && (
        <div className="mt-3 rounded-3xl bg-white/70 p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-forest/60">
            de saison en {MOIS_LABELS[mois - 1]}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {duMois.map((p) => (
              <span
                key={p.nom}
                className="rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-semibold text-forest"
              >
                {p.emoji} {p.nom}
              </span>
            ))}
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
