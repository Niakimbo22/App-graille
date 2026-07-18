"use client";

import { useState } from "react";
import type { Magasin } from "@/lib/stores";

/**
 * Vrai logo de l'enseigne (Wikimedia). L'emoji reste affiché tant que le logo
 * n'est pas chargé, et pour toujours s'il échoue (hors-ligne, lien cassé).
 */
export default function StoreLogo({ magasin, className = "" }: { magasin: Magasin; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span className="relative flex items-center justify-center">
      {(!loaded || failed) && <span className={`text-2xl ${className}`}>{magasin.emoji}</span>}
      {!failed && (
        <img
          src={magasin.logo}
          alt={`Logo ${magasin.nom}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`object-contain ${className} ${loaded ? "" : "absolute h-0 w-0 opacity-0"}`}
        />
      )}
    </span>
  );
}
