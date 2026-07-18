#!/usr/bin/env node
/**
 * add-photos.mjs — associe à chaque recette une vraie photo du plat.
 *
 * Source : Wikimedia Commons (fichiers vérifiés un par un — la recherche
 * confirme que chaque fichier existe). L'app pointe vers
 * `Special:FilePath/<fichier>?width=640`, URL stable qui redirige vers la
 * miniature hébergée par Wikimedia. Si une image ne charge pas (hors-ligne,
 * lien cassé), l'UI retombe sur l'emoji + dégradé d'origine.
 *
 * Usage : node scripts/add-photos.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPES_PATH = join(dirname(__dirname), "data", "recipes.json");

const W = 640;
const commons = (file) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${W}`;

// recette → nom exact du fichier sur Wikimedia Commons
const PHOTOS = {
  "one-pot-rigatoni-champignons": "Pasta with cream tuffle and mushrooms in Savour Cafe.jpg",
  "pates-crémeuses-epinards": "Spaghetti with Spinach and Cream Sauce.jpg",
  "spaghetti-aglio-olio": "Spaghetti aglio olio e peperoncino by matsuyuki retouched.jpg",
  "penne-arrabiata": "Penne all'arrabbiata.jpg",
  "mac-and-cheese": "Macaroni and cheese.jpg",
  "gnocchi-poelees-tomates": "Gnocchi al pomodoro 2.jpg",
  "pad-thai-poulet": "Pad Thai.JPG",
  "nouilles-sautees-legumes": "Yakisoba (fried noodles) with pork, onions, cabbage and carrot.jpg",
  "chili-sin-carne": "Chili con carne with beef, beans, chili peppers, garlic, black pepper, and a soft-boiled egg - Massachusetts.jpg",
  "dahl-lentilles-corail": "Tadka Daal (Indian lentil curry).jpg",
  "curry-pois-chiches-epinards": "Chana masala.jpg",
  "risotto-champignons": "Mushroom Risotto (4790041234).jpg",
  "risotto-courgette-citron": "Risotto-dish.jpg",
  "poulet-curry-coco": "Chicken curry.jpg",
  "poulet-basquaise": "Poulet basquaise 01.jpg",
  "poulet-teriyaki": "Chicken teriyaki.jpg",
  "emince-poulet-citron": "Lemonchicken.jpg",
  "escalope-milanaise": "Cotoletta alla milanese.jpg",
  "boeuf-bourguignon-express": "Boeuf Bourguignon.JPG",
  "boeuf-saute-brocoli": "Beef with broccoli.JPG",
  "saute-porc-caramel": "Thit-kho-tieu-1.jpg",
  "cotes-porc-moutarde": "Côte de Porc Fermière.jpg",
  "saucisses-lentilles": "Ragoût aux lentilles.jpg",
  "hachis-parmentier": "Hachis parmentier 01.jpg",
  "gratin-dauphinois-jambon": "Nudel-Schinken-Gratin.jpg",
  "saumon-teriyaki-four": "Teriyaki salmon.jpg",
  "pavé-saumon-poele": "Grilled salmon.jpg",
  "cabillaud-tomates-olives": "Dos de cabillaud rôti (avril 2022).JPG",
  "colin-lentilles-corail": "Dos de cabillaud rôti (avril 2022).JPG",
  "crevettes-ail-persil": "Gambas al ajillo.jpg",
  "risotto-crevettes": "Risotto-dish.jpg",
  "tacos-poisson": "Tacos de pescado en Maneadero, Ensenada, Baja California 04.jpg",
  "tarte-thon-tomate": "Préparation d'une tarte à la tomate (06) - sortie du four.jpg",
  "buddha-bowl-pois-chiches": "Healthy Gnocchi Buddha Bowl.jpg",
  "omelette-legumes": "Omelette de verduras.jpg",
  "frittata-courgette": "Frittata.jpg",
  "shakshuka": "Shakshuka (Unsplash).jpg",
  "soupe-legumes-vermicelles": "Vegetable soup.jpg",
  "soupe-potiron": 'Pumpkin soup at Pizzeria Ristorante "O Sole Mio", Mielec, Poland.jpg',
  "quiche-lorraine": "Quiche Lorraine.jpg",
  "galettes-sarrasin-oeuf": "Galette de sarrasin complète bretonne.jpg",
  "croque-monsieur": "Croque Monsieur.JPG",
  "pizza-margherita": "Eq it-na pizza-margherita sep2005 sml.jpg",
  "wrap-falafel": "Falafel & Hummus Wrap - Lavash 2024-08-19.jpg",
  "burger-vegetarien": "Veggie burger flickr user divinemisscopa creative commons.jpg",
  "gratin-courgettes": "Kabak au gratin.jpg",
  "tian-provencal": "Grilled vegetables - Parrillada de verduras (4586579546).jpg",
  "ratatouille-riz": "Ratatouille 001.jpg",
  "poelée-legumes-feta": "Grilled vegetables - Parrillada de verduras (4586579546).jpg",
  "salade-cesar": "Caesar salad (2).jpg",
  "salade-lentilles-chevre": "Pasta, Rocket, Red Lentils & Goat Cheese (4370431939).jpg",
  "wok-poulet-cajou": "Cashew chicken - Pollo con anacardos.JPG",
  "boeuf-bolognaise": "Spaghetti bolognese.jpg",
  "lasagnes-bolognaise": "Lasagna bolognese.jpg",
  "tortilla-espagnole": "Tortilla-de-patatas.jpg",
  "chakchouka-merguez": "Couscous merguez, kedid, Tunisie 2021.jpg",
  "couscous-legumes": "Moroccan cuisine-Couscous with vegetables.jpg",
  "pancakes-oeufs-bacon": "Bacon pancakes.jpg",
  "nems-riz-cantonais": "Egg Fried rice.jpg",
  "gratin-chou-fleur": "Cauliflower-cheese.jpg",
  "parmentier-canard": "Hachis parmentier 01.jpg",
  "blanquette-veau-express": "Blanquette de Veau (3).JPG",
  "poulet-roti-legumes": "Roast chicken.jpg",
  "cordon-bleu-puree": "Cordonbleu.jpg",
  "nuggets-maison-frites": "Solomillos de pollo rebozados y fritos.jpg",
  "brochettes-poulet-airfryer": "Chan's Original Teriyaki Chicken on a Stick 01.jpg",
  "legumes-rotis-airfryer": "Grilled vegetables - Parrillada de verduras (4586579546).jpg",
  "croquettes-pomme-terre": "Croquettes with salad.jpg",
  "poivrons-farcis": "Dollma,Speca te mbushur me mish dhe oriz.jpg",
  "soupe-thai-coco": "Chiang Mai, Thailand, Tom Kha, Thai coconut soup.jpg",
  "moules-frites": "Moules-frites.jpg",
  "sardines-grillees-ratat": "Sardines 04 beach Torre del Mar.JPG",
  "thon-mi-cuit-sesame": "Sesame crusted tuna, August 2015.jpg",
  "quiche-poireaux": "Quiche lorraine 02.JPG",
  "boulettes-boeuf-tomate": "Spaghetti and meatballs.jpg",
  "kebab-maison": "Döner kebab.jpg",
  "chili-con-carne": "Chili con carne with beef, beans, chili peppers, garlic, black pepper, and a soft-boiled egg - Massachusetts.jpg",
  "gratin-ravioles": "Gratin de ravioles.jpg",
  "polenta-cremeuse-champi": "Polenta fritta con sugo di funghi (49653224258).jpg",
  "oeufs-cocotte": "Oeufs cocotte provencale.jpg",
  "soba-cacahuete": "Yakisoba (fried noodles) with pork, onions, cabbage and carrot.jpg",
  "tofu-general-tao": "Spicy orange glazed tofu w Israeli couscous and ginger glazed carrots.jpg",
  "boulettes-veg-boulgour": "Bowl of falafel.jpg",
  "wrap-poulet-cesar": "Chicken Taco Wraps.jpg",
  "pates-thon-citron": "Pasta with tomato sauce, capers and tuna.jpg",
  "salade-quinoa-feta": "Tabouleh 1.JPG",
  "burrito-bowl": "Burrito Bowl.jpg",
  "orecchiette-brocoli": "Orecchiette broccoli e salsiccia.jpg",
  "pot-au-feu-express": "Pot-au-feu 1.jpg",
  "keftas-agneau-semoule": "Kafta shish kebab and grilled vegetables on salad - Cambridge, MA.jpg",
  "saumon-pates-crémeuses": "Pasta with cold-smoked salmon and peas in Loviisa.jpg",
  "gnocchi-gorgonzola": "Gnocchi di patate con sugo di pomodoro e con gorgonzola.jpg",
  "dorade-four-legumes": "Dorade royale de ratatouille.jpg",
  "velouté-carotte-cumin": 'Pumpkin soup at Pizzeria Ristorante "O Sole Mio", Mielec, Poland.jpg',
  "galette-pomme-terre-jambon": "Virve rosti 1.jpg",
  "tarte-tomate-moutarde": "Préparation d'une tarte à la tomate (06) - sortie du four.jpg",
  "riz-saute-kimchi": "Kimchi fried rice 2.jpg",
  "gratin-dauphinois-express": "Gratin dauphinois.jpg",
  "soupe-poireaux-pommes-terre": "Vichyssoise.jpg",
  "curry-lentilles-corail-coco": "Tadka Daal (Indian lentil curry).jpg",
  "poelee-gnocchi-chevre-epinards": "Gnocchi Verde.jpg",
  "wok-boeuf-brocoli": "Beef with broccoli.JPG",
  "salade-cesar-poulet": "Chicken Caesar salad at the office.jpg",
  "saumon-poele-ecrasee": "Salmon al horno.jpg",
  "omelette-champignons-gruyere": "Omelette.JPG",
  "penne-saumon-fume-creme": "Pasta with cold-smoked salmon and peas in Loviisa.jpg",
  "gratin-chou-fleur-bechamel": "Cauliflower-cheese.jpg",
  "nouilles-sautees-crevettes": "Yakisoba (fried noodles) with pork, onions, cabbage and carrot.jpg",
  "tarte-tomate-moutarde-chevre": "Préparation d'une tarte à la tomate (06) - sortie du four.jpg",
  "poelee-merguez-semoule": "Couscous merguez, kedid, Tunisie 2021.jpg",
  "gratin-courgettes-riz": "Kabak au gratin.jpg",
  "poulet-sesame-miel": "Chinese Honey sesame chicken picture.JPG",
  "soupe-potiron-coco": 'Pumpkin soup at Pizzeria Ristorante "O Sole Mio", Mielec, Poland.jpg',
  "gratin-pates-thon": "Nudel-Schinken-Gratin.jpg",
  "buddha-bowl-quinoa-feta": "Healthy Gnocchi Buddha Bowl.jpg",
  "poelee-legumes-halloumi": "Grilled vegetables - Parrillada de verduras (4586579546).jpg",
  "tajine-poulet-citron": "Moroccan food-Chicken tagine with preserved lemons and olives-01.jpg",
  "pates-carbonara": "Spaghetti alla Carbonara.jpg",
  "riz-cantonais": "Egg Fried rice.jpg",
  "poke-bowl-thon": "Ahi tuna Poke.jpeg",
  "tajine-poulet-olives": "Tajine poulet olives.jpg",
  "couscous-poulet-merguez": "Couscous Royal Marocain.JPG",
  "kefta-boeuf-tomate": "Beef kofta kebab at the Folklife Festival.jpg",
  "boulettes-agneau-boulgour": "Kafta shish kebab and grilled vegetables on salad - Cambridge, MA.jpg",
  "poulet-yassa": "Poulet Yassa.JPG",
  "biryani-poulet": "Chicken Biryani.jpg",
  "chakchouka-oeufs": "Shakshuka1.jpg",
  "cabillaud-chermoula": "Dos de cabillaud rôti (avril 2022).JPG",
};

function main() {
  const recipes = JSON.parse(readFileSync(RECIPES_PATH, "utf8"));
  let avec = 0;
  const sans = [];
  for (const rec of recipes) {
    const file = PHOTOS[rec.id];
    if (file) {
      rec.photo = commons(file);
      avec++;
    } else {
      delete rec.photo;
      sans.push(rec.id);
    }
  }
  writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2) + "\n");
  console.log(`✅ ${avec}/${recipes.length} recettes avec photo.`);
  if (sans.length) console.log(`   sans photo (fallback emoji) : ${sans.join(", ")}`);
}

main();
