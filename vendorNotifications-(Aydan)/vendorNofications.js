// Live in-app notifications for vendors (new order toast)
// Standalone: derives vendorId/stallId itself (no need teammate globals)

(function () {
  const POLL_MS = 200;
  const TIMEOUT_MS = 15000;

  let _unsub = null;
  let _primed = false;
  let _seen = new Set();
  let _currentStall = null;
  let _started = false;

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

  function showToast(title, body) {
    const stack = ensureToastStack();

    const toast = document.createElement("div");
    toast.className = "vm-toast";
    toast.innerHTML = `
      <div class="t-title">${escapeHtml(title)}</div>
      <div class="t-body">${escapeHtml(body)}</div>
    `;

    stack.prepend(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Read vendor id from UI ("V1" / "V2") -> "v1" / "v2"
  function detectVendorIdFromUI() {
    const el =
      document.querySelector(".top-header-id") ||
      document.querySelector(".user-id") ||
      document.querySelector(".user-details .user-id");

    const raw = String(el?.textContent || "").trim();
    if (!raw) return "v1";
    return raw.toLowerCase(); // "V1" -> "v1"
  }

  // Resolve stallId without needing teammate globals
  async function resolveStallId() {
    // 1) If any global property exists (rare, but keep it)
    const direct =
      window.CURRENT_STALL_ID ||
      window.currentStallId ||
      window.vendorStallId ||
      window.CURRENT_VENDOR_STALL_ID ||
      window.CURRENT_VENDOR?.stallId;

    if (direct) return String(direct);

    // 2) Use the same approach as vendor-management.js
    const vendorId = detectVendorIdFromUI(); // v1 / v2

    // Prefer Firestore users doc
    if (window.DB?.getUserById) {
      try {
        const u = await window.DB.getUserById(vendorId);
        if (u?.stallId) return String(u.stallId);
      } catch (e) {
        console.warn("[LiveNotif] getUserById failed, fallback mapping used.", e);
      }
    }

    // 3) Fallback mapping
    return vendorId === "v2" ? "s2" : "s1";
  }

  function getListenFn() {
    // Prefer db-compat wrapper
    if (window.DB?.orders?.listenByStall) return window.DB.orders.listenByStall;

    // fallback older exports
    if (window.DB?._fs?.listenOrdersByStallId) return window.DB._fs.listenOrdersByStallId;

    return null;
  }

  function formatOrderBody(o) {
    const items = Array.isArray(o.items) ? o.items : [];
    const first = items[0];

    let itemText = first ? `${first.name} x${Number(first.qty || 1)}` : "Items received";
    if (items.length > 1) itemText += ` (+${items.length - 1} more)`;

    const customer = o.customerName || "Customer";

    const total = Number(o.total ?? o.totalAmount ?? 0);
    const totalText = Number.isFinite(total) && total > 0 ? `$${total.toFixed(2)}` : "";

    return `${customer} ordered: ${itemText}${totalText ? ` • Total: ${totalText}` : ""}`;
  }

  function startListener(stallId) {
    const listenFn = getListenFn();
    if (!listenFn) {
      console.warn("[LiveNotif] No listener function found. Check db-compat.js exposure.");
      return;
    }

    if (_unsub) {
      try { _unsub(); } catch {}
      _unsub = null;
    }

    _primed = false;
    _seen = new Set();
    _currentStall = stallId;

    // Optional: show 1-time “enabled” toast so you know it’s running
    if (!_started) {
      _started = true;
      showToast("🔔 Live notifications enabled", `Listening for new orders (${stallId})`);
    }

    _unsub = listenFn(stallId, (orders) => {
      const arr = Array.isArray(orders) ? orders : [];

      // first snapshot: mark existing as seen
      if (!_primed) {
        arr.forEach(o => _seen.add(o.id));
        _primed = true;
        return;
      }

      // later snapshots: toast only for truly new orders
      arr.forEach((o) => {
        if (_seen.has(o.id)) return;
        _seen.add(o.id);

        const st = String(o.status || "").toLowerCase();
        if (st === "cancelled" || st === "canceled" || st === "failed") return;

        const num = String(o.id || "").match(/\d+/);
        const orderNo = num ? num[0] : (o.id || "-");

        showToast("🧾 New order received", `Order #${orderNo} • ${formatOrderBody(o)}`);
      });
    });

    console.log("[LiveNotif] Listening for orders on stall:", stallId);
  }

  function waitForReady() {
    const start = Date.now();

    const timer = setInterval(async () => {
      const listenFn = getListenFn();
      if (!listenFn) {
        if (Date.now() - start > TIMEOUT_MS) {
          clearInterval(timer);
          console.warn("[LiveNotif] Timeout waiting for DB.orders listener.");
        }
        return;
      }

      const stallId = await resolveStallId();
      if (stallId) {
        if (_currentStall !== stallId) startListener(stallId);
        clearInterval(timer);
        return;
      }

      if (Date.now() - start > TIMEOUT_MS) {
        clearInterval(timer);
        console.warn("[LiveNotif] Timeout waiting for stallId.");
      }
    }, POLL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForReady);
  } else {
    waitForReady();
  }
})();
