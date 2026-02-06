window.FED = window.FED || {};

FED.profile = (() => {
  const dropdown = document.getElementById("profileDropdown");
  const btn = document.getElementById("profileBtn");

  function toggleDropdown() {
    const open = dropdown.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  }

  function closeDropdown() {
    dropdown.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  }

  function init() {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    document.addEventListener("click", () => closeDropdown());

    document.getElementById("logoutBtn").addEventListener("click", () => {
      alert("Logout (UI only). Hook to Firebase signOut() later.");
      closeDropdown();
    });

    // Profile page buttons
    document.getElementById("clearDataBtn").addEventListener("click", () => {
      if (!confirm("Clear cart + orders?")) return;
      FED.cart.clearAll();
      FED.orders.clearAll();
      FED.cart.updateBadge();
      alert("Cleared.");
      FED.router.go("browse");
    });

    document.getElementById("seedDemoBtn").addEventListener("click", () => {
      const { uid } = FED.utils;

      const demo = [
        {
          id: uid(),
          vendorId: "stall_2",
          vendorName: "Ah Boy Char Kway Teow",
          items: [{ name: "Char Kway Teow", qty: 1, unitPrice: 5.00, addons: [{ id: "a_egg", name: "Add egg", price: 0.80 }], lineTotal: 5.80 }],
          total: 5.80,
          payMethod: "E-Wallet",
          status: "Completed",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: uid(),
          vendorId: "stall_1",
          vendorName: "Ali Bing Chicken Rice",
          items: [{ name: "Chicken Rice (Roasted)", qty: 2, unitPrice: 4.50, addons: [{ id: "a_take", name: "Takeaway", price: 0.50 }], lineTotal: 10.00 }],
          total: 10.00,
          payMethod: "Cash",
          status: "Received",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: uid(),
          vendorId: "stall_3",
          vendorName: "Siti Nasi Padang",
          items: [{ name: "Nasi Padang (Chicken)", qty: 1, unitPrice: 6.00, addons: [{ id: "a_sambal", name: "Extra sambal", price: 0.50 }], lineTotal: 6.50 }],
          total: 6.50,
          payMethod: "Card",
          status: "Failed",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      const current = FED.orders.getOrders();
      FED.orders.setOrders([...demo, ...current]);
      alert("Seeded demo orders.");
      FED.router.go("orders");
    });
  }

  return { init, closeDropdown };
})();
