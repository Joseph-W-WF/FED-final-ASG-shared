// vendor live notifications 
// this listens for new orders for the current vendor and pops a toast when a new one comes in
// key idea: we "prime" the listener first so old orders don't trigger spam, then only toast on new docs

(function () {
  // how often we retry while waiting for db + stall id to be available
  const POLL_MS = 200;

  // stop trying after this time so we don't spam the console forever
  const TIMEOUT_MS = 15000;

  // unsubscribe function returned by firestore onSnapshot
  let _unsub = null;

  // used to ignore the first snapshot (we treat it as "baseline", not "new orders")
  let _primed = false;

  // keeps track of order ids we've already seen so we don't toast duplicates
  let _seen = new Set();

  // remembers which stall id we are currently listening to
  let _currentStall = null;

  // used to show the "enabled" toast only once
  let _started = false;

  // reads the app's login session (this is your custom login, not firebase auth)
  function readSession() {
    try {
      return JSON.parse(localStorage.getItem("hawkerSessionUser_v1") || "null");
    } catch {
      return null;
    }
  }

  // creates (or reuses) a container that holds all toast popups
  function ensureToastStack() {
    let stack = document.getElementById("vmToastStack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "vmToastStack";
      stack.className = "vm-toast-stack";
      document.body.appendChild(stack);
    }
    return stack;
  }

  // escapes html so user content can't break our toast layout
  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // builds a toast element, animates it in, then auto-removes it after a few seconds
  function showToast(title, body) {
    const stack = ensureToastStack();

    const toast = document.createElement("div");
    toast.className = "vm-toast";
    toast.innerHTML = `
      <div class="t-title">${escapeHtml(title)}</div>
      <div class="t-body">${escapeHtml(body)}</div>
    `;

    // newest toast should appear at the top
    stack.prepend(toast);

    // quick "show" class for css animation
    setTimeout(() => toast.classList.add("show"), 10);

    // auto-hide after a few seconds so it doesn't clutter the vendor screen
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // tries to identify which vendor is logged in
  // we prefer session data, but fall back to reading vendor id from the header if needed
  function detectVendorId() {
    const u = readSession();
    const role = String(u?.role || "").toUpperCase();
    if (u?.id && role === "VENDOR") return String(u.id).toLowerCase();

    const el =
      document.querySelector(".top-header-id") ||
      document.querySelector(".user-id") ||
      document.querySelector(".user-details .user-id");

    const raw = String(el?.textContent || "").trim();
    if (!raw) return "v1";
    return raw.toLowerCase();
  }

  // converts vendor -> stall id
  // priority: global vars -> firestore user doc -> fallback mapping
  async function resolveStallId() {
    const direct =
      window.CURRENT_STALL_ID ||
      window.currentStallId ||
      window.vendorStallId ||
      window.CURRENT_VENDOR_STALL_ID ||
      window.CURRENT_VENDOR?.stallId;

    if (direct) return String(direct);

    const vendorId = detectVendorId();

    // if your firestore has users docs with stallId, this is the cleanest mapping
    if (window.DB?.getUserById) {
      try {
        const u = await window.DB.getUserById(vendorId);
        if (u?.stallId) return String(u.stallId);
      } catch (e) {
        console.warn("[live notif] getUserById failed, using fallback mapping.", e);
      }
    }

    // fallback for seed demo accounts (v1 -> s1, v2 -> s2)
    return vendorId === "v2" ? "s2" : "s1";
  }

  // finds the best available "listen orders" function from the project's db wrapper
  function getListenFn() {
    if (window.DB?.orders?.listenByStall) return window.DB.orders.listenByStall;
    if (window.DB?._fs?.listenOrdersByStallId) return window.DB._fs.listenOrdersByStallId;
    return null;
  }

  // formats a short message so the vendor knows what got ordered without opening the full order page
  function formatOrderBody(o) {
    const items = Array.isArray(o.items) ? o.items : [];
    const first = items[0];

    // show first item + count, then a "+n more" if there are more items
    let itemText = first ? `${first.name} x${Number(first.qty || 1)}` : "items received";
    if (items.length > 1) itemText += ` (+${items.length - 1} more)`;

    const customer = o.customerName || "customer";

    const total = Number(o.total ?? o.totalAmount ?? 0);
    const totalText = Number.isFinite(total) && total > 0 ? `$${total.toFixed(2)}` : "";

    return `${customer} ordered: ${itemText}${totalText ? ` • total: ${totalText}` : ""}`;
  }

  // sets up a realtime listener for the vendor's stall
  // important: first snapshot is treated as baseline (no toast), then we toast for truly new order ids
  function startListener(stallId) {
    const listenFn = getListenFn();
    if (!listenFn) {
      console.warn("[live notif] no listener function found (check db-compat.js exposure).");
      return;
    }

    // if we're switching stalls, clean up the old listener first
    if (_unsub) {
      try { _unsub(); } catch {}
      _unsub = null;
    }

    _primed = false;
    _seen = new Set();
    _currentStall = stallId;

    // show a one-time toast so the vendor knows notifications are running
    if (!_started) {
      _started = true;
      showToast("🔔 live notifications enabled", `listening for new orders (${stallId})`);
    }

    _unsub = listenFn(stallId, (orders) => {
      const arr = Array.isArray(orders) ? orders : [];

      // first snapshot: mark all current orders as "seen" so we don't toast old ones
      if (!_primed) {
        arr.forEach((o) => _seen.add(o.id));
        _primed = true;
        return;
      }

      // later snapshots: toast only for orders we haven't seen before
      arr.forEach((o) => {
        if (_seen.has(o.id)) return;
        _seen.add(o.id);

        // skip obvious non-actionable statuses
        const st = String(o.status || "").toLowerCase();
        if (st === "cancelled" || st === "canceled" || st === "failed") return;

        // try to show a nicer "order #123" if the id contains digits
        const num = String(o.id || "").match(/\d+/);
        const orderNo = num ? num[0] : (o.id || "-");

        showToast("🧾 new order received", `order #${orderNo} • ${formatOrderBody(o)}`);
      });
    });

    console.log("[live notif] listening for orders on stall:", stallId);
  }

  // waits until db + stall id are available, then starts the listener
  function boot() {
    const start = Date.now();

    const timer = setInterval(async () => {
      const listenFn = getListenFn();

      // if db wrapper isn't ready yet, keep waiting until timeout
      if (!listenFn) {
        if (Date.now() - start > TIMEOUT_MS) {
          clearInterval(timer);
          console.warn("[live notif] timeout waiting for db orders listener.");
        }
        return;
      }

      // once we can resolve stall id, start listening
      const stallId = await resolveStallId();
      if (stallId) {
        if (_currentStall !== stallId) startListener(stallId);
        clearInterval(timer);
        return;
      }

      // safety timeout so we don't poll forever
      if (Date.now() - start > TIMEOUT_MS) {
        clearInterval(timer);
        console.warn("[live notif] timeout waiting for stall id.");
      }
    }, POLL_MS);
  }

  // run once the dom is ready so querySelector calls won't fail
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
