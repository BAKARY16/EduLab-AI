# Organisation EduLab AI

## Interface web

- `src/app/` : routes Next.js, layouts et endpoints serveur de l’interface.
- `src/components/` : composants visuels réutilisables.
- `src/lib/` : accès aux données et logique de présentation.
- `src/server/` : services server-only (catalogue, fichiers, intégrations).
- `public/` : images et ressources publiques.

## Backend applicatif

- `apps/api/app/` : API FastAPI principale et schémas.
- `supabase/migrations/` : structure PostgreSQL/pgvector.
- `docker-compose.yml` : PostgreSQL, API et service modèle.

## Modèles et MLOps

- `ml/teacher/` : entraînement et serveur du professeur Qwen LoRA.
- `models/edulab-teacher-qwen-0.5b-lora/` : poids LoRA, tokenizer, métriques et cartes.
- `notebooks/` : sources, EDA, baseline, entraînement, évaluation, démonstration.
- `reports/` : preuves et rapports d’exécution.

## RAG et agents

- `rag/extraction/` : extraction PDF/DOCX/HTML/TXT.
- `rag/chunking/` : découpage pédagogique avec métadonnées curriculum.
- `rag/retrieval/` : recherche et classement des passages.
- `services/agents/` : contrats et orchestration des agents.
- `scripts/ingest_knowledge_documents.py` : ingestion traçable en base.
- `scripts/build_rag_index.py` : index lexical local reproductible.

## Données

- `data/catalogs/` : registre des sources et arborescence des cours.
- `data/raw/` : documents autorisés, jamais exposés directement au web.
- `data/processed/` : datasets normalisés et splits d’entraînement.
- `data/extracted/` : texte extrait et résultats intermédiaires.

Le catalogue web est généré par `scripts/export_course_tree.py`. Fomesoutra est
utilisé comme référence d’organisation et source communautaire de métadonnées;
ses documents ne sont pas automatiquement copiés ou redistribués.
