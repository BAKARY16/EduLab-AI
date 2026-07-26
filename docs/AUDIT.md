# Audit EduLab AI — 22 juillet 2026

## État réutilisable

- Application Next.js 16 / React 19 / TypeScript stricte, avec une identité visuelle cohérente à préserver.
- Parcours publics, inscription, connexion, onboarding et espaces apprenant/enseignant/admin déjà présents.
- Composants de cours, professeur robot, examens et simulations natives déjà fonctionnels côté interface.
- Schéma PostgreSQL Drizzle partiel et actions serveur pour progression, tentatives et amorçage du catalogue.

## Défauts bloquants identifiés

- Aucune `.env.example` ni migration : `DATABASE_URL` manque sur une nouvelle installation.
- Deux authentifications incompatibles coexistaient : Supabase dans un fichier orphelin et sessions locales réellement utilisées.
- Le client Supabase pouvait être construit avec une URL vide et une clé privilégiée sans garde serveur.
- Les contenus de démonstration portaient parfois une formulation « officielle » sans enregistrement de provenance vérifiable.
- Le dépôt courant est non suivi dans le dépôt Git parent : aucun commit automatique n'est sûr à ce stade.

## Migration et intégration

- Conserver l'interface et les composants existants.
- Unifier l'authentification via `AUTH_PROVIDER=local|supabase`; sessions applicatives en cookie HttpOnly.
- Déployer la migration Supabase, puis connecter PostgreSQL avec la chaîne fournie par Supabase.
- Importer les documents seulement après revue des droits et enregistrer source, empreinte, statut et page.
- Remplacer progressivement les fixtures par des enregistrements validés ; ne jamais promouvoir automatiquement une correction communautaire.

## Risques

- Disponibilité incomplète des sujets/corrigés officiels 2015–2026 et absence possible de corrigés DECO publics.
- Droits de reproduction des plateformes communautaires et des manuels agréés.
- Données de mineurs : consentement, minimisation, suppression et politiques RLS à compléter avant production.
