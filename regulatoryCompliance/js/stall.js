requireNEA();
var db = loadDB();
var select = document.getElementById("stallSelect");
var chart;

db.stalls.forEach(s => {
  var o = document.createElement("option");
  o.value = s.id;
  o.textContent = s.name;
  select.appendChild(o);
});

select.addEventListener("change", render);
render();

function render() {
  var stall = db.stalls.find(s => s.id === select.value);
  var labels = [];
  var values = [];

  stall.gradeHistory.forEach(h => {
    labels.push(h.date);
    values.push(h.grade === "A" ? 4 : h.grade === "B" ? 3 : h.grade === "C" ? 2 : 1);
  });

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: { labels, datasets:[{ label:"Grade Trend", data: values }] },
    options: { scales:{ y:{ min:1, max:4 } } }
  });
}

