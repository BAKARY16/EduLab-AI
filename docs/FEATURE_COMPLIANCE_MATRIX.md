# Matrice de conformité fonctionnelle

| Fonction annoncée | État vérifié | Preuve / prochaine condition |
|---|---|---|
| Matière, niveau, langue | Partiel | explorateur opérationnel ; contenu surtout français et Physique-Chimie |
| Cours scientifique interactif | Partiel | cours PDF + professeur RAG ; validation humaine incomplète |
| Chat avec explication | Fonctionnel | `/tutor/generate`, Qwen-LoRA local avec repli RAG ancré |
| RAG et sources affichées | Fonctionnel baseline | TF-IDF, 237 chunks ; métriques dans `reports/rag_metrics.json` |
| QCM corrigé | Prototype | dataset et interface présents ; boucle de suivi à tester |
| Assistant vocal | Fonctionnel avec repli | TTS fournisseur puis Web Speech navigateur |
| Simulations paramétrables | Prototype | composants de laboratoire présents, couverture scientifique à évaluer |
| Suivi erreurs/notions | Partiel | schéma de données présent ; données longitudinales insuffisantes |
| Recommandation adaptative | Non validé | modèle apprenant interdit tant que les événements réels manquent |
| Tableau de bord | Fonctionnel UI | doit être alimenté uniquement par événements backend réels |
| LoRA | Preuve technique | adaptateur Qwen 0.5B, entraînement de 5 étapes, non production |
| Vector embeddings + FAISS | Pipeline prêt, non exécuté | `scripts/build_faiss_index.py`, dépendances séparées |
| Cours Fomesoutra Terminale D | Fonctionnel | 3 cours + 3 ressources d'exercices sur les fonctions logarithmes, accessibles depuis l'explorateur |
| Recherche complémentaire | Fonctionnel si clé configurée | Agent SerpAPI limité aux domaines autorisés; résultats web marqués non validés |
| Langues locales ivoiriennes | Recherche requise | aucun corpus validé ; ne pas simuler une traduction fiable |
| Laboratoire virtuel complet | En cours | physique/chimie/biologie et garde-fous à compléter |

Cette matrice empêche de présenter un prototype, une configuration ou un fichier vide comme une fonctionnalité achevée.
