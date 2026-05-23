import express from "express";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { loadPackagesData, getPackageNames } from "./lib/packages";

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

      const cards = parsed.map((item: any) => {
        return {
          ...item,
          id: Math.random().toString(36).substring(2, 9),
          stage: 0,
          nextReviewDate: Date.now(),
          easeFactor: 2.5,
          audioBase64: '' // We will fetch audio dynamically now to prevent rate limiting
        };
      });

      res.json(cards);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate cards" });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
         return res.status(400).json({ error: "No API Key" });
      }
      
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const expandedText = expandTextForAudio(text);
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
         res.json({ audioBase64: base64Audio });
      } else {
         res.status(500).json({ error: "No audio generated" });
      }
    } catch (e: any) {
      console.error("TTS error:", e);
      res.status(500).json({ error: e.message || "Failed to generate TTS" });
    }
  });

  app.get("/api/packages", (req, res) => {
    try {
      res.json(getPackageNames());
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to read packages" });
    }
  });

  app.get("/api/packages-data", (req, res) => {
    try {
      res.json(loadPackagesData());
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to read packages data" });
    }
  });

  app.post("/api/export-package", async (req, res) => {
    try {
      const { groupName, items } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(400).json({ error: "No API Key" });
      if (!groupName || !items || !Array.isArray(items)) return res.status(400).json({ error: "Invalid data" });

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const typeLabel = item.type === 'sentence' ? 'Sentence' : item.type === 'phrase' ? 'Phrase' : 'Word';
        const words = item.english.trim().split(/\s+/).slice(0, 3).map((word: string) => slugify(word.replace(/[^a-zA-Z0-9]/g, ''))).filter(Boolean);
        const prefix = words.length > 0 ? words.join('-') : slugify(item.english).slice(0, 30);
        item.audioFileName = `${groupName}-${typeLabel}${i+1}-${prefix}.mp3`;
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${groupName}_package.zip"`);
      
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => { throw err; });
      archive.pipe(res);

      archive.append(JSON.stringify(items, null, 2), { name: `${groupName}/data.json` });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const expandedText = expandTextForAudio(item.english);
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: `Say clearly: ${expandedText}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          },
        });
        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const buffer = Buffer.from(base64Audio, 'base64');
          archive.append(buffer, { name: `${groupName}/audio/${item.audioFileName}` });
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      archive.finalize();
    } catch (e: any) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: e.message || "Failed" });
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
    // Use a generic handler for SPA fallback. Using app.use avoids path-to-regexp
    // issues that can appear when bundling express/router with certain toolchains.
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
