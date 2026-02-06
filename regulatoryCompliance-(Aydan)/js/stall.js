document.addEventListener("DOMContentLoaded", function () {
  var local = loadDB();

  var stallSelect = document.getElementById("stallSelect");
  var historyTable = document.getElementById("historyTable");

  var gradeChartInstance = null;
  var scoreChartInstance = null;

  // Populate dropdown from STATIC local stalls (hybrid)
  stallSelect.innerHTML = (local.stalls || [])
    .map(function (s) {
      return '<option value="' + s.id + '">' + s.name + "</option>";
    })
    .join("");

  if ((local.stalls || []).length > 0) stallSelect.value = local.stalls[0].id;

  stallSelect.addEventListener("change", function () {
    renderAll().catch(console.error);
  });

  renderAll().catch(console.error);

  async function renderAll() {
    var stallId = stallSelect.value;

    if (!window.DB || typeof DB.getInspectionsByStall !== "function") {
      historyTable.innerHTML =
        "<p class='small'>Firestore DB not loaded. Check your module script links (firebase.js, firestore-service.js, db-compat.js).</p>";
      return;
    }

    // Read inspection history from Firestore
    var inspections = await DB.getInspectionsByStall(stallId);
    inspections = Array.isArray(inspections) ? inspections : [];

    await renderHistoryTableFromFirestore(stallId, inspections);
    renderMonthlyChartsFromFirestore(inspections);
  }

  // -----------------------
  // History table (WITH violations) — from Firestore
  // -----------------------
  async function renderHistoryTableFromFirestore(stallId, inspections) {
    // sort newest first by conductedDate
    inspections.sort(function (a, b) {
      return new Date(b.conductedDate || 0) - new Date(a.conductedDate || 0);
    });

    if (inspections.length === 0) {
      historyTable.innerHTML =
        "<p class='small'>No inspection history yet for this stall.</p>";
      return;
    }

    // Load violations for each inspection (small datasets -> ok)
    var vioMap = {}; // inspectionId -> [vios]
    if (typeof DB.getInspectionViolations === "function") {
      var pairs = await Promise.all(
        inspections.map(async function (ins) {
          try {
            var v = await DB.getInspectionViolations(ins.id);
            return [ins.id, Array.isArray(v) ? v : []];
          } catch (e) {
            return [ins.id, []];
          }
        })
      );
      pairs.forEach(function (p) {
        vioMap[p[0]] = p[1];
      });
    }

    var rows = inspections.map(function (ins) {
      var vios = vioMap[ins.id] || [];
      var vioText = vios.length
        ? vios
            .map(function (v) {
              return (v.code || "V?") + " (" + (v.severity || "MAJOR") + ")";
            })
            .join(", ")
        : "None";

      return (
        "<tr>" +
        "<td>" +
        (ins.conductedDate || "-") +
        "</td>" +
        "<td>" +
        (ins.score != null ? ins.score : "-") +
        "</td>" +
        "<td><strong>" +
        (ins.grade || "-") +
        "</strong></td>" +
        "<td>" +
        (ins.expiryDate || "-") +
        "</td>" +
        "<td>" +
        vioText +
        "</td>" +
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
      "<tbody>" +
      rows.join("") +
      "</tbody>" +
      "</table>";
  }

  // -----------------------
  // Monthly charts (Grade + Score) — from Firestore inspections
  // -----------------------
  function renderMonthlyChartsFromFirestore(inspections) {
    var months = buildLast12Months();

    // For each month, pick latest inspection in that month
    var monthToLatest = {};
    inspections.forEach(function (ins) {
      var dateStr = ins.conductedDate || "";
      var ym = dateStr.slice(0, 7);
      if (!ym) return;

      if (!monthToLatest[ym]) {
        monthToLatest[ym] = ins;
      } else {
        if (new Date(dateStr) > new Date(monthToLatest[ym].conductedDate || 0)) {
          monthToLatest[ym] = ins;
        }
      }
    });

    var gradeMap = { A: 4, B: 3, C: 2, D: 1 };

    var gradePoints = months.map(function (m) {
      var h = monthToLatest[m.ym];
      if (!h || !h.grade) return null;
      return gradeMap[h.grade] || null;
    });

    var scorePoints = months.map(function (m) {
      var h = monthToLatest[m.ym];
      if (!h || h.score == null) return null;
      return Number(h.score);
    });

    var labels = months.map(function (m) {
      return m.label;
    });

    // ----- Grade chart -----
    var gradeCanvas = document.getElementById("gradeChart");
    if (gradeCanvas) {
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
              spanGaps: true,
            },
          ],
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
                },
              },
            },
          },
        },
      });
    }

    // ----- Score chart -----
    var scoreCanvas = document.getElementById("scoreChart");
    if (scoreCanvas) {
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
              spanGaps: true,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { min: 0, max: 100 } },
        },
      });
    }
  }

  function buildLast12Months() {
    var out = [];
    var d = new Date();
    d.setDate(1);

    for (var i = 11; i >= 0; i--) {
      var x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      var ym = x.toISOString().slice(0, 7);
      var label = x.toLocaleDateString("en-SG", {
        month: "short",
        year: "numeric",
      });
      out.push({ ym: ym, label: label });
    }
    return out;
  }
});
