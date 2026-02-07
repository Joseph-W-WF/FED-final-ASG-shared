// JS/firestore-service.js
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { db } from "./firebase.js";

/* -------------------- helpers -------------------- */
function mapDoc(snap) {
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
function mapDocs(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
function toISO(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v.toDate === "function") return v.toDate().toISOString();
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000).toISOString();
  return null;
}

/* -------------------- Stalls -------------------- */
export async function getStalls() {
  const snap = await getDocs(collection(db, "stalls"));
  return mapDocs(snap);
}

export async function getStallById(stallId) {
  const snap = await getDoc(doc(db, "stalls", stallId));
  return mapDoc(snap);
}

/* -------------------- Violation Catalog -------------------- */
export async function getViolationCatalog() {
  const snap = await getDocs(collection(db, "violationCatalog"));
  return mapDocs(snap);
}

export async function addViolationCatalogItem(item) {
  const docRef = await addDoc(collection(db, "violationCatalog"), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateViolationCatalogItem(id, data) {
  await updateDoc(doc(db, "violationCatalog", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteViolationCatalogItem(id) {
  await deleteDoc(doc(db, "violationCatalog", id));
}

/* -------------------- Inspections -------------------- */
export async function getInspectionsByStallId(stallId) {
  const q = query(collection(db, "inspections"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  const out = mapDocs(snap);

  // normalize timestamps to ISO (optional but helps UI)
  return out.map((x) => ({
    ...x,
    createdAtISO: toISO(x.createdAt) || x.createdAtISO || null,
  }));
}

export async function addInspection(inspection) {
  const docRef = await addDoc(collection(db, "inspections"), {
    ...inspection,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateInspection(id, data) {
  await updateDoc(doc(db, "inspections", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteInspection(id) {
  await deleteDoc(doc(db, "inspections", id));
}

export async function getInspectionById(inspectionId) {
  const snap = await getDoc(doc(db, "inspections", inspectionId));
  return mapDoc(snap);
}

/* -------------------- Inspection Violations -------------------- */
export async function addInspectionViolations(inspectionId, violations) {
  const batchWrites = violations.map((v) =>
    addDoc(collection(db, "inspectionViolations"), {
      ...v,
      inspectionId,
      createdAt: serverTimestamp(),
    })
  );
  await Promise.all(batchWrites);
}

/* -------------------- Penalties -------------------- */
export async function getPenaltiesByStallId(stallId) {
  const q = query(collection(db, "penalties"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  return mapDocs(snap);
}

export async function addPenalty(penalty) {
  const docRef = await addDoc(collection(db, "penalties"), {
    ...penalty,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/* -------------------- Scheduled Inspections -------------------- */
export async function getScheduledInspectionsByStallId(stallId) {
  const q = query(collection(db, "scheduledInspections"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  return mapDocs(snap);
}

export async function addScheduledInspection(sched) {
  const docRef = await addDoc(collection(db, "scheduledInspections"), {
    ...sched,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateScheduledInspection(id, data) {
  await updateDoc(doc(db, "scheduledInspections", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteScheduledInspection(id) {
  await deleteDoc(doc(db, "scheduledInspections", id));
}

/* =========================================================
   Vendor Mgmt + Ordering + Account: menu/rentals/orders/users
   ========================================================= */

/* -------------------- Menu Items (by Stall ID) -------------------- */
export async function getMenuItemsByStallId(stallId) {
  const q = query(collection(db, "menuItems"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  return mapDocs(snap);
}

/* -------------------- Menu Items (by Stall Name optional) -------------------- */
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

/**
 * NOTE: this is the single canonical addMenuItem now (duplicate removed).
 */
export async function addMenuItem(item) {
  const ref = await addDoc(collection(db, "menuItems"), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * MERGED behavior:
 * - sets updatedAt (from earlier version)
 * - returns true (from later version)
 */
export async function updateMenuItem(id, patch) {
  await updateDoc(doc(db, "menuItems", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  return true;
}

/**
 * MERGED behavior:
 * - deletes doc
 * - returns true (safe for callers)
 */
export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, "menuItems", id));
  return true;
}

/* -------------------- Rental Agreements (by Stall ID) -------------------- */
export async function getRentalAgreementsByStallId(stallId) {
  const q = query(collection(db, "rentalAgreements"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  return mapDocs(snap);
}

/* -------------------- Rental Agreements (by Stall Name optional) -------------------- */
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

/**
 * NOTE: single canonical addRentalAgreement now (duplicate removed).
 */
export async function addRentalAgreement(r) {
  const ref = await addDoc(collection(db, "rentalAgreements"), {
    ...r,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Keep both styles because your codebase might call either:
 * - updateRentalAgreement(id, data)   (docId-based)
 * - updateRentalAgreementByDocId(docId, patch)
 */
export async function updateRentalAgreement(id, data) {
  await updateDoc(doc(db, "rentalAgreements", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRentalAgreement(id) {
  await deleteDoc(doc(db, "rentalAgreements", id));
}

export async function updateRentalAgreementByDocId(docId, patch) {
  await updateDoc(doc(db, "rentalAgreements", docId), patch);
  return true;
}

export async function deleteRentalAgreementByDocId(docId) {
  await deleteDoc(doc(db, "rentalAgreements", docId));
  return true;
}

/* -------------------- Orders -------------------- */
/**
 * orderDoc MUST contain:
 * - id (string)  (we use this as Firestore doc id)
 * - customerKey (string)  e.g. "c:c123" OR "d:dev_xxx"
 * - stallId (string) e.g. "s1"
 */
export async function upsertOrder(orderDoc) {
  const id = orderDoc.id || orderDoc.orderId || orderDoc.orderNo;
  if (!id) throw new Error("upsertOrder: missing order id");

  await setDoc(
    doc(db, "orders", id),
    {
      ...orderDoc,
      updatedAt: serverTimestamp(),
      createdAt: orderDoc.createdAt ? orderDoc.createdAt : serverTimestamp(),
    },
    { merge: true }
  );

  return id;
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getOrdersByCustomerKey(customerKey) {
  const q = query(collection(db, "orders"), where("customerKey", "==", customerKey));
  const snap = await getDocs(q);
  const out = mapDocs(snap);

  // sort newest first (prefer createdDate if provided)
  out.sort((a, b) => {
    const da = new Date(a.createdDate || toISO(a.createdAt) || 0).getTime();
    const dbb = new Date(b.createdDate || toISO(b.createdAt) || 0).getTime();
    return dbb - da;
  });

  return out;
}

export function listenOrdersByCustomerKey(customerKey, callback) {
  const q = query(collection(db, "orders"), where("customerKey", "==", customerKey));
  return onSnapshot(q, (snap) => {
    const out = mapDocs(snap);
    out.sort((a, b) => {
      const da = new Date(a.createdDate || toISO(a.createdAt) || 0).getTime();
      const dbb = new Date(b.createdDate || toISO(b.createdAt) || 0).getTime();
      return dbb - da;
    });
    callback(out);
  });
}

export async function getOrdersByStallId(stallId) {
  const q = query(collection(db, "orders"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  const out = mapDocs(snap);

  out.sort((a, b) => {
    const da = new Date(a.createdDate || toISO(a.createdAt) || 0).getTime();
    const dbb = new Date(b.createdDate || toISO(b.createdAt) || 0).getTime();
    return dbb - da;
  });

  return out;
}

export function listenOrdersByStallId(stallId, callback) {
  const q = query(collection(db, "orders"), where("stallId", "==", stallId));
  return onSnapshot(q, (snap) => {
    const out = mapDocs(snap);
    out.sort((a, b) => {
      const da = new Date(a.createdDate || toISO(a.createdAt) || 0).getTime();
      const dbb = new Date(b.createdDate || toISO(b.createdAt) || 0).getTime();
      return dbb - da;
    });
    callback(out);
  });
}

/* ---------------------------
   ORDERS (Vendor display builder)
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
  const m = String(orderId || "").match(/\d+/);
  return m ? m[0] : String(orderId || "-");
}

async function getDocsByInQuery(colName, field, values) {
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
  const qOrders = query(collection(db, "orders"), where("stallId", "==", stallId));
  const ordersSnap = await getDocs(qOrders);
  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  orders.sort((a, b) => new Date(b.createdDateTime || 0) - new Date(a.createdDateTime || 0));
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);

  const items = await getDocsByInQuery("orderItems", "orderId", orderIds);
  const pays = await getDocsByInQuery("payments", "orderId", orderIds);

  const menuItemIds = [...new Set(items.map((it) => it.menuItemId).filter(Boolean))];
  let menuMap = {};
  for (let i = 0; i < menuItemIds.length; i += 10) {
    const chunk = menuItemIds.slice(i, i + 10);
    const snaps = await Promise.all(
      chunk.map(async (mid) => {
        const ref = doc(db, "menuItems", mid);
        const s = await getDoc(ref);
        return s.exists() ? { id: s.id, ...s.data() } : null;
      })
    );
    snaps.filter(Boolean).forEach((mi) => (menuMap[mi.id] = mi));
  }

  const itemsByOrder = {};
  for (const it of items) {
    const oid = it.orderId;
    if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
    itemsByOrder[oid].push(it);
  }

  const payByOrder = {};
  for (const p of pays) {
    if (!payByOrder[p.orderId]) payByOrder[p.orderId] = p;
  }

  return orders.map((o) => {
    const oi = (itemsByOrder[o.id] || []).slice().sort((a, b) => (b.lineTotal || 0) - (a.lineTotal || 0));
    const first = oi[0];

    const menu = first ? menuMap[first.menuItemId] : null;

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

/* -------------------- Users (Account system) -------------------- */
export async function getUserById(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return mapDoc(snap);
}

export async function getUserByUsernameLower(usernameLower) {
  const q = query(
    collection(db, "users"),
    where("usernameLower", "==", (usernameLower || "").toLowerCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.docs.length ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
}

export async function getUserByCredential(value, role) {
  const v = (value || "").trim();
  if (!v) return null;

  const vLower = v.toLowerCase();
  const col = collection(db, "users");

  // Try usernameLower
  {
    const q1 = query(col, where("role", "==", role), where("usernameLower", "==", vLower), limit(1));
    const s1 = await getDocs(q1);
    if (s1.docs.length) return { id: s1.docs[0].id, ...s1.docs[0].data() };
  }

  // Try emailLower
  if (v.includes("@")) {
    const q2 = query(col, where("role", "==", role), where("emailLower", "==", vLower), limit(1));
    const s2 = await getDocs(q2);
    if (s2.docs.length) return { id: s2.docs[0].id, ...s2.docs[0].data() };
  }

  // Try phone (stored as string)
  {
    const q3 = query(col, where("role", "==", role), where("phone", "==", v), limit(1));
    const s3 = await getDocs(q3);
    if (s3.docs.length) return { id: s3.docs[0].id, ...s3.docs[0].data() };
  }

  return null;
}

export async function getNeaUser(neaId, usernameOrEmail) {
  const snap = await getDoc(doc(db, "users", neaId));
  if (!snap.exists()) return null;

  const u = { id: snap.id, ...snap.data() };
  if (u.role !== "NEA") return null;

  const want = (usernameOrEmail || "").toLowerCase().trim();
  const have = (u.usernameLower || (u.username || "").toLowerCase()).trim();

  return want && have === want ? u : null;
}

export async function createUser(user) {
  if (!user?.id) throw new Error("createUser: missing user.id");

  const usernameLower = (user.username || "").toLowerCase();
  const emailLower = (user.email || "").toLowerCase();

  await setDoc(
    doc(db, "users", user.id),
    {
      ...user,
      usernameLower,
      emailLower,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return user.id;
}

export async function updateUserPassword(userId, newPassword) {
  await updateDoc(doc(db, "users", userId), {
    password: newPassword,
    updatedAt: serverTimestamp(),
  });
}

/* -------------------- Password Resets (OTP) -------------------- */
export async function createPasswordReset(resetDoc) {
  const docRef = await addDoc(collection(db, "passwordResets"), {
    ...resetDoc,
    used: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPasswordResetById(resetId) {
  const snap = await getDoc(doc(db, "passwordResets", resetId));
  return mapDoc(snap);
}

export async function markPasswordResetUsed(resetId) {
  await updateDoc(doc(db, "passwordResets", resetId), {
    used: true,
    usedAt: serverTimestamp(),
  });
}
