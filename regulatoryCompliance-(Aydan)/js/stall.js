// stall transparency page (nea)
// this page lets nea (and in future maybe customers) see a stall's inspection history + trends
// logic:
// - stall list comes from db.js (seed) to populate the dropdown
// - inspections come from firestore (so the table + charts reflect real logs)
// - for charts, we look at the last 12 months and plot the latest inspection in each month

document.addEventListener("DOMContentLoaded", function () {
  // seed db for stall names + ids
  var local = loadDB();

  // ui elements
  var stallSelect = document.getElementById("stallSelect");
  var historyTable = document.getElementById("historyTable");

  // chart.js instance refs so we can destroy/recreate when switching stalls
  var gradeChartInstance = null;
  var scoreChartInstance = null;

  // fill stall dropdown from seed list
  stallSelect.innerHTML = (local.stalls || [])
    .map(function (s) {
      return '<option value="' + s.id + '">' + s.name + "</option>";
    })
    .join("");

  if ((local.stalls || []).length > 0) stallSelect.value = local.stalls[0].id;

  // re-render when user picks a new stall
  stallSelect.addEventListener("change", function () {
    renderAll().catch(console.error);
  });

  // initial render
  renderAll().catch(console.error);

  async function renderAll() {
    var stallId = stallSelect.value;

    // firestore wrapper is needed for inspections; if missing, show helpful message
    if (!window.DB || typeof DB.getInspectionsByStall !== "function") {
      historyTable.innerHTML =
        "<p class='small'>firestore db not loaded. check links (firebase.js, firestore-service.js, db-compat.js).</p>";
      return;
    }

    // fetch inspection history for this stall (from firestore)
    var inspections = await DB.getInspectionsByStall(stallId);
    inspections = Array.isArray(inspections) ? inspections : [];

    // table includes violations (fetched per inspection)
    await renderHistoryTableFromFirestore(stallId, inspections);

    // charts are computed from inspections list (monthly latest)
    renderMonthlyChartsFromFirestore(inspections);
  }

  // history table (with violations)
  // logic:
  // - sort newest first
  // - for each inspection, fetch violations list (if api exists)
  // - render a simple table with violations summarized in one cell
  async function renderHistoryTableFromFirestore(stallId, inspections) {
    inspections.sort(function (a, b) {
      return new Date(b.conductedDate || 0) - new Date(a.conductedDate || 0);
    });

    if (inspections.length === 0) {
      historyTable.innerHTML =
        "<p class='small'>no inspection history yet for this stall.</p>";
      return;
    }

    // map inspectionId -> violations[] so we can render fast after fetching
    var vioMap = {};
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

      // show compact text like "v001 (major), v010 (critical)"
      var vioText = vios.length
        ? vios
            .map(function (v) {
              return (v.code || "v?") + " (" + (v.severity || "MAJOR") + ")";
            })
            .join(", ")
        : "none";

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
      "<th>date</th>" +
      "<th>score</th>" +
      "<th>grade</th>" +
      "<th>expiry date</th>" +
      "<th>violations</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      rows.join("") +
      "</tbody>" +
      "</table>";
  }

  // charts (grade + score)
  // logic:
  // - build a list of last 12 months labels
  // - find the latest inspection inside each month (yyyy-mm)
  // - convert grade letters into numbers so chart.js can plot them (a=4..d=1)
  function renderMonthlyChartsFromFirestore(inspections) {
    var months = buildLast12Months();

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

    // grade chart: y axis ticks are converted back into letters for readability
    var gradeCanvas = document.getElementById("gradeChart");
    if (gradeCanvas) {
      if (gradeChartInstance) gradeChartInstance.destroy();

      gradeChartInstance = new Chart(gradeCanvas.getContext("2d"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "grade trend (monthly)",
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

    // score chart: plain 0-100 scale
    var scoreCanvas = document.getElementById("scoreChart");
    if (scoreCanvas) {
      if (scoreChartInstance) scoreChartInstance.destroy();

      scoreChartInstance = new Chart(scoreCanvas.getContext("2d"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "inspection score (monthly)",
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

  // builds labels for the last 12 months like "jan 2026"
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
