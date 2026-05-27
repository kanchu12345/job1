import os
directory = 'I:/job'
target = 'max-width:500px;height:5px;background:linear-gradient(90deg,transparent,#0d47a1,transparent);'
replacement = 'max-width:150px;height:5px;background:linear-gradient(90deg,transparent,#0d47a1,transparent);'
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
print(f'Updated {count} files for header line.')
