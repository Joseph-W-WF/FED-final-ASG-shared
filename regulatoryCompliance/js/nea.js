nea.js
requireNEA();
var db = loadDB();

var summary = document.getElementById("summary");

summary.innerHTML =
  "<p>Total stalls: " + db.stalls.length + "</p>" +
  "<p>Total inspections: " + db.inspections.length + "</p>";