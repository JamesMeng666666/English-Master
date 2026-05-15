import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";

const expandTextForAudio = (text: string): string => {
  let expanded = text;
  expanded = expanded.replace(/\bsth\b/gi, "something");
  expanded = expanded.replace(/\bsb\b/gi, "somebody");
  expanded = expanded.replace(/\betc\.?\b/gi, "et cetera");
  expanded = expanded.replace(/\be\.g\.\b/gi, "for example");
  expanded = expanded.replace(/\bi\.e\.\b/gi, "that is");
  expanded = expanded.replace(/\bvs\.?\b/gi, "versus");
  return expanded;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/generate-cards", async (req, res) => {
    try {
      const { rawText } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "No API Key configured on server." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        You are an expert language teacher. Extract English vocabulary, phrases, and sentences along with their Chinese translations from the provided text.
        Ignore numbers or list bullets if they are just formatting.
        Categorize them as 'word', 'phrase', or 'sentence'.
        **IMPORTANT**: For each 'phrase' or 'word', provide a simple English 'example' sentence to demonstrate its usage.
        Return the result as a JSON array.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      if (!rawJson) {
        return res.status(500).json({ error: "Empty response from AI" });
      }

      const parsed = JSON.parse(rawJson);

      const cards = await Promise.all(parsed.map(async (item: any) => {
        let audioBase64 = '';
        try {
          const expandedText = expandTextForAudio(item.english);
          const ttsResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: `Say clearly: ${expandedText}` }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                  },
              },
            },
          });
          const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            audioBase64 = base64Audio;
          }
        } catch (err) {
          console.error("TTS error for", item.english, err);
        }

        return {
          ...item,
          id: Math.random().toString(36).substring(2, 9),
          stage: 0,
          nextReviewDate: Date.now(),
          easeFactor: 2.5,
          audioBase64
        };
      }));

      res.json(cards);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate cards" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
