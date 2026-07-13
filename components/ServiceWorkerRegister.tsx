"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${prefix}/sw.js`).catch(() => {
      // pas grave : l'app fonctionne normalement sans SW, juste sans hors-ligne
    });
  }, []);

  return null;
}
