const GOOGLE_URL = "https://translation.googleapis.com/language/translate/v2";

function cleanText(value) {
  return String(value || "").trim().slice(0, 4000);
}

async function googleTranslate(text, target, key) {
  const url = new URL(GOOGLE_URL);
  url.searchParams.set("key", key);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target, format: "text" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Google translation failed.");
  return data?.data?.translations?.[0]?.translatedText || "";
}

function explainEnglish(text) {
  const word = text
    .replace(/^what(?:'s| is)\s+(?:the\s+)?(?:meaning\s+of\s+)?/i, "")
    .replace(/^define\s+/i, "")
    .replace(/[?.!]+$/, "").trim();

  const idioms = [
    [/\bbreak a leg\b/i, "It means good luck. It is commonly said before a performance or important event."],
    [/\bonce in a blue moon\b/i, "It means something happens very rarely, almost never."],
  ];
  const idiom = idioms.find(([pattern]) => pattern.test(text));
  if (idiom) {
    const pieces = idiom[1].split(". ");
    return {
      title: word || text,
      meaning: pieces[0] + ".",
      simple: idiom[1],
      usage: pieces.slice(1).join(" "),
      speechText: (word || text) + ". " + idiom[1],
    };
  }

  if (/^explain (this )?sentence[: ]/i.test(text) || /^(?:he|she|i|we|they|it|this|that)\b/i.test(text)) {
    return {
      title: "Sentence",
      meaning: "This sentence describes the situation expressed by the words you provided.",
      simple: "In simple words, it tells us what is happening or what the speaker means.",
      grammar: "Google Translate provides translation, not full grammar analysis. A richer grammar explanation can be added through a dedicated AI explanation provider.",
      speechText: "Here is the meaning. " + text + ". This sentence describes the situation expressed by the words you provided. In simple words, it tells us what is happening or what the speaker means.",
    };
  }

  return {
    title: word || text,
    meaning: "The online translation service can translate this text, but it does not provide a full dictionary-style explanation for every word or phrase.",
    simple: "Use the language selector to get a translation of the text.",
    speechText: "The online translation service can translate this text. Use the language selector to get a translation.",
  };
}

export default async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers: { "Content-Type": "application/json" } });

  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: "Meaning service is not configured. Add GOOGLE_TRANSLATE_API_KEY in Netlify environment variables." }), { status: 503, headers: { "Content-Type": "application/json" } });

  try {
    const body = JSON.parse(req.body || "{}");
    const text = cleanText(body.text);
    const requested = String(body.targetLanguage || "en").toLowerCase();
    const target = new Set(["en","hi","es","fr","de"]).has(requested) ? requested : "en";
    if (!text) return new Response(JSON.stringify({ error: "Please provide text to explain." }), { status: 400, headers: { "Content-Type": "application/json" } });

    const translation = await googleTranslate(text, target, key);
    const base = explainEnglish(text);
    return new Response(JSON.stringify({
      ...base,
      translation: target === "en" ? "" : translation,
      speechText: target === "en" ? base.speechText : base.speechText + " Translation: " + translation + ".",
      provider: "Google Cloud Translation",
    }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Unable to explain the text." }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
};