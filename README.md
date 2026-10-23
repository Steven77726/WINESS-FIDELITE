# Winess Club — Démonstration 0.6

Deux accès mobiles : **staff.html** (vendeur et administration dans le même menu) et **client.html**. Les pages sont préparées pour GitHub Pages. La disponibilité publique dépend de l’activation de Pages et de la réussite du déploiement GitHub Actions.

## Fonctionnement

- Téléphone client facultatif. S’il est renseigné : exactement 12 chiffres, sans + ni préfixe imposé.
- Affichage iPhone, QR agrandi au toucher et fermeture au second toucher.
- Scan QR par caméra ou image, identification du client puis saisie des achats.
- Photos et liens produits Winess associés au SKU exact.
- Imports CSV et points configurables avec contrôle des doublons.
- Centre de notifications client, mémorisation locale et bouton Déconnexion.

**Utiliser uniquement des informations fictives.** Les rôles ne sont pas authentifiés et la récupération locale ne vérifie pas l’identité. Les deux pages du même navigateur partagent leurs données, mais deux appareils ne se synchronisent pas. Les notifications push et SMS sont désactivées.

## Construire et vérifier

Node.js 22, sans installation de dépendances :

```sh
npm test
npm run build
```

Le constructeur génère uniquement les pages dans `dist/`. Pour tester :

```sh
python3 -m http.server 4319 --bind 127.0.0.1 --directory dist
```

Ouvrir staff.html et client.html via HTTP dans le même navigateur.

## Publication

Le workflow `.github/workflows/pages.yml` teste, construit puis déploie uniquement `dist/` sur GitHub Pages. [Guide de déploiement](docs/DEPLOIEMENT-GITHUB.md).

Ni les sources backend, ni le fichier Numbers original, ni les saisies locales ne sont publiés. Le catalogue intégré contient uniquement les correspondances produit publiques vérifiées.

## Base commune prévue

Le propriétaire a choisi son projet Supabase existant et une connexion par e-mail pour démarrer. Le schéma n’a pas été appliqué : la revue automatique exige une approbation explicite des tables, droits et changements Realtime. [Périmètre à approuver](backend/ACTIVATION-A-APPROUVER.md).

## Documents

- [Cahier des charges](docs/CAHIER-DES-CHARGES.md)
- [iPhone et essais](docs/IPHONE-ET-TEST-EN-LIGNE.md)
- [Vendeur et scan QR](docs/ESPACE-VENDEUR.md)
- [Vérifications](docs/VERIFICATION.md)

## Dépendances

qrcode-generator 1.4.4 (MIT, notice dans le fichier), jsQR 1.4.0 (Apache 2.0, licence dans vendor/). Polices Google Fonts et photos publiques Shopify/Winess. Aucune image de scan n’est transmise à un service de reconnaissance.
