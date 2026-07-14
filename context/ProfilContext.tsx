"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Plan } from "@/lib/types";
import { genId, memePlan, nomSemaine, type Profil, type SemaineFavorite } from "@/lib/profiles";

const STORAGE_KEY = "miam-profils";

interface ProfilsState {
  profils: Profil[];
  actifId: string | null;
}

const defaultState: ProfilsState = { profils: [], actifId: null };

interface ProfilContextValue {
  /** tous les profils de l'appareil */
  profils: Profil[];
  /** profil actif, ou null si aucun profil créé */
  profil: Profil | null;
  hydrated: boolean;
  creerProfil: (pseudo: string, avatar: string) => void;
  changerProfil: (id: string) => void;
  supprimerProfil: (id: string) => void;
  toggleFavoriPlat: (recipeId: string) => void;
  estFavoriPlat: (recipeId: string) => boolean;
  garderSemaine: (plan: Plan) => void;
  retirerSemaine: (id: string) => void;
  /** la sauvegarde correspondant à ce plan, si elle existe */
  semaineGardee: (plan: Plan) => SemaineFavorite | null;
}

const ProfilContext = createContext<ProfilContextValue | null>(null);

function sanitize(parsed: Partial<ProfilsState>): ProfilsState {
  const profils = (Array.isArray(parsed.profils) ? parsed.profils : []).filter(
    (p): p is Profil => !!p && typeof p.id === "string" && typeof p.pseudo === "string"
  );
  for (const p of profils) {
    p.avatar = typeof p.avatar === "string" ? p.avatar : "🦊";
    p.semaines = Array.isArray(p.semaines) ? p.semaines : [];
    p.plats = Array.isArray(p.plats) ? p.plats.filter((x) => typeof x === "string") : [];
  }
  const actifId = profils.some((p) => p.id === parsed.actifId) ? (parsed.actifId as string) : profils[0]?.id ?? null;
  return { profils, actifId };
}

export function ProfilProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfilsState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const firstLoad = useRef(true);

  // hydratation depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(sanitize(JSON.parse(raw)));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // persistance
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  const profil = state.profils.find((p) => p.id === state.actifId) ?? null;

  const majActif = (fn: (p: Profil) => Profil) =>
    setState((s) => {
      if (!s.actifId) return s;
      return { ...s, profils: s.profils.map((p) => (p.id === s.actifId ? fn(p) : p)) };
    });

  const creerProfil = (pseudo: string, avatar: string) =>
    setState((s) => {
      const nouveau: Profil = {
        id: genId(),
        pseudo: pseudo.trim().slice(0, 20),
        avatar,
        creeLe: new Date().toISOString(),
        semaines: [],
        plats: [],
      };
      return { profils: [...s.profils, nouveau], actifId: nouveau.id };
    });

  const changerProfil = (id: string) =>
    setState((s) => (s.profils.some((p) => p.id === id) ? { ...s, actifId: id } : s));

  const supprimerProfil = (id: string) =>
    setState((s) => {
      const profils = s.profils.filter((p) => p.id !== id);
      const actifId = s.actifId === id ? profils[0]?.id ?? null : s.actifId;
      return { profils, actifId };
    });

  const toggleFavoriPlat = (recipeId: string) =>
    majActif((p) => ({
      ...p,
      plats: p.plats.includes(recipeId) ? p.plats.filter((x) => x !== recipeId) : [...p.plats, recipeId],
    }));

  const estFavoriPlat = (recipeId: string) => profil?.plats.includes(recipeId) ?? false;

  const garderSemaine = (plan: Plan) =>
    majActif((p) => {
      if (p.semaines.some((s) => memePlan(s.plan, plan))) return p;
      const semaine: SemaineFavorite = {
        id: genId(),
        nom: nomSemaine(),
        creeLe: new Date().toISOString(),
        plan,
      };
      return { ...p, semaines: [semaine, ...p.semaines] };
    });

  const retirerSemaine = (id: string) =>
    majActif((p) => ({ ...p, semaines: p.semaines.filter((s) => s.id !== id) }));

  const semaineGardee = (plan: Plan) => profil?.semaines.find((s) => memePlan(s.plan, plan)) ?? null;

  return (
    <ProfilContext.Provider
      value={{
        profils: state.profils,
        profil,
        hydrated,
        creerProfil,
        changerProfil,
        supprimerProfil,
        toggleFavoriPlat,
        estFavoriPlat,
        garderSemaine,
        retirerSemaine,
        semaineGardee,
      }}
    >
      {children}
    </ProfilContext.Provider>
  );
}

export function useProfil() {
  const ctx = useContext(ProfilContext);
  if (!ctx) throw new Error("useProfil doit être utilisé dans ProfilProvider");
  return ctx;
}
