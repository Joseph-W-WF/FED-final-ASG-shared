

window.FED = window.FED || {};

FED.queueCompat = (() => {
  const LS_KEY = "fed_queue_db_v1";

  function seedFromStalls() {
    const stalls = (FED.data && FED.data.STALLS) ? FED.data.STALLS : [];
    return {
      queues: stalls.map(s => ({ stallId: s.id, tickets: [] })),
      createdAt: new Date().toISOString(),
    };
  }

  function ensureQueues(db) {
    const stalls = (FED.data && FED.data.STALLS) ? FED.data.STALLS : [];

    if (!db || typeof db !== "object") db = {};
    if (!Array.isArray(db.queues)) db.queues = [];

    // Ensure each queue has a tickets array
    db.queues.forEach(q => {
      if (!q || typeof q !== "object") return;
      if (!Array.isArray(q.tickets)) q.tickets = [];
    });

    // Ensure queue exists for each stall in data.js
    stalls.forEach(s => {
      const exists = db.queues.some(q => q && q.stallId === s.id);
      if (!exists) db.queues.push({ stallId: s.id, tickets: [] });
    });

    return db;
  }

  function makeId(prefix) {
    const p = prefix || "id";
    const rand = Math.floor(Math.random() * 1000000);
    return `${p}_${Date.now()}_${rand}`;
  }

  function loadDB() {
    const utils = FED.utils;
    const loadJSON = utils && utils.loadJSON;

    let db = seedFromStalls();
    if (typeof loadJSON === "function") {
      db = loadJSON(LS_KEY, db);
    }

    return ensureQueues(db);
  }

  function saveDB(db) {
    const utils = FED.utils;
    const saveJSON = utils && utils.saveJSON;

    const fixed = ensureQueues(db);
    if (typeof saveJSON === "function") {
      saveJSON(LS_KEY, fixed);
    }
  }

  function resetQueueDB() {
    const fresh = seedFromStalls();
    saveDB(fresh);
    return fresh;
  }

  // Update a ticket status (used when customer marks order Completed/Failed)
  function setTicketStatus(stallId, ticketId, status) {
    const db = loadDB();
    const q = (db.queues || []).find(x => x.stallId === stallId);
    if (!q) return false;

    const t = (q.tickets || []).find(x => x.ticketId === ticketId);
    if (!t) return false;

    t.status = status;
    t.updatedAt = new Date().toISOString();
    saveDB(db);
    return true;
  }

  return { LS_KEY, loadDB, saveDB, makeId, resetQueueDB, setTicketStatus };
})();

// Provide the GLOBALS that queueTicketSystem.js expects
window.loadDB = FED.queueCompat.loadDB;
window.saveDB = FED.queueCompat.saveDB;
window.makeId = FED.queueCompat.makeId;
