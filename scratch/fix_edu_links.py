import os
import glob
import re

target_dir = r'c:\Users\User\Downloads\njs\public'
files = glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace footer links
    new_content = content.replace('<a href="/education/">Education</a>', '<a href="/edu/">Education</a>')
    
    # Replace main index.html link
    new_content = new_content.replace('<a href="./education/">Education</a>', '<a href="./edu/">Education</a>')
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
