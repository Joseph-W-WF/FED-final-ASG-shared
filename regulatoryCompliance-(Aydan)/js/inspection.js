// log inspection page logic (nea)
// main flow:
// - user selects a scheduled inspection (so we know which stall + date this log belongs to)
// - officer enters score + remarks
// - officer can attach violations (pulled from db.js catalog, plus optional custom ones)
// - when saving, we compute grade + expiry, store inspection in firestore, then store violations under that inspection
// - finally, we mark the scheduled inspection as completed

document.addEventListener("DOMContentLoaded", function () {
  // this file assumes db.js globals exist:
  // loadDB(), saveDB(), scoreToGrade(), addDaysToDate()

  // grab ui elements (supports both the newer schedule-based html and the older fallback html)
  const scheduleSelect = document.getElementById("scheduleSelect"); 
  const stallNameEl = document.getElementById("stallName");
  const scheduledDateTextEl = document.getElementById("scheduledDate"); 

  const stallSelect = document.getElementById("stallSelect"); 
  const scheduledDateInput = document.getElementById("scheduledDate"); 
  const conductedDateEl = document.getElementById("conductedDate"); 

  const scoreEl = document.getElementById("score");
  const remarksEl = document.getElementById("remarks");

  const violationSelect = document.getElementById("violationSelect");
  const addViolationBtn = document.getElementById("addViolationBtn");
  const violationsList = document.getElementById("violationsList");

  const saveBtn =
    document.getElementById("saveInspectionBtn") ||
    document.getElementById("saveBtn");

  const msgEl = document.getElementById("msg");

  // if violation ui is missing, saving would be confusing, so we stop early
  if (!violationSelect || !addViolationBtn || !violationsList) {
    console.error("missing violation ui elements. check ids in inspection.html");
    return;
  }

  // this array holds violations that the officer added before hitting save
  let pendingViolations = [];

  // 1) dropdown: load violation catalog from db.js (static seed)
  function populateViolationDropdown(selectedCode) {
    const dbNow = loadDB();
    const list = (dbNow.violationCatalog || []).slice();

    // sort so the dropdown feels consistent (v001, v002, ...)
    list.sort(function (a, b) {
      return String(a.code).localeCompare(String(b.code));
    });

    // special option to trigger the "add custom violation" prompt flow
    let options = [];
    options.push('<option value="__custom__">➕ add custom violation…</option>');
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

    // keep selection stable after adding a new custom item
    if (selectedCode) {
      violationSelect.value = selectedCode;
    } else if (list.length) {
      violationSelect.value = list[0].code;
    } else {
      violationSelect.value = "__custom__";
    }
  }

  // auto-generates the next available code like v001, v002, ...
  function nextCustomCode(dbNow) {
    let max = 0;
    (dbNow.violationCatalog || []).forEach(function (v) {
      const m = String(v.code || "").match(/^V(\d{3})$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    const next = max + 1;
    return "V" + String(next).padStart(3, "0");
  }

  // initial load of the dropdown
  populateViolationDropdown();

  
  // 2) add violations into the pending list (before saving)
  
  addViolationBtn.addEventListener("click", function () {
    const dbNow = loadDB();
    let selected = violationSelect.value;

    // if user picked the special "__custom__" option, we prompt and save into db.js catalog
    // note: the html also contains a custom-violation row, but this version uses prompt flow for simplicity
    if (selected === "__custom__") {
      let title = prompt("enter custom violation title (e.g., 'raw food stored with cooked food'):");
      if (!title) return;

      let sev = prompt("enter severity: minor / major / critical", "MAJOR");
      sev = String(sev || "").toUpperCase().trim();
      if (!["MINOR", "MAJOR", "CRITICAL"].includes(sev)) {
        alert("invalid severity. please use minor, major, or critical.");
        return;
      }

      // suggest the next code automatically
      const suggested = nextCustomCode(dbNow);
      let code = prompt("enter code (optional). leave blank to auto-generate:", suggested);
      code = String(code || "").toUpperCase().trim();
      if (!code) code = suggested;

      // prevent duplicate codes so the catalog stays clean
      dbNow.violationCatalog = dbNow.violationCatalog || [];
      const exists = dbNow.violationCatalog.some(function (v) {
        return v.code === code;
      });
      if (exists) {
        alert("that code already exists. try a different code.");
        return;
      }

      // write custom catalog entry into db.js storage
      dbNow.violationCatalog.push({
        code: code,
        title: title,
        severityDefault: sev,
      });

      saveDB(dbNow);

      // refresh dropdown and keep the new code selected
      populateViolationDropdown(code);
      selected = code;
    }

    // now add the selected violation into this inspection's pending list
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

  // renders the pending list so officer can review/remove before saving
  function renderPendingViolations() {
    if (pendingViolations.length === 0) {
      violationsList.innerHTML = '<div class="small">no violations added.</div>';
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
          "'>remove</button>" +
          "</div>"
        );
      })
      .join("");

    violationsList.innerHTML = html;

    // wire remove buttons after the html is injected
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

  // show initial empty state
  renderPendingViolations();

  // 3) firestore: wait until window.DB is ready
  
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

  
  // 4) schedule-based mode: load scheduled inspections into dropdown
 
  let scheduled = [];
  let selectedSchedule = null;

  async function initScheduleIfNeeded() {
    // if the page doesn't have scheduleSelect, we're on the older html, so skip
    if (!scheduleSelect) return;

    const ok = await waitForDB(5000);
    if (!ok) {
      showMsg("firestore not ready. check script loading order.", true);
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    if (typeof DB.getScheduledInspections !== "function") {
      showMsg("db.getScheduledInspections missing (db-compat.js).", true);
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    // load scheduled inspections that are still pending
    scheduled = await DB.getScheduledInspections("scheduled");

    if (!scheduled.length) {
      scheduleSelect.innerHTML = `<option value="">(no scheduled inspections)</option>`;
      if (stallNameEl) stallNameEl.textContent = "-";
      if (scheduledDateTextEl && scheduledDateTextEl.tagName === "SPAN") scheduledDateTextEl.textContent = "-";
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    // create dropdown options using stall names from seed db (nicer than raw ids)
    const local = loadDB();
    scheduleSelect.innerHTML = scheduled
      .map(function (s) {
        const stallName =
          (local.stalls || []).find((x) => x.id === s.stallId)?.name || s.stallId;
        return `<option value="${s.id}">${escapeHtml(stallName)} — scheduled: ${escapeHtml(s.scheduledDate)}</option>`;
      })
      .join("");

    // pick first schedule by default
    scheduleSelect.value = scheduled[0].id;
    pickSchedule();

    // when officer changes schedule, update the displayed stall/date labels
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

      if (scheduledDateTextEl && scheduledDateTextEl.tagName === "SPAN") {
        scheduledDateTextEl.textContent = selectedSchedule.scheduledDate;
      }
    }
  }

  
  // 5) save inspection: compute grade/expiry, write to firestore, attach violations, mark schedule completed
  
  if (saveBtn) {
    saveBtn.addEventListener("click", async function (e) {
      e.preventDefault?.();

      const ok = await waitForDB(5000);
      if (!ok) return showMsg("firestore not ready. check firebase/db-compat.", true);

      try {
        // decide which stall/date to use depending on whether we're in schedule mode or old mode
        let stallId, scheduledDate, conductedDate;

        if (scheduleSelect) {
          if (!selectedSchedule) return showMsg("please select a scheduled inspection.", true);
          stallId = selectedSchedule.stallId;
          scheduledDate = selectedSchedule.scheduledDate;

          // for scheduled flow, conducted date = scheduled date (same day inspection)
          conductedDate = selectedSchedule.scheduledDate;
        } else {
          stallId = stallSelect?.value;
          scheduledDate = scheduledDateInput?.value || null;
          conductedDate = conductedDateEl?.value || null;
        }

        // validate score input (grade depends on it)
        const score = Number(scoreEl?.value);
        if (!stallId) return showMsg("please select a stall.", true);
        if (!conductedDate) return showMsg("please select conducted date.", true);
        if (Number.isNaN(score) || score < 0 || score > 100) {
          return showMsg("score must be 0–100.", true);
        }

        // calculate grade + expiry based on your shared db.js helper logic
        const grade = scoreToGrade(score);
        const expiryDate = addDaysToDate(conductedDate, 180);

        showMsg("saving...", false);

        // create inspection doc
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

        // attach violations under this inspection id
        if (pendingViolations.length && typeof DB.addInspectionViolations === "function") {
          await DB.addInspectionViolations(inspectionId, pendingViolations);
        }

        // if this inspection came from the scheduled list, mark it completed so it disappears from the dropdown
        if (selectedSchedule && typeof DB.markScheduledCompleted === "function") {
          await DB.markScheduledCompleted(selectedSchedule.id);
        }

        // reset the form so officer can log the next inspection quickly
        scoreEl.value = "";
        remarksEl.value = "";
        pendingViolations = [];
        renderPendingViolations();

        showMsg("✅ saved! (grade " + grade + ")", false);

        // refresh schedule options after saving (schedule-based mode only)
        if (scheduleSelect && typeof DB.getScheduledInspections === "function") {
          scheduled = await DB.getScheduledInspections("scheduled");
          if (!scheduled.length) {
            scheduleSelect.innerHTML = `<option value="">(no scheduled inspections)</option>`;
            if (saveBtn) saveBtn.disabled = true;
          }
        }
      } catch (err) {
        console.error(err);
        showMsg("save failed: " + (err?.message || String(err)), true);
      }
    });
  }

  // kick off schedule dropdown init (only does work if scheduleSelect exists)
  initScheduleIfNeeded();

  
  // 6) small ui helpers
  
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