# Iniciar servidor local desacoplado para "Libro para mis hijos"
$ErrorActionPreference = 'SilentlyContinue'
$port = 3000
$projectDir = $PSScriptRoot
if (-not $projectDir) { $projectDir = Get-Location }

# 1. Comprobar si ya esta activo en el puerto 3000
$activeConn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($activeConn) {
    $activePid = $activeConn.OwningProcess[0]
    Write-Host "[INFO] El servidor ya se encuentra activo en http://localhost:$port (PID: $activePid)." -ForegroundColor Cyan
    Start-Process "http://localhost:$port"
    exit 0
}

# 2. Detectar Node.js
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCmd) { $nodeCmd.Source } else { $null }
if (-not $nodePath) {
    $candidates = @(
        "$env:APPDATA\Antigravity\bin\agy-node.cmd",
        "C:\Program Files\Common Files\Adobe\Creative Cloud Libraries\libs\node.exe",
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe"
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            $nodePath = $cand
            break
        }
    }
}

if (-not $nodePath) {
    Write-Host "[ERROR] No se encontro Node.js disponible en el sistema." -ForegroundColor Red
    exit 1
}

$serveJs = Join-Path $projectDir "serve.js"
$logFile = Join-Path $projectDir "server.log"

Write-Host "[INFO] Runtime detectado: $nodePath" -ForegroundColor Gray
Write-Host "[INFO] Iniciando servidor independiente desacoplado..." -ForegroundColor Gray

# Iniciar proceso totalmente desacoplado mediante WMI / Win32_Process
$startCmd = "`"$nodePath`" `"$serveJs`""
$fullCmd = "cmd.exe /c `"$startCmd > `"$logFile`" 2>&1`""

$res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = $fullCmd
    CurrentDirectory = $projectDir
}

Start-Sleep -Milliseconds 1500

$verify = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($verify) {
    $servPid = $verify.OwningProcess[0]
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "  [OK] Servidor activo exitosamente en segundo plano" -ForegroundColor Green
    Write-Host "       URL: http://localhost:$port" -ForegroundColor Green
    Write-Host "       PID: $servPid" -ForegroundColor Green
    Write-Host "       Log: $logFile" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
    Start-Process "http://localhost:$port"
} else {
    Write-Host "[INFO] Servidor despachado. Verifique $logFile si demora en cargar." -ForegroundColor Yellow
    Start-Process "http://localhost:$port"
}
