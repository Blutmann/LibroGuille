@echo off
title Libro para mis hijos - Guillermo Bautista Harispe
cd /d "%~dp0"

echo ======================================================
echo   Iniciando prototipo: "Libro para mis hijos"
echo ======================================================

netstat -ano | findstr ":3000 " >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] El servidor ya se encuentra activo en http://localhost:3000
    start http://localhost:3000
    goto end
)

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

set CC_NODE="C:\Program Files\Common Files\Adobe\Creative Cloud Libraries\libs\node.exe"
if exist %CC_NODE% (
    %CC_NODE% serve.js --open
    goto end
)

echo No se detecto Node.js directamente. Iniciando servidor liviano con PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = 3000; Start-Process 'http://localhost:3000'; & 'serve.js'"

:end
pause
