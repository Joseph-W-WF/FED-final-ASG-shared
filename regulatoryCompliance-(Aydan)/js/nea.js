// nea dashboard logic
// this page is a read-only "overview" for officers
// key idea: stalls list stays in db.js (seed), but inspections/penalties/violations come from firestore
// we fetch per stall, then compute kpis + lists (priority queue, offenders, expiry alerts, penalties)

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard().catch(console.error);
});

async function renderDashboard() {
  // grab the containers where we render each section
  const priorityList = document.getElementById("priorityList");
  const offendersList = document.getElementById("offendersList");
  const expiryList = document.getElementById("expiryList");
  const penaltiesList = document.getElementById("penaltiesList");

  // grab kpi counters (top summary tiles)
  const inspEl = document.getElementById("kpiInspections");
  const avgEl = document.getElementById("kpiAvgScore");
  const expEl = document.getElementById("kpiExpiring");
  const penEl = document.getElementById("kpiPenalties");

  // make sure firestore wrapper is loaded before rendering anything
  if (!window.DB || typeof DB.getInspectionsByStall !== "function") {
    setAll("db api not ready. make sure dashboard.html loads firebase.js, firestore-service.js, db-compat.js before nea.js.");
    return;
  }

  // stalls come from db.js so the app can still show stalls even if firestore is empty
  const local = loadDB();
  const stalls = local.stalls || [];

  // fetch inspections + penalties per stall (parallel for speed)
  const stallData = await Promise.all(
    stalls.map(async (s) => {
      let inspections = [];
      let penalties = [];
      try { inspections = await DB.getInspectionsByStall(s.id); } catch (e) { console.error(e); }
      try { penalties = await DB.getPenaltiesByStall(s.id); } catch (e) { console.error(e); }
      return { stall: s, inspections: inspections || [], penalties: penalties || [] };
    })
  );

  // flatten lists so we can compute global kpis
  const allInspections = stallData.flatMap((x) => x.inspections);
  const allPenalties = stallData.flatMap((x) => x.penalties);

  // kpi: total inspections
  if (inspEl) inspEl.textContent = String(allInspections.length);

  // kpi: average score across all inspections
  const scores = allInspections
    .map((x) => Number(x.score))
    .filter((n) => !Number.isNaN(n));

  if (avgEl) {
    avgEl.textContent = scores.length
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : "-";
  }

  // kpi: expiring within 30 days (only checks the latest inspection per stall)
  let expiringCount = 0;
  stallData.forEach((sd) => {
    const last = getLatestInspection(sd.inspections);
    if (last && isExpiringSoon(last.expiryDate, 30)) expiringCount++;
  });
  if (expEl) expEl.textContent = String(expiringCount);

  // kpi: penalties count
  if (penEl) penEl.textContent = String(allPenalties.length);

  // render the 4 dashboard sections
  renderPriorityQueue(priorityList, stallData);
  renderExpiry(expiryList, stallData);
  renderPenalties(penaltiesList, stallData, local);
  await renderOffenders(offendersList, stallData);

  // helper: show the same message in all sections (used for error state)
  function setAll(msg) {
    if (priorityList) priorityList.innerHTML = `<p class="small">${msg}</p>`;
    if (offendersList) offendersList.innerHTML = `<p class="small">${msg}</p>`;
    if (expiryList) expiryList.innerHTML = `<p class="small">${msg}</p>`;
    if (penaltiesList) penaltiesList.innerHTML = `<p class="small">${msg}</p>`;
  }
}

// section 1: inspection priority queue
// logic: assign a simple score per stall so nea knows who to inspect first
// - never inspected: +40
// - last grade d: +100, c: +60, b: +20 (a adds nothing)
// - expiring within 30 days: +50 (needs renewal soon)
// - recent penalty within 30 days: +40
function renderPriorityQueue(el, stallData) {
  if (!el) return;

  const list = stallData.map((sd) => {
    const last = getLatestInspection(sd.inspections);
    let score = 0;

    if (!last) {
      score += 40;
    } else {
      if (last.grade === "D") score += 100;
      else if (last.grade === "C") score += 60;
      else if (last.grade === "B") score += 20;

      if (isExpiringSoon(last.expiryDate, 30)) score += 50;
    }

    if (hasRecentPenalty(sd.penalties, 30)) score += 40;

    return { stall: sd.stall, last, score };
  });

  list.sort((a, b) => b.score - a.score);

  if (list.length === 0) {
    el.innerHTML = `<p class="small">no stalls found.</p>`;
    return;
  }

  const top = list.slice(0, 5);
  el.innerHTML = `
    <ol style="margin:0; padding-left:18px;">
      ${top.map((x) => `
        <li>
          <strong>${x.stall.name}</strong>
          — ${x.last ? `last grade: ${x.last.grade} (${x.last.conductedDate})` : "no inspections yet"}
          — priority: <strong>${x.score}</strong>
        </li>
      `).join("")}
    </ol>
  `;
}

// section 2: grade expiry alerts
// logic: list stalls where the latest inspection's expiry date is within the next 30 days
function renderExpiry(el, stallData) {
  if (!el) return;

  const soon = [];
  stallData.forEach((sd) => {
    const last = getLatestInspection(sd.inspections);
    if (!last) return;
    if (isExpiringSoon(last.expiryDate, 30)) {
      soon.push({ stall: sd.stall, grade: last.grade, expiryDate: last.expiryDate });
    }
  });

  if (soon.length === 0) {
    el.innerHTML = `<p class="small">no grades expiring within 30 days.</p>`;
    return;
  }

  el.innerHTML = `
    <ul style="margin:0; padding-left:18px;">
      ${soon.map((x) => `<li><strong>${x.stall.name}</strong> — grade ${x.grade} expires on <strong>${x.expiryDate}</strong></li>`).join("")}
    </ul>
  `;
}

// section 3: latest penalties
// logic: show the newest few penalties across all stalls (sorted by created date)
function renderPenalties(el, stallData, local) {
  if (!el) return;

  const all = stallData.flatMap((x) => x.penalties || []);
  if (all.length === 0) {
    el.innerHTML = `<p class="small">no penalties yet.</p>`;
    return;
  }

  all.sort((a, b) => penaltyDate(b) - penaltyDate(a));
  const top = all.slice(0, 6);

  const nameOf = (stallId) =>
    (local.stalls || []).find((s) => s.id === stallId)?.name || stallId;

  el.innerHTML = `
    <table class="table">
      <thead><tr><th>stall</th><th>action</th><th>date</th></tr></thead>
      <tbody>
        ${top.map((p) => `
          <tr>
            <td>${nameOf(p.stallId)}</td>
            <td>${p.action || "-"}</td>
            <td>${fmt(penaltyDate(p))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// section 4: repeated offenders
// rule used here (simple + explainable):
// - repeated offender if last 180 days has >=2 penalties OR >=2 critical violations
async function renderOffenders(el, stallData) {
  if (!el) return;

  const offenders = [];

  for (const sd of stallData) {
    const pCount = (sd.penalties || []).filter((p) => daysAgo(penaltyDate(p)) <= 180).length;

    let criticalCount = 0;

    // critical violations are stored under each inspection, so we need to fetch them per inspection
    if (typeof DB.getInspectionViolations === "function") {
      const recentInsp = (sd.inspections || []).filter((ins) => daysAgo(new Date(ins.conductedDate)) <= 180);
      const vioLists = await Promise.all(
        recentInsp.map(async (ins) => {
          try { return await DB.getInspectionViolations(ins.id); } catch { return []; }
        })
      );

      vioLists.forEach((arr) => {
        (arr || []).forEach((v) => {
          if (String(v.severity || "").toUpperCase() === "CRITICAL") criticalCount++;
        });
      });
    }

    if (pCount >= 2 || criticalCount >= 2) {
      offenders.push({ stall: sd.stall, pCount, criticalCount });
    }
  }

  if (offenders.length === 0) {
    el.innerHTML = `<p class="small">no repeated offenders found.</p>`;
    return;
  }

  el.innerHTML = `
    <table class="table">
      <thead><tr><th>stall</th><th>penalties (180d)</th><th>critical violations (180d)</th></tr></thead>
      <tbody>
        ${offenders.map((o) => `
          <tr>
            <td>${o.stall.name}</td>
            <td>${o.pCount}</td>
            <td>${o.criticalCount}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// helper: returns the latest inspection by conductedDate
function getLatestInspection(inspections) {
  if (!inspections || inspections.length === 0) return null;
  const copy = inspections.slice();
  copy.sort((a, b) => new Date(b.conductedDate || 0) - new Date(a.conductedDate || 0));
  return copy[0];
}

// helper: checks if expiryDate is within N days from today (and not already expired)
function isExpiringSoon(expiryDate, days) {
  if (!expiryDate) return false;
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

// helper: checks if there is any penalty within N days from today
function hasRecentPenalty(penalties, days) {
  return (penalties || []).some((p) => daysAgo(penaltyDate(p)) <= days);
}

// helper: normalize firestore timestamp / string date into a js Date
function penaltyDate(p) {
  if (!p) return new Date(0);
  if (p.createdAt?.toDate) return p.createdAt.toDate();
  if (p.createdDateTime) return new Date(p.createdDateTime);
  return new Date(0);
}

// helper: returns how many days ago a date happened (0 = today)
function daysAgo(dt) {
  const now = new Date();
  const d = dt instanceof Date ? dt : new Date(dt);
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

// helper: formats date to yyyy-mm-dd for display
function fmt(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}
