requireNEA();

document.addEventListener("DOMContentLoaded", async function () {
  const local = loadDB();

  // Scheduled inspection UI
  const scheduleSelect = document.getElementById("scheduleSelect");
  const stallNameEl = document.getElementById("stallName");
  const scheduledDateEl = document.getElementById("scheduledDate");

  // Inputs
  const scoreEl = document.getElementById("score");
  const remarksEl = document.getElementById("remarks");

  // Violations UI (LOCAL dropdown)
  const violationSelect = document.getElementById("violationSelect");
  const addViolationBtn = document.getElementById("addViolationBtn");
  const customViolationInput = document.getElementById("customViolation");
  const customSeveritySelect = document.getElementById("customSeverity");
  const addCustomBtn = document.getElementById("addCustomBtn");
  const violationsList = document.getElementById("violationsList");

  const saveBtn = document.getElementById("saveInspectionBtn");
  const msgEl = document.getElementById("msg");

  let scheduled = [];
  let selectedSchedule = null;

  // list of violations added for THIS inspection form
  let pendingViolations = [];

  // -----------------------
  // Firestore guard
  // -----------------------
  if (!window.DB || typeof DB.getScheduledInspections !== "function") {
    showMsg(
      "Firestore DB not loaded. Check your firebase.js / firestore-service.js / db-compat.js script order.",
      true
    );
    if (saveBtn) saveBtn.disabled = true;
    return;
  }

  // -----------------------
  // Load scheduled inspections (Firestore)
  // -----------------------
  try {
    scheduled = await DB.getScheduledInspections("scheduled");
  } catch (e) {
    console.error(e);
    showMsg("Failed to load scheduled inspections: " + (e?.message || e), true);
    if (saveBtn) saveBtn.disabled = true;
    return;
  }

  if (!scheduled.length) {
    showMsg("No scheduled inspections found. Schedule one first.", false);
    scheduleSelect.innerHTML = `<option value="">(No scheduled inspections)</option>`;
    if (saveBtn) saveBtn.disabled = true;
    return;
  }

  scheduleSelect.innerHTML = scheduled
    .map((s) => {
      const stallName =
        (local.stalls || []).find((x) => x.id === s.stallId)?.name || s.stallId;
      return `<option value="${s.id}">${escapeHtml(stallName)} — Scheduled: ${s.scheduledDate}</option>`;
    })
    .join("");

  scheduleSelect.value = scheduled[0].id;
  pickSchedule();
  scheduleSelect.addEventListener("change", pickSchedule);

  // -----------------------
  // Violations dropdown (LOCAL db.js)
  // -----------------------
  populateViolationDropdown();

  addViolationBtn.addEventListener("click", function () {
    const selected = violationSelect.value;
    if (!selected) return showMsg("Please select a violation.", true);

    const dbNow = loadDB();
    const vio = (dbNow.violationCatalog || []).find((x) => x.code === selected);
    if (!vio) return showMsg("Selected violation not found in local catalog.", true);

    pendingViolations.push({
      code: vio.code,
      title: vio.title,
      severity: vio.severityDefault,
      notes: "",
    });

    renderPendingViolations();
    showMsg("", false);
  });

  // Add custom violation into LOCAL catalog + add to pending list
  addCustomBtn.addEventListener("click", function () {
    const title = String(customViolationInput.value || "").trim();
    let sev = String(customSeveritySelect.value || "MAJOR").toUpperCase().trim();

    if (!title) return showMsg("Please type a custom violation.", true);
    if (!["MINOR", "MAJOR", "CRITICAL"].includes(sev)) sev = "MAJOR";

    const dbNow = loadDB();
    dbNow.violationCatalog = dbNow.violationCatalog || [];

    const code = nextCustomCode(dbNow);

    dbNow.violationCatalog.push({
      code,
      title,
      severityDefault: sev,
    });
    saveDB(dbNow);

    populateViolationDropdown(code);

    pendingViolations.push({
      code,
      title,
      severity: sev,
      notes: "Custom",
    });

    customViolationInput.value = "";
    renderPendingViolations();
    showMsg("Custom violation added (local).", false);
  });

  // -----------------------
  // Save inspection (Firestore)
  // conductedDate = scheduledDate
  // -----------------------
  saveBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    if (!selectedSchedule) return;

    const score = Number(scoreEl.value);
    const remarks = remarksEl.value || "";

    if (Number.isNaN(score) || score < 0 || score > 100) {
      return showMsg("Score must be 0–100.", true);
    }

    const scheduledDate = selectedSchedule.scheduledDate;
    const grade = scoreToGrade(score);
    const expiryDate = addDaysISO(scheduledDate, 180);

    try {
      if (typeof DB.addInspection !== "function") {
        return showMsg("DB.addInspection missing. Check db-compat.js.", true);
      }

      const inspectionId = await DB.addInspection({
        stallId: selectedSchedule.stallId,
        scheduledDate,
        conductedDate: scheduledDate,
        score,
        grade,
        remarks,
        expiryDate,
        scheduledRefId: selectedSchedule.id,
      });

      // save violations to Firestore subcollection
      if (pendingViolations.length && typeof DB.addInspectionViolations === "function") {
        await DB.addInspectionViolations(inspectionId, pendingViolations);
      }

      // penalties
      if (typeof DB.addPenalty === "function") {
        const hasCritical = pendingViolations.some((v) => v.severity === "CRITICAL");
        if (grade === "D") {
          await DB.addPenalty({
            stallId: selectedSchedule.stallId,
            inspectionId,
            action: "Warning Letter",
            reason: "Grade D",
          });
        }
        if (hasCritical) {
          await DB.addPenalty({
            stallId: selectedSchedule.stallId,
            inspectionId,
            action: "Reinspection Required",
            reason: "Critical violation(s)",
          });
        }
      }

      // mark schedule completed
      if (typeof DB.markScheduledCompleted === "function") {
        await DB.markScheduledCompleted(selectedSchedule.id);
      }

      showMsg(`✅ Inspection logged (Date: ${scheduledDate}). Grade: ${grade}.`, false);

      // reset
      scoreEl.value = "";
      remarksEl.value = "";
      pendingViolations = [];
      renderPendingViolations();

      // refresh schedule dropdown
      scheduled = await DB.getScheduledInspections("scheduled");
      if (!scheduled.length) {
        scheduleSelect.innerHTML = `<option value="">(No scheduled inspections)</option>`;
        stallNameEl.textContent = "-";
        scheduledDateEl.textContent = "-";
        saveBtn.disabled = true;
        return;
      }
      scheduleSelect.innerHTML = scheduled
        .map((s) => {
          const stallName =
            (local.stalls || []).find((x) => x.id === s.stallId)?.name || s.stallId;
          return `<option value="${s.id}">${escapeHtml(stallName)} — Scheduled: ${s.scheduledDate}</option>`;
        })
        .join("");
      scheduleSelect.value = scheduled[0].id;
      pickSchedule();
    } catch (err) {
      console.error(err);
      showMsg("Save failed: " + (err?.message || String(err)), true);
    }
  });

  // -----------------------
  // Helpers
  // -----------------------
  function pickSchedule() {
    const id = scheduleSelect.value;
    selectedSchedule = scheduled.find((x) => x.id === id) || null;
    if (!selectedSchedule) return;

    const stallName =
      (local.stalls || []).find((x) => x.id === selectedSchedule.stallId)?.name ||
      selectedSchedule.stallId;

    stallNameEl.textContent = stallName;
    scheduledDateEl.textContent = selectedSchedule.scheduledDate;
  }

  function populateViolationDropdown(selectedCode) {
    const dbNow = loadDB();
    const list = (dbNow.violationCatalog || []).slice();

    list.sort((a, b) => String(a.code).localeCompare(String(b.code)));

    const options = ['<option value="">Select a violation...</option>'].concat(
      list.map((v) => {
        return `<option value="${v.code}">${v.code} - ${escapeHtml(v.title)} (${v.severityDefault})</option>`;
      })
    );

    violationSelect.innerHTML = options.join("");

    if (selectedCode) violationSelect.value = selectedCode;
  }

  function nextCustomCode(dbNow) {
    let max = 0;
    (dbNow.violationCatalog || []).forEach((v) => {
      const m = String(v.code || "").match(/^V(\d{3})$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    const next = max + 1;
    return "V" + String(next).padStart(3, "0");
  }

  function renderPendingViolations() {
    if (!pendingViolations.length) {
      violationsList.innerHTML = '<div class="small">No violations added.</div>';
      return;
    }

    const html = pendingViolations
      .map((v, idx) => {
        return (
          `<div style="display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid #f1f1f1;">` +
          `<div><strong>${escapeHtml(v.code)}</strong> - ${escapeHtml(v.title)} <span class="small">(${escapeHtml(v.severity)})</span></div>` +
          `<button type="button" class="btn-ghost" data-idx="${idx}">Remove</button>` +
          `</div>`
        );
      })
      .join("");

    violationsList.innerHTML = html;

    Array.from(violationsList.querySelectorAll("button[data-idx]")).forEach((btn) => {
      btn.addEventListener("click", function () {
        const i = Number(btn.getAttribute("data-idx"));
        pendingViolations.splice(i, 1);
        renderPendingViolations();
      });
    });
  }

  renderPendingViolations();

  function showMsg(text, isError) {
    msgEl.textContent = text;
    msgEl.style.color = isError ? "#b00020" : "";
  }
});

// Helpers
function scoreToGrade(score) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  return "D";
}
function addDaysISO(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

