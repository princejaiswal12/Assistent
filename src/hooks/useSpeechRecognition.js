import { useCallback, useEffect, useRef, useState } from "react";

export const SUPPORT =
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

export function useSpeechRecognition({ onFinal, onError }) {
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const startingRef = useRef(false);
  const restartTimerRef = useRef(null);

  const [status, setStatus] = useState("stopped");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const clearRestart = useCallback(() => {
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
  }, []);

  const startRecognition = useCallback(() => {
    if (!shouldListenRef.current || startingRef.current) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      startingRef.current = false;
      recognitionRef.current = recognition;
      setStatus("listening");
      setError("");
    };

    recognition.onresult = (event) => {
      let live = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim() || "";

        if (result.isFinal) {
          if (transcript) {
            // Pause recognition before processing so TTS cannot become the next query.
            try { recognition.abort(); } catch {}
            onFinal(transcript);
          }
        } else {
          live += transcript + " ";
        }
      }

      setInterim(live.trim());
    };

    recognition.onerror = (event) => {
      const code = event.error || "unknown";

      if (code === "not-allowed" || code === "service-not-allowed") {
        shouldListenRef.current = false;
        startingRef.current = false;
        setStatus("permission");
        setError("Microphone permission was denied. Allow microphone access for continuous voice mode.");
        onError?.(code);
        return;
      }

      if (code === "audio-capture") {
        shouldListenRef.current = false;
        startingRef.current = false;
        setStatus("error");
        setError("No microphone was found or another app is using it.");
        onError?.(code);
        return;
      }

      if (code === "network") {
        setStatus("starting");
        setError("Reconnecting voice recognition...");
        onError?.(code);
        return;
      }

      if (code !== "aborted" && code !== "no-speech") {
        setError(`Speech recognition error: ${code}`);
        onError?.(code);
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      startingRef.current = false;
      setInterim("");

      if (!shouldListenRef.current) {
        setStatus("stopped");
        return;
      }

      clearRestart();
      setStatus("starting");

      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        startRecognition();
      }, 450);
    };

    recognitionRef.current = recognition;
    startingRef.current = true;

    try {
      recognition.start();
    } catch (err) {
      startingRef.current = false;
      if (err?.name !== "InvalidStateError") {
        setStatus("starting");
        setError("Reconnecting voice recognition...");
        clearRestart();
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          startRecognition();
        }, 700);
      }
    }
  }, [clearRestart, onError, onFinal]);

  const start = useCallback(() => {
    if (!SUPPORT) {
      setError("Speech recognition is not supported. Use the latest Google Chrome or Microsoft Edge.");
      setStatus("error");
      return;
    }

    shouldListenRef.current = true;
    clearRestart();
    setError("");
    setStatus("starting");
    startRecognition();
  }, [clearRestart, startRecognition]);

  // Temporary pause: does not mean the user ended the voice session.
  const pause = useCallback(() => {
    clearRestart();
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    try { recognition?.abort(); } catch {}
    startingRef.current = false;
    shouldListenRef.current = false;
    setInterim("");
    setStatus("stopped");
  }, [clearRestart]);

  // Same as Start, used after TTS finishes.
  const resume = useCallback(() => {
    if (!SUPPORT) return;
    shouldListenRef.current = true;
    clearRestart();
    setStatus("starting");
    startRecognition();
  }, [clearRestart, startRecognition]);

  // Permanent stop. Nothing is allowed to restart after this.
  const stop = useCallback(() => {
    shouldListenRef.current = false;
    clearRestart();

    const recognition = recognitionRef.current;
    recognitionRef.current = null;

    try { recognition?.abort(); } catch {}

    startingRef.current = false;
    setInterim("");
    setStatus("stopped");
  }, [clearRestart]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      clearRestart();
      try { recognitionRef.current?.abort(); } catch {}
      recognitionRef.current = null;
    };
  }, [clearRestart]);

  return {
    start,
    resume,
    pause,
    stop,
    status,
    interim,
    error,
    supported: SUPPORT,
  };
}
