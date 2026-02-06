window.FED = window.FED || {};

FED.pages = FED.pages || {};
FED.pages.orders = (() => {
  const { money, escapeHTML } = FED.utils;

  const ordersListEl = document.getElementById("ordersList");

  function setActiveTabUI() {
    document.querySelectorAll(".tab").forEach(t => {
      t.classList.toggle("is-active", t.dataset.tab === FED.state.orderTab);
    });
  }

  function updateStatsUI() {
    const stats = FED.orders.computeStats();
    document.getElementById("statTotalOrders").textContent = String(stats.totalOrders);
    document.getElementById("statTotalSpent").textContent = money(stats.totalSpent);
    document.getElementById("statFavItem").textContent = stats.favItem;
  }

  function renderOrders() {
    const orders = FED.orders.getOrders();

    let filtered = orders.filter(o => o.status === FED.state.orderTab);

    const q = (FED.state.orderSearch || "").toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(o => {
        const vendorMatch = o.vendorName.toLowerCase().includes(q);
        const itemMatch = (o.items || []).some(it => it.name.toLowerCase().includes(q));
        return vendorMatch || itemMatch;
      });
    }

    const sort = FED.state.orderSort;
    if (sort === "newest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "oldest") filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "totalDesc") filtered.sort((a, b) => b.total - a.total);
    if (sort === "totalAsc") filtered.sort((a, b) => a.total - b.total);

    if (filtered.length === 0) {
      ordersListEl.innerHTML = `
        <div class="emptyState">
          <div class="emptyState__icon">🧾</div>
          <div class="emptyState__title">No orders here</div>
          <div class="emptyState__text">Try checking a different tab or place a new order.</div>
        </div>
      `;
      return;
    }

    ordersListEl.innerHTML = filtered.map(o => {
      const dateText = new Date(o.createdAt).toLocaleString();
      const itemsText = (o.items || []).map(it => {
        const addonText = (it.addons || []).map(a => a.price > 0 ? `${a.name} (+${money(a.price)})` : a.name).join(", ");
        const addonSuffix = addonText ? ` — Add-ons: ${addonText}` : "";
        return `<li>${escapeHTML(it.name)} × ${it.qty}${escapeHTML(addonSuffix)}</li>`;
      }).join("");

      const canAct = o.status === "Received";
      const statusClass = `status--${o.status}`;

      return `
        <article class="orderCard">
          <div class="orderHead">
            <div>
              <div class="orderTitle">${escapeHTML(o.vendorName)}</div>
              <div class="orderMeta">${escapeHTML(dateText)} • Payment: ${escapeHTML(o.payMethod)}</div>
            </div>
            <div class="status ${statusClass}">${escapeHTML(o.status)}</div>
          </div>

          <div class="orderItems">
            <ul>${itemsText}</ul>
          </div>

          <div class="orderFooter">
            <div class="orderTotal">Total: ${money(o.total)}</div>
            <div style="display:flex; gap:10px;">
              ${canAct ? `<button class="btn btn--primary" type="button" data-complete="${o.id}">Mark as completed</button>` : ""}
              ${canAct ? `<button class="btn" type="button" data-cancel="${o.id}">Cancel</button>` : ""}
            </div>
          </div>
        </article>
      `;
    }).join("");

    ordersListEl.querySelectorAll("[data-complete]").forEach(btn => {
      btn.addEventListener("click", () => {
        FED.orders.updateStatus(btn.dataset.complete, "Completed");
        renderOrders();
        updateStatsUI();
      });
    });

    ordersListEl.querySelectorAll("[data-cancel]").forEach(btn => {
      btn.addEventListener("click", () => {
        FED.orders.updateStatus(btn.dataset.cancel, "Failed");
        renderOrders();
        updateStatsUI();
      });
    });
  }

  function init() {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        FED.state.orderTab = tab.dataset.tab;
        setActiveTabUI();
        renderOrders();
      });
    });

    document.getElementById("orderSearch").addEventListener("input", (e) => {
      FED.state.orderSearch = e.target.value;
      renderOrders();
    });

    document.getElementById("orderSort").addEventListener("change", (e) => {
      FED.state.orderSort = e.target.value;
      renderOrders();
    });

    FED.router.registerRoute("orders", () => {
      setActiveTabUI();
      renderOrders();
      updateStatsUI();
    });
  }

  return { init };
})();
