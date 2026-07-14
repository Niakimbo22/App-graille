"use client";

import { moisCourant, produitsDuMois, MOIS_LABELS } from "@/lib/saison";

/**
 * Panneau « fruits & légumes de saison » du mois courant.
 * Sépare légumes et fruits, avec emoji et nom.
 */
export default function SaisonPanel({ compact = false }: { compact?: boolean }) {
  const mois = moisCourant();
  const legumes = produitsDuMois(mois, "legume");
  const fruits = produitsDuMois(mois, "fruit");

  if (legumes.length === 0 && fruits.length === 0) return null;

  const Pills = ({ items }: { items: { nom: string; emoji: string }[] }) => (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((p) => (
        <span key={p.nom} className="rounded-full bg-leaf/12 px-2.5 py-1 text-xs font-semibold text-forest">
          {p.emoji} {p.nom}
        </span>
      ))}
    </div>
  );

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌱</span>
        <div>
          <h2 className="text-base font-extrabold text-forest">de saison en {MOIS_LABELS[mois - 1]}</h2>
          {!compact && (
            <p className="text-xs text-black/45">meilleur goût, meilleur prix, plus local</p>
          )}
        </div>
      </div>

      {legumes.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-forest/50">légumes</p>
          <Pills items={legumes} />
        </div>
      )}
      {fruits.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-forest/50">fruits</p>
          <Pills items={fruits} />
        </div>
      )}
    </section>
  );
}
