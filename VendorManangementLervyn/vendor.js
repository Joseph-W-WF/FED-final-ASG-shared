(function () {
  function getSession() {
    try { return JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null"); }
    catch { return null; }
  }
  function role(r){ return String(r || "").toUpperCase(); }

  const u = getSession();
  if (!u || role(u.role) !== "VENDOR") {
    // adjust path to your login page
    window.location.href = "../user-account-management-Joseph/HTML/account.html";
    return;
  }

  // Make vendor id available globally for any page scripts that need it
  window.LOGGED_IN_VENDOR_ID = u.id; // e.g. "v1" / "v2"
})();
