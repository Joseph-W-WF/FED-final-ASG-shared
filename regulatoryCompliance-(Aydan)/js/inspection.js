requireNEA();

var db = loadDB();

var stallSelect = document.getElementById("stallSelect");
var scheduledDateInput = document.getElementById("scheduledDate");
var conductedDateInput = document.getElementById("conductedDate");
var scoreInput = document.getElementById("score");
var remarksInput = document.getElementById("remarks");

var violationSelect = document.getElementById("violationSelect");
var addViolationBtn = document.getElementById("addViolationBtn");
var violationListDiv = document.getElementById("violationList");

var saveBtn = document.getElementById("saveBtn");
var msg = document.getElementById("msg");

var selectedViolations = []; // [{code,title,severity}]

// ---- setup stall dropdown ----
for (var i = 0; i < db.stalls.length; i++) {
  var o = document.createElement("option");
  o.value = db.stalls[i].id;
  o.textContent = db.stalls[i].name;
  stallSelect.appendChild(o);
}

// ---- setup default dates ----
var today = new Date().toISOString().slice(0, 10);
conductedDateInput.value = today;

// ---- setup violation dropdown ----
if (!db.violationCatalog) db.violationCatalog = [];

for (var j = 0; j < db.violationCatalog.length; j++) {
  var v = db.violationCatalog[j];
  var opt = documents
 erElement("option");
  opt.value = v.code;
  opt.textContent = v.code + " - " + v.title + " (" + v.severityDefault + ")";
  violationSelect.appendChild(opt);
}

addViolationBtn.addEventListener("click", function () {
  var code = violationSelect.value;
  var v = findViolationFromCatalog(code);
  if (!v) return;

  // prevent duplicates
  for (var i = 0; i < selectedViolations.length; i++) {
    if (selectedViolations[i].code === code) {
      alert("This violation is already added.");
      return;
    }
  }

  selectedViolations.push({
    code: v.code,
    title: v.title,
    severity: v.severityDefault
  });

  renderViolations();
});

function renderViolations() {
  if (selectedViolations.length === 0) {
    violationListDiv.innerHTML = "<p class='small'>No violations added.</p>";
    return;
  }

  var html = "<table class='table'><thead><tr>" +
    "<th>Code</th><th>Title</th><th>Severity</th><th>Remove</th>" +
    "</tr></thead><tbody>";

  for (var i = 0; i < selectedViolations.length; i++) {
    var v = selectedViolations[i];
    html += "<tr>" +
      "<td>" + v.code + "</td>" +
      "<td>" + v.title + "</td>" +
      "<td>" + v.severity + "</td>" +
      "<td><button type='button' onclick='removeViolation(\"" + v.code + "\")'>Remove</button></td>" +
      "</tr>";
  }

  html += "</tbody></table>";
  violationListDiv.innerHTML = html;
}

window.removeViolation = function (code) {
  var next = [];
  for (var i = 0; i < selectedViolations.length; i++) {
    if (selectedViolations[i].code !== code) next.push(selectedViolations[i]);
  }
  selectedViolations = next;
  renderViolations();
};

renderViolations();

// ---- save inspection ----
saveBtn.addEventListener("click", function () {
  msg.textContent = "";

  var stallId = stallSelect.value;
  var scheduledDate = scheduledDateInput.value || null;
  var conductedDate = conductedDateInput.value;
  var score = Number(scoreInput.value);
  var remarks = remarksInput.value;

  if (!stallId || !conductedDate || isNaN(score)) {
    msg.textContent = "Please fill in Stall, Conducted Date, and Score.";
    return;
  }
  if (score < 0 || score > 100) {
    msg.textContent = "Score must be between 0 and 100.";
    return;
  }

  // compute grade
  var grade = scoreToGrade(score);

  // create inspection record
  if (!db.inspections) db.inspections = [];
  var inspectionId = makeId("insp");

  var inspection = {
    id: inspectionId,
    stallId: stallId,
    officerId: "nea1", // simple demo
    scheduledDate: scheduledDate,
    conductedDate: conductedDate,
    score: score,
    grade: grade,
    remarks: remarks
  };
  db.inspections.push(inspection);

  // save violations linked to this inspection
  if (!db.inspectionViolations) db.inspectionViolations = [];
  for (var i = 0; i < selectedViolations.length; i++) {
    var v = selectedViolations[i];
    db.inspectionViolations.push({
      id: makeId("vio"),
      inspectionId: inspectionId,
      code: v.code,
      title: v.title,
      severity: v.severity,
      notes: ""
    });
  }

  // update stall grade history (for transparency + trends)
  var stall = findStallById(stallId);
  if (!stall.gradeHistory) stall.gradeHistory = [];

  // grade expiry: 180 days after conducted date
  var expiryDate = addDaysToDate(conductedDate, 180);

  stall.gradeHistory.push({
    date: conductedDate,       // kept for history
    grade: grade,
    score: score,
    expiryDate: expiryDate
  });

  // automated penalties (simple rules)
  applyPenaltyRules(db, inspectionId, stallId, grade);

  saveDB(db);

  // reset UI
  scoreInput.value = "";
  remarksInput.value = "";
  selectedViolations = [];
  renderViolations();

  msg.textContent = "Saved. Grade: " + grade + " (expires on " + expiryDate + ")";
});

function findStallById(stallId) {
  for (var i = 0; i < db.stalls.length; i++) {
    if (db.stalls[i].id === stallId) return db.stalls[i];
  }
  return null;
}

function findViolationFromCatalog(code) {
  for (var i = 0; i < db.violationCatalog.length; i++) {
    if (db.violationCatalog[i].code === code) return db.violationCatalog[i];
  }
  return null;
}

// ---- automated penalties (excluding notifications) ----
function applyPenaltyRules(db, inspectionId, stallId, grade) {
  if (!db.penalties) db.penalties = [];

  var hasCritical = false;
  var vioCount = 0;

  for (var i = 0; i < db.inspectionViolations.length; i++) {
    var v = db.inspectionViolations[i];
    if (v.inspectionId !== inspectionId) continue;
    vioCount++;
    if (v.severity === "CRITICAL") hasCritical = true;
  }

  // Rule set (beginner-friendly):
  // 1) Grade D OR any CRITICAL -> WARNING + REINSPECTION
  // 2) Grade C with many violations (>=2) -> WARNING
  // 3) Grade A/B -> no penalty

  if (grade === "D" || hasCritical) {
    db.penalties.push({
      id: makeId("pen"),
      stallId: stallId,
      inspectionId: inspectionId,
      action: "WARNING",
      createdDateTime: new Date().toISOString()
    });
    db.penalties.push({
      id: makeId("pen"),
      stallId: stallId,
      inspectionId: inspectionId,
      action: "REINSPECTION",
      createdDateTime: new Date().toISOString()
    });
    return;
  }

  if (grade === "C" && vioCount >= 2) {
    db.penalties.push({
      id: makeId("pen"),
      stallId: stallId,
      inspectionId: inspectionId,
      action: "WARNING",
      createdDateTime: new Date().toISOString()
    });
  }
}
