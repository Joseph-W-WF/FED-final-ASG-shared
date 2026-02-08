// nea sidebar + guard
// this runs on every nea page to do 3 things:
// 1) block non-nea users by redirecting back to the account/login page
// 2) fill in the nea officer name/id in the sidebar bottom card
// 3) wire the top-left toggle button to collapse/expand the sidebar (no floating button)

document.addEventListener("DOMContentLoaded", () => {
  const ACCOUNT_URL = "../../user-account-management-Joseph/HTML/account.html";

  // read session stored by the login flow
  function getSessionUser() {
    try {
      return JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null");
    } catch {
      return null;
    }
  }

  // guard: if the role isn't nea, we bounce the user back to login
  const user = getSessionUser();
  if (!user || String(user.role || "").toUpperCase() !== "NEA") {
    window.location.href = ACCOUNT_URL;
    return;
  }

  // update sidebar officer card so it reflects the logged in nea account
  const nameEl = document.querySelector(".sidebar-bottom .user-name");
  const subEl = document.querySelector(".sidebar-bottom .user-sub");
  if (nameEl) nameEl.textContent = user.fullName || user.username || "nea officer";
  if (subEl) subEl.textContent = user.username || user.id || "";

  // add a logout link into the sidebar nav (only once)
  // logout clears session keys so protected pages will redirect next time
  const nav = document.querySelector("aside.sidebar .nav");
  if (nav && !document.getElementById("neaLogoutLink")) {
    const a = document.createElement("a");
    a.className = "nav-item";
    a.id = "neaLogoutLink";
    a.href = "#";
    a.innerHTML = '<span class="nav-icon">⎋</span><span>logout</span>';

    a.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("hawkerSessionUser_v1");
      localStorage.removeItem("hawkerSessionRole_v1");
      window.location.href = ACCOUNT_URL;
    });

    nav.appendChild(a);
  }

  // sidebar toggle: adds/removes a body class that css uses to slide the sidebar
  const btn = document.getElementById("sidebarToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
  });
});
