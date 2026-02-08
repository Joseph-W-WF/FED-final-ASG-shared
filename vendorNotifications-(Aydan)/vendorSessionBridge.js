// vendorSessionBridge.js
// Sync Vendor UI (V1/V2 + name/avatar + stall title) from session.

(function () {
  function readSession() {
    try {
      return JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null");
    } catch {
      return null;
    }
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "V";
    const a = parts[0][0] || "";
    const b = parts.length > 1 ? (parts[parts.length - 1][0] || "") : "";
    return (a + b).toUpperCase() || "V";
  }

  function resolveStallNameFromSeed(vendorIdLower) {
    // Prefer local db.js seed (fast + reliable for display)
    try {
      if (typeof window.loadDB === "function") {
        const db = window.loadDB();
        const stalls = Array.isArray(db?.stalls) ? db.stalls : [];
        const s = stalls.find(x => String(x.vendorUserId || "").toLowerCase() === vendorIdLower);
        if (s?.name) return s.name;
      }
    } catch {}

    // fallback mapping
    if (vendorIdLower === "v2") return "Indian Corner";
    return "Clemens Kitchen";
  }

  const u = readSession();
  if (!u || String(u.role || "").toUpperCase() !== "VENDOR") return;

  const vendorIdLower = String(u.id || "").toLowerCase();      // "v2"
  const idText = String(u.id || "").toUpperCase();             // "V2"
  if (!idText) return;

  const displayName = String(u.username || u.fullName || u.id || "Vendor");
  const ini = initials(displayName);

  // ✅ Update IDs shown on page
  document.querySelectorAll(".user-id, .top-header-id").forEach((el) => {
    el.textContent = idText;
  });

  // ✅ Update names shown on page
  document.querySelectorAll(".user-name, .top-header-name").forEach((el) => {
    el.textContent = displayName;
  });

  // ✅ Update avatar initials
  document.querySelectorAll(".user-avatar, .top-header-avatar").forEach((el) => {
    el.textContent = ini;
  });

  // ✅ Update stall title text ("FED Hawker: ...") in BOTH places
  const stallName = resolveStallNameFromSeed(vendorIdLower);
  const titleText = `FED Hawker: ${stallName}`;

  const sidebarLogo = document.querySelector(".logo");
  if (sidebarLogo) sidebarLogo.textContent = titleText;

  const topTitle = document.querySelector(".top-header-title");
  if (topTitle) topTitle.textContent = titleText;
})();

