// regulatoryCompliance-(Aydan)/js/inspection.js
document.addEventListener("DOMContentLoaded", function () {
  // NOTE: loadDB(), saveDB(), makeId(), scoreToGrade(), addDaysToDate()
  // are expected to exist globally from db.js

  var db = loadDB();

  var stallSelect = document.getElementById("stallSelect");
  var scheduledDateEl = document.getElementById("scheduledDate");
  var conductedDateEl = document.getElementById("conductedDate");
  var scoreEl = document.getElementById("score");
  var remarksEl = document.getElementById("remarks");
  var saveBtn = document.getElementById("saveBtn");
  var msgEl = document.getElementById("msg");

  var violationSelect = document.getElementById("violationSelect");
  var addViolationBtn = document.getElementById("addViolationBtn");
  var violationsList = document.getElementById("violationsList");

  // in-memory list of violations added for THIS inspection form
  var pendingViolations = [];

  // -----------------------
  // Populate stalls
  // -----------------------
  stallSelect.innerHTML = (db.stalls || [])
    .map(function (s) {
      return '<option value="' + s.id + '">' + s.name + "</option>";
    })
    .join("");

  if ((db.stalls || []).length > 0) stallSelect.value = db.stalls[0].id;

  // default conducted date to today
  conductedDateEl.value = new Date().toISOString().slice(0, 10);

  // -----------------------
  // Populate violation catalog dropdown
  // (supports custom violations)
  // -----------------------
  function populateViolationDropdown(selectedCode) {
    var dbNow = loadDB();
    var list = (dbNow.violationCatalog || []).slice();

    // Stable sorting
    list.sort(function (a, b) {
      return String(a.code).localeCompare(String(b.code));
    });

    var options = [];
    options.push('<option value="__custom__">➕ Add custom violation…</option>');
    options = options.concat(
      list.map(function (v) {
        return (
          '<option value="' +
          v.code +
          '">' +
          v.code +
          " - " +
          v.title +
          " (" +
          v.severityDefault +
          ")</option>"
        );
      })
    );

    violationSelect.innerHTML = options.join("");

    if (selectedCode) {
      violationSelect.value = selectedCode;
    } else if (list.length) {
      violationSelect.value = list[0].code;
    } else {
      violationSelect.value = "__custom__";
    }
  }

  function nextCustomCode(dbNow) {
    var max = 0;
    (dbNow.violationCatalog || []).forEach(function (v) {
      var m = String(v.code || "").match(/^V(\d{3})$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    var next = max + 1;
    return "V" + String(next).padStart(3, "0");
  }

  populateViolationDropdown();

  // Add violation to pending list
  addViolationBtn.addEventListener("click", function () {
    var dbNow = loadDB();
    var selected = violationSelect.value;

    // --- Custom violation flow ---
    if (selected === "__custom__") {
      var title = prompt(
        "Enter custom violation title (e.g., 'Raw food stored with cooked food'):"
      );
      if (!title) return;

      var sev = prompt("Enter severity: MINOR / MAJOR / CRITICAL", "MAJOR");
      sev = String(sev || "").toUpperCase().trim();
      if (!["MINOR", "MAJOR", "CRITICAL"].includes(sev)) {
        alert("Invalid severity. Please use MINOR, MAJOR, or CRITICAL.");
        return;
      }

      // Optional custom code; auto-generate if blank
      var suggested = nextCustomCode(dbNow);
      var code = prompt(
        "Enter code (optional). Leave blank to auto-generate:",
        suggested
      );
      code = String(code || "").toUpperCase().trim();
      if (!code) code = suggested;

      dbNow.violationCatalog = dbNow.violationCatalog || [];
      var exists = dbNow.violationCatalog.some(function (v) {
        return v.code === code;
      });
      if (exists) {
        alert("That code already exists. Try a different code.");
        return;
      }

      dbNow.violationCatalog.push({
        code: code,
        title: title,
        severityDefault: sev,
      });
      saveDB(dbNow);

      // Refresh dropdown and auto-select the new one
      populateViolationDropdown(code);
      selected = code;
    }

    // --- Add selected premade/custom violation to this inspection ---
    var latest = loadDB();
    var vio = (latest.violationCatalog || []).find(function (x) {
      return x.code === selected;
    });
    if (!vio) return;

    pendingViolations.push({
      code: vio.code,
      title: vio.title,
      severity: vio.severityDefault,
      notes: "",
    });

    renderPendingViolations();
  });

  function renderPendingViolations() {
    if (pendingViolations.length === 0) {
      violationsList.innerHTML = '<div class="small">No violations added.</div>';
      return;
    }

    var html = pendingViolations
      .map(function (v, idx) {
        return (
          '<div style="display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid #f1f1f1;">' +
          "<div><strong>" +
          v.code +
          "</strong> - " +
          v.title +
          " <span class='small'>(" +
          v.severity +
          ")</span></div>" +
          "<button type='button' class='btn-ghost' data-idx='" +
          idx +
          "'>Remove</button>" +
          "</div>"
        );
      })
      .join("");

    violationsList.innerHTML = html;

    // wire remove buttons
    Array.prototype.slice
      .call(violationsList.querySelectorAll("button[data-idx]"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = Number(btn.getAttribute("data-idx"));
          pendingViolations.splice(i, 1);
          renderPendingViolations();
        });
      });
  }

  renderPendingViolations();

  // -----------------------
  // Save inspection
  // -----------------------
  saveBtn.addEventListener("click", function () {
    var db = loadDB();

    var stallId = stallSelect.value;
    var scheduledDate = scheduledDateEl.value || null;
    var conductedDate = conductedDateEl.value;
    var score = Number(scoreEl.value);

    if (!stallId) return showMsg("Please select a stall.", true);
    if (!conductedDate) return showMsg("Please select conducted date.", true);
    if (Number.isNaN(score) || score < 0 || score > 100)
      return showMsg("Score must be 0–100.", true);

    var grade = scoreToGrade(score);
    var expiryDate = addDaysToDate(conductedDate, 180);

    // Create inspection record
    db.inspections = db.inspections || [];
    db.inspectionViolations = db.inspectionViolations || [];
    db.penalties = db.penalties || [];

    var inspectionId = makeId("insp");

    db.inspections.push({
      id: inspectionId,
      stallId: stallId,
      officerId: "nea1",
      scheduledDate: scheduledDate,
      conductedDate: conductedDate,
      score: score,
      grade: grade,
      remarks: remarksEl.value || "",
    });

    // Save violations linked to this inspection
    pendingViolations.forEach(function (v) {
      db.inspectionViolations.push({
        id: makeId("vio"),
        inspectionId: inspectionId,
        code: v.code,
        title: v.title,
        severity: v.severity,
        notes: v.notes || "",
      });
    });

    // Update stall gradeHistory (transparency + graphs)
    var stall = (db.stalls || []).find(function (s) {
      return s.id === stallId;
    });
    if (stall) {
      stall.gradeHistory = stall.gradeHistory || [];
      stall.gradeHistory.push({
        date: conductedDate,
        grade: grade,
        score: score,
        expiryDate: expiryDate,
      });
    }

    // Auto penalties (simple rules)
    var hasCritical = pendingViolations.some(function (v) {
      return v.severity === "CRITICAL";
    });

    if (grade === "D" || hasCritical) {
      db.penalties.push({
        id: makeId("pen"),
        stallId: stallId,
        inspectionId: inspectionId,
        action: "WARNING",
        createdDateTime: new Date().toISOString(),
      });
      db.penalties.push({
        id: makeId("pen"),
        stallId: stallId,
        inspectionId: inspectionId,
        action: "REINSPECTION",
        createdDateTime: new Date().toISOString(),
      });
    } else if (grade === "C" && pendingViolations.length >= 2) {
      db.penalties.push({
        id: makeId("pen"),
        stallId: stallId,
        inspectionId: inspectionId,
        action: "WARNING",
        createdDateTime: new Date().toISOString(),
      });
    }

    saveDB(db);

    // reset form
    scoreEl.value = "";
    remarksEl.value = "";
    pendingViolations = [];
    renderPendingViolations();

    showMsg("Inspection saved (Grade " + grade + ").");
  });

  function showMsg(text, isError) {
    msgEl.textContent = text;
    msgEl.style.color = isError ? "#b00020" : "";
  }
});
