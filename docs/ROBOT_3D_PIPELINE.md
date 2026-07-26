# Pipeline du Professeur IA 3D

Le professeur affiché dans EduLab est un personnage Three.js procédural. Il ne dépend plus d'une image 2D.

## Runtime

- `RobotProfessor3D.tsx` construit les volumes, matériaux et articulations.
- `RobotTeacher.tsx` conserve l'API d'état utilisée par les lecteurs de cours.
- `AIProfessorClassroom.tsx` orchestre le RAG, le TTS et les gestes.
- ElevenLabs passe par `/api/voice/tts`; Web Speech sert de repli gratuit.
- Web Audio mesure le signal TTS et pilote la mâchoire à chaque frame.

## États

`arrivee`, `salutation`, `ecoute`, `reflexion`, `parole`, `ecriture`, `encouragement`, `correction`, `felicitation`.

Les transitions sont interpolées dans `useFrame` pour éviter les changements brusques. Les animations fortes sont réduites lorsque `prefers-reduced-motion` est actif.

## Évolution vers Blender

Le contrôleur est indépendant du maillage. Un futur fichier GLB créé dans Blender pourra remplacer les primitives en conservant les mêmes états, le même TTS et l'analyse audio. Le GLB devra exposer des clips ou bones pour la tête, la mâchoire, les bras, les avant-bras, les mains et les yeux.
