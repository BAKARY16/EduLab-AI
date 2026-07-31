@echo off
setlocal
set "EDULAB_REPO=%~dp0.."
set "EDULAB_ROOT=%EDULAB_REPO%\..\.."
set "PYTHONPATH=%EDULAB_REPO%"
set "PYTHON_EXE=%EDULAB_ROOT%\.venv\Scripts\python.exe"
set "HF_HOME=%EDULAB_ROOT%\.hf-cache"
cd /d "%EDULAB_REPO%"
echo [%date% %time%] Starting EduLab teacher model >> "%TEMP%\edulab-teacher.log"
"%PYTHON_EXE%" -u -m uvicorn ml.teacher.server:app --host 127.0.0.1 --port 8010 >> "%TEMP%\edulab-teacher.log" 2>&1
