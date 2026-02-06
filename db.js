// ========================================
// db.js (In-Memory Database)
// Modern JS: const / let (NO var)
// NO localStorage, NO backend
// Shared across pages (single in-memory DB object)
// ========================================

const DB_KEY = "hawkerDB_v1"; // kept for compatibility (no localStorage used)

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

// OPTIONAL: Call this manually if you need to reset everything during testing
function resetDB() {
  _memoryDB = null;
  return loadDB();
}

// Simple ID generator for beginners
function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// ---------- Helper logic (Member A uses these a lot) ----------

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

// ---------- Seed database (ONE TIME only) ----------

function createSeedDB() {
  // ============================
  // YOUR DATA (replacing group's)
  // ============================

  const yourOrders = [
    {
      id: 1,
      item: "Laksa",
      price: 5.5,
      date: "2026-01-20T20:30:00",
      stall: "Clemens Kitchen",
      status: "Collected",
      quantity: 1,
      orderNumber: "ORD001",
      paymentMethod: "PayNow",
      customerName: "Alicia Tan",
    },
    {
      id: 2,
      item: "Prata",
      price: 2.6,
      date: "2026-01-18T19:15:00",
      stall: "Indian Corner",
      status: "Collected",
      quantity: 2,
      orderNumber: "ORD002",
      paymentMethod: "Cash",
      customerName: "Darren Lim",
    },
    {
      id: 3,
      item: "Carbonara",
      price: 6.5,
      date: "2026-01-15T20:25:00",
      stall: "Pasta Place",
      status: "Collected",
      quantity: 1,
      orderNumber: "ORD003",
      paymentMethod: "NETS",
      customerName: "Jia Wei",
    },
    {
      id: 4,
      item: "Nasi Lemak",
      price: 5.0,
      date: "2026-01-22T12:00:00",
      stall: "Malay Delights",
      status: "active",
      quantity: 1,
      orderNumber: "ORD004",
      paymentMethod: "PayNow",
      customerName: "Nur Aisyah",
    },
    {
      id: 5,
      item: "Laksa",
      price: 5.5,
      date: "2026-01-10T18:30:00",
      stall: "Peranakan Kitchen",
      status: "cancelled",
      quantity: 1,
      orderNumber: "ORD005",
      paymentMethod: "Cash",
      customerName: "Ryan Goh",
    },
    {
      id: 6,
      item: "Mushroom soup",
      price: 4.5,
      date: "2026-02-02T13:10:00",
      stall: "Clemens Kitchen",
      status: "Collected",
      orderNumber: "ORD006",
      paymentMethod: "NETS",
      customerName: "Alicia Tan",
    },
    {
      id: 7,
      item: "Fish soup",
      price: 4.5,
      date: "2026-02-10T19:40:00",
      stall: "Clemens Kitchen",
      status: "Collected",
      quantity: 1,
      orderNumber: "ORD007",
      paymentMethod: "PayNow",
      customerName: "Darren Lim",
    },
    {
      id: 8,
      item: "Chicken Rice Set",
      price: 8.8,
      date: "2026-03-05T12:25:00",
      stall: "Clemens Kitchen",
      status: "Collected",
      quantity: 1,
      orderNumber: "ORD008",
      paymentMethod: "Cash",
      customerName: "Alicia Tan",
    },
    {
      id: 9,
      item: "Chicken Rice",
      price: 6.6,
      date: "2026-03-16T18:05:00",
      stall: "Clemens Kitchen",
      status: "Collected",
      quantity: 1,
      orderNumber: "ORD009",
      paymentMethod: "NETS",
      customerName: "Nur Aisyah",
    },
    {
      id: 10,
      item: "Chicken Rice",
      price: 6.6,
      date: "2026-04-01T11:50:00",
      stall: "Clemens Kitchen",
      status: "Collected",
      quantity: 1,
      orderNumber: "ORD010",
      paymentMethod: "PayNow",
      customerName: "Ryan Goh",
    },
    {
      id: 11,
      item: "Fish soup",
      price: 4.5,
      date: "2026-04-18T20:15:00",
      stall: "Clemens Kitchen",
      status: "active",
      quantity: 1,
      orderNumber: "ORD011",
      paymentMethod: "NETS",
      customerName: "Darren Lim",
    },
    {
      id: 12,
      item: "Chicken Rice",
      price: 6.6,
      date: "2026-05-08T12:40:00",
      stall: "Clemens Kitchen",
      status: "cancelled",
      quantity: 1,
      orderNumber: "ORD012",
      paymentMethod: "Cash",
      customerName: "Jia Wei",
    },
    {
      id: 13,
      item: "Fish soup",
      price: 6.6,
      date: "2026-06-14T19:00:00",
      stall: "Clemens Kitchen",
      status: "cancelled",
      quantity: 1,
      orderNumber: "ORD013",
      paymentMethod: "Cash",
      customerName: "Ryan Goh",
    },
    {
      id: 14,
      item: "Chicken Rice Set",
      price: 8.8,
      date: "2026-06-25T13:30:00",
      stall: "Clemens Kitchen",
      status: "active",
      quantity: 1,
      orderNumber: "ORD014",
      paymentMethod: "PayNow",
      customerName: "Alicia Tan",
    },
    {
      id: 15,
      item: "Mushroom soup",
      price: 4.5,
      date: "2026-02-03T10:20:00",
      stall: "Clemens Kitchen",
      status: "active",
      quantity: 1,
      orderNumber: "ORD015",
      paymentMethod: "PayNow",
      customerName: "Zhi Hao",
    },
  ];

  const yourMenuItems = [
    { id: 1, name: "Chicken Rice", cuisines: ["Chinese", "Malay"], price: 5.5 },
    { id: 2, name: "Nasi Lemak", cuisines: ["Malay"], price: 5.0 },
    { id: 3, name: "Carbonara", cuisines: ["Western"], price: 6.5 },
    { id: 4, name: "Prata", cuisines: ["Indian"], price: 2.6 },
    { id: 5, name: "Fish soup", cuisines: ["Chinese"], price: 4.5 },
    { id: 6, name: "Mushroom soup", cuisines: ["Western"], price: 4.5 },
    { id: 7, name: "Thosai", cuisines: ["Indian"], price: 4.0 },
  ];

  const yourRentalAgreements = [
    { id: "R20462", startDate: "2024-02-12", endDate: "2026-02-11", amount: 1200, status: "Active" },
    { id: "R19823", startDate: "2023-11-15", endDate: "2025-11-14", amount: 1350, status: "Active" },
    { id: "R18532", startDate: "2021-05-22", endDate: "2023-05-21", amount: 1000, status: "Expired" },
    { id: "R17886", startDate: "2021-09-25", endDate: "2023-09-24", amount: 1500, status: "Expired" },
    { id: "R16754", startDate: "2020-03-10", endDate: "2022-03-09", amount: 950, status: "Expired" },
  ];

  // -----------------------------
  // Minimal mapping so existing code that expects group-style orders/orderItems won't break
  // -----------------------------
  const stallNameToId = {};
  const stallsFromYourOrders = [];
  let stallAuto = 1;

  for (let i = 0; i < yourOrders.length; i++) {
    const stallName = yourOrders[i].stall;
    if (!stallNameToId[stallName]) {
      const sid = "s" + stallAuto;
      stallAuto++;
      stallNameToId[stallName] = sid;
      stallsFromYourOrders.push({
        id: sid,
        hawkerCentreId: "hc1",
        name: stallName,
        vendorUserId: null,
        gradeHistory: [],
      });
    }
  }

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

  const getMenuItemIdByName = (name) => {
    for (let i = 0; i < yourMenuItems.length; i++) {
      if (yourMenuItems[i].name === name) return yourMenuItems[i].id;
    }
    return null;
  };

  const mappedOrders = [];
  const mappedOrderItems = [];
  const mappedPayments = [];

  for (let i = 0; i < yourOrders.length; i++) {
    const o = yourOrders[i];

    const qty = typeof o.quantity === "number" ? o.quantity : 1;
    const unitPrice = typeof o.price === "number" ? o.price : 0;
    const total = unitPrice * qty;

    const orderId = "o" + (o.orderNumber || makeId("ord"));
    const stallId = stallNameToId[o.stall] || "s1";

    mappedOrders.push({
      id: orderId,
      customerIdOrGuestId: "guest_" + String(o.customerName || "Customer").replace(/\s+/g, ""),
      isGuest: true,
      stallId: stallId,
      createdDateTime: o.date || "",
      status: statusMap(o.status),
      totalAmount: Number(total.toFixed(2)),
      notes: "",
    });

    const menuItemId = getMenuItemIdByName(o.item);

    mappedOrderItems.push({
      id: "oi" + (o.orderNumber || makeId("oi")),
      orderId: orderId,
      menuItemId: menuItemId,
      qty: qty,
      unitPrice: unitPrice,
      addonsTotal: 0,
      lineTotal: Number(total.toFixed(2)),
    });

    mappedPayments.push({
      id: "p" + (o.orderNumber || makeId("pay")),
      orderId: orderId,
      method: methodMap(o.paymentMethod),
      status: "SUCCESS",
      paidAmount: Number(total.toFixed(2)),
      createdDateTime: o.date || "",
    });
  }

  return {
    // =====================================
    // USERS & AUTH (Member B)
    // =====================================
    users: [
      { id: "nea1", role: "NEA", username: "nea", password: "nea123" },
      { id: "v1", role: "VENDOR", username: "vendor1", password: "vendor123", stallId: "s1" },
      { id: "v2", role: "VENDOR", username: "vendor2", password: "vendor123", stallId: "s2" },
      { id: "c1", role: "CUSTOMER", username: "customer", password: "cust123" },
    ],

    passwordResets: [],

    // =====================================
    // HAWKER CENTRE / STALL INFO (Member D)
    // =====================================
    hawkerCentres: [{ id: "hc1", name: "Maxwell Food Centre", location: "Singapore" }],

    // replaced to match your stalls used in your orders
    stalls: stallsFromYourOrders,

    // Rental agreement tracking (replaced with your data)
    rentalAgreements: yourRentalAgreements,

    // =====================================
    // MENU / CUISINES (Member D)
    // =====================================
    cuisines: [
      { id: "cu1", name: "Chinese" },
      { id: "cu2", name: "Malay" },
      { id: "cu3", name: "Indian" },
      { id: "cu4", name: "Western" },
    ],

    // replaced with your data
    menuItems: yourMenuItems,

    menuItemCuisines: [
      { menuItemId: "m1", cuisineId: "cu1" },
      { menuItemId: "m2", cuisineId: "cu2" },
    ],

    promotions: [],

    // =====================================
    // ORDERING / CHECKOUT (Member B)
    // =====================================
    carts: [],

    // replaced with your orders (mapped into group-style objects)
    orders: mappedOrders,

    // rebuilt to match your orders
    orderItems: mappedOrderItems,

    addons: [
      { id: "a1", stallId: "s1", name: "Extra Chili", price: 0.0 },
      { id: "a2", stallId: "s1", name: "Packaging", price: 0.3 },
    ],

    orderItemAddons: [],

    // built basic payment records from your orders
    payments: mappedPayments,

    guestOrderHistory: [],

    // =====================================
    // CUSTOMER ENGAGEMENT (Member C)
    // =====================================
    feedback: [],
    likes: [],
    reviews: [],
    complaints: [],
    promotionsNotifications: [],
    languagePrefs: [],
    communityPosts: [],

    // =====================================
    // OPERATIONAL ENHANCEMENTS (Member A)
    // =====================================
    queues: stallsFromYourOrders.map((s) => ({ stallId: s.id, tickets: [] })),

    notifications: [],

    sustainabilityOptions: [{ id: "eco1", label: "Eco-friendly packaging", extraCharge: 0.5 }],

    // =====================================
    // REGULATORY & COMPLIANCE (Member A)
    // =====================================
    inspections: [],
    inspectionViolations: [],
    penalties: [],
    violationCatalog: [
      { code: "V001", title: "Unclean preparation area", severityDefault: "MAJOR" },
      { code: "V002", title: "Improper food storage", severityDefault: "CRITICAL" },
      { code: "V003", title: "Pest sighting", severityDefault: "CRITICAL" },
      { code: "V004", title: "Staff hygiene issue", severityDefault: "MINOR" },
    ],
  };
}
