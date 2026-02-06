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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    where("stallId", "==", stallId),
    orderBy("conductedDate", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  const q = query(collection(db, "penalties"), where("stallId", "==", stallId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
