import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StudyItem } from '../types';

/**
 * Resolve the packages directory at runtime.
 *
 * In dev the project root is process.cwd() and packages live under public/packages/.
 * In production the bundled server runs from dist/server.mjs and Vite copies public/
 * into dist/, so packages sit at <server-dir>/packages/.
 *
 * We try, in order:
 *  1. packages/ next to the server executable (via `import.meta.url`).
 *  2. process.cwd()-relative fallbacks for dev and classic hosting.
 */
export function resolvePackagesDir(): string | null {
  const candidates: string[] = [];

  // --- server-relative (works regardless of CWD) ---
  try {
    const serverDir = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(path.join(serverDir, 'packages'));           // production
    candidates.push(path.join(serverDir, '..', 'packages'));     // dev (lib/ is one level deeper)
  } catch {
    /* import.meta.url unavailable (unlikely in Node 18+) */
  }

  // --- process.argv[1]-relative (fallback for bundled CJS/ESM) ---
  try {
    const entryDir = path.dirname(process.argv[1]);
    if (entryDir) {
      candidates.push(path.join(entryDir, 'packages'));
    }
  } catch {
    /* ignore */
  }

  // --- cwd-relative fallbacks ---
  candidates.push(
    path.join(process.cwd(), 'packages'),
    path.join(process.cwd(), 'public', 'packages'),
    path.join(process.cwd(), 'dist', 'packages'),
  );

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

export function loadPackagesData(groupName?: string): StudyItem[] {
  const packagesDir = resolvePackagesDir();
  if (!packagesDir) return [];

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
  const packagesDir = resolvePackagesDir();
  if (!packagesDir) return [];
  return fs.readdirSync(packagesDir).filter(f =>
    fs.statSync(path.join(packagesDir, f)).isDirectory()
  );
}
