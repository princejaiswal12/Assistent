import { useCallback, useEffect, useRef, useState } from "react";

export const SUPPORT =
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

export function useSpeechRecognition({ onFinal, onError }) {
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef(null);

  const [status, setStatus] = useState("stopped");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const createRecognition = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return null;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setStatus("listening");
      setError("");
    };

    recognition.onresult = (event) => {
      let live = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim() || "";

        if (result.isFinal) {
          if (transcript) onFinal(transcript);
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
        setStatus("permission");
        setError("Microphone permission was denied. Allow microphone access in the browser and try again.");
        onError?.(code);
        return;
      }

      if (code === "audio-capture") {
        shouldListenRef.current = false;
        setStatus("error");
        setError("No microphone was found or the microphone is being used by another app.");
        onError?.(code);
        return;
      }

      if (code === "network") {
        setError("Speech recognition needs an internet connection.");
        onError?.(code);
        return;
      }

      if (code !== "aborted" && code !== "no-speech") {
        setError(`Speech recognition error: ${code}`);
        onError?.(code);
      }
    };

    recognition.onend = () => {
      setInterim("");

      if (!shouldListenRef.current) {
        setStatus("stopped");
        return;
      }

      setStatus("starting");
      restartTimerRef.current = window.setTimeout(() => {
        if (!shouldListenRef.current) return;
        const next = createRecognition();
        recognitionRef.current = next;
        try {
          next?.start();
        } catch {
          shouldListenRef.current = false;
          setStatus("error");
          setError("Could not restart speech recognition. Please click Start Listening again.");
        }
      }, 300);
    };

    return recognition;
  }, [onError, onFinal]);

  const start = useCallback(() => {
    if (!SUPPORT) {
      setError("Speech recognition is not supported. Use the latest Google Chrome or Microsoft Edge.");
      setStatus("error");
      return;
    }

    if (shouldListenRef.current) return;

    shouldListenRef.current = true;
    setError("");
    setStatus("starting");

    const recognition = createRecognition();
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      shouldListenRef.current = false;
      setStatus("error");
      setError("Could not start speech recognition. Please try again.");
    }
  }, [createRecognition]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;

    const recognition = recognitionRef.current;
    recognitionRef.current = null;

    try {
      recognition?.abort();
    } catch {}

    setInterim("");
    setStatus("stopped");
  }, []);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  return { start, pause, stop, status, interim, error, supported: SUPPORT };
}