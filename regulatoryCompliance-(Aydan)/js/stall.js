requireNEA();

let gradeChart = null;
let scoreChart = null;

document.addEventListener("DOMContentLoaded", () => {
  const db = loadDB();

  const stallSelect = document.getElementById("stallSelect");
  if (!stallSelect) return;

  // Populate dropdown
  stallSelect.innerHTML = (db.stalls || [])
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join("");

  stallSelect.addEventListener("change", () => renderForStall(stallSelect.value));

  // default render
  if ((db.stalls || []).length > 0) {
    renderForStall(stallSelect.value);
  } else {
    renderEmptyCharts();
    renderHistoryTable([]);
  }
});

function renderForStall(stallId) {
  const db = loadDB();
  const stall = (db.stalls || []).find((s) => s.id === stallId);
  const history = (stall && stall.gradeHistory) ? stall.gradeHistory.slice() : [];

  // sort ascending by date for processing
  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Build last 12 months window based on latest date in history (fallback to today)
  const latestDate = getLatestDate(history) || new Date().toISOString().slice(0, 10);
  const months = buildLast12Months(latestDate); // [{key:'YYYY-MM', label:'Jan 2026'}, ...]

  // For each month, pick the latest record inside that month
  const monthToRecord = {};
  for (let i = 0; i < history.length; i++) {
    const d = String(history[i].date || "");
    if (d.length < 7) continue;
    const key = d.slice(0, 7);

    // keep the latest date record for that month
    if (!monthToRecord[key]) monthToRecord[key] = history[i];
    else {
      const prev = monthToRecord[key];
      if (new Date(history[i].date) > new Date(prev.date)) monthToRecord[key] = history[i];
    }
  }

  // Build series
  const labels = months.map((m) => m.label);

  const gradeValues = months.map((m) => {
    const rec = monthToRecord[m.key];
    return rec ? gradeToNum(rec.grade) : null;
  });

  const scoreValues = months.map((m) => {
    const rec = monthToRecord[m.key];
    return rec && Number.isFinite(Number(rec.score)) ? Number(rec.score) : null;
  });

  renderGradeChart(labels, gradeValues);
  renderScoreChart(labels, scoreValues);

  // History table (newest first)
  const historyDesc = history.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  renderHistoryTable(historyDesc);
}

function renderEmptyCharts() {
  renderGradeChart([], []);
  renderScoreChart([], []);
}

function renderGradeChart(labels, values) {
  const ctx = document.getElementById("gradeChart");
  if (!ctx) return;

  if (gradeChart) gradeChart.destroy();

  gradeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Grade Trend (Monthly)",
          data: values,
          spanGaps: true
        }
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          min: 1,
          max: 4,
          ticks: {
            stepSize: 1,
            callback: (v) => numToGrade(v)
          }
        }
      }
    }
  });
}

function renderScoreChart(labels, values) {
  const ctx = document.getElementById("scoreChart");
  if (!ctx) return;

  if (scoreChart) scoreChart.destroy();

  scoreChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Inspection Score (Monthly)",
          data: values,
          spanGaps: true
        }
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          min: 0,
          max: 100
        }
      }
    }
  });
}

function renderHistoryTable(history) {
  const el = document.getElementById("historyTable");
  if (!el) return;

  if (!history || history.length === 0) {
    el.innerHTML = "<p class='small'>No inspection history yet.</p>";
    return;
  }

  let html =
    "<table class='table'><thead><tr>" +
    "<th>Date</th><th>Score</th><th>Grade</th><th>Expiry Date</th>" +
    "</tr></thead><tbody>";

  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    html +=
      "<tr>" +
      "<td>" + (h.date || "-") + "</td>" +
      "<td>" + (Number.isFinite(Number(h.score)) ? Number(h.score) : "-") + "</td>" +
      "<td><strong>" + (h.grade || "-") + "</strong></td>" +
      "<td>" + (h.expiryDate || "-") + "</td>" +
      "</tr>";
  }

  html += "</tbody></table>";
  el.innerHTML = html;
}

/* Helpers */

function gradeToNum(g) {
  if (g === "A") return 4;
  if (g === "B") return 3;
  if (g === "C") return 2;
  if (g === "D") return 1;
  return null;
}

function numToGrade(n) {
  if (n === 4) return "A";
  if (n === 3) return "B";
  if (n === 2) return "C";
  if (n === 1) return "D";
  return "";
}

function getLatestDate(history) {
  if (!history || history.length === 0) return null;
  let latest = history[0].date;
  for (let i = 1; i < history.length; i++) {
    if (new Date(history[i].date) > new Date(latest)) latest = history[i].date;
  }
  return latest;
}

function buildLast12Months(latestDateStr) {
  const latest = new Date(latestDateStr);
  const result = [];

  // go back 11 months, then forward to latest month
  const start = new Date(latest.getFullYear(), latest.getMonth() - 11, 1);

  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    const label = d.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
    result.push({ key, label });
  }

  return result;
}
