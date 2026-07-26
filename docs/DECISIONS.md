# Décisions d'architecture

## ADR-001 — Supabase comme infrastructure, logique métier dans Next.js

Supabase fournit Auth, PostgreSQL, Storage et pgvector. Les actions serveur Next.js conservent la logique métier et les cookies HttpOnly afin de ne jamais exposer la clé `service_role` au navigateur.

## ADR-002 — Authentification progressive

`AUTH_PROVIDER=local` permet le développement sans compte externe. `AUTH_PROVIDER=supabase` active Supabase Auth. Les deux modes utilisent les mêmes tables applicatives et le même rendu.

## ADR-003 — Provenance avant génération

Tout document possède un statut officiel, un statut de validation, une empreinte et une source. Un document communautaire ou une correction proposée ne devient jamais officiel par simple ingestion.
