window.FED = window.FED || {};

FED.orders = (() => {
  const { loadJSON, saveJSON } = FED.utils;

  const LS_KEYS = {
    ORDERS: "fed_orders_v1",
  };

  function getOrders() {
    return loadJSON(LS_KEYS.ORDERS, []);
  }

  function setOrders(orders) {
    saveJSON(LS_KEYS.ORDERS, orders);
  }

  function addOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    setOrders(orders);
  }

  function updateStatus(orderId, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx < 0) return;
    orders[idx].status = newStatus;
    setOrders(orders);
  }

  function computeStats() {
    const orders = getOrders();

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter(o => o.status !== "Failed")
      .reduce((sum, o) => sum + o.total, 0);

    const freq = new Map();
    orders
      .filter(o => o.status !== "Failed")
      .forEach(o => (o.items || []).forEach(it => {
        freq.set(it.name, (freq.get(it.name) || 0) + it.qty);
      }));

    let fav = "-";
    let best = 0;
    for (const [name, count] of freq.entries()) {
      if (count > best) {
        best = count;
        fav = name;
      }
    }

    return { totalOrders, totalSpent, favItem: fav };
  }

  function clearAll() {
    saveJSON(LS_KEYS.ORDERS, []);
  }

  return { getOrders, setOrders, addOrder, updateStatus, computeStats, clearAll };
})();
