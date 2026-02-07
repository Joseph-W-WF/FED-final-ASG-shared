// vendorSessionBridge.js
// Sync Vendor UI (V1/V2 + name/avatar) from hawkerSessionUser_v1 before vendor-management.js reads it.

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

  const u = readSession();
  if (!u || String(u.role || "").toUpperCase() !== "VENDOR") return;

  // account.js stores { id: "v1", role:"VENDOR", username:"..." }
  const idText = String(u.id || "").toUpperCase(); // "V1"
  if (!idText) return;

  const displayName = String(u.username || u.fullName || u.id || "Vendor");

  // Update IDs shown on page (vendor-management.js reads these)
  document.querySelectorAll(".user-id, .top-header-id").forEach((el) => {
    el.textContent = idText;
  });

  // Update names (cosmetic)
  document.querySelectorAll(".user-name, .top-header-name").forEach((el) => {
    el.textContent = displayName;
  });

  // Update avatar initials (cosmetic)
  const ini = initials(displayName);
  document.querySelectorAll(".user-avatar, .top-header-avatar").forEach((el) => {
    el.textContent = ini;
  });
})();
