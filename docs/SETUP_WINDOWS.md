# Installation Windows

Version cible : Python 3.11. Exécuter `scripts/setup_windows.ps1`, renseigner `.env.local`, puis `scripts/start_dev.ps1`.

Sur la machine auditée, Python 3.13 Microsoft Store est utilisé temporairement car l'installateur 3.11 s'est bloqué. Docker utilise bien `python:3.11-slim`.

Tests : `scripts/run_tests.ps1`. Frontend seul : `npm run dev`. API seule : définir `PYTHONPATH=apps/api`, puis `python -m uvicorn app.main:app --app-dir apps/api --reload --port 8000`.
