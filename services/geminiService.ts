import { StudyItem } from "../types";
import { slugify } from "../constants";

export const parseContentWithGemini = async (rawText: string, apiKey: string): Promise<StudyItem[]> => {
  const response = await fetch('/api/generate-cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rawText })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate cards');
  }

  return response.json();
};

export const expandTextForAudio = (text: string): string => {
  let expanded = text;
  expanded = expanded.replace(/\bsth\b/gi, "something");
  expanded = expanded.replace(/\bsb\b/gi, "somebody");
  expanded = expanded.replace(/\betc\.?\b/gi, "et cetera");
  expanded = expanded.replace(/\be\.g\.\b/gi, "for example");
  expanded = expanded.replace(/\bi\.e\.\b/gi, "that is");
  expanded = expanded.replace(/\bvs\.?\b/gi, "versus");
  return expanded;
};

export const preloadAudio = async (item: StudyItem) => {
  if (item.audioBase64) return;
  // Pre-fetch missing audio dynamically in background
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: item.english })
    });
    if (res.ok) {
      const { audioBase64 } = await res.json();
      item.audioBase64 = audioBase64;
    }
  } catch (err) {
    // Ignore, fallback to TTS when played
  }
};

let audioCtx: window.AudioContext | null = null;

const playPcmBase64 = async (base64: string) => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!audioCtx) {
    audioCtx = new AudioContextClass({ sampleRate: 24000 });
  }
  
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const sampleRate = 24000;
  
  // Create 16-bit PCM ArrayBuffer
  const int16Array = new Int16Array(bytes.buffer);
  
  const audioBuffer = audioCtx.createBuffer(numChannels, int16Array.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();
};

export const playAudio = async (item: StudyItem | string): Promise<void> => {
  // Mobile Safari requires AudioContext activation within immediate user interaction.
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!audioCtx && AudioContextClass) {
    audioCtx = new AudioContextClass({ sampleRate: 24000 });
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const text = typeof item === 'string' ? item : item.english;
  let base64 = typeof item === 'string' ? undefined : item.audioBase64;
  
  if (!base64) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        base64 = data.audioBase64;
        if (typeof item !== 'string') {
          item.audioBase64 = base64; // Cache it
        }
      }
    } catch (err) {
      console.warn("Dynamic TTS fetch failed", err);
    }
  }

  if (base64) {
    try {
      await playPcmBase64(base64);
      return;
    } catch (e) {
      console.warn("Failed to play PCM", e);
    }
  }

  // Fallback...
  try {
    const slug = slugify(text);
    const audioUrl = `/audio/${slug}.mp3`;
    const audio = new Audio(audioUrl);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Audio play error, falling back to TTS", error);
        fallbackToBrowserTTS(expandTextForAudio(text));
      });
      return;
    }
  } catch (err) {
    console.error("Audio play error", err);
    // Ignore fetch errors, fallback to browser TTS
  }

  // Fallback to browser TTS if no pre-generated audio or playback fails
  fallbackToBrowserTTS(expandTextForAudio(text));
};

const fallbackToBrowserTTS = (text: string) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // Slightly slower for language learning clarity
  utterance.pitch = 1.0;

  const loadVoicesAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Priority: 
    // 1. Google US English (Chrome)
    // 2. Microsoft Zira/David (Edge/Windows)
    // 3. Samantha (macOS)
    // 4. Any online 'en-US'
    // 5. Any 'en-US'
    // 6. Any 'en'
    const preferredVoice = 
      voices.find(v => v.name === 'Google US English') ||
      voices.find(v => v.name.includes('Microsoft Zira')) ||
      voices.find(v => v.name.includes('Samantha')) ||
      voices.find(v => v.lang === 'en-US' && !v.localService) ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoicesAndSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
  } else {
    loadVoicesAndSpeak();
  }
};
