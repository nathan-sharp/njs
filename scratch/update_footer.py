import os
import glob
import re

target_dir = r'c:\Users\User\Downloads\njs\public'
files = glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to insert the Education link between About and Privacy Policy
    # We can match: <a href="/about/">About</a>\s*<a href="/other/privacy/">Privacy Policy</a>
    # and replace with: <a href="/about/">About</a>\n                <a href="/education/">Education</a>\n                <a href="/other/privacy/">Privacy Policy</a>
    
    # We will use regex to find the About link and insert Education right after it, 
    # capturing the indentation so we can preserve it.
    
    pattern = r'(<a href="/about/">About</a>)(\s*)(<a href="/other/privacy/">Privacy Policy</a>)'
    
    def repl(m):
        return m.group(1) + m.group(2) + '<a href="/education/">Education</a>' + m.group(2) + m.group(3)
    
    new_content, count = re.subn(pattern, repl, content)
    
    if count > 0:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
