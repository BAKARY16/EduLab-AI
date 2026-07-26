# Audit EduLab AI — état réel du projet

Date : 2026-07-23. Rédigé avant le chantier d'amélioration en 19 phases demandé. Objectif : dire précisément ce qui fonctionne, ce qui est en démonstration, ce qui est cassé, et ce qui reste à faire — sans enjolivement.

## Résumé en une phrase

L'application est un **prototype à trois runtimes déconnectés** : un frontend Next.js qui affiche presque exclusivement du contenu statique codé en dur, un backend FastAPI réel mais dont les tables métier (`courses`, `knowledge_documents`) sont vides en base, et un microservice Python de génération (Qwen+LoRA) qui ne démarre pas dans l'environnement local actuel. La voix (ElevenLabs) est la seule brique connectée à un vrai service externe et fonctionnelle de bout en bout, à l'exception du Speech-to-Text bloqué par une permission de clé API.

---

## 1. Ce qui fonctionne réellement (vérifié, pas supposé)

| Élément | Preuve |
|---|---|
| TTS ElevenLabs | `POST /api/v1/voice/synthesize` testé en direct → audio MP3 réel (voix `Gfpl8Yo74Is0W6cPUWWT`), proxifié depuis Next.js sans exposer la clé au navigateur |
| Diagnostic voix | `GET /api/v1/voice/health` distingue correctement "clé absente" de "permission manquante" (testé : renvoie `permission_available: false` avec le message ElevenLabs exact) |
| Backend FastAPI (`apps/api`) | Démarre et se connecte à la vraie base Supabase Postgres (`GET /api/v1/health` → `{"status":"ok","database":"ok"}`). Ses dépendances n'étaient pas installées avant cet audit — c'est fait maintenant |
| RAG (partiel) | `PHYSIQUE-CHIMIE_3eme.pdf` (le seul des 2 PDF sources lisible) extrait, découpé, indexé en TF-IDF (59 passages), recherche testée avec une vraie requête physique → résultats pertinents |
| Admin — utilisateurs et stats | `src/app/app/admin/page.tsx` et `.../utilisateurs/page.tsx` font de vraies requêtes Drizzle (`count()` sur `users`, `courses`, `experiments`, `examPapers`, `activities`) |
| Design system | Tokens de couleur cohérents et centralisés (`src/app/globals.css`, bloc `@theme`), composants UI partagés (`src/components/ui.tsx`) réutilisés partout |
| Auth | Supabase Auth configuré (`AUTH_PROVIDER=supabase`), RLS activé sur les tables du premier schéma (`supabase/migrations/202607220001_initial_edulab.sql`) |

## 2. Ce qui est en mode démonstration (assumé dans le code, pas caché)

- **`src/lib/ai.ts`** : `export const AI_DEMO_MODE = true` — agents, RAG (`ragSearch`), maîtrise/difficulté sont des heuristiques déterministes sur une base de connaissance de 6 entrées codées en dur. Affiché honnêtement via un badge "Mode démo" sur plusieurs pages (`app/page.tsx:77`, `professeur/page.tsx:74`, `suivi/page.tsx:44`, `aide/page.tsx:76`).
- **`src/lib/content.ts`** : la totalité des cours affichés dans `CoursePlayer` (6 leçons) sont des objets JS statiques, jamais lus depuis la base de données.
- **`apps/api`** : `LLM_PROVIDER=mock` par défaut ; `/tutor/start`, `/tutor/{action}`, `/ml/scientific-qa`, `/research/search` renvoient tous des réponses fixes avec un champ `"mode": "mock"` explicite — assumé, pas dissimulé.
- **13 routes** (`/auth/status`, `/users/status`, `/curricula/status`, etc.) renvoient littéralement `{"status": "scaffolded"}` — aucune logique derrière.

## 3. Ce qui est cassé

- **`MATHS_3eme.pdf`** (`data/raw/dpfc_via_auf/`) : structure PDF invalide, `pypdf` lève une exception (`Invalid Elementary Object...`). Seul le PDF de Physique-Chimie a pu être indexé. À re-sourcer.
- **Speech-to-Text ElevenLabs** : la clé fournie a la permission `text_to_speech` mais pas `speech_to_text` (confirmé par un appel direct à l'API : `401 missing_permissions`). Diagnostiqué proprement par `/voice/health`, mais reste non fonctionnel tant qu'une clé avec la bonne permission n'est pas fournie.
- **`ml/teacher/server.py`** (génération Qwen+LoRA) : `torch` est cassé dans `.venv` (`ModuleNotFoundError: torchgen` à l'import). Ce service ne démarre pas localement — préexistant, sans rapport avec ce chantier.
- **Extraction PDF partiellement corrompue** : même sur le PDF qui s'extrait, certaines pages ont un encodage de police cassé (glyphes accentués illisibles). Cela n'empêche pas la recherche TF-IDF de fonctionner, mais dégrade la qualité du texte source.

## 4. Ce qui utilise encore des données statiques

- Tous les cours affichés à l'élève (`src/lib/content.ts`, 6 leçons pour 3 matières).
- Le catalogue d'agents IA (`AGENTS` dans `src/lib/ai.ts`), affiché sur la page `/app/professeur` et dans l'admin.
- Les indicateurs "RAG / modèle / intégrations" de la page admin (`src/app/app/admin/page.tsx:76-89`) — chaînes de texte fixes, jamais de vrai health-check.
- Les exercices, examens et corrections : aucune table `exercises`/`exams` n'est actuellement interrogée par le frontend (uniquement `courses`, via `resolveCourseCatalog`, qui de toute façon retombe sur la liste statique car la table `courses` est vide en base — voir section 5).

## 5. Ce qui doit être connecté au backend (et pourquoi ce n'est pas trivial)

- **`courses` et `knowledge_documents` sont vides en base.** Aucun script d'import (`scripts/import_document.py`, `scripts/import_source_url.py`) n'écrit réellement en base — ils produisent des fichiers JSON locaux, jamais des `INSERT`. Résultat concret : `resolveCourseCatalog()` (`src/lib/backend.ts:16-27`) interroge bien la vraie API, mais comme aucune clé ne correspond, elle retombe systématiquement sur la liste statique. **Tant qu'il n'y a pas de vrai pipeline d'ingestion → base de données, brancher le frontend sur l'API ne changera rien à ce que voit l'élève.**
- **Une deuxième migration existe déjà et n'est branchée nulle part** : `supabase/migrations/202607220002_learning_platform.sql` définit ~30 tables (`teacher_profiles`, `curricula`, `lessons`, `quizzes`, `ai_conversations`, `voice_interactions`, `model_versions`, etc.) — probablement conçue pour exactement ce chantier, mais absente du schéma Drizzle (`src/db/schema.ts` ne couvre que les 8 tables de la première migration) et jamais requêtée par `apps/api`. C'est la fondation naturelle pour les phases 4 à 9 (moteur de présentation, timeline, contexte enseignant) — à étudier avant de créer de nouvelles tables redondantes.
- **Aucun modèle ORM côté FastAPI** : tout passe par du SQL brut (`sqlalchemy.text()`). Fonctionnel mais fragile (pas de validation de schéma, pas de migrations Alembic liées au code Python).

## 6. Fichiers à modifier (chantiers à venir, par phase)

- Phase 3 (RAG/cours réels) : `scripts/import_document.py`, `scripts/import_source_url.py` (ajouter l'écriture en base), `src/db/schema.ts` (ajouter `knowledge_documents`/`knowledge_chunks` ou adopter la migration 2), `apps/api/app/api/router.py` (`/tutor/start`, `/research/search`).
- Phase 4-6 (moteur de cours, timeline, avatar) : nouveau `CoursePresentationController`/`TeachingTimeline` côté `src/components/CoursePlayer.tsx` ou un nouveau composant dédié ; `services/agents/orchestrator.py` (actuellement non appelé par `apps/api` — code mort à réactiver ou supprimer).
- Phase 12-13 (design) : tokens `--color-ed-ink/-surface/-elevated/-line/-accent/-violet/-blue/-orange` dans `globals.css:31-38` semblent être des doublons non utilisés — à vérifier avant suppression. Emojis-icônes à remplacer dans `OnboardingWizard.tsx`, `ExamRunner.tsx`, et les glyphes de salutation (`app/page.tsx`, `auth/login/page.tsx`, `suivi/page.tsx`, `profil/page.tsx`).
- Phase 14 (suppression du démo) : ne rien retirer de `src/lib/ai.ts`/`content.ts` tant que les tables réelles ne sont pas peuplées (voir section 5) — sinon régression immédiate vers des écrans vides.

## 7. Risques de régression identifiés

- Le catalogue de cours (`resolveCourseCatalog`) a un comportement de repli **silencieux** : si on peuple partiellement `courses` en base sans y mettre les 6 clés déjà utilisées par le contenu statique, l'utilisateur verra un sous-ensemble différent de cours sans avertissement. À traiter explicitement lors du branchement.
- `apps/api` n'avait **aucune dépendance installée** avant cet audit (`fastapi` absent du venv) — tout appel supposé "déjà testé" dans une session précédente ne l'était probablement pas réellement en local.
- Les deux migrations SQL ne sont reliées par aucun outil de migration versionné (pas de `drizzle-kit`, pas d'Alembic) — toute nouvelle table doit être ajoutée à la fois en SQL et dans `src/db/schema.ts` à la main, sans garde-fou automatique.
- `services/agents/orchestrator.py` et `services/voice/providers.py` (avant cet audit) étaient du code mort non importé par `apps/api` — vérifier avant de supposer qu'un module "existe" qu'il est réellement appelé quelque part.

## 8. Tests existants

- Python/ML (`tests/`) : couvre le classifieur NLP, le chunking, les transitions d'avatar JSON, le schéma/les splits du dataset d'entraînement — réels et pertinents pour `ml/`.
- `apps/api/tests/test_health.py` : un seul test, vérifie que `/health` existe dans le schéma OpenAPI (n'appelle pas l'endpoint, ne teste pas la DB).
- **Frontend (`src/`) : zéro test automatisé** (aucun `*.test.ts`/`*.spec.ts`). C'est le point le plus faible pour la phase 17 (tests obligatoires).
