import { useCallback, useEffect, useRef, useState } from "react";

export const SUPPORT =
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

function extractWakeCommand(text) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^hey\s+siri(?:[\s,]+(.+))?$/i);
  if (!match) return null;
  return match[1]?.trim() || "";
}

export function useSpeechRecognition({ onFinal, onError }) {
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  const [status, setStatus] = useState("stopped");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const start = useCallback(() => {
    if (!SUPPORT) {
      setError("Speech recognition is not supported. Try Chrome or Edge.");
      setStatus("error");
      return;
    }
    if (shouldListenRef.current) return;

    shouldListenRef.current = true;
    setError("");
    setStatus("starting");

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || "";

        if (result.isFinal) {
          const sentence = transcript.trim();
          if (!sentence) continue;

          // Every voice command must begin with "Hey Siri".
          // Anything else is ignored.
          const command = extractWakeCommand(sentence);
          if (command) {
            onFinal(command);
          }
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText.trim());
    };

    recognition.onerror = (event) => {
      const code = event.error || "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        shouldListenRef.current = false;
        setStatus("permission");
        setError("Microphone permission was denied. Allow microphone access and try again.");
        onError?.(code);
        return;
      }
      if (code === "aborted" || code === "no-speech") return;
      setError(`Speech recognition error: ${code}`);
      onError?.(code);
    };

    recognition.onend = () => {
      setInterim("");
      if (shouldListenRef.current) {
        setStatus("starting");
        window.setTimeout(() => {
          if (!shouldListenRef.current) return;
          try { recognition.start(); } catch {}
        }, 250);
      } else {
        setStatus("stopped");
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      shouldListenRef.current = false;
      setStatus("error");
      setError("Could not start speech recognition.");
    }
  }, [onError, onFinal]);

  const pause = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setInterim("");
    setStatus("stopped");
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setInterim("");
    setStatus("stopped");
    setError("");
  }, []);

  useEffect(() => () => {
    shouldListenRef.current = false;
    recognitionRef.current?.abort();
  }, []);

  return { start, pause, stop, status, interim, error, supported: SUPPORT };
}
