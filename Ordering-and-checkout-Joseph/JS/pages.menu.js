window.FED = window.FED || {};
FED.pages = FED.pages || {};

FED.pages.menu = (() => {
  const { escapeHTML, money } = FED.utils;
  const { STALLS } = FED.data;

  const menuTitleEl = document.getElementById("menuTitle");
  const menuPageTitleEl = document.getElementById("menuPageTitle");
  const menuListEl = document.getElementById("menuList");

  function renderMenu() {
    const stall = STALLS.find(s => s.id === FED.state.selectedStallId);

    if (!stall) {
      menuTitleEl.textContent = "Menu";
      menuPageTitleEl.textContent = "Menu";
      menuListEl.innerHTML = `<div class="muted">No stall selected. Go back and pick a stall.</div>`;
      return;
    }

    menuTitleEl.textContent = `${stall.name} — Menu`;
    menuPageTitleEl.textContent = stall.name;

    let items = [...stall.menu];

    // search
    const q = (FED.state.menuSearch || "").toLowerCase().trim();
    if (q) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    // sort
    const sort = FED.state.menuSort;
    if (sort === "priceAsc") items.sort((a,b) => a.price - b.price);
    if (sort === "priceDesc") items.sort((a,b) => b.price - a.price);
    if (sort === "nameAsc") items.sort((a,b) => a.name.localeCompare(b.name));

    if (items.length === 0) {
      menuListEl.innerHTML = `<div class="muted">No items found.</div>`;
      return;
    }

    menuListEl.innerHTML = items.map(item => {
      const tagHtml = (item.tags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("");

      const addonHtml = (item.addons || []).map(a => {
        const extra = a.price > 0 ? `+${money(a.price)}` : "+$0.00";
        return `
          <label class="checkboxRow">
            <input type="checkbox" data-addon="${a.id}" data-item="${item.id}" />
            ${escapeHTML(a.name)} <span class="small">(${extra})</span>
          </label>
        `;
      }).join("");

      return `
        <article class="itemCard" data-itemcard="${item.id}">
          <div class="itemCard__top">
            <div>
              <div class="itemName">${escapeHTML(item.name)}</div>
              <div class="itemMeta">${tagHtml}</div>
            </div>
            <div class="itemPrice">${money(item.price)}</div>
          </div>

          <div class="row">
            <div class="stepper">
              <button type="button" data-step="dec" data-item="${item.id}">−</button>
              <div class="qty" id="qty_${item.id}">1</div>
              <button type="button" data-step="inc" data-item="${item.id}">+</button>
            </div>

            <button class="btn btn--primary" type="button" data-add="${item.id}">
              Add to cart
            </button>
          </div>

          <details class="addons">
            <summary>Optional add-ons</summary>
            <div class="addonList">
              ${addonHtml || `<div class="small">No add-ons for this item.</div>`}
            </div>
          </details>
        </article>
      `;
    }).join("");

    // steppers
    menuListEl.querySelectorAll("[data-step]").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.dataset.item;
        const qtyEl = document.getElementById(`qty_${itemId}`);
        let qty = Number(qtyEl.textContent || "1");
        qty = btn.dataset.step === "inc" ? qty + 1 : Math.max(1, qty - 1);
        qtyEl.textContent = String(qty);
      });
    });

    // add to cart
    menuListEl.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.dataset.add;
        const qty = Number(document.getElementById(`qty_${itemId}`).textContent || "1");
        const selectedItem = stall.menu.find(m => m.id === itemId);
        if (!selectedItem) return;

        const card = btn.closest(`[data-itemcard="${itemId}"]`);
        const checkedIds = [...card.querySelectorAll(`input[type="checkbox"][data-item="${itemId}"]:checked`)]
          .map(cb => cb.dataset.addon);

        const addons = (selectedItem.addons || []).filter(a => checkedIds.includes(a.id));
        FED.cart.addToCart(stall, selectedItem, qty, addons);

        btn.textContent = "Added!";
        setTimeout(() => (btn.textContent = "Add to cart"), 600);
      });
    });
  }

  function init() {
    document.getElementById("backToStallsBtn").addEventListener("click", () => {
      FED.router.go("browse");
    });

    document.getElementById("menuSearch").addEventListener("input", (e) => {
      FED.state.menuSearch = e.target.value;
      renderMenu();
    });

    document.getElementById("menuSort").addEventListener("change", (e) => {
      FED.state.menuSort = e.target.value;
      renderMenu();
    });

    FED.router.registerRoute("menu", () => renderMenu());
  }

  return { init };
})();
