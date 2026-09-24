import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, Trash2, Volume2, Square } from "lucide-react";
import MicrophoneButton from "./components/MicrophoneButton";
import StatusIndicator from "./components/StatusIndicator";
import Transcript from "./components/Transcript";
import { parseMeaningQuery } from "./services/intentParser";
import { fetchMeaning, speakMeaning, stopSpeaking } from "./services/meaningService";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

const HISTORY_KEY = "voice-meaning-history-v4";

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

  const voiceActiveRef = useRef(false);
  const voiceGenerationRef = useRef(0);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 50)));
  }, [entries]);

  const finishVoiceTurn = useCallback((generation) => {
    if (!voiceActiveRef.current || voiceGenerationRef.current !== generation) return;
    setSpeaking(false);
    resume();
  }, []);

  const processSentence = useCallback(async (sentence, fromVoice = false) => {
    const query = parseMeaningQuery(sentence);

    if (!query) {
      setMessage("Please say a word, phrase, sentence, idiom, or expression.");
      if (fromVoice) finishVoiceTurn(voiceGenerationRef.current);
      return;
    }

    const generation = voiceGenerationRef.current;

    setEntries((current) => [
      { id: crypto.randomUUID(), text: sentence.trim(), time: Date.now() },
      ...current,
    ].slice(0, 50));

    setLoading(true);
    setSpeaking(false);
    setMessage("");

    try {
      const result = await fetchMeaning(query, language);

      if (fromVoice && (!voiceActiveRef.current || voiceGenerationRef.current !== generation)) {
        return;
      }

      setMeaning(result);

      if (result.speechText) {
        speakMeaning(result.speechText, language, {
          onStart: () => setSpeaking(true),
          onEnd: () => finishVoiceTurn(generation),
          onError: () => finishVoiceTurn(generation),
        });
      } else if (fromVoice) {
        finishVoiceTurn(generation);
      }
    } catch (error) {
      if (fromVoice && voiceActiveRef.current && voiceGenerationRef.current === generation) {
        setMeaning(null);
        setMessage(error.message || "Unable to explain that right now.");
        finishVoiceTurn(generation);
      } else if (!fromVoice) {
        setMessage(error.message || "Unable to explain that right now.");
      }
    } finally {
      setLoading(false);
    }
  }, [finishVoiceTurn, language]);

  const handleFinal = useCallback((sentence) => {
    // The recognition hook suspends its automatic restart before calling this.
    processSentence(sentence, true);
  }, [processSentence]);

  const handleError = useCallback((code) => {
    if (code === "not-allowed" || code === "service-not-allowed") {
      voiceActiveRef.current = false;
      setMessage("Microphone permission is required for continuous voice mode.");
    } else if (code === "network") {
      setMessage("Reconnecting voice recognition...");
    } else if (code === "no-speech") {
      setMessage("Listening again...");
    }
  }, []);

  const { resume, pause, stop, status, interim, error, supported } =
    useSpeechRecognition({ onFinal: handleFinal, onError: handleError });

  function handleStart() {
    voiceGenerationRef.current += 1;
    voiceActiveRef.current = true;
    setMessage("");
    resume();
  }

  function handlePause() {
    voiceActiveRef.current = false;
    voiceGenerationRef.current += 1;
    pause();
    stopSpeaking();
    setSpeaking(false);
  }

  function handleStop() {
    voiceActiveRef.current = false;
    voiceGenerationRef.current += 1;
    stop();
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
    if (typedText.trim()) processSentence(typedText.trim(), false);
  }

  function clearHistory() {
    setEntries([]);
    setMeaning(null);
    setMessage("History cleared.");
    stopSpeaking();
    setSpeaking(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><BookOpen size={19} /></div>
          <div>
            <div className="brand-name">Voice Meaning Assistant</div>
            <div className="brand-subtitle">One Start. Continuous voice. Automatic answers.</div>
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
          <StatusIndicator status={loading ? "processing" : speaking ? "speaking" : status} />
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
          <div className="eyebrow"><span className="pulse-dot" /> CONTINUOUS VOICE</div>
          <h1>Speak it.<br /><span>Understand it.</span></h1>
          <p>
            Press Start once. Ask one question after another. I find a free meaning when possible,
            speak the result, and automatically listen again after every answer.
          </p>

          <MicrophoneButton
            status={status}
            onStart={handleStart}
            onPause={handlePause}
            onStop={handleStop}
          />

          {interim && <div className="interim-card">“{interim}”</div>}

          <div className="quick-hints">
            <span>Try:</span>
            <button onClick={() => processSentence("What does ubiquitous mean?", false)}>“What does ubiquitous mean?”</button>
            <button onClick={() => processSentence("What does ephemeral mean?", false)}>“What does ephemeral mean?”</button>
            <button onClick={() => processSentence("What does break a leg mean?", false)}>“What does break a leg mean?”</button>
          </div>
        </section>

        <section className="manual-search">
          <input
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            placeholder="Type a word, sentence, idiom, or phrase"
            aria-label="Text to explain"
          />
          <button className="speak-button" onClick={submitTyped}>
            <ExternalLink size={17} /> Explain
          </button>
        </section>

        {loading && <div className="notice">Finding the meaning…</div>}

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
                  <button
                    className="stop-speech-button"
                    onClick={() => { stopSpeaking(); setSpeaking(false); }}
                    title="Stop speaking"
                  >
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
            <span>Raw microphone audio is never uploaded or stored. STOP permanently ends the voice session.</span>
          </div>
          <button className="clear-button" onClick={clearHistory}>
            <Trash2 size={15} /> Clear History
          </button>
        </section>
      </main>
    </div>
  );
}
