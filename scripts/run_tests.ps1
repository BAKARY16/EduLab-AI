$ErrorActionPreference = "Stop"
npm run typecheck
$env:PYTHONPATH = "apps/api"
& .\.venv\Scripts\python.exe -m pytest apps\api\tests tests -q
