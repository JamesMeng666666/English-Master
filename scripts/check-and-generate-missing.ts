import fs from 'fs';
import path from 'path';
import * as googleTTS from 'google-tts-api';
import { loadPackagesData } from '../lib/packages';
import { assignAudioFileNames, slugify, getAudioFileNameCandidates } from '../constants';

const expandTextForAudio = (text: string): string => {
  let expanded = text;
  expanded = expanded.replace(/\bsth\.?\b/gi, "something");
  expanded = expanded.replace(/\bsb\.?\b/gi, "somebody");
  expanded = expanded.replace(/\betc\.?\b/gi, "et cetera");
  expanded = expanded.replace(/\be\.g\.\b/gi, "for example");
  expanded = expanded.replace(/\bi\.e\.\b/gi, "that is");
  expanded = expanded.replace(/\bvs\.?\b/gi, "versus");
  return expanded;
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function downloadAudio(text: string, filePath: string) {
  try {
    const url = googleTTS.getAudioUrl(text, { lang: 'en', slow: false, host: 'https://translate.google.com' });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
  } catch (error: any) {
    console.error(`Error downloading audio for "${text}":`, error.message);
    throw error;
  }
}

async function main() {
  const items = assignAudioFileNames(loadPackagesData());
  const unique = Array.from(new Map(items.map(i => [i.english, i])).values());

  const missing: { item: typeof unique[number]; expected: string }[] = [];

  // Pre-load file lists per group for efficient lookup
  const groupFiles: Record<string, string[]> = {};
  const getFilesForGroup = (group: string): string[] => {
    if (!groupFiles[group]) {
      const dir = path.join(process.cwd(), 'public', 'packages', group, 'audio');
      groupFiles[group] = fs.existsSync(dir) ? fs.readdirSync(dir).map(f => f.toLowerCase()) : [];
    }
    return groupFiles[group];
  };

  for (const item of unique) {
    const expected = item.audioFileName || `${slugify(item.english)}.mp3`;
    const files = getFilesForGroup(item.group);
    const candidates = getAudioFileNameCandidates(item).map(c => c.toLowerCase());
    const exists = candidates.some(c => files.includes(c)) || files.some(f => f.includes(slugify(item.english).slice(0, 12)) && f.endsWith('.mp3'));
    if (!exists) {
      missing.push({ item, expected });
    }
  }

  if (missing.length === 0) {
    console.log('No missing audio files found.');
    return;
  }

  console.log(`Found ${missing.length} missing audio files. Generating...`);

  for (let i = 0; i < missing.length; i++) {
    const { item, expected } = missing[i];
    const outDir = path.join(process.cwd(), 'public', 'packages', item.group, 'audio');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    console.log(`[${i + 1}/${missing.length}] Generating:`, expected, '->', item.english);
    const expanded = expandTextForAudio(item.english);
    const tempPath = path.join(outDir, expected.replace(/\.mp3$/, '.temp.mp3'));
    const filePath = path.join(outDir, expected);

    try {
      await downloadAudio(expanded, tempPath);
      if (fs.existsSync(tempPath)) {
        try {
          const { execSync } = await import('child_process');
          execSync(`ffmpeg -i "${tempPath}" -ar 44100 -ac 2 -ab 128k -f mp3 -y "${filePath}"`);
          fs.unlinkSync(tempPath);
          console.log('  -> Generated', expected);
        } catch (err: any) {
          console.error('  FFmpeg error:', err.message);
          fs.renameSync(tempPath, filePath);
          console.log('  -> Saved raw download as', expected);
        }
      }
    } catch (err) {
      console.error('  Failed to generate for', expected);
    }

    // small delay to avoid rate limiting
    await delay(400);
  }

  console.log('Generation pass finished.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
