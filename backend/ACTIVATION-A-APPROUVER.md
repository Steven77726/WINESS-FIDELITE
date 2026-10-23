# Activation de Winess

L’activation a été expressément autorisée par le propriétaire le 23 octobre 2026, puis appliquée au projet Supabase existant.

Le schéma `schema.sql` crée uniquement les objets Winess : six tables publiques `wc_*`, une table privée pour les rôles de l’équipe, les fonctions d’enregistrement contrôlées, les politiques de lecture par rôle et les publications Realtime. Les autres tables du projet n’ont pas été modifiées.

Le catalogue de 1 423 correspondances publiques a été chargé. Aucun fichier Numbers d’origine, ancien profil de démonstration, mot de passe ou achat personnel n’a été importé.

Les fonctions privées à privilèges contrôlent l’utilisateur et le rôle serveur ; les fonctions publiques sont invoker. L’absence de politique SELECT sur `wc_private.staff_emails` est volontaire : les clients ne lisent pas l’annuaire des droits.

`verification.sql` a réussi en base avec des comptes de test transactionnels ensuite annulés. L’analyse Supabase ne signale pas de nouveau avertissement de sécurité Winess ; l’information « RLS enabled no policy » sur la table privée est le refus de lecture attendu.
