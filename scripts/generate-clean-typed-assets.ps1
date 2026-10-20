Add-Type -AssemblyName System.Drawing

$srcPath = "$env:USERPROFILE\Downloads\Guillermo\Hojas\Hoja 02.jpeg"
$img = [System.Drawing.Image]::FromFile($srcPath)

function ProcessInk($rawImg, $cropX, $cropY, $cropW, $cropH, $outPath, $threshDark = 125, $threshLight = 168) {
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

    $range = [double]($threshLight - $threshDark)

    for ($i = 0; $i -lt $bytesCount; $i += 4) {
        $b = $srcBytes[$i]
        $gVal = $srcBytes[$i + 1]
        $r = $srcBytes[$i + 2]
        $luma = 0.299 * $r + 0.587 * $gVal + 0.114 * $b

        $alpha = 0
        if ($luma -lt $threshDark) {
            $alpha = 255
        } elseif ($luma -lt $threshLight) {
            $alpha = [byte]((1.0 - ($luma - $threshDark) / $range) * 255.0)
        }

        $dstBytes[$i] = $b
        $dstBytes[$i + 1] = $gVal
        $dstBytes[$i + 2] = $r
        $dstBytes[$i + 3] = [byte]$alpha
    }

    [System.Runtime.InteropServices.Marshal]::Copy($dstBytes, 0, $dstData.Scan0, $bytesCount)

    $srcBmp.UnlockBits($srcData)
    $dstBmp.UnlockBits($dstData)

    $dstBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $srcBmp.Dispose()
    $dstBmp.Dispose()
    Write-Host "Generated: $outPath ($cropW x $cropH)"
}

# 1. Date Left "8.7.61" (Box: 1470, 1160, 970, 220)
ProcessInk $img 1470 1160 970 220 "assets\sheet-02\date-1961-07-08-hires.png" 125 165

# 2. Header Right "el argentino" (Box: 3450, 1140, 2270, 330)
ProcessInk $img 3450 1140 2270 330 "assets\sheet-02\header-el-argentino-1961-hires.png" 130 168

# 3. Date Right "26.7.61" (Box: 3940, 1500, 1250, 250)
ProcessInk $img 3940 1500 1250 220 "assets\sheet-02\date-1961-07-26-hires.png" 125 165

# 4. Header Group (Both lines together preserving exact relative placement: 3450, 1140, 2270, 620)
ProcessInk $img 3450 1140 2270 620 "assets\sheet-02\header-el-argentino-group-hires.png" 130 168

# Create optimized standard web versions (scaled cleanly to standard display resolution):
function ResizeBmp($inPath, $outPath, $targetWidth) {
    $src = [System.Drawing.Image]::FromFile($inPath)
    $targetHeight = [int]($src.Height * ($targetWidth / [double]$src.Width))
    $dst = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    $src.Dispose()
    $dst.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
    Write-Host "Generated web: $outPath ($targetWidth x $targetHeight)"
}

ResizeBmp "assets\sheet-02\date-1961-07-08-hires.png" "assets\sheet-02\date-1961-07-08.png" 485
ResizeBmp "assets\sheet-02\header-el-argentino-1961-hires.png" "assets\sheet-02\header-el-argentino-1961.png" 908
ResizeBmp "assets\sheet-02\date-1961-07-26-hires.png" "assets\sheet-02\date-1961-07-26.png" 500
ResizeBmp "assets\sheet-02\header-el-argentino-group-hires.png" "assets\sheet-02\header-el-argentino-group.png" 908

$img.Dispose()
Write-Host "All assets successfully generated."
