# Sécurité

- Secrets exclusivement dans `.env.local`, ignoré par Git.
- Clé Supabase secrète uniquement côté serveur.
- Cookies HttpOnly, SameSite Lax et Secure en production.
- Taille et extensions des imports contrôlées ; antivirus configurable reste à brancher.
- Métadonnées de provenance, hash et statuts requis.
- Les documents ne sont jamais des instructions système.
- RLS initiale active ; politiques fines enseignant/parent/admin à compléter.
- Logs sans contenu de conversations ni secrets.
- Clés et mot de passe transmis dans la conversation à renouveler avant production.
