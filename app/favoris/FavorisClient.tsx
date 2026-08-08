"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMiam } from "@/context/MiamContext";
import { useProfil } from "@/context/ProfilContext";
import { getRecipe } from "@/lib/recipes";
import { AVATARS, type SemaineFavorite } from "@/lib/profiles";
import { memePlan } from "@/lib/profiles";
import { modeInfo } from "@/lib/repas";
import { appShareText, shareUrl } from "@/lib/share";
import RecipeCard from "@/components/RecipeCard";
import FavoriteHeart from "@/components/FavoriteHeart";
import PillButton from "@/components/PillButton";
import ShareButton from "@/components/ShareButton";
import InstallAppButton from "@/components/InstallAppButton";

function ProfilForm({ titre, onCreer }: { titre: string; onCreer: (pseudo: string, avatar: string) => void }) {
  const [pseudo, setPseudo] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold lowercase text-forest">{titre}</h2>
      <p className="mt-1 text-sm text-black/55">
        pas un vrai compte : pas d&apos;email, pas de mot de passe. tout reste sur cet appareil.
      </p>
      <input
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        placeholder="ton pseudo"
        maxLength={20}
        className="mt-4 w-full rounded-2xl border-2 border-forest/15 bg-cream px-4 py-3 text-base font-semibold text-forest outline-none placeholder:font-normal placeholder:text-black/35 focus:border-forest/40"
      />
      <div className="mt-3 grid grid-cols-6 gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            aria-label={`avatar ${a}`}
            className={`flex h-11 items-center justify-center rounded-2xl text-2xl transition active:scale-95 ${
              avatar === a ? "bg-sun shadow-soft" : "bg-black/5"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <PillButton disabled={!pseudo.trim()} onClick={() => onCreer(pseudo.trim(), avatar)}>
          créer mon profil
        </PillButton>
      </div>
    </div>
  );
}

export default function FavorisClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, setPlan, resetCochees, hydrated: miamHydrated } = useMiam();
  const {
    profils,
    profil,
    hydrated,
    creerProfil,
    changerProfil,
    supprimerProfil,
    toggleFavoriPlat,
    estFavoriPlat,
    garderSemaine,
    retirerSemaine,
  } = useProfil();

  const [showProfils, setShowProfils] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);

  // intention en attente : on arrive ici depuis un cœur ou "garder ma semaine"
  // sans profil ; une fois le profil créé, on applique et on nettoie l'URL.
  const pendingPlat = params.get("plat");
  const pendingSemaine = params.get("garder") === "semaine";
  const applique = useRef(false);
  useEffect(() => {
    if (!hydrated || !miamHydrated || !profil || applique.current) return;
    if (!pendingPlat && !pendingSemaine) return;
    applique.current = true;
    if (pendingPlat && getRecipe(pendingPlat) && !estFavoriPlat(pendingPlat)) {
      toggleFavoriPlat(pendingPlat);
    }
    if (pendingSemaine && state.plan && !profil.semaines.some((s) => memePlan(s.plan, state.plan!))) {
      garderSemaine(state.plan);
    }
    router.replace("/favoris");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, miamHydrated, profil]);

  if (!hydrated || !miamHydrated) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-forest">chargement…</div>;
  }

  const revoir = (s: SemaineFavorite) => {
    const actuel = state.plan;
    const dejaGardee = actuel && profil?.semaines.some((x) => memePlan(x.plan, actuel));
    if (actuel && !memePlan(actuel, s.plan) && !dejaGardee) {
      if (!window.confirm("remplacer ta semaine actuelle (non gardée en favoris) ?")) return;
    }
    setPlan(s.plan);
    resetCochees();
    router.push("/plan");
  };

  const plats = profil ? profil.plats.map((id) => getRecipe(id)).filter(Boolean) : [];

  return (
    <main className="safe-top safe-bottom mx-auto w-full max-w-md px-5 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-forest shadow-soft">
          ←
        </Link>
        <h1 className="text-xl font-extrabold lowercase text-forest">mes favoris ❤️</h1>
        <span className="h-10 w-10" />
      </div>

      {!profil ? (
        <>
          <ProfilForm titre="crée ton profil" onCreer={creerProfil} />
          {(pendingPlat || pendingSemaine) && (
            <p className="mt-3 rounded-2xl bg-sun/60 p-3 text-center text-sm font-semibold text-forest">
              {pendingPlat ? "ton plat sera ajouté aux favoris juste après 😉" : "ta semaine sera gardée juste après 😉"}
            </p>
          )}
        </>
      ) : (
        <>
          {/* Profil actif */}
          <section className="rounded-3xl bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun text-2xl">
                {profil.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-extrabold text-forest">{profil.pseudo}</p>
                <p className="text-xs text-black/45">profil local — rien ne quitte ton appareil</p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfils((v) => !v)}
                className="shrink-0 rounded-full bg-black/5 px-3 py-1.5 text-sm font-semibold text-forest transition active:scale-95"
              >
                {showProfils ? "fermer" : "changer"}
              </button>
            </div>

            {showProfils && (
              <div className="mt-4 space-y-2 border-t border-black/5 pt-4">
                {profils.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        changerProfil(p.id);
                        setShowProfils(false);
                        setShowNouveau(false);
                      }}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-forest transition active:scale-[0.99] ${
                        p.id === profil.id ? "bg-sun" : "bg-black/5"
                      }`}
                    >
                      <span className="text-xl">{p.avatar}</span>
                      <span className="truncate">{p.pseudo}</span>
                      <span className="ml-auto shrink-0 text-xs font-normal text-black/40">
                        {p.semaines.length + p.plats.length} favoris
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`supprimer le profil « ${p.pseudo} » et tous ses favoris ?`)) {
                          supprimerProfil(p.id);
                        }
                      }}
                      aria-label={`supprimer le profil ${p.pseudo}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {showNouveau ? (
                  <ProfilForm
                    titre="nouveau profil"
                    onCreer={(ps, av) => {
                      creerProfil(ps, av);
                      setShowNouveau(false);
                      setShowProfils(false);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNouveau(true)}
                    className="w-full rounded-2xl border-2 border-dashed border-forest/25 px-3 py-2.5 text-sm font-semibold text-forest/70 transition active:scale-[0.99]"
                  >
                    + nouveau profil
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Semaines gardées */}
          <section className="mt-6">
            <h2 className="text-lg font-bold lowercase text-forest">mes semaines</h2>
            {profil.semaines.length === 0 ? (
              <p className="mt-2 rounded-3xl bg-white p-4 text-sm text-black/55 shadow-soft">
                aucune semaine gardée pour l&apos;instant. sur ta semaine, appuie sur{" "}
                <strong>« garder cette semaine en favoris »</strong> pour la retrouver ici.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {profil.semaines.map((s) => {
                  const recettes = s.plan.items
                    .map((i) => getRecipe(i.recipeId))
                    .filter((r): r is NonNullable<typeof r> => !!r);
                  return (
                    <div key={s.id} className="rounded-3xl bg-white p-4 shadow-soft">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-base font-extrabold text-forest">{s.nom}</p>
                          <p className="text-sm text-black/50">
                            {s.plan.items.length} plats · {s.plan.personnes} pers · {s.plan.magasin}
                          </p>
                          <p className="text-xs font-semibold text-leaf">
                            {modeInfo(s.plan.modeRepas).emoji} {modeInfo(s.plan.modeRepas).resume}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => retirerSemaine(s.id)}
                          aria-label={`retirer ${s.nom}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-2xl">
                        {recettes.map((r) => (
                          <span key={r.id} title={r.nom}>
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3">
                        <PillButton className="!py-3 !text-base" onClick={() => revoir(s)}>
                          revoir cette semaine
                        </PillButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Plats favoris */}
          <section className="mt-6">
            <h2 className="text-lg font-bold lowercase text-forest">mes plats</h2>
            {plats.length === 0 ? (
              <p className="mt-2 rounded-3xl bg-white p-4 text-sm text-black/55 shadow-soft">
                aucun plat favori pour l&apos;instant. sur une recette, appuie sur le <strong>🤍</strong> pour
                la retrouver ici.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {plats.map((r) => (
                  <div key={r!.id} className="relative">
                    <RecipeCard recipe={r!} href={`/plan/${r!.id}`} />
                    <FavoriteHeart recipeId={r!.id} className="absolute left-3 top-3" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Installer / partager */}
      <section className="mt-8 space-y-3">
        <InstallAppButton />
        <ShareButton
          title="Miam — plan de repas de la semaine"
          text={appShareText()}
          url={shareUrl("/")}
          label="partager l'application à un proche"
        />
      </section>
    </main>
  );
}
