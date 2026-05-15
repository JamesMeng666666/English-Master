import fs from 'fs';
import path from 'path';
import * as googleTTS from 'google-tts-api';
import { DEFAULT_STUDY_DATA, slugify } from '../constants';

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
  }
}

async function main() {
  const outDir = path.join(process.cwd(), 'public', 'audio');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filteredData = DEFAULT_STUDY_DATA.filter(i => i.type === "phrase");
  const uniquePhrases = Array.from(new Set(filteredData.map(i => i.english)));

  console.log(`Starting generation of ${uniquePhrases.length} audio files...`);

  for (let i = 0; i < uniquePhrases.length; i++) {
    const phrase = uniquePhrases[i];
    console.log(`Processing ${i + 1}/${uniquePhrases.length}: ${phrase}`);
    
    const expanded = expandTextForAudio(phrase);
    const slug = slugify(phrase);
    const filePath = path.join(outDir, `${slug}.mp3`);

    if (fs.existsSync(filePath)) {
      continue; // Skip if already exists
    }

    await downloadAudio(expanded, filePath);
    // Sleep a bit to avoid rate limits
    await delay(500); 
  }

  console.log("Audio generation complete!");
}

main().catch(console.error);
