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

// TTS Service using Youdao API (Human-like, Accessible in China)
export const playAudio = (text: string): void => {
  // Type 2 = American English, Type 1 = British English
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
  
  const audio = new Audio(url);
  
  audio.play().catch(e => {
    console.warn("Youdao TTS failed, falling back to browser native", e);
    fallbackToBrowserTTS(text);
  });
};

const fallbackToBrowserTTS = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}