# Architecture EduLab AI

Le frontend Next.js existant reste la couche d'expérience utilisateur. FastAPI expose `/api/v1`, Supabase fournit Auth/PostgreSQL/pgvector et les services Python encapsulent ingestion, RAG, agents, voix, avatar et ML.

```text
Next.js → FastAPI → services métier → PostgreSQL/pgvector
                    ├─ RAG et registre de sources
                    ├─ agents et TutorOrchestrator
                    ├─ NLP/ML ModelRegistry
                    └─ STT/TTS/avatar
```

Les sorties IA sont validées par Pydantic. Le mode `mock` est explicite. Les documents `pending`, `demo` ou communautaires non validés ne peuvent pas alimenter une réponse présentée comme officielle.

Le dépôt Git parent contient des changements étrangers et tout ce dossier est non suivi. Aucun commit automatique n'est effectué afin de ne pas capturer ou altérer ces changements.
