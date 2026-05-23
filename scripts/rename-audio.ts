import fs from 'fs';
import path from 'path';
import { loadPackagesData } from '../lib/packages';
import { assignAudioFileNames, slugify } from '../constants';

async function main() {
  const items = assignAudioFileNames(loadPackagesData());

  for (const item of items) {
    const outDir = path.join(process.cwd(), 'public', 'packages', item.group, 'audio');
    if (!fs.existsSync(outDir)) {
      console.log('[missing-dir]', outDir);
      continue;
    }

    const newName = item.audioFileName || `${slugify(item.english)}.mp3`;
    const slugName = `${slugify(item.english)}.mp3`;
    const newPath = path.join(outDir, newName);
    const slugPath = path.join(outDir, slugName);

    if (fs.existsSync(newPath)) {
      console.log('[skip] already named ->', newName);
      continue;
    }

    if (fs.existsSync(slugPath)) {
      fs.renameSync(slugPath, newPath);
      console.log('[rename]', slugName, '->', newName);
      continue;
    }

    // try to find a matching file by partial slug (to cover long filenames truncated)
    const files = fs.readdirSync(outDir);
    const partial = slugify(item.english).slice(0, 12);
    const matches = files.filter(f => f.toLowerCase().includes(partial) && f.toLowerCase().endsWith('.mp3'));
    if (matches.length === 1) {
      const src = path.join(outDir, matches[0]);
      fs.renameSync(src, newPath);
      console.log('[rename-match]', matches[0], '->', newName);
      continue;
    }

    console.log('[missing] no source for', newName, `(expected ${slugName})`);
  }

  console.log('Rename pass finished. Review log above for details.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
