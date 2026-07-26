$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Start-Process -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory $root -WindowStyle Hidden
$env:PYTHONPATH = Join-Path $root "apps\api"
& (Join-Path $root ".venv\Scripts\python.exe") -m uvicorn app.main:app --app-dir (Join-Path $root "apps\api") --reload --port 8000
