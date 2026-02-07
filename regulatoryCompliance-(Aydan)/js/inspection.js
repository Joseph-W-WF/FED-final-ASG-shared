// regulatoryCompliance-(Aydan)/js/inspection.js
document.addEventListener("DOMContentLoaded", function () {
  // db.js globals expected:
  // loadDB(), saveDB(), scoreToGrade(), addDaysToDate()

  // -----------------------
  // Elements (support NEW + OLD html)
  // -----------------------
  const scheduleSelect = document.getElementById("scheduleSelect"); // NEW
  const stallNameEl = document.getElementById("stallName");         // NEW
  const scheduledDateTextEl = document.getElementById("scheduledDate"); // NEW display span

  const stallSelect = document.getElementById("stallSelect");       // OLD
  const scheduledDateInput = document.getElementById("scheduledDate"); // OLD input (same id; if input exists, it's OLD)
  const conductedDateEl = document.getElementById("conductedDate"); // OLD

  const scoreEl = document.getElementById("score");
  const remarksEl = document.getElementById("remarks");

  const violationSelect = document.getElementById("violationSelect");
  const addViolationBtn = document.getElementById("addViolationBtn");
  const violationsList = document.getElementById("violationsList");

  const saveBtn =
    document.getElementById("saveInspectionBtn") || // NEW
    document.getElementById("saveBtn");             // OLD

  const msgEl = document.getElementById("msg");

  if (!violationSelect || !addViolationBtn || !violationsList) {
    console.error("Missing violation UI elements. Check IDs in inspection.html");
    return;
  }

  // In-memory list for this form
  let pendingViolations = [];

  // -----------------------
  // 1) Populate VIOLATION dropdown from db.js (same as your old code)
  // -----------------------
  function populateViolationDropdown(selectedCode) {
    const dbNow = loadDB();
    const list = (dbNow.violationCatalog || []).slice();

    list.sort(function (a, b) {
      return String(a.code).localeCompare(String(b.code));
    });

    let options = [];
    options.push('<option value="__custom__">➕ Add custom violation…</option>');
    options = options.concat(
      list.map(function (v) {
        return (
          '<option value="' +
          v.code +
          '">' +
          escapeHtml(v.code) +
          " - " +
          escapeHtml(v.title) +
          " (" +
          escapeHtml(v.severityDefault) +
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
    let max = 0;
    (dbNow.violationCatalog || []).forEach(function (v) {
      const m = String(v.code || "").match(/^V(\d{3})$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    const next = max + 1;
    return "V" + String(next).padStart(3, "0");
  }

  populateViolationDropdown();

  // Add selected violation into pending list
  addViolationBtn.addEventListener("click", function () {
    const dbNow = loadDB();
    let selected = violationSelect.value;

    // --- Custom violation flow (same idea as your old code) ---
    if (selected === "__custom__") {
      let title = prompt(
        "Enter custom violation title (e.g., 'Raw food stored with cooked food'):"
      );
      if (!title) return;

      let sev = prompt("Enter severity: MINOR / MAJOR / CRITICAL", "MAJOR");
      sev = String(sev || "").toUpperCase().trim();
      if (!["MINOR", "MAJOR", "CRITICAL"].includes(sev)) {
        alert("Invalid severity. Please use MINOR, MAJOR, or CRITICAL.");
        return;
      }

      // auto-generate suggested code
      const suggested = nextCustomCode(dbNow);
      let code = prompt(
        "Enter code (optional). Leave blank to auto-generate:",
        suggested
      );
      code = String(code || "").toUpperCase().trim();
      if (!code) code = suggested;

      dbNow.violationCatalog = dbNow.violationCatalog || [];
      const exists = dbNow.violationCatalog.some(function (v) {
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

      // refresh dropdown and auto-select the new code
      populateViolationDropdown(code);
      selected = code;
    }

    // --- Add selected premade/custom violation to THIS inspection ---
    const latest = loadDB();
    const vio = (latest.violationCatalog || []).find(function (x) {
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

    const html = pendingViolations
      .map(function (v, idx) {
        return (
          '<div style="display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid #f1f1f1;">' +
          "<div><strong>" +
          escapeHtml(v.code) +
          "</strong> - " +
          escapeHtml(v.title) +
          " <span class='small'>(" +
          escapeHtml(v.severity) +
          ")</span></div>" +
          "<button type='button' class='btn-ghost' data-idx='" +
          idx +
          "'>Remove</button>" +
          "</div>"
        );
      })
      .join("");

    violationsList.innerHTML = html;

    Array.prototype.slice
      .call(violationsList.querySelectorAll("button[data-idx]"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          const i = Number(btn.getAttribute("data-idx"));
          pendingViolations.splice(i, 1);
          renderPendingViolations();
        });
      });
  }

  renderPendingViolations();

  // -----------------------
  // 2) Firestore stuff: WAIT for window.DB instead of returning early
  // -----------------------
  function waitForDB(maxMs) {
    const start = Date.now();
    return new Promise((resolve) => {
      (function tick() {
        if (window.DB && typeof DB.addInspection === "function") return resolve(true);
        if (Date.now() - start > maxMs) return resolve(false);
        setTimeout(tick, 150);
      })();
    });
  }

  // NEW schedule-based flow (if scheduleSelect exists)
  let scheduled = [];
  let selectedSchedule = null;

  async function initScheduleIfNeeded() {
    if (!scheduleSelect) return;

    const ok = await waitForDB(5000);
    if (!ok) {
      showMsg("Firestore not ready. Check firebase/db-compat script loading.", true);
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    if (typeof DB.getScheduledInspections !== "function") {
      showMsg("DB.getScheduledInspections missing (db-compat.js).", true);
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    scheduled = await DB.getScheduledInspections("scheduled");

    if (!scheduled.length) {
      scheduleSelect.innerHTML = `<option value="">(No scheduled inspections)</option>`;
      if (stallNameEl) stallNameEl.textContent = "-";
      if (scheduledDateTextEl && scheduledDateTextEl.tagName === "SPAN") scheduledDateTextEl.textContent = "-";
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    const local = loadDB();
    scheduleSelect.innerHTML = scheduled
      .map(function (s) {
        const stallName =
          (local.stalls || []).find((x) => x.id === s.stallId)?.name || s.stallId;
        return `<option value="${s.id}">${escapeHtml(stallName)} — Scheduled: ${escapeHtml(s.scheduledDate)}</option>`;
      })
      .join("");

    scheduleSelect.value = scheduled[0].id;
    pickSchedule();

    scheduleSelect.addEventListener("change", pickSchedule);

    function pickSchedule() {
      const id = scheduleSelect.value;
      selectedSchedule = scheduled.find((x) => x.id === id) || null;
      if (!selectedSchedule) return;

      const local2 = loadDB();
      const stallName =
        (local2.stalls || []).find((x) => x.id === selectedSchedule.stallId)?.name ||
        selectedSchedule.stallId;

      if (stallNameEl) stallNameEl.textContent = stallName;

      // if your NEW html uses a <span id="scheduledDate">
      if (scheduledDateTextEl && scheduledDateTextEl.tagName === "SPAN") {
        scheduledDateTextEl.textContent = selectedSchedule.scheduledDate;
      }
    }
  }

  // -----------------------
  // 3) Save inspection (NEW + OLD)
  // -----------------------
  if (saveBtn) {
    saveBtn.addEventListener("click", async function (e) {
      e.preventDefault?.();

      const ok = await waitForDB(5000);
      if (!ok) return showMsg("Firestore not ready. Check firebase/db-compat.", true);

      try {
        // Determine stall/date depending on html type
        let stallId, scheduledDate, conductedDate;

        if (scheduleSelect) {
          // NEW: from schedule
          if (!selectedSchedule) return showMsg("Please select a scheduled inspection.", true);
          stallId = selectedSchedule.stallId;
          scheduledDate = selectedSchedule.scheduledDate;
          conductedDate = selectedSchedule.scheduledDate;
        } else {
          // OLD
          stallId = stallSelect?.value;
          scheduledDate = scheduledDateInput?.value || null;
          conductedDate = conductedDateEl?.value || null;
        }

        const score = Number(scoreEl?.value);
        if (!stallId) return showMsg("Please select a stall.", true);
        if (!conductedDate) return showMsg("Please select conducted date.", true);
        if (Number.isNaN(score) || score < 0 || score > 100)
          return showMsg("Score must be 0–100.", true);

        const grade = scoreToGrade(score);
        const expiryDate = addDaysToDate(conductedDate, 180);

        showMsg("Saving...", false);

        const inspectionId = await DB.addInspection({
          stallId,
          officerId: "nea1",
          scheduledDate: scheduledDate || null,
          conductedDate,
          score,
          grade,
          remarks: remarksEl?.value || "",
          expiryDate,
          scheduledRefId: selectedSchedule?.id || null,
        });

        // save violations with inspection
        if (pendingViolations.length && typeof DB.addInspectionViolations === "function") {
          await DB.addInspectionViolations(inspectionId, pendingViolations);
        }

        // mark schedule completed if NEW flow
        if (selectedSchedule && typeof DB.markScheduledCompleted === "function") {
          await DB.markScheduledCompleted(selectedSchedule.id);
        }

        // reset
        scoreEl.value = "";
        remarksEl.value = "";
        pendingViolations = [];
        renderPendingViolations();

        showMsg("✅ Saved! (Grade " + grade + ")", false);

        // refresh schedule list if NEW flow
        if (scheduleSelect && typeof DB.getScheduledInspections === "function") {
          scheduled = await DB.getScheduledInspections("scheduled");
          if (!scheduled.length) {
            scheduleSelect.innerHTML = `<option value="">(No scheduled inspections)</option>`;
            if (saveBtn) saveBtn.disabled = true;
          }
        }
      } catch (err) {
        console.error(err);
        showMsg("Save failed: " + (err?.message || String(err)), true);
      }
    });
  }

  initScheduleIfNeeded();

  function showMsg(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = isError ? "#b00020" : "";
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
