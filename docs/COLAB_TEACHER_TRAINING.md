# Entraîner le professeur EduLab sur Google Colab

## Fichiers nécessaires

- `notebooks/04_teacher_model_lora_training.ipynb`
- `data/processed/edulab_teacher_train.jsonl`
- `data/processed/edulab_teacher_validation.jsonl`
- `data/processed/edulab_teacher_test.jsonl`

## Procédure

1. Ouvrir [Google Colab](https://colab.research.google.com/).
2. Choisir **Fichier → Importer un notebook**, puis sélectionner `04_teacher_model_lora_training.ipynb`.
3. Choisir **Exécution → Modifier le type d’exécution → GPU T4**.
4. Exécuter les cellules dans l’ordre.
5. Lors de l’import demandé, sélectionner simultanément les trois fichiers JSONL.
6. Examiner l’échantillon de données. Passer `CONFIRM_DATA_REVIEW` à `True` seulement après ce contrôle.
7. Laisser l’entraînement et l’évaluation se terminer.
8. Télécharger l’archive `edulab-teacher-qwen-1.5b-lora.zip` créée par la dernière cellule.

Une session T4 devrait suffire pour ce corpus, mais la durée dépend de la disponibilité et des limites de Colab. Ne fermez pas l’onglet pendant l’entraînement.

## Installation dans EduLab

1. Décompresser l’archive dans `models/edulab-teacher-qwen-1.5b-lora/`.
2. Ajouter dans `.env.local` :

```env
TEACHER_BASE_MODEL=Qwen/Qwen2.5-1.5B-Instruct
TEACHER_ADAPTER_PATH=models/edulab-teacher-qwen-1.5b-lora
```

3. Redémarrer le service professeur.
4. Comparer l’ancien et le nouveau modèle avec le jeu de test avant de modifier le routage principal.

## Limites importantes

- Le corpus actuel reste petit : 252 exemples d’entraînement, 63 de validation et 54 de test.
- Plusieurs exemples sont synthétiques et doivent faire l’objet d’une validation scientifique humaine.
- Un fine-tuning apprend surtout le format pédagogique attendu. Il ne transforme pas le modèle en base de connaissances officielle.
- Le RAG, les sources officielles et la vérification des réponses restent obligatoires.
- Qwen 1.5B sera sensiblement plus lent que Qwen 0.5B sur un ordinateur sans GPU.
