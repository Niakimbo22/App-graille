# 🥗 Miam — planificateur de repas de la semaine

Clone fonctionnel et **100% gratuit** d'un meal planner à la [Romi](https://tryromi.com).
Réponds à quelques questions (magasin, budget, régime, ambiance, personnes, équipement),
Miam compose **5 dîners** adaptés et génère la **liste de courses triée par rayon**.

- ✅ Aucun compte, aucun paywall
- ✅ Aucune API externe au runtime — base de recettes statique + `localStorage`
- ✅ Mobile-first, PWA-ready
- ✅ Déployable sur Vercel tel quel

## 🚀 Installation

```bash
npm install
npm run dev        # http://localhost:3000
```

Autres scripts :

```bash
npm run build      # build de production (doit passer sans erreur)
npm start          # sert le build de production
npm test           # teste l'algorithme de sélection (lib/planner.test.ts)
npm run gen        # régénère data/recipes.json depuis scripts/gen-recipes.mjs
```

## 🧭 Le parcours

`/` landing → `/onboarding/*` (funnel plein écran, une question par écran :
magasin → budget → régimes → ambiance → **envies** → personnes → jours → équipement) →
`/onboarding/generation` (écran de génération animé) → `/plan` (les 5 recettes + coût) →
`/plan/[id]` (détail recette + swap) → `/liste` (liste de courses par rayon, cases cochables).

L'étape **envies** permet de demander « un peu plus de poulet / viande rouge / poisson /
porc / végétal / œufs » et d'activer les **fruits & légumes de saison**.

L'état (réponses, plan courant, articles cochés) est persisté dans `localStorage`
sous la clé `miam-state`. Au retour, la landing propose **« reprendre ma semaine »**.

## 🗂 Structure

```
app/
  layout.tsx                 # shell + police Inter + MiamProvider + métadonnées PWA
  page.tsx                   # landing (hero, "comment ça marche", exemples, CTA)
  onboarding/
    magasin/ budget/ regimes/ ambiance/ envies/ personnes/ jours/ equipement/
    generation/              # génère le plan + checklist animée puis redirige
  plan/
    page.tsx                 # résultats : bandeau, coût, liste, 5 cards, régénérer
    [id]/page.tsx            # détail recette : macros, allergènes, ingrédients, étapes, swap
  liste/page.tsx             # liste de courses agrégée, groupée par rayon
components/
  OnboardingLayout, SelectCard, PillButton, ProgressBar, RecipeCard, TagPill
context/
  MiamContext.tsx            # état global + persistance localStorage
lib/
  planner.ts                 # algorithme de sélection (pur, testé)
  planner.test.ts            # 13 cas de test
  saison.ts                  # calendrier fruits & légumes de saison (France)
  shopping.ts                # agrégation de la liste de courses par rayon
  recipes.ts / stores.ts / tags.ts / gradient.ts / format.ts / types.ts
data/
  recipes.json               # 100+ recettes (généré)
scripts/
  gen-recipes.mjs            # source des recettes → data/recipes.json
public/
  manifest.json, icon.svg
```

## 🧮 Algorithme de sélection (`lib/planner.ts`)

1. **Filtre** — régimes compatibles (un plat végé convient au pescétarien ; `sans-gluten`
   /`sans-lactose` excluent l'allergène correspondant ; `halal` exclut porc/charcuterie et
   alcool, détectés depuis les ingrédients), équipement requis ⊆ équipement dispo.
2. **Score** — `+2` par tag matchant une ambiance choisie, `+1` si `tempsMin ≤ 25`
   quand « rapide & facile » est coché, `+3` si la protéine dominante correspond à une
   **envie** cochée (poulet, viande rouge, poisson…), et — si l'option **saison** est
   activée — `+3` pour une recette pleinement de saison, `−2` par ingrédient hors saison.
   Une envie autorise aussi la même protéine à revenir d'un soir à l'autre (diversité relâchée).
3. **Sélection** — 5 recettes par tirage pondéré par le score (RNG déterministe `mulberry32`,
   seedé pour que « régénérer » varie), avec diversité (pas deux fois la même protéine de suite),
   en respectant `Σ(prixParPersonne × personnes × coefMagasin) ≤ budget`.
4. **Budget trop serré** — on privilégie les recettes les moins chères et on affiche le vrai total.

Prix affichés = `prixParPersonne × personnes × coefMagasin`, arrondis à 2 décimales.
Coefficients magasin : Lidl/Aldi `0.85`, la plupart `1.0`, Grand Frais/Franprix `1.25`.

## 🌱 Fruits & légumes de saison (`lib/saison.ts`)

Un calendrier France mois par mois (`CALENDRIER`) associe chaque produit à ses mois de
pleine saison. Les produits disponibles toute l'année (oignon, ail, pomme de terre,
carotte, herbes séchées, agrumes…) sont marqués `annee: true` : jamais « hors saison »,
mais absents de la liste des nouveautés du mois.

- `estDeSaison(nom, mois?)` → `true` / `false` / `null` (produit inconnu = neutre).
- `saisonnaliteRecette(recipe)` analyse les ingrédients du rayon Fruits & Légumes.
- `produitsDuMois(mois?, categorie?)` alimente le panneau « de saison ce mois-ci ».

Le mois courant est déduit de la date. Ces infos servent au **scoring** (option saison),
au **badge « 🌱 de saison »** sur les recettes, aux **pastilles saison/hors-saison** dans
la liste de courses et le détail recette, et au **panneau saison** de la page plan.

## 🍽 Ajouter ou modifier des recettes

Les recettes ne sont **pas** éditées à la main dans `data/recipes.json` : elles sont
décrites dans `scripts/gen-recipes.mjs`, où le prix par personne d'une recette est
**calculé automatiquement** comme la somme des prix de ses ingrédients.

1. Ajoute une entrée `r(id, nom, emoji, tempsMin, tags, regimes, equipement, allergenes, kcal, macros, ingredients, etapes)`.
   - `ingredients` : `[nom, qteParPersonne, unite, rayon, prixParPersonne]`
   - `tags` ∈ `rapide, gourmand, protéiné, healthy, famille, du monde`
   - `regimes` ∈ `vegetarien, pescetarien, sans-gluten, sans-lactose` (vide = tout public).
     `halal` n'est **pas** un champ : il est déduit des ingrédients (ni porc/charcuterie ni alcool).
   - `equipement` ∈ `four, plaque, airfryer`
   - `rayon` ∈ `Fruits & Légumes, Boucherie/Poisson, Crèmerie, Épicerie salée, Épicerie sucrée, Surgelés, Boulangerie`
2. Lance `npm run gen` — le script valide (prix, nombre d'ingrédients/étapes, ids uniques)
   et réécrit `data/recipes.json`.
3. `npm test` pour vérifier que l'algorithme tourne toujours.

## 🎨 Design

Fond crème `#F3EFE6`, vert foncé `#1D5A3C`, vert vif `#4CAF3E`, jaune liste `#F7C948`.
Cards blanches très arrondies, ombres douces, sélection avec glow vert, tags pastel,
boutons pill vert foncé pleine largeur. Tout en minuscules pour les questions du funnel.

## 📦 Déploiement Vercel

Importer le repo sur Vercel → framework détecté « Next.js » → deploy. Rien à configurer.
