"use client";

import { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useProfil } from "@/context/ProfilContext";

interface Props {
  recipeId: string;
  className?: string;
}

/**
 * Cœur pour mettre un plat en favori. Sans profil, on emmène vers /favoris
 * pour en créer un ; le plat est alors ajouté automatiquement après création.
 */
export default function FavoriteHeart({ recipeId, className = "" }: Props) {
  const router = useRouter();
  const { profil, hydrated, estFavoriPlat, toggleFavoriPlat } = useProfil();

  if (!hydrated) return null;
  const fav = estFavoriPlat(recipeId);

  const onClick = (e: MouseEvent) => {
    // le cœur peut vivre dans un <Link> : on bloque la navigation de la carte
    e.preventDefault();
    e.stopPropagation();
    if (!profil) {
      router.push(`/favoris?plat=${encodeURIComponent(recipeId)}`);
      return;
    }
    toggleFavoriPlat(recipeId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={fav ? "retirer des favoris" : "ajouter aux favoris"}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-xl shadow-soft transition active:scale-95 ${className}`}
    >
      {fav ? "❤️" : "🤍"}
    </button>
  );
}
