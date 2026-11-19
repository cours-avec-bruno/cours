# Cours particuliers

Site statique (HTML/CSS/JS, sans dépendance) publié avec GitHub Pages.

```
index.html                  accueil : liste des élèves
assets/style.css            style commun
assets/js/fig.js            utilitaires de dessin (canvas)
nail/index.html             page de Naïl (1re STI2D) : liste des séances
nail/seance-01/             séance 1 : trigonométrie et suites
  trigo.html / trigo.js     cercle trigonométrique, cos, sin et leurs courbes
  suites-arithmetiques.html suites arithmétiques
  suites-geometriques.html  suites géométriques
  suites.js                 animation commune aux deux pages de suites
```

## Ajouter un élève

1. Copier le dossier `nail/` sous un autre nom (sans accent ni espace), par ex. `lina/`.
2. Modifier son `index.html` (nom, classe, séances).
3. Ajouter une ligne dans la liste de `index.html` à la racine.

## Voir le site en local

```bash
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.
