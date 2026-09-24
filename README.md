# VoiceSearch Assistant

A React + Vite voice-controlled browser search assistant using the Web Speech API.

## Run
```bash
npm install
npm run dev
```

Click **Start Listening** and grant microphone permission.

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

## Features
- Continuous recognition while the page is open, with automatic restart when the browser ends a recognition session.
- Processes every final recognized sentence.
- Search engine selection: Google, Bing, DuckDuckGo.
- Website routing for YouTube, GitHub, Wikipedia, LinkedIn, ChatGPT, Stack Overflow, Reddit and Amazon.
- Custom websites with HTTP/HTTPS validation.
- Duplicate suppression and localStorage settings.
- Transcript, action history, clear history and popup-blocker feedback.

## Limitations
A normal webpage cannot guarantee microphone listening after the tab is closed, bypass browser permissions, or guarantee new tabs when popup blocking applies. For browser-wide/background behavior, package this architecture as a Chrome/Edge extension.

## Security & Privacy
Only HTTP/HTTPS custom URLs are accepted. Search parameters are URL-encoded. Speech text is never executed as JavaScript. Raw microphone audio is not uploaded or stored by this project. Settings are stored in localStorage.
