# Évaluation RAG

Le pipeline d'extraction et de chunking est implémenté. L'index vectoriel n'est pas construit car aucun document n'a encore été importé et aucun modèle d'embeddings n'a été benchmarké.

Métriques prévues : Recall@K, MRR, précision des filtres classe/série, taux sourcé, contexte insuffisant et latence. Les jeux d'évaluation devront séparer strictement classes et séries.
