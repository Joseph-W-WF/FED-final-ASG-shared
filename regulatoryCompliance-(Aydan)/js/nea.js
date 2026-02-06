requireNEA();

var db = loadDB();

var priorityList = document.getElementById("priorityList");
var offendersList = document.getElementById("offendersList");
var expiryList = document.getElementById("expiryList");
var penaltiesList = document.getElementById("penaltiesList");

renderDashboard();

function renderDashboard() {
  db = loadDB();

  renderPriorityQueue();
  renderRepeatedOffenders();
  renderExpiryAlerts();
  renderLatestPenalties();
}

// ------------------ Priority Queue ------------------
// Simple scoring:
// - Last grade D = +100
// - Last grade C = +60
// - Last grade B = +20
// - Any penalty in last 30 days = +40
// - Grade expiring within 30 days = +50
function renderPriorityQueue() {
  var list = [];

  for (var i = 0; i < db.stalls.length; i++) {
    var s = db.stalls[i];
    var score = 0;

    var last = getLastGradeEntry(s);
    if (last) {
      if (last.grade === "D") score += 100;
      else if (last.grade === "C") score += 60;
      else if (last.grade === "B") score += 20;

      if (isExpiringSoon(last.expiryDate, 30)) score += 50;
    } else {
      // never inspected => medium priority
      score += 40;
    }

    if (hasRecentPenalty(s.id, 30)) score += 40;

    list.push({ stall: s, priorityScore: score, last: last });
  }

  list.sort(function (a, b) { return b.priorityScore - a.priorityScore; });

  var html = "<ol>";
  for (var j = 0; j < Math.min(5, list.length); j++) {
    var item = list[j];
    var lastText = item.last ? ("Last Grade: " + item.last.grade + " (" + item.last.date + ")") : "No inspections yet";
    html += "<li><strong>" + item.stall.name + "</strong> — " + lastText + " — Score: " + item.priorityScore + "</li>";
  }
  html += "</ol>";

  priorityList.innerHTML = html;
}

// ------------------ Repeated Offenders ------------------
// Repeat offender rule (simple):
// - 2 or more penalties in last 180 days OR
// - 2 or more CRITICAL violations in last 180 days
function renderRepeatedOffenders() {
  var offenders = [];

  for (var i = 0; i < db.stalls.length; i++) {
    var s = db.stalls[i];

    var pCount = countPenaltiesDays(s.id, 180);
    var cCount = countCriticalViolationsDays(s.id, 180);

    if (pCount >= 2 || cCount >= 2) {
      offenders.push({
        stall: s,
        penalties: pCount,
        critical: cCount
      });
    }
  }

  if (offenders.length === 0) {
    offendersList.innerHTML = "<p class='small'>No repeated offenders found.</p>";
    return;
  }

  var html = "<table class='table'><thead><tr><th>Stall</th><th>Penalties (180d)</th><th>Critical Violations (180d)</th></tr></thead><tbody>";
  for (var j = 0; j < offenders.length; j++) {
    html += "<tr><td>" + offenders[j].stall.name + "</td><td>" + offenders[j].penalties + "</td><td>" + offenders[j].critical + "</td></tr>";
  }
  html += "</tbody></table>";

  offendersList.innerHTML = html;
}

// ------------------ Grade Expiry Alerts ------------------
function renderExpiryAlerts() {
  var soon = [];
  for (var i = 0; i < db.stalls.length; i++) {
    var s = db.stalls[i];
    var last = getLastGradeEntry(s);
    if (!last) continue;

    if (isExpiringSoon(last.expiryDate, 30)) {
      soon.push({ stall: s, expiryDate: last.expiryDate, grade: last.grade });
    }
  }

  if (soon.length === 0) {
    expiryList.innerHTML = "<p class='small'>No grades expiring within 30 days.</p>";
    return;
  }

  var html = "<ul>";
  for (var j = 0; j < soon.length; j++) {
    html += "<li><strong>" + soon[j].stall.name + "</strong> — Grade " + soon[j].grade + " expires on <strong>" + soon[j].expiryDate + "</strong></li>";
  }
  html += "</ul>";

  expiryList.innerHTML = html;
}

// ------------------ Latest penalties ------------------
function renderLatestPenalties() {
  var p = db.penalties || [];
  if (p.length === 0) {
    penaltiesList.innerHTML = "<p class='small'>No penalties yet.</p>";
    return;
  }

  // sort newest first
  var copy = p.slice();
  copy.sort(function (a, b) {
    return new Date(b.createdDateTime) - new Date(a.createdDateTime);
  });

  var html = "<table class='table'><thead><tr><th>Stall</th><th>Action</th><th>Date</th></tr></thead><tbody>";
  for (var i = 0; i < Math.min(6, copy.length); i++) {
    var item = copy[i];
    html += "<tr><td>" + stallName(item.stallId) + "</td><td>" + item.action + "</td><td>" + item.createdDateTime.slice(0, 10) + "</td></tr>";
  }
  html += "</tbody></table>";

  penaltiesList.innerHTML = html;
}

// ------------------ Helpers ------------------
function getLastGradeEntry(stall) {
  var h = stall.gradeHistory || [];
  if (h.length === 0) return null;

  // last entry is latest if you always push newest
  return h[h.length - 1];
}

function isExpiringSoon(expiryDate, days) {
  if (!expiryDate) return false;
  var now = new Date();
  var exp = new Date(expiryDate);

  var diffMs = exp - now;
  var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

function hasRecentPenalty(stallId, days) {
  return countPenaltiesDays(stallId, days) > 0;
}

function countPenaltiesDays(stallId, days) {
  var p = db.penalties || [];
  var count = 0;
  var now = new Date();

  for (var i = 0; i < p.length; i++) {
    if (p[i].stallId !== stallId) continue;
    var dt = new Date(p[i].createdDateTime);
    var diffDays = Math.floor((now - dt) / (1000 * 60 * 60 * 24));
    if (diffDays <= days) count++;
  }
  return count;
}

function countCriticalViolationsDays(stallId, days) {
  var now = new Date();
  var count = 0;

  var inspections = db.inspections || [];
  var violations = db.inspectionViolations || [];

  for (var i = 0; i < inspections.length; i++) {
    if (inspections[i].stallId !== stallId) continue;

    var conducted = inspections[i].conductedDate;
    if (!conducted) continue;

    var dt = new Date(conducted);
    var diffDays = Math.floor((now - dt) / (1000 * 60 * 60 * 24));
    if (diffDays > days) continue;

    // count critical violations for this inspection
    for (var j = 0; j < violations.length; j++) {
      if (violations[j].inspectionId === inspections[i].id && violations[j].severity === "CRITICAL") {
        count++;
      }
    }
  }

  return count;
}

function stallName(stallId) {
  for (var i = 0; i < db.stalls.length; i++) {
    if (db.stalls[i].id === stallId) return db.stalls[i].name;
  }
  return stallId;
}
