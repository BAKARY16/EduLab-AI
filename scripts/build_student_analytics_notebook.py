"""Build the presentation-ready Colab notebook for learner analytics."""
from pathlib import Path

import nbformat as nbf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "notebooks" / "06_student_learning_analytics_colab.ipynb"


def code(source: str):
    return nbf.v4.new_code_cell(source.strip())


def markdown(source: str):
    return nbf.v4.new_markdown_cell(source.strip())


cells = [
    markdown("""
# EduLab AI — Analyse des données d'apprentissage

**Démonstration du processus métier d'un Data Analyst**, de la compréhension du besoin jusqu'aux recommandations.

> Le fichier fourni contient uniquement des observations **synthétiques et anonymes**. Il reproduit la structure analytique d'EduLab sans représenter de vrais élèves. Un export réel ne devra être utilisé qu'après consentement, minimisation et anonymisation.

## Question métier

Comment repérer les élèves qui ont besoin d'une remédiation, comprendre les facteurs associés à leur progression et proposer une prochaine activité adaptée ?
"""),
    markdown("""
## 1. Chaîne de valeur analytique

1. Cadrer la question et les indicateurs.
2. Importer et documenter les données.
3. Contrôler qualité, types, doublons et valeurs manquantes.
4. Explorer les comportements et la progression.
5. Construire des variables au niveau élève.
6. Créer une baseline métier puis un modèle ML explicable.
7. Évaluer sans fuite de données, interpréter et recommander.
8. Exporter uniquement les indicateurs nécessaires à la plateforme.
"""),
    code("""
# Imports — compatibles Google Colab
import json, warnings
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
try:
    from IPython.display import display
except ImportError:
    display = print
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix,
                             ConfusionMatrixDisplay, roc_auc_score, RocCurveDisplay)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

warnings.filterwarnings('ignore')
sns.set_theme(style='whitegrid', palette='crest')
RANDOM_STATE = 42
"""),
    markdown("""
## 2. Import du jeu de données

Le notebook cherche d'abord le CSV dans le dépôt cloné. Dans Colab, exécutez la cellule de clonage si nécessaire. Vous pouvez ensuite remplacer le CSV synthétique par un export Supabase **anonymisé** conservant les mêmes colonnes.
"""),
    code("""
# Dans un Colab vierge, décommenter :
# !git clone https://github.com/BAKARY16/EduLab-AI.git

candidates = [
    Path('data/synthetic/student_learning_analytics.csv'),
    Path('/content/EduLab-AI/data/synthetic/student_learning_analytics.csv'),
]
DATA_PATH = next((p for p in candidates if p.exists()), None)
if DATA_PATH is None:
    raise FileNotFoundError("Clonez le dépôt ou téléversez student_learning_analytics.csv")

df = pd.read_csv(DATA_PATH, parse_dates=['event_date'])
print(f'{df.shape[0]:,} activités × {df.shape[1]} variables')
display(df.head())
"""),
    markdown("""
## 3. Dictionnaire des données

| Variable | Sens métier |
|---|---|
| `learner_id` | Identifiant irréversible, sans nom ni e-mail |
| `grade`, `subject` | Niveau et matière |
| `activity_type` | Cours, exercice, examen ou laboratoire |
| `session_minutes` | Durée active de la session |
| `attempts`, `hints_used` | Effort et besoin d'assistance |
| `accuracy` | Proportion de réponses correctes, entre 0 et 1 |
| `mastery_before/after` | Maîtrise estimée avant/après l'activité |
| `inactivity_days` | Nombre de jours sans activité |
| `completed` | Activité terminée |
| `needs_remediation` | Cible métier : accompagnement renforcé nécessaire |
| `origin` | `synthetic` ou, après gouvernance, `real` |
"""),
    code("""
# Audit de qualité
quality = pd.DataFrame({
    'type': df.dtypes.astype(str),
    'manquants': df.isna().sum(),
    'taux_manquants_%': (df.isna().mean() * 100).round(2),
    'uniques': df.nunique(),
})
display(quality)
print('Doublons exacts :', df.duplicated().sum())

assert df['origin'].eq('synthetic').all(), 'Le notebook de démonstration attend des données synthétiques.'
assert df['accuracy'].between(0, 1).all()
assert df['mastery_before'].between(0, 1).all()
assert df['mastery_after'].between(0, 1).all()
assert set(df['completed'].unique()) <= {0, 1}
assert set(df['needs_remediation'].unique()) <= {0, 1}
"""),
    code("""
# Statistiques descriptives
display(df.describe(include='all').T)

kpis = pd.Series({
    'élèves': df.learner_id.nunique(),
    'activités': len(df),
    'taux de complétion': df.completed.mean(),
    'précision moyenne': df.accuracy.mean(),
    'maîtrise moyenne finale': df.mastery_after.mean(),
    'gain moyen de maîtrise': (df.mastery_after - df.mastery_before).mean(),
    'taux de remédiation': df.needs_remediation.mean(),
})
display(kpis.to_frame('valeur'))
"""),
    code("""
# Distributions principales
fig, axes = plt.subplots(2, 2, figsize=(14, 9))
sns.histplot(df, x='accuracy', hue='needs_remediation', bins=20, ax=axes[0,0])
axes[0,0].set_title('Précision et besoin de remédiation')
sns.boxplot(df, x='subject', y='mastery_after', ax=axes[0,1])
axes[0,1].tick_params(axis='x', rotation=15)
axes[0,1].set_title('Maîtrise finale par matière')
sns.barplot(df, x='activity_type', y='completed', ax=axes[1,0])
axes[1,0].set_title('Taux de complétion par activité')
sns.scatterplot(df, x='mastery_before', y='mastery_after', hue='activity_type', alpha=.45, ax=axes[1,1])
axes[1,1].plot([0,1], [0,1], '--', color='grey')
axes[1,1].set_title('Progression avant / après')
plt.tight_layout()
"""),
    code("""
# Analyse métier par segment
segment = (df.groupby(['grade', 'subject'])
             .agg(eleves=('learner_id','nunique'),
                  activites=('learner_id','size'),
                  precision=('accuracy','mean'),
                  maitrise=('mastery_after','mean'),
                  completion=('completed','mean'),
                  remediation=('needs_remediation','mean'))
             .reset_index())
display(segment.style.format({c:'{:.1%}' for c in ['precision','maitrise','completion','remediation']}))

pivot = segment.pivot(index='grade', columns='subject', values='remediation')
sns.heatmap(pivot, annot=True, fmt='.0%', cmap='YlOrRd')
plt.title('Part des activités nécessitant une remédiation')
plt.show()
"""),
    code("""
# Corrélations numériques : association ne signifie pas causalité
numeric = ['session_minutes','attempts','hints_used','accuracy','mastery_before',
           'mastery_after','inactivity_days','completed','needs_remediation']
plt.figure(figsize=(11, 7))
sns.heatmap(df[numeric].corr(), annot=True, fmt='.2f', cmap='RdBu_r', center=0)
plt.title('Matrice de corrélation')
plt.show()
"""),
    markdown("""
## 4. Passage du niveau activité au niveau élève

La décision pédagogique concerne un élève, pas une ligne isolée. Nous agrégeons donc ses activités. La séparation entraînement/test se fait ensuite par `learner_id` pour empêcher qu'un même élève apparaisse dans les deux ensembles.
"""),
    code("""
learner = (df.groupby(['learner_id','grade','learning_style','connectivity'])
    .agg(activity_count=('activity_type','size'),
         active_days=('event_date','nunique'),
         avg_session_minutes=('session_minutes','mean'),
         avg_attempts=('attempts','mean'),
         avg_hints=('hints_used','mean'),
         avg_accuracy=('accuracy','mean'),
         avg_mastery_before=('mastery_before','mean'),
         avg_mastery_after=('mastery_after','mean'),
         max_inactivity_days=('inactivity_days','max'),
         completion_rate=('completed','mean'),
         remediation_rate=('needs_remediation','mean'))
    .reset_index())
learner['mastery_gain'] = learner.avg_mastery_after - learner.avg_mastery_before
learner['needs_remediation'] = (learner.remediation_rate >= .5).astype(int)
display(learner.head())
print('Distribution de la cible :')
display(learner.needs_remediation.value_counts(normalize=True).rename('proportion'))
"""),
    markdown("""
## 5. Baseline métier

Avant le ML, EduLab dispose d'une règle transparente : remédiation si maîtrise inférieure à 60 %, précision inférieure à 55 % ou inactivité supérieure à 14 jours. Cette baseline est simple à expliquer et sert de référence au modèle.
"""),
    code("""
baseline_pred = ((learner.avg_mastery_after < .60) |
                 (learner.avg_accuracy < .55) |
                 (learner.max_inactivity_days >= 14)).astype(int)
print(classification_report(learner.needs_remediation, baseline_pred, digits=3))
"""),
    markdown("""
## 6. Modèles ML explicables

- **Régression logistique** : baseline statistique, coefficients interprétables.
- **Random Forest** : capte des relations non linéaires et fournit une importance globale des variables.

Ces modèles illustrent le pipeline. Ils ne doivent pas prendre seuls une décision scolaire et ne sont pas annoncés comme entraînés sur de vrais élèves.
"""),
    code("""
target = 'needs_remediation'
drop = ['learner_id','remediation_rate',target]
X = learner.drop(columns=drop)
y = learner[target]
groups = learner.learner_id

splitter = GroupShuffleSplit(n_splits=1, test_size=.25, random_state=RANDOM_STATE)
train_idx, test_idx = next(splitter.split(X, y, groups))
X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

categorical = X.select_dtypes(include='object').columns.tolist()
numeric_features = X.select_dtypes(exclude='object').columns.tolist()
preprocessor = ColumnTransformer([
    ('num', Pipeline([('imputer', SimpleImputer(strategy='median')),
                      ('scale', StandardScaler())]), numeric_features),
    ('cat', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')),
                      ('onehot', OneHotEncoder(handle_unknown='ignore'))]), categorical),
])

models = {
    'Régression logistique': LogisticRegression(max_iter=1000, class_weight='balanced', random_state=RANDOM_STATE),
    'Random Forest': RandomForestClassifier(n_estimators=250, max_depth=6, min_samples_leaf=5,
                                            class_weight='balanced', random_state=RANDOM_STATE),
}
results, fitted = [], {}
for name, estimator in models.items():
    pipe = Pipeline([('prep', preprocessor), ('model', estimator)])
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)
    proba = pipe.predict_proba(X_test)[:,1]
    fitted[name] = pipe
    report = classification_report(y_test, pred, output_dict=True, zero_division=0)
    results.append({'modèle':name, 'precision':report['1']['precision'],
                    'rappel':report['1']['recall'], 'f1':report['1']['f1-score'],
                    'roc_auc':roc_auc_score(y_test, proba)})
display(pd.DataFrame(results).sort_values('f1', ascending=False).style.format('{:.3f}', subset=['precision','rappel','f1','roc_auc']))
"""),
    code("""
# Évaluation détaillée du Random Forest
best = fitted['Random Forest']
pred = best.predict(X_test)
proba = best.predict_proba(X_test)[:,1]
print(classification_report(y_test, pred, digits=3))
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
ConfusionMatrixDisplay.from_predictions(y_test, pred, cmap='Greens', ax=axes[0])
RocCurveDisplay.from_predictions(y_test, proba, ax=axes[1])
plt.tight_layout()
"""),
    code("""
# Importance globale — aide à l'interprétation, pas preuve de causalité
feature_names = best.named_steps['prep'].get_feature_names_out()
importance = pd.Series(best.named_steps['model'].feature_importances_, index=feature_names).sort_values(ascending=False).head(15)
importance.sort_values().plot.barh(figsize=(9,6), color='#0d9b78')
plt.title('Variables les plus utilisées par le Random Forest')
plt.xlabel('Importance')
plt.show()
display(importance.to_frame('importance'))
"""),
    markdown("""
## 7. Traduction en décisions produit

Le résultat alimente trois actions contrôlées par l'humain :

- risque élevé : révision guidée, activité facile et alerte visible par l'élève/enseignant ;
- risque moyen : exercice ciblé avec indices progressifs ;
- risque faible : activité plus difficile ou examen blanc.

À surveiller avant production : qualité des labels, biais par niveau/connectivité, dérive temporelle, consentement, droit d'accès et validation pédagogique.
"""),
    code("""
# Table de recommandations exportable sans identité
scored = learner.loc[X_test.index, ['learner_id','grade','avg_mastery_after','avg_accuracy','max_inactivity_days']].copy()
scored['risk_probability'] = proba
scored['risk_level'] = pd.cut(scored.risk_probability, [-.01,.35,.65,1], labels=['faible','moyen','élevé'])
scored['recommended_action'] = scored.risk_level.map({
    'faible':'exercice difficile ou examen blanc',
    'moyen':'exercice ciblé avec indices',
    'élevé':'révision guidée et suivi enseignant',
})
display(scored.sort_values('risk_probability', ascending=False).head(15))
scored.to_csv('student_remediation_recommendations_demo.csv', index=False)
"""),
    markdown("""
## 8. Conclusion pour l'exposé

1. Nous partons d'une question pédagogique concrète.
2. Nous protégeons les mineurs : aucune identité dans l'analyse et données synthétiques pour la démonstration.
3. Nous contrôlons la qualité avant de calculer les KPI.
4. Nous analysons les segments et transformons les événements en profil élève.
5. Nous comparons une règle métier à deux modèles explicables.
6. Le score ne remplace jamais l'enseignant : il priorise une aide et doit être validé sur un pilote réel consentant.
"""),
]

nb = nbf.v4.new_notebook()
nb["cells"] = cells
nb["metadata"] = {
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python", "version": "3.11"},
    "colab": {"name": "EduLab_AI_Student_Learning_Analytics.ipynb", "provenance": []},
}
OUT.write_text(nbf.writes(nb), encoding="utf-8")
print(f"Notebook written to {OUT}")
