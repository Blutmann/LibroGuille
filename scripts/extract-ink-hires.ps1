Add-Type -AssemblyName System.Drawing

$srcPath = "$env:USERPROFILE\Downloads\Guillermo\Hojas\Hoja 02.jpeg"
$img = [System.Drawing.Image]::FromFile($srcPath)

$scaleX = $img.Width / 796.0
$scaleY = $img.Height / 1024.0

function ExtractInk($rawImg, $minX, $maxX, $minY, $maxY, $outPath) {
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

    $dstBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $srcBmp.Dispose()
    $dstBmp.Dispose()
    Write-Host "Saved ink: $outPath ($cropW x $cropH)"
}

ExtractInk $img 185 335 146 198 "assets\sheet-02\date-1961-07-08-hires.png"
ExtractInk $img 462 748 135 236 "assets\sheet-02\header-el-argentino-1961-hires.png"

$img.Dispose()
