Add-Type -AssemblyName System.Drawing

$srcPath = "$env:USERPROFILE\Downloads\Guillermo\Hojas\Hoja 02.jpeg"
$img = [System.Drawing.Image]::FromFile($srcPath)

# 796x1024 coords for "Trinchera del asombro" title area: x around 450-750, y around 210-300
$scaleX = $img.Width / 796.0
$scaleY = $img.Height / 1024.0

Write-Host "Scale: $scaleX x $scaleY"

$cropX = [int](440 * $scaleX)
$cropY = [int](210 * $scaleY)
$cropW = [int](280 * $scaleX)
$cropH = [int](100 * $scaleY)

$bmp = New-Object System.Drawing.Bitmap $cropW, $cropH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
$dstRect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
$g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save("sample-trinchera-hires.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Saved sample-trinchera-hires.png ($cropW x $cropH)"
