// vendor session bridge
// this file fixes the "always shows the same vendor" problem by syncing the vendor ui using the saved login session
// idea: login page stores hawkerSessionUser_v1, then vendor pages read it and update header/sidebar text accordingly

(function () {
  // grab the session user that joseph's login page stores
  function readSession() {
    try {
      return JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null");
    } catch {
      return null;
    }
  }

  // turns a display name into nice initials for the avatar bubble (e.g. "clemens kitchen" -> "ck")
  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "v";
    const a = parts[0][0] || "";
    const b = parts.length > 1 ? (parts[parts.length - 1][0] || "") : "";
    return (a + b).toUpperCase() || "v";
  }

  // tries to find stall name based on the seed database (db.js)
  // this is only for display text (logo/title), not for real permissions
  function resolveStallNameFromSeed(vendorIdLower) {
    try {
      if (typeof window.loadDB === "function") {
        const db = window.loadDB();
        const stalls = Array.isArray(db?.stalls) ? db.stalls : [];
        const s = stalls.find((x) => String(x.vendorUserId || "").toLowerCase() === vendorIdLower);
        if (s?.name) return s.name;
      }
    } catch {}

    // fallback mapping for demo accounts if seed data isn't available
    if (vendorIdLower === "v2") return "indian corner";
    return "clemens kitchen";
  }

  // only run this script for vendors (so it doesn't mess up nea/customer screens)
  const u = readSession();
  if (!u || String(u.role || "").toUpperCase() !== "VENDOR") return;

  // normalize id so we can match it against seed data easily
  const vendorIdLower = String(u.id || "").toLowerCase();
  const idText = String(u.id || "").toUpperCase();
  if (!idText) return;

  // pick a display name that looks nice in the ui
  const displayName = String(u.username || u.fullName || u.id || "vendor");
  const ini = initials(displayName);

  // update the vendor id shown on the page (top header + sidebar)
  document.querySelectorAll(".user-id, .top-header-id").forEach((el) => {
    el.textContent = idText;
  });

  // update vendor name shown on the page (top header + sidebar)
  document.querySelectorAll(".user-name, .top-header-name").forEach((el) => {
    el.textContent = displayName;
  });

  // update avatar text so it matches the vendor name
  document.querySelectorAll(".user-avatar, .top-header-avatar").forEach((el) => {
    el.textContent = ini;
  });

  // update the stall title so it doesn't stay stuck on the previous vendor's stall
  const stallName = resolveStallNameFromSeed(vendorIdLower);
  const titleText = `fed hawker: ${stallName}`;

  const sidebarLogo = document.querySelector(".logo");
  if (sidebarLogo) sidebarLogo.textContent = titleText;

  const topTitle = document.querySelector(".top-header-title");
  if (topTitle) topTitle.textContent = titleText;
})();


