Add-Type -AssemblyName System.Drawing

$srcPath = "$env:USERPROFILE\Downloads\Guillermo\Hojas\Hoja 02.jpeg"
$img = [System.Drawing.Image]::FromFile($srcPath)

$scaleX = $img.Width / 796.0
$scaleY = $img.Height / 1024.0

Write-Host "Source: $($img.Width) x $($img.Height), scale: $scaleX x $scaleY"

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

function CutPolygon($rawImg, $pts, $minX, $maxX, $minY, $maxY, $outPath) {
    $cropX = [int]($minX * $scaleX)
    $cropY = [int]($minY * $scaleY)
    $cropW = [int](($maxX - $minX) * $scaleX)
    $cropH = [int](($maxY - $minY) * $scaleY)

    $bmp = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $ptList = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    foreach ($p in $pts) {
        $px = [float]($p[0] * $scaleX - $cropX)
        $py = [float]($p[1] * $scaleY - $cropY)
        $ptList.Add((New-Object System.Drawing.PointF $px, $py))
    }
    $path.AddPolygon($ptList.ToArray())
    $g.SetClip($path)

    $srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
    $g.DrawImage($rawImg, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Saved $outPath ($cropW x $cropH)"
}

CutPolygon $img $ptsLeft 133 442 198 926 "assets\sheet-02\clipping-nino-dice-1961-hires.png"
CutPolygon $img $ptsRight 453 771 229 1014 "assets\sheet-02\clipping-trinchera-1961-hires.png"

$img.Dispose()
