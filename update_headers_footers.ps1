$ErrorActionPreference = 'Stop'
$indexContent = Get-Content index.html -Raw

$headerStart = $indexContent.IndexOf('<!-- Top Bar -->')
$headerEnd = $indexContent.IndexOf('</header>') + '</header>'.Length
$headerHTML = $indexContent.Substring($headerStart, $headerEnd - $headerStart)

$footerStart = $indexContent.IndexOf('<!-- Footer -->')
$footerEnd = $indexContent.IndexOf('</footer>') + '</footer>'.Length
$footerHTML = $indexContent.Substring($footerStart, $footerEnd - $footerStart)

$faLink = '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">'

$excludeFiles = @('index.html', 'dashboard.html', 'publisher-dashboard.html', 'admin.html', 'sidebar-component.html')

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    if ($file.Name -in $excludeFiles) { continue }

    $content = Get-Content $file.FullName -Raw

    # Remove existing old headers
    $content = $content -replace '(?s)<!-- Top Bar -->.*?</header>', ''
    $content = $content -replace '(?s)<!-- Top Bar \(Login/Register\) -->.*?</nav>', ''
    $content = $content -replace '(?s)<div class="top-bar">.*?</header>', ''
    $content = $content -replace '(?s)<header.*?</header>', ''
    $content = $content -replace '(?s)<div class="tj-header">.*?</div>\s*</div>', ''
    
    # Remove existing old footers
    $content = $content -replace '(?s)<!-- Footer -->.*?</footer>', ''
    $content = $content -replace '(?s)<footer.*?</footer>', ''

    $content = $content -replace '(?i)(<body[^>]*>)', ("`$1`r`n`r`n" + $headerHTML + "`r`n")
    if ($content -match '(?i)</body>') {
        $content = $content -replace '(?i)(</body>)', ("`r`n" + $footerHTML + "`r`n`$1")
    } else {
        $content = $content -replace '(?i)(</html>)', ("`r`n" + $footerHTML + "`r`n</body>`r`n`$1")
    }

    if (-not $content.Contains('font-awesome')) {
        $content = $content -replace '(?i)(</head>)', ("$faLink`r`n`$1")
    }

    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
    Write-Host "Updated $($file.Name)"
}

Write-Host "Done!"
