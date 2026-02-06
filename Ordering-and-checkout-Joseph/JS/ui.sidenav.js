window.FED = window.FED || {};

FED.sidenav = (() => {
  const sidenav = document.getElementById("sidenav");
  const backdrop = document.getElementById("sidenavBackdrop");
  const openBtn = document.getElementById("sidenavOpenBtn");
  const closeBtn = document.getElementById("sidenavCloseBtn");

  function open() {
    if (!sidenav) return;
    sidenav.classList.add("is-open");
    if (backdrop) backdrop.classList.add("is-open");
  }

  function close() {
    if (!sidenav) return;
    sidenav.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
  }

  function init() {
    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  return { init, open, close };
})();
