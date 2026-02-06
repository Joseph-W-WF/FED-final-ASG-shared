// ========================================
// db.js (In-Memory Database)
// Beginner-friendly, shared across pages
// NO backend, NO localStorage
// ========================================

const DB_KEY = "hawkerDB_v1"; // kept for compatibility (not used)

let _memoryDB = null;

function loadDB() {
  if (_memoryDB !== null) return _memoryDB;
  _memoryDB = createSeedDB();
  return _memoryDB;
}

function saveDB(db) {
  _memoryDB = db;
}

function resetDB() {
  _memoryDB = null;
  return loadDB();
}

function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// Score -> Hygiene grade
function scoreToGrade(score) {
  score = Number(score);
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

// Add days to YYYY-MM-DD, return YYYY-MM-DD
function addDaysToDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function createSeedDB() {
  // -----------------------------
  // Fixed stalls (match teammate)
  // -----------------------------
  const stalls = [
    { id: "s1", hawkerCentreId: "hc1", name: "Clemens Kitchen", vendorUserId: "v1", gradeHistory: [] },
    { id: "s2", hawkerCentreId: "hc1", name: "Indian Corner", vendorUserId: "v2", gradeHistory: [] },
    { id: "s3", hawkerCentreId: "hc1", name: "Pasta Place", vendorUserId: null, gradeHistory: [] },
    { id: "s4", hawkerCentreId: "hc1", name: "Malay Delights", vendorUserId: null, gradeHistory: [] },
    { id: "s5", hawkerCentreId: "hc1", name: "Peranakan Kitchen", vendorUserId: null, gradeHistory: [] },
  ];

  const stallNameToId = {};
  for (let i = 0; i < stalls.length; i++) stallNameToId[stalls[i].name] = stalls[i].id;

  // -----------------------------
  // Orders (kept from your version)
  // -----------------------------
  const yourOrders = [
    { id: 1, item: "Laksa", price: 5.5, date: "2026-01-20T20:30:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD001", paymentMethod: "PayNow", customerName: "Alicia Tan" },
    { id: 2, item: "Prata", price: 2.6, date: "2026-01-18T19:15:00", stall: "Indian Corner", status: "Collected", quantity: 2, orderNumber: "ORD002", paymentMethod: "Cash", customerName: "Darren Lim" },
    { id: 3, item: "Carbonara", price: 6.5, date: "2026-01-15T20:25:00", stall: "Pasta Place", status: "Collected", quantity: 1, orderNumber: "ORD003", paymentMethod: "NETS", customerName: "Jia Wei" },
    { id: 4, item: "Nasi Lemak", price: 5.0, date: "2026-01-22T12:00:00", stall: "Malay Delights", status: "active", quantity: 1, orderNumber: "ORD004", paymentMethod: "PayNow", customerName: "Nur Aisyah" },
    { id: 5, item: "Laksa", price: 5.5, date: "2026-01-10T18:30:00", stall: "Peranakan Kitchen", status: "cancelled", quantity: 1, orderNumber: "ORD005", paymentMethod: "Cash", customerName: "Ryan Goh" },
    { id: 6, item: "Mushroom soup", price: 4.5, date: "2026-02-02T13:10:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD006", paymentMethod: "NETS", customerName: "Alicia Tan" },
    { id: 7, item: "Fish soup", price: 4.5, date: "2026-02-10T19:40:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD007", paymentMethod: "PayNow", customerName: "Darren Lim" },
    { id: 8, item: "Chicken Rice Set", price: 8.8, date: "2026-03-05T12:25:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD008", paymentMethod: "Cash", customerName: "Alicia Tan" },
    { id: 9, item: "Chicken Rice", price: 6.6, date: "2026-03-16T18:05:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD009", paymentMethod: "NETS", customerName: "Nur Aisyah" },
    { id: 10, item: "Chicken Rice", price: 6.6, date: "2026-04-01T11:50:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD010", paymentMethod: "PayNow", customerName: "Ryan Goh" },
    { id: 11, item: "Fish soup", price: 4.5, date: "2026-04-18T20:15:00", stall: "Clemens Kitchen", status: "active", quantity: 1, orderNumber: "ORD011", paymentMethod: "NETS", customerName: "Darren Lim" },
    { id: 12, item: "Chicken Rice", price: 6.6, date: "2026-05-08T12:40:00", stall: "Clemens Kitchen", status: "cancelled", quantity: 1, orderNumber: "ORD012", paymentMethod: "Cash", customerName: "Jia Wei" },
    { id: 13, item: "Fish soup", price: 6.6, date: "2026-06-14T19:00:00", stall: "Clemens Kitchen", status: "cancelled", quantity: 1, orderNumber: "ORD013", paymentMethod: "Cash", customerName: "Ryan Goh" },
    { id: 14, item: "Chicken Rice Set", price: 8.8, date: "2026-06-25T13:30:00", stall: "Clemens Kitchen", status: "active", quantity: 1, orderNumber: "ORD014", paymentMethod: "PayNow", customerName: "Alicia Tan" },
    { id: 15, item: "Mushroom soup", price: 4.5, date: "2026-02-03T10:20:00", stall: "Clemens Kitchen", status: "active", quantity: 1, orderNumber: "ORD015", paymentMethod: "PayNow", customerName: "Zhi Hao" },
  ];

  const statusMap = (s) => {
    const x = String(s || "").toLowerCase();
    if (x === "collected") return "COMPLETED";
    if (x === "cancelled") return "CANCELLED";
    if (x === "active") return "PLACED";
    return "PLACED";
  };

  const methodMap = (m) => {
    const x = String(m || "").toUpperCase();
    if (x === "PAYNOW") return "PAYNOW";
    if (x === "NETS") return "NETS";
    if (x === "CASH") return "CASH";
    return x || "CASH";
  };

  // -----------------------------
  // Cuisines + Menu Items
  // -----------------------------
  const cuisines = [
    { id: "cu1", name: "Chinese" },
    { id: "cu2", name: "Malay" },
    { id: "cu3", name: "Indian" },
    { id: "cu4", name: "Western" },
    { id: "cu5", name: "Peranakan" },
  ];

  const cuisineNameToId = {};
  for (let i = 0; i < cuisines.length; i++) cuisineNameToId[cuisines[i].name] = cuisines[i].id;

  const simpleMenu = [
    { name: "Chicken Rice", cuisines: ["Chinese", "Malay"], price: 5.5 },
    { name: "Nasi Lemak", cuisines: ["Malay"], price: 5.0 },
    { name: "Carbonara", cuisines: ["Western"], price: 6.5 },
    { name: "Prata", cuisines: ["Indian"], price: 2.6 },
    { name: "Fish soup", cuisines: ["Chinese"], price: 4.5 },
    { name: "Mushroom soup", cuisines: ["Western"], price: 4.5 },
    { name: "Laksa", cuisines: ["Peranakan"], price: 5.5 },
    { name: "Chicken Rice Set", cuisines: ["Chinese", "Malay"], price: 8.8 },
  ];

  // map item->stall using your orders (first occurrence)
  const itemToStallName = {};
  for (let i = 0; i < yourOrders.length; i++) {
    const it = yourOrders[i].item;
    if (!itemToStallName[it]) itemToStallName[it] = yourOrders[i].stall;
  }

  const menuItems = [];
  const menuItemCuisines = [];
  let menuAuto = 1;

  for (let i = 0; i < simpleMenu.length; i++) {
    const item = simpleMenu[i];
    const stallName = itemToStallName[item.name] || "Clemens Kitchen";
    const stallId = stallNameToId[stallName] || "s1";

    const id = "m" + menuAuto++;
    menuItems.push({
      id,
      stallId,
      name: item.name,
      description: "",
      price: item.price,
      isAvailable: true,
      imageUrl: "",
    });

    for (let j = 0; j < item.cuisines.length; j++) {
      const cid = cuisineNameToId[item.cuisines[j]];
      if (cid) menuItemCuisines.push({ menuItemId: id, cuisineId: cid });
    }
  }

  function findMenuItemIdByName(name) {
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].name === name) return menuItems[i].id;
    }
    return null;
  }

  const orders = [];
  const orderItems = [];
  const payments = [];

  for (let i = 0; i < yourOrders.length; i++) {
    const o = yourOrders[i];
    const qty = typeof o.quantity === "number" ? o.quantity : 1;
    const unitPrice = typeof o.price === "number" ? o.price : 0;
    const total = unitPrice * qty;

    const orderId = "o" + o.orderNumber;
    const stallId = stallNameToId[o.stall] || "s1";
    const mid = findMenuItemIdByName(o.item);

    orders.push({
      id: orderId,
      customerIdOrGuestId: "guest_" + String(o.customerName || "Customer").replace(/\s+/g, ""),
      isGuest: true,
      stallId,
      createdDateTime: o.date || "",
      status: statusMap(o.status),
      totalAmount: Number(total.toFixed(2)),
      notes: "",
    });

    orderItems.push({
      id: "oi" + o.orderNumber,
      orderId,
      menuItemId: mid,
      qty,
      unitPrice,
      addonsTotal: 0,
      lineTotal: Number(total.toFixed(2)),
    });

    payments.push({
      id: "p" + o.orderNumber,
      orderId,
      method: methodMap(o.paymentMethod),
      status: "SUCCESS",
      paidAmount: Number(total.toFixed(2)),
      createdDateTime: o.date || "",
    });
  }

  // -----------------------------
  // Rental agreements (example)
  // -----------------------------
  const rentalAgreements = [
    { id: "R20462", startDate: "2024-02-12", endDate: "2026-02-11", amount: 1200, status: "Active" },
    { id: "R19823", startDate: "2023-11-15", endDate: "2025-11-14", amount: 1350, status: "Active" },
  ];

  // ==========================================================
  // MEMBER A: Seed 12 months of grade history + inspections
  // ==========================================================
  function pushMonthlyHistory(stallId, year, grades, scores) {
    const stall = stalls.find((s) => s.id === stallId);
    if (!stall) return;

    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, "0");
      const date = `${year}-${mm}-15`;
      const grade = grades[m - 1];
      const score = scores[m - 1];
      stall.gradeHistory.push({
        date,
        grade,
        score,
        expiryDate: addDaysToDate(date, 180),
      });
    }
  }

  // 12 months in 2026 for graphs (A/B for Clemens, more issues for Indian)
  pushMonthlyHistory("s1", 2026,
    ["A","A","B","A","A","A","B","A","A","B","A","A"],
    [92, 88, 78, 86, 89, 91, 74, 87, 90, 72, 88, 92]
  );

  pushMonthlyHistory("s2", 2026,
    ["C","D","C","D","C","C","D","C","D","C","D","D"],
    [60, 50, 58, 45, 57, 55, 49, 59, 44, 56, 48, 46]
  );

  pushMonthlyHistory("s3", 2026,
    ["B","B","B","A","A","A","B","B","A","A","B","A"],
    [75, 73, 71, 86, 88, 85, 74, 76, 87, 89, 72, 90]
  );

  pushMonthlyHistory("s4", 2026,
    ["B","B","A","A","B","B","B","A","B","B","A","A"],
    [72, 70, 85, 86, 74, 73, 71, 87, 75, 72, 88, 89]
  );

  pushMonthlyHistory("s5", 2026,
    ["B","C","B","C","C","B","C","C","B","C","C","B"],
    [74, 55, 73, 56, 58, 72, 54, 57, 71, 55, 59, 70]
  );

  // Guarantee: expiry alerts show something (latest entry expires within 30 days)
  // We do this by appending a "recent" inspection whose expiry is soon.
  const todayStr = new Date().toISOString().slice(0, 10);
  const conductedNear = addDaysToDate(todayStr, -170); // expiry in 10 days
  stalls.find(s => s.id === "s1").gradeHistory.push({
    date: conductedNear,
    grade: "A",
    score: 90,
    expiryDate: addDaysToDate(conductedNear, 180)
  });

  // Inspections: create a few that align with history (enough for KPIs/offenders)
  const inspections = [
    { id: "insp_seed_ck_1", stallId: "s1", officerId: "nea1", scheduledDate: "2026-01-13", conductedDate: "2026-01-15", score: 92, grade: "A", remarks: "Good hygiene practices observed." },
    { id: "insp_seed_ck_7", stallId: "s1", officerId: "nea1", scheduledDate: "2026-07-13", conductedDate: "2026-07-15", score: 74, grade: "B", remarks: "Minor issues found, corrected on-site." },

    { id: "insp_seed_ic_2", stallId: "s2", officerId: "nea1", scheduledDate: "2026-02-13", conductedDate: "2026-02-15", score: 50, grade: "D", remarks: "Critical storage issue found." },
    { id: "insp_seed_ic_7", stallId: "s2", officerId: "nea1", scheduledDate: "2026-07-13", conductedDate: "2026-07-15", score: 49, grade: "D", remarks: "Repeated issues, warning issued." },
    { id: "insp_seed_ic_9", stallId: "s2", officerId: "nea1", scheduledDate: "2026-09-13", conductedDate: "2026-09-15", score: 44, grade: "D", remarks: "Pest sighting reported, urgent action required." },

    // recent (for expiry soon)
    { id: "insp_seed_recent", stallId: "s1", officerId: "nea1", scheduledDate: null, conductedDate: conductedNear, score: 90, grade: "A", remarks: "Recent check (demo for expiry alert)." },
  ];

  const violationCatalog = [
    { code: "V001", title: "Unclean preparation area", severityDefault: "MAJOR" },
    { code: "V002", title: "Improper food storage", severityDefault: "CRITICAL" },
    { code: "V003", title: "Pest sighting", severityDefault: "CRITICAL" },
    { code: "V004", title: "Staff hygiene issue", severityDefault: "MINOR" },
  ];

  const inspectionViolations = [
    { id: "vio_ic_2_v002", inspectionId: "insp_seed_ic_2", code: "V002", title: "Improper food storage", severity: "CRITICAL", notes: "" },
    { id: "vio_ic_7_v001", inspectionId: "insp_seed_ic_7", code: "V001", title: "Unclean preparation area", severity: "MAJOR", notes: "" },
    { id: "vio_ic_9_v003", inspectionId: "insp_seed_ic_9", code: "V003", title: "Pest sighting", severity: "CRITICAL", notes: "" },
  ];

  const penalties = [
    { id: "pen_ic_2_warn", stallId: "s2", inspectionId: "insp_seed_ic_2", action: "WARNING", createdDateTime: "2026-02-15T10:00:00.000Z" },
    { id: "pen_ic_2_rein", stallId: "s2", inspectionId: "insp_seed_ic_2", action: "REINSPECTION", createdDateTime: "2026-02-15T10:00:00.000Z" },

    { id: "pen_ic_7_warn", stallId: "s2", inspectionId: "insp_seed_ic_7", action: "WARNING", createdDateTime: "2026-07-15T10:00:00.000Z" },
    { id: "pen_ic_9_rein", stallId: "s2", inspectionId: "insp_seed_ic_9", action: "REINSPECTION", createdDateTime: "2026-09-15T10:00:00.000Z" },
  ];

  // -----------------------------
  // Return DB
  // -----------------------------
  return {
    users: [
      { id: "nea1", role: "NEA", username: "nea", password: "nea123" },
      { id: "v1", role: "VENDOR", username: "vendor1", password: "vendor123", stallId: "s1" },
      { id: "v2", role: "VENDOR", username: "vendor2", password: "vendor123", stallId: "s2" },
      { id: "c1", role: "CUSTOMER", username: "customer", password: "cust123" },
    ],
    passwordResets: [],

    hawkerCentres: [{ id: "hc1", name: "Maxwell Food Centre", location: "Singapore" }],
    stalls,
    rentalAgreements,

    cuisines,
    menuItems,
    menuItemCuisines,
    promotions: [],

    carts: [],
    orders,
    orderItems,
    addons: [
      { id: "a1", stallId: "s1", name: "Extra Chili", price: 0.0 },
      { id: "a2", stallId: "s1", name: "Packaging", price: 0.3 },
    ],
    orderItemAddons: [],
    payments,
    guestOrderHistory: [],

    feedback: [],
    likes: [],
    reviews: [],
    complaints: [],
    promotionsNotifications: [],
    languagePrefs: [],
    communityPosts: [],

    queues: stalls.map((s) => ({ stallId: s.id, tickets: [] })),
    notifications: [], // excluded
    sustainabilityOptions: [{ id: "eco1", label: "Eco-friendly packaging", extraCharge: 0.5 }],

    inspections,
    inspectionViolations,
    penalties,
    violationCatalog,
  };
}
// =========================================================
// COMPATIBILITY LAYER (for teammate code that uses DB.*)
// Paste this at the VERY BOTTOM of db.js
// =========================================================

(function () {
  // map new order statuses -> teammate statuses
  function mapStatusToTeammate(status) {
    const s = String(status || "").toUpperCase();
    if (s === "COMPLETED") return "Collected";
    if (s === "CANCELLED") return "cancelled";
    return "active"; // PLACED / PREPARING / READY -> active
  }

  function getStallNameById(db, stallId) {
    const s = (db.stalls || []).find((x) => x.id === stallId);
    return s ? s.name : "Unknown Stall";
  }

  function getMenuItemById(db, id) {
    return (db.menuItems || []).find((m) => String(m.id) === String(id));
  }

  function getOrderItemsByOrderId(db, orderId) {
    return (db.orderItems || []).filter((oi) => oi.orderId === orderId);
  }

  function getPaymentByOrderId(db, orderId) {
    return (db.payments || []).find((p) => p.orderId === orderId);
  }

  // Expose DB API expected by teammate
  window.DB = {
    // ---------- Menu ----------
    getMenuItems() {
      const db = loadDB();
      return (db.menuItems || []).map((m) => ({
        id: m.id,
        name: m.name,
        cuisines: m.cuisines || [],
        price: m.price
      }));
    },

    getMenuItemById(id) {
      const db = loadDB();
      const m = (db.menuItems || []).find((x) => String(x.id) === String(id));
      if (!m) return null;
      return { id: m.id, name: m.name, cuisines: m.cuisines || [], price: m.price };
    },

    addMenuItem({ name, cuisines, price }) {
      const db = loadDB();
      const nextId =
        (db.menuItems || []).reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;

      db.menuItems = db.menuItems || [];
      db.menuItems.push({ id: nextId, name, cuisines, price: Number(price) });
      saveDB(db);
      return nextId;
    },

    updateMenuItem(id, { name, cuisines, price }) {
      const db = loadDB();
      const m = (db.menuItems || []).find((x) => String(x.id) === String(id));
      if (!m) return false;

      m.name = name;
      m.cuisines = cuisines;
      m.price = Number(price);
      saveDB(db);
      return true;
    },

    deleteMenuItem(id) {
      const db = loadDB();
      db.menuItems = (db.menuItems || []).filter((x) => String(x.id) !== String(id));
      saveDB(db);
      return true;
    },

    // ---------- Rental ----------
    makeRentalId() {
      // similar format to your existing IDs, but always unique-ish
      return "R" + String(Math.floor(10000 + Math.random() * 90000));
    },

    getRentalAgreements() {
      const db = loadDB();
      return db.rentalAgreements || [];
    },

    getRentalById(id) {
      const db = loadDB();
      return (db.rentalAgreements || []).find((r) => r.id === id) || null;
    },

    addRentalAgreement(r) {
      const db = loadDB();
      db.rentalAgreements = db.rentalAgreements || [];
      db.rentalAgreements.push(r);
      saveDB(db);
      return true;
    },

    updateRentalAgreement(id, patch) {
      const db = loadDB();
      const r = (db.rentalAgreements || []).find((x) => x.id === id);
      if (!r) return false;
      Object.assign(r, patch);
      saveDB(db);
      return true;
    },

    deleteRentalAgreement(id) {
      const db = loadDB();
      db.rentalAgreements = (db.rentalAgreements || []).filter((x) => x.id !== id);
      saveDB(db);
      return true;
    },

    // ---------- Orders (convert your new structure -> teammate structure) ----------
    getOrders() {
      const db = loadDB();
      const orders = db.orders || [];

      const out = [];

      for (const o of orders) {
        const stallName = getStallNameById(db, o.stallId);

        const ois = getOrderItemsByOrderId(db, o.id);
        // teammate UI expects 1 item per order card; take first item
        const firstOI = ois[0];

        const mi = firstOI ? getMenuItemById(db, firstOI.menuItemId) : null;
        const pay = getPaymentByOrderId(db, o.id);

        const orderNumber = String(o.id || "").replace(/^o/, "") || "-";
        const itemName = mi ? mi.name : (firstOI ? "Item" : "Unknown Item");
        const qty = firstOI ? (firstOI.qty || 1) : 1;
        const price = firstOI ? (firstOI.unitPrice || 0) : (o.totalAmount || 0);

        out.push({
          stall: stallName,
          item: itemName,
          quantity: qty,
          price: price,
          status: mapStatusToTeammate(o.status),
          date: o.createdDateTime,
          customerName: (o.customerIdOrGuestId || "").replace(/^guest_/, "") || "Customer",
          orderNumber: orderNumber,
          paymentMethod: pay ? pay.method : "-"
        });
      }

      return out;
    }
  };
})();

