import os
import re

d = 'I:/job'

with open(os.path.join(d, 'index.html'), 'r', encoding='utf-8') as f:
    idx_content = f.read()

start_idx = idx_content.find('<!-- Top Bar -->')
end_idx = idx_content.find('</header>') + len('</header>')
header_html = idx_content[start_idx:end_idx]

for f in os.listdir(d):
    if f.endswith('.html') and f != 'admin.html' and f != 'index.html':
        path = os.path.join(d, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        changed = False
        
        if 'main-header-new' not in content:
            fa_link = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">'
            if fa_link in content and '</head>' not in content:
                content = content.replace(fa_link, fa_link + '\n</head>\n<body>\n' + header_html)
                changed = True
            elif '</head>' in content and '<body' not in content:
                content = content.replace('</head>', '</head>\n<body>\n' + header_html)
                changed = True
            elif '<body' in content:
                content = re.sub(r'(<body[^>]*>)', r'\1\n' + header_html, content, flags=re.IGNORECASE)
                changed = True

        if changed:
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Fixed {f}")
