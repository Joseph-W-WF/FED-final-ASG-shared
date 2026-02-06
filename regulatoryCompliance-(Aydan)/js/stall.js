requireNEA();

var db = loadDB();
var select = document.getElementById("stallSelect");
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
  var stall = null;
  for (var i = 0; i < db.stalls.length; i++) {
    if (db.stalls[i].id === select.value) stall = db.stalls[i];
  }
  if (!stall) return;

  var history = stall.gradeHistory || [];

  // Build month buckets: YYYY-MM => last grade value in that month
  var monthMap = {}; // { "2026-01": {value:4, label:"Jan 2026"} }

  for (var j = 0; j < history.length; j++) {
    var d = history[j].date; // YYYY-MM-DD
    if (!d) continue;

    var ym = d.slice(0, 7); // YYYY-MM
    var grade = history[j].grade;

    monthMap[ym] = {
      value: gradeToValue(grade),
      label: monthLabel(ym)
    };
  }

  // Sort months
  var months = [];
  for (var key in monthMap) months.push(key);
  months.sort(); // YYYY-MM sorts correctly

  var labels = [];
  var values = [];
  for (var k = 0; k < months.length; k++) {
    var ym2 = months[k];
    labels.push(monthMap[ym2].label);
    values.push(monthMap[ym2].value);
  }

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "Grade Trend (Monthly)", data: values }
      ]
    },
    options: {
      scales: {
        y: { min: 1, max: 4, ticks: { stepSize: 1 } }
      }
    }
  });
}

function gradeToValue(g) {
  if (g === "A") return 4;
  if (g === "B") return 3;
  if (g === "C") return 2;
  return 1; // D
}

function monthLabel(ym) {
  // ym = "YYYY-MM"
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
