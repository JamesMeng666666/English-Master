const fs = require('fs');
const files = fs.readdirSync('./public/audio').filter(f => f.endsWith('.mp3')).slice(0, 5);
for (const file of files) {
  const p = `./public/audio/${file}`;
  const buffer = fs.readFileSync(p);
  console.log(`${file}: ${buffer.length} bytes, starts with: ${buffer.slice(0, 10).toString('hex')}`);
}
