function clean(text) {
  return text.trim().replace(/\s+/g, " ");
}

export function parseMeaningQuery(input) {
  const original = clean(input);
  if (!original) return "";

  return original
    .replace(/^(what is|what's|what are|who is|who's|define|definition of|meaning of)\s+/i, "")
    .replace(/\s+(meaning|definition)\??$/i, "")
    .trim();
}
