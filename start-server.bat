@echo off
pushd "%~dp0"

if not exist "venv\" (
    echo [INFO] Virtual environment not found. Starting installation...
    call install-requirements.bat
)

.\venv\Scripts\python start-server.py

popd
