import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Trash2, Volume2, Square } from "lucide-react";
import MicrophoneButton from "./components/MicrophoneButton";
import StatusIndicator from "./components/StatusIndicator";
import Transcript from "./components/Transcript";
import { parseMeaningQuery } from "./services/intentParser";
import { fetchMeaning, speakMeaning, stopSpeaking } from "./services/meaningService";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

const HISTORY_KEY = "voice-meaning-history-v2";

export default function App() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
  });
  const [meaning, setMeaning] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 50)));
  }, [entries]);

  const processSentence = useCallback(async (sentence) => {
    const query = parseMeaningQuery(sentence);
    if (!query) {
      setMessage("Please say a word, phrase, sentence, idiom, or expression.");
      return;
    }

    setEntries((current) => [
      { id: crypto.randomUUID(), text: sentence.trim(), time: Date.now() },
      ...current,
    ].slice(0, 50));

    setLoading(true);
    setSpeaking(false);
    setMessage("");

    try {
      const result = await fetchMeaning(query, language);
      setMeaning(result);

      if (result.speechText) {
        speakMeaning(result.speechText, language, {
          onStart: () => setSpeaking(true),
          onEnd: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }
    } catch (error) {
      setMeaning(null);
      setMessage(error.message || "Unable to explain that right now.");
    } finally {
      setLoading(false);
    }
  }, [language]);

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
    useSpeechRecognition({ onFinal: processSentence, onError: handleError });

  function clearHistory() {
    setEntries([]);
    setMeaning(null);
    setMessage("History cleared.");
    stopSpeaking();
    setSpeaking(false);
  }

  function repeatMeaning() {
    if (!meaning?.speechText) return;
    speakMeaning(meaning.speechText, language, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  function submitTyped() {
    if (typedText.trim()) processSentence(typedText.trim());
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><BookOpen size={19} /></div>
          <div>
            <div className="brand-name">Voice Meaning Assistant</div>
            <div className="brand-subtitle">Speak naturally. I'll explain it.</div>
          </div>
        </div>
        <div className="top-controls">
          <label className="language-select">
            Explain in
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </label>
          <StatusIndicator status={speaking ? "speaking" : status} />
        </div>
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
          <div className="eyebrow"><span className="pulse-dot" /> VOICE MEANING</div>
          <h1>Speak it.<br /><span>Understand it.</span></h1>
          <p>
            Ask about a word, sentence, idiom, expression, or short paragraph.
            The assistant uses online language services, explains the result, and reads it aloud.
          </p>

          <MicrophoneButton status={status} onStart={start} onPause={pause} onStop={stop} />
          {interim && <div className="interim-card">“{interim}”</div>}

          <div className="quick-hints">
            <span>Try:</span>
            <button onClick={() => processSentence("What does ubiquitous mean?")}>“What does ubiquitous mean?”</button>
            <button onClick={() => processSentence("Explain this sentence: I have been working here for five years.")}>“Explain this sentence”</button>
            <button onClick={() => processSentence("What does break a leg mean?")}>“Explain an idiom”</button>
          </div>
        </section>

        <section className="manual-search">
          <input
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            placeholder="Type a word, sentence, idiom, or phrase to test"
            aria-label="Text to explain"
          />
          <button className="speak-button" onClick={submitTyped}>Explain</button>
        </section>

        {loading && <div className="notice">Understanding and explaining…</div>}

        {meaning && (
          <section className="meaning-card">
            <div className="meaning-header">
              <div>
                <div className="meaning-word">{meaning.title}</div>
                {meaning.phonetic && <div className="phonetic">{meaning.phonetic}</div>}
              </div>
              <div className="speech-actions">
                <button className="speak-button" onClick={repeatMeaning}>
                  <Volume2 size={18} /> {speaking ? "Speaking..." : "Speak Again"}
                </button>
                {speaking && (
                  <button className="stop-speech-button" onClick={() => { stopSpeaking(); setSpeaking(false); }} title="Stop speaking">
                    <Square size={15} /> Stop
                  </button>
                )}
              </div>
            </div>

            <div className="meaning-sections">
              {meaning.meaning && <article><h3>Meaning</h3><p>{meaning.meaning}</p></article>}
              {meaning.simple && <article><h3>In simple words</h3><p>{meaning.simple}</p></article>}
              {meaning.translation && <article><h3>Translation</h3><p>{meaning.translation}</p></article>}
              {meaning.example && <article><h3>Example</h3><p>{meaning.example}</p></article>}
              {meaning.usage && <article><h3>Usage</h3><p>{meaning.usage}</p></article>}
              {meaning.grammar && <article><h3>Grammar</h3><p>{meaning.grammar}</p></article>}
              {meaning.similar && <article><h3>Similar words</h3><p>{meaning.similar}</p></article>}
            </div>
          </section>
        )}

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
