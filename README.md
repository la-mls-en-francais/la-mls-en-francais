# Folio — kiosque de magazines numériques

Site statique pour présenter et feuilleter vos magazines, dans l’esprit d’un Heyzine personnel.

## Contenu

- `index.html` — accueil
- `bibliotheque.html` — magazines
- `lire.html` — lecteur flipbook
- `articles.html` / `article.html` — textes
- `publier.html` — mode d’emploi
- `data/magazines.js` et `data/articles.js`
- `img/` — visuels d’exemple

## Mettre en ligne

Le dossier `folio` se dépose tel quel :

1. [Netlify Drop](https://app.netlify.com/drop) — glisser le dossier
2. Vercel, Cloudflare Pages ou GitHub Pages
3. Tout hébergement classique (OVH, o2switch, Infomaniak…)

Racine du site = contenu de `folio/` (`index.html` à la racine).

## Ajouter un article

Éditez `data/articles.js` et collez votre texte dans le champ `body` (HTML simple : `<p>`, `<h2>`).
Détail et exemple : page `publier.html`.

## Ajouter un magazine

Voir `publier.html` pour les trois méthodes :

1. Pages en images + entrée dans `data/magazines.js` (`mode: "folio"`)
2. Iframe Heyzine (`mode: "heyzine"` + `embedUrl`)
3. HTML exporté depuis Heyzine, hébergé dans le même dossier

## Personnaliser

- Nom et textes : fichiers HTML
- Couleurs : variables en tête de `css/style.css`
- Titres et textes : `data/magazines.js`, `data/articles.js`
