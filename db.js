// ========================================
// db.js (In-Memory Database)
// Beginner-friendly, shared across pages
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
  // Fixed stalls (match teammate names)
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
  // Orders (vendor demo data)
  // -----------------------------
  const yourOrders = [
    { id: 1, item: "Chicken Rice", price: 5.5, date: "2026-01-20T12:10:00", stall: "Clemens Kitchen", status: "active", quantity: 1, orderNumber: "ORD001", paymentMethod: "PayNow", customerName: "Alicia Tan" },
    { id: 2, item: "Fish soup", price: 4.5, date: "2026-01-20T12:18:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD002", paymentMethod: "Cash", customerName: "Darren Lim" },
    { id: 3, item: "Mushroom soup", price: 4.5, date: "2026-01-21T18:45:00", stall: "Clemens Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD003", paymentMethod: "NETS", customerName: "Jia Wei" },
    { id: 4, item: "Chicken Rice Set", price: 8.8, date: "2026-01-22T19:05:00", stall: "Clemens Kitchen", status: "cancelled", quantity: 1, orderNumber: "ORD004", paymentMethod: "Cash", customerName: "Ryan Goh" },

    { id: 5, item: "Prata", price: 2.6, date: "2026-02-01T09:40:00", stall: "Indian Corner", status: "Collected", quantity: 2, orderNumber: "ORD005", paymentMethod: "PayNow", customerName: "Nur Aisyah" },
    { id: 6, item: "Teh Tarik", price: 1.8, date: "2026-02-01T09:42:00", stall: "Indian Corner", status: "Collected", quantity: 1, orderNumber: "ORD006", paymentMethod: "Cash", customerName: "Nur Aisyah" },

    { id: 7, item: "Carbonara", price: 6.5, date: "2026-02-05T13:20:00", stall: "Pasta Place", status: "Collected", quantity: 1, orderNumber: "ORD007", paymentMethod: "NETS", customerName: "Zhi Hao" },
    { id: 8, item: "Aglio Olio", price: 6.0, date: "2026-02-05T13:24:00", stall: "Pasta Place", status: "active", quantity: 1, orderNumber: "ORD008", paymentMethod: "PayNow", customerName: "Zhi Hao" },

    { id: 9, item: "Nasi Lemak", price: 5.0, date: "2026-02-10T12:00:00", stall: "Malay Delights", status: "active", quantity: 1, orderNumber: "ORD009", paymentMethod: "PayNow", customerName: "Alicia Tan" },
    { id: 10, item: "Mee Rebus", price: 4.8, date: "2026-02-10T12:05:00", stall: "Malay Delights", status: "Collected", quantity: 1, orderNumber: "ORD010", paymentMethod: "NETS", customerName: "Darren Lim" },

    { id: 11, item: "Laksa", price: 5.5, date: "2026-02-14T18:30:00", stall: "Peranakan Kitchen", status: "Collected", quantity: 1, orderNumber: "ORD011", paymentMethod: "PayNow", customerName: "Jia Wei" },
    { id: 12, item: "Ondeh Ondeh (3pcs)", price: 2.5, date: "2026-02-14T18:33:00", stall: "Peranakan Kitchen", status: "Collected", quantity: 2, orderNumber: "ORD012", paymentMethod: "Cash", customerName: "Jia Wei" },
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
    { id: "cu6", name: "Drinks" },
    { id: "cu7", name: "Dessert" },
  ];

  const cuisineNameToId = {};
  for (let i = 0; i < cuisines.length; i++) cuisineNameToId[cuisines[i].name] = cuisines[i].id;

  const simpleMenu = [
    { name: "Chicken Rice", cuisines: ["Chinese", "Malay"], price: 5.5 },
    { name: "Fish soup", cuisines: ["Chinese"], price: 4.5 },
    { name: "Mushroom soup", cuisines: ["Western"], price: 4.5 },
    { name: "Chicken Rice Set", cuisines: ["Chinese", "Malay"], price: 8.8 },

    { name: "Prata", cuisines: ["Indian"], price: 2.6 },
    { name: "Teh Tarik", cuisines: ["Drinks"], price: 1.8 },

    { name: "Carbonara", cuisines: ["Western"], price: 6.5 },
    { name: "Aglio Olio", cuisines: ["Western"], price: 6.0 },

    { name: "Nasi Lemak", cuisines: ["Malay"], price: 5.0 },
    { name: "Mee Rebus", cuisines: ["Malay"], price: 4.8 },

    { name: "Laksa", cuisines: ["Peranakan"], price: 5.5 },
    { name: "Ondeh Ondeh (3pcs)", cuisines: ["Dessert"], price: 2.5 },
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
  // MEMBER A: Seed 12 months gradeHistory (charts work)
  // AND force an expiry soon (renewal alerts will show)
  // ==========================================================
  function seedLast12Months(stallId, grades, scores) {
    const stall = stalls.find((s) => s.id === stallId);
    if (!stall) return;

    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 15);
      const date = d.toISOString().slice(0, 10);
      const g = grades[11 - i];
      const sc = scores[11 - i];

      stall.gradeHistory.push({
        date,
        grade: g,
        score: sc,
        expiryDate: addDaysToDate(date, 180),
      });
    }
  }

  seedLast12Months("s1",
    ["A","A","B","A","A","A","B","A","A","B","A","A"],
    [92, 88, 78, 86, 89, 91, 74, 87, 90, 72, 88, 92]
  );

  seedLast12Months("s2",
    ["C","D","C","D","C","C","D","C","D","C","D","D"],
    [60, 50, 58, 45, 57, 55, 49, 59, 44, 56, 48, 46]
  );

  seedLast12Months("s3",
    ["B","B","B","A","A","A","B","B","A","A","B","A"],
    [75, 73, 71, 86, 88, 85, 74, 76, 87, 89, 72, 90]
  );

  seedLast12Months("s4",
    ["B","B","A","A","B","B","B","A","B","B","A","A"],
    [72, 70, 85, 86, 74, 73, 71, 87, 75, 72, 88, 89]
  );

  seedLast12Months("s5",
    ["B","C","B","C","C","B","C","C","B","C","C","B"],
    [74, 55, 73, 56, 58, 72, 54, 57, 71, 55, 59, 70]
  );

  // Force Clemens latest expiry to be within 14 days so renewal alert shows
  const today = new Date();
  const soonExpiry = addDaysToDate(today.toISOString().slice(0, 10), 14);
  const clemens = stalls.find((s) => s.id === "s1");
  if (clemens && clemens.gradeHistory.length) {
    clemens.gradeHistory[clemens.gradeHistory.length - 1].expiryDate = soonExpiry;
  }

  // -----------------------------
  // Regulatory seed: violations + penalties
  // -----------------------------
  const violationCatalog = [
  { code: "V001", title: "Unclean preparation area", severityDefault: "MAJOR" },
  { code: "V002", title: "Improper food storage", severityDefault: "CRITICAL" },
  { code: "V003", title: "Pest sighting", severityDefault: "CRITICAL" },
  { code: "V004", title: "Staff hygiene issue", severityDefault: "MINOR" },
  { code: "V005", title: "Expired ingredients found", severityDefault: "CRITICAL" },
  { code: "V006", title: "Cross-contamination risk", severityDefault: "MAJOR" },
  { code: "V007", title: "Improper waste disposal", severityDefault: "MAJOR" },
  { code: "V008", title: "Equipment not cleaned / maintained", severityDefault: "MAJOR" },
  { code: "V009", title: "Food left uncovered", severityDefault: "MINOR" },
  { code: "V010", title: "Handwashing station not available", severityDefault: "CRITICAL" },
  { code: "V012", title: "Missing staff protective gear", severityDefault: "MINOR" },
  { code: "V013", title: "Dirty floor / drainage", severityDefault: "MINOR" },
  { code: "V014", title: "Unlabelled food containers", severityDefault: "MINOR" },
];


  // Create inspections that match the latest gradeHistory date so table violations can display
  const indianLatestDate = stalls.find(s => s.id === "s2").gradeHistory.slice(-1)[0].date;
  const clemensLatestDate = stalls.find(s => s.id === "s1").gradeHistory.slice(-1)[0].date;

  const inspections = [
    { id: "insp_seed_ic_latest", stallId: "s2", officerId: "nea1", scheduledDate: null, conductedDate: indianLatestDate, score: 46, grade: "D", remarks: "Repeated hygiene issues." },
    { id: "insp_seed_ck_latest", stallId: "s1", officerId: "nea1", scheduledDate: null, conductedDate: clemensLatestDate, score: 92, grade: "A", remarks: "Good hygiene practices observed." },
  ];

  const inspectionViolations = [
    { id: "vio_seed_1", inspectionId: "insp_seed_ic_latest", code: "V002", title: "Improper food storage", severity: "CRITICAL", notes: "" },
    { id: "vio_seed_2", inspectionId: "insp_seed_ic_latest", code: "V001", title: "Unclean preparation area", severity: "MAJOR", notes: "" },
  ];

  const penalties = [
    { id: "pen_seed_1", stallId: "s2", inspectionId: "insp_seed_ic_latest", action: "WARNING", createdDateTime: new Date().toISOString() },
    { id: "pen_seed_2", stallId: "s2", inspectionId: "insp_seed_ic_latest", action: "REINSPECTION", createdDateTime: new Date().toISOString() },
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
// =========================================================
(function () {
  function mapStatusToTeammate(status) {
    const s = String(status || "").toUpperCase();
    if (s === "COMPLETED") return "Collected";
    if (s === "CANCELLED") return "cancelled";
    return "active"; // PLACED / others -> active
  }

  function getStallNameById(db, stallId) {
    const s = (db.stalls || []).find((x) => x.id === stallId);
    return s ? s.name : "Unknown Stall";
  }

  function getOrderItemsByOrderId(db, orderId) {
    return (db.orderItems || []).filter((oi) => oi.orderId === orderId);
  }

  function getPaymentByOrderId(db, orderId) {
    return (db.payments || []).find((p) => p.orderId === orderId);
  }

  function cuisinesForMenuItem(db, menuItemId) {
    const links = (db.menuItemCuisines || []).filter((x) => x.menuItemId === menuItemId);
    return links
      .map((l) => (db.cuisines || []).find((c) => c.id === l.cuisineId))
      .filter(Boolean)
      .map((c) => c.name);
  }

  window.DB = {
    // ---------- Menu ----------
    getMenuItems() {
      const db = loadDB();
      return (db.menuItems || []).map((m) => ({
        id: m.id,
        name: m.name,
        cuisines: cuisinesForMenuItem(db, m.id),
        price: m.price,
      }));
    },

    getMenuItemById(id) {
      const db = loadDB();
      const m = (db.menuItems || []).find((x) => String(x.id) === String(id));
      if (!m) return null;
      return { id: m.id, name: m.name, cuisines: cuisinesForMenuItem(db, m.id), price: m.price };
    },

    addMenuItem({ name, cuisines, price }) {
      const db = loadDB();
      const newId = "m" + (db.menuItems.length + 1);

      db.menuItems.push({
        id: newId,
        stallId: "s1", // keep simple
        name,
        description: "",
        price: Number(price),
        isAvailable: true,
        imageUrl: "",
      });

      // link cuisines
      db.menuItemCuisines = db.menuItemCuisines || [];
      (cuisines || []).forEach((cName) => {
        const c = (db.cuisines || []).find((x) => x.name === cName);
        if (c) db.menuItemCuisines.push({ menuItemId: newId, cuisineId: c.id });
      });

      saveDB(db);
      return newId;
    },

    updateMenuItem(id, { name, cuisines, price }) {
      const db = loadDB();
      const m = (db.menuItems || []).find((x) => String(x.id) === String(id));
      if (!m) return false;

      m.name = name;
      m.price = Number(price);

      // reset cuisine links
      db.menuItemCuisines = (db.menuItemCuisines || []).filter((x) => x.menuItemId !== m.id);
      (cuisines || []).forEach((cName) => {
        const c = (db.cuisines || []).find((x) => x.name === cName);
        if (c) db.menuItemCuisines.push({ menuItemId: m.id, cuisineId: c.id });
      });

      saveDB(db);
      return true;
    },

    deleteMenuItem(id) {
      const db = loadDB();
      db.menuItems = (db.menuItems || []).filter((x) => String(x.id) !== String(id));
      db.menuItemCuisines = (db.menuItemCuisines || []).filter((x) => String(x.menuItemId) !== String(id));
      saveDB(db);
      return true;
    },

    // ---------- Rental ----------
    makeRentalId() {
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

    // ---------- Orders (convert your structure -> teammate structure) ----------
    getOrders() {
      const db = loadDB();
      const out = [];

      for (const o of db.orders || []) {
        const stallName = getStallNameById(db, o.stallId);
        const ois = getOrderItemsByOrderId(db, o.id);
        const firstOI = ois[0];
        const mi = firstOI ? (db.menuItems || []).find((m) => m.id === firstOI.menuItemId) : null;
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
          paymentMethod: pay ? pay.method : "-",
        });
      }

      return out;
    },
  };
})();
