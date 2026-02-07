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



  // Generates a lightweight inline SVG placeholder so menu items always have a "picture".
  // If you later add real photos, just set item.img in data.js and it will use that instead.
  function foodPlaceholder(title) {
    const label = String(title || "Food").trim().split(/\s+/)[0].slice(0, 10);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="160" height="160" rx="24" fill="url(#g)"/>
  <text x="80" y="92" text-anchor="middle" font-family="Inter, Arial" font-size="22" fill="#ffffff" font-weight="700">${label}</text>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  return { money, uid, loadJSON, saveJSON, escapeHTML, foodPlaceholder };
})();
