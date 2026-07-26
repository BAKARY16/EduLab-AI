# Configuration manuelle du MCP Hugging Face

Cet agent n'a pas d'outil de navigation piloté (pas de Playwright/Puppeteer/browser-use connecté), seulement `WebFetch` (lecture d'une page unique, sans session ni connexion) et `WebSearch`. La page `https://huggingface.co/mcp` génère sa configuration à partir d'une session de navigateur connectée à un compte Hugging Face et détecte le client MCP local — ni l'un ni l'autre n'est simulable honnêtement depuis ici. Voici donc la procédure à suivre manuellement, une seule fois.

## 1. Générer la configuration

1. Ouvrir <https://huggingface.co/mcp> dans votre navigateur, connecté à votre compte Hugging Face.
2. Sélectionner le client « Claude Code ».
3. Copier le bloc JSON généré (il contient une URL de serveur MCP et un jeton lié à votre compte).

## 2. Ajouter le serveur

Deux façons équivalentes :

**Option A — CLI (recommandé)**
```bash
claude mcp add --transport http hf-mcp-server https://huggingface.co/mcp?login
```
Cette commande ouvre un flux d'autorisation dans votre navigateur par défaut.

**Option B — fichier `.mcp.json` à la racine du projet**
```json
{
  "mcpServers": {
    "huggingface": {
      "type": "http",
      "url": "https://huggingface.co/mcp"
    }
  }
}
```
Puis relancer Claude Code et valider l'autorisation demandée dans le navigateur.

## 3. Vérifier

Après redémarrage du client :
- `claude mcp list` doit afficher `huggingface` avec un statut connecté.
- Les outils `hf_model_search`, `hf_dataset_search` (noms exacts selon version) doivent apparaître dans la liste d'outils disponibles.

## Pourquoi ce n'est pas fait automatiquement ce soir

- Aucune action ne doit être bloquée en attendant : le téléchargement du modèle `Qwen/Qwen2.5-0.5B-Instruct` et du dataset `allenai/sciq` fonctionne très bien en HTTPS direct via `huggingface_hub`/`transformers`/`datasets`, sans MCP.
- Le MCP Hugging Face devient utile surtout pour la **recherche** de modèles/datasets et la **publication** interactive ; ni l'un ni l'autre n'est un blocage ce soir puisque le modèle de base est déjà imposé par la mission et que la publication (`scripts/push_model_to_hub.py`) peut se faire en ligne de commande avec un jeton d'accès personnel (`huggingface-cli login`), sans MCP.
- Installer un connecteur sans besoin concret immédiat augmente la surface de secrets à gérer — cohérent avec la décision déjà prise dans `docs/MCP_SETUP.md` lors d'une session précédente.
# Configuration officielle Hugging Face MCP pour Codex

Audit du 23 juillet 2026 : aucun serveur MCP Hugging Face n'apparaît parmi les
ressources connectées. Les seules ressources MCP visibles sont celles des apps
Codex installées (templates et GitHub). Cette absence n'empêche pas l'usage des
bibliothèques publiques Transformers/Datasets.

Procédure humaine sûre :

1. Ouvrir <https://huggingface.co/mcp> dans une session Hugging Face normale.
2. Choisir le client compatible proposé par la page et copier uniquement la
   configuration générée officiellement.
3. Ajouter cette configuration dans les paramètres MCP du client, sans placer
   de jeton dans le dépôt ni dans un notebook.
4. Redémarrer le client si demandé, puis vérifier que les outils de recherche
   de modèles et datasets Hugging Face apparaissent.
5. Si l'authentification échoue, s'arrêter : ne contourner ni connexion ni
   CAPTCHA et ne jamais coller un cookie dans le projet.

Documentation officielle : <https://huggingface.co/docs/hub/agents-mcp>.

Statut actuel : **à faire manuellement — connexion non revendiquée**.
