"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { MiamState, FunnelState, Plan, Regime, Tag, Equipement, ProteinPref } from "@/lib/types";

const STORAGE_KEY = "miam-state";

const defaultFunnel: FunnelState = {
  magasin: null,
  budget: 60,
  regimes: [],
  ambiances: [],
  personnes: 2,
  nbRepas: 5,
  modeRepas: "diner",
  equipement: [],
  preferences: [],
  saison: false,
};

const defaultState: MiamState = {
  funnel: defaultFunnel,
  plan: null,
  cochees: [],
};

interface MiamContextValue {
  state: MiamState;
  hydrated: boolean;
  setFunnel: (patch: Partial<FunnelState>) => void;
  toggleRegime: (r: Regime) => void;
  toggleAmbiance: (t: Tag) => void;
  toggleEquipement: (e: Equipement) => void;
  togglePreference: (p: ProteinPref) => void;
  toggleSaison: () => void;
  setPlan: (plan: Plan | null) => void;
  toggleCoche: (key: string) => void;
  resetCochees: () => void;
  reset: () => void;
}

const MiamContext = createContext<MiamContextValue | null>(null);

export function MiamProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiamState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const firstLoad = useRef(true);

  // hydratation depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MiamState;
        setState({
          funnel: { ...defaultFunnel, ...parsed.funnel },
          plan: parsed.plan ?? null,
          cochees: parsed.cochees ?? [],
        });
      }
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

  const setFunnel = (patch: Partial<FunnelState>) =>
    setState((s) => ({ ...s, funnel: { ...s.funnel, ...patch } }));

  const toggleRegime = (r: Regime) =>
    setState((s) => {
      const has = s.funnel.regimes.includes(r);
      const regimes = has ? s.funnel.regimes.filter((x) => x !== r) : [...s.funnel.regimes, r];
      // halal et l'envie « plus de porc » sont contradictoires :
      // en activant halal on retire cette envie devenue impossible.
      const preferences =
        regimes.includes("halal")
          ? (s.funnel.preferences ?? []).filter((p) => p !== "porc")
          : s.funnel.preferences;
      return { ...s, funnel: { ...s.funnel, regimes, preferences } };
    });

  const toggleAmbiance = (t: Tag) =>
    setState((s) => {
      const has = s.funnel.ambiances.includes(t);
      let ambiances = has ? s.funnel.ambiances.filter((x) => x !== t) : [...s.funnel.ambiances, t];
      if (ambiances.length > 3) ambiances = ambiances.slice(0, 3);
      return { ...s, funnel: { ...s.funnel, ambiances } };
    });

  const toggleEquipement = (e: Equipement) =>
    setState((s) => {
      const has = s.funnel.equipement.includes(e);
      const equipement = has
        ? s.funnel.equipement.filter((x) => x !== e)
        : [...s.funnel.equipement, e];
      return { ...s, funnel: { ...s.funnel, equipement } };
    });

  const togglePreference = (p: ProteinPref) =>
    setState((s) => {
      // en halal, l'envie « plus de porc » n'a pas de sens : on l'ignore.
      if (p === "porc" && s.funnel.regimes.includes("halal")) return s;
      const cur = s.funnel.preferences ?? [];
      const has = cur.includes(p);
      const preferences = has ? cur.filter((x) => x !== p) : [...cur, p];
      return { ...s, funnel: { ...s.funnel, preferences } };
    });

  const toggleSaison = () =>
    setState((s) => ({ ...s, funnel: { ...s.funnel, saison: !s.funnel.saison } }));

  const setPlan = (plan: Plan | null) => setState((s) => ({ ...s, plan }));

  const toggleCoche = (key: string) =>
    setState((s) => {
      const has = s.cochees.includes(key);
      return { ...s, cochees: has ? s.cochees.filter((k) => k !== key) : [...s.cochees, key] };
    });

  const resetCochees = () => setState((s) => ({ ...s, cochees: [] }));

  const reset = () => setState({ ...defaultState, funnel: { ...defaultFunnel } });

  return (
    <MiamContext.Provider
      value={{
        state,
        hydrated,
        setFunnel,
        toggleRegime,
        toggleAmbiance,
        toggleEquipement,
        togglePreference,
        toggleSaison,
        setPlan,
        toggleCoche,
        resetCochees,
        reset,
      }}
    >
      {children}
    </MiamContext.Provider>
  );
}

export function useMiam() {
  const ctx = useContext(MiamContext);
  if (!ctx) throw new Error("useMiam doit être utilisé dans MiamProvider");
  return ctx;
}
