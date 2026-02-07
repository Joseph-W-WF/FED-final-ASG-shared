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


    // Sync sidebar user card (if present)
    const sideName = document.getElementById("sideUserName");
    const sideAvatar = document.getElementById("sideAvatarText");
    if (sideName) sideName.textContent = document.getElementById("profileName")?.textContent || "Guest";
    if (sideAvatar) sideAvatar.textContent = document.getElementById("avatarText")?.textContent || "G";

    document.getElementById("logoutBtn").addEventListener("click", () => {
      alert("Logout (UI only). Hook to Firebase signOut() later.");
      closeDropdown();
    });

    // Profile page buttons
    document.getElementById("clearDataBtn").addEventListener("click", () => {
      if (!confirm("Clear cart + orders?")) return;
      FED.cart.clearAll();
      FED.orders.clearAll();

      // Also clear queue tickets (so queue numbers reset)
      if (FED.queueCompat && typeof FED.queueCompat.resetQueueDB === "function") {
        FED.queueCompat.resetQueueDB();
      }

      FED.cart.updateBadge();
      alert("Cleared.");
      FED.router.go("browse");
    });

    document.getElementById("seedDemoBtn").addEventListener("click", () => {
      const { uid } = FED.utils;

      const demo = [
        {
          id: uid(),
          vendorId: "stall_3",
          vendorName: "Pasta Place",
          items: [
            { name: "Carbonara", qty: 1, unitPrice: 6.50, addons: [{ id: "a_cheese", name: "Extra cheese", price: 0.80 }], lineTotal: 7.30 }
          ],
          total: 7.30,
          payMethod: "E-Wallet",
          status: "Completed",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: uid(),
          vendorId: "stall_1",
          vendorName: "Clemens Kitchen",
          items: [
            { name: "Chicken Rice", qty: 2, unitPrice: 5.50, addons: [{ id: "a_take", name: "Takeaway", price: 0.50 }], lineTotal: 12.00 }
          ],
          total: 12.00,
          payMethod: "Cash",
          status: "Received",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: uid(),
          vendorId: "stall_5",
          vendorName: "Peranakan Kitchen",
          items: [
            { name: "Laksa", qty: 1, unitPrice: 5.50, addons: [{ id: "a_egg", name: "Add egg", price: 0.80 }], lineTotal: 6.30 }
          ],
          total: 6.30,
          payMethod: "Card",
          status: "Failed",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      // Add queue tickets for any demo *active* orders so the Active Orders tab can show ticket info
      if (typeof window.createQueueTicket === "function") {
        const nameEl = document.getElementById("profileName");
        const customerName = (nameEl && nameEl.textContent) ? nameEl.textContent : "Customer";

        demo.forEach(o => {
          if (o.status === "Received") {
            const t = window.createQueueTicket(o.vendorId, customerName, o.id);
            if (t) {
              o.queueTicketId = t.ticketId;
              o.queueNo = t.ticketNo;
              o.queueEtaMin = t.etaMinutes;
            }
          }
        });
      }

      const current = FED.orders.getOrders();
      FED.orders.setOrders([...demo, ...current]);
      alert("Seeded demo orders.");
      FED.router.go("orders");
    });
  }

  return { init, closeDropdown };
})();
