
// schedule inspection page logic
// flow:
// - load the stall list from db.js (seed) to populate the dropdown
// - when user clicks schedule, we write a scheduled inspection doc into firestore
// - we also check for duplicates (same stall + same date) so nea doesn't double-book

document.addEventListener("DOMContentLoaded", async function () {
  // local seed db is used for dropdowns (fast + consistent even if firestore is empty)
  var local = loadDB();

  // grab ui elements
  var stallSelect = document.getElementById("stallSelect");
  var scheduledDateInput = document.getElementById("scheduledDate");
  var scheduleBtn = document.getElementById("scheduleBtn");
  var msg = document.getElementById("msg");

  // fill stall dropdown with seed stalls
  stallSelect.innerHTML = (local.stalls || [])
    .map(function (s) {
      return '<option value="' + s.id + '">' + s.name + "</option>";
    })
    .join("");

  // default date to today so officer can schedule quickly
  scheduledDateInput.value = new Date().toISOString().slice(0, 10);

  // check if firestore wrapper is ready before allowing scheduling
  if (!window.DB || typeof DB.addScheduledInspection !== "function") {
    show(
      "db not ready. make sure schedule.html loads firebase.js, firestore-service.js, db-compat.js before schedule.js.",
      true
    );
    scheduleBtn.disabled = true;
    return;
  }

  // main action: schedule a new inspection
  scheduleBtn.addEventListener("click", async function () {
    var stallId = stallSelect.value;
    var date = scheduledDateInput.value;

    // basic validation so we don't write bad docs
    if (!stallId) return show("please select a stall.", true);
    if (!date) return show("please choose a date.", true);

    try {
      // optional duplicate check so the same stall isn't scheduled twice on the same day
      if (typeof DB.getScheduledInspections === "function") {
        var scheduled = await DB.getScheduledInspections("scheduled");
        var exists = (scheduled || []).some(function (s) {
          return s.stallId === stallId && s.scheduledDate === date;
        });
        if (exists) {
          return show("this stall already has an inspection scheduled on that date.", true);
        }
      }

      // write schedule into firestore
      await DB.addScheduledInspection({
        stallId: stallId,
        scheduledDate: date,
        officerId: "nea1",
      });

      show("✅ inspection scheduled successfully.", false);
    } catch (err) {
      console.error(err);
      show("❌ failed to schedule: " + (err?.message || err), true);
    }
  });

  // small helper to show status text to user
  function show(text, isError) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = isError ? "#b00020" : "#1b5e20";
  }
});
