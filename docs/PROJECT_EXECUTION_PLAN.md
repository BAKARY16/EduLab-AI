# Plan d’exécution scientifique — EduLab AI

## Objectif vérifiable

EduLab AI doit fournir des cours scientifiques interactifs par matière, niveau et langue, un professeur textuel et vocal, des réponses ancrées dans des sources affichées, des exercices adaptatifs et un laboratoire virtuel. Une fonctionnalité n’est déclarée réalisée que si elle possède un point d’entrée, un test et une métrique ou une preuve d’exécution.

## Phase 1 — Cadrage, audit, baseline et évaluation

- Corpus autorisé : programmes et documents DPFC locaux, avec statut de droit et validation dans les métadonnées.
- Dataset EduLab-Science actuel : 369 exemples synthétiques ancrés, répartis en train/validation/test (252/63/54). Il ne constitue pas encore un gold set humain.
- Baseline retrieval : TF-IDF mots/bigrammes, filtrée par matière et niveau.
- Baseline générative : Qwen2.5-0.5B-Instruct + adaptateur LoRA de démonstration (5 étapes seulement).
- Jeux gold requis : retrieval, exactitude scientifique, fidélité aux sources, qualité pédagogique, sécurité et multilingue.
- Mesures : Recall@k, MRR, exactitude des citations, groundedness, taux d’abstention correct, latence p50/p95, score pédagogique humain.

## Phase 2 — Pipeline et architecture fonctionnelle

Flux unique : documents autorisés → extraction → normalisation → chunks pédagogiques → contrôle qualité → embeddings → FAISS → retrieval filtré → génération → garde-fous → sources → interface/voix.

Le professeur, l’évaluateur, l’assistant de devoir et le suivi pédagogique consomment la même API et les mêmes identifiants de cours. Aucun agent ne possède son propre corpus parallèle.

## Phase 3 — Améliorations et ablations

1. Remplacer la baseline TF-IDF par `paraphrase-multilingual-MiniLM-L12-v2` + FAISS.
2. Comparer : sans RAG, TF-IDF, dense FAISS, hybride et hybride avec reranking curriculaire.
3. Comparer le modèle de base et le LoRA sur le même test gelé.
4. Étudier chunk size/overlap, top-k, filtres niveau/matière et seuil d’abstention.
5. Ne lancer un fine-tuning long qu’après validation humaine des exemples.

## Phase 4 — Évaluation, garde-fous et analyse d’erreurs

- Refus ou demande de clarification lorsque les sources sont absentes ou contradictoires.
- Séparation stricte entre extrait source, explication du modèle et simulation.
- Pas de réponse finale immédiate en mode devoir ; indices graduels.
- Journalisation sans secret ni donnée personnelle brute.
- Analyse d’erreurs par matière, niveau, langue, type de question et source.
- Tests de régression exécutés par `python scripts/evaluate_all.py` et `pytest`.

## Seuils de passage MVP

| Critère | Seuil |
|---|---:|
| Recall@3 retrieval | ≥ 0,90 sur au moins 50 questions humaines |
| Exactitude des filtres matière/niveau | 1,00 |
| Citations supportant la réponse | ≥ 0,90 |
| Exactitude scientifique humaine | ≥ 0,85 |
| Abstention sur questions hors corpus | ≥ 0,90 |
| Réponse API p95 hors génération locale | < 2 s |

Les six questions actuelles servent uniquement de smoke test : elles ne suffisent pas à valider le MVP.
