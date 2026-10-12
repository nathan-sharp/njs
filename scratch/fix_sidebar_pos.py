import os
import glob
import re

target_dir = r'c:\Users\User\Downloads\njs\public\edu\L6'
files = glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to extract <aside class="sidebar-nav">...</aside>
    # and place it before <header>
    
    # Also remove class="sidebar-layout" from <main>
    content = content.replace('<main class="sidebar-layout">', '<main>')
    
    # Extract aside
    aside_pattern = re.compile(r'(\s*<!-- Sidebar Menu -->\s*<aside class="sidebar-nav">.*?</aside>)', re.DOTALL)
    match = aside_pattern.search(content)
    if match:
        aside_str = match.group(1)
        # Remove aside from original location
        content = content.replace(aside_str, '')
        
        # Insert before <header>
        content = content.replace('<header>', aside_str + '\n            <header>')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file}')
