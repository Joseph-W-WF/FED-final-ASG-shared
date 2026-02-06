window.FED = window.FED || {};
FED.pages = FED.pages || {};

FED.pages.browse = (() => {
  const { escapeHTML } = FED.utils;
  const { STALLS } = FED.data;

  const stallListEl = document.getElementById("stallList");

  function renderStalls() {
    const q = (FED.state.stallSearch || "").toLowerCase().trim();
    const stalls = STALLS.filter(s => !q || s.name.toLowerCase().includes(q));

    stallListEl.innerHTML = stalls.map(stall => {
      const tags = [
        ...stall.cuisines.map(c => `<span class="tag">${escapeHTML(c)}</span>`),
        `<span class="tag">Hygiene ${escapeHTML(stall.hygiene)}</span>`
      ].join("");

      return `
        <button class="stallTile" type="button" data-stall="${stall.id}">
          <div class="stallTile__name">${escapeHTML(stall.name)}</div>
          <div class="stallTile__meta">${tags}</div>
          <div class="small">Tap to view menu →</div>
        </button>
      `;
    }).join("");

    stallListEl.querySelectorAll("[data-stall]").forEach(btn => {
      btn.addEventListener("click", () => {
        FED.state.selectedStallId = btn.dataset.stall;
        FED.router.go("menu");
      });
    });
  }

  function init() {
    document.getElementById("stallSearch").addEventListener("input", (e) => {
      FED.state.stallSearch = e.target.value;
      renderStalls();
    });

    FED.router.registerRoute("browse", () => renderStalls());
  }

  return { init };
})();
