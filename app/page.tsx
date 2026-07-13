"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { RECIPES } from "@/lib/recipes";
import { gradientFor } from "@/lib/gradient";
import { euros } from "@/lib/format";
import PillButton from "@/components/PillButton";
import ShareButton from "@/components/ShareButton";
import InstallAppButton from "@/components/InstallAppButton";
import { appShareText, shareUrl } from "@/lib/share";

const EXEMPLES = ["poulet-curry-coco", "buddha-bowl-pois-chiches", "saumon-teriyaki-four"];

const ETAPES = [
  { n: 1, titre: "ton budget", texte: "dis-nous combien tu veux mettre cette semaine et où tu fais tes courses." },
  { n: 2, titre: "miam prépare", texte: "on compose 5 dîners équilibrés adaptés à tes goûts et ton budget." },
  { n: 3, titre: "liste prête", texte: "ta liste de courses triée par rayon t'attend, y'a plus qu'à cuisiner." },
];

export default function Landing() {
  const { state, hydrated } = useMiam();
  const router = useRouter();
  const hasPlan = hydrated && state.plan;

  const exemples = EXEMPLES.map((id) => RECIPES.find((r) => r.id === id)!).filter(Boolean);

  return (
    <main className="safe-top safe-bottom mx-auto w-full max-w-md px-5 pb-10 pt-8">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-leaf to-forest text-3xl shadow-soft">
          🥗
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-leaf">miam</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight text-forest">
          ton plan de repas de la semaine, en 2 minutes
        </h1>
        <p className="mt-4 text-base text-black/55">
          réponds à quelques questions, miam compose 5 dîners selon ton budget et te sort la liste de
          courses. gratuit, sans compte.
        </p>
      </section>

      {/* Cards exemple */}
      <section className="mt-8 grid grid-cols-3 gap-3">
        {exemples.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-2xl bg-white shadow-soft">
            <div className="flex h-16 items-center justify-center text-3xl" style={{ background: gradientFor(r.id) }}>
              {r.emoji}
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-xs font-semibold leading-tight text-forest">{r.nom}</p>
              <p className="mt-1 text-xs font-bold text-leaf">{euros(r.prixParPersonne)}/pers</p>
            </div>
          </div>
        ))}
      </section>

      {/* Comment ça marche */}
      <section className="mt-10">
        <h2 className="text-center text-2xl font-extrabold lowercase text-forest">comment ça marche ?</h2>
        <div className="mt-5 space-y-3">
          {ETAPES.map((e) => (
            <div key={e.n} className="flex items-start gap-4 rounded-3xl bg-white p-4 shadow-soft">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-leaf to-forest text-lg font-extrabold text-white">
                {e.n}
              </span>
              <div>
                <h3 className="text-lg font-bold lowercase text-forest">{e.titre}</h3>
                <p className="text-sm text-black/55">{e.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10 space-y-3">
        {hasPlan ? (
          <>
            <PillButton onClick={() => router.push("/plan")}>reprendre ma semaine</PillButton>
            <Link href="/onboarding/magasin" className="block text-center text-sm font-semibold text-forest/70 underline">
              recommencer à zéro
            </Link>
          </>
        ) : (
          <PillButton onClick={() => router.push("/onboarding/magasin")}>commencer</PillButton>
        )}
        <p className="pt-1 text-center text-xs text-black/40">100% gratuit · aucune donnée envoyée · pas de compte</p>
      </section>

      {/* Installer / partager */}
      <section className="mt-6 space-y-3">
        <InstallAppButton />
        <ShareButton
          title="Miam — plan de repas de la semaine"
          text={appShareText()}
          url={shareUrl("/")}
          label="partager l'application à un proche"
        />
        <p className="pt-1 text-center text-xs text-black/40">
          installe miam sur ton écran d&apos;accueil, comme une vraie appli
        </p>
      </section>
    </main>
  );
}
