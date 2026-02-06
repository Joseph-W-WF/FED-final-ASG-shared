window.FED = window.FED || {};

FED.pages = FED.pages || {};
FED.pages.cart = (() => {
  const { escapeHTML, money } = FED.utils;

  const cartWrapEl = document.getElementById("cartWrap");
  const cartEmptyEl = document.getElementById("cartEmpty");

  function renderCart() {
    const cart = FED.cart.getCart();
    const vendorGroups = Object.values(cart.vendors);

    const isEmpty = vendorGroups.length === 0 || vendorGroups.every(v => Object.keys(v.items).length === 0);
    cartEmptyEl.classList.toggle("is-hidden", !isEmpty);
    cartWrapEl.classList.toggle("is-hidden", isEmpty);

    if (isEmpty) {
      cartWrapEl.innerHTML = "";
      return;
    }

    cartWrapEl.innerHTML = vendorGroups.map(v => {
      const items = Object.values(v.items);

      const itemsHtml = items.map(line => {
        const addonText = (line.addons || []).map(a => a.price > 0 ? `${a.name} (+${money(a.price)})` : `${a.name}`).join(", ");
        const sub = addonText ? `Add-ons: ${addonText}` : "No add-ons";

        return `
          <div class="cartItem" data-line="${line.lineId}" data-vendor="${v.vendorId}">
            <div>
              <div class="cartItem__name">${escapeHTML(line.name)}</div>
              <div class="cartItem__sub">${escapeHTML(sub)}</div>
            </div>

            <div class="cartItem__right">
              <div class="money">${money(FED.cart.computeLineTotal(line))}</div>

              <div class="row">
                <div class="stepper">
                  <button type="button" data-cartstep="dec" data-line="${line.lineId}" data-vendor="${v.vendorId}">−</button>
                  <div class="qty">${line.qty}</div>
                  <button type="button" data-cartstep="inc" data-line="${line.lineId}" data-vendor="${v.vendorId}">+</button>
                </div>
                <button class="btn" type="button" data-remove="${line.lineId}" data-vendor="${v.vendorId}">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      const subtotal = FED.cart.computeVendorSubtotal(v);

      return `
        <section class="vendorCard">
          <div class="vendorHead">
            <div class="vendorName">${escapeHTML(v.vendorName)}</div>
            <span class="tag">Separate order</span>
          </div>

          ${itemsHtml}

          <div class="subtotalRow">
            <div class="muted"><strong>Subtotal</strong> (for this vendor)</div>
            <div class="money">${money(subtotal)}</div>
          </div>

          <div class="actions">
            <button class="btn btn--primary" type="button" data-checkout="${v.vendorId}">
              Proceed to checkout
            </button>
          </div>
        </section>
      `;
    }).join("");

    cartWrapEl.querySelectorAll("[data-cartstep]").forEach(btn => {
      btn.addEventListener("click", () => {
        const vendorId = btn.dataset.vendor;
        const lineId = btn.dataset.line;
        const delta = btn.dataset.cartstep === "inc" ? 1 : -1;
        FED.cart.bumpQty(vendorId, lineId, delta);
        renderCart();
      });
    });

    cartWrapEl.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        FED.cart.removeLine(btn.dataset.vendor, btn.dataset.remove);
        renderCart();
      });
    });

    cartWrapEl.querySelectorAll("[data-checkout]").forEach(btn => {
      btn.addEventListener("click", () => {
        FED.checkout.openCheckout(btn.dataset.checkout);
      });
    });
  }

  function init() {
    FED.router.registerRoute("cart", () => renderCart());
  }

  return { init, renderCart };
})();
