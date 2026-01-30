var DB_KEY = "hawkerDB_v1";

// ---------- Core DB functions ----------

// Load database (or create it if it doesn't exist yet)
function loadDB() {
  var raw = localStorage.getItem(DB_KEY);

  if (raw !== null) {
    return JSON.parse(raw);
  }

  // If first time, create starter database
  var db = createSeedDB();
  saveDB(db);
  return db;
}

// Save database
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// OPTIONAL: Call this manually if you need to reset everything during testing
function resetDB() {
  localStorage.removeItem(DB_KEY);
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
  var d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- Seed database (ONE TIME only) ----------

function createSeedDB() {
  return {
    // =====================================
    // USERS & AUTH (Member B)
    // =====================================
    users: [
      // NEA officer (demo)
      { id: "nea1", role: "NEA", username: "nea", password: "nea123" },

      // Vendor accounts (demo)
      { id: "v1", role: "VENDOR", username: "vendor1", password: "vendor123", stallId: "s1" },
      { id: "v2", role: "VENDOR", username: "vendor2", password: "vendor123", stallId: "s2" },

      // Customer accounts (demo)
      { id: "c1", role: "CUSTOMER", username: "customer", password: "cust123" }
    ],

    // Password recovery requests (Member B)
    passwordResets: [
      // { id, userId, email, token, createdDate, used }
    ],

    // =====================================
    // HAWKER CENTRE / STALL INFO (Member D)2
    // =====================================
    hawkerCentres: [
      { id: "hc1", name: "Maxwell Food Centre", location: "Singapore" }
    ],

    stalls: [
      {
        id: "s1",
        hawkerCentreId: "hc1",
        name: "Ah Seng Chicken Rice",
        vendorUserId: "v1",
        // Grade history is updated by inspections (Member A)
        gradeHistory: []
      },
      {
        id: "s2",
        hawkerCentreId: "hc1",
        name: "Malay Delights",
        vendorUserId: "v2",
        gradeHistory: []
      },
      {
        id: "s3",
        hawkerCentreId: "hc1",
        name: "Kumar’s Corner",
        vendorUserId: null,
        gradeHistory: []
      },
      {
        id: "s4",
        hawkerCentreId: "hc1",
        name: "Hokkien Noodle House",
        vendorUserId: null,
        gradeHistory: []
      }
    ],

    // Rental agreement tracking (Member D)
    rentalAgreements: [
      // { id, stallId, vendorUserId, startDate, endDate, monthlyRent, status, notes }
    { id: 'R20462', startDate: '2024-02-12', endDate: '2026-02-11', amount: 1200, status: 'Active' },
    { id: 'R19823', startDate: '2023-11-15', endDate: '2025-11-14', amount: 1350, status: 'Active' },
    { id: 'R18532', startDate: '2021-05-22', endDate: '2023-05-21', amount: 1000, status: 'Expired' },
    { id: 'R17886', startDate: '2021-09-25', endDate: '2023-09-24', amount: 1500, status: 'Expired' },
    { id: 'R16754', startDate: '2020-03-10', endDate: '2022-03-09', amount: 950, status: 'Expired' }],

    // =====================================
    // MENU / CUISINES (Member D)
    // =====================================
    cuisines: [
      { id: "cu1", name: "Chinese" },
      { id: "cu2", name: "Malay" },
      { id: "cu3", name: "Indian" }
    ],

    menuItems: [
      // Each item can belong to multiple cuisines via menuItemCuisines below
      // { id, stallId, name, description, price, isAvailable, imageUrl }
    { id: 1, name: 'Chicken Rice', cuisines: ['Chinese', 'Malay'], price: 5.50 },
    { id: 2, name: 'Nasi Lemak', cuisines: ['Malay'], price: 5.00 },
    { id: 3, name: 'Carbonara', cuisines: ['Western'], price: 6.50 },
    { id: 4, name: 'Prata', cuisines: ['Indian'], price: 2.60 }],

    menuItemCuisines: [
      // many-to-many: one menu item can belong to multiple cuisines
      // { menuItemId, cuisineId }
      { menuItemId: "m1", cuisineId: "cu1" },
      { menuItemId: "m2", cuisineId: "cu2" }
    ],

    // Promotions (appendix mentions promotions) :contentReference[oaicite:1]{index=1}
    promotions: [
      // { id, stallId, title, description, startDate, endDate, discountType, discountValue, active }
    ],

    // =====================================
    // ORDERING / CHECKOUT (Member B)
    // =====================================
    carts: [
      // OPTIONAL: if you want persistent carts
      // { id, customerIdOrGuestId, stallId, items:[{menuItemId, qty, addonIds:[] }], updatedAt }
    ],

    orders: [
      // { id, customerIdOrGuestId, isGuest, stallId, createdDateTime, status, totalAmount, notes }
      // status examples: "PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"
        {
        id: "o1001",
        customerIdOrGuestId: "c1",
        isGuest: false,
        stallId: "s1",
        createdDateTime: "2026-01-25 12:30",
        status: "PLACED",
        totalAmount: 5.50,
        notes: ""
      },
      {
        id: "o1002",
        customerIdOrGuestId: "c1",
        isGuest: false,
        stallId: "s2",
        createdDateTime: "2026-01-24 18:10",
        status: "COMPLETED",
        totalAmount: 5.00,
        notes: ""
      },
      {
        id: "o1003",
        customerIdOrGuestId: "c1",
        isGuest: false,
        stallId: "s1",
        createdDateTime: "2026-01-23 13:45",
        status: "CANCELLED",
        totalAmount: 6.10,
        notes: ""
      }
    ],

    orderItems: [
      // { id, orderId, menuItemId, qty, unitPrice, addonsTotal, lineTotal }
      {
        id: "oi1",
        orderId: "o1001",
        menuItemId: 1,
        qty: 1,
        unitPrice: 5.50,
        addonsTotal: 0,
        lineTotal: 5.50
      },
      {
        id: "oi2",
        orderId: "o1002",
        menuItemId: 2,
        qty: 1,
        unitPrice: 5.00,
        addonsTotal: 0,
        lineTotal: 5.00
      },
      {
        id: "oi3",
        orderId: "o1003",
        menuItemId: 1,
        qty: 1,
        unitPrice: 5.50,
        addonsTotal: 0.60,
        lineTotal: 6.10
      }
    ],

    addons: [
      // Optional add-ons / extra charges (Member B)
      // { id, stallId, name, price }
      { id: "a1", stallId: "s1", name: "Extra Chili", price: 0.0 },
      { id: "a2", stallId: "s1", name: "Packaging", price: 0.3 }
    ],

    orderItemAddons: [
      // Link addons to an order item
      // { orderItemId, addonId }
    ],

    payments: [
      // Bank interface handled by another team, but we store payment record :contentReference[oaicite:2]{index=2}
      // { id, orderId, method, status, paidAmount, createdDateTime }
      // method examples: "CASH", "NETS", "PAYNOW", "CARD"
      // status examples: "SUCCESS", "FAILED", "PENDING"
    ],

    // Guest order history can be stored locally per requirement :contentReference[oaicite:3]{index=3}
    guestOrderHistory: [
      // OPTIONAL: { guestId, orderIds:[] }
    ],

    // =====================================
    // CUSTOMER ENGAGEMENT (Member C)
    // =====================================
    feedback: [
      // ratings + comments (Member C) :contentReference[oaicite:4]{index=4}
      // { id, stallId, customerIdOrGuestId, rating, comment, createdDateTime }
    ],

    likes: [
      // Likes for individual menu items :contentReference[oaicite:5]{index=5}
      // { id, menuItemId, customerIdOrGuestId, createdDateTime }
    ],

    reviews: [
      // Vendor ratings & reviews (Member C)
      // { id, stallId, customerIdOrGuestId, stars, reviewText, createdDateTime }
    ],

    complaints: [
      // Complaint submission linked to stalls :contentReference[oaicite:6]{index=6}
      // { id, stallId, customerIdOrGuestId, category, message, createdDateTime, status }
      // status examples: "NEW", "IN_REVIEW", "RESOLVED"
    ],

    promotionsNotifications: [
      // Optional: promotions notifications (Member C)
      // { id, toCustomerIdOrGuestId, title, message, createdDateTime, read }
    ],

    // Multi-language support (Member C) - store preference
    languagePrefs: [
      // { userIdOrGuestId, langCode } e.g. "en", "zh", "ms", "ta"
    ],

    // Community / insights page posts (Member C)
    communityPosts: [
      // { id, stallId, vendorUserId, title, content, createdDateTime }
    ],

    // =====================================
    // OPERATIONAL ENHANCEMENTS (Member A)
    // =====================================
    queues: [
      { stallId: "s1", tickets: [] },
      { stallId: "s2", tickets: [] },
      { stallId: "s3", tickets: [] },
      { stallId: "s4", tickets: [] }
    ],


    notifications: [
      // Real-time notifications for vendors (Member A) :contentReference[oaicite:8]{index=8}
      // { id, toRole, toUserId, type, message, createdDateTime, read }
      // type examples: "NEW_ORDER", "NEW_COMPLAINT", "INSPECTION_ALERT", "GRADE_EXPIRY"
    ],

    // Sustainability options (Member B listed, but can store here)
    sustainabilityOptions: [
      // { id, label, extraCharge } e.g. eco packaging
      { id: "eco1", label: "Eco-friendly packaging", extraCharge: 0.5 }
    ],

    // =====================================
    // REGULATORY & COMPLIANCE (Member A)
    // =====================================
    inspections: [
      // Inspection scheduling + logging :contentReference[oaicite:9]{index=9}
      // { id, stallId, officerId, scheduledDate, conductedDate, score, grade, remarks }
    ],

    inspectionViolations: [
      // Violation categorisation/severity (Member A)
      // { id, inspectionId, code, title, severity, notes }
      // severity examples: "MINOR", "MAJOR", "CRITICAL"
    ],

    penalties: [
      // Automated warning/penalty system (Member A)
      // { id, stallId, inspectionId, action, createdDateTime }
      // action examples: "WARNING", "FINE", "REINSPECTION", "CLOSURE_NOTICE"
    ],

    // Optional: a list of common violation codes (helps beginners pick from dropdown)
    violationCatalog: [
      { code: "V001", title: "Unclean preparation area", severityDefault: "MAJOR" },
      { code: "V002", title: "Improper food storage", severityDefault: "CRITICAL" },
      { code: "V003", title: "Pest sighting", severityDefault: "CRITICAL" },
      { code: "V004", title: "Staff hygiene issue", severityDefault: "MINOR" }
    ]
  };
}

