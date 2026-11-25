# Cours particuliers

Site statique (HTML/CSS/JS, sans dépendance) publié avec GitHub Pages.
Une animation par chapitre de Terminale spécialité maths, plus quelques rappels de Première.

```
index.html                     accueil : chapitres classés par thème
assets/style.css               style commun
assets/js/fig.js               utilitaires de dessin (canvas)
assets/js/espace.js            petit moteur 3D (vue tournable) pour la géométrie dans l’espace

terminale/                     une page (.html + .js) par chapitre
  recurrence                   dominos (initialisation, hérédité) et somme des impairs
  limites-suites               bande autour de la limite, rang N, seuil A
  suites-escalier              u(n+1) = f(u(n)) : escalier et point fixe
  limites-fonctions            x → ±∞ ou x → a, asymptotes
  continuite                   valeurs intermédiaires, dichotomie
  convexite                    tangente qui tourne, pente croissante, inflexion
  logarithme                   miroir de exp, règle à calcul (produits → sommes)
  trigo                        la pente de sin dessine cos
  primitives                   champ de directions, solutions d’équations différentielles
  integrale                    rectangles, aire qui s’accumule (F′ = f)
  espace-vecteurs              un plan = un point + deux directions
  espace-orthogonalite         projeté orthogonal, distance point-plan
  espace-equations             droite paramétrée qui traverse un plan
  denombrement                 k-uplets, arrangements, combinaisons
  binomiale                    planche de Galton
  sommes-va                    sommes de dés : espérance et variance s’ajoutent
  grands-nombres               la moyenne se concentre autour de l’espérance

premiere/                      rappels de Première
  trigo                        cercle trigonométrique, cos et sin
  suites-arithmetiques         suites arithmétiques   (script commun : suites.js)
  suites-geometriques          suites géométriques
  derivee                      nombre dérivé : de la sécante à la tangente
```

## Ajouter une animation

1. Copier une page de `terminale/` (le `.html` et son `.js`) sous un nouveau nom, sans accent ni espace.
2. Adapter le titre, le texte et le dessin.
3. Ajouter une ligne dans la bonne liste de `index.html`.

## Voir le site en local

```bash
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.
