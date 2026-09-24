# Voice Meaning Assistant

React + Vite browser voice assistant for explaining words, phrases, idioms, sentences, and short text without opening search websites.

## Run
npm install
npm run dev
npm run build

## Netlify
The project uses a Netlify Function at /api/meaning. Add the server-side environment variable GOOGLE_TRANSLATE_API_KEY in Netlify. Never expose this key through VITE_* frontend variables.

Google Cloud Translation provides translation. It does not itself generate rich dictionary definitions or full grammar explanations, so the project keeps the meaning provider behind a service boundary and uses lightweight explanation rules. A richer server-side explanation provider can be added later.

## Privacy
Only recognized text and generated explanations are stored locally. Raw microphone audio is not intentionally recorded or uploaded.
