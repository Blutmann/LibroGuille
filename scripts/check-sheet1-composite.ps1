Add-Type -AssemblyName System.Drawing

$pComp = "assets\sheet-01\sheet-01-composite.png"
if (Test-Path $pComp) {
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $pComp))
    Write-Host "Sheet 01 composite: $($img.Width) x $($img.Height)"
    $img.Dispose()
}
