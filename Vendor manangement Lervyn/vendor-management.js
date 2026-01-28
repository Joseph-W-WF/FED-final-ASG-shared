
// ========================================
// VENDOR MANAGEMENT JAVASCRIPT
// Student: Lervyn Ang (S10273196B)
// ========================================
var db = loadDB();

// -------------------- DATA --------------------
let menuItems = [
    { id: 1, name: 'Chicken Rice', cuisines: ['Chinese', 'Malay'], price: 5.50 },
    { id: 2, name: 'Nasi Lemak', cuisines: ['Malay'], price: 5.00 },
    { id: 3, name: 'Carbonara', cuisines: ['Western'], price: 6.50 },
    { id: 4, name: 'Prata', cuisines: ['Indian'], price: 2.60 }
];

let rentalAgreements = [
    { id: 'R20462', startDate: '2024-02-12', endDate: '2026-02-11', amount: 1200, status: 'Active' },
    { id: 'R19823', startDate: '2023-11-15', endDate: '2025-11-14', amount: 1350, status: 'Active' },
    { id: 'R18532', startDate: '2021-05-22', endDate: '2023-05-21', amount: 1000, status: 'Expired' },
    { id: 'R17886', startDate: '2021-09-25', endDate: '2023-09-24', amount: 1500, status: 'Expired' },
    { id: 'R16754', startDate: '2020-03-10', endDate: '2022-03-09', amount: 950, status: 'Expired' }
];

let editingMenuItemId = null;
let editingRentalId = null;

// -------------------- INIT --------------------
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    setupNavigation();
    setupSidebarToggle();
    setupMenuManagement();
    setupRentalManagement();
    setupDashboard();

    displayMenuItems();
    displayRentalAgreements();
    displayDashboardCharts();
});

// -------------------- DATE --------------------
function updateCurrentDate() {
    document.getElementById('currentDate').textContent =
        new Date().toLocaleDateString('en-SG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
}

// -------------------- NAV --------------------
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(btn.dataset.page + 'Page').classList.add('active');
        });
    });
}

// -------------------- SIDEBAR --------------------
function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('mainContent');
    const open = document.getElementById('openSidebarBtn');
    const close = document.getElementById('closeSidebarBtn');

    close.onclick = () => {
        sidebar.classList.add('closed');
        main.classList.add('expanded');
        open.style.display = 'block';
    };

    open.onclick = () => {
        sidebar.classList.remove('closed');
        main.classList.remove('expanded');
        open.style.display = 'none';
    };
}

// -------------------- MENU --------------------
function setupMenuManagement() {
    document.getElementById('addMenuBtn').onclick = () => {
        editingMenuItemId = null;
        clearMenuForm();
        openMenuModal();
    };

    document.getElementById('menuSearch').oninput = e =>
        displayMenuItems(e.target.value.toLowerCase());
}

function displayMenuItems(search = '') {
    const body = document.getElementById('menuTableBody');
    body.innerHTML = menuItems
        .filter(i => i.name.toLowerCase().includes(search))
        .map(i => `
        <tr>
            <td><strong>${i.name}</strong></td>
            <td>${i.cuisines.map(c => `<span class="cuisine-tag">${c}</span>`).join('')}</td>
            <td>$${i.price.toFixed(2)}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editMenuItem(${i.id})">✏️</button>
                <button class="btn-action btn-delete" onclick="deleteMenuItem(${i.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function openMenuModal() {
    document.getElementById('menuModal').classList.add('active');
}

function closeMenuModal() {
    document.getElementById('menuModal').classList.remove('active');
}

function clearMenuForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.querySelectorAll('.cuisine-checkbox').forEach(c => c.checked = false);
}

// -------------------- RENTAL --------------------
function setupRentalManagement() {
    document.getElementById('addRentalBtn').onclick = () => {
        editingRentalId = null;
        clearRentalForm();
        openRenewalModal();
    };

    document.getElementById('rentalSearch').oninput = applyRentalFilters;
    document.getElementById('dateFilter').onchange = applyRentalFilters;
}

function applyRentalFilters() {
    const search = document.getElementById('rentalSearch').value.toLowerCase();
    const order = document.getElementById('dateFilter').value;

    let filtered = rentalAgreements.filter(r =>
        r.id.toLowerCase().includes(search)
    );

    filtered.sort((a, b) =>
        order === 'newest'
            ? new Date(b.startDate) - new Date(a.startDate)
            : new Date(a.startDate) - new Date(b.startDate)
    );

    displayRentalAgreements(filtered);
}

function displayRentalAgreements(list = rentalAgreements) {
    document.getElementById('rentalTableBody').innerHTML = list.map(r => `
        <tr>
            <td><strong>${r.id}</strong></td>
            <td>${r.startDate}</td>
            <td>${r.endDate}</td>
            <td>$${r.amount.toFixed(2)}</td>
            <td>
                <span class="status-badge ${r.status === 'Active' ? 'status-active' : 'status-expired'}">
                    ${r.status}
                </span>
            </td>
            <td>
                <button class="btn-action btn-view" onclick="viewAgreementDetails('${r.id}')">👁️</button>
                <button class="btn-action btn-edit" onclick="editRentalAgreement('${r.id}')">✏️</button>
                <button class="btn-action btn-delete" onclick="deleteRentalAgreement('${r.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function clearRentalForm() {
    ['agreementId','startDate','endDate','rentalAmount'].forEach(id =>
        document.getElementById(id).value = ''
    );
    document.getElementById('rentalFeeDisplay').textContent = '0.00';
}

function openRenewalModal() {
    document.getElementById('renewalModal').classList.add('active');
}

function closeRenewalModal() {
    document.getElementById('renewalModal').classList.remove('active');
}

function viewAgreementDetails(id) {
    const r = rentalAgreements.find(a => a.id === id);
    document.getElementById('agreementDetailsBody').innerHTML = `
        <div class="agreement-details">
            <p><strong>Agreement ID:</strong> <span>${r.id}</span></p>
            <p><strong>Start Date:</strong> <span>${r.startDate}</span></p>
            <p><strong>End Date:</strong> <span>${r.endDate}</span></p>
            <p><strong>Monthly Amount:</strong> <span>$${r.amount.toFixed(2)}</span></p>
        </div>
    `;
    document.getElementById('viewAgreementModal').classList.add('active');
}

function closeViewAgreementModal() {
    document.getElementById('viewAgreementModal').classList.remove('active');
}

// -------------------- DASHBOARD --------------------
function setupDashboard() {
    document.querySelector('.filter-controls button').onclick = applyDashboardDateFilter;

    // default: last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);

    document.getElementById('startDateFilter').value = start.toISOString().split('T')[0];
    document.getElementById('endDateFilter').value = end.toISOString().split('T')[0];

    applyDashboardDateFilter();
}

function applyDashboardDateFilter() {
    const startDate = new Date(document.getElementById('startDateFilter').value);
    const endDate = new Date(document.getElementById('endDateFilter').value);

    if (startDate > endDate) {
        alert('Start date cannot be later than end date.');
        return;
    }

    const days =
        Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    generateDashboardDataFromDB(
        document.getElementById("startDateFilter").value,
        document.getElementById("endDateFilter").value
);

}

function generateDashboardDataFromDB(startDate, endDate) {
  var db = loadDB();

  var salesMap = {}; // date -> revenue
  var totalOrders = 0;
  var totalRevenue = 0;

  db.orders.forEach(function (order) {
    if (order.status !== "COMPLETED") return;

    var orderDate = order.createdDateTime.slice(0, 10);

    if (orderDate < startDate || orderDate > endDate) return;

    if (!salesMap[orderDate]) {
      salesMap[orderDate] = 0;
    }

    salesMap[orderDate] += order.totalAmount;
    totalOrders += 1;
    totalRevenue += order.totalAmount;
  });

  var salesData = Object.keys(salesMap).sort().map(function (date) {
    return {
      label: date,
      value: salesMap[date]
    };
  });

  updateMetrics(totalOrders, totalRevenue);
  renderSalesChart(salesData);
  renderTopItemsFromDB(db);
}


function updateMetrics(orders, revenue) {
    document.querySelector('.metric-value').textContent = orders;
    document.querySelectorAll('.metric-value')[1].textContent =
        `$${revenue.toLocaleString()}`;
}

function renderSalesChart(salesData) {
    const max = Math.max(...salesData.map(s => s.value));

    document.getElementById('salesChart').innerHTML = salesData.map(s => `
        <div class="chart-bar">
            <span class="chart-label">${s.label}</span>
            <div class="chart-bar-container">
                <div class="chart-bar-fill chart-bar-indigo"
                     style="width:${(s.value / max) * 100}%">
                    $${s.value}
                </div>
            </div>
        </div>
    `).join('');
}

function renderTopItemsFromDB(db) {
  var itemSales = {};

  db.orderItems.forEach(function (oi) {
    if (!itemSales[oi.menuItemId]) {
      itemSales[oi.menuItemId] = 0;
    }
    itemSales[oi.menuItemId] += oi.qty;
  });

  var items = Object.keys(itemSales).map(function (id) {
    var item = db.menuItems.find(m => m.id === id);
    return {
      name: item ? item.name : "Unknown",
      sales: itemSales[id]
    };
  });

  items.sort((a, b) => b.sales - a.sales);
  items = items.slice(0, 5);

  var max = Math.max(...items.map(i => i.sales));

  document.getElementById("topItemsChart").innerHTML =
    items.map(function (i, idx) {
      return `
        <div class="top-item-bar">
          <span class="item-rank">${idx + 1}</span>
          <span class="item-name">${i.name}</span>
          <div class="chart-bar-container">
            <div class="chart-bar-fill chart-bar-green"
                 style="width:${(i.sales / max) * 100}%">
              ${i.sales}
            </div>
          </div>
        </div>
      `;
    }).join("");
}
