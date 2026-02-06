// regulatoryCompliance-(Aydan)/js/neaGuard.js
// DEV MODE: allow access without login first.
// Later, set DEV_MODE = false when your teammate finishes login.

var DEV_MODE = true;

function requireNEA() {
  if (DEV_MODE) return;

  var role = localStorage.getItem("currentRole");
  if (role !== "NEA") {
    alert("NEA access only.");
    window.location.href = "../../index.html";
  }
}
