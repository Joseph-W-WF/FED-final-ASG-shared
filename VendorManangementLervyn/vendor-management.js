// ========================================
// VENDOR MANAGEMENT JAVASCRIPT 
// ========================================

// -------------------- AUTH GUARD --------------------
// Vendor portal should only be accessible to VENDOR sessions created in account.html
(function () {
  try {
    const u = JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null");
    if (!u || String(u.role || "").toUpperCase() !== "VENDOR") {
      window.location.href = "../user-account-management-Joseph/HTML/account.html";
      return;
    }
  } catch {
    window.location.href = "../user-account-management-Joseph/HTML/account.html";
  }
})();

let editingMenuItemId = null;
let editingRentalDocId = null; // Firestore doc id (preferred)
let editingRentalAgreementId = null; // Agreement ID field like "R19823"

let CURRENT_USER_ID = null;   // "v1" / "v2"
let CURRENT_STALL_ID = null;  // "s1" / "s2"
let CURRENT_STALL_NAME = null;

// ------------- Small helpers -------------
const isPromise = (v) => v && typeof v.then === "function";
const maybeAwait = async (v) => (isPromise(v) ? await v : v);

function safeText(v, fallback = "") {
  return v === undefined || v === null ? fallback : String(v);
}

function formatMoney(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return "$0.00";
  return `$${x.toFixed(2)}`;
}

function detectUserIdFromUI() {
  const el =
    document.querySelector(".top-header-id") ||
    document.querySelector(".user-id") ||
    document.querySelector(".user-details .user-id");

  const raw = safeText(el?.textContent, "").trim();
  if (!raw) return "v1";
  return raw.toLowerCase(); 
}

async function resolveVendorContext() {
  CURRENT_USER_ID = detectUserIdFromUI(); 

  if (window.DB?.getUserById) {
    const u = await maybeAwait(DB.getUserById(CURRENT_USER_ID));
    if (u && u.stallId) {
      CURRENT_STALL_ID = u.stallId;
    }
  }

  if (window.DB?.getStalls && CURRENT_STALL_ID) {
    const stalls = await maybeAwait(DB.getStalls());
    const s = (stalls || []).find((x) => String(x.id) === String(CURRENT_STALL_ID));
    if (s) CURRENT_STALL_NAME = s.name;
  }

  if (!CURRENT_STALL_ID) {
    CURRENT_STALL_ID = CURRENT_USER_ID === "v2" ? "s2" : "s1";
  }
  if (!CURRENT_STALL_NAME) {
    CURRENT_STALL_NAME = CURRENT_USER_ID === "v2" ? "Indian Corner" : "Clemens Kitchen";
  }
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  // Logout
  const btnLogout = document.getElementById("btnLogoutVendor");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("hawkerSessionUser_v1");
      localStorage.removeItem("hawkerSessionRole_v1");
      window.location.href = "../user-account-management-Joseph/HTML/account.html";
    });
  }

  setupSidebarToggle();
  setupMenuManagement();
  setupRentalManagement();
  setupDashboardMonthFilter();
  setupVendorOrderHistory();

  await resolveVendorContext();
  await displayMenuItems();
  await displayRentalAgreements();
  await renderVendorOrders();
});

// -------------------- NAV --------------------
const setupNavigation = () => {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));

      const page = document.getElementById(btn.dataset.page + "Page");
      if (page) page.classList.add("active");

      // Refresh data when switching pages
      if (btn.dataset.page === "menu") await displayMenuItems(document.getElementById("menuSearch")?.value?.toLowerCase() || "");
      if (btn.dataset.page === "rental") await applyRentalFilters();
      if (btn.dataset.page === "orders") await renderVendorOrders();
    });
  });
};

// -------------------- SIDEBAR --------------------
const setupSidebarToggle = () => {
  const sidebar = document.getElementById("sidebar");
  const main = document.getElementById("mainContent");
  const open = document.getElementById("openSidebarBtn");
  const close = document.getElementById("closeSidebarBtn");
  const headerContent = document.querySelector(".top-header-content");

  if (!sidebar || !main || !open || !close) return;

  open.style.display = "none";

  close.onclick = () => {
    sidebar.classList.add("closed");
    main.classList.add("expanded");
    if (headerContent) headerContent.style.paddingLeft = "20px";
    open.style.display = "block";
  };

  open.onclick = () => {
    sidebar.classList.remove("closed");
    main.classList.remove("expanded");
    if (headerContent) headerContent.style.paddingLeft = "276px";
    open.style.display = "none";
  };
};

// -------------------- MENU --------------------
const setupMenuManagement = () => {
  const addBtn = document.getElementById("addMenuBtn");
  const search = document.getElementById("menuSearch");

  if (addBtn) {
    addBtn.onclick = () => {
      editingMenuItemId = null;
      document.getElementById("modalTitle").textContent = "Add New Menu Item";
      clearMenuForm();
      openMenuModal();
    };
  }

  if (search) {
    search.oninput = async (e) => displayMenuItems(e.target.value.toLowerCase());
  }
};

async function fetchMenuItemsForVendor() {
  if (DB.getMenuItemsByStallId) {
    return await maybeAwait(DB.getMenuItemsByStallId(CURRENT_STALL_ID));
  }

  const all = await maybeAwait(DB.getMenuItems());
  if (!Array.isArray(all)) return [];
  return all.filter((m) => m.stallName === CURRENT_STALL_NAME);
}

const displayMenuItems = async (search = "") => {
  const body = document.getElementById("menuTableBody");
  if (!body) return;

  let items = await fetchMenuItemsForVendor();
  items = Array.isArray(items) ? items : [];

  items = items.map((i) => ({
    ...i,
    cuisines: Array.isArray(i.cuisines) ? i.cuisines : [],
  }));

  if (search) {
    items = items.filter((i) => safeText(i.name, "").toLowerCase().includes(search));
  }

  body.innerHTML = items
    .map((i) => {
      const cuisinesHtml =
        i.cuisines.length === 0
          ? `<span class="cuisine-tag">—</span>`
          : i.cuisines.map((c) => `<span class="cuisine-tag">${c}</span>`).join("");

      return `
        <tr>
          <td><strong>${safeText(i.name, "Unnamed")}</strong></td>
          <td>${cuisinesHtml}</td>
          <td>${formatMoney(i.price)}</td>
          <td>
            <button class="btn-action btn-edit" onclick="editMenuItem('${i.id}')">✏️</button>
            <button class="btn-action btn-delete" onclick="deleteMenuItem('${i.id}')">🗑️</button>
          </td>
        </tr>
      `;
    })
    .join("");
};

const openMenuModal = () => document.getElementById("menuModal")?.classList.add("active");
const closeMenuModal = () => document.getElementById("menuModal")?.classList.remove("active");

const clearMenuForm = () => {
  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
  document.querySelectorAll(".cuisine-checkbox").forEach((c) => (c.checked = false));
};

const saveMenuItem = async () => {
  const name = document.getElementById("itemName").value.trim();
  const priceStr = document.getElementById("itemPrice").value;
  const price = Number(priceStr);

  const cuisines = [];
  document.querySelectorAll(".cuisine-checkbox").forEach((c) => {
    if (c.checked) cuisines.push(c.value);
  });

  if (!name) return alert("Please enter item name.");
  if (!priceStr || Number.isNaN(price) || price <= 0) return alert("Please enter a valid price.");


  const payload = {
    name,
    price,
    cuisines,                 
    stallId: CURRENT_STALL_ID,
    stallName: CURRENT_STALL_NAME,
    isAvailable: true,
    description: "",
    imageUrl: "",
  };

  if (editingMenuItemId === null) {
    await maybeAwait(DB.addMenuItem(payload));
  } else {
    await maybeAwait(DB.updateMenuItem(editingMenuItemId, payload));
  }

  closeMenuModal();
  await displayMenuItems(document.getElementById("menuSearch").value.toLowerCase());
};

const editMenuItem = async (id) => {
  const item = await maybeAwait(DB.getMenuItemById(id));
  if (!item) return;

  editingMenuItemId = id;
  document.getElementById("modalTitle").textContent = "Edit Menu Item";
  document.getElementById("itemName").value = safeText(item.name, "");
  document.getElementById("itemPrice").value = item.price ?? "";

  const cuisines = Array.isArray(item.cuisines) ? item.cuisines : [];
  document.querySelectorAll(".cuisine-checkbox").forEach((c) => {
    c.checked = cuisines.includes(c.value);
  });

  openMenuModal();
};

const deleteMenuItem = async (id) => {
  const item = await maybeAwait(DB.getMenuItemById(id));
  if (!item) return;
  if (!confirm(`Delete "${safeText(item.name, "this item")}"?`)) return;

  await maybeAwait(DB.deleteMenuItem(id));
  await displayMenuItems(document.getElementById("menuSearch").value.toLowerCase());
};

// -------------------- RENTAL --------------------
const setupRentalManagement = () => {
  const addBtn = document.getElementById("addRentalBtn");

  if (addBtn) {
    addBtn.onclick = () => {
      editingRentalDocId = null;
      editingRentalAgreementId = null;
      document.getElementById("renewalModalTitle").textContent = "Add Rental Agreement";
      clearRentalForm();
      openRenewalModal();

      // agreement id shown in modal (field "id")
      const genId = DB.makeRentalId ? DB.makeRentalId() : "R" + String(Math.floor(10000 + Math.random() * 90000));
      document.getElementById("agreementId").value = genId;
    };
  }

  const s = document.getElementById("rentalSearch");
  const f = document.getElementById("dateFilter");
  if (s) s.oninput = () => applyRentalFilters();
  if (f) f.onchange = () => applyRentalFilters();

  const amt = document.getElementById("rentalAmount");
  if (amt) {
    amt.oninput = (e) => {
      const val = Number(e.target.value);
      document.getElementById("rentalFeeDisplay").textContent = Number.isNaN(val) ? "0.00" : val.toFixed(2);
    };
  }
};

const clearRentalForm = () => {
  ["agreementId", "startDate", "endDate", "rentalAmount"].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("rentalFeeDisplay").textContent = "0.00";
};

const openRenewalModal = () => document.getElementById("renewalModal")?.classList.add("active");
const closeRenewalModal = () => document.getElementById("renewalModal")?.classList.remove("active");

async function fetchRentalAgreementsForVendor() {
  const list = await maybeAwait(DB.getRentalAgreements());
  const arr = Array.isArray(list) ? list : [];

  // If your rentals have stallId/stallName, filter them
  const hasStallField = arr.some((r) => r.stallId || r.stallName);
  if (!hasStallField) return arr;

  return arr.filter((r) => {
    if (r.stallId) return String(r.stallId) === String(CURRENT_STALL_ID);
    if (r.stallName) return String(r.stallName) === String(CURRENT_STALL_NAME);
    return true;
  });
}

const applyRentalFilters = async () => {
  const search = document.getElementById("rentalSearch").value.toLowerCase();
  const order = document.getElementById("dateFilter").value;

  let filtered = await fetchRentalAgreementsForVendor();

  filtered = filtered.filter((r) => safeText(r.id, "").toLowerCase().includes(search));

  filtered.sort((a, b) =>
    order === "newest"
      ? new Date(b.startDate || 0) - new Date(a.startDate || 0)
      : new Date(a.startDate || 0) - new Date(b.startDate || 0)
  );

  await displayRentalAgreements(filtered);
};

const displayRentalAgreements = async (list = null) => {
  const body = document.getElementById("rentalTableBody");
  if (!body) return;

  const data = list || (await fetchRentalAgreementsForVendor());

  body.innerHTML = (data || [])
    .map((r) => {
      const status = safeText(r.status, "Unknown");
      const docId = r._docId ? r._docId : null; 
      const agreementId = safeText(r.id, "");

      return `
        <tr>
          <td><strong>${agreementId}</strong></td>
          <td>${safeText(r.startDate, "-")}</td>
          <td>${safeText(r.endDate, "-")}</td>
          <td>${formatMoney(r.amount)}</td>
          <td>
            <span class="status-badge ${status === "Active" ? "status-active" : "status-expired"}">${status}</span>
          </td>
          <td>
            <button class="btn-action btn-view" onclick="viewAgreementDetails('${agreementId}')">👁️</button>
            <button class="btn-action btn-edit" onclick="editRentalAgreement('${agreementId}')">✏️</button>
            ${
              docId
                ? `<button class="btn-action btn-delete" onclick="deleteRentalAgreement('${agreementId}')">🗑️</button>`
                : `<button class="btn-action btn-delete" onclick="deleteRentalAgreement('${agreementId}')">🗑️</button>`
            }
          </td>
        </tr>
      `;
    })
    .join("");
};

const viewAgreementDetails = async (agreementId) => {
  let r = null;
  if (DB.getRentalByAgreementId) r = await maybeAwait(DB.getRentalByAgreementId(agreementId));
  else if (DB.getRentalById) r = await maybeAwait(DB.getRentalById(agreementId));

  if (!r) return;

  document.getElementById("agreementDetailsBody").innerHTML = `
    <div class="agreement-details">
      <p><strong>Agreement ID:</strong> <span>${safeText(r.id, "")}</span></p>
      <p><strong>Start Date:</strong> <span>${safeText(r.startDate, "-")}</span></p>
      <p><strong>End Date:</strong> <span>${safeText(r.endDate, "-")}</span></p>
      <p><strong>Monthly Amount:</strong> <span>${formatMoney(r.amount)}</span></p>
      <p><strong>Status:</strong> <span>${safeText(r.status, "-")}</span></p>
    </div>
  `;

  document.getElementById("viewAgreementModal").classList.add("active");
};

const closeViewAgreementModal = () => document.getElementById("viewAgreementModal")?.classList.remove("active");

const saveRentalAgreement = async () => {
  const agreementId = document.getElementById("agreementId").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const amountStr = document.getElementById("rentalAmount").value;
  const amount = Number(amountStr);

  if (!startDate || !endDate) return alert("Please select start and end date.");
  if (new Date(startDate) > new Date(endDate)) return alert("Start date cannot be later than end date.");
  if (!amountStr || Number.isNaN(amount) || amount <= 0) return alert("Please enter a valid rental amount.");

  const status = new Date(endDate) >= new Date() ? "Active" : "Expired";

  const payload = {
    id: agreementId,
    startDate,
    endDate,
    amount,
    status,
    stallId: CURRENT_STALL_ID,
    stallName: CURRENT_STALL_NAME,
  };

  // Create
  if (!editingRentalAgreementId) {
    await maybeAwait(DB.addRentalAgreement(payload));
  } else {
    const current = DB.getRentalByAgreementId ? await maybeAwait(DB.getRentalByAgreementId(editingRentalAgreementId)) : null;
    const docId = current?._docId;

    if (docId && DB.updateRentalAgreementByDocId) {
      await maybeAwait(DB.updateRentalAgreementByDocId(docId, payload));
    } else if (DB.updateRentalAgreement) {
      await maybeAwait(DB.updateRentalAgreement(editingRentalAgreementId, payload));
    } else if (docId && DB.updateRentalAgreementByDocId) {
      await maybeAwait(DB.updateRentalAgreementByDocId(docId, payload));
    }
  }

  closeRenewalModal();
  await applyRentalFilters();
};

const editRentalAgreement = async (agreementId) => {
  let r = null;
  if (DB.getRentalByAgreementId) r = await maybeAwait(DB.getRentalByAgreementId(agreementId));
  else if (DB.getRentalById) r = await maybeAwait(DB.getRentalById(agreementId));

  if (!r) return;

  editingRentalAgreementId = agreementId;
  editingRentalDocId = r._docId || null;

  document.getElementById("renewalModalTitle").textContent = "Edit Rental Agreement";
  document.getElementById("agreementId").value = safeText(r.id, "");
  document.getElementById("startDate").value = safeText(r.startDate, "");
  document.getElementById("endDate").value = safeText(r.endDate, "");
  document.getElementById("rentalAmount").value = r.amount ?? "";
  document.getElementById("rentalFeeDisplay").textContent = Number(r.amount || 0).toFixed(2);

  openRenewalModal();
};

const deleteRentalAgreement = async (agreementId) => {
  const r = DB.getRentalByAgreementId ? await maybeAwait(DB.getRentalByAgreementId(agreementId)) : null;
  if (!r) return;
  if (!confirm(`Delete agreement ${safeText(r.id, agreementId)}?`)) return;

  if (r._docId && DB.deleteRentalAgreementByDocId) {
    await maybeAwait(DB.deleteRentalAgreementByDocId(r._docId));
  } else if (DB.deleteRentalAgreement) {
    await maybeAwait(DB.deleteRentalAgreement(agreementId));
  } else if (r._docId && DB.deleteRentalAgreementByDocId) {
    await maybeAwait(DB.deleteRentalAgreementByDocId(r._docId));
  }

  await applyRentalFilters();
};

// -------------------- DASHBOARD (MONTH FILTER) --------------------
const setupDashboardMonthFilter = () => {
  const applyBtn = document.querySelector("#dashboardPage .filter-controls button");
  if (applyBtn) applyBtn.onclick = applyDashboardMonthFilter;

  const startEl = document.getElementById("startDateFilter");
  const endEl = document.getElementById("endDateFilter");
  if (!startEl || !endEl) return;

  const now = new Date();
  const endMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

  startEl.value = startMonth;
  endEl.value = endMonth;

  applyDashboardMonthFilter();
};

const applyDashboardMonthFilter = () => {
  const startVal = document.getElementById("startDateFilter").value;
  const endVal = document.getElementById("endDateFilter").value;

  if (!startVal || !endVal) return alert("Please choose start and end month.");

  const start = parseMonthValue(startVal);
  const end = parseMonthValue(endVal);

  if (start > end) return alert("Start month cannot be later than end month.");

  generateDashboardMonthData(getMonthsBetween(start, end));
};

const parseMonthValue = (yyyyMm) => {
  const parts = yyyyMm.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
};

const getMonthsBetween = (startDate, endDate) => {
  const result = [];
  const d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (d <= endDate) {
    result.push(new Date(d.getFullYear(), d.getMonth(), 1));
    d.setMonth(d.getMonth() + 1);
  }
  return result;
};

const generateDashboardMonthData = (months) => {
  let totalOrders = 0;
  let revenue = 0;

  const salesData = months.map((m) => {
    const monthlyOrders = Math.floor(Math.random() * 300 + 120);
    const monthlyRevenue = monthlyOrders * Math.floor(Math.random() * 8 + 8);
    totalOrders += monthlyOrders;
    revenue += monthlyRevenue;
    return { label: m.toLocaleDateString("en-SG", { month: "short", year: "numeric" }), value: monthlyRevenue };
  });

  updateMetrics(totalOrders, revenue);
  renderSalesChart(salesData);
  renderTopItems(totalOrders);
};

const updateMetrics = (orders, revenue) => {
  const all = document.querySelectorAll(".metric-value");
  if (all.length < 2) return;
  all[0].textContent = String(orders);
  all[1].textContent = `$${Number(revenue).toLocaleString()}`;
};

const renderSalesChart = (salesData) => {
  const max = Math.max(...salesData.map((s) => s.value));
  const el = document.getElementById("salesChart");
  if (!el) return;

  el.innerHTML = salesData
    .map(
      (s) => `
      <div class="chart-bar">
        <span class="chart-label">${s.label}</span>
        <div class="chart-bar-container">
          <div class="chart-bar-fill chart-bar-indigo" style="width:${(s.value / max) * 100}%">$${s.value}</div>
        </div>
      </div>
    `
    )
    .join("");
};

const renderTopItems = (totalOrders) => {
  const items = [
    { name: "Chicken Rice", ratio: 0.32 },
    { name: "Nasi Lemak", ratio: 0.28 },
    { name: "Prata", ratio: 0.22 },
    { name: "Carbonara", ratio: 0.18 },
  ];

  const calculated = items.map((i) => ({ name: i.name, sales: Math.floor(totalOrders * i.ratio) }));
  const max = Math.max(...calculated.map((i) => i.sales));
  const el = document.getElementById("topItemsChart");
  if (!el) return;

  el.innerHTML = calculated
    .map(
      (i, idx) => `
      <div class="top-item-bar">
        <span class="item-rank">${idx + 1}</span>
        <span class="item-name">${i.name}</span>
        <div class="chart-bar-container">
          <div class="chart-bar-fill chart-bar-green" style="width:${(i.sales / max) * 100}%">${i.sales}</div>
        </div>
      </div>
    `
    )
    .join("");
};

// -------------------- VENDOR ORDER HISTORY (Firestore) --------------------
const setupVendorOrderHistory = () => {
  const search = document.getElementById("vendorOrderSearch");
  const tab = document.getElementById("vendorOrderTab");
  if (search) search.addEventListener("input", () => renderVendorOrders());
  if (tab) tab.addEventListener("change", () => renderVendorOrders());
};

const renderVendorOrders = async () => {
  const listEl = document.getElementById("vendorOrdersList");
  const emptyEl = document.getElementById("vendorOrdersEmpty");
  const topBody = document.getElementById("topCustomersBody");
  const topSection = document.querySelector(".vm-top-customers"); 

  if (!listEl || !emptyEl || !topBody) return;

  const searchTerm = document.getElementById("vendorOrderSearch").value.toLowerCase();
  const tabVal = document.getElementById("vendorOrderTab").value;

  const all = DB.getVendorOrdersByStallId
    ? await maybeAwait(DB.getVendorOrdersByStallId(CURRENT_STALL_ID))
    : [];

  let vendorOrders = Array.isArray(all) ? all : [];

  // filter by tab
  vendorOrders = vendorOrders.filter((o) => {
    if (tabVal === "active") return o.status === "active";
    if (tabVal === "completed") return o.status === "Collected";
    if (tabVal === "cancelled") return o.status === "cancelled";
    return true;
  });

  // search filter
  if (searchTerm) {
    vendorOrders = vendorOrders.filter((o) => {
      return (
        safeText(o.item, "").toLowerCase().includes(searchTerm) ||
        safeText(o.customerName, "").toLowerCase().includes(searchTerm)
      );
    });
  }

  vendorOrders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // render orders list / empty state
  if (vendorOrders.length === 0) {
    listEl.style.display = "none";
    emptyEl.style.display = "block";
  } else {
    listEl.style.display = "grid";
    emptyEl.style.display = "none";
    listEl.innerHTML = vendorOrders.map(createVendorOrderCard).join("");
  }

  // Only show Top Customers on COMPLETED tab
  if (tabVal !== "completed") {
    if (topSection) topSection.style.display = "none";
    topBody.innerHTML = ""; // optional: clear table
    return;
  }

  if (topSection) topSection.style.display = ""; // default display
  renderTopCustomersTable(topBody, vendorOrders); // completed orders only
};

const createVendorOrderCard = (o) => {
  const statusClass =
    o.status === "Collected" ? "vm-status-collected" :
    o.status === "active"    ? "vm-status-active"    : "vm-status-cancelled";

  return `
    <div class="vm-order-card" onclick="toggleOrderCard(this)">
      <div class="vm-order-collapsed">
        <div class="vm-order-collapsed-left">
          <div class="vm-order-customer">👤 ${safeText(o.customerName, "Customer")}</div>
          <div class="vm-order-id">📋 Order #${safeText(o.orderNumber, "-")}</div>
        </div>
        <div class="vm-order-collapsed-right">
          <div class="vm-order-price">${formatMoney(o.price)}</div>
          <span class="vm-status ${statusClass}">${safeText(o.status, "-")}</span>
        </div>
      </div>

      <div class="vm-order-expanded">
        <div><strong>Item:</strong> ${safeText(o.item, "—")}</div>
        <div><strong>Quantity:</strong> ${safeText(o.quantity, 1)}</div>
        <div><strong>Payment:</strong> ${safeText(o.paymentMethod, "-")}</div>
        <div><strong>Date:</strong> ${formatVendorDate(o.date)}</div>
      </div>
    </div>
  `;
};

const toggleOrderCard = (card) => card.classList.toggle("open");

const formatVendorDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const renderTopCustomersTable = (tbodyEl, vendorAllOrders) => {
  const map = {};

  (vendorAllOrders || []).forEach((o) => {
    const name = safeText(o.customerName, "Customer");
    if (!map[name]) map[name] = { visits: 0, spent: 0 };
    if (o.status !== "cancelled") map[name].visits += 1;
    if (o.status === "Collected") map[name].spent += Number(o.price) || 0;
  });

  const rows = Object.keys(map)
    .map((name) => ({ name, visits: map[name].visits, spent: map[name].spent }))
    .sort((a, b) => (b.spent !== a.spent ? b.spent - a.spent : b.visits - a.visits))
    .slice(0, 5);

  tbodyEl.innerHTML = rows.length === 0
    ? `<tr><td colspan="3">No customer data yet.</td></tr>`
    : rows.map((c) => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.visits}</td>
          <td>${formatMoney(c.spent)}</td>
        </tr>
      `).join("");
};

// -------------------- Expose onclick functions --------------------
window.closeMenuModal = closeMenuModal;
window.saveMenuItem = saveMenuItem;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.closeRenewalModal = closeRenewalModal;
window.saveRentalAgreement = saveRentalAgreement;
window.viewAgreementDetails = viewAgreementDetails;
window.closeViewAgreementModal = closeViewAgreementModal;
window.editRentalAgreement = editRentalAgreement;
window.deleteRentalAgreement = deleteRentalAgreement;
window.toggleOrderCard = toggleOrderCard;
