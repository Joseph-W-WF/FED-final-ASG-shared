// js/inspection.js
requireNEA();

var db = loadDB();

var stallSelect = document.getElementById("stallSelect");
var msg = document.getElementById("msg");

// SAFETY CHECK
if (!db || !db.stalls) {
  msg.textContent = "Error: Database not loaded (db.js path issue).";
} else if (db.stalls.length === 0) {
  msg.textContent = "No stalls found in database. Try resetting DB.";
} else {
  // Fill dropdown
  for (var i = 0; i < db.stalls.length; i++) {
    var opt = document.createElement("option");
    opt.value = db.stalls[i].id;
    opt.textContent = db.stalls[i].name;
    stallSelect.appendChild(opt);
  }
}

document.getElementById("saveBtn").addEventListener("click", function () {
  msg.textContent = "";

  var stallId = stallSelect.value;
  var date = document.getElementById("date").value;
  var scoreStr = document.getElementById("score").value;
  var score = Number(scoreStr);
  var remarks = document.getElementById("remarks").value;

  if (!stallId) {
    msg.textContent = "Please select a stall.";
    return;
  }
  if (!date) {
    msg.textContent = "Please select a date.";
    return;
  }
  if (scoreStr === "" || isNaN(score)) {
    msg.textContent = "Please enter a valid score.";
    return;
  }

  var grade = scoreToGrade(score);
  var expiry = addDaysToDate(date, 90);

  // Save inspection record
  db.inspections.push({
    id: makeId("insp"),
    stallId: stallId,
    conductedDate: date,
    score: score,
    grade: grade,
    remarks: remarks
  });

  // Update grade history for that stall (no .find / arrow functions)
  var stall = null;
  for (var i = 0; i < db.stalls.length; i++) {
    if (db.stalls[i].id === stallId) {
      stall = db.stalls[i];
      break;
    }
  }

  if (stall === null) {
    msg.textContent = "Error: Stall not found in DB.";
    return;
  }

  stall.gradeHistory.push({
    grade: grade,
    date: date,
    expiryDate: expiry
  });

  saveDB(db);

  msg.textContent = "Saved. Grade: " + grade + " (expires " + expiry + ")";
});
