import os
import glob
import re

target_dir = r'c:\Users\User\Downloads\njs\public'
files = glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # The link might have spaces around it. We want to remove `<a href="/edu/">Education</a>`
    # and the trailing/leading whitespace cleanly.
    # Let's just remove the exact string `<a href="/edu/">Education</a>` and maybe clean up empty lines later.
    # A simple replace is safest.
    
    new_content = re.sub(r'\s*<a href="/edu/">Education</a>\s*', '\n                    ', content)
    
    if new_content != content:
        # Let's do a more precise replacement so we don't mess up indentation
        pattern = r'([ \t]*)<a href="/edu/">Education</a>\r?\n?'
        new_content2 = re.sub(pattern, '', content)
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content2)
        print(f'Updated {file}')
