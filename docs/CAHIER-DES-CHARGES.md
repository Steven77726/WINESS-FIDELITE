# Winess Club V1 — Cahier des charges

Version de travail du 23 octobre 2026. Dépôt : https://github.com/Steven77726/WINESS-FIDELITE

## 1. Objectif et périmètre

Une application web mobile pour identifier les membres en boutique, consulter leurs achats, cumuler des points et présenter au vendeur une remise VIP qu’il applique manuellement dans Wino. L’application renvoie vers les fiches produits de https://winess.com lorsqu’une correspondance SKU exacte est disponible.

### Choix déjà exprimés

- Design blanc et noir.
- Inscription par nom, prénom et téléphone avec vérification SMS.
- Identification en boutique par QR code et recherche par nom ou téléphone.
- Administrateurs et vendeurs autorisés à corriger les fiches clients.
- Règle de points configurable par l’administrateur.
- Catalogue importé depuis Excel ou CSV.
- Notifications de service uniquement au lancement.
- Affichage de la remise VIP au vendeur, application manuelle dans Wino.
- Code dans le dépôt WINESS-FIDELITE, sous le compte GitHub du propriétaire.
- Photo du produit acheté et accès à sa fiche Winess via le SKU.

### Propositions à valider avant mise en service

- Hébergement : GitHub Pages pour l’interface, backend et base dédiés à choisir. GitHub Pages et Supabase constituent une proposition fondée sur les projets existants, pas une décision confirmée. Aucun VPS existant n’a été identifié.
- Barème de démonstration : 1 point par euro TTC, arrondi inférieur par ticket. Remise VIP de démonstration : 10 %. Objectif illustratif : 1 000 points, sans récompense ni passage VIP automatique.
- Attribution du VIP, seuils, expiration des points, utilisation des points, exclusions, remboursement, annulation et correction d’un ticket.
- Notification de service : canaux, événements et textes à définir. Aucun envoi dans la démonstration.
- Fréquence et historique de reprise des achats, format réel de l’export de ventes Wino, identifiant stable client et identifiant de ligne/ticket.

## 2. Rôles et parcours cibles

| Rôle | Fonctions |
|---|---|
| Client | Vérifier son téléphone par SMS, consulter uniquement son profil, sa carte QR, ses points, son statut et ses achats. Cliquer sur la photo pour ouvrir le produit sur winess.com. |
| Vendeur | Se connecter avec un compte personnel, rechercher ou scanner un membre, voir l’avantage applicable, corriger nom/prénom/téléphone avec historique. Ne pas importer de ventes ni modifier le barème. |
| Administrateur | Gérer vendeurs et rôles, import catalogue et achats, correspondances produits, règles de points et statut VIP, anomalies et journal des opérations. |

Le QR contient un identifiant opaque ; il ne constitue pas une authentification et ne révèle pas le téléphone. Seul un vendeur authentifié peut accéder à la fiche correspondante en production. Une modification de téléphone nécessite une nouvelle vérification SMS avant qu’il puisse servir à la connexion. La démonstration permet de saisir un identifiant QR via un lecteur ; le scan caméra reste à développer.

## 3. Constat sur le fichier fourni

Le document « EXPORT GO.numbers », feuille **Inventaire**, tableau **Tableau 1**, contient deux lignes d’en-tête, puis **2 527 références**, sur 13 colonnes :

1. Nom du produit
2. Nom de la variante
3. Type de produit
4. Catégorie
5. Contenance
6. Unité de contenance
7. Pays
8. Région (Vin)
9. Appelation (Vin)
10. Millésime (Vin & Spititueux)
11. Famille (Spiritueux)
12. SKU
13. Code-barres

**2 517 SKU renseignés et distincts ; 10 références sans SKU ; aucun SKU répété** après suppression des espaces en début/fin. Les SKU sont des chaînes dans le fichier analysé. Il n’y a ni client, ni date de vente, ni ticket, ni quantité achetée, ni montant de vente. Ce document ne permet donc pas de construire un historique d’achats à lui seul.

Ne pas confondre catalogue, stock et ventes : aucune quantité de stock n’est présente non plus. La contenance n’est pas une quantité vendue.

## 4. Catalogue et lien avec winess.com

Le 23 octobre 2026, lecture de 5 pages du catalogue public Shopify de Winess : **1 118 produits**, **1 539 SKU distincts non vides** côté site. Pour l’export fourni :

- **1 423 SKU** ont une correspondance exacte et non ambiguë côté site.
- **1 094 SKU** renseignés dans l’export n’ont pas de correspondance exacte exploitable dans cette lecture publique.
- **10 références** ne peuvent pas être rapprochées, car leur SKU est absent.
- Aucun SKU de l’export n’a plusieurs variantes candidates dans les données publiques consultées.

Ces chiffres sont une photographie du catalogue public accessible, pas une preuve d’absence dans l’administration Shopify. Un produit peut être non publié ou ne pas partager le même SKU.

### Règles de correspondance

- Conserver SKU et code-barres comme texte ; ne jamais convertir en nombre, supprimer les zéros, changer la casse ou retirer les caractères internes.
- Seul le retrait des espaces extérieurs est appliqué au SKU pour cette première version.
- Associer SKU → identifiant produit Shopify → identifiant variante → URL produit et URL photo.
- Construire un lien `https://winess.com/products/{handle}?variant={id}` afin de sélectionner la variante achetée.
- Prendre la photo de variante lorsqu’elle est disponible, sinon la première photo produit.
- Aucun rapprochement automatique par nom, millésime, code-barres ou ressemblance.
- En cas d’absence ou d’ambiguïté : conserver l’achat et son libellé, afficher un visuel neutre et une anomalie à traiter ; aucun lien vers un produit supposé.
- Si l’image ne charge pas, conserver le lien produit connu mais remplacer la photo par un visuel neutre.
- Ouvrir la fiche dans un nouvel onglet avec protection du lien externe.

### Synchronisation cible

Un processus côté serveur synchronisera le catalogue marchand et conservera une date de synchronisation, un statut et les erreurs. Préférer un accès catalogue autorisé Shopify en production si le catalogue public est incomplet. Les secrets resteront côté serveur. L’interface ne doit pas dépendre d’un appel interdomaines au site à chaque visite.

La démonstration utilise un index statique des 1 423 correspondances publiques vérifiées, sans secret et sans historique client réel. Un nouvel import catalogue peut intégrer les références non reliées. Toute mise à jour des données marchandes doit reconstruire cet index ou être servie par le backend cible.

## 5. Import des achats

### Format de préparation proposé (à adapter à l’export réel Wino)

| Colonne CSV | Type / règle |
|---|---|
| id_ligne | Texte, identifiant source stable et unique de ligne de vente |
| id_ticket | Texte, identifiant unique de ticket, commun à ses lignes |
| date | AAAA-MM-JJ, date valide |
| id_client | Identifiant membre déjà connu. Ne pas attribuer automatiquement à partir du seul nom. |
| sku | Texte exact |
| nom_produit | Libellé historique de la vente ; recommandé, peut être complété par le catalogue |
| quantite | Nombre strictement positif |
| total_ttc | Montant total de la ligne après remise, en euros, deux décimales maximum ; jamais prix unitaire |

CSV UTF-8 avec séparateur virgule ou point-virgule. Les décimales avec virgule sont acceptées dans les fichiers au séparateur point-virgule. Les champs entre guillemets et retours à la ligne sont pris en charge.

### Contrôles et confirmation

1. Lire le fichier sans appliquer de modifications.
2. Vérifier les colonnes, dates, clients, montants et identifiants ; prévisualiser le nombre de lignes/tickets/points, doublons et anomalies.
3. Bloquer l’intégralité de l’import si une erreur structurelle ou d’attribution existe.
4. Ignorer une ligne déjà importée strictement identique ; bloquer un identifiant existant dont le contenu change.
5. Bloquer les tickets présentant plusieurs dates ou clients.
6. Ne pas étendre un ticket déjà importé avec de nouvelles lignes : traiter les corrections par une procédure dédiée avant la production.
7. Autoriser un SKU inconnu tout en l’indiquant, sans inventer photo/lien.
8. Exiger une confirmation explicite dans l’administration avant insertion.

Les imports de démonstration sont limités à 5 Mo et stockés dans la mémoire de l’onglet. La version cible devra enregistrer durablement le lot d’import, son empreinte, son auteur, ses compteurs, les erreurs, et assurer une transaction atomique en base.

### Excel et Numbers

La démonstration accepte les **CSV**, pas les fichiers `.numbers` ou `.xlsx` directement. Depuis Numbers : Fichier → Exporter vers → CSV, sélectionner le tableau d’inventaire. L’import Excel natif est prévu dans la cible après vérification du format réel des ventes, avec conservation des identifiants textuels.

## 6. Points et VIP

En démonstration : `points_ticket = floor(somme(total_ttc_lignes_en_centimes) × points_par_euro / 100)`.

- Les points et le taux appliqué sont enregistrés pour chaque nouveau ticket en mémoire.
- Un changement de barème n’a pas d’effet rétroactif sur les tickets existants.
- Un réimport ne doit pas attribuer de points une deuxième fois.
- Le statut VIP est manuel dans cette version ; aucun seuil automatique n’est présumé.
- Le vendeur affiche le pourcentage et l’applique lui-même dans Wino.
- Aucun remboursement, retour, dépense de points ni ajustement arbitraire n’est traité dans cette démonstration. Les montants négatifs sont bloqués jusqu’à définition de ce parcours.

En production, le calcul et les validations seront exclusivement autoritaires côté serveur avec journal de mouvements de points. Le navigateur ne pourra pas créditer son propre solde.

## 7. Modèle de données cible

| Entité | Champs principaux |
|---|---|
| members | id UUID opaque, identifiant client Wino, prénom, nom, téléphone normalisé, téléphone vérifié, statut VIP, dates |
| staff | compte d’authentification, rôle, état actif |
| products | SKU unique, libellé source, variante, attributs, état |
| merchant_links | SKU, produit/variante Shopify, URL fiche, URL photo, statut de rapprochement, date de contrôle |
| import_batches | type, empreinte fichier, auteur, date, état, compteurs, anomalies |
| sales | id ticket source unique, membre, date, montant TTC, état |
| sale_lines | id ligne source unique, ticket, SKU, libellé historique, quantité, total TTC |
| loyalty_rules | version, taux, remise VIP, dates de validité |
| points_ledger | membre, ticket, mouvement signé, version règle, auteur, date, motif |
| audit_events | acteur, action, entité, date et changement utile |

Les données client et ventes ne sont jamais commitées sur GitHub. Les identifiants produits publics peuvent être distribués avec l’interface.

## 8. Architecture et exploitation

Le livrable actuel est une interface statique HTML/CSS/JS sans construction ni backend. Il peut être servi localement, sur un serveur web existant ou sur GitHub Pages. Aucun hébergement ni base n’a été créé/activé pour cette préparation.

Architecture cible proposée : interface statique + API d’authentification/SMS + base transactionnelle + synchronisation marchande côté serveur. La décision « services gérés sous nos comptes » ou « VPS que nous administrons » doit précéder la connexion des données réelles.

Exigences de mise en service : comptes personnels pour le personnel, accès client limité à ses données, rôles contrôlés côté serveur, aucune clé privilégiée dans le navigateur, HTTPS, sauvegardes vérifiées par restauration, suivi des erreurs, limitation des demandes SMS, journal d’import et protection contre le double crédit. Définir la conservation des données et les procédures d’assistance/suppression avant ouverture.

## 9. État de la première version

### Fonctionnel dans la démonstration

- Interface responsive blanc/noir avec espaces client, boutique et administration.
- Deux membres et achats entièrement fictifs, prix de démonstration.
- Carte QR générée localement avec identifiant opaque de démonstration.
- Recherche vendeur par nom, téléphone ou contenu QR saisi.
- Correction des fiches, création de membres de test, statut VIP manuel.
- Import catalogue CSV dans le format du document fourni.
- Import achats CSV, prévalidation et confirmation, contrôles de réimport.
- Barème configurable, points calculés par ticket et conservés pour les tickets importés.
- Photos réelles via URL Shopify et liens exacts par SKU/variante ; solution de remplacement si la photo manque.

### Reste à connecter ou développer

- Authentification client et personnel, SMS réels, vérification des changements de téléphone.
- Base persistante, API, autorisations serveur et journal d’audit.
- Scan caméra, import `.xlsx` natif et adaptation à l’export réel des ventes.
- Synchronisation marchande récurrente et résolution des SKU sans correspondance.
- Notifications de service, retours, annulations et corrections de ventes.
- Déploiement et configuration de domaine selon l’hébergement choisi.

Le sélecteur d’espaces est un outil de démonstration, pas une protection d’accès. La démo n’est pas utilisable avec des données clients réelles.

## 10. Recette

- Un SKU textuel avec zéro initial garde son identité pendant l’import.
- Cliquer sur une photo reliée ouvre la variante correspondante sur winess.com.
- Un SKU non trouvé conserve sa ligne d’achat sans faux lien.
- Un fichier invalide ne modifie aucun achat.
- Un client inconnu bloque l’import sans attribution à une autre personne.
- Réimporter le même achat ne change pas les points.
- Une modification de barème ne recalcule pas le passé.
- Plusieurs lignes d’un même ticket donnent lieu à un arrondi unique au niveau du ticket.
- Les accès entre clients, vendeur et administrateur devront être testés après connexion du backend.
- Le propriétaire validera ensuite l’export Wino réel, le barème et le parcours SMS avant mise en service.

## Sources

- Fichier local fourni par le propriétaire : EXPORT GO.numbers, Inventaire, Tableau 1, lignes 1–2529. Le document source n’est pas inclus dans le dépôt.
- Catalogue public Winess : https://winess.com/products.json?limit=250&page=1 et pages 2 à 5, consultées le 23 octobre 2026. Les URLs photos sont conservées telles que fournies par le site.
- Limites de GitHub Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Mise à jour 0.2 — Entrées et carte QR

Mise à jour du champ téléphone : exactement 12 chiffres, sans espace ni signe +. Aucun indicatif ni préfixe imposé. Exemple : 123456789012. Même validation pour l’inscription, la création par l’administration et la correction des fiches. Cette saisie de démonstration devra être adaptée au fournisseur SMS avant les envois réels.

- Le petit QR de la carte est un bouton : un clic ouvre le QR en grand, centré sur fond blanc. Un clic sur le grand QR le ferme. La croix, la touche Échap et le fond extérieur le ferment aussi.
- Une entrée client dédiée propose prénom, nom et téléphone international. La confirmation crée une fiche et sa carte de démonstration dans cet onglet. Le client peut ensuite corriger ses informations.
- Une entrée administrateur dédiée recueille le nom et l’e-mail du testeur avant d’ouvrir le tableau d’administration. Ce formulaire ne constitue pas une authentification.
- Livrables autonomes : WINESS-CLIENT.html et WINESS-ADMIN.html. Aucun lien d’accès Internet public n’est encore déployé.
- Les deux fichiers ne partagent aucune base : une fiche créée dans l’entrée client n’apparaît pas automatiquement dans l’entrée administrateur. Le stockage partagé et l’authentification serveur restent nécessaires avant usage réel.


## Version 0.3 — Espace vendeur et partage local

Voir [ESPACE-VENDEUR.md](ESPACE-VENDEUR.md) pour le périmètre actuel. Cette version ajoute le scan QR caméra/image, l’identification du client, la saisie de ses achats et le partage local entre les trois espaces HTTP du même navigateur. Elle remplace les limitations de mémoire par onglet de la version 0.2, sans fournir d’authentification ni de synchronisation entre appareils.

## Version 0.4 — Deux accès et notifications

Deux accès applicatifs seulement : **WINESS-STAFF.html** (vendeur et menu Administration à gauche) et **WINESS-CLIENT.html**. Les anciennes entrées séparées restent des fichiers historiques ; elles ne sont plus les liens à communiquer.

Le client dispose d’un centre de notifications avec compteur de messages non lus. L’enregistrement d’un nouveau ticket crée une notification pour le membre concerné dans la démonstration locale. Les autres membres ne voient pas ce message. Marquer comme lu ne supprime pas l’historique. Les notifications push/SMS lorsque l’application est fermée ne sont pas activées.

Le propriétaire a choisi son projet Supabase existant et une connexion par e-mail pour démarrer, tout en conservant le téléphone à 12 chiffres dans la fiche. La base commune réelle n’est pas encore créée : la revue automatique a refusé la mutation persistante sans approbation explicite du schéma et des droits. Voir [le dossier d’activation](../backend/ACTIVATION-A-APPROUVER.md) et [le schéma préparé](../backend/schema.sql).

## Version 0.5 — Mémorisation et déconnexion

- Le membre client choisi ou créé est mémorisé dans le stockage local du navigateur, au-delà du seul onglet.
- L’identité de test du vendeur et celle de l’administrateur sont mémorisées séparément dans l’interface boutique.
- Un bouton Déconnexion apparaît dans l’en-tête dès qu’un espace a été ouvert. Il retire la mémorisation correspondante dans les onglets concernés du même navigateur sans supprimer les fiches, achats, points et notifications.
- La déconnexion boutique ferme la mémorisation vendeur et administrateur de ce navigateur ; la déconnexion client ne déconnecte pas la boutique.
- Après déconnexion, un client peut utiliser Retrouver ma carte pour retrouver sa fiche de démonstration sans la recréer. Ce parcours par téléphone local n’est pas une authentification et ne doit pas être utilisé avec des données réelles.
- La mémorisation dure jusqu’à Déconnexion ou suppression des données du navigateur. La navigation privée peut empêcher sa conservation.
- Les sessions authentifiées avec renouvellement et révocation côté serveur restent liées à l’activation Supabase. Cette mémorisation locale ne débloque pas la migration refusée précédemment.
