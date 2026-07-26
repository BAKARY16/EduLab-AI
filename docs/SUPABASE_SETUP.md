# Connexion à Supabase

1. Créer un projet Supabase et conserver sa région et son identifiant.
2. Dans le SQL Editor, exécuter `supabase/migrations/202607220001_initial_edulab.sql`.
3. Copier `.env.example` vers `.env.local`.
4. Renseigner la chaîne PostgreSQL dans `DATABASE_URL` (utiliser le pooler en IPv4 si nécessaire).
5. Renseigner l'URL, la clé `anon` et la clé `service_role`, puis définir `AUTH_PROVIDER=supabase`.
6. Dans Authentication > URL Configuration, ajouter `http://localhost:3000` et l'URL de production.
7. Choisir si la confirmation e-mail est obligatoire, puis lancer `npm run dev`.

La clé `service_role` est strictement serveur et ne doit jamais porter le préfixe `NEXT_PUBLIC_`.
