import os
import re

d = 'I:/job'
files_to_fix = ['contact.html', 'faq.html', 'terms.html', 'privacy.html']

# Get the header from index.html
with open(os.path.join(d, 'index.html'), 'r', encoding='utf-8') as f:
    idx_content = f.read()

# The header in index.html starts at <!-- Top Bar --> and ends at </header>
start_idx = idx_content.find('<!-- Top Bar -->')
end_idx = idx_content.find('</header>') + len('</header>')
header_html = idx_content[start_idx:end_idx]

for file in files_to_fix:
    path = os.path.join(d, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add <body> tag and header if it's missing
    if '<body' not in content:
        # replace </head> with </head>\n<body>\n + header_html
        content = content.replace('</head>', '</head>\n<body>\n' + header_html)
    elif '<!-- Top Bar -->' not in content:
        # insert after <body>
        content = re.sub(r'(<body[^>]*>)', r'\1\n' + header_html, content, flags=re.IGNORECASE)

    # 2. Update phone numbers
    content = content.replace('0756097718', '0776097758, 0756097718, 0756097728')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed headers and updated phone numbers in the 4 pages.")
