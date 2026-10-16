@echo off
title Libro para mis hijos - Guillermo Bautista Harispe
cd /d "%~dp0"

echo ======================================================
echo   Iniciando prototipo: "Libro para mis hijos"
echo ======================================================

set AGY_NODE="%APPDATA%\Antigravity\bin\agy-node.cmd"

where node >nul 2>nul
if %errorlevel% equ 0 (
    node serve.js --open
    goto end
)

if exist %AGY_NODE% (
    call %AGY_NODE% serve.js --open
    goto end
)

echo No se detecto Node.js directamente. Iniciando servidor liviano con PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = 3000; Start-Process 'http://localhost:3000'; & 'serve.js'"

:end
pause
