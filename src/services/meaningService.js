const DICTIONARY_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const TRANSLATE_URL = "https://api.mymemory.translated.net/get";

const LANGUAGE_CODES = {
  english: "en",
  hindi: "hi",
  spanish: "es",
  french: "fr",
  german: "de",
};

function cleanWord(text) {
  return text
    .replace(/^what does\s+/i, "")
    .replace(/^what is the meaning of\s+/i, "")
    .replace(/^what is\s+/i, "")
    .replace(/^what's\s+/i, "")
    .replace(/^define\s+/i, "")
    .replace(/^meaning of\s+/i, "")
    .replace(/^definition of\s+/i, "")
    .replace(/\s+(meaning|definition)\??$/i, "")
    .replace(/[?.!]+$/, "")
    .trim();
}

function isLikelyWord(text) {
  return /^[A-Za-z][A-Za-z'-]{1,40}$/.test(text);
}

function translationRequest(text) {
  const match = text.match(/^(.+?)\s+into\s+(English|Hindi|Spanish|French|German)\??$/i);
  if (!match) return null;
  return { text: match[1].trim(), language: LANGUAGE_CODES[match[2].toLowerCase()] };
}

async function translateText(text, target) {
  const response = await fetch(
    `${TRANSLATE_URL}?q=${encodeURIComponent(text)}&langpair=en|${target}`
  );
  if (!response.ok) throw new Error("Translation service is temporarily unavailable.");

  const data = await response.json();
  const translated = data?.responseData?.translatedText?.trim();
  if (!translated) throw new Error("No translation was returned.");
  return translated;
}

async function dictionaryLookup(word) {
  const response = await fetch(DICTIONARY_URL + encodeURIComponent(word));

  if (!response.ok) throw new Error("Dictionary result not found.");

  const data = await response.json();
  const entry = data?.[0];
  const firstMeaning = entry?.meanings?.find((item) => item.definitions?.length);
  const definition = firstMeaning?.definitions?.[0];

  if (!entry || !definition) throw new Error("No dictionary definition found.");

  const synonyms = [
    ...(definition.synonyms || []),
    ...(firstMeaning.synonyms || []),
  ].slice(0, 6);

  return {
    title: entry.word || word,
    phonetic: entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || "",
    meaning: definition.definition,
    simple: definition.definition,
    example: definition.example || "",
    usage: firstMeaning.partOfSpeech ? `Part of speech: ${firstMeaning.partOfSpeech}.` : "",
    similar: synonyms.join(", "),
    speechText: `${entry.word || word}. Meaning: ${definition.definition}.${definition.example ? ` Example: ${definition.example}.` : ""}`,
    provider: "Free Dictionary API",
  };
}

function localPhraseMeaning(text) {
  const normalized = text.toLowerCase();

  if (normalized.includes("break a leg")) {
    return {
      title: "break a leg",
      meaning: "An expression used to wish someone good luck, especially before a performance.",
      simple: "It means good luck.",
      usage: "Commonly said before a performance, exam, interview, or important event.",
      example: "You have your interview today? Break a leg!",
      speechText: "Break a leg means good luck. It is commonly said before a performance or important event.",
      provider: "Built-in phrase knowledge",
    };
  }

  if (normalized.includes("once in a blue moon")) {
    return {
      title: "once in a blue moon",
      meaning: "An expression meaning something happens very rarely.",
      simple: "It means almost never or only occasionally.",
      usage: "Used when an event does not happen often.",
      example: "I eat fast food once in a blue moon.",
      speechText: "Once in a blue moon means something happens very rarely, almost never.",
      provider: "Built-in phrase knowledge",
    };
  }

  return null;
}

export async function fetchMeaning(text, targetLanguage = "en") {
  const translation = translationRequest(text);

  if (translation) {
    const translated = await translateText(translation.text, translation.language);
    const languageName = translation.language === "hi" ? "Hindi" :
      translation.language === "es" ? "Spanish" :
      translation.language === "fr" ? "French" :
      translation.language === "de" ? "German" : "English";

    return {
      title: translation.text,
      meaning: translated,
      simple: `Translation into ${languageName}.`,
      translation: translated,
      speechText: `${translation.text}. In ${languageName}, that is: ${translated}.`,
      provider: "MyMemory public translation service",
    };
  }

  const query = cleanWord(text);
  const phrase = localPhraseMeaning(text);

  let result;

  if (phrase) {
    result = phrase;
  } else if (isLikelyWord(query)) {
    result = await dictionaryLookup(query);
  } else {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");

    result = {
      title: text,
      meaning: "I opened Google Search for this phrase or sentence.",
      simple: "The full result is available in the new Google tab.",
      speechText: `I opened Google Search for ${text}.`,
      provider: "Google Search",
    };
  }

  if (targetLanguage !== "en") {
    try {
      const translated = await translateText(result.meaning || result.simple || text, targetLanguage);
      result.translation = translated;
      result.speechText += ` Translation: ${translated}.`;
    } catch {
      result.translation = "Translation is temporarily unavailable.";
    }
  }

  return result;
}

export function speakMeaning(text, language = "en", callbacks = {}) {
  if (!("speechSynthesis" in window)) {
    callbacks.onError?.();
    throw new Error("Your browser does not support spoken responses.");
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang =
    language === "hi" ? "hi-IN" :
    language === "es" ? "es-ES" :
    language === "fr" ? "fr-FR" :
    language === "de" ? "de-DE" :
    "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase())
  );
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => callbacks.onStart?.();
  utterance.onend = () => callbacks.onEnd?.();
  utterance.onerror = () => callbacks.onError?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
