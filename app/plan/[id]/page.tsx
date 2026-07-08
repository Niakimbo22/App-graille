import { RECIPES } from "@/lib/recipes";
import RecipeDetailClient from "./RecipeDetailClient";

// Pré-génère une page statique par recette (nécessaire pour l'export statique).
export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export const dynamicParams = false;

export default function Page({ params }: { params: { id: string } }) {
  return <RecipeDetailClient id={params.id} />;
}
