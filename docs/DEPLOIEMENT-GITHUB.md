# Déploiement de test sur GitHub Pages

## État actuel

Le dépôt `Steven77726/WINESS-FIDELITE` est accessible en lecture, mais toujours vide. La tentative d’écriture du 23 octobre 2026 est refusée avec `403 Resource not accessible by integration`. Aucun code n’a été ajouté au dépôt et aucun déploiement n’a eu lieu.

Le propriétaire a choisi de rester sur GitHub. Aucun site n’a été créé ni publié chez un autre hébergeur.

## Paquet prêt

Le code source inclut un constructeur sans installation de dépendances et le workflow `.github/workflows/pages.yml`. Le constructeur produit uniquement :

- `dist/index.html`, avec les deux choix d’accès ;
- `dist/staff.html`, boutique et administration ;
- `dist/client.html`, espace client ;
- `dist/.nojekyll`.

Le schéma SQL préparé, les fichiers de travail et les exports privés ne sont pas copiés dans le site publié. Les données intégrées sont des exemples fictifs et le catalogue public du marchand. Les données éventuellement créées pendant les tests locaux ne sont pas intégrées au paquet.

## Étapes après rétablissement de l’accès

1. Autoriser la connexion GitHub utilisée ici à écrire dans `Steven77726/WINESS-FIDELITE`.
2. Envoyer les sources et le workflow dans le dépôt.
3. Dans les réglages du dépôt, choisir GitHub Actions comme source de GitHub Pages si ce n’est pas déjà configuré.
4. Lancer et vérifier le workflow. Seul son résultat réussi permet d’annoncer les deux URLs publiques.

Les noms des pages seront `staff.html` et `client.html` sous l’adresse GitHub Pages retournée par le déploiement. Aucune URL supposée n’est présentée comme déjà disponible.

## Limites pour les essais entre collègues

Les pages HTTPS permettront de tester l’iPhone et de demander l’accès caméra sur un appareil compatible. Les collègues doivent utiliser des informations fictives. Cette version n’authentifie pas les rôles et ne partage pas les données entre appareils. Le schéma Supabase reste à approuver et activer pour la base commune.

Le téléphone client est facultatif. Si rempli : exactement 12 chiffres, sans + ni préfixe imposé. Une carte sans téléphone peut être retrouvée dans la démo grâce à son identifiant.
