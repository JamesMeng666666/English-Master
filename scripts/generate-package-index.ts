import fs from 'fs';
import path from 'path';

const packagesDir = path.join(process.cwd(), 'public', 'packages');

if (fs.existsSync(packagesDir)) {
  const dirs = fs.readdirSync(packagesDir).filter(f => fs.statSync(path.join(packagesDir, f)).isDirectory());
  fs.writeFileSync(path.join(packagesDir, 'index.json'), JSON.stringify(dirs, null, 2));
  console.log(`Generated packages index.json with ${dirs.length} packages:`, dirs);
}
