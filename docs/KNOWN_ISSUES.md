# Problèmes connus

- Les identifiants Supabase sont configurés et l'authentification distante est validée. Ils devront être renouvelés avant la mise en production puisqu'ils ont transité dans la conversation.
- La migration contient les politiques RLS minimales, mais les rôles enseignant, parent et administrateur exigent des politiques métier supplémentaires avant production.
- Les fixtures pédagogiques existantes sont des démonstrations et ne constituent pas encore un corpus officiel validé.
- La disponibilité publique de corrigés officiels DECO pour chaque année 2015–2026 n'est pas établie. L'année 2026 ne peut être considérée complète avant publication effective des épreuves.
- Le lint historique signale des apostrophes JSX non échappées et trois effets React dans `CoursePlayer`; ces défauts préexistaient à l'intégration et doivent être corrigés sans modifier le rendu.
- Après plusieurs serveurs Next.js concurrents, le cache `.next/dev` peut contenir un type HMR corrompu ; arrêter les anciens serveurs et régénérer `.next` résout ce défaut sans toucher aux sources.
- Python 3.11 n'a pas pu être installé localement : l'installateur Windows reste bloqué et ne peut être arrêté sans privilèges système. Python 3.13 sert aux tests locaux, Docker cible 3.11.
- Le dépôt est un sous-dossier entièrement non suivi d'un dépôt parent sale ; aucun commit automatique sûr n'a été créé.
- Aucun document pédagogique n'est importé, donc RAG vectoriel et génération sourcée restent volontairement non opérationnels.
