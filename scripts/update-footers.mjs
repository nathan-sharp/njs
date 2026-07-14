import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const currentYear = new Date().getFullYear();
const versionHash = (process.env.VERSION_HASH ?? execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
  cwd: repoRoot,
  encoding: 'utf8',
})).trim().slice(0, 7);

function slugifyAuthor(authorName) {
  return authorName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatTimestamp(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 19);
}

function getLastUpdatedMetadata(relativePath) {
  const gitLog = execFileSync('git', ['log', '--format=%H%x09%an%x09%ad%x09%s', '--date=iso-strict', '--', relativePath], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();

  for (const line of gitLog.split(/\r?\n/)) {
    if (!line) {
      continue;
    }

    const [, authorName, commitDate, subject] = line.split('\t');
    if (!authorName || !commitDate || !subject) {
      continue;
    }

    if (authorName === 'github-actions[bot]' || subject.startsWith('chore: refresh footer metadata')) {
      continue;
    }

    return {
      by: slugifyAuthor(authorName),
      when: formatTimestamp(commitDate),
    };
  }

  return {
    by: 'unknown',
    when: formatTimestamp(new Date()),
  };
}

function updateFooter(content, metadata) {
  const footerPattern = /^(\s*)<footer>\r?\n[\s\S]*?©[\s\S]*?\r?\n\1<\/footer>$/m;
  const match = content.match(footerPattern);

  if (!match) {
    return null;
  }

  const indentation = match[1];
  const innerIndentation = indentation + '    ';
  const pIndentation = innerIndentation + '    ';
  const eol = content.includes('\r\n') ? '\r\n' : '\n';

  const updatedFooter = [
    `${indentation}<footer>`,
    `${innerIndentation}<div class="footer-left">`,
    `${pIndentation}<p>©${currentYear} Nathan James Sharp. All Rights Reserved.</p>`,
    `${pIndentation}<p>Page last updated by ${metadata.by} at ${metadata.when}</p>`,
    `${pIndentation}<p>Site version: ${versionHash}</p>`,
    `${innerIndentation}</div>`,
    `${innerIndentation}<div class="footer-right">`,
    `${pIndentation}<a href="/about/">About</a>`,
    `${pIndentation}<a href="/other/privacy/">Privacy Policy</a>`,
    `${innerIndentation}</div>`,
    `${indentation}</footer>`,
  ].join(eol);

  return content.replace(footerPattern, updatedFooter);
}

const trackedHtmlFiles = execFileSync('git', ['ls-files', '*.html'], {
  cwd: repoRoot,
  encoding: 'utf8',
}).trim().split(/\r?\n/).filter(Boolean);

for (const relativePath of trackedHtmlFiles) {
  const absolutePath = path.join(repoRoot, relativePath);
  const originalContent = readFileSync(absolutePath, 'utf8');
  const eol = originalContent.includes('\r\n') ? '\r\n' : '\n';
  const metadata = getLastUpdatedMetadata(relativePath);
  const updatedContent = updateFooter(originalContent, metadata);

  if (updatedContent === null || updatedContent === originalContent) {
    continue;
  }

  writeFileSync(absolutePath, updatedContent.split(/\r?\n/).join(eol));
  console.log(`Updated ${relativePath}`);
}
