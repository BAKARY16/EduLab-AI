# Couverture des cours — état réel

Date : 2026-07-23 (mise à jour). Chiffres mesurés directement en base (Supabase Postgres), pas estimés.

## Organisation des sources (nouveau)

Les documents sources authentiques sont désormais rangés en dossiers imbriqués niveau → matière :

```
data/raw/dpfc/
  Sixième/Physique-Chimie/PHYSIQUE-CHIMIE_6eme.pdf
  Cinquième/Physique-Chimie/PHYSIQUE-CHIMIE_5eme.pdf
  Quatrième/Physique-Chimie/PHYSIQUE-CHIMIE_4eme.pdf
  Troisième/Physique-Chimie/PHYSIQUE-CHIMIE_3eme.pdf
  Troisième/Mathématiques/MATHS_3eme.pdf   (corrompu, non ingéré — voir plus bas)
```

`scripts/ingest_knowledge_documents.py --batch-root data/raw/dpfc ...` ingère tout ce dossier en une commande : la classe et la matière sont déduites automatiquement du chemin (niveau/matière/fichier), donc ranger un nouveau PDF au bon endroit suffit à le rendre ingérable sans réécrire de métadonnées à la main.

La recherche (`rag/retrieval/search.py`) filtre maintenant par **classe en plus de la matière** : un élève de Cinquième reçoit du contenu de Cinquième en priorité. Si rien n'existe pour sa classe exacte, elle retombe automatiquement sur tout le contenu de la matière plutôt que de ne rien renvoyer — le professeur garde accès à tout ce qui est indexé, quel que soit le niveau demandé.

## Niveaux actuellement activés dans l'application

D'après `src/lib/content.ts`, l'app expose deux niveaux : **Collège** et **Lycée**, sur 3 matières (Mathématiques, Physique-Chimie, SVT).

## Couverture par niveau (classes DPFC réelles)

| Classe | Documents ingérés | Chunks indexés | Statut |
|---|---|---|---|
| Sixième | 1 (Physique-Chimie) | 62 | official / pending |
| Cinquième | 1 (Physique-Chimie) | 52 | official / pending |
| Quatrième | 1 (Physique-Chimie) | 63 | official / pending |
| Troisième | 1 (Physique-Chimie) | 59 | official / pending |
| Troisième — Mathématiques | 0 (fichier corrompu) | 0 | — |

**Total : 4 documents authentiques, 236 passages indexés et interrogeables, sur les classes réelles du secondaire ivoirien (6e à 3e), tous en Physique-Chimie.**

**Toujours aucun niveau à 10 cours réels structurés.** Ce qui existe maintenant, c'est du contenu source authentique indexé et cherchable (le professeur peut s'appuyer dessus pour expliquer, citer, répondre) — pas encore des "cours" au sens de la table `courses` (avec objectifs, prérequis, étapes, exercices, corrections). Voir section suivante.

## Pourquoi le minimum de 10/niveau n'est toujours pas atteint

1. **Mathématiques et SVT n'ont aucun document indexé.** Seule la Physique-Chimie a des programmes DPFC exploitables pour l'instant. `MATHS_3eme.pdf` reste corrompu (`pypdf` échoue sur sa structure interne) — à re-sourcer.
2. **Un document indexé n'est pas un "cours" structuré.** Transformer 236 passages de programme officiel en leçons avec objectifs/prérequis/exercices/corrections est un travail éditorial distinct, qui doit s'appuyer sur ces passages réels sans en inventer le contenu — non fait ce tour-ci.

## Prochaine étape concrète pour progresser

- Chercher et ingérer les programmes Mathématiques et SVT (6e à 3e) de la même manière — le pipeline batch est prêt, il suffit de les ranger dans `data/raw/dpfc/<Classe>/<Matière>/` et relancer l'ingestion.
- Remplacer `MATHS_3eme.pdf` par une version lisible.
- Décider qui valide humainement le `validation_status` des documents déjà ingérés (tous `pending` — normal, aucune validation humaine n'a encore eu lieu).
- Convertir une partie de ce contenu source en cours structurés (table `courses`), en citant les passages authentiques comme base.
