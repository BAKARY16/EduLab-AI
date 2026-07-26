# Rapport final d'étape — EduLab AI

## Fonctionne réellement

- Frontend Next.js existant préservé, Supabase Auth et profils PostgreSQL synchronisés.
- Inscription, connexion, cookie HttpOnly et onboarding testés de bout en bout.
- Deux migrations Supabase : socle, pgvector et modèle pédagogique étendu.
- API FastAPI `/api/v1`, OpenAPI, CORS, healthcheck base, cours, tuteur contraint, baseline apprenant et avatar.
- Extraction TXT/HTML/JSON/CSV et adaptateurs PDF/DOCX, chunking, rapports et validation du catalogue.
- Registre de sources ivoiriennes et premier inventaire officiel Troisième/Terminale.
- Baselines NLP et avatar, interfaces voix, ModelRegistry et scripts d'entraînement sûrs.

## Modes mock ou indisponibles

- LLM, TTS/STT serveur et recherche web serveur : mocks explicites, clés/fournisseurs absents.
- Scientific QA : aucun artefact découvert ; endpoint retourne 503 au lieu d'inventer une prédiction.
- Modèle apprenant : baseline heuristique, aucun entraînement réel.
- RAG vectoriel : aucune indexation tant qu'un document autorisé n'est pas importé et validé.
- Realtime speech-to-speech et lip-sync phonémique : interfaces/commandes préparées, fournisseurs absents.

## Sources et documents

Sources institutionnelles vérifiées : DPFC, MENA/Mon École à la Maison. DECO est protégé par une page de vérification, sans contournement. Fomesoutra reste communautaire.

Aucun document n'a été téléchargé ou importé. Les URL sont enregistrées avec `metadata_only`; les droits doivent être revus avant import manuel.

## Modèles et métriques

Aucun modèle lourd choisi ou entraîné. 4 tests Python sur 4 passent. Les métriques RAG, Scientific QA, STT et modèle apprenant sont honnêtement indisponibles.

## Limites restantes

- Compléter l'inventaire détaillé Sixième, Cinquième, Quatrième, Seconde, Première et Terminale.
- Obtenir/importer légalement les documents et annales, puis validation pédagogique humaine.
- Benchmark embeddings/reranker et construire l'index.
- Configurer LLM/TTS/STT/realtime réels et évaluer avec utilisateurs consentants.
- Compléter RBAC/RLS, antivirus, rate limiting persistant et tests E2E des 23 scénarios.
- Python local 3.11 bloqué par l'installateur Windows ; Docker cible correctement Python 3.11.

## Démarrage

Frontend : `npm run dev`.

API : `$env:PYTHONPATH='apps/api'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --reload --port 8000`.

Tests : `powershell -ExecutionPolicy Bypass -File scripts/run_tests.ps1`.
