@echo off
title Iniciar Servidor - Libro para mis hijos
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
