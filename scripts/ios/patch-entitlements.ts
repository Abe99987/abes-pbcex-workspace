#!/usr/bin/env ts-node
import { promises as fs } from 'fs';
import path from 'path';

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const iosEntitlements = path.join(
    repoRoot,
    'ios',
    'App',
    'App',
    'App.entitlements'
  );

  const iosDir = path.join(repoRoot, 'ios');
  const hasIos = await fileExists(iosDir);
  if (!hasIos) {
    console.log('[dry-run] ios/ not found. Would patch entitlements at:', iosEntitlements);
    return;
  }

  const exists = await fileExists(iosEntitlements);
  if (!exists) {
    console.log('Entitlements file not found at', iosEntitlements);
    return;
  }

  const raw = await fs.readFile(iosEntitlements, 'utf8');

  // Minimal, naive XML manipulation: insert Associated Domains entries if missing
  const applinks = ['applinks:pbcex.com', 'applinks:www.pbcex.com'];

  let updated = raw;
  const hasKey = raw.includes('<key>com.apple.developer.associated-domains</key>');
  if (!hasKey) {
    const insertPoint = raw.lastIndexOf('</dict>');
    if (insertPoint === -1) {
      console.error('Invalid entitlements plist format');
      return;
    }
    const payload = `\n\t<key>com.apple.developer.associated-domains</key>\n\t<array>\n\t\t<string>${applinks[0]}</string>\n\t\t<string>${applinks[1]}</string>\n\t</array>\n`;
    updated = raw.slice(0, insertPoint) + payload + raw.slice(insertPoint);
  } else {
    // Ensure both entries are present
    for (const link of applinks) {
      if (!updated.includes(link)) {
        updated = updated.replace(
          /<key>com\.apple\.developer\.associated-domains<\/key>\s*<array>/,
          match => `${match}\n\t\t<string>${link}</string>`
        );
      }
    }
  }

  if (updated !== raw) {
    await fs.writeFile(iosEntitlements, updated, 'utf8');
    console.log('Entitlements updated.');
  } else {
    console.log('Entitlements already up to date.');
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});


