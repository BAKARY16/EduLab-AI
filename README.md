# EduLab AI

EduLab AI est une plateforme éducative intelligente conçue pour accompagner les élèves de Côte d’Ivoire, du collège au lycée. Elle réunit cours structurés, exercices, préparation au BEPC et au BAC, laboratoires virtuels, suivi de progression et professeur IA dans une même expérience.

## Fonctionnalités principales

- Authentification et parcours d’onboarding personnalisable
- Tableau de bord élève et suivi des acquis
- Cours et exercices organisés par niveau et matière
- Préparation aux examens avec sujets, corrections et analyse des erreurs
- Professeur IA enrichi par recherche documentaire (RAG)
- Laboratoires scientifiques et simulations interactives
- Espaces enseignant et administration
- Synthèse et reconnaissance vocales configurables

## Technologies

- Frontend : Next.js 16, React 19, TypeScript et Tailwind CSS 4
- Backend : API Next.js et FastAPI
- Données et authentification : Supabase, PostgreSQL et pgvector
- IA : OpenAI, pipeline RAG, modèles pédagogiques et cache sémantique
- Voix : ElevenLabs ou fournisseurs de secours configurables
- Data/ML : Python, notebooks, jeux d’évaluation et scripts d’entraînement

## Installation locale

Prérequis : Node.js 20+, npm, Python 3.11+ et un projet Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sous PowerShell, remplacez la commande `cp` par :

```powershell
Copy-Item .env.example .env.local
```

Renseignez ensuite les variables nécessaires dans `.env.local`. Aucun secret ne doit être ajouté au dépôt.

Pour lancer l’API Python :

```powershell
python -m venv .venv
.venv\Scripts\pip.exe install -r apps/api/requirements.txt
.venv\Scripts\python.exe -m uvicorn apps.api.app.main:app --reload --port 8000
```

## Base de données

Les migrations Supabase se trouvent dans `supabase/migrations`. Consultez `docs/SUPABASE_SETUP.md` pour la configuration détaillée et les règles de sécurité.

## Vérification

```bash
npm run typecheck
npm run lint
npm run build
```

Les tests Python peuvent être lancés avec :

```bash
python -m pytest
```

## Documentation

Les choix d’architecture, le catalogue API, les rapports IA/RAG, la sécurité et les procédures d’installation sont disponibles dans le dossier `docs/`.

Pour la présentation Data/ML, ouvrez `notebooks/06_student_learning_analytics_colab.ipynb`. Il analyse un dataset élèves synthétique et anonymisé de bout en bout. La fiche `docs/MODELS_AND_ANALYTICS_GUIDE.md` explique le rôle et le niveau de maturité de chaque modèle.

> Les contenus éducatifs doivent rester traçables, autorisés et clairement distingués des données de démonstration avant toute mise en production.
