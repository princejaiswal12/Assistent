# VoiceSearch Assistant

A React + Vite voice-controlled browser search assistant using the Web Speech API.

## Run

npm install
npm run dev

Open the Vite URL (usually http://localhost:5173), click Start Listening, and grant microphone permission.

## Example commands

- What is polymorphism in Java?
- Meaning of ephemeral
- Define encapsulation
- Open YouTube
- Search YouTube for dynamic programming
- Play Java tutorial on YouTube
- Open GitHub
- Search GitHub for MERN projects
- Search Stack Overflow for segmentation fault
- Search Wikipedia for artificial intelligence
- Open ChatGPT
- Search binary tree interview questions

## Limitations

A normal webpage cannot guarantee unrestricted microphone listening after the tab is closed, bypass browser permissions, or guarantee programmatic new tabs when popup blocking applies. For browser-wide/background behavior, use a Chrome/Edge extension.

## Security & Privacy

Only HTTP/HTTPS custom URLs are accepted. Search parameters use encodeURIComponent. No raw microphone audio is uploaded by this project. Settings are stored in localStorage.

## Extension migration

The app separates recognition, intent parsing, URL construction and website registry, making it straightforward to adapt the UI to an extension popup and move tab management to the extension APIs.
