document.addEventListener("DOMContentLoaded", function () {
  var db = loadDB();

  var stallSelect = document.getElementById("stallSelect");
  var scheduledDate = document.getElementById("scheduledDate");
  var scheduleBtn = document.getElementById("scheduleBtn");
  var msg = document.getElementById("msg");

  // Populate stalls
  stallSelect.innerHTML = (db.stalls || [])
    .map(function (s) {
      return '<option value="' + s.id + '">' + s.name + "</option>";
    })
    .join("");

  // Default date = today
  scheduledDate.value = new Date().toISOString().slice(0, 10);

  scheduleBtn.addEventListener("click", function () {
    var stallId = stallSelect.value;
    var date = scheduledDate.value;

    if (!stallId) return show("Please select a stall.", true);
    if (!date) return show("Please choose a date.", true);

    var db = loadDB();

    // Prevent duplicate schedule for same stall + same date
    var exists = (db.inspections || []).some(function (i) {
      return i.stallId === stallId && i.scheduledDate === date;
    });
    if (exists) return show("This stall already has an inspection scheduled on that date.", true);

    var newInsp = {
      id: makeId("insp"),
      stallId: stallId,
      officerId: "nea1",
      scheduledDate: date,

      // not logged yet
      conductedDate: null,
      score: null,
      grade: null,
      remarks: ""
    };

    db.inspections = db.inspections || [];
    db.inspections.push(newInsp);
    saveDB(db);

    show("✅ Inspection scheduled successfully.", false);
  });

  function show(text, isError) {
    msg.textContent = text;
    msg.style.color = isError ? "#b00020" : "#1b5e20";
  }
});
