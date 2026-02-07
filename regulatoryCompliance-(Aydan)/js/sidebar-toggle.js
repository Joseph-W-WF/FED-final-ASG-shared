document.addEventListener("DOMContentLoaded", () => {
  const ACCOUNT_URL = "../../user-account-management-Joseph/HTML/account.html";

  function getSessionUser() {
    try {
      return JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null");
    } catch {
      return null;
    }
  }

  // Guard: NEA pages require an NEA session
  const user = getSessionUser();
  if (!user || String(user.role || "").toUpperCase() !== "NEA") {
    window.location.href = ACCOUNT_URL;
    return;
  }

  // Update NEA sidebar user card (if present)
  const nameEl = document.querySelector(".sidebar-bottom .user-name");
  const subEl = document.querySelector(".sidebar-bottom .user-sub");
  if (nameEl) nameEl.textContent = user.fullName || user.username || "NEA Officer";
  if (subEl) subEl.textContent = user.username || user.id || "";

  // Add Logout item to the NEA sidebar nav (if not already there)
  const nav = document.querySelector("aside.sidebar .nav");
  if (nav && !document.getElementById("neaLogoutLink")) {
    const a = document.createElement("a");
    a.className = "nav-item";
    a.id = "neaLogoutLink";
    a.href = "#";
    a.innerHTML = '<span class="nav-icon">⎋</span><span>Logout</span>';
    a.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("hawkerSessionUser_v1");
      localStorage.removeItem("hawkerSessionRole_v1");
      window.location.href = ACCOUNT_URL;
    });
    nav.appendChild(a);
  }

  // Existing sidebar toggle behavior
  const btn = document.getElementById("sidebarToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
  });
});
