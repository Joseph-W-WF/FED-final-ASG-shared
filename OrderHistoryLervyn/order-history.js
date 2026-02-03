// ========================================
// ORDER HISTORY JAVASCRIPT (Modern)
// Student: Lervyn Ang (S10273196B)
// Feature: Order History Management
// Uses db.js (window.DB) - NO localStorage
// ========================================

// Global variables
let allOrders = [];
let currentTab = "active";
let currentOrderId = null;

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
  setupEventListeners();
  displayOrders();
  updateStatistics();
});

// ---------- Data ----------
const loadOrders = () => {
  // Source of truth: db.js
  allOrders = DB.getOrders();
};

// keep this to avoid breaking other calls (db.js is in-memory)
const saveOrders = () => {};

// ---------- Event Listeners ----------
const setupEventListeners = () => {
  // Tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      currentTab = btn.dataset.tab;
      displayOrders();
    });
  });

  // Search
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => displayOrders());

  // Sort
  const sortFilter = document.getElementById("sortFilter");
  sortFilter.addEventListener("change", () => displayOrders());

  // Review form
  const reviewForm = document.getElementById("reviewForm");
  reviewForm.addEventListener("submit", handleReviewSubmit);

  // Star rating
  const stars = document.querySelectorAll(".star");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = Number(star.dataset.rating);
      document.getElementById("ratingValue").value = String(rating);

      stars.forEach((s, index) => {
        if (index < rating) s.classList.add("active");
        else s.classList.remove("active");
      });
    });
  });
};

// ---------- Display ----------
const displayOrders = () => {
  const ordersList = document.getElementById("ordersList");
  const emptyState = document.getElementById("emptyState");
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const sortBy = document.getElementById("sortFilter").value;

  let filteredOrders = allOrders.filter((order) => {
    if (currentTab === "active") return order.status === "active";
    if (currentTab === "completed") return order.status === "Collected";
    if (currentTab === "cancelled") return order.status === "cancelled";
    return true;
  });

  if (searchTerm) {
    filteredOrders = filteredOrders.filter((order) => {
      return (
        order.item.toLowerCase().includes(searchTerm) ||
        order.stall.toLowerCase().includes(searchTerm)
      );
    });
  }

  filteredOrders = sortOrders(filteredOrders, sortBy);

  if (filteredOrders.length === 0) {
    ordersList.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  ordersList.style.display = "grid";
  emptyState.style.display = "none";
  ordersList.innerHTML = filteredOrders.map(createOrderCard).join("");
};

const sortOrders = (orders, sortBy) => {
  const sorted = [...orders];

  if (sortBy === "newest") sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sortBy === "oldest") sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sortBy === "price-high") sorted.sort((a, b) => b.price - a.price);
  if (sortBy === "price-low") sorted.sort((a, b) => a.price - b.price);

  return sorted;
};

const createOrderCard = (order) => {
  const formattedDate = formatDate(order.date);
  const statusClass = `status-${order.status}`;

  return `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-info">
          <h3 class="order-item-name">${order.item}</h3>
          <p class="order-stall">📍 ${order.stall}</p>
          <p class="order-date">🕐 ${formattedDate}</p>
        </div>
        <div class="order-price-section">
          <p class="order-price">$${Number(order.price).toFixed(2)}</p>
          <span class="order-status ${statusClass}">${order.status}</span>
        </div>
      </div>
      <div class="order-actions">
        <button class="btn btn-view" onclick="viewOrderDetails(${order.id})">View Details</button>
        ${
          order.status === "Collected"
            ? `<button class="btn btn-secondary" onclick="openReviewModal(${order.id})">Leave Review</button>`
            : ""
        }
        <button class="btn btn-primary" onclick="orderAgain(${order.id})">Order Again</button>
      </div>
    </div>
  `;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" };
  return date.toLocaleDateString("en-SG", options);
};

// ---------- Actions ----------
const viewOrderDetails = (orderId) => {
  const order = DB.getOrderById(orderId);
  if (!order) return;

  const modal = document.getElementById("orderModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h4 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">Order #${order.orderNumber}</h4>
      <div style="background: #f9fafb; padding: 1.25rem; border-radius: 8px; margin-bottom: 1rem;">
        <p style="margin-bottom: 0.75rem;"><strong>Item:</strong> ${order.item}</p>
        <p style="margin-bottom: 0.75rem;"><strong>Quantity:</strong> ${order.quantity}</p>
        <p style="margin-bottom: 0.75rem;"><strong>Price:</strong> $${Number(order.price).toFixed(2)}</p>
        <p style="margin-bottom: 0.75rem;"><strong>Stall:</strong> ${order.stall}</p>
        <p style="margin-bottom: 0.75rem;"><strong>Date:</strong> ${formatDate(order.date)}</p>
        <p style="margin-bottom: 0.75rem;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Status:</strong> <span class="order-status status-${order.status}">${order.status}</span></p>
      </div>
    </div>
  `;

  modal.classList.add("active");
};

const closeModal = () => {
  document.getElementById("orderModal").classList.remove("active");
};

const openReviewModal = (orderId) => {
  currentOrderId = orderId;

  const modal = document.getElementById("reviewModal");
  document.getElementById("reviewForm").reset();
  document.getElementById("ratingValue").value = "";
  document.querySelectorAll(".star").forEach((s) => s.classList.remove("active"));

  modal.classList.add("active");
};

const closeReviewModal = () => {
  document.getElementById("reviewModal").classList.remove("active");
  currentOrderId = null;
};

const handleReviewSubmit = (e) => {
  e.preventDefault();

  const rating = document.getElementById("ratingValue").value;
  const comment = document.getElementById("reviewComment").value;

  if (!rating) {
    alert("Please select a rating");
    return;
  }

  console.log("Review submitted:", {
    orderId: currentOrderId,
    rating,
    comment,
  });

  alert("Thank you for your review!");
  closeReviewModal();
};

const orderAgain = (orderId) => {
  const order = DB.getOrderById(orderId);
  if (!order) return;

  alert(`Adding "${order.item}" to your cart!`);
  console.log("Reordering:", order);
};

// ---------- Stats ----------
const updateStatistics = () => {
  document.getElementById("totalOrders").textContent = String(allOrders.length);

  const totalSpent = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.price), 0);

  document.getElementById("totalSpent").textContent = `$${totalSpent.toFixed(2)}`;

  const itemCounts = {};
  allOrders.forEach((o) => {
    if (o.status === "cancelled") return;
    itemCounts[o.item] = (itemCounts[o.item] || 0) + 1;
  });

  let favoriteItem = "-";
  let maxCount = 0;

  for (const item in itemCounts) {
    if (itemCounts[item] > maxCount) {
      maxCount = itemCounts[item];
      favoriteItem = item;
    }
  }

  document.getElementById("favoriteItem").textContent = favoriteItem;
};

// ---------- Utility ----------
window.addEventListener("click", (e) => {
  const orderModal = document.getElementById("orderModal");
  const reviewModal = document.getElementById("reviewModal");

  if (e.target === orderModal) closeModal();
  if (e.target === reviewModal) closeReviewModal();
});

// For integration/testing: add new order into db.js then refresh UI
const addNewOrder = (orderData) => {
  const newOrder = {
    ...orderData,
    date: new Date().toISOString(),
  };

  DB.addOrder(newOrder);
  allOrders = DB.getOrders();

  displayOrders();
  updateStatistics();
};

// expose functions used by onclick
window.viewOrderDetails = viewOrderDetails;
window.closeModal = closeModal;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.orderAgain = orderAgain;
window.addNewOrder = addNewOrder;
