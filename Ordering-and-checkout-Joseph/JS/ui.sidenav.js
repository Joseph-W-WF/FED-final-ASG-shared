window.FED = window.FED || {};

FED.sidenav = (() => {
  const sidenav = document.getElementById("sidenav");
  const backdrop = document.getElementById("sidenavBackdrop");
  const openBtn = document.getElementById("sidenavOpenBtn");
  const closeBtn = document.getElementById("sidenavCloseBtn");

  const KEY = "fed_sidenav_collapsed"; // desktop only
  const mql = window.matchMedia("(max-width: 980px)");

  function isMobile() {
    return !!mql.matches;
  }

  function setBodyCollapsed(v) {
    document.body.classList.toggle("sidenav-collapsed", !!v);
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (_) {}
  }

  function lockScroll(locked) {
    // only lock when the mobile drawer is open
    document.body.style.overflow = locked ? "hidden" : "";
  }

  // Open menu
  function open() {
    if (!sidenav) return;

    if (isMobile()) {
      sidenav.classList.add("is-open");
      if (backdrop) backdrop.classList.add("is-open");
      lockScroll(true);
    } else {
      // desktop: expand sidebar
      setBodyCollapsed(false);
    }
  }

  // Close menu
  function close() {
    if (!sidenav) return;

    if (isMobile()) {
      sidenav.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-open");
      lockScroll(false);
    } else {
      // desktop: collapse sidebar (like your friend's UI)
      setBodyCollapsed(true);
    }
  }

  function restoreDesktopState() {
    // Only apply saved "collapsed" on desktop
    if (isMobile()) return;
    try {
      const saved = localStorage.getItem(KEY) === "1";
      document.body.classList.toggle("sidenav-collapsed", saved);
    } catch (_) {}
  }

  function init() {
    restoreDesktopState();

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    // On mobile: clicking any nav item should close the drawer
    document.querySelectorAll(".routeLink").forEach((el) => {
      el.addEventListener("click", () => {
        if (isMobile()) close();
      });
    });

    // When switching between mobile/desktop, clear mobile drawer state
    mql.addEventListener?.("change", () => {
      if (!sidenav) return;
      // Always close the mobile drawer when resizing
      sidenav.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-open");
      lockScroll(false);
      restoreDesktopState();
    });

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  return { init, open, close };
})();
