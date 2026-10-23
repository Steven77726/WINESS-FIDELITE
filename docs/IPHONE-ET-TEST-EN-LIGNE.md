# Version iPhone et démonstration partageable

## Téléphone

Le téléphone est facultatif à l’inscription, lors d’une création par l’administrateur et lors de la correction d’une fiche. S’il est renseigné, il doit contenir exactement 12 chiffres, sans espace, signe + ni indicatif imposé. Plusieurs membres peuvent ne pas renseigner de téléphone. Le schéma Supabase préparé a également été adapté pour accepter une valeur absente ; il n’a toujours pas été appliqué.

Après une déconnexion, la carte de démonstration peut être retrouvée avec son identifiant même si aucun téléphone n’a été renseigné. Ce parcours de test n’est pas une authentification.

## iPhone

- Marges adaptées aux zones sûres de l’écran.
- Champs à 16 px pour éviter le zoom automatique des formulaires sur Safari iPhone.
- Boutons d’au moins 44 px et menu vendeur/administrateur accessible sur mobile.
- Formulaires et cartes sur une colonne, tableaux à défilement interne.
- Fenêtres de QR et de saisie à hauteur limitée, avec défilement sur petit écran.
- Vérification des dimensions mobiles 390 × 844 et 375 × 667 dans le navigateur intégré. Ce contrôle de dimensions ne remplace pas un essai sur un véritable iPhone.

## Mise en ligne

La publication de test ne doit contenir que les deux interfaces, les exemples fictifs et le catalogue public, sans fichier client importé ni secret. Les données saisies restent dans le navigateur de chaque testeur ; elles ne sont pas envoyées dans Supabase.

Le schéma Supabase pour relier les appareils reste bloqué par la revue automatique dans l’attente d’une approbation explicite du périmètre. Les notifications push et SMS ne sont pas activées. Les collègues peuvent tester l’ergonomie et le scan, mais une vente enregistrée sur l’appareil de l’un ne sera pas transmise à celui d’un autre dans cette démonstration.
