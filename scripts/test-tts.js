import * as googleTTS from 'google-tts-api';
async function test() {
  const url = googleTTS.getAudioUrl('Hello', { lang: 'en', slow: false, host: 'https://translate.google.com' });
  console.log(url);
  const res = await fetch(url);
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get('content-type'));
  const b = Buffer.from(await res.arrayBuffer());
  console.log("Header bits:", b.slice(0, 10).toString('hex'));
}
test();
