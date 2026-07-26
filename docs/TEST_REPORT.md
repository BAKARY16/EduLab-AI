# Rapport de tests — 22 juillet 2026

| Test | Résultat |
|---|---|
| Supabase Auth → profil PostgreSQL | Réussi |
| Formulaires HTTP inscription/connexion/onboarding | Réussi |
| Connexion PostgreSQL/pgvector | Réussi |
| Migration plateforme pédagogique | Réussie |
| FastAPI OpenAPI | Réussi |
| FastAPI health + base | HTTP 200, `database=ok` |
| Tests Python unitaires | 4/4 réussis |
| Validation course_catalog.csv | 24/24 lignes valides |
| Index RAG | Non construit : zéro document importé |
| Scientific QA | Non testé : artefact absent |
| TypeScript | Réussi avant corruption du cache HMR ; dernière relance bloquée par processus Windows résiduels |

Les tests ne revendiquent ni modèle entraîné, ni qualité RAG, ni voix serveur réelle.
