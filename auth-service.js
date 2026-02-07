//Joseph s10272886
// auth-service.js (MODULE)
// Firebase Auth helpers + user profile in Firestore
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Save session in localStorage so other pages (vendor/ordering) can read it
function saveSession(userProfile) {
  localStorage.setItem("hawkerSessionUser_v1", JSON.stringify(userProfile));
}
function clearSession() {
  localStorage.removeItem("hawkerSessionUser_v1");
}

// Create user profile doc in Firestore: users/{uid}
export async function registerUser({ name, email, password, role = "customer", stallId = null }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (name) await updateProfile(cred.user, { displayName: name });

  const profile = {
    uid: cred.user.uid,
    name: name || cred.user.displayName || "",
    email: cred.user.email,
    role,       // "customer" | "vendor" | "nea"
    stallId,    // optional for vendor accounts
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", cred.user.uid), profile, { merge: true });
  saveSession(profile);

  return profile;
}

// Login and pull profile from Firestore
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, "users", cred.user.uid));
  let profile = null;

  if (snap.exists()) profile = snap.data();
  else {
    // fallback profile if Firestore doc doesn't exist yet
    profile = {
      uid: cred.user.uid,
      name: cred.user.displayName || "",
      email: cred.user.email,
      role: "customer",
      stallId: null,
    };
    await setDoc(doc(db, "users", cred.user.uid), profile, { merge: true });
  }

  saveSession(profile);
  return profile;
}

export async function logoutUser() {
  await signOut(auth);
  clearSession();
}

export function watchAuth(cb) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      clearSession();
      cb(null);
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists()
      ? snap.data()
      : { uid: user.uid, name: user.displayName || "", email: user.email, role: "customer", stallId: null };

    saveSession(profile);
    cb(profile);
  });
}
