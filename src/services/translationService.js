export async function translateText(text, targetLanguage = "en") {
  const response = await fetch("/api/meaning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguage, mode: "translate" }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Translation is unavailable.");
  return data.translation || "";
}