window.FED = window.FED || {};

FED.checkout = (() => {
  const { money, uid, escapeHTML } = FED.utils;

  const summaryEl = document.getElementById("checkoutSummary");
  const payNowBtn = document.getElementById("payNowBtn");
  const cancelBtn = document.getElementById("checkoutCancelBtn");
  const forceFailCb = document.getElementById("forceFail");

  const overlayEl = document.getElementById("payOverlay");
  const overlayCardEl = document.getElementById("overlayCard");

  function openCheckout(vendorId) {
    FED.state.checkoutVendorId = vendorId;
    renderCheckout();
    FED.router.go("checkout");
  }

  function renderCheckout() {
    const cart = FED.cart.getCart();
    const group = cart.vendors[FED.state.checkoutVendorId];

    if (!group) {
      summaryEl.innerHTML = `<div class="muted">Vendor cart not found.</div>`;
      return;
    }

    const subtotal = FED.cart.computeVendorSubtotal(group);

    const linesHtml = Object.values(group.items).map(line => {
      const addonText = (line.addons || []).map(a => a.price > 0 ? `${a.name} (+${money(a.price)})` : `${a.name}`).join(", ");
      const addonLine = addonText ? `<div class="summarySmall">Add-ons: ${escapeHTML(addonText)}</div>` : `<div class="summarySmall">No add-ons</div>`;
      const addonsTotal = (line.addons || []).reduce((s, a) => s + a.price, 0);

      return `
        <div class="summaryBox">
          <div class="summaryLine">
            <div>
              <div class="summaryTitle">${escapeHTML(line.name)} × ${line.qty}</div>
              ${addonLine}
            </div>
            <div class="money">${money((line.unitPrice + addonsTotal) * line.qty)}</div>
          </div>
        </div>
      `;
    }).join("");

    summaryEl.innerHTML = `
      <div class="summaryBox">
        <div class="summaryTitle">${escapeHTML(group.vendorName)}</div>
        <div class="summarySmall">This checkout only pays this vendor’s items.</div>
      </div>
      ${linesHtml}
      <div class="summaryTotal">
        <div>Total</div>
        <div>${money(subtotal)}</div>
      </div>
    `;
  }

  function showOverlayProcessing() {
    overlayCardEl.innerHTML = `
      <div class="overlayRow">
        <div class="spinner" aria-hidden="true"></div>
        <div style="font-weight:900; font-size:18px;">Processing payment</div>
        <div class="muted">Please wait…</div>
      </div>
    `;
    overlayEl.classList.remove("is-hidden");
  }

  function showOverlayResult(success, order) {
    const icon = success ? "✅" : "❌";
    const title = success ? "Payment Success" : "Payment Failed";
    const msg = success
      ? "Redirecting to order history…"
      : "Your payment did not go through. You can retry from the cart (items are kept).";

    overlayCardEl.innerHTML = `
      <div class="overlayRow">
        <div style="font-size:40px;">${icon}</div>
        <div style="font-weight:900; font-size:18px;">${title}</div>
        <div class="muted">${msg}</div>

        <div style="margin-top:12px; width:100%; border-top:1px solid rgba(17,24,39,0.08); padding-top:12px;">
          <div style="display:flex; justify-content:space-between; gap:10px;">
            <div class="muted">Vendor</div>
            <div style="font-weight:900;">${escapeHTML(order.vendorName)}</div>
          </div>
          <div style="display:flex; justify-content:space-between; gap:10px; margin-top:6px;">
            <div class="muted">Total</div>
            <div style="font-weight:900;">${money(order.total)}</div>
          </div>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; width:100%; margin-top:14px;">
          <button class="btn" type="button" id="overlayCloseBtn">Close</button>
        </div>
      </div>
    `;

    document.getElementById("overlayCloseBtn").addEventListener("click", closeOverlay);

    if (success) {
      setTimeout(() => {
        closeOverlay();
        FED.state.orderTab = "Received";
        FED.router.go("orders");
      }, 1100);
    }
  }

  function closeOverlay() {
    overlayEl.classList.add("is-hidden");
  }

  function startPayment() {
    const cart = FED.cart.getCart();
    const group = cart.vendors[FED.state.checkoutVendorId];
    if (!group) return;

    const payMethod = document.querySelector("input[name='payMethod']:checked")?.value || "Cash";
    const total = FED.cart.computeVendorSubtotal(group);

    showOverlayProcessing();

    const shouldFail = forceFailCb.checked;

    setTimeout(() => {
      const order = {
        id: uid(),
        vendorId: group.vendorId,
        vendorName: group.vendorName,
        items: Object.values(group.items).map(line => ({
          name: line.name,
          qty: line.qty,
          unitPrice: line.unitPrice,
          addons: line.addons || [],
          lineTotal: FED.cart.computeLineTotal(line),
        })),
        total,
        payMethod,
        status: shouldFail ? "Failed" : "Received",
        createdAt: new Date().toISOString(),
      };

      FED.orders.addOrder(order);

      if (!shouldFail) {
        FED.cart.clearVendor(FED.state.checkoutVendorId);
      }

      FED.cart.updateBadge();
      showOverlayResult(!shouldFail, order);
    }, 1200);
  }

  function init() {
    cancelBtn.addEventListener("click", () => FED.router.go("cart"));
    payNowBtn.addEventListener("click", () => startPayment());

    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) closeOverlay();
    });

    FED.router.registerRoute("checkout", () => renderCheckout());
  }

  return { init, openCheckout, renderCheckout };
})();
