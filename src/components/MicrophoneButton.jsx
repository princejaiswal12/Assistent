import { Mic, Pause, Square } from "lucide-react";

export default function MicrophoneButton({ status, onStart, onPause, onStop }) {
  const listening = status === "listening" || status === "starting";
  return (
    <div className="mic-area">
      <button
        className={`mic-button ${listening ? "active" : ""}`}
        onClick={listening ? onPause : onStart}
        aria-label={listening ? "Pause listening" : "Start listening"}
      >
        {listening ? <Pause size={38} /> : <Mic size={38} />}
      </button>
      <div className="mic-caption">
        {status === "listening" ? "Listening..." : status === "starting" ? "Starting..." : "Click to listen"}
      </div>
      {listening && (
        <button className="stop-link" onClick={onStop}>
          <Square size={13} fill="currentColor" /> Stop completely
        </button>
      )}
    </div>
  );
}