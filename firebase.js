// JS/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0PWNNk7VhS_-efoz7rfgug6xz4x3gA5M",
  authDomain: "fed-final.firebaseapp.com",
  projectId: "fed-final",
  storageBucket: "fed-final.firebasestorage.app",
  messagingSenderId: "333330614348",
  appId: "1:333330614348:web:9afa252c591bcd014a4ce9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
