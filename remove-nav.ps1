$htmlFiles = Get-ChildItem -Path "i:\job" -Filter *.html

$replaceStr = @"
            <!-- Center Spacer -->
            <div style="flex: 1; display: flex; justify-content: center; align-items: center; padding: 0 30px;">
                <div style="width: 100%; max-width: 500px; height: 5px; background: linear-gradient(90deg, transparent, #0d47a1, transparent); border-radius: 4px; opacity: 0.5;"></div>
            </div>
"@

$regex = '<!-- Main Navigation -->[\s\S]*?</nav>'

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match $regex) {
        $newContent = $content -replace $regex, $replaceStr
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
