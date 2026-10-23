# Activation Supabase à approuver

Projet choisi par le propriétaire : **Steven77726's Project**, région eu-west-1, référence `dnpcrousaeoyyuxszwwm`.

État : **schéma préparé, application refusée par la revue automatique, aucune nouvelle table créée**. Les interfaces actuellement servies utilisent encore la démonstration locale. La connexion réelle par e-mail a été choisie par le propriétaire ; elle reste à intégrer après activation de la structure.

## Changement proposé et fichier exact

`backend/schema.sql` crée uniquement les objets Winess Club suivants :

- Six tables publiques : `wc_members`, `wc_products`, `wc_settings`, `wc_sales`, `wc_sale_lines`, `wc_notifications`.
- Une table privée `wc_private.staff_emails`, avec `steven@sabwine.com` comme propriétaire administrateur, utilisable seulement après authentification et vérification de cette adresse.
- Six points d’entrée authentifiés : rôle courant, création/modification de sa fiche, correction d’une fiche par le personnel, enregistrement atomique d’un ticket, lecture d’une notification et gestion des vendeurs par l’administrateur.
- Politiques d’accès par ligne : chaque client lit uniquement ses propres données ; le personnel authentifié et autorisé accède aux fiches et achats ; seul l’administrateur gère VIP, règles et autorisations vendeurs.
- Le catalogue public reste lisible publiquement. Les écritures de ventes ne sont pas accessibles aux visiteurs anonymes.
- Ajout des cinq tables `wc_members`, `wc_sales`, `wc_sale_lines`, `wc_notifications`, `wc_settings` à la publication Supabase Realtime.

Un ticket, ses lignes, ses points et sa notification sont enregistrés dans une même transaction. Un ticket identique réessayé retourne son identifiant existant et ne double pas les points ni la notification ; un ticket de même référence avec un contenu différent est refusé. Les points sont calculés sur le serveur.

Les tables, données et fonctions existantes des autres applications ne sont pas remplacées. La publication Realtime existante reçoit les nouvelles tables Winess. Aucun mot de passe, aucune clé serveur et aucune donnée client réelle ne sont inclus.

## Après approbation

1. Appliquer le schéma et vérifier les accès anonymes, clients et personnel, les transactions et les alertes de sécurité.
2. Charger les correspondances produit publiques vérifiées.
3. Brancher la connexion e-mail et les interfaces sur les lectures/écritures Supabase avec les sessions authentifiées.
4. Tester la réception Realtime et le centre de notifications entre sessions distinctes.
5. Publier les deux accès sous HTTPS sur l’hébergement du propriétaire.

Les notifications dans l’espace client sont distinctes des alertes push sur téléphone fermé. Les push nécessiteront une souscription autorisée sur l’appareil, un hébergement HTTPS et un mécanisme d’envoi. Les SMS nécessitent un fournisseur configuré ; la connexion téléphonique est actuellement désactivée dans ce projet. Aucun envoi réel de SMS ou de mail n’a été effectué pour cette préparation.

## État des comptes

Le contrôle en lecture seule n’a trouvé aucun compte Auth existant correspondant à `steven@sabwine.com`. Le propriétaire devra créer/vérifier son compte lors de la connexion. Le code court précédemment communiqué n’est pas enregistré dans le projet.

## Pourquoi l’approbation est redemandée

La revue automatique d’autorisation a refusé l’application car elle modifie durablement la base existante, les droits d’accès et la publication Realtime. Elle a estimé que l’accord pour utiliser Supabase et l’e-mail ne couvrait pas explicitement cette mutation précise. L’opération n’a pas été contournée ni réessayée par une autre voie.
