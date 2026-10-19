Add-Type -AssemblyName System.Drawing

$srcPath = "$env:USERPROFILE\Downloads\Guillermo\Hojas\Hoja 02.jpeg"
$img = [System.Drawing.Image]::FromFile($srcPath)

$scaleX = $img.Width / 796.0
$scaleY = $img.Height / 1024.0

Write-Host "Generating Sheet 02 assets from: $($img.Width) x $($img.Height)"

# 1. Poly Left
$ptsLeft = @(
  @(135.0, 203.0), @(175.0, 202.8), @(225.0, 202.2), @(280.0, 201.8), @(335.0, 201.2), @(390.0, 200.8), @(434.0, 200.2),
  @(435.5, 202.0), @(435.2, 260.0), @(435.0, 340.0), @(435.5, 420.0), @(436.2, 500.0), @(437.0, 580.0), @(437.8, 660.0),
  @(438.5, 740.0), @(439.0, 820.0), @(439.5, 870.0), @(440.0, 922.0), @(438.5, 923.8), @(390.0, 923.5), @(330.0, 923.2),
  @(270.0, 923.0), @(210.0, 922.8), @(165.0, 922.5), @(141.0, 922.2), @(139.5, 920.5), @(139.8, 850.0), @(139.0, 760.0),
  @(138.2, 680.0), @(137.5, 600.0), @(136.8, 520.0), @(136.0, 440.0), @(135.5, 360.0), @(135.0, 280.0), @(134.8, 205.0)
)

# 2. Poly Right
$ptsRight = @(
  @(456.0, 231.0), @(495.0, 233.0), @(550.0, 235.5), @(610.0, 238.0), @(670.0, 240.5), @(725.0, 242.5), @(768.0, 244.5),
  @(769.0, 246.5), @(768.2, 310.0), @(767.5, 390.0), @(766.8, 470.0), @(765.5, 550.0), @(764.0, 630.0), @(762.5, 710.0),
  @(760.5, 790.0), @(758.5, 870.0), @(756.2, 940.0), @(755.0, 990.0), @(754.5, 1010.5), @(752.5, 1012.0), @(710.0, 1011.8),
  @(650.0, 1011.5), @(590.0, 1011.2), @(530.0, 1011.0), @(480.0, 1010.8), @(456.0, 1010.5), @(454.5, 1009.0), @(454.8, 950.0),
  @(455.0, 860.0), @(455.2, 770.0), @(455.0, 680.0), @(455.2, 600.0), @(455.5, 520.0), @(455.8, 440.0), @(455.5, 360.0),
  @(455.8, 280.0), @(455.8, 233.0)
)

function CutPolygonWithTargetSize($rawImg, $pts, $minX, $maxX, $minY, $maxY, $outPath, $targetWidth = 0) {
    $cropX = [int]($minX * $scaleX)
    $cropY = [int]($minY * $scaleY)
    $cropW = [int](($maxX - $minX) * $scaleX)
    $cropH = [int](($maxY - $minY) * $scaleY)

    # Full res cut first
    $bmpFull = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFull = [System.Drawing.Graphics]::FromImage($bmpFull)
    $gFull.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFull.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFull.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $ptList = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    foreach ($p in $pts) {
        $px = [float]($p[0] * $scaleX - $cropX)
        $py = [float]($p[1] * $scaleY - $cropY)
        $ptList.Add((New-Object System.Drawing.PointF $px, $py))
    }
    $path.AddPolygon($ptList.ToArray())
    $gFull.SetClip($path)

    $srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
    $gFull.DrawImage($rawImg, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    if ($targetWidth -gt 0 -and $targetWidth -lt $cropW) {
        $outH = [int]($cropH * ($targetWidth / [double]$cropW))
        $bmpResized = New-Object System.Drawing.Bitmap $targetWidth, $outH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gResized = [System.Drawing.Graphics]::FromImage($bmpResized)
        $gResized.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gResized.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gResized.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gResized.DrawImage($bmpFull, 0, 0, $targetWidth, $outH)
        $bmpResized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $gResized.Dispose()
        $bmpResized.Dispose()
        Write-Host "Saved resized: $outPath ($targetWidth x $outH)"
    } else {
        $bmpFull.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved full-res: $outPath ($cropW x $cropH)"
    }

    $gFull.Dispose()
    $bmpFull.Dispose()
}

# 1. Recortes: versión master full-res (para primer plano e inspección detallada)
CutPolygonWithTargetSize $img $ptsLeft 133 442 198 926 "assets\sheet-02\clipping-nino-dice-1961-hires.png" 0
CutPolygonWithTargetSize $img $ptsRight 453 771 229 1014 "assets\sheet-02\clipping-trinchera-1961-hires.png" 0

# 2. Recortes: versión optimizada para página (720px ancho, nitidez 2.4x superior a la anterior)
CutPolygonWithTargetSize $img $ptsLeft 133 442 198 926 "assets\sheet-02\clipping-nino-dice-1961.png" 720
CutPolygonWithTargetSize $img $ptsRight 453 771 229 1014 "assets\sheet-02\clipping-trinchera-1961.png" 740

function ExtractInkScaled($rawImg, $minX, $maxX, $minY, $maxY, $outPath, $targetW = 0) {
    $cropX = [int]($minX * $scaleX)
    $cropY = [int]($minY * $scaleY)
    $cropW = [int](($maxX - $minX) * $scaleX)
    $cropH = [int](($maxY - $minY) * $scaleY)

    $srcBmp = New-Object System.Drawing.Bitmap $cropW, $cropH
    $g = [System.Drawing.Graphics]::FromImage($srcBmp)
    $g.DrawImage($rawImg, 0, 0, (New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $dstBmp = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    $rect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
    $srcData = $srcBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $dstData = $dstBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    $bytesCount = [Math]::Abs($srcData.Stride) * $cropH
    $srcBytes = New-Object byte[] $bytesCount
    $dstBytes = New-Object byte[] $bytesCount

    [System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $bytesCount)

    for ($i = 0; $i -lt $bytesCount; $i += 4) {
        $b = $srcBytes[$i]
        $gVal = $srcBytes[$i + 1]
        $r = $srcBytes[$i + 2]
        $luma = 0.299 * $r + 0.587 * $gVal + 0.114 * $b

        $alpha = 0
        if ($luma -lt 125) {
            $alpha = 255
        } elseif ($luma -lt 165) {
            $alpha = [byte]((1.0 - ($luma - 125.0) / 40.0) * 255.0)
        }

        $dstBytes[$i] = $b
        $dstBytes[$i + 1] = $gVal
        $dstBytes[$i + 2] = $r
        $dstBytes[$i + 3] = [byte]$alpha
    }

    [System.Runtime.InteropServices.Marshal]::Copy($dstBytes, 0, $dstData.Scan0, $bytesCount)

    $srcBmp.UnlockBits($srcData)
    $dstBmp.UnlockBits($dstData)

    if ($targetW -gt 0 -and $targetW -lt $cropW) {
        $outH = [int]($cropH * ($targetW / [double]$cropW))
        $bmpResized = New-Object System.Drawing.Bitmap $targetW, $outH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gR = [System.Drawing.Graphics]::FromImage($bmpResized)
        $gR.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gR.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gR.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gR.DrawImage($dstBmp, 0, 0, $targetW, $outH)
        $bmpResized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $gR.Dispose()
        $bmpResized.Dispose()
        Write-Host "Saved ink resized: $outPath ($targetW x $outH)"
    } else {
        $dstBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved ink full: $outPath ($cropW x $cropH)"
    }

    $srcBmp.Dispose()
    $dstBmp.Dispose()
}

# 3. Fechas y encabezados
ExtractInkScaled $img 185 335 146 198 "assets\sheet-02\date-1961-07-08.png" 480
ExtractInkScaled $img 462 748 135 236 "assets\sheet-02\header-el-argentino-1961.png" 680

$img.Dispose()
Write-Host "All assets generated successfully!"
