const ENGINES = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
};

export function buildSearchUrl(query, engine = "google") {
  return (ENGINES[engine] || ENGINES.google)(query);
}
export function buildMeaningUrl(query, engine = "google") {
  return buildSearchUrl(`meaning of ${query}`, engine);
}
export function buildWebsiteSearchUrl(base, query) {
  const url = new URL(base);
  if (url.hostname.includes("youtube.com")) return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  if (url.hostname.includes("github.com")) return `https://github.com/search?q=${encodeURIComponent(query)}`;
  if (url.hostname.includes("wikipedia.org")) return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
  if (url.hostname.includes("stackoverflow.com")) return `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`;
  return `${url.origin}/search?q=${encodeURIComponent(query)}`;
}
export function openInNewTab(url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsafe URL protocol");
    const tab = window.open(parsed.href, "_blank", "noopener,noreferrer");
    return Boolean(tab);
  } catch { return false; }
}