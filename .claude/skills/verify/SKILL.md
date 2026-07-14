---
name: verify
description: Lancer et piloter Miam (PWA Next.js) pour vérifier un changement en conditions réelles.
---

# Vérifier Miam en conditions réelles

## Build & lancement

- `npm ci` puis `npm run dev` (prêt en ~2 s sur http://localhost:3000).
- Build production GitHub Pages : `GITHUB_PAGES=true npm run build` (export statique, basePath `/App-graille`).
- Tests unitaires : `npm test` (tsx, planner). Pas de config ESLint : `npm run lint` ouvre une invite interactive — ne pas l'utiliser.

## Piloter avec Playwright

- Pas de playwright dans les deps : installer `playwright-core` dans le scratchpad et lancer avec
  `executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"` (le chemin contient le numéro de build, vérifier avec `ls /opt/pw-browsers`).
- Viewport mobile conseillé : 390×844 (l'app est max-w-md).

## Parcours utiles

- Générer un plan sans se taper le funnel : aller directement sur `/onboarding/generation` — le plan se génère avec les valeurs par défaut et redirige vers `/plan` après ~4,5 s.
- Tout l'état vit dans localStorage (`miam-state`, `miam-profils`) : recharger la page pour tester la persistance, `context.clearCookies()` ne suffit pas — nouveau contexte navigateur = état vierge.
- Les confirmations utilisent `window.confirm` : brancher `page.on("dialog", d => d.accept())`.

## Pièges

- L'hydratation affiche « chargement… » : toujours `waitForSelector` sur un texte de la page avant `isVisible()`/screenshot, sinon faux négatifs.
- `router.replace` (nettoyage d'URL sur /favoris) est asynchrone : attendre avant de lire `page.url()`.
