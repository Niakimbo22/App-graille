import { Suspense } from "react";
import FavorisClient from "./FavorisClient";

export default function FavorisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center text-forest">chargement…</div>
      }
    >
      <FavorisClient />
    </Suspense>
  );
}
