var DEV_BYPASS = true; // 🔴 CHANGE TO false LATER

function requireNEA() {
  if (DEV_BYPASS) return;

  var role = sessionStorage.getItem("sessionRole");
  if (role !== "NEA") {
    alert("Access denied. NEA accounts only.");
    window.location.href = "index.html";
  }
}
