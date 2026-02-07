
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sidebarToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
  });
});
