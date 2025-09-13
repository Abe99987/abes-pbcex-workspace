#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'content', 'legal');
const publicDir = path.join(rootDir, 'public', 'legal');
const publicDataDir = path.join(rootDir, 'public', 'data');

/**
 * Convert slug like "terms-of-service" to "Terms Of Service".
 */
function inferTitleFromSlug(slug) {
  return slug
    .split('-')
    .map(s => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

/**
 * Very small frontmatter extractor for keys: title, lastUpdated.
 * Expects optional leading block:
 * ---\n
 * key: value\n
 * ---\n
 */
function extractFrontmatter(content) {
  const fm = { title: undefined, lastUpdated: undefined };
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3);
    if (end !== -1) {
      const block = content.slice(3, end).trim();
      for (const line of block.split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (key === 'title') fm.title = value.replace(/^"|"$/g, '');
        if (key === 'lastUpdated') fm.lastUpdated = value.replace(/^"|"$/g, '');
      }
    }
  }
  return fm;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  ensureDir(contentDir);
  ensureDir(publicDir);
  ensureDir(publicDataDir);

  const entries = fs
    .readdirSync(contentDir)
    .filter(f => f.toLowerCase().endsWith('.md'))
    .sort();

  const manifest = [];

  for (const file of entries) {
    const srcPath = path.join(contentDir, file);
    const slug = file.replace(/\.md$/i, '');
    const dstPath = path.join(publicDir, `${slug}.md`);

    let data = fs.readFileSync(srcPath, 'utf8');
    if (!data.endsWith('\n')) data += '\n';

    // Extract optional frontmatter
    const { title, lastUpdated } = extractFrontmatter(data);
    const inferredTitle = title || inferTitleFromSlug(slug);

    fs.writeFileSync(dstPath, data, 'utf8');

    manifest.push({ slug, title: inferredTitle, lastUpdated: lastUpdated || null });
  }

  const manifestJson = JSON.stringify(manifest, null, 2) + '\n';
  const manifestPath = path.join(publicDir, 'manifest.json');
  fs.writeFileSync(manifestPath, manifestJson, 'utf8');

  // Duplicate manifest to public/data for hosts that route /legal/* to index.html
  const manifestDataPath = path.join(publicDataDir, 'legal-manifest.json');
  fs.writeFileSync(manifestDataPath, manifestJson, 'utf8');

  console.log(
    `Wrote ${entries.length} legal files to public/legal and manifest.json; duplicated manifest to public/data/legal-manifest.json`
  );
}

main();