// Ordering-and-checkout-Joseph/JS/store.orders.js
window.FED = window.FED || {};

FED.orders = (() => {
  const KEY = "fed_orders_v1";
  const DEVICE_KEY = "fed_device_id_v1";

  function read() {
    return FED.utils.loadJSON(KEY, []);
  }
  function write(orders) {
    FED.utils.saveJSON(KEY, orders);
  }

  function getSessionUser() {
    try {
      return JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null");
    } catch {
      return null;
    }
  }

  function getOrCreateDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = "dev_" + Math.random().toString(16).slice(2) + "_" + Date.now();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function getCustomerKey() {
    const u = getSessionUser();
    if (u && u.role === "CUSTOMER" && u.id) return `c:${u.id}`;
    return `d:${getOrCreateDeviceId()}`;
  }

  // Map ordering vendorId/stall names -> Firestore stallId (s1, s2...)
  function mapStallId(order) {
    const byVendorId = {
      stall_1: "s1",
      stall_2: "s2",
      stall_3: "s3",
      stall_4: "s4",
      stall_5: "s5",
    };
    const byName = {
      "Clemens Kitchen": "s1",
      "Indian Corner": "s2",
      "Pasta Place": "s3",
      "Malay Delights": "s4",
      "Peranakan Kitchen": "s5",
    };

    if (order?.vendorId && byVendorId[order.vendorId]) return byVendorId[order.vendorId];
    if (order?.vendorName && byName[order.vendorName]) return byName[order.vendorName];
    return order?.vendorId || "";
  }

  function toFirestoreOrder(localOrder) {
    const sess = getSessionUser();
    const customerKey = getCustomerKey();
    const stallId = mapStallId(localOrder);

    return {
      id: localOrder.id,
      orderNo: localOrder.id,
      customerKey,
      customerId: sess?.role === "CUSTOMER" ? sess.id : null,
      customerName: sess?.role === "CUSTOMER" ? (sess.username || sess.id) : "Guest",
      stallId,
      stallName: localOrder.vendorName || "",
      rawVendorId: localOrder.vendorId || "",
      status: localOrder.status || "Received",
      createdDate: localOrder.createdAt || new Date().toISOString(),
      paymentMethod: localOrder.payMethod || "Cash",
      paymentStatus: localOrder.status === "Failed" ? "FAILED" : "SUCCESS",
      total: Number(localOrder.total || 0),
      items: (localOrder.items || []).map((it) => ({
        name: it.name,
        qty: Number(it.qty || 1),
        unitPrice: Number(it.unitPrice || 0),
        lineTotal: Number(it.lineTotal || (Number(it.unitPrice || 0) * Number(it.qty || 1))),
      })),
      queueTicketId: localOrder.queueTicketId || null,
      queueNo: localOrder.queueNo || null,
      queueEtaMin: localOrder.queueEtaMin || null,
    };
  }

  function fromFirestoreOrder(o) {
    return {
      id: o.id,
      vendorId: o.rawVendorId || o.stallId,
      vendorName: o.stallName || "",
      items: (o.items || []).map((it) => ({
        name: it.name,
        qty: it.qty,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
      total: o.total || 0,
      payMethod: o.paymentMethod || "Cash",
      status: o.status || "Received",
      createdAt: o.createdDate || "",
      queueTicketId: o.queueTicketId || null,
      queueNo: o.queueNo || null,
      queueEtaMin: o.queueEtaMin || null,
    };
  }

  async function tryUpsertFirestore(order) {
    try {
      if (window.DB?.orders?.upsert) {
        await window.DB.orders.upsert(toFirestoreOrder(order));
      }
    } catch (e) {
      console.warn("Firestore upsert failed:", e);
    }
  }

  async function tryUpdateStatusFirestore(orderId, status) {
    try {
      if (window.DB?.orders?.updateStatus) {
        await window.DB.orders.updateStatus(orderId, status);
      }
    } catch (e) {
      console.warn("Firestore status update failed:", e);
    }
  }

  // Live sync: Firestore -> localStorage (so your existing UI renders the same)
  let unsub = null;
  function startSync() {
    if (unsub) return;

    const boot = () => {
      if (!window.DB?.orders?.listenByCustomer) return;
      const customerKey = getCustomerKey();
      unsub = window.DB.orders.listenByCustomer(customerKey, (remoteOrders) => {
        const local = read();
        const byId = new Map(local.map((x) => [x.id, x]));

        (remoteOrders || []).forEach((ro) => {
          const lo = fromFirestoreOrder(ro);
          byId.set(lo.id, { ...byId.get(lo.id), ...lo });
        });

        const merged = Array.from(byId.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        write(merged);
        document.dispatchEvent(new CustomEvent("fed_orders_updated", { detail: merged }));
      });
    };

    // retry a few times (module scripts may load slightly later)
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      boot();
      if (unsub || tries >= 10) clearInterval(t);
    }, 300);
  }

  function getOrders() {
    startSync();
    return read();
  }

  function setOrders(orders) {
    write(orders);
  }

  function addOrder(order) {
    const orders = read();
    orders.unshift(order);
    write(orders);
    tryUpsertFirestore(order);
  }

  function updateStatus(orderId, status) {
    const orders = read();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = status;
      write(orders);
    }
    tryUpdateStatusFirestore(orderId, status);
  }

  function computeStats() {
  const all = read();

  // match what the Orders page is currently showing
  let filtered = all;

  const tab = FED.state?.orderTab;
  if (tab) filtered = filtered.filter(o => o.status === tab);

  const q = (FED.state?.orderSearch || "").toLowerCase().trim();
  if (q) {
    filtered = filtered.filter(o => {
      const vendor = String(o.vendorName || "").toLowerCase();
      const vendorMatch = vendor.includes(q);

      const itemMatch = (o.items || []).some(it =>
        String(it.name || "").toLowerCase().includes(q)
      );

      return vendorMatch || itemMatch;
    });
  }

  const totalOrders = filtered.length;

  // For cancelled tab, spent should normally be 0
  const totalSpent = filtered.reduce((sum, o) => {
    const t = Number(o.total);
    return sum + (Number.isFinite(t) ? t : 0);
  }, 0);

  // Favorite item (by quantity)
  const counts = new Map();
  for (const o of filtered) {
    for (const it of (o.items || [])) {
      const name = String(it.name || "").trim();
      if (!name) continue;
      const qty = Number(it.qty) || 1;
      counts.set(name, (counts.get(name) || 0) + qty);
    }
  }

  let favItem = "-";
  let best = 0;
  for (const [name, c] of counts.entries()) {
    if (c > best) {
      best = c;
      favItem = name;
    }
  }

  return { totalOrders, totalSpent, favItem };
}


  function clearAll() {
    write([]);
  }

  // auto-start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startSync);
  } else {
    startSync();
  }

  return { getOrders, setOrders, addOrder, updateStatus, computeStats, clearAll };
})();
