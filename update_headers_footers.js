const fs = require('fs');
const path = require('path');

const dir = '.';

// 1. Read index.html to extract Header and Footer
const indexContent = fs.readFileSync('index.html', 'utf-8');

// Extract Header (from top-bar-new to end of main-header-new)
const headerStart = indexContent.indexOf('<!-- Top Bar -->');
const headerEnd = indexContent.indexOf('</header>') + '</header>'.length;
const headerHTML = indexContent.substring(headerStart, headerEnd);

// Extract Footer
const footerStart = indexContent.indexOf('<!-- Footer -->');
const footerEnd = indexContent.indexOf('</footer>') + '</footer>'.length;
const footerHTML = indexContent.substring(footerStart, footerEnd);

// 2. Define the exact list of public pages to update
const publicPages = [
    'contact.html',
    'listings.html',
    'faq.html',
    'terms.html',
    'privacy.html'
];

for (const file of publicPages) {
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf-8');

    // Remove existing old headers
    content = content.replace(/<!-- Top Bar -->[\s\S]*?<\/header>/g, '');
    content = content.replace(/<!-- Top Bar \(Login\/Register\) -->[\s\S]*?<\/nav>/g, '');
    content = content.replace(/<div class="top-bar">[\s\S]*?<\/header>/g, '');
    content = content.replace(/<header[\s\S]*?<\/header>/g, ''); // catch-all for headers
    
    // Remove existing old footers
    content = content.replace(/<!-- Footer -->[\s\S]*?<\/footer>/g, '');
    content = content.replace(/<footer[\s\S]*?<\/footer>/g, '');

    // Clean up empty lines where headers were removed (optional but good for clean HTML)
    
    // Insert Header right after <body ...>
    content = content.replace(/(<body[^>]*>)/i, "$1\n\n    " + headerHTML + "\n");
    
    // Insert Footer right before </body>
    content = content.replace(/(<\/body>)/i, "\n    " + footerHTML + "\n$1");

    // Add FontAwesome if missing (needed for header/footer icons)
    if (!content.includes('font-awesome')) {
        content = content.replace('</head>', '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n</head>');
    }

    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
}

console.log('Done!');
