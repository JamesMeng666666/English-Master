import { GoogleGenAI, Type } from "@google/genai";
import { StudyItem } from "../types";

// Parsing service remains using Gemini (requires API Key)
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

// TTS Service using Web Speech API (Accessible in China, Offline, Low Latency)
export const playAudio = (text: string): void => {
  if (!window.speechSynthesis) {
    console.warn("Web Speech API not supported");
    return;
  }

  // Cancel any currently playing speech to avoid queue buildup
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // Slightly slower for language learning clarity
  utterance.pitch = 1.0;

  // Attempt to select a high-quality voice
  const loadVoicesAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Priority: 
    // 1. Google US English (Chrome)
    // 2. Microsoft Zira/David (Edge/Windows)
    // 3. Samantha (macOS)
    // 4. Any 'en-US'
    // 5. Any 'en'
    
    const preferredVoice = 
      voices.find(v => v.name === 'Google US English') ||
      voices.find(v => v.name.includes('Microsoft Zira')) ||
      voices.find(v => v.name.includes('Samantha')) ||
      voices.find(v => v.lang === 'en-US' && !v.localService) || // Online voices are usually better
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Chrome loads voices asynchronously
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoicesAndSpeak();
      window.speechSynthesis.onvoiceschanged = null; // Remove listener
    };
  } else {
    loadVoicesAndSpeak();
  }
};