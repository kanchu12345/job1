import os
directory = 'I:/job'
target = '&copy; 2026 HelaInvest. All rights reserved.'
replacement = '&copy; 2026 HelaInvest. Powered by <a href="https://www.edirisinghe.business" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">Edirisinghe Business Consulting</a>. All rights reserved.'
count = 0
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if target in content:
                content = content.replace(target, replacement)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
print(f'Updated {count} files.')
