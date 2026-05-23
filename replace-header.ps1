$htmlFiles = Get-ChildItem -Path "i:\job" -Filter *.html

$replaceStr = @"
            <!-- Main Navigation -->
            <nav class="header-nav-new" style="display: flex; align-items: center; gap: 30px;">
                <a href="index.html" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Home</a>
                <a href="listings.html" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Browse Businesses</a>
                <a href="submit.html" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Sell & Raise Capital</a>
                <a href="#" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Advisory Services</a>
                <a href="contact.html" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Contact Us</a>
            </nav>
"@

$regex = '<!-- Scrolling Text -->[\s\S]*?<marquee[\s\S]*?</marquee>\s*</div>'

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match $regex) {
        $newContent = $content -replace $regex, $replaceStr
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
