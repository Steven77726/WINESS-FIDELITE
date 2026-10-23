# Publier les deux accès Winess

Le dépôt GitHub est accessible en écriture et contient la version connectée. L’application Supabase Winess est activée.

1. Ouvrir https://github.com/Steven77726/WINESS-FIDELITE avec le compte propriétaire.
2. Dans la barre du dépôt, cliquer sur **Settings** (si masqué, regarder le menu débordant à droite).
3. Dans le menu de gauche, rubrique **Code and automation**, cliquer sur **Pages**.
4. Dans **Build and deployment**, ouvrir **Source** et sélectionner **GitHub Actions**.
5. Dans **Actions**, ouvrir **Publier la démonstration Winess Club**, puis **Run workflow** sur `main` ou **Re-run all jobs** sur le dernier essai.
6. Attendre que les tâches build et deploy soient vertes. Vérifier l’adresse fournie par le déploiement avant de partager les accès.

Adresses attendues, à considérer actives uniquement après réussite :
- Boutique et administration : https://steven77726.github.io/WINESS-FIDELITE/staff.html
- Client : https://steven77726.github.io/WINESS-FIDELITE/client.html

La connexion GitHub actuelle sait envoyer les fichiers mais n’a pas les droits d’administration pour activer Pages. Si Pages n’est pas activé, configure-pages échoue malgré la réussite des tests et de la construction.

Les fichiers publiés sont uniquement ceux de `dist/`. Le schéma SQL et les tests ne sont pas servis par le site. Aucun ancien profil local ni mot de passe ne fait partie du dépôt.
