import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings as SettingsIcon, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import MicrophoneButton from "./components/MicrophoneButton";
import StatusIndicator from "./components/StatusIndicator";
import Transcript from "./components/Transcript";
import ActionHistory from "./components/ActionHistory";
import Settings from "./components/Settings";
import { parseIntent } from "./services/intentParser";
import { openInNewTab } from "./services/searchService";
import { DEFAULT_WEBSITES } from "./services/websiteRegistry";
import { createDuplicateDetector } from "./utils/duplicateDetector";
import { fetchOxfordWord, speakFallback } from "./services/oxfordService";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

const STORAGE_KEY = "voicesearch-settings-v1";
const DEFAULT_SETTINGS = { engine: "google", defaultAction: "search", duplicateWindow: 3000, websites: {} };

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...DEFAULT_SETTINGS, ...stored, websites: { ...(stored?.websites || {}) } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [entries, setEntries] = useState([]);
  const [actions, setActions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState("");

  const detector = useMemo(() => createDuplicateDetector(settings.duplicateWindow), [settings.duplicateWindow]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }, [settings]);

  const speakMeaning = useCallback(async (word) => {
    try {
      const data = await fetchOxfordWord(word, "en-gb");
      if (data.audioFile) {
        const audio = new Audio(data.audioFile);
        audio.play().catch(() => speakFallback(word));
        setMessage(`Playing Oxford Languages pronunciation: ${data.word}${data.ipa ? ` (${data.ipa})` : ""}`);
      } else {
        speakFallback(word, undefined, () => setMessage("Oxford pronunciation audio was unavailable."));
        setMessage(`Oxford definition: ${data.definition || "No definition found."}`);
      }
    } catch {
      speakFallback(word, undefined, () => setMessage("Pronunciation is unavailable in this browser."));
      setMessage("Oxford pronunciation was unavailable, so browser pronunciation was used.");
    }
  }, []);

  const processSentence = useCallback((sentence) => {
    const text = sentence.trim();
    if (!text || detector.isDuplicate(text)) return;

    setEntries((current) => [{ id: crypto.randomUUID(), text, time: Date.now() }, ...current].slice(0, 50));

    const meaningMatch = text.match(/^(meaning of|define|definition of|what does)\\s+(.+?)(?:\\s+mean)?\\??$/i);
    if (meaningMatch) {
      const word = meaningMatch[2].trim();
      setEntries((current) => [{ id: crypto.randomUUID(), text, time: Date.now() }, ...current].slice(0, 50));
      speakMeaning(word);
      return;
    }

    const intent = parseIntent(text, {
      engine: settings.engine,
      websites: { ...DEFAULT_WEBSITES, ...settings.websites },
    });

    if (settings.defaultAction === "ignore" && intent.type === "SEARCH") {
      setMessage("Unknown command ignored.");
      return;
    }

    if (settings.defaultAction === "confirm" && intent.type === "SEARCH") {
      if (!window.confirm(`Search for:\n\n${intent.query}`)) return;
    }

    if (!intent.url) return;

    const success = openInNewTab(intent.url);
    setActions((current) => [{
      id: crypto.randomUUID(), type: intent.type, query: intent.query, success, time: Date.now()
    }, ...current].slice(0, 50));

    setMessage(success ? `Opened: ${intent.label}` : "The browser blocked the new tab. Allow pop-ups for this site and try again.");
  }, [detector, settings]);

  const handleError = useCallback((code) => {
    if (code === "not-allowed" || code === "service-not-allowed") setMessage("Microphone permission was denied.");
  }, []);

  const { start, pause, stop, status, interim, error, supported } =
    useSpeechRecognition({ onFinal: processSentence, onError: handleError });

  function clearHistory() {
    setEntries([]); setActions([]); detector.reset(); setMessage("History cleared.");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Sparkles size={19} /></div>
          <div><div className="brand-name">VoiceSearch Assistant</div><div className="brand-subtitle">Speak naturally. Search instantly.</div></div>
        </div>
        <div className="top-actions">
          <StatusIndicator status={status} />
          <button className="icon-button" title="Settings" onClick={() => setShowSettings(true)}><SettingsIcon size={20} /></button>
        </div>
      </header>

      <main className="content">
        {!supported && <div className="notice error-notice">Speech recognition is not supported in this browser. Try the latest Google Chrome or Microsoft Edge.</div>}
        {error && <div className="notice error-notice">{error}</div>}
        {message && <div className="notice">{message}</div>}

        <section className="hero">
          <div className="eyebrow"><span className="pulse-dot" /> VOICE CONTROL</div>
          <h1>Search the web<br /><span>with your voice.</span></h1>
          <p>Start listening, speak naturally, and let VoiceSearch route each sentence to the right website or search engine.</p>

          <MicrophoneButton status={status} onStart={start} onPause={pause} onStop={stop} />
          {interim && <div className="interim-card">“{interim}”</div>}

          <div className="quick-hints">
            <span>Try:</span>
            <button onClick={() => processSentence("What is polymorphism in Java?")}>“What is polymorphism?”</button>
            <button onClick={() => processSentence("Open YouTube")}>“Open YouTube”</button>
            <button onClick={() => processSentence("Search YouTube for dynamic programming")}>“Search YouTube for DP”</button>
          </div>
        </section>

        <div className="grid">
          <Transcript entries={entries} interim={interim} />
          <ActionHistory actions={actions} />
        </div>

        <section className="bottom-bar">
          <div className="privacy-inline"><ShieldCheck size={17} /><span>Microphone starts only after you activate it. No raw audio is uploaded.</span></div>
          <button className="clear-button" onClick={clearHistory}><Trash2 size={15} /> Clear History</button>
        </section>

        <section className="background-card">
          <div><strong>Need true background listening?</strong><p>A normal webpage is constrained by browser lifecycle and speech-recognition rules. For listening while browsing other pages or after closing the app page, package this UI as a Chrome/Edge extension.</p></div>
          <span className="extension-badge">Extension-ready architecture</span>
        </section>
      </main>

      {showSettings && <Settings settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}