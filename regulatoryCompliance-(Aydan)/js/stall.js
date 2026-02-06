document.addEventListener("DOMContentLoaded", function () {
  var db = loadDB();

  var stallSelect = document.getElementById("stallSelect");
  var historyTable = document.getElementById("historyTable");

  var gradeChartInstance = null;
  var scoreChartInstance = null;

  // Populate dropdown
  stallSelect.innerHTML = (db.stalls || [])
    .map(function (s) {
      return '<option value="' + s.id + '">' + s.name + "</option>";
    })
    .join("");

  if ((db.stalls || []).length > 0) stallSelect.value = db.stalls[0].id;

  renderAll();
  stallSelect.addEventListener("change", renderAll);

  function renderAll() {
    var stallId = stallSelect.value;
    renderHistoryTable(stallId);
    renderMonthlyCharts(stallId);
  }

  // -----------------------
  // History table (WITH violations)
  // -----------------------
  function renderHistoryTable(stallId) {
    var db = loadDB();
    var stall = (db.stalls || []).find(function (s) { return s.id === stallId; });

    var history = (stall && stall.gradeHistory) ? stall.gradeHistory.slice() : [];
    history.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    // Build violations map: inspectionId -> violations
    var vioByInspection = {};
    (db.inspectionViolations || []).forEach(function (v) {
      if (!vioByInspection[v.inspectionId]) vioByInspection[v.inspectionId] = [];
      vioByInspection[v.inspectionId].push(v);
    });

    // Find inspectionId by conductedDate+stallId (best-effort)
    function findInspectionId(stallId, dateStr) {
      var list = db.inspections || [];
      for (var i = 0; i < list.length; i++) {
        var ins = list[i];
        if (ins.stallId === stallId && ins.conductedDate === dateStr) return ins.id;
      }
      return null;
    }

    var rows = history.map(function (h) {
      var inspId = findInspectionId(stallId, h.date);
      var vios = inspId ? (vioByInspection[inspId] || []) : [];
      var vioText = vios.length
        ? vios.map(function (v) { return v.code + " (" + v.severity + ")"; }).join(", ")
        : "None";

      return (
        "<tr>" +
          "<td>" + h.date + "</td>" +
          "<td>" + (h.score != null ? h.score : "-") + "</td>" +
          "<td><strong>" + (h.grade || "-") + "</strong></td>" +
          "<td>" + (h.expiryDate || "-") + "</td>" +
          "<td>" + vioText + "</td>" +
        "</tr>"
      );
    });

    historyTable.innerHTML =
      '<table class="table">' +
        "<thead>" +
          "<tr>" +
            "<th>Date</th>" +
            "<th>Score</th>" +
            "<th>Grade</th>" +
            "<th>Expiry Date</th>" +
            "<th>Violations</th>" +
          "</tr>" +
        "</thead>" +
        "<tbody>" + rows.join("") + "</tbody>" +
      "</table>";
  }

  // -----------------------
  // Monthly charts (Grade + Score)
  // -----------------------
  function renderMonthlyCharts(stallId) {
    var db = loadDB();
    var stall = (db.stalls || []).find(function (s) { return s.id === stallId; });
    var history = (stall && stall.gradeHistory) ? stall.gradeHistory.slice() : [];

    // last 12 months including current month
    var months = buildLast12Months();

    // For each month, pick latest entry in that month
    var monthToLatest = {};
    history.forEach(function (h) {
      var ym = (h.date || "").slice(0, 7); // YYYY-MM
      if (!ym) return;

      if (!monthToLatest[ym]) {
        monthToLatest[ym] = h;
      } else {
        if (new Date(h.date) > new Date(monthToLatest[ym].date)) monthToLatest[ym] = h;
      }
    });

    var gradeMap = { A: 4, B: 3, C: 2, D: 1 };

    var gradePoints = months.map(function (m) {
      var ym = m.ym;
      var h = monthToLatest[ym];
      if (!h || !h.grade) return null;
      return gradeMap[h.grade] || null;
    });

    var scorePoints = months.map(function (m) {
      var ym = m.ym;
      var h = monthToLatest[ym];
      if (!h || h.score == null) return null;
      return Number(h.score);
    });

    var labels = months.map(function (m) { return m.label; });

    // ----- Grade chart -----
    var gradeCanvas = document.getElementById("gradeChart");
    if (!gradeCanvas) return;

    if (gradeChartInstance) gradeChartInstance.destroy();

    gradeChartInstance = new Chart(gradeCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Grade Trend (Monthly)",
            data: gradePoints,
            tension: 0.25,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          y: {
            min: 1,
            max: 4,
            ticks: {
              stepSize: 1,
              callback: function (v) {
                if (v === 4) return "A";
                if (v === 3) return "B";
                if (v === 2) return "C";
                if (v === 1) return "D";
                return v;
              }
            }
          }
        }
      }
    });

    // ----- Score chart -----
    var scoreCanvas = document.getElementById("scoreChart");
    if (!scoreCanvas) return;

    if (scoreChartInstance) scoreChartInstance.destroy();

    scoreChartInstance = new Chart(scoreCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Inspection Score (Monthly)",
            data: scorePoints,
            tension: 0.25,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          y: { min: 0, max: 100 }
        }
      }
    });
  }

  function buildLast12Months() {
    var out = [];
    var d = new Date();
    d.setDate(1);

    for (var i = 11; i >= 0; i--) {
      var x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      var ym = x.toISOString().slice(0, 7);
      var label = x.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
      out.push({ ym: ym, label: label });
    }
    return out;
  }
});
