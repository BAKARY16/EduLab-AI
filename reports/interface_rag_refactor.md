# Refonte interface, catalogue et RAG — 24 juillet 2026

## Interface

Le shell utilise désormais une navigation claire sur fond crème, un vert forêt
comme couleur d’action, des cartes blanches à faible ombre et une grille large.
Le tableau de bord reprend les relations visuelles de la référence fournie :
indicateurs, progression, répartition par matière, reprise des cours, tuteur IA
et activité récente. Les données personnelles restent issues du backend existant.

## Catalogue

Le catalogue est généré depuis les CSV curriculum et contient 41 notions :
Troisième, Terminale C et Terminale D, organisées en dossiers niveau, matière,
chapitre et notion. Fomesoutra est référencé comme catalogue communautaire de
métadonnées. Aucun document Fomesoutra n’est automatiquement téléchargé.

## RAG

Le retrieval filtre strictement classe et matière, ajoute des boosts pour la
leçon, la compétence, la validation et le statut officiel, puis renvoie les
citations au client. Le fallback vers une autre classe est désactivé par défaut.
Le backend transmet les passages au LoRA et l’interface affiche les sources.

## LLM

Base : `Qwen/Qwen2.5-0.5B-Instruct`. Adaptateur LoRA réel, cinq pas CPU,
20 exemples train et 10 validation. Perte validation : 3,6795 → 3,3798.
Le prompt système interdit désormais les noms, dates et faits absents du contexte.
Une validation humaine reste obligatoire avant usage pédagogique à grande échelle.
