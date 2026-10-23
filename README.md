# Winess Club — V1 connectée 0.7

Deux accès iPhone et ordinateur : **staff.html** (vendeur et administration dans le même menu) et **client.html**. Publication avec GitHub Pages ; la réussite du workflow et l’activation Pages sont nécessaires avant de diffuser les liens.

## Fonctionnement

- Connexion par e-mail et mot de passe, confirmation de l’adresse via Supabase. Session conservée jusqu’à Déconnexion ; sessions client et boutique distinctes.
- Fiche client en base commune. Téléphone facultatif ; s’il est renseigné, exactement 12 chiffres sans signe + ni préfixe imposé.
- QR agrandi au toucher. Le QR contient un lien boutique qui sélectionne la fiche après connexion du vendeur.
- Scan caméra ou image, lecteur clavier, recherche par nom, carte ou téléphone. La fiche sélectionnée est amenée à l’écran, y compris sur iPhone.
- Achats enregistrés dans une transaction serveur, points et notification uniques par ticket. Les doublons exacts sont sans effet, les contenus contradictoires sont refusés.
- Photos et liens marchands associés au SKU exact : 1 423 correspondances publiques.
- Realtime Supabase pour les fiches, achats, points, règles et notifications. Une réconciliation toutes les 15 secondes et au retour dans l’application rattrape les événements manqués.
- Client : uniquement sa fiche et ses achats. Vendeur : fiches et achats. Administrateur : règles, VIP et autorisation des vendeurs par e-mail.

La remise VIP est à appliquer dans Wino. L’application n’écrit pas dans Wino. Les notifications restent dans l’espace client : les alertes push et SMS ne sont pas activées.

## Démarrer

Le propriétaire utilise **steven@sabwine.com** pour créer et confirmer son accès boutique ; son rôle administrateur est vérifié côté serveur. Aucun mot de passe administrateur n’est inclus dans les sources. Les collègues créent leur accès avec une adresse préalablement autorisée dans Administration → Équipe.

Les anciennes cartes `DEMO-*` ne sont pas transférées en base : chaque testeur doit créer son accès et sa nouvelle carte depuis le lien client. Les saisies de démonstration restent locales à l’ancien navigateur.

La délivrabilité des e-mails de confirmation doit être vérifiée pour les adresses des collègues. Le projet Supabase existant peut nécessiter son propre service SMTP. Après confirmation, revenir sur le lien Winess si la redirection du projet ouvre une autre application.

## Construire et vérifier

Node.js 22, sans installation de dépendances :

```sh
npm test
npm run build
```

Le constructeur génère `dist/index.html`, `dist/staff.html` et `dist/client.html`. Seul `dist/` est publié. Les scripts fournisseur sont intégrés et figés : qrcode-generator 1.4.4, jsQR 1.4.0 et supabase-js 2.118.0 ; licences dans `vendor/`.

`app.js` conserve l’ancienne démonstration pour référence ; la version publiée utilise `connected.js`. La clé Supabase côté navigateur est une clé **publishable**, jamais une clé secrète. Les droits sont imposés par les politiques RLS et fonctions de la base.

## Validation

- Tests Node : imports, montants, points, doublons, liens produits, parsing QR et ouverture de la bonne fiche après lecture serveur.
- `backend/verification.sql` : vérification transactionnelle réelle des droits, lookup membre, achat, idempotence, points et notifications dans Supabase. Tous les utilisateurs et achats de test sont annulés en fin de transaction.
- Connexion affichée dans le navigateur local ; validation d’inscription e-mail avec une vraie boîte et essai caméra physique restent à faire avec le propriétaire.
