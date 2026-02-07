// JS/firestore-service.js
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/* ---------------------------
   STALLS
---------------------------- */
export async function getStalls() {
  const snap = await getDocs(collection(db, "stalls"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getStallById(stallId) {
  const ref = doc(db, "stalls", stallId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ---------------------------
   VIOLATION CATALOG
---------------------------- */
export async function getViolationCatalog() {
  const snap = await getDocs(collection(db, "violationCatalog"));
  return snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      code: data.code || d.id,
      title: data.title || data.desc || data.name || "",
      severityDefault: data.severityDefault || data.severity || "MAJOR",
    };
  });
}


export async function addViolationCatalogItem(item) {
  // Use code as doc id if you want stable lookups: doc(db,"violationCatalog", item.code)
  // Here: auto id
  const ref = await addDoc(collection(db, "violationCatalog"), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/* ---------------------------
   INSPECTIONS
---------------------------- */
export async function addInspection(inspection) {
  const ref = await addDoc(collection(db, "inspections"), {
    ...inspection,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getInspectionsByStall(stallId) {
  const q = query(
    collection(db, "inspections"),
    where("stallId", "==", stallId)
    // ✅ removed orderBy to avoid composite index requirement
  );

  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Sort newest first in JS instead
  rows.sort((a, b) => new Date(b.conductedDate || 0) - new Date(a.conductedDate || 0));
  return rows;
}


/* ---------------------------
   INSPECTION VIOLATIONS (subcollection)
   inspections/{inspectionId}/violations
---------------------------- */
export async function addInspectionViolations(inspectionId, violations) {
  const base = collection(db, "inspections", inspectionId, "violations");
  for (const v of violations) {
    await addDoc(base, { ...v, createdAt: serverTimestamp() });
  }
}

export async function getInspectionViolations(inspectionId) {
  const snap = await getDocs(
    collection(db, "inspections", inspectionId, "violations")
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------------------
   PENALTIES
---------------------------- */
export async function addPenalty(penalty) {
  const ref = await addDoc(collection(db, "penalties"), {
    ...penalty,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPenaltiesByStall(stallId) {
  const q = query(
    collection(db, "penalties"),
    where("stallId", "==", stallId)
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // optional sort in JS by createdAt if present
  rows.sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdDateTime || 0);
    const dbb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdDateTime || 0);
    return dbb - da;
  });
  return rows;
}

/* ---------------------------
   SCHEDULED INSPECTIONS
---------------------------- */
export async function addScheduledInspection(item) {
  const ref = await addDoc(collection(db, "scheduledInspections"), {
    ...item,
    status: "scheduled",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getScheduledInspections(status = "scheduled") {
  const q = query(
    collection(db, "scheduledInspections"),
    where("status", "==", status)
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => new Date(a.scheduledDate || 0) - new Date(b.scheduledDate || 0));
  return rows;
}

export async function markScheduledCompleted(scheduleId) {
  await updateDoc(doc(db, "scheduledInspections", scheduleId), {
    status: "completed",
    completedAt: serverTimestamp(),
  });
}

/* ---------------------------
   MENU ITEMS (Vendor)
   collection: menuItems
   fields: { stallName, name, cuisines:[], price, createdAt }
---------------------------- */
export async function getMenuItems(stallName = null) {
  let qRef = collection(db, "menuItems");
  let qFinal = qRef;

  if (stallName) {
    qFinal = query(qRef, where("stallName", "==", stallName));
  }

  const snap = await getDocs(qFinal);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // optional sort by name
  rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  return rows;
}

export async function getMenuItemById(id) {
  const ref = doc(db, "menuItems", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addMenuItem(item) {
  const ref = await addDoc(collection(db, "menuItems"), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMenuItem(id, patch) {
  await updateDoc(doc(db, "menuItems", id), patch);
  return true;
}

export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, "menuItems", id));
  return true;
}

/* ---------------------------
   RENTAL AGREEMENTS (Vendor)
   collection: rentalAgreements
   fields: { stallName, id (agreement id string), startDate, endDate, amount, status, createdAt }
---------------------------- */
export async function getRentalAgreements(stallName = null) {
  let qRef = collection(db, "rentalAgreements");
  let qFinal = qRef;

  if (stallName) {
    qFinal = query(qRef, where("stallName", "==", stallName));
  }

  const snap = await getDocs(qFinal);
  const rows = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));

  // Sort newest first by startDate (string date ok)
  rows.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
  return rows;
}

export async function getRentalByAgreementId(agreementId) {
  const q1 = query(collection(db, "rentalAgreements"), where("id", "==", agreementId));
  const snap = await getDocs(q1);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { _docId: d.id, ...d.data() };
}

export async function addRentalAgreement(r) {
  const ref = await addDoc(collection(db, "rentalAgreements"), {
    ...r,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRentalAgreementByDocId(docId, patch) {
  await updateDoc(doc(db, "rentalAgreements", docId), patch);
  return true;
}

export async function deleteRentalAgreementByDocId(docId) {
  await deleteDoc(doc(db, "rentalAgreements", docId));
  return true;
}


export async function getMenuItemsByStallId(stallId) {
  const q1 = query(collection(db, "menuItems"), where("stallId", "==", stallId));
  const snap = await getDocs(q1);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------------------
   ORDERS (Vendor)
   Collections:
   - orders: { id, stallId, createdDateTime, status, totalAmount, customerIdOrGuestId }
   - orderItems: { orderId, menuItemId, qty, unitPrice, lineTotal }
   - payments: { orderId, method, status, paidAmount, createdDateTime }
   - menuItems: { name, ... } (docId usually = menuItemId)
---------------------------- */

function mapOrderStatus(s) {
  const v = String(s || "").toUpperCase();
  if (v === "COLLECTED" || v === "COMPLETED") return "Collected";
  if (v === "CANCELLED" || v === "CANCELED") return "cancelled";
  return "active";
}

function mapPaymentMethod(m) {
  const v = String(m || "").toUpperCase();
  if (v === "PAYNOW") return "PayNow";
  if (v === "CASH") return "Cash";
  if (v === "CARD") return "Card";
  return m || "-";
}

function formatOrderNumber(orderId) {
  // if orderId looks like o1001 -> 1001, else keep orderId
  const m = String(orderId || "").match(/\d+/);
  return m ? m[0] : String(orderId || "-");
}

async function getDocsByInQuery(colName, field, values) {
  // Firestore 'in' query max 10 items
  const out = [];
  for (let i = 0; i < values.length; i += 10) {
    const chunk = values.slice(i, i + 10);
    const q1 = query(collection(db, colName), where(field, "in", chunk));
    const snap = await getDocs(q1);
    out.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  return out;
}

export async function getVendorOrdersByStallId(stallId) {
  // 1) Orders for this stall
  const qOrders = query(collection(db, "orders"), where("stallId", "==", stallId));
  const ordersSnap = await getDocs(qOrders);
  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Sort newest first (string date still ok)
  orders.sort((a, b) => new Date(b.createdDateTime || 0) - new Date(a.createdDateTime || 0));

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);

  // 2) Get items + payments for these orders
  const items = await getDocsByInQuery("orderItems", "orderId", orderIds);
  const pays = await getDocsByInQuery("payments", "orderId", orderIds);

  // 3) Get menu item names (docId usually matches menuItemId)
  const menuItemIds = [...new Set(items.map((it) => it.menuItemId).filter(Boolean))];
  let menuMap = {};
  for (let i = 0; i < menuItemIds.length; i += 10) {
    const chunk = menuItemIds.slice(i, i + 10);
    // docId is usually menuItemId, but in case, also try where("id","in",chunk) if needed later
    const snaps = await Promise.all(
      chunk.map(async (mid) => {
        const ref = doc(db, "menuItems", mid);
        const s = await getDoc(ref);
        return s.exists() ? { id: s.id, ...s.data() } : null;
      })
    );
    snaps.filter(Boolean).forEach((mi) => (menuMap[mi.id] = mi));
  }

  // 4) Build display-ready vendor orders
  const itemsByOrder = {};
  for (const it of items) {
    const oid = it.orderId;
    if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
    itemsByOrder[oid].push(it);
  }

  const payByOrder = {};
  for (const p of pays) {
    // pick first success-ish payment if multiple
    if (!payByOrder[p.orderId]) payByOrder[p.orderId] = p;
  }

  return orders.map((o) => {
    const oi = (itemsByOrder[o.id] || []).slice().sort((a, b) => (b.lineTotal || 0) - (a.lineTotal || 0));
    const first = oi[0];

    const menu = first ? menuMap[first.menuItemId] : null;

    // item label: "Chicken Rice (+2 more)" if multiple items
    let itemLabel = menu?.name || "—";
    if (oi.length > 1) itemLabel = `${itemLabel} (+${oi.length - 1} more)`;

    const pay = payByOrder[o.id];

    const customerName = o.customerName || o.customerIdOrGuestId || "Customer";

    return {
      orderId: o.id,
      orderNumber: formatOrderNumber(o.id),
      customerName,
      status: mapOrderStatus(o.status),
      date: o.createdDateTime || "",
      item: itemLabel,
      quantity: first?.qty || 1,
      price: Number(o.totalAmount || first?.lineTotal || 0),
      paymentMethod: mapPaymentMethod(pay?.method),
    };
  });
}

export async function getUserById(userId) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
