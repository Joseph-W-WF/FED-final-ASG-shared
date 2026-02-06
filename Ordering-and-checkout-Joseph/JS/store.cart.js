window.FED = window.FED || {};

FED.cart = (() => {
  const { loadJSON, saveJSON } = FED.utils;

  const LS_KEYS = { CART: "fed_cart_v1" };

  function getCart() {
    return loadJSON(LS_KEYS.CART, { vendors: {} });
  }

  function setCart(cart) {
    saveJSON(LS_KEYS.CART, cart);
    updateBadge();
  }

  function makeLineId(itemId, addonIdsSorted) {
    return `${itemId}__${addonIdsSorted.join("_")}`;
  }

  function computeLineTotal(line) {
    const addonsTotal = (line.addons || []).reduce((sum, a) => sum + a.price, 0);
    return (line.unitPrice + addonsTotal) * line.qty;
  }

  function computeVendorSubtotal(vendorGroup) {
    return Object.values(vendorGroup.items).reduce(
      (sum, line) => sum + computeLineTotal(line),
      0
    );
  }

  function itemCount() {
    const cart = getCart();
    let count = 0;
    for (const v of Object.values(cart.vendors)) {
      for (const it of Object.values(v.items)) {
        count += it.qty;
      }
    }
    return count;
  }

  function updateBadge() {
    const badge = document.getElementById("cartBadge");
    if (badge) badge.textContent = String(itemCount());
  }

  function addToCart(stall, item, qty, addons) {
    const cart = getCart();

    if (!cart.vendors[stall.id]) {
      cart.vendors[stall.id] = {
        vendorId: stall.id,
        vendorName: stall.name,
        items: {},
      };
    }

    const group = cart.vendors[stall.id];

    const addonIds = (addons || []).map(a => a.id).sort();
    const lineId = makeLineId(item.id, addonIds);

    if (!group.items[lineId]) {
      group.items[lineId] = {
        lineId,
        vendorId: stall.id,
        vendorName: stall.name,
        itemId: item.id,
        name: item.name,
        unitPrice: item.price,
        tags: item.tags || [],
        addons: addons || [],
        qty: 0,
      };
    }

    group.items[lineId].qty += qty;
    setCart(cart);
  }

  function removeLine(vendorId, lineId) {
    const cart = getCart();
    const group = cart.vendors[vendorId];
    if (!group) return;

    delete group.items[lineId];
    if (Object.keys(group.items).length === 0) delete cart.vendors[vendorId];
    setCart(cart);
  }

  function bumpQty(vendorId, lineId, delta) {
    const cart = getCart();
    const group = cart.vendors[vendorId];
    if (!group || !group.items[lineId]) return;

    group.items[lineId].qty = Math.max(1, group.items[lineId].qty + delta);
    setCart(cart);
  }

  function clearVendor(vendorId) {
    const cart = getCart();
    delete cart.vendors[vendorId];
    setCart(cart);
  }

  function clearAll() {
    saveJSON(LS_KEYS.CART, { vendors: {} });
    updateBadge();
  }

  return {
    getCart,
    setCart,
    addToCart,
    removeLine,
    bumpQty,
    clearVendor,
    clearAll,
    updateBadge,
    computeLineTotal,
    computeVendorSubtotal,
  };
})();
