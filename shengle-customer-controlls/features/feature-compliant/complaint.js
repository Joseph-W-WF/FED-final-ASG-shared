import { db } from "./firebase-init.js";
import { collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

submitBtn.addEventListener("click", async () => {
    const store = document.getElementById("store").value;
    const title = document.getElementById("title").value;
    const details = document.getElementById("details").value;

    if (!store || !title || !details) {
        alert("Please fill in all fields");
        return;
    }

    try {
        await addDoc(collection(db, "complaints"), {
            store,
            title,
            details,
            status: "Pending",
            createdAt: serverTimestamp()
        });

        alert("Complaint submitted!");
        clearForm();
    } catch (error) {
        console.error(error);
        alert("Error submitting complaint");
    }
});

cancelBtn.addEventListener("click", clearForm);

function clearForm() {
    document.getElementById("store").value = "";
    document.getElementById("title").value = "";
    document.getElementById("details").value = "";
}
