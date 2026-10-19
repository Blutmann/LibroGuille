Add-Type -AssemblyName System.Drawing

$pRaw = "$env:USERPROFILE\Downloads\IMG_9767.JPEG"
$pHoja = "$env:USERPROFILE\Downloads\Guillermo\Hojas\Hoja 02.jpeg"

$imgRaw = [System.Drawing.Image]::FromFile($pRaw)
$imgHoja = [System.Drawing.Image]::FromFile($pHoja)

Write-Host "Raw: $($imgRaw.Width) x $($imgRaw.Height), DPI: $($imgRaw.HorizontalResolution) x $($imgRaw.VerticalResolution)"
Write-Host "Hoja: $($imgHoja.Width) x $($imgHoja.Height), DPI: $($imgHoja.HorizontalResolution) x $($imgHoja.VerticalResolution)"

$imgRaw.Dispose()
$imgHoja.Dispose()
