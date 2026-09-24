import { useCallback, useState } from "react";
import { BookOpen, Trash2, Volume2 } from "lucide-react";
import MicrophoneButton from "./components/MicrophoneButton";
import StatusIndicator from "./components/StatusIndicator";
import Transcript from "./components/Transcript";
import { parseMeaningQuery } from "./services/intentParser";
import { fetchMeaning, speakMeaning } from "./services/meaningService";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [meaning, setMeaning] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const processSentence = useCallback(async (sentence) => {
    const query = parseMeaningQuery(sentence);

    if (!query) {
      setMessage("Please say a word or phrase whose meaning you want to know.");
      return;
    }

    setEntries((current) => [
      { id: crypto.randomUUID(), text: sentence.trim(), time: Date.now() },
      ...current,
    ].slice(0, 50));

    setLoading(true);
    setMessage("");

    try {
      const result = await fetchMeaning(query);
      setMeaning(result);
      speakMeaning(result);
    } catch (error) {
      setMeaning(null);
      setMessage(error.message || "Unable to find the meaning.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleError = useCallback((code) => {
    if (code === "not-allowed" || code === "service-not-allowed") {
      setMessage("Microphone permission was denied.");
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
    window.speechSynthesis?.cancel();
  }

  function repeatMeaning() {
    if (!meaning) return;
    try {
      speakMeaning(meaning);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><BookOpen size={19} /></div>
          <div>
            <div className="brand-name">Meaning Assistant</div>
            <div className="brand-subtitle">Speak a word. Hear its meaning.</div>
          </div>
        </div>
        <StatusIndicator status={status} />
      </header>

      <main className="content">
        {!supported && (
          <div className="notice error-notice">
            Speech recognition is not supported in this browser. Try the latest Google Chrome or Microsoft Edge.
          </div>
        )}
        {error && <div className="notice error-notice">{error}</div>}
        {message && <div className="notice">{message}</div>}

        <section className="hero">
          <div className="eyebrow"><span className="pulse-dot" /> VOICE MEANING</div>
          <h1>Ask for a meaning.<br /><span>Hear the answer.</span></h1>
          <p>
            Start listening and say “meaning of ubiquitous” or simply say “ubiquitous”.
            The app finds the definition and reads it aloud. Nothing is opened in a new tab.
          </p>

          <MicrophoneButton status={status} onStart={start} onPause={pause} onStop={stop} />
          {interim && <div className="interim-card">“{interim}”</div>}

          <div className="quick-hints">
            <span>Try:</span>
            <button onClick={() => processSentence("meaning of ubiquitous")}>“meaning of ubiquitous”</button>
            <button onClick={() => processSentence("define resilient")}>“define resilient”</button>
            <button onClick={() => processSentence("polymorphism")}>“polymorphism”</button>
          </div>
        </section>

        {loading && <div className="notice">Finding the meaning…</div>}

        {meaning && (
          <section className="meaning-card">
            <div className="meaning-header">
              <div>
                <div className="meaning-word">{meaning.word}</div>
                {meaning.phonetic && <div className="phonetic">{meaning.phonetic}</div>}
              </div>
              <button className="speak-button" onClick={repeatMeaning} title="Speak meaning again">
                <Volume2 size={18} /> Speak
              </button>
            </div>
            <div className="definitions">
              {meaning.definitions.map((item, index) => (
                <article className="definition" key={index}>
                  <div className="definition-number">{index + 1}</div>
                  <div>
                    {item.partOfSpeech && <div className="part-of-speech">{item.partOfSpeech}</div>}
                    <div className="definition-text">{item.definition}</div>
                    {item.example && <div className="example">Example: {item.example}</div>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="grid single-column">
          <Transcript entries={entries} interim={interim} />
        </div>

        <section className="bottom-bar">
          <div className="privacy-inline">
            <span>Microphone starts only after you activate it. No raw audio is uploaded or stored.</span>
          </div>
          <button className="clear-button" onClick={clearHistory}>
            <Trash2 size={15} /> Clear History
          </button>
        </section>
      </main>
    </div>
  );
}
