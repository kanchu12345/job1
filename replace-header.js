const fs = require('fs');
const path = require('path');

const dir = 'i:\\job';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const oldHeaderRegex = /<!-- Scrolling Text -->[\s\S]*?<\/div>[\s\S]*?<\/div>/; // Wait, this regex might be too greedy.

// Let's use a more precise string replacement.
const searchStr = `            <!-- Scrolling Text -->
            <div class="header-scroller" style="display: flex; align-items: center;">
                <div style="font-weight: 800; color: var(--primary-color); padding-right: 15px; margin-right: 15px; border-right: 2px solid var(--border-color); font-size: 0.95rem; text-transform: uppercase;">Our Services</div>
                <marquee behavior="scroll" direction="left" scrollamount="4" class="header-scroller-inner" style="display: block; flex: 1;">
                    <span>• Business Registration</span>
                    <span>• Company Secretarial services</span>
                    <span>• Accounting &amp; Bookkeeping</span>
                    <span>• Business Valuation</span>
                    <span>• Financial Due Diligence</span>
                    <span>• Business plans</span>
                    <span>• Business Proposals</span>
                    <span>• Tax advisory</span>
                    <span>• Other Business Advisory service</span>
                </marquee>
            </div>`;

const replaceStr = `            <!-- Main Navigation -->
            <nav class="header-nav-new" style="display: flex; align-items: center; gap: 30px;">
                <a href="index.html" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Home</a>
                <a href="index.html" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Browse Businesses</a>
                <a href="submit.html" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Sell & Raise Capital</a>
                <a href="#" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Advisory Services</a>
                <a href="#" style="font-weight: 600; color: #475569; text-decoration: none; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#0d47a1'" onmouseout="this.style.color='#475569'">Contact Us</a>
            </nav>`;

let changed = 0;
for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Normalize line endings for replacement
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedSearchStr = searchStr.replace(/\r\n/g, '\n');
    const normalizedReplaceStr = replaceStr.replace(/\r\n/g, '\n');

    if (normalizedContent.includes(normalizedSearchStr)) {
        const newContent = normalizedContent.replace(normalizedSearchStr, normalizedReplaceStr);
        fs.writeFileSync(filePath, newContent, 'utf8');
        changed++;
        console.log(`Updated ${file}`);
    } else {
        // Try to regex match if exact string fails due to whitespace
        const regex = /<!-- Scrolling Text -->[\s\S]*?<marquee[\s\S]*?<\/marquee>\s*<\/div>/;
        if(regex.test(normalizedContent)) {
            const newContent = normalizedContent.replace(regex, normalizedReplaceStr);
            fs.writeFileSync(filePath, newContent, 'utf8');
            changed++;
            console.log(`Updated ${file} via regex`);
        }
    }
}
console.log(`Total files updated: ${changed}`);
