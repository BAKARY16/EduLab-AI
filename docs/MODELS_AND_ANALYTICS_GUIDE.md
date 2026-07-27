# Guide d’exposé — données élèves et modèles EduLab AI

## Ce que montre le notebook

Le notebook `06_student_learning_analytics_colab.ipynb` présente un processus Data Analyst complet : question métier, import, dictionnaire, contrôle qualité, analyse descriptive, segmentation, construction de variables, baseline, modèles ML, évaluation, interprétation et recommandations.

Le CSV de démonstration est **synthétique**. Il contient 300 identifiants anonymes et 2 400 activités reproductibles. Il ne faut jamais le présenter comme une collecte réelle. La même structure pourra recevoir plus tard un export Supabase anonymisé et autorisé.

## Modèles et composants réellement présents

| Élément | Rôle dans EduLab | État honnête |
|---|---|---|
| Règles de maîtrise `heuristic-0.1.0` | Calcule un niveau de maîtrise, le besoin de remédiation et la difficulté recommandée | Fonctionnel, déterministe, explicable |
| Classifieur NLP par règles | Détecte intention et matière dans une question | Baseline locale, couverture limitée |
| TF-IDF bigrammes + similarité cosinus | Retrouve les passages de cours liés à la question du professeur IA | Baseline RAG fonctionnelle sur les documents indexés |
| Qwen2.5-0.5B-Instruct + LoRA EduLab | Génère une réponse pédagogique structurée | Preuve technique, adaptation très courte, pas encore un modèle de production |
| OpenAI configuré en fournisseur optionnel | Génération de secours lorsque la clé et le fournisseur sont activés | Intégration disponible, dépend du service externe |
| Régression logistique du notebook | Baseline statistique explicable pour détecter la remédiation | Démonstration sur données synthétiques, non déployée |
| Random Forest du notebook | Détecte des relations non linéaires et classe le risque de remédiation | Démonstration sur données synthétiques, non déployée |
| ElevenLabs / OpenAI STT | Synthèse et transcription vocales | Fournisseurs externes configurables, pas des modèles entraînés par EduLab |

## Différence entre RAG, LLM et modèle apprenant

- Le **RAG** cherche des passages dans les contenus autorisés. Il apporte la traçabilité documentaire.
- Le **LLM professeur** formule l’explication à partir de la question et du contexte retrouvé.
- Le **modèle apprenant** estime un besoin d’accompagnement à partir des interactions. Pour l’instant, EduLab utilise une règle explicable ; les modèles du notebook sont une démonstration à valider sur un pilote réel.

## Formulation conseillée pendant l’exposé

« Nous n’utilisons aucune donnée personnelle de mineur pour cette démonstration. Nous avons construit un dataset synthétique reproductible qui imite le schéma des événements EduLab. Le notebook montre toute la démarche analytique. Les modèles prédictifs illustrent la prochaine étape, mais la plateforme actuelle conserve une baseline déterministe et explicable tant que nous ne disposons pas de données réelles consenties et validées. »

## Limites à annoncer

- Les résultats du notebook mesurent la cohérence du pipeline sur des données synthétiques, pas l’efficacité pédagogique réelle.
- Une corrélation n’est pas une causalité.
- Tout futur pilote devra mesurer les biais liés au niveau, à la matière et à la qualité de connexion.
- Aucun score ne doit sanctionner un élève ni remplacer le jugement de l’enseignant.
