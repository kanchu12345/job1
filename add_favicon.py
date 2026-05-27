import os
import glob

favicon_link = '    <link rel="icon" type="image/svg+xml" href="favicon.svg">\n'

for filepath in glob.glob("*.html"):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "favicon.svg" in content:
        continue
        
    if "</head>" in content:
        content = content.replace("</head>", f"{favicon_link}</head>")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added favicon to {filepath}")
