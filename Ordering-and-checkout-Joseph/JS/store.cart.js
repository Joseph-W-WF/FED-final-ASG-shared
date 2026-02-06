window.FED = window.FED || {};

FED.cart = (() => {
  const { loadJSON, saveJSON, money } = FED.utils;

  const LS_KEYS = {
    CART: "fed_cart_v1",
  };

  function emptyCart() {
    return { vendors: {} };
  }

  function getCart() {
    return loadJSON(LS_KEYS.CART, emptyCart());
  }

  function setCart(cart) {
    saveJSON(LS_KEYS.CART, cart);
  }

  // A stable key so "same item + same addons" merges into one line.
  function makeLineId(itemId, addons) {
    const addonIds = (addons || []).map(a => a.id).sort();
    return `${itemId}__${addonIds.join("_") || "no_addons"}`;
  }

  function computeLineTotal(line) {
    const addonsTotal = (line.addons || []).reduce((s, a) => s + Number(a.price || 0), 0);
    return (Number(line.unitPrice || 0) + addonsTotal) * Number(line.qty || 0);
  }

  function computeVendorSubtotal(vendorGroup) {
    return Object.values(vendorGroup.items || {}).reduce((sum, line) => sum + computeLineTotal(line), 0);
  }

  function countItems(cart) {
    let count = 0;
    Object.values(cart.vendors || {}).forEach(v => {
      Object.values(v.items || {}).forEach(line => {
        count += Number(line.qty || 0);
      });
    });
    return count;
  }

  function updateBadge() {
    const el = document.getElementById("cartBadge");
    if (!el) return;

    const cart = getCart();
    el.textContent = String(countItems(cart));
  }

  function addToCart(stall, item, qty, addons) {
    const cart = getCart();
    const vendorId = stall.id;
    const vendorName = stall.name;

    cart.vendors[vendorId] = cart.vendors[vendorId] || { vendorId, vendorName, items: {} };

    const lineId = makeLineId(item.id, addons);
    const existing = cart.vendors[vendorId].items[lineId];

    if (existing) {
      existing.qty += Number(qty || 1);
    } else {
      cart.vendors[vendorId].items[lineId] = {
        lineId,
        itemId: item.id,
        name: item.name,
        unitPrice: Number(item.price || 0),
        qty: Number(qty || 1),
        addons: (addons || []).map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
      };
    }

    setCart(cart);
    updateBadge();
  }

  function bumpQty(vendorId, lineId, delta) {
    const cart = getCart();
    const v = cart.vendors[vendorId];
    if (!v || !v.items[lineId]) return;

    v.items[lineId].qty = Number(v.items[lineId].qty || 0) + Number(delta || 0);

    if (v.items[lineId].qty <= 0) {
      delete v.items[lineId];
    }

    if (Object.keys(v.items).length === 0) {
      delete cart.vendors[vendorId];
    }

    setCart(cart);
    updateBadge();
  }

  function removeLine(vendorId, lineId) {
    const cart = getCart();
    const v = cart.vendors[vendorId];
    if (!v) return;

    delete v.items[lineId];

    if (Object.keys(v.items).length === 0) {
      delete cart.vendors[vendorId];
    }

    setCart(cart);
    updateBadge();
  }

  function clearVendor(vendorId) {
    const cart = getCart();
    delete cart.vendors[vendorId];
    setCart(cart);
    updateBadge();
  }

  function clearAll() {
    setCart(emptyCart());
    updateBadge();
  }

  return {
    getCart,
    setCart,
    addToCart,
    bumpQty,
    removeLine,
    clearVendor,
    clearAll,
    computeLineTotal,
    computeVendorSubtotal,
    updateBadge,
  };
})();
