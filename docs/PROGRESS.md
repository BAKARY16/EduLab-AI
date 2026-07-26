# Progression

## 2026-07-22

- Audit du code et diagnostic de l'échec d'authentification terminés.
- Configuration d'environnement documentée.
- Adaptateur Supabase Auth serveur ajouté, avec repli local explicite.
- Migration initiale PostgreSQL/pgvector et politiques RLS de base ajoutées.
- Registre documentaire et tables RAG initiales ajoutés.
- Recherche institutionnelle DPFC/DECO commencée ; aucune collecte massive effectuée.
- Projet Supabase configuré localement ; clé publique et clé serveur vérifiées contre l'API Auth (HTTP 200).
- `.env.local` protégé par `.gitignore` et chaîne PostgreSQL configurée.
- Connexion au pooler PostgreSQL validée et migration initiale appliquée.
- Cycle technique Supabase Auth → profil PostgreSQL → connexion validé avec un compte temporaire supprimé après le test.
- Build Next.js de production validé.
- Formulaires d'inscription et de connexion corrigés : création Supabase confirmée, profil applicatif synchronisé et messages d'état visibles.
- Parcours HTTP réel validé : inscription, cookie HttpOnly, connexion et accès onboarding.
- Phase 1 audit étendu terminée : outils, MCP, Git, frontend, artefacts et environnement inspectés.
- Backend FastAPI versionné, Docker Python 3.11 et connexion frontend de repli ajoutés.
- Deuxième migration appliquée avec le modèle pédagogique étendu.
- Registre ivoirien, catalogues cours/examens et rapport de sources créés.
- Extraction/chunking/validation documentaire et baselines NLP/avatar/learner ajoutés.
- Suite Python : 4 tests réussis ; health FastAPI/Supabase validé.

Prochaine étape : appliquer la migration sur le projet Supabase, tester l'inscription réelle, puis importer un premier corpus officiel validé.
