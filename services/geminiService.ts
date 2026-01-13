import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StudyItem } from "../types";

// Helper for Base64 decoding for Audio
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playGeminiTTS = async (text: string, apiKey: string): Promise<void> => {
  if (!apiKey) {
    console.warn("No API key provided for TTS. Falling back to browser speech synthesis.");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) throw new Error("No audio data received from Gemini");

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );
    
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    source.start();

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    // Fallback
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
};

export const parseContentWithGemini = async (rawText: string, apiKey: string): Promise<StudyItem[]> => {
  if (!apiKey) throw new Error("API Key required for content processing");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    You are an expert language teacher. Extract English vocabulary, phrases, and sentences along with their Chinese translations from the provided text.
    Ignore numbers or list bullets if they are just formatting.
    Categorize them as 'word', 'phrase', or 'sentence'.
    **IMPORTANT**: For each 'phrase' or 'word', provide a simple English 'example' sentence to demonstrate its usage.
    Return the result as a JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-latest',
    contents: [
        { role: 'user', parts: [{ text: prompt }]},
        { role: 'user', parts: [{ text: `Here is the text to process: \n${rawText}` }]}
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING },
            chinese: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['word', 'phrase', 'sentence'] },
            example: { type: Type.STRING }
          },
          required: ['english', 'chinese', 'type']
        }
      }
    }
  });

  const rawJson = response.text;
  if (!rawJson) throw new Error("Empty response from AI");

  const parsed = JSON.parse(rawJson);
  
  // Hydrate with ID and default stats
  return parsed.map((item: any) => ({
    ...item,
    id: Math.random().toString(36).substr(2, 9),
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  }));
};