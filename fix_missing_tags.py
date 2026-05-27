import os
import re

d = 'I:/job'
files_to_fix = ['contact.html', 'faq.html', 'terms.html', 'privacy.html']

with open(os.path.join(d, 'index.html'), 'r', encoding='utf-8') as f:
    idx_content = f.read()

start_idx = idx_content.find('<!-- Top Bar -->')
end_idx = idx_content.find('</header>') + len('</header>')
header_html = idx_content[start_idx:end_idx]

for file in files_to_fix:
    path = os.path.join(d, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. ensure </head> and <body> exist
    if '</head>' not in content:
        # replace the font-awesome link with itself + </head>\n<body>\n
        fa_link = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">'
        if fa_link in content:
            content = content.replace(fa_link, fa_link + '\n</head>\n<body>\n' + header_html)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Headers added.")
