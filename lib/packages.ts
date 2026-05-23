import fs from 'fs';
import path from 'path';
import { StudyItem } from '../types';

export function loadPackagesData(groupName?: string): StudyItem[] {
  const packagesDir = path.join(process.cwd(), 'public', 'packages');
  if (!fs.existsSync(packagesDir)) return [];

  const dirs = fs.readdirSync(packagesDir).filter(f =>
    fs.statSync(path.join(packagesDir, f)).isDirectory()
  );

  const allItems: StudyItem[] = [];
  for (const dir of dirs) {
    if (groupName && dir !== groupName) continue;
    const dataPath = path.join(packagesDir, dir, 'data.json');
    if (fs.existsSync(dataPath)) {
      allItems.push(...JSON.parse(fs.readFileSync(dataPath, 'utf-8')));
    }
  }
  return allItems;
}

export function getPackageNames(): string[] {
  const packagesDir = path.join(process.cwd(), 'public', 'packages');
  if (!fs.existsSync(packagesDir)) return [];
  return fs.readdirSync(packagesDir).filter(f =>
    fs.statSync(path.join(packagesDir, f)).isDirectory()
  );
}
