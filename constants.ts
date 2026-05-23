import { StudyItem } from './types';

export const slugify = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

export const getAudioFileName = (item: StudyItem, sequence: number): string => {
  const typeLabel = item.type === 'sentence' ? 'Sentence' : item.type === 'phrase' ? 'Phrase' : 'Word';
  const words = item.english
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map(word => slugify(word.replace(/[^a-zA-Z0-9]/g, '')))
    .filter(Boolean);
  const prefix = words.length > 0 ? words.join('-') : slugify(item.english).slice(0, 30);
  return `${item.group}-${typeLabel}${sequence}-${prefix}.mp3`;
};

export const getAudioFileNameCandidates = (item: StudyItem): string[] => {
  const candidates = new Set<string>();
  if (item.audioFileName) candidates.add(item.audioFileName);
  candidates.add(`${slugify(item.english)}.mp3`);
  return Array.from(candidates);
};

export const assignAudioFileNames = (items: StudyItem[]): StudyItem[] => {
  const counts: Record<string, number> = {};
  return items.map(item => {
    if (item.audioFileName) return item;
    const key = `${item.group}:${item.type}`;
    counts[key] = (counts[key] || 0) + 1;
    return {
      ...item,
      audioFileName: getAudioFileName(item, counts[key])
    };
  });
};

export const INTERVALS = [
  60 * 1000,               // Stage 0: 1 minute
  10 * 60 * 1000,          // Stage 1: 10 minutes
  24 * 60 * 60 * 1000,     // Stage 2: 1 day
  3 * 24 * 60 * 60 * 1000, // Stage 3: 3 days
  7 * 24 * 60 * 60 * 1000, // Stage 4: 7 days
  15 * 24 * 60 * 60 * 1000,// Stage 5: 15 days
  30 * 24 * 60 * 60 * 1000 // Stage 6: 30 days
];
