import fs from 'fs';
import * as googleTTS from 'google-tts-api';

async function test() {
    const url = googleTTS.getAudioUrl('Hello, this is a test.', { lang: 'en', slow: false, host: 'https://translate.google.com' });
    console.log('Downloading from:', url);
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Failed to download:', response.status);
        return;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync('test_generated.mp3', buffer);
    console.log('Saved test_generated.mp3, size:', buffer.length);
}

test().catch(console.error);
