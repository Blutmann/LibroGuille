Add-Type -AssemblyName System.Drawing

$p1 = "$env:USERPROFILE\Downloads\IMG_9765.JPEG"
$p2 = "$env:USERPROFILE\Downloads\IMG_9767.JPEG"

function MakePreview($src, $dst) {
    $img = [System.Drawing.Image]::FromFile($src)
    $ratio = 800.0 / [Math]::Max($img.Width, $img.Height)
    $newW = [int]($img.Width * $ratio)
    $newH = [int]($img.Height * $ratio)
    $bmp = New-Object System.Drawing.Bitmap $newW, $newH
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $newW, $newH)
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Created preview: $dst ($newW x $newH)"
}

MakePreview $p1 "preview-9765.jpg"
MakePreview $p2 "preview-9767.jpg"
