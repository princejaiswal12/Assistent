export const DEFAULT_WEBSITES = {
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

export function normalizeWebsiteName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateWebsiteUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, message: "Only HTTP/HTTPS URLs are allowed." };
    }
    return { valid: true, url: url.href };
  } catch {
    return { valid: false, message: "Enter a valid website URL." };
  }
}