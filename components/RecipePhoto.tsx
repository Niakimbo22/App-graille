"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/types";
import { gradientFor } from "@/lib/gradient";

interface Props {
  recipe: Recipe;
  /** classes du conteneur (hauteur, arrondis…) */
  className?: string;
  /** taille de l'emoji de secours, ex "text-6xl" */
  emojiClassName?: string;
  /** largeur d'affichage réelle, pour que le navigateur choisisse la bonne miniature */
  sizes?: string;
  children?: React.ReactNode;
}

/**
 * Vraie photo du plat (Wikimedia Commons). L'emoji + dégradé d'origine restent
 * affichés tant que la photo n'est pas chargée, et pour toujours si elle
 * échoue (hors-ligne, lien cassé) ou si la recette n'a pas de photo.
 */
export default function RecipePhoto({
  recipe,
  className = "",
  emojiClassName = "",
  sizes = "(max-width: 28rem) 100vw, 28rem",
  children,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: gradientFor(recipe.id) }}
    >
      <span className={emojiClassName}>{recipe.emoji}</span>
      {recipe.photo && !failed && (
        <img
          src={recipe.photo}
          // Commons sert la miniature à la largeur demandée : on propose aussi
          // la version 2× pour que la photo reste nette sur les écrans retina.
          srcSet={`${recipe.photo} 640w, ${recipe.photo.replace("width=640", "width=1280")} 1280w`}
          sizes={sizes}
          alt={recipe.nom}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {children}
    </div>
  );
}
