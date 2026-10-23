# Vérification de la version 0.1

Effectuée le 23 octobre 2026.

- 6 tests automatisés réussis : lecture CSV français, SKU textuels, catalogue à deux lignes d’en-tête, règles de points par ticket, réimports et modifications, validation clients/dates/montants, restriction des liens produits.
- Interface vérifiée dans le navigateur intégré, à sa taille habituelle et avec un écran mobile de 390 × 844.
- Import du modèle fictif : 3 nouvelles lignes, 2 tickets, 76 points à attribuer au total. Après confirmation, Camille passe de 107 à 171 points et voit ses 2 nouvelles lignes avec les photos du site et les bons liens de variantes.
- Chargement des 5 images présentes dans l’historique de Camille après cet import confirmé.
- Recherche du contenu QR `winess-club:member:DEMO-002` : seul Alex apparaît dans les résultats.
- Fichier HTML autonome vérifié via HTTP, avec son catalogue intégré et sans import de module externe.
- Ouverture directe du fichier autonome non vérifiée : le navigateur intégré interdit le protocole `file:`. La source modulaire requiert un serveur HTTP.
- Aucune authentification, aucun SMS ni aucune permission serveur testés : ces services ne sont pas connectés dans cette version.

L’archive contient uniquement le code, les documents, les données produit publiques et les exemples fictifs. Le fichier Numbers original et les fichiers de travail ne sont pas inclus.

## Vérification 0.2

- Formulaire client rempli avec des valeurs fictives : création confirmée, nom affiché, nouvelle carte et solde initial nul.
- Clic sur le petit QR : fenêtre avec QR agrandi affichée. Clic sur le grand QR : retour à la carte confirmé.
- Entrée administrateur : nom et e-mail fictifs saisis, tableau d’administration affiché après confirmation.
- Les fichiers autonomes ont été testés via HTTP local, sans publication ni connexion à des services d’authentification.

## Vérification 0.4

- Deux entrées : boutique avec boutons Espace boutique et Administration visibles dans le menu gauche ; client séparé.
- Ticket fictif TEST-NOTIFICATION-001 enregistré pour Camille : 20 € et 20 points.
- Dans un deuxième onglet client, apparition automatique d’une notification non lue liée à ce ticket et augmentation du solde de 107 à 127 points.
- Les six tests automatisés du moteur d’import restent réussis.
- Le schéma Supabase n’a pas été appliqué : opération refusée par la revue automatique. Aucun test de droits ni de connexion Realtime distante n’est donc présenté comme réussi.

## Vérification 0.5

- Vendeur : saisie d’un nom/e-mail fictifs, rechargement, retour à la boutique avec nom et bouton Déconnexion.
- Administrateur : ouverture via le menu gauche, saisie de test, rechargement, retour direct au tableau administrateur.
- Déconnexion boutique puis rechargement : formulaire vendeur présenté à nouveau.
- Client : récupération d’une carte existante par téléphone fictif, rechargement puis ouverture dans un nouvel onglet : même carte et mêmes achats conservés, bouton Déconnexion affiché.
- Déconnexion client dans un onglet : les deux onglets reviennent au formulaire. Aucun achat ni membre n’est effacé.
- Aucun mot de passe ni jeton de connexion réel n’est enregistré par cette fonctionnalité de démonstration.
