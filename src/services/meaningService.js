const API_PATH = "/api/meaning";

export async function fetchMeaning(text, targetLanguage = "en") {
  const response = await fetch(API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.trim(), targetLanguage }),
  });

  let data = null;
  try { data = await response.json(); } catch {}

  if (!response.ok) {
    throw new Error(data?.error || "I couldn't get an explanation. Please check your internet connection and try again.");
  }

  return data;
}

export function speakMeaning(text, language = "en", callbacks = {}) {
  if (!("speechSynthesis" in window)) {
    callbacks.onError?.();
    throw new Error("Your browser does not support spoken responses.");
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "hi" ? "hi-IN" : language === "es" ? "es-ES" : language === "fr" ? "fr-FR" : language === "de" ? "de-DE" : "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()));
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => callbacks.onStart?.();
  utterance.onend = () => callbacks.onEnd?.();
  utterance.onerror = () => callbacks.onError?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
