# Démonstration reliée — version 0.3

## Trois liens locaux

Sur l’ordinateur où la démonstration est servie, ouvrir dans le même navigateur :

- Client : http://127.0.0.1:4319/WINESS-CLIENT.html
- Vendeur : http://127.0.0.1:4319/WINESS-SELLER.html
- Administrateur : http://127.0.0.1:4319/WINESS-ADMIN.html

Utiliser ces trois liens HTTP plutôt que l’ouverture des fichiers par double-clic. Le partage de fichiers `file:` n’est pas fiable et est désactivé dans cette démonstration. Les adresses `127.0.0.1` ne fonctionnent que sur cet ordinateur tant que son serveur local est en cours. Elles ne constituent pas un hébergement Internet.

## Parcours

1. Le client renseigne des informations fictives et obtient sa carte QR.
2. La fiche est visible dans les espaces vendeur et administrateur du même navigateur.
3. Le vendeur scanne le QR avec sa caméra, lit une image de ce QR, ou utilise un lecteur QR qui saisit son contenu. La recherche par nom, téléphone ou identifiant reste disponible.
4. Le nom du client identifié est affiché avant la saisie d’un ticket.
5. Le vendeur saisit la référence Wino du ticket, sa date, puis chaque SKU, quantité et total TTC de ligne. Il peut retirer une ligne avant confirmation.
6. Il confirme l’enregistrement pour le client affiché. Les points sont calculés selon la règle partagée, avec un arrondi par ticket.
7. L’achat et ses photos apparaissent dans l’espace client ; le ticket, le nom et les points sont aussi visibles dans le tableau d’administration.

Une référence de ticket déjà connue est bloquée. Un SKU inconnu dans la saisie vendeur est refusé et doit être vérifié avec l’administrateur. Il n’y a aucune création automatique ni modification dans Wino : la référence sert au rapprochement avec le ticket de caisse existant.

## Scan et confidentialité

Le QR est décodé sur l’appareil avec jsQR 1.4.0 (licence Apache 2.0, copie de licence incluse). Aucune image n’est envoyée à un service de reconnaissance. L’accès caméra requiert l’accord de l’utilisateur et un contexte autorisé par le navigateur (HTTPS ou localhost). À la fermeture du lecteur ou lorsque la page passe en arrière-plan, les pistes vidéo sont arrêtées. Une image QR ou un lecteur externe peuvent servir si la caméra est indisponible.

La lecture d’une image QR complète issue d’une carte client a été testée. Le flux caméra sur un appareil physique n’a pas été testé : autorisation et compatibilité restent à vérifier sur le téléphone/tablette cible.

## Stockage et limites

Cette version remplace le fonctionnement isolé des versions 0.1 et 0.2 pour les ouvertures HTTP. Catalogue, fiches, achats, points et règles sont enregistrés dans le stockage local du navigateur, sous une clé réservée à cette démonstration. Les autres onglets du même navigateur et de la même origine sont actualisés lors des modifications. Une révision détecte les modifications déjà enregistrées par un autre espace avant une nouvelle écriture ; ce mécanisme n’est pas une base transactionnelle multi-utilisateur.

Les données subsistent au rechargement, jusqu’à réinitialisation de la démonstration ou suppression des données du navigateur. Le choix du membre client reste propre à l’onglet. Les espaces ne sont pas authentifiés : utiliser uniquement des informations fictives.

Il n’y a aucune synchronisation entre appareils, navigateurs ou comptes. Une base et un serveur avec contrôle des rôles restent indispensables avant usage par de vrais clients et vendeurs. Les identifiants administrateur réels ne sont pas inclus dans le code.

## Vérification effectuée

Le 23 octobre 2026 : création d’une cliente fictive, lecture effective de son QR depuis une image, identification chez le vendeur, enregistrement d’un ticket de 24,90 € pour 24 points, apparition du même ticket et de ces points dans les espaces client et administrateur. Après rechargement de l’espace client, le ticket et le solde sont conservés. Un changement de statut VIP depuis l’administration apparaît également dans les espaces client et vendeur, y compris après fermeture d’un QR affiché pendant la modification.
