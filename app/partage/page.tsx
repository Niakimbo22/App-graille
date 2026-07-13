import { Suspense } from "react";
import PartageClient from "./PartageClient";

export default function PartagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center text-forest">chargement…</div>
      }
    >
      <PartageClient />
    </Suspense>
  );
}
