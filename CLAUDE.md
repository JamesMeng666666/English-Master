# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev          # Start dev server (Express + Vite HMR on port 3000)
npm run build        # Production build: Vite frontend + esbuild server -> dist/
npm start            # Run production server from dist/server.cjs
npm run lint         # TypeScript type-checking (tsc --noEmit)
npm run preview      # Preview Vite production build
npm run generate-audio  # Batch-generate TTS audio files via Gemini API
```

There is no test framework. `tsc` is the only code-quality check.

## Environment

Set `GEMINI_API_KEY` in a `.env.local` file at the project root. Vite loads this at build time and bakes it into both the client bundle (`process.env.GEMINI_API_KEY`) and the server reads it at runtime (`process.env.GEMINI_API_KEY`).

## Architecture

**Single Express server** (`server.ts`) that serves both the API and the React SPA. In dev mode, Vite middleware provides HMR. In production, static files from `dist/` with SPA fallback.

**Two API endpoints:**
- `POST /api/generate-cards` — sends raw text to Gemini (`gemini-3-flash-preview`) with structured output schema, returns JSON array of `StudyItem` objects with spaced-repetition metadata.
- `POST /api/tts` — sends English text to Gemini TTS (`gemini-3.1-flash-tts-preview`, voice "Zephyr"), returns `{ audioBase64 }` PCM audio. Abbreviations (sth, sb, etc.) are expanded server-side before TTS.

**Frontend** is a single-page app with no router. `App.tsx` manages all state via `useState`/`useEffect` hooks and switches between modes with a `StudyMode` enum state variable: `DASHBOARD`, `FLASHCARD`, `QUIZ`, `DICTATION`, `LIST`. Data persists to `localStorage` under key `ebbinghaus_data`. The Gemini API key is stored client-side under `gemini_api_key`.

**Spaced repetition** uses 7 stages (0–6) with intervals: 1 min, 10 min, 1 day, 3 days, 7 days, 15 days, 30 days. The `ReviewGrade` enum (AGAIN, HARD, GOOD, EASY) controls progression. Logic lives in `App.tsx` `handleGradeChange`.

**Audio** has a three-tier fallback chain in `services/geminiService.ts`: pre-generated MP3 from `public/audio/` → server-side Gemini TTS → browser `SpeechSynthesis`. The `scripts/` directory contains utilities for batch-generating audio files. Audio naming convention: `{Group}-{Type}{Sequence}-{slugified-english}.mp3`.

## Key files

| File | Role |
|---|---|
| `App.tsx` | All app state, mode switching, spaced repetition logic, localStorage persistence |
| `types.ts` | TypeScript types and enums (`StudyItem`, `StudyMode`, `ReviewGrade`) |
| `constants.ts` | Default study data (~550 lines of vocab items), audio naming, interval config |
| `server.ts` | Express server with two API routes and Vite/static file middleware |
| `services/geminiService.ts` | Gemini API calls (`parseContentWithGemini`, `playAudio`, `preloadAudio`) |
| `components/` | `Flashcard.tsx`, `Quiz.tsx`, `Dictation.tsx`, `VocabularyList.tsx`, `ApiKeyModal.tsx` |

## Conventions

- No CSS modules or CSS-in-JS — styling is Tailwind via CDN (`index.html` script tag) plus inline `style={{}}` objects.
- React and `@google/genai` are loaded both from npm (Vite bundle) and via `esm.sh` CDN importmap in `index.html`.
- TypeScript `@/*` path alias maps to the project root.
- Audio files in `public/audio/` are committed directly to the repo (476 MP3 files).
- `metadata.json` describes the app for AI Studio listing purposes.
