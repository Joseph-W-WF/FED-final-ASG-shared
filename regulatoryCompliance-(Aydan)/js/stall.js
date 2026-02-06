requireNEA();

var db = loadDB();
var select = document.getElementById("stallSelect");
var historyDiv = document.getElementById("historyTable");
var chart = null;

// dropdown
for (var i = 0; i < db.stalls.length; i++) {
  var o = document.createElement("option");
  o.value = db.stalls[i].id;
  o.textContent = db.stalls[i].name;
  select.appendChild(o);
}

select.addEventListener("change", render);
render();

function render() {
  db = loadDB();

  var stall = null;
  for (var i = 0; i < db.stalls.length; i++) {
    if (db.stalls[i].id === select.value) stall = db.stalls[i];
  }
  if (!stall) return;

  var history = stall.gradeHistory || [];

  renderMonthlyChart(history);
  renderHistoryTable(history);
}

function renderMonthlyChart(history) {
  // month bucket: YYYY-MM -> last grade value in that month
  var monthMap = {}; // { "2026-02": {value:3, label:"Feb 2026"} }

  for (var i = 0; i < history.length; i++) {
    var d = history[i].date;
    if (!d) continue;

    var ym = d.slice(0, 7);
    monthMap[ym] = { value: gradeToValue(history[i].grade), label: monthLabel(ym) };
  }

  var months = [];
  for (var key in monthMap) months.push(key);
  months.sort();

  var labels = [];
  var values = [];
  for (var j = 0; j < months.length; j++) {
    labels.push(monthMap[months[j]].label);
    values.push(monthMap[months[j]].value);
  }

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [{ label: "Grade Trend (Monthly)", data: values }]
    },
    options: {
      scales: {
        y: {
          min: 1, max: 4,
          ticks: {
            stepSize: 1,
            callback: function(v){
              if (v === 4) return "A";
              if (v === 3) return "B";
              if (v === 2) return "C";
              return "D";
            }
          }
        }
      }
    }
  });
}

function renderHistoryTable(history) {
  if (history.length === 0) {
    historyDiv.innerHTML = "<p class='small'>No inspection history yet.</p>";
    return;
  }

  // newest first
  var copy = history.slice();
  copy.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });

  var html = "<table class='table'><thead><tr>" +
    "<th>Date</th><th>Score</th><th>Grade</th><th>Expiry Date</th>" +
    "</tr></thead><tbody>";

  for (var i = 0; i < copy.length; i++) {
    html += "<tr>" +
      "<td>" + copy[i].date + "</td>" +
      "<td>" + (copy[i].score != null ? copy[i].score : "-") + "</td>" +
      "<td><strong>" + copy[i].grade + "</strong></td>" +
      "<td>" + (copy[i].expiryDate || "-") + "</td>" +
      "</tr>";
  }

  html += "</tbody></table>";
  historyDiv.innerHTML = html;
}

function gradeToValue(g) {
  if (g === "A") return 4;
  if (g === "B") return 3;
  if (g === "C") return 2;
  return 1;
}

function monthLabel(ym) {
  var year = ym.slice(0, 4);
  var month = ym.slice(5, 7);

  var name = "Month";
  if (month === "01") name = "Jan";
  else if (month === "02") name = "Feb";
  else if (month === "03") name = "Mar";
  else if (month === "04") name = "Apr";
  else if (month === "05") name = "May";
  else if (month === "06") name = "Jun";
  else if (month === "07") name = "Jul";
  else if (month === "08") name = "Aug";
  else if (month === "09") name = "Sep";
  else if (month === "10") name = "Oct";
  else if (month === "11") name = "Nov";
  else if (month === "12") name = "Dec";

  return name + " " + year;
}
