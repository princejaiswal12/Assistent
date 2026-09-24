export function createDuplicateDetector(windowMs = 3000) {
  let lastText = "";
  let lastTime = 0;

  return {
    isDuplicate(text) {
      const now = Date.now();
      const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
      const duplicate = normalized === lastText && now - lastTime < windowMs;
      if (!duplicate) {
        lastText = normalized;
        lastTime = now;
      }
      return duplicate;
    },
    reset() {
      lastText = "";
      lastTime = 0;
    },
  };
}