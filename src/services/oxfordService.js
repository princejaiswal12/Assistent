export async function fetchOxfordWord(word, dialect = "en-gb") {
  const response = await fetch(`/.netlify/functions/oxford?word=${encodeURIComponent(word)}&dialect=${encodeURIComponent(dialect)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Oxford pronunciation is unavailable.");
  return data;
}

export function speakFallback(text, onEnd, onError) {
  if (!("speechSynthesis" in window)) {
    onError?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onError?.();
  window.speechSynthesis.speak(utterance);
}