import { useCallback, useEffect, useState } from "react";
import { BookOpen, ExternalLink, Trash2 } from "lucide-react";
import MicrophoneButton from "./components/MicrophoneButton";
import StatusIndicator from "./components/StatusIndicator";
import Transcript from "./components/Transcript";
import { parseMeaningQuery } from "./services/intentParser";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

const HISTORY_KEY = "voice-google-search-history-v1";

export default function App() {
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [typedText, setTypedText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 50)));
  }, [entries]);

  const searchGoogle = useCallback((sentence) => {
    const query = parseMeaningQuery(sentence);

    if (!query) {
      setMessage("Please say or type something to search.");
      return;
    }

    setEntries((current) => [
      { id: crypto.randomUUID(), text: sentence.trim(), time: Date.now() },
      ...current,
    ].slice(0, 50));

    setMessage(`Searching Google for “${query}”…`);

    // No API key, backend, or paid service is required.
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.location.href = googleUrl;
  }, []);

  const handleError = useCallback((code) => {
    if (code === "not-allowed" || code === "service-not-allowed") {
      setMessage("Microphone permission was denied. Allow microphone access and try again.");
    } else if (code === "network") {
      setMessage("Speech recognition needs an internet connection.");
    } else if (code === "no-speech") {
      setMessage("I didn't hear anything. Please try again.");
    }
  }, []);

  const { start, pause, stop, status, interim, error, supported } =
    useSpeechRecognition({ onFinal: searchGoogle, onError: handleError });

  function submitTyped() {
    if (typedText.trim()) searchGoogle(typedText.trim());
  }

  function clearHistory() {
    setEntries([]);
    setMessage("History cleared.");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><BookOpen size={19} /></div>
          <div>
            <div className="brand-name">Voice Google Search</div>
            <div className="brand-subtitle">Speak naturally. Search Google instantly.</div>
          </div>
        </div>
        <StatusIndicator status={status} />
      </header>

      <main className="content">
        {!supported && (
          <div className="notice error-notice">
            Voice recognition is not supported in this browser. Please use the latest Chrome or Edge.
          </div>
        )}
        {error && <div className="notice error-notice">{error}</div>}
        {message && <div className="notice">{message}</div>}

        <section className="hero">
          <div className="eyebrow"><span className="pulse-dot" /> GOOGLE SEARCH</div>
          <h1>Speak it.<br /><span>Search it.</span></h1>
          <p>
            Say a word, question, sentence, phrase, or anything else.
            Your voice is converted to text in the browser and the query is sent directly to Google Search.
          </p>

          <MicrophoneButton status={status} onStart={start} onPause={pause} onStop={stop} />
          {interim && <div className="interim-card">“{interim}”</div>}

          <div className="quick-hints">
            <span>Try:</span>
            <button onClick={() => searchGoogle("What does ubiquitous mean?")}>“What does ubiquitous mean?”</button>
            <button onClick={() => searchGoogle("best way to learn DSA")}>“Best way to learn DSA”</button>
            <button onClick={() => searchGoogle("weather in Delhi today")}>“Weather in Delhi today”</button>
          </div>
        </section>

        <section className="manual-search">
          <input
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            placeholder="Type anything to search Google"
            aria-label="Google search text"
          />
          <button className="speak-button" onClick={submitTyped}>
            <ExternalLink size={17} /> Search Google
          </button>
        </section>

        <div className="grid single-column">
          <Transcript entries={entries} interim={interim} />
        </div>

        <section className="bottom-bar">
          <div className="privacy-inline">
            <span>Microphone starts only after you activate it. Raw microphone audio is never uploaded or stored.</span>
          </div>
          <button className="clear-button" onClick={clearHistory}>
            <Trash2 size={15} /> Clear History
          </button>
        </section>
      </main>
    </div>
  );
}
