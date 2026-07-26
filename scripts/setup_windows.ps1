$ErrorActionPreference = "Stop"
if (-not (Test-Path ".env.local")) { Copy-Item ".env.example" ".env.local" }
npm install
py -3.11 -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -r apps\api\requirements.txt
Write-Host "Configuration terminée. Renseignez .env.local avant le démarrage."
