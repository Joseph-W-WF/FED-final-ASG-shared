requireNEA();

document.addEventListener("DOMContentLoaded", async function () {
  var local = loadDB();

  var stallSelect = document.getElementById("stallSelect");
  var scheduledDateInput = document.getElementById("scheduledDate");
  var scheduleBtn = document.getElementById("scheduleBtn");
  var msg = document.getElementById("msg");

  // Populate stalls (static from db.js)
  stallSelect.innerHTML = (local.stalls || [])
    .map(function (s) {
      return '<option value="' + s.id + '">' + s.name + "</option>";
    })
    .join("");

  // Default date = today
  scheduledDateInput.value = new Date().toISOString().slice(0, 10);

  // Ensure Firestore DB API exists
  if (!window.DB || typeof DB.addScheduledInspection !== "function") {
    show(
      "DB not ready. Ensure schedule.html loads firebase.js, firestore-service.js, db-compat.js BEFORE schedule.js.",
      true
    );
    scheduleBtn.disabled = true;
    return;
  }

  scheduleBtn.addEventListener("click", async function () {
    var stallId = stallSelect.value;
    var date = scheduledDateInput.value;

    if (!stallId) return show("Please select a stall.", true);
    if (!date) return show("Please choose a date.", true);

    try {
      // Check duplicate schedules in Firestore (status = scheduled)
      if (typeof DB.getScheduledInspections === "function") {
        var scheduled = await DB.getScheduledInspections("scheduled");
        var exists = (scheduled || []).some(function (s) {
          return s.stallId === stallId && s.scheduledDate === date;
        });
        if (exists) {
          return show(
            "This stall already has an inspection scheduled on that date.",
            true
          );
        }
      }

      // Save schedule into Firestore
      await DB.addScheduledInspection({
        stallId: stallId,
        scheduledDate: date, // YYYY-MM-DD
        officerId: "nea1",
      });

      show("✅ Inspection scheduled successfully.", false);
    } catch (err) {
      console.error(err);
      show("❌ Failed to schedule: " + (err?.message || err), true);
    }
  });

  function show(text, isError) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = isError ? "#b00020" : "#1b5e20";
  }
});
