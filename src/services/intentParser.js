import { buildMeaningUrl, buildSearchUrl, buildWebsiteSearchUrl } from "./searchService";

const BUILTIN = {
  youtube: "https://www.youtube.com",
  github: "https://github.com",
  google: "https://www.google.com",
  wikipedia: "https://www.wikipedia.org",
  linkedin: "https://www.linkedin.com",
  reddit: "https://www.reddit.com",
  amazon: "https://www.amazon.com",
  stackoverflow: "https://stackoverflow.com",
  chatgpt: "https://chatgpt.com",
};

function clean(text) {
  return text.trim().replace(/\s+/g, " ");
}

function stripPrefix(text, prefixes) {
  for (const prefix of prefixes) {
    if (text.toLowerCase().startsWith(prefix.toLowerCase())) return text.slice(prefix.length).trim();
  }
  return text;
}

export function parseIntent(input, { engine = "google", websites = {} } = {}) {
  const original = clean(input);
  const text = original.toLowerCase();
  if (!original) return { type: "UNKNOWN", query: "", url: null, label: "Empty command" };

  const sites = { ...BUILTIN, ...websites };

  if (/^(what does|what do)\s+.+\s+mean\??$/.test(text)) {
    const query = original.replace(/^(what does|what do)\s+/i, "").replace(/\s+mean\??$/i, "").trim();
    return { type: "MEANING", query, url: buildMeaningUrl(query, engine), label: `Definition: ${query}` };
  }
  if (/^(meaning of|define|definition of)\s+/.test(text)) {
    const query = stripPrefix(original, ["meaning of ", "define ", "definition of "]);
    return { type: "MEANING", query, url: buildMeaningUrl(query, engine), label: `Definition: ${query}` };
  }

  const siteSearch = text.match(/^search\s+(.+?)\s+for\s+(.+)$/i);
  if (siteSearch) {
    const siteName = siteSearch[1].trim().toLowerCase();
    const query = original.slice(original.toLowerCase().indexOf(" for ") + 5).trim();
    const base = sites[siteName];
    if (base) {
      return { type: siteName.toUpperCase(), query, url: buildWebsiteSearchUrl(base, query), label: `${siteName}: ${query}` };
    }
  }

  const playYoutube = text.match(/^(play|watch)\s+(.+?)(\s+on\s+youtube)?$/i);
  if (playYoutube && (text.includes("youtube") || text.startsWith("play ") || text.startsWith("watch "))) {
    const query = original.replace(/^(play|watch)\s+/i, "").replace(/\s+on\s+youtube$/i, "").trim();
    return { type: "YOUTUBE", query, url: buildWebsiteSearchUrl(sites.youtube, query), label: `YouTube: ${query}` };
  }

  const openMatch = text.match(/^(open|go to|launch|visit)\s+(.+)$/i);
  if (openMatch) {
    const name = openMatch[2].trim().toLowerCase();
    const base = sites[name];
    if (base) return { type: name.toUpperCase(), query: name, url: base, label: `Open ${name}` };
  }

  const searchQuery = stripPrefix(original, ["search for ", "search ", "look up ", "find "]);
  if (searchQuery !== original || /^(what|who|when|where|why|how|can|is|are|tell me)\b/i.test(original)) {
    return { type: "SEARCH", query: searchQuery, url: buildSearchUrl(searchQuery, engine), label: `Search: ${searchQuery}` };
  }

  return { type: "SEARCH", query: original, url: buildSearchUrl(original, engine), label: `Search: ${original}` };
}