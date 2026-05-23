import express from "express";
import path from "path";
import fs from "fs";
import { createRequire } from "node:module";
import { createServer as createViteServer } from "vite";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");
const googleTTS = require("google-tts-api");
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { loadPackagesData, getPackageNames } from "./lib/packages";

// Load .env.local into process.env (Vite does this for the client bundle, not for the server process)
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

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

  app.get("/api/download-package/:groupName", (req, res) => {
    try {
      const { groupName } = req.params;
      const pkgDir = path.join(process.cwd(), 'public', 'packages', groupName);
      if (!fs.existsSync(pkgDir)) {
        return res.status(404).json({ error: "Package not found" });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${groupName}.zip"`);

      const archive = new ZipArchive({ zlib: { level: 9 } });
      archive.on('error', (err) => { throw err; });
      archive.pipe(res);
      archive.directory(pkgDir, groupName);
      archive.finalize();
    } catch (e: any) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: e.message || "Failed" });
    }
  });

  app.post("/api/download-package", async (req, res) => {
    try {
      const { groupName, items } = req.body;
      if (!groupName || !items || !Array.isArray(items)) return res.status(400).json({ error: "Invalid data" });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${groupName}.zip"`);

      const archive = new ZipArchive({ zlib: { level: 9 } });
      archive.on('error', (err) => { throw err; });
      archive.pipe(res);

      archive.append(JSON.stringify(items, null, 2), { name: `${groupName}/data.json` });

      // Include existing audio files from packages directory
      const audioDir = path.join(process.cwd(), 'public', 'packages', groupName, 'audio');
      const existingFiles = new Set<string>();
      if (fs.existsSync(audioDir)) {
        for (const file of fs.readdirSync(audioDir)) {
          archive.file(path.join(audioDir, file), { name: `${groupName}/audio/${file}` });
          existingFiles.add(file);
        }
      }

      // Generate missing audio via Google Translate TTS
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const fileName = item.audioFileName || `${item.english.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.mp3`;
        if (existingFiles.has(fileName)) continue;

        try {
          const url = googleTTS.getAudioUrl(item.english, { lang: 'en', slow: false, host: 'https://translate.google.com' });
          const ttsRes = await fetch(url);
          if (ttsRes.ok) {
            const buffer = Buffer.from(await ttsRes.arrayBuffer());
            archive.append(buffer, { name: `${groupName}/audio/${fileName}` });
          }
        } catch (e) {
          console.error(`TTS failed for: ${item.english}`);
        }

        // Delay to avoid rate limiting
        if (i < items.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      archive.finalize();
    } catch (e: any) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: e.message || "Failed" });
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
      
      const archive = new ZipArchive({ zlib: { level: 9 } });
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
