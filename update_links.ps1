Get-ChildItem -Filter *.html -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    if ($content -match '<a href="#">Terms of Service</a>') {
        $content = $content -replace '<a href="#">Terms of Service</a>', '<a href="terms.html">Terms of Service</a>'
        $modified = $true
    }
    if ($content -match '<a href="#">Privacy Policy</a>') {
        $content = $content -replace '<a href="#">Privacy Policy</a>', '<a href="privacy.html">Privacy Policy</a>'
        $modified = $true
    }
    if ($content -match '<a href="#">Help & Support</a>') {
        $content = $content -replace '<a href="#">Help & Support</a>', '<a href="faq.html">Help & Support</a>'
        $modified = $true
    }
    if ($modified) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Updated $($_.Name)"
    }
}
