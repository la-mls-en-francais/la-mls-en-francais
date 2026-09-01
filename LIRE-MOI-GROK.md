# La MLS en Français — brief pour une autre IA

Projet d'Arnaud Salas. Site perso MLS en français (articles + magazines Heyzine + scores).
Continuer CE dossier, ne pas reconstruire un nouveau site.

Langue : français, tutoiement, phrases courtes. Souvent sur téléphone.
Après une modif importante : zip La-MLS-en-Francais.zip du dossier folio.

## URL et hebergement
- https://flat-snow-54b8.7vpwfnf74b.workers.dev/
- Cloudflare Workers static assets, projet flat-snow
- Upload : contenu de folio/ (html, css, js, img, data). PAS de wrangler.toml ni _worker.js
- GitHub : https://github.com/la-mls-en-francais/la-mls-en-francais.git
- Netlify ABANDONNE (credits). Ne plus y deployer.

## Fonctions
- Accueil : Une magazines + articles ; droite Actualite puis Mercato (ESPN, traduits FR, 7+7)
- Articles articles.html / article.html?id= — categories MLS et Soccer US
- Magazines bibliotheque.html / lire.html?id= (Heyzine)
- Matchs matchs.html : ESPN usa.1, classements Est/Ouest, lignes playoffs et Wild Card, buteurs/passeurs
- Matchs tries du plus proche au plus lointain
- Classement ordi tableau complet ; telephone # Club Diff Pts sans scroll horizontal
- Wero : QR + email arnaudsalas@hotmail.fr + bouton Copier
- Stats : Cloudflare Web Analytics beacon token 23386e57e82442c2a7a253814341fc16 — ne PAS charger si folio_auth=1 ou folio_nostats=1
- Lectures : CounterAPI namespace lamlsenfrancais cles article-ID et magazine-ID — ne pas incrementer en redac ni preview
- PWA : manifest.json, sw.js, img/icon-192.png et icon-512.png (logo sans fond noir)
- Newsletter : localStorage seulement ; Brevo a brancher
- Fil X auto : MORT (API 402). Lien @MLS_FRA2 seulement

## Redaction privee
- /redaction.html (ecrire.html et publier.html redirigent ici)
- PAS dans le menu public. Onglet Redaction seulement si folio_auth=1
- Mot de passe local folio_pass
- MLS | Soccer US ; Publier ; Brouillon ; Previsualiser ; import Word
- Brouillons status=draft invisibles au public
- Magazines Heyzine en bas de la redac
- Synchro tel/ordi : jsonblob, Creer un code / Entrer le code
- Pour le public : telecharger articles.js / magazines.js, remplacer folio/data/, reuploader folio
- JAMAIS remettre Ajouter un article dans un footer public

## Layout deja tranche
- Une grande a gauche ; Actu + Mercato empiles a droite
- Pas 3 colonnes, pas bandeau Matchs/Actu/Mercato sous le logo
- Wrap 1180px ; menu 1.05rem
- Ne pas redessiner le logo
- Pas de bloc Live et reseaux
- Typo articles = article.html existant

## Plus tard
Domaine ; Brevo ; Git vers Cloudflare sans zip ; notifs PWA ; compte X mls_fra si retrouve

## Qui travaille de la meme facon
Grok 4 / 4.6, Claude Sonnet ou Opus, ChatGPT avec fichiers/zip.
IA mini : texte seulement, pas la structure.

Prompt a coller :
Lis LIRE-MOI-GROK.md dans folio. Site La MLS en Francais, Cloudflare flat-snow. Continue, ne reconstruis pas. Zip folio apres les changements.

Regle : un changement = un zip. Verifier tel + ordi. Pas de X API, pas de Netlify, pas d admin public.
