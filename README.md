# 🥗 Miam — planificateur de repas de la semaine

Clone fonctionnel et **100% gratuit** d'un meal planner à la [Romi](https://tryromi.com).
Réponds à quelques questions (magasin, budget, régime, ambiance, personnes, repas, équipement),
Miam compose ta semaine — **dîners seuls, dîners cuisinés en double pour le midi, ou deux plats
différents par jour** — et génère la **liste de courses triée par rayon**.

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
magasin → budget → régimes → ambiance → **envies** → personnes → jours → **repas** → équipement) →
`/onboarding/generation` (écran de génération animé) → `/plan` (les recettes + coût) →
`/plan/[id]` (détail recette + swap) → `/liste` (liste de courses par rayon, cases cochables).

L'étape **envies** permet de demander « un peu plus de poulet / viande rouge / poisson /
porc / végétal / œufs » et d'activer les **fruits & légumes de saison**.
L'étape **repas** choisit ce qu'il faut couvrir dans une journée (voir « Midi et soir » ci-dessous).

L'état (réponses, plan courant, articles cochés) est persisté dans `localStorage`
sous la clé `miam-state`. Au retour, la landing propose **« reprendre ma semaine »**.

## 🗂 Structure

```
app/
  layout.tsx                 # shell + police Inter + MiamProvider + métadonnées PWA
  page.tsx                   # landing (hero, "comment ça marche", exemples, CTA)
  onboarding/
    magasin/ budget/ regimes/ ambiance/ envies/ personnes/ jours/ repas/ equipement/
    generation/              # génère le plan + checklist animée puis redirige
  plan/
    page.tsx                 # résultats : bandeau, coût, liste, cards jour + créneau, régénérer
    [id]/page.tsx            # détail recette : macros, allergènes, ingrédients, étapes, swap
  liste/page.tsx             # liste de courses agrégée, groupée par rayon
components/
  OnboardingLayout, SelectCard, PillButton, ProgressBar, RecipeCard, TagPill
context/
  MiamContext.tsx            # état global + persistance localStorage
lib/
  planner.ts                 # algorithme de sélection (pur, testé)
  planner.test.ts            # 17 cas de test
  repas.ts                   # modes de journée (dîner / restes / midi et soir), créneaux, portions
  ingredients.ts             # un emoji par ingrédient (liste de courses, détail recette)
  saison.ts                  # calendrier fruits & légumes de saison (France)
  shopping.ts                # agrégation de la liste de courses par rayon
  recipes.ts / stores.ts / tags.ts / gradient.ts / format.ts / types.ts
data/
  recipes.json               # 150+ recettes (généré)
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
3. **Bonus de créneau** — en mode restes, `+3` pour un plat qui se réchauffe bien
   (`seConserveBien`, `lib/repas.ts`) ; le midi du mode « midi et soir », `+2` si
   `tempsMin ≤ 25` et `+1` si `kcal ≤ 600`.
4. **Sélection** — un plat par créneau par tirage pondéré par le score (RNG déterministe
   `mulberry32`, seedé pour que « régénérer » varie), avec diversité (pas deux fois la même
   protéine de suite), en respectant `Σ(prixParPersonne × parts × coefMagasin) ≤ budget`.
5. **Budget trop serré** — on privilégie les recettes les moins chères et on affiche le vrai total.

Prix affichés = `prixParPersonne × parts × coefMagasin`, arrondis à 2 décimales
(`parts` = `personnes`, doublé en mode restes).
Coefficients magasin : Lidl/Aldi `0.85`, la plupart `1.0`, Grand Frais/Franprix `1.25`.

## 🍱 Midi et soir (`lib/repas.ts`)

L'étape **repas** du funnel choisit ce qu'une journée doit couvrir :

| mode | plats composés | parts achetées | effet sur l'algo |
|---|---|---|---|
| `diner` | 1 par jour | `personnes` | comportement historique |
| `restes` | 1 par jour | `personnes × 2` | bonus aux plats qui se réchauffent, quantités et liste doublées |
| `double` | 2 par jour (midi + soir) | `personnes` | deux plats différents, le plus rapide/léger passe au midi |

`creneauxPlan(nbPlats, mode)` associe à chaque plat son jour et son créneau
(« dîner », « dîner + boîte du midi », « midi », « soir ») : c'est ce qui pilote l'en-tête
des cards, le libellé du détail recette et le bonus de score par créneau.
`portionsAcheter(personnes, mode)` est la seule source des quantités affichées et facturées
(détail recette, liste de courses, prix du plan). Les plans enregistrés avant cette étape
n'ont pas de `modeRepas` : on retombe sur `diner`, rien ne bouge pour eux.

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
3. `node scripts/price-fr.mjs` recalcule les prix depuis la table d'ingrédients
   (un ingrédient inconnu fait échouer le script).
4. `node scripts/add-photos.mjs` réassocie les photos (voir ci-dessous).
5. `npm test` pour vérifier que l'algorithme tourne toujours.

## 📸 Les images

- **Photos de plats** : `scripts/add-photos.mjs` associe à chaque recette un fichier
  Wikimedia Commons et écrit l'URL `Special:FilePath/<fichier>?width=640` dans
  `data/recipes.json`. Les 156 recettes en ont une. Le script affiche la couverture,
  les entrées orphelines et **les images partagées par plusieurs recettes** — deux plats
  d'une même semaine ne devraient pas afficher la même photo.
- **Repli** : `RecipePhoto` garde l'emoji + dégradé tant que la photo n'est pas chargée,
  et pour toujours si elle échoue (hors ligne, lien cassé, fichier renommé sur Commons).
  Une photo manquante ou morte ne casse donc jamais l'écran.
- **Netteté** : `srcSet` propose la miniature en 640 et 1280 px ; chaque appelant passe
  la largeur réelle via `sizes` (`56px` pour une vignette de favori, `33vw` sur la landing)
  pour ne pas télécharger une grande image dans un petit cadre.
- **Emojis d'ingrédients** : `lib/ingredients.ts` donne un emoji aux 188 ingrédients de la
  base (liste de courses et détail recette). Un ingrédient inconnu retombe sur un mot-clé
  puis sur l'emoji de son rayon : jamais de trou dans la liste.

## 🎨 Design

Fond crème `#F3EFE6`, vert foncé `#1D5A3C`, vert vif `#4CAF3E`, jaune liste `#F7C948`.
Cards blanches très arrondies, ombres douces, sélection avec glow vert, tags pastel,
boutons pill vert foncé pleine largeur. Tout en minuscules pour les questions du funnel.

## 📦 Déploiement Vercel

Importer le repo sur Vercel → framework détecté « Next.js » → deploy. Rien à configurer.
