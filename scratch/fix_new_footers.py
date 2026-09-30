import os
import glob
import datetime

target_dir = r'c:\Users\User\Downloads\njs\public\edu'
files = glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True)

# We want to replace:
#                 <div class="footer-left">
#                     <p>©2026 Nathan James Sharp. All Rights Reserved.</p>
#                 </div>

replacement = """                <div class="footer-left">
                    <p>©2026 Nathan James Sharp. All Rights Reserved.</p>
                    <p>Page last updated by nathan-sharp at 2026-09-30T20:59:15</p>
                    <p>Site version: 80fbb0d</p>
                </div>"""

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # using string replacement
    # find the block exactly or build a regex
    import re
    pattern = re.compile(r'<div class="footer-left">\s*<p>©2026 Nathan James Sharp\. All Rights Reserved\.</p>\s*</div>')
    
    new_content, count = pattern.subn(replacement, content)
    
    if count > 0:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
