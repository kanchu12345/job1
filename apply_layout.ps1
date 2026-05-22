$ErrorActionPreference = 'Stop'
$indexContent = Get-Content index.html -Raw

$headerStart = $indexContent.IndexOf('<!-- Top Bar -->')
$headerEnd = $indexContent.IndexOf('</header>') + '</header>'.Length
$headerHTML = $indexContent.Substring($headerStart, $headerEnd - $headerStart)

$footerStart = $indexContent.IndexOf('<!-- Footer -->')
$footerEnd = $indexContent.IndexOf('</footer>') + '</footer>'.Length
$footerHTML = $indexContent.Substring($footerStart, $footerEnd - $footerStart)

$faLink = '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">'

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    if ($file.Name -in @('index.html', 'submit.html', 'sidebar-component.html')) {
        continue
    }

    $content = Get-Content $file.FullName -Raw

    $content = $content -replace '(?s)<!-- Top Bar -->.*?</header>', ''
    $content = $content -replace '(?s)<div class="top-bar">.*?</header>', ''
    
    $content = $content -replace '(?s)<!-- Footer -->.*?</footer>', ''
    $content = $content -replace '(?s)<footer.*?</footer>', ''

    $content = $content -replace '(?i)(<body[^>]*>)', ("$1

" + $headerHTML + "
")
    $content = $content -replace '(?i)(</body>)', ("
" + $footerHTML + "
$1")

    if (-not $content.Contains('font-awesome')) {
        $content = $content -replace '(?i)(</head>)', ("$faLink
$1")
    }

    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated $($file.Name)"
}
Write-Host "Done!"
