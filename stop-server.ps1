# Detener servidor local en puerto 3000
$port = 3000
$ErrorActionPreference = 'SilentlyContinue'

$conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($conns) {
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        if ($p -and $p -gt 0) {
            Write-Host "[INFO] Deteniendo proceso PID: $p escuchando en el puerto $port..." -ForegroundColor Yellow
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "  [OK] El servidor en http://localhost:$port ha sido detenido." -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
} else {
    Write-Host "[INFO] No se encontro ningun servidor activo en el puerto $port." -ForegroundColor Cyan
}
