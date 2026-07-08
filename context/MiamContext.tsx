"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { MiamState, FunnelState, Plan, Regime, Tag, Equipement } from "@/lib/types";

const STORAGE_KEY = "miam-state";

const defaultFunnel: FunnelState = {
  magasin: null,
  budget: 60,
  regimes: [],
  ambiances: [],
  personnes: 2,
  equipement: [],
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
      let regimes: Regime[];
      const has = s.funnel.regimes.includes(r);
      regimes = has ? s.funnel.regimes.filter((x) => x !== r) : [...s.funnel.regimes, r];
      return { ...s, funnel: { ...s.funnel, regimes } };
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
