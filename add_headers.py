import os
import re

d = 'I:/job'

# Get header from index.html
with open(os.path.join(d, 'index.html'), 'r', encoding='utf-8') as f:
    idx_content = f.read()

start_idx = idx_content.find('<!-- Top Bar -->')
end_idx = idx_content.find('</header>') + len('</header>')
header_html = idx_content[start_idx:end_idx]

for f in os.listdir(d):
    if f.endswith('.html') and f != 'admin.html':
        path = os.path.join(d, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Check if the header is already there
        if 'main-header-new' not in content:
            # Check if there's a body tag
            if '<body' in content:
                # Insert right after body tag
                content = re.sub(r'(<body[^>]*>)', r'\1\n' + header_html, content, flags=re.IGNORECASE)
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f"Added header to {f}")
            else:
                print(f"Skipping {f} (no body tag)")
