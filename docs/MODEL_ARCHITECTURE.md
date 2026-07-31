# Architecture des modèles EduLab AI

## Principe

EduLab n’utilise pas « plusieurs IA qui répondent toutes en même temps ». Chaque modèle a un rôle précis. Le pipeline collecte des éléments fiables, puis **OpenAI produit une seule réponse pédagogique finale**.

```text
Question écrite ───────────────────────────────┐
Question orale → STT → texte ─────────────────┤
                                               ▼
                        recherche locale hybride
                     TF-IDF + MiniLM/FAISS + fusion
                                               │
                         contexte insuffisant ?
                              ├─ SerpAPI filtré
                              └─ Gemini + Google Search
                                               │
                                               ▼
                              OpenAI Responses API
                      réponse + tableau + vérification
                                               │
                                    voix TTS / affichage
```

## Responsabilités

- **OpenAI GPT‑5.6 Sol** : raisonnement final, explication, correction et démonstration structurée.
- **Gemini avec Google Search** : recherche web complémentaire avec métadonnées de grounding. Ce texte reste un contexte, pas la réponse finale.
- **TF‑IDF** : retrouve efficacement les termes et formules exacts.
- **MiniLM multilingue + FAISS** : retrouve des passages sémantiquement proches même si les mots diffèrent. Le composant est optionnel et le TF‑IDF reste disponible sans lui.
- **Reciprocal Rank Fusion** : combine les classements lexical et sémantique sans comparer artificiellement leurs scores.
- **Qwen2.5 + LoRA EduLab** : repli open source/local. L’adaptation actuelle est une preuve technique, pas un remplacement validé du moteur principal.
- **ElevenLabs Scribe / OpenAI Transcribe** : transcrivent la voix en texte avant le raisonnement.
- **Heuristique apprenant** : calcule une recommandation explicable en attendant un pilote réel consentant.

## Ordre de confiance des sources

1. documents officiels ivoiriens validés ;
2. contenus éducatifs internes validés ;
3. institutions et ressources éducatives autorisées ;
4. résultats web marqués comme non validés ;
5. absence de réponse si aucune preuve suffisante n’est disponible.

La configuration exécutable des rôles se trouve dans `configs/model_routing.yaml`.
