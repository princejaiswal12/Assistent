const API = "https://api.dictionaryapi.dev/api/v2/entries/en/";

export async function fetchMeaning(word) {
  const query = word.trim();
  if (!query) throw new Error("Please say a word or phrase.");

  const response = await fetch(API + encodeURIComponent(query));

  if (!response.ok) {
    throw new Error(`I couldn't find a meaning for “${query}”. Try saying a single English word.`);
  }

  const data = await response.json();
  const entry = data?.[0];
  const meanings = entry?.meanings || [];

  const definitions = meanings
    .flatMap((meaning) =>
      (meaning.definitions || []).slice(0, 2).map((definition) => ({
        partOfSpeech: meaning.partOfSpeech,
        definition: definition.definition,
        example: definition.example,
      }))
    )
    .slice(0, 4);

  if (!definitions.length) {
    throw new Error(`I couldn't find a definition for “${query}”.`);
  }

  return {
    word: entry.word || query,
    phonetic: entry.phonetic || "",
    definitions,
  };
}

export function speakMeaning(result) {
  if (!("speechSynthesis" in window)) {
    throw new Error("Text-to-speech is not supported in this browser.");
  }

  window.speechSynthesis.cancel();

  const parts = result.definitions.map((item, index) => {
    const prefix = item.partOfSpeech ? `${item.partOfSpeech}: ` : "";
    return `Definition ${index + 1}. ${prefix}${item.definition}${item.example ? ` Example: ${item.example}` : ""}`;
  });

  const utterance = new SpeechSynthesisUtterance(
    `${result.word}. ${parts.join(" ")}`
  );
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
