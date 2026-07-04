import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const domain = 'https://njs.dev';

let htmlFiles = [];
try {
  htmlFiles = execFileSync('git', ['ls-files', '*.html'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch (e) {
  function scanDir(dir, fileList = []) {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (statSync(filePath).isDirectory()) {
        scanDir(filePath, fileList);
      } else if (file.endsWith('.html')) {
        fileList.push(path.relative(repoRoot, filePath));
      }
    }
    return fileList;
  }
  if (existsSync(path.join(repoRoot, 'public'))) {
    htmlFiles = scanDir(path.join(repoRoot, 'public'));
  }
}

const validFiles = htmlFiles
  .map(f => f.replace(/\\/g, '/'))
  .filter(f => f.startsWith('public/') && !f.endsWith('/404.html') && f !== 'public/404.html');

const urls = validFiles.map(file => {
  let route = file.replace(/^public\//, '');
  if (route === 'index.html') {
    route = '';
  } else if (route.endsWith('/index.html')) {
    route = route.replace(/index\.html$/, '');
  }
  
  const loc = `${domain}/${route}`;
  
  let priority = '0.7';
  let changefreq = 'monthly';
  
  const parts = route.split('/').filter(Boolean);
  
  if (route === '') {
    priority = '1.0';
    changefreq = 'weekly';
  } else if (route === 'applications/' || route === 'projects/') {
    priority = '0.8';
    changefreq = 'weekly';
  } else if (parts.length > 2) {
    priority = '0.6';
  } else if (route === 'other/privacy/') {
    priority = '0.5';
  } else if (route.startsWith('other/') || route.startsWith('media/')) {
    priority = '0.6';
  }
  
  return { loc, changefreq, priority };
});

urls.sort((a, b) => a.loc.localeCompare(b.loc));

const xmlItems = urls.map(u => `    <url>
        <loc>${u.loc}</loc>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
    </url>`).join('\n');

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>
`;

const sitemapPath = path.join(repoRoot, 'public', 'sitemap.xml');
let existingContent = '';
if (existsSync(sitemapPath)) {
  existingContent = readFileSync(sitemapPath, 'utf8');
}

const eol = existingContent.includes('\r\n') ? '\r\n' : '\n';
const formattedNewContent = sitemapContent.split(/\r?\n/).join(eol);

if (existingContent !== formattedNewContent) {
  writeFileSync(sitemapPath, formattedNewContent, 'utf8');
  console.log('Updated public/sitemap.xml');
} else {
  console.log('public/sitemap.xml is already up to date.');
}
