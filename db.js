// ========================================
// db.js (In-Memory Database)
// ========================================

const DB_KEY = "hawkerDB_v1"; // kept for compatibility (not used)

// -----------------------------
// In-memory store (NO localStorage)
// -----------------------------
let _memoryDB = null;

// Load database (or create it if it doesn't exist yet)
function loadDB() {
  if (_memoryDB !== null) return _memoryDB;
  _memoryDB = createSeedDB();
  return _memoryDB;
}

// Save database (in-memory)
function saveDB(db) {
  _memoryDB = db;
}

// Reset database (useful for testing)
function resetDB() {
  _memoryDB = null;
  return loadDB();
}

// Simple ID generator
function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// ---------- Helper logic ----------

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

// ---------- Seed database ----------
function createSeedDB() {
  // =====================================
  // 1) FIXED STALLS (IMPORTANT)
  // These IDs NEVER change, so all modules stay consistent.
  // Includes 12 months of gradeHistory (Jan–Dec 2026) for trends graph.
  // =====================================
  const stalls = [
    {
      id: "s1",
      hawkerCentreId: "hc1",
      name: "Clemens Kitchen",
      vendorUserId: "v1",
      gradeHistory: [
        { date: "2026-01-15", grade: "A", score: 90, expiryDate: addDaysToDate("2026-01-15", 180) },
        { date: "2026-02-15", grade: "A", score: 88, expiryDate: addDaysToDate("2026-02-15", 180) },
        { date: "2026-03-15", grade: "B", score: 78, expiryDate: addDaysToDate("2026-03-15", 180) },
        { date: "2026-04-15", grade: "A", score: 86, expiryDate: addDaysToDate("2026-04-15", 180) },
        { date: "2026-05-15", grade: "A", score: 89, expiryDate: addDaysToDate("2026-05-15", 180) },
        { date: "2026-06-15", grade: "A", score: 91, expiryDate: addDaysToDate("2026-06-15", 180) },
        { date: "2026-07-15", grade: "B", score: 74, expiryDate: addDaysToDate("2026-07-15", 180) },
        { date: "2026-08-15", grade: "A", score: 87, expiryDate: addDaysToDate("2026-08-15", 180) },
        { date: "2026-09-15", grade: "A", score: 90, expiryDate: addDaysToDate("2026-09-15", 180) },
        { date: "2026-10-15", grade: "B", score: 72, expiryDate: addDaysToDate("2026-10-15", 180) },
        { date: "2026-11-15", grade: "A", score: 88, expiryDate: addDaysToDate("2026-11-15", 180) },
        { date: "2026-12-15", grade: "A", score: 92, expiryDate: addDaysToDate("2026-12-15", 180) },
      ],
    },
    {
      id: "s2",
      hawkerCentreId: "hc1",
      name: "Indian Corner",
      vendorUserId: "v2",
      gradeHistory: [
        { date: "2026-01-15", grade: "C", score: 60, expiryDate: addDaysToDate("2026-01-15", 180) },
        { date: "2026-02-15", grade: "D", score: 50, expiryDate: addDaysToDate("2026-02-15", 180) },
        { date: "2026-03-15", grade: "C", score: 58, expiryDate: addDaysToDate("2026-03-15", 180) },
        { date: "2026-04-15", grade: "D", score: 45, expiryDate: addDaysToDate("2026-04-15", 180) },
        { date: "2026-05-15", grade: "C", score: 55, expiryDate: addDaysToDate("2026-05-15", 180) },
        { date: "2026-06-15", grade: "D", score: 48, expiryDate: addDaysToDate("2026-06-15", 180) },
        { date: "2026-07-15", grade: "C", score: 57, expiryDate: addDaysToDate("2026-07-15", 180) },
        { date: "2026-08-15", grade: "C", score: 62, expiryDate: addDaysToDate("2026-08-15", 180) },
        { date: "2026-09-15", grade: "B", score: 70, expiryDate: addDaysToDate("2026-09-15", 180) },
        { date: "2026-10-15", grade: "C", score: 59, expiryDate: addDaysToDate("2026-10-15", 180) },
        { date: "2026-11-15", grade: "C", score: 61, expiryDate: addDaysToDate("2026-11-15", 180) },
        { date: "2026-12-15", grade: "B", score: 71, expiryDate: addDaysToDate("2026-12-15", 180) },
      ],
    },
    {
      id: "s3",
      hawkerCentreId: "hc1",
      name: "Pasta Place",
      vendorUserId: null,
      gradeHistory: [
        { date: "2026-01-15", grade: "B", score: 75, expiryDate: addDaysToDate("2026-01-15", 180) },
        { date: "2026-02-15", grade: "B", score: 74, expiryDate: addDaysToDate("2026-02-15", 180) },
        { date: "2026-03-15", grade: "A", score: 86, expiryDate: addDaysToDate("2026-03-15", 180) },
        { date: "2026-04-15", grade: "A", score: 88, expiryDate: addDaysToDate("2026-04-15", 180) },
        { date: "2026-05-15", grade: "A", score: 90, expiryDate: addDaysToDate("2026-05-15", 180) },
        { date: "2026-06-15", grade: "B", score: 73, expiryDate: addDaysToDate("2026-06-15", 180) },
        { date: "2026-07-15", grade: "B", score: 72, expiryDate: addDaysToDate("2026-07-15", 180) },
        { date: "2026-08-15", grade: "A", score: 87, expiryDate: addDaysToDate("2026-08-15", 180) },
        { date: "2026-09-15", grade: "A", score: 89, expiryDate: addDaysToDate("2026-09-15", 180) },
        { date: "2026-10-15", grade: "B", score: 71, expiryDate: addDaysToDate("2026-10-15", 180) },
        { date: "2026-11-15", grade: "A", score: 86, expiryDate: addDaysToDate("2026-11-15", 180) },
        { date: "2026-12-15", grade: "A", score: 88, expiryDate: addDaysToDate("2026-12-15", 180) },
      ],
    },
    {
      id: "s4",
      hawkerCentreId: "hc1",
      name: "Malay Delights",
      vendorUserId: null,
      gradeHistory: [
        { date: "2026-01-15", grade: "B", score: 72, expiryDate: addDaysToDate("2026-01-15", 180) },
        { date: "2026-02-15", grade: "B", score: 70, expiryDate: addDaysToDate("2026-02-15", 180) },
        { date: "2026-03-15", grade: "A", score: 85, expiryDate: addDaysToDate("2026-03-15", 180) },
        { date: "2026-04-15", grade: "A", score: 87, expiryDate: addDaysToDate("2026-04-15", 180) },
        { date: "2026-05-15", grade: "B", score: 74, expiryDate: addDaysToDate("2026-05-15", 180) },
        { date: "2026-06-15", grade: "B", score: 70, expiryDate: addDaysToDate("2026-06-15", 180) },
        { date: "2026-07-15", grade: "A", score: 86, expiryDate: addDaysToDate("2026-07-15", 180) },
        { date: "2026-08-15", grade: "A", score: 88, expiryDate: addDaysToDate("2026-08-15", 180) },
        { date: "2026-09-15", grade: "B", score: 73, expiryDate: addDaysToDate("2026-09-15", 180) },
        { date: "2026-10-15", grade: "B", score: 71, expiryDate: addDaysToDate("2026-10-15", 180) },
        { date: "2026-11-15", grade: "A", score: 85, expiryDate: addDaysToDate("2026-11-15", 180) },
        { date: "2026-12-15", grade: "A", score: 87, expiryDate: addDaysToDate("2026-12-15", 180) },
      ],
    },
    {
      id: "s5",
      hawkerCentreId: "hc1",
      name: "Peranakan Kitchen",
      vendorUserId: null,
      gradeHistory: [
        { date: "2026-01-15", grade: "B", score: 74, expiryDate: addDaysToDate("2026-01-15", 180) },
        { date: "2026-02-15", grade: "B", score: 73, expiryDate: addDaysToDate("2026-02-15", 180) },
        { date: "2026-03-15", grade: "B", score: 72, expiryDate: addDaysToDate("2026-03-15", 180) },
        { date: "2026-04-15", grade: "C", score: 60, expiryDate: addDaysToDate("2026-04-15", 180) },
        { date: "2026-05-15", grade: "C", score: 55, expiryDate: addDaysToDate("2026-05-15", 180) },
        { date: "2026-06-15", grade: "B", score: 71, expiryDate: addDaysToDate("2026-06-15", 180) },
        { date: "2026-07-15", grade: "B", score: 70, expiryDate: addDaysToDate("2026-07-15", 180) },
        { date: "2026-08-15", grade: "B", score: 72, expiryDate: addDaysToDate("2026-08-15", 180) },
        { date: "2026-09-15", grade: "A", score: 85, expiryDate: addDaysToDate("2026-09-15", 180) },
        { date: "2026-10-15", grade: "B", score: 74, expiryDate: addDaysToDate("2026-10-15", 180) },
        { date: "2026-11-15", grade: "B", score: 73, expiryDate: addDaysToDate("2026-11-15", 180) },
        { date: "2026-12-15", grade: "A", score: 86, expiryDate: addDaysToDate("2026-12-15", 180) },
      ],
    },
  ];

  const stallNameToId = {};
  for (let i = 0; i < stalls.length; i++) {
    stallNameToId[stalls[i].name] = stalls[i].id;
  }

  // =====================================
  // 2) LEGACY ORDERS (teammate's vendor code expects this exact format)
  // =====================================
  const ordersLegacy = [
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

  // =====================================
  // 3) NORMALIZED ORDERING TABLES (for app consistency)
  // =====================================
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

  // =====================================
  // MENU ITEMS (simple + mapped to stalls)
  // =====================================
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

  const cuisines = [
    { id: "cu1", name: "Chinese" },
    { id: "cu2", name: "Malay" },
    { id: "cu3", name: "Indian" },
    { id: "cu4", name: "Western" },
    { id: "cu5", name: "Peranakan" },
  ];

  const cuisineNameToId = {};
  for (let i = 0; i < cuisines.length; i++) cuisineNameToId[cuisines[i].name] = cuisines[i].id;

  // Decide which stall sells which item (based on legacy orders)
  const itemToStallName = {};
  for (let i = 0; i < ordersLegacy.length; i++) {
    const item = ordersLegacy[i].item;
    if (!itemToStallName[item]) itemToStallName[item] = ordersLegacy[i].stall;
  }

  // Create group-style menuItems + menuItemCuisines
  const menuItems = [];
  const menuItemCuisines = [];
  let menuAuto = 1;

  for (let i = 0; i < simpleMenu.length; i++) {
    const item = simpleMenu[i];
    const stallName = itemToStallName[item.name] || "Clemens Kitchen";
    const stallId = stallNameToId[stallName] || "s1";

    const id = "m" + menuAuto;
    menuAuto++;

    menuItems.push({
      id: id,
      stallId: stallId,
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

  // Map legacy orders into normalized tables
  const orders = [];
  const orderItems = [];
  const payments = [];

  function findMenuItemIdByName(name) {
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].name === name) return menuItems[i].id;
    }
    return null;
  }

  for (let i = 0; i < ordersLegacy.length; i++) {
    const o = ordersLegacy[i];

    const qty = typeof o.quantity === "number" ? o.quantity : 1;
    const unitPrice = typeof o.price === "number" ? o.price : 0;
    const total = unitPrice * qty;

    const orderId = "o" + o.orderNumber;
    const stallId = stallNameToId[o.stall] || "s1";

    orders.push({
      id: orderId,
      customerIdOrGuestId: "guest_" + String(o.customerName || "Customer").replace(/\s+/g, ""),
      isGuest: true,
      stallId: stallId,
      createdDateTime: o.date || "",
      status: statusMap(o.status),
      totalAmount: Number(total.toFixed(2)),
      notes: "",
    });

    const mid = findMenuItemIdByName(o.item);

    orderItems.push({
      id: "oi" + o.orderNumber,
      orderId: orderId,
      menuItemId: mid,
      qty: qty,
      unitPrice: unitPrice,
      addonsTotal: 0,
      lineTotal: Number(total.toFixed(2)),
    });

    payments.push({
      id: "p" + o.orderNumber,
      orderId: orderId,
      method: methodMap(o.paymentMethod),
      status: "SUCCESS",
      paidAmount: Number(total.toFixed(2)),
      createdDateTime: o.date || "",
    });
  }

  // =====================================
  // 4) RENTAL AGREEMENTS (example data)
  // =====================================
  const rentalAgreements = [
    { id: "R20462", startDate: "2024-02-12", endDate: "2026-02-11", amount: 1200, status: "Active" },
    { id: "R19823", startDate: "2023-11-15", endDate: "2025-11-14", amount: 1350, status: "Active" },
  ];

  // =====================================
  // 5) MEMBER A (REGULATORY) SEED DATA
  // =====================================
  const violationCatalog = [
    { code: "V001", title: "Unclean preparation area", severityDefault: "MAJOR" },
    { code: "V002", title: "Improper food storage", severityDefault: "CRITICAL" },
    { code: "V003", title: "Pest sighting", severityDefault: "CRITICAL" },
    { code: "V004", title: "Staff hygiene issue", severityDefault: "MINOR" },
  ];

  // (Keep these for your inspection pages / tables)
  const inspections = [
    // Clemens Kitchen
    { id: "insp_seed_1", stallId: "s1", officerId: "nea1", scheduledDate: "2026-01-10", conductedDate: "2026-01-15", score: 90, grade: "A", remarks: "Good hygiene practices observed." },
    { id: "insp_seed_2", stallId: "s1", officerId: "nea1", scheduledDate: "2026-03-12", conductedDate: "2026-03-15", score: 78, grade: "B", remarks: "Minor cleanliness issues corrected on-site." },
    { id: "insp_seed_3", stallId: "s1", officerId: "nea1", scheduledDate: "2026-06-16", conductedDate: "2026-06-15", score: 91, grade: "A", remarks: "Excellent overall standards maintained." },

    // Indian Corner (problem)
    { id: "insp_seed_4", stallId: "s2", officerId: "nea1", scheduledDate: "2026-02-10", conductedDate: "2026-02-15", score: 50, grade: "D", remarks: "Critical storage issue found." },
    { id: "insp_seed_5", stallId: "s2", officerId: "nea1", scheduledDate: "2026-04-10", conductedDate: "2026-04-15", score: 45, grade: "D", remarks: "Pest control and storage issues found." },

    // Malay Delights
    { id: "insp_seed_6", stallId: "s4", officerId: "nea1", scheduledDate: "2026-03-10", conductedDate: "2026-03-15", score: 85, grade: "A", remarks: "Strong improvement in cleaning routine." },

    // Peranakan Kitchen
    { id: "insp_seed_7", stallId: "s5", officerId: "nea1", scheduledDate: "2026-05-20", conductedDate: "2026-05-15", score: 55, grade: "C", remarks: "Prep area needs improvement, warnings issued." },
  ];

  const inspectionViolations = [
    { id: "vio_seed_2_V004", inspectionId: "insp_seed_2", code: "V004", title: "Staff hygiene issue", severity: "MINOR", notes: "" },

    { id: "vio_seed_4_V002", inspectionId: "insp_seed_4", code: "V002", title: "Improper food storage", severity: "CRITICAL", notes: "" },
    { id: "vio_seed_5_V003", inspectionId: "insp_seed_5", code: "V003", title: "Pest sighting", severity: "CRITICAL", notes: "" },

    { id: "vio_seed_7_V001", inspectionId: "insp_seed_7", code: "V001", title: "Unclean preparation area", severity: "MAJOR", notes: "" },
    { id: "vio_seed_7_V004", inspectionId: "insp_seed_7", code: "V004", title: "Staff hygiene issue", severity: "MINOR", notes: "" },
  ];

  const penalties = [
    { id: "pen_seed_1", stallId: "s2", inspectionId: "insp_seed_4", action: "WARNING", createdDateTime: "2026-02-15T10:00:00.000Z" },
    { id: "pen_seed_2", stallId: "s2", inspectionId: "insp_seed_4", action: "REINSPECTION", createdDateTime: "2026-02-15T10:00:00.000Z" },
    { id: "pen_seed_3", stallId: "s2", inspectionId: "insp_seed_5", action: "WARNING", createdDateTime: "2026-04-15T10:00:00.000Z" },
    { id: "pen_seed_4", stallId: "s2", inspectionId: "insp_seed_5", action: "REINSPECTION", createdDateTime: "2026-04-15T10:00:00.000Z" },
    { id: "pen_seed_5", stallId: "s5", inspectionId: "insp_seed_7", action: "WARNING", createdDateTime: "2026-05-15T10:00:00.000Z" },
  ];

  // =====================================
  // RETURN DB
  // =====================================
  return {
    // USERS & AUTH (Member B)
    users: [
      { id: "nea1", role: "NEA", username: "nea", password: "nea123" },
      { id: "v1", role: "VENDOR", username: "vendor1", password: "vendor123", stallId: "s1" },
      { id: "v2", role: "VENDOR", username: "vendor2", password: "vendor123", stallId: "s2" },
      { id: "c1", role: "CUSTOMER", username: "customer", password: "cust123" },
    ],
    passwordResets: [],

    // HAWKER CENTRE / STALL INFO
    hawkerCentres: [{ id: "hc1", name: "Maxwell Food Centre", location: "Singapore" }],
    stalls: stalls,
    rentalAgreements: rentalAgreements,

    // MENU / CUISINES
    cuisines: cuisines,
    menuItems: menuItems,
    menuItemCuisines: menuItemCuisines,
    promotions: [],

    // ORDERING / CHECKOUT
    carts: [],
    orders: orders,               // normalized
    orderItems: orderItems,
    addons: [
      { id: "a1", stallId: "s1", name: "Extra Chili", price: 0.0 },
      { id: "a2", stallId: "s1", name: "Packaging", price: 0.3 },
    ],
    orderItemAddons: [],
    payments: payments,
    guestOrderHistory: [],
    ordersLegacy: ordersLegacy,   // legacy (for teammate)

    // CUSTOMER ENGAGEMENT
    feedback: [],
    likes: [],
    reviews: [],
    complaints: [],
    promotionsNotifications: [],
    languagePrefs: [],
    communityPosts: [],

    // OPERATIONAL ENHANCEMENTS
    queues: stalls.map((s) => ({ stallId: s.id, tickets: [] })),
    notifications: [], // excluded as per your request
    sustainabilityOptions: [{ id: "eco1", label: "Eco-friendly packaging", extraCharge: 0.5 }],

    // REGULATORY & COMPLIANCE (Member A)
    inspections: inspections,
    inspectionViolations: inspectionViolations,
    penalties: penalties,
    violationCatalog: violationCatalog,
  };
}

// ========================================
// COMPATIBILITY LAYER (IMPORTANT)
// This makes teammate code work without changing their JS.
// They call DB.getOrders(), DB.getMenuItems(), etc.
// ========================================

const DB = {
  // ---------- Orders (teammate expects legacy flat format) ----------
  getOrders: function () {
    const db = loadDB();
    if (db.ordersLegacy && Array.isArray(db.ordersLegacy)) return db.ordersLegacy;
    return [];
  },

  // ---------- Menu (teammate expects cuisines: ["Chinese", ...]) ----------
  getMenuItems: function () {
    const db = loadDB();
    const items = db.menuItems || [];
    const links = db.menuItemCuisines || [];
    const cuisines = db.cuisines || [];

    const cuisineIdToName = {};
    for (let i = 0; i < cuisines.length; i++) cuisineIdToName[cuisines[i].id] = cuisines[i].name;

    const itemToCuisineNames = {};
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      if (!itemToCuisineNames[l.menuItemId]) itemToCuisineNames[l.menuItemId] = [];
      itemToCuisineNames[l.menuItemId].push(cuisineIdToName[l.cuisineId]);
    }

    return items.map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      cuisines: itemToCuisineNames[it.id] || [],
    }));
  },

  getMenuItemById: function (id) {
    const list = DB.getMenuItems();
    return list.find((x) => String(x.id) === String(id)) || null;
  },

  addMenuItem: function ({ name, cuisines, price }) {
    const db = loadDB();

    const newId = makeId("m");
    db.menuItems.push({
      id: newId,
      stallId: "s1",
      name: name,
      description: "",
      price: price,
      isAvailable: true,
      imageUrl: "",
    });

    for (let i = 0; i < cuisines.length; i++) {
      const cname = cuisines[i];
      let c = db.cuisines.find((x) => x.name === cname);
      if (!c) {
        c = { id: makeId("cu"), name: cname };
        db.cuisines.push(c);
      }
      db.menuItemCuisines.push({ menuItemId: newId, cuisineId: c.id });
    }

    saveDB(db);
  },

  updateMenuItem: function (id, patch) {
    const db = loadDB();
    const item = db.menuItems.find((x) => String(x.id) === String(id));
    if (!item) return;

    item.name = patch.name;
    item.price = patch.price;

    db.menuItemCuisines = db.menuItemCuisines.filter((x) => String(x.menuItemId) !== String(id));

    for (let i = 0; i < patch.cuisines.length; i++) {
      const cname = patch.cuisines[i];
      let c = db.cuisines.find((x) => x.name === cname);
      if (!c) {
        c = { id: makeId("cu"), name: cname };
        db.cuisines.push(c);
      }
      db.menuItemCuisines.push({ menuItemId: item.id, cuisineId: c.id });
    }

    saveDB(db);
  },

  deleteMenuItem: function (id) {
    const db = loadDB();
    db.menuItems = db.menuItems.filter((x) => String(x.id) !== String(id));
    db.menuItemCuisines = db.menuItemCuisines.filter((x) => String(x.menuItemId) !== String(id));
    saveDB(db);
  },

  // ---------- Rentals ----------
  getRentalAgreements: function () {
    const db = loadDB();
    return db.rentalAgreements || [];
  },

  getRentalById: function (id) {
    const db = loadDB();
    return (db.rentalAgreements || []).find((x) => x.id === id) || null;
  },

  makeRentalId: function () {
    return "R" + Math.floor(10000 + Math.random() * 90000);
  },

  addRentalAgreement: function (r) {
    const db = loadDB();
    db.rentalAgreements.push(r);
    saveDB(db);
  },

  updateRentalAgreement: function (id, patch) {
    const db = loadDB();
    const r = db.rentalAgreements.find((x) => x.id === id);
    if (!r) return;
    Object.assign(r, patch);
    saveDB(db);
  },

  deleteRentalAgreement: function (id) {
    const db = loadDB();
    db.rentalAgreements = db.rentalAgreements.filter((x) => x.id !== id);
    saveDB(db);
  },
};

// expose globally
window.DB = DB;
