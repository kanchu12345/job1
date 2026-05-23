$htmlFiles = Get-ChildItem -Path "i:\job" -Filter *.html

$firebaseScripts = @"
    <!-- Firebase Core SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="firebase-config.js"></script>
    
    <script src="app.js"></script>
"@

$regex1 = '<script src="app.js"></script>'
$regex2 = '<script src="js/app.js"></script>'
$regex3 = '<script src="js/firebase-config.js"></script>\s*<script src="js/app.js"></script>'

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw

    if ($content -match '<script src="https://www.gstatic.com/firebasejs') {
        continue # Already injected
    }

    if ($content -match $regex3) {
        $newContent = $content -replace $regex3, $firebaseScripts
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
    elseif ($content -match $regex2) {
        $newContent = $content -replace $regex2, $firebaseScripts
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
    elseif ($content -match $regex1) {
        $newContent = $content -replace $regex1, $firebaseScripts
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
