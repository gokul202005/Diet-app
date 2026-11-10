Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\GOKUL\Downloads\diet app\client\android\app\src\main\res"

function Create-AgyLogo([int]$size, [bool]$isRound, [bool]$isForegroundOnly) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    if (-not $isForegroundOnly) {
        if ($isRound) {
            # Circular clip
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddEllipse(1, 1, ($size - 2), ($size - 2))
            $g.SetClip($path)
        }

        # Background gradient: Dark Slate 950 to Deep Obsidian
        $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            (New-Object System.Drawing.Point 0, 0),
            (New-Object System.Drawing.Point $size, $size),
            [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
            [System.Drawing.Color]::FromArgb(255, 2, 6, 23)
        )
        $g.FillRectangle($bgBrush, 0, 0, $size, $size)
        $bgBrush.Dispose()

        # Outer glowing emerald ring
        $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 16, 185, 129), [Math]::Max(2, $size * 0.04))
        if ($isRound) {
            $g.DrawEllipse($ringPen, ($size * 0.05), ($size * 0.05), ($size * 0.9), ($size * 0.9))
        } else {
            $rectF = New-Object System.Drawing.RectangleF ($size * 0.04), ($size * 0.04), ($size * 0.92), ($size * 0.92)
            $g.DrawRectangle($ringPen, $rectF.X, $rectF.Y, $rectF.Width, $rectF.Height)
        }
        $ringPen.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Center Flame & Dumbbell Emblem
    $centerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point 0, ($size * 0.2)),
        (New-Object System.Drawing.Point 0, ($size * 0.8)),
        [System.Drawing.Color]::FromArgb(255, 52, 211, 153),
        [System.Drawing.Color]::FromArgb(255, 16, 185, 129)
    )

    # Stylized Flame Shape (Polygon)
    $flamePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cx = $size / 2.0
    $cy = $size * 0.44
    $s = $size * 0.35

    # Dumbbell crossbar
    $barPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 241, 245, 249), [Math]::Max(3, $size * 0.065))
    $barPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $barPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $barY = $size * 0.48
    $g.DrawLine($barPen, ($cx - $s * 0.75), $barY, ($cx + $s * 0.75), $barY)
    $barPen.Dispose()

    # Left & Right Dumbbell Weight Plates
    $plateBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $pw = [Math]::Max(3, $size * 0.07)
    $ph = $size * 0.22
    $g.FillRectangle($plateBrush, ($cx - $s * 0.85), ($barY - $ph / 2), $pw, $ph)
    $g.FillRectangle($plateBrush, ($cx + $s * 0.85 - $pw), ($barY - $ph / 2), $pw, $ph)

    # Inner dumbbell plates
    $innerPlateBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 52, 211, 153))
    $g.FillRectangle($innerPlateBrush, ($cx - $s * 0.65), ($barY - ($ph * 0.75) / 2), $pw, ($ph * 0.75))
    $g.FillRectangle($innerPlateBrush, ($cx + $s * 0.65 - $pw), ($barY - ($ph * 0.75) / 2), $pw, ($ph * 0.75))

    # Center Flame atop the dumbbell
    $flamePoints = @(
        (New-Object System.Drawing.PointF $cx, ($size * 0.16)),
        (New-Object System.Drawing.PointF ($cx + $s * 0.4), ($size * 0.36)),
        (New-Object System.Drawing.PointF ($cx + $s * 0.22), ($size * 0.45)),
        (New-Object System.Drawing.PointF ($cx + $s * 0.45), ($size * 0.48)),
        (New-Object System.Drawing.PointF ($cx + $s * 0.3), ($size * 0.58)),
        (New-Object System.Drawing.PointF $cx, ($size * 0.64)),
        (New-Object System.Drawing.PointF ($cx - $s * 0.3), ($size * 0.58)),
        (New-Object System.Drawing.PointF ($cx - $s * 0.45), ($size * 0.48)),
        (New-Object System.Drawing.PointF ($cx - $s * 0.22), ($size * 0.45)),
        (New-Object System.Drawing.PointF ($cx - $s * 0.4), ($size * 0.36))
    )
    $g.FillPolygon($centerBrush, $flamePoints)

    # Bold AGY typography at the bottom
    $fontSize = [Math]::Max(8, $size * 0.18)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $strFormat = New-Object System.Drawing.StringFormat
    $strFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $strFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textY = $size * 0.78
    $g.DrawString("AGY", $font, $textBrush, (New-Object System.Drawing.PointF $cx, $textY), $strFormat)

    # Clean up
    $font.Dispose()
    $textBrush.Dispose()
    $centerBrush.Dispose()
    $plateBrush.Dispose()
    $innerPlateBrush.Dispose()
    $g.Dispose()

    return $bmp
}

# Icon density mapping (standard Android specifications)
$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($entry in $densities.GetEnumerator()) {
    $folder = Join-Path $baseDir $entry.Key
    $sz = $entry.Value

    # 1. Standard square/adaptive icon
    $icon = Create-AgyLogo $sz $false $false
    $iconPath = Join-Path $folder "ic_launcher.png"
    $icon.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()

    # 2. Round icon
    $roundIcon = Create-AgyLogo $sz $true $false
    $roundPath = Join-Path $folder "ic_launcher_round.png"
    $roundIcon.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $roundIcon.Dispose()

    # 3. Foreground icon
    $fgIcon = Create-AgyLogo $sz $false $true
    $fgPath = Join-Path $folder "ic_launcher_foreground.png"
    $fgIcon.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $fgIcon.Dispose()

    Write-Host "Generated icons for $($entry.Key) ($($sz)x$($sz))"
}

# Generate 512x512 splash screen logo
$splashBmp = Create-AgyLogo 512 $false $false
$splashDest = Join-Path $baseDir "drawable\splash.png"
$splashBmp.Save($splashDest, [System.Drawing.Imaging.ImageFormat]::Png)

# Update all drawable splash screens
$splashDirs = Get-ChildItem -Path $baseDir -Directory -Filter "drawable*"
foreach ($dir in $splashDirs) {
    $targetFile = Join-Path $dir.FullName "splash.png"
    $splashBmp.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
}
$splashBmp.Dispose()

Write-Host "All Android App Icons and Splash Screens successfully updated with AGY FIT logo!"
