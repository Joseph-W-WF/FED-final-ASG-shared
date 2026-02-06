window.FED = window.FED || {};

FED.utils = (() => {
  function money(n) {
    return `$${Number(n).toFixed(2)}`;
  }

  function uid() {
    return `o_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { money, uid, loadJSON, saveJSON, escapeHTML };
})();
