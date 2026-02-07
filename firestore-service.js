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
   NEW (for Vendor Mgmt + Ordering + Account): menu/rentals/orders/users
   ========================================================= */

/* -------------------- Menu Items -------------------- */
export async function getMenuItemsByStallId(stallId) {
  const q = query(collection(db, "menuItems"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  return mapDocs(snap);
}

export async function addMenuItem(item) {
  const docRef = await addDoc(collection(db, "menuItems"), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMenuItem(id, data) {
  await updateDoc(doc(db, "menuItems", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, "menuItems", id));
}

/* -------------------- Rental Agreements -------------------- */
export async function getRentalAgreementsByStallId(stallId) {
  const q = query(collection(db, "rentalAgreements"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  return mapDocs(snap);
}

export async function addRentalAgreement(agreement) {
  const docRef = await addDoc(collection(db, "rentalAgreements"), {
    ...agreement,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateRentalAgreement(id, data) {
  await updateDoc(doc(db, "rentalAgreements", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRentalAgreement(id) {
  await deleteDoc(doc(db, "rentalAgreements", id));
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
