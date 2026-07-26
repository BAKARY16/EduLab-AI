# Audit MCP et outils — 2026-07-23

## Constat vérifié

- Client actif: Codex dans VS Code, Windows, Python 3.13.14.
- MCP visibles: ressources `codex_apps` (templates et GitHub). **Aucun MCP Hugging Face n'est connecté.**
- Navigateur: outil web de recherche/lecture disponible; pas de session interactive pilotée.
- Fichiers: lecture/écriture dans le workspace; terminal PowerShell; Git Windows.
- Calcul local: PyTorch CPU; aucun entraînement lourd n'est annoncé.

## Hugging Face MCP

La configuration officielle est documentée dans `docs/BROWSER_MCP_SETUP.md`. Elle nécessite une action humaine dans le client depuis https://huggingface.co/mcp. Aucun succès de connexion n’est inventé. Le téléchargement public via HTTPS/Transformers reste indépendant du MCP.
