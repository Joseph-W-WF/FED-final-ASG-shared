// ========================================
// VENDOR MANAGEMENT JAVASCRIPT
// Student: Lervyn Ang (S10273196B)
// Uses db.js (window.DB)
// ========================================

let editingMenuItemId = null;
let editingRentalId = null;

// vendor stall name 
const VENDOR_STALL_NAME = "Clemens Kitchen";

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupSidebarToggle();
  setupMenuManagement();
  setupRentalManagement();
  setupDashboardMonthFilter();
  setupVendorOrderHistory();

  displayMenuItems();
  displayRentalAgreements();
  renderVendorOrders();
});

// -------------------- NAV --------------------
const setupNavigation = () => {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));

      const page = document.getElementById(btn.dataset.page + "Page");
      if (page) page.classList.add("active");

      if (btn.dataset.page === "orders") renderVendorOrders();
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
    search.oninput = (e) => displayMenuItems(e.target.value.toLowerCase());
  }
};

const displayMenuItems = (search = "") => {
  const items = DB.getMenuItems();
  const body = document.getElementById("menuTableBody");
  if (!body) return;

  body.innerHTML = items
    .filter((i) => i.name.toLowerCase().includes(search))
    .map(
      (i) => `
      <tr>
        <td><strong>${i.name}</strong></td>
        <td>${i.cuisines.map((c) => `<span class="cuisine-tag">${c}</span>`).join("")}</td>
        <td>$${Number(i.price).toFixed(2)}</td>
        <td>
          <button class="btn-action btn-edit" onclick="editMenuItem(${i.id})">✏️</button>
          <button class="btn-action btn-delete" onclick="deleteMenuItem(${i.id})">🗑️</button>
        </td>
      </tr>
    `
    )
    .join("");
};

const openMenuModal = () => document.getElementById("menuModal").classList.add("active");
const closeMenuModal = () => document.getElementById("menuModal").classList.remove("active");

const clearMenuForm = () => {
  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
  document.querySelectorAll(".cuisine-checkbox").forEach((c) => (c.checked = false));
};

const saveMenuItem = () => {
  const name = document.getElementById("itemName").value.trim();
  const priceStr = document.getElementById("itemPrice").value;
  const price = Number(priceStr);

  const cuisines = [];
  document.querySelectorAll(".cuisine-checkbox").forEach((c) => {
    if (c.checked) cuisines.push(c.value);
  });

  if (!name) return alert("Please enter item name.");
  if (!priceStr || Number.isNaN(price) || price <= 0) return alert("Please enter a valid price.");
  if (cuisines.length === 0) return alert("Please select at least 1 cuisine.");

  if (editingMenuItemId === null) DB.addMenuItem({ name, cuisines, price });
  else DB.updateMenuItem(editingMenuItemId, { name, cuisines, price });

  closeMenuModal();
  displayMenuItems(document.getElementById("menuSearch").value.toLowerCase());
};

const editMenuItem = (id) => {
  const item = DB.getMenuItemById(id);
  if (!item) return;

  editingMenuItemId = id;
  document.getElementById("modalTitle").textContent = "Edit Menu Item";
  document.getElementById("itemName").value = item.name;
  document.getElementById("itemPrice").value = item.price;

  document.querySelectorAll(".cuisine-checkbox").forEach((c) => {
    c.checked = item.cuisines.includes(c.value);
  });

  openMenuModal();
};

const deleteMenuItem = (id) => {
  const item = DB.getMenuItemById(id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}"?`)) return;

  DB.deleteMenuItem(id);
  displayMenuItems(document.getElementById("menuSearch").value.toLowerCase());
};

// -------------------- RENTAL --------------------
const setupRentalManagement = () => {
  const addBtn = document.getElementById("addRentalBtn");

  if (addBtn) {
    addBtn.onclick = () => {
      editingRentalId = null;
      document.getElementById("renewalModalTitle").textContent = "Add Rental Agreement";
      clearRentalForm();
      openRenewalModal();
      document.getElementById("agreementId").value = DB.makeRentalId();
    };
  }

  const s = document.getElementById("rentalSearch");
  const f = document.getElementById("dateFilter");
  if (s) s.oninput = applyRentalFilters;
  if (f) f.onchange = applyRentalFilters;

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

const openRenewalModal = () => document.getElementById("renewalModal").classList.add("active");
const closeRenewalModal = () => document.getElementById("renewalModal").classList.remove("active");

const applyRentalFilters = () => {
  const list = DB.getRentalAgreements();
  const search = document.getElementById("rentalSearch").value.toLowerCase();
  const order = document.getElementById("dateFilter").value;

  let filtered = list.filter((r) => r.id.toLowerCase().includes(search));
  filtered.sort((a, b) =>
    order === "newest" ? new Date(b.startDate) - new Date(a.startDate) : new Date(a.startDate) - new Date(b.startDate)
  );

  displayRentalAgreements(filtered);
};

const displayRentalAgreements = (list = null) => {
  const data = list || DB.getRentalAgreements();
  const body = document.getElementById("rentalTableBody");
  if (!body) return;

  body.innerHTML = data
    .map(
      (r) => `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.startDate}</td>
        <td>${r.endDate}</td>
        <td>$${Number(r.amount).toFixed(2)}</td>
        <td>
          <span class="status-badge ${r.status === "Active" ? "status-active" : "status-expired"}">${r.status}</span>
        </td>
        <td>
          <button class="btn-action btn-view" onclick="viewAgreementDetails('${r.id}')">👁️</button>
          <button class="btn-action btn-edit" onclick="editRentalAgreement('${r.id}')">✏️</button>
          <button class="btn-action btn-delete" onclick="deleteRentalAgreement('${r.id}')">🗑️</button>
        </td>
      </tr>
    `
    )
    .join("");
};

const viewAgreementDetails = (id) => {
  const r = DB.getRentalById(id);
  if (!r) return;

  document.getElementById("agreementDetailsBody").innerHTML = `
    <div class="agreement-details">
      <p><strong>Agreement ID:</strong> <span>${r.id}</span></p>
      <p><strong>Start Date:</strong> <span>${r.startDate}</span></p>
      <p><strong>End Date:</strong> <span>${r.endDate}</span></p>
      <p><strong>Monthly Amount:</strong> <span>$${Number(r.amount).toFixed(2)}</span></p>
    </div>
  `;

  document.getElementById("viewAgreementModal").classList.add("active");
};

const closeViewAgreementModal = () => document.getElementById("viewAgreementModal").classList.remove("active");

const saveRentalAgreement = () => {
  const agreementId = document.getElementById("agreementId").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const amountStr = document.getElementById("rentalAmount").value;
  const amount = Number(amountStr);

  if (!startDate || !endDate) return alert("Please select start and end date.");
  if (new Date(startDate) > new Date(endDate)) return alert("Start date cannot be later than end date.");
  if (!amountStr || Number.isNaN(amount) || amount <= 0) return alert("Please enter a valid rental amount.");

  const status = new Date(endDate) >= new Date() ? "Active" : "Expired";

  if (editingRentalId === null) DB.addRentalAgreement({ id: agreementId, startDate, endDate, amount, status });
  else DB.updateRentalAgreement(editingRentalId, { startDate, endDate, amount, status });

  closeRenewalModal();
  applyRentalFilters();
};

const editRentalAgreement = (id) => {
  const r = DB.getRentalById(id);
  if (!r) return;

  editingRentalId = id;
  document.getElementById("renewalModalTitle").textContent = "Edit Rental Agreement";
  document.getElementById("agreementId").value = r.id;
  document.getElementById("startDate").value = r.startDate;
  document.getElementById("endDate").value = r.endDate;
  document.getElementById("rentalAmount").value = r.amount;
  document.getElementById("rentalFeeDisplay").textContent = Number(r.amount).toFixed(2);

  openRenewalModal();
};

const deleteRentalAgreement = (id) => {
  const r = DB.getRentalById(id);
  if (!r) return;
  if (!confirm(`Delete agreement ${r.id}?`)) return;
  DB.deleteRentalAgreement(id);
  applyRentalFilters();
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
  all[1].textContent = `$${revenue.toLocaleString()}`;
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

// -------------------- VENDOR ORDER HISTORY --------------------
const setupVendorOrderHistory = () => {
  const search = document.getElementById("vendorOrderSearch");
  const tab = document.getElementById("vendorOrderTab");
  if (search) search.addEventListener("input", () => renderVendorOrders());
  if (tab) tab.addEventListener("change", () => renderVendorOrders());
};

const renderVendorOrders = () => {
  const listEl = document.getElementById("vendorOrdersList");
  const emptyEl = document.getElementById("vendorOrdersEmpty");
  const topBody = document.getElementById("topCustomersBody");
  if (!listEl || !emptyEl || !topBody) return;

  const searchTerm = document.getElementById("vendorOrderSearch").value.toLowerCase();
  const tabVal = document.getElementById("vendorOrderTab").value;

  const all = DB.getOrders();
  let vendorOrders = all.filter((o) => o.stall === VENDOR_STALL_NAME);

  vendorOrders = vendorOrders.filter((o) => {
    if (tabVal === "active") return o.status === "active";
    if (tabVal === "completed") return o.status === "Collected";
    if (tabVal === "cancelled") return o.status === "cancelled";
    return true;
  });

  if (searchTerm) {
    vendorOrders = vendorOrders.filter((o) => {
      return (o.item || "").toLowerCase().includes(searchTerm) ||
             (o.customerName || "").toLowerCase().includes(searchTerm);
    });
  }

  vendorOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (vendorOrders.length === 0) {
    listEl.style.display = "none";
    emptyEl.style.display = "block";
  } else {
    listEl.style.display = "grid";
    emptyEl.style.display = "none";
    listEl.innerHTML = vendorOrders.map(createVendorOrderCard).join("");
  }

  renderTopCustomersTable(topBody, all.filter((o) => o.stall === VENDOR_STALL_NAME));
};

// Card: collapsed by default — shows Customer Name + Order ID.
// Click toggles .open class to reveal full details.
const createVendorOrderCard = (o) => {
  const statusClass =
    o.status === "Collected" ? "vm-status-collected" :
    o.status === "active"    ? "vm-status-active"    : "vm-status-cancelled";

  return `
    <div class="vm-order-card" onclick="toggleOrderCard(this)">
      <!-- Always visible: customer name, order id, price, status -->
      <div class="vm-order-collapsed">
        <div class="vm-order-collapsed-left">
          <div class="vm-order-customer">👤 ${o.customerName || "Customer"}</div>
          <div class="vm-order-id">📋 Order #${o.orderNumber || "-"}</div>
        </div>
        <div class="vm-order-collapsed-right">
          <div class="vm-order-price">$${Number(o.price).toFixed(2)}</div>
          <span class="vm-status ${statusClass}">${o.status}</span>
        </div>
      </div>

      <!-- Hidden until .open is added: full details -->
      <div class="vm-order-expanded">
        <div><strong>Item:</strong> ${o.item}</div>
        <div><strong>Quantity:</strong> ${o.quantity || 1}</div>
        <div><strong>Payment:</strong> ${o.paymentMethod || "-"}</div>
        <div><strong>Date:</strong> ${formatVendorDate(o.date)}</div>
      </div>
    </div>
  `;
};

// Toggle expand/collapse on a single card
const toggleOrderCard = (card) => {
  card.classList.toggle("open");
};

const formatVendorDate = (iso) => {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const renderTopCustomersTable = (tbodyEl, vendorAllOrders) => {
  const map = {};

  vendorAllOrders.forEach((o) => {
    const name = o.customerName || "Customer";
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
          <td>$${c.spent.toFixed(2)}</td>
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