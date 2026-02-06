window.FED = window.FED || {};

FED.router = (() => {
  FED.state = FED.state || {
    route: "browse",
    selectedStallId: FED.data?.STALLS?.[0]?.id || null,
    checkoutVendorId: null,
    orderTab: "Received",
    stallSearch: "",
    menuSearch: "",
    menuSort: "popular",
    orderSearch: "",
    orderSort: "newest",
  };

  const pages = {
    browse: document.getElementById("page-browse"),
    menu: document.getElementById("page-menu"),
    cart: document.getElementById("page-cart"),
    orders: document.getElementById("page-orders"),
    checkout: document.getElementById("page-checkout"),
    profile: document.getElementById("page-profile"),
  };

  const routeHandlers = {}; // route -> function

  function registerRoute(route, fn) {
    routeHandlers[route] = fn;
  }

  function go(route) {
    FED.state.route = route;

    Object.entries(pages).forEach(([r, el]) => {
      if (!el) return;
      el.classList.toggle("is-active", r === route);
    });

    // Keep "Browse stalls" highlighted even when user is inside a menu.
    const navRoute = (route === "menu") ? "browse" : route;
    document.querySelectorAll(".nav__link").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.route === navRoute);
    });

    if (FED.profile?.closeDropdown) FED.profile.closeDropdown();

    if (routeHandlers[route]) routeHandlers[route]();
  }

  function init() {
    document.addEventListener("click", (e) => {
      const routeBtn = e.target.closest("[data-route]");
      if (routeBtn) {
        e.preventDefault();
        go(routeBtn.dataset.route);
      }
    });

    // default route
    go("browse");
  }

  return { init, go, registerRoute };
})();
