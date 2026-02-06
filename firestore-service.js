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
