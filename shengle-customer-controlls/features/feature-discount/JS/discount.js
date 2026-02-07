import { auth, db } from "../../../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

let currentPoints = 0;

// Load user points from Firebase
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../../../user-account-management-Joseph/HTML/account.html';
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            currentPoints = data.points || 0;
        } else {
            currentPoints = 0;
            // Initialize user document with points
            await setDoc(userRef, { points: 0 }, { merge: true });
        }

        updateUI();
    } catch (err) {
        console.error("Error loading points:", err);
        alert("Unable to load points. Please refresh.");
    }
});

function updateUI() {
    document.getElementById('points').innerText = currentPoints;

    let tierName = 'Silver';
    let progressPercent = (currentPoints / 500) * 100;
    let tierText = `${currentPoints} / 500 points to Gold`;

    if (currentPoints >= 500) {
        tierName = 'Gold';
        progressPercent = Math.min((currentPoints - 500) / 500 * 100, 100);
        tierText = `${currentPoints} / 1000 points to Platinum`;
    }

    if (currentPoints >= 1000) {
        tierName = 'Platinum';
        progressPercent = 100;
        tierText = 'Maximum tier reached';
    }

    document.getElementById('tierName').innerText = tierName;
    document.getElementById('tierText').innerText = tierText;
    document.getElementById('tierProgress').style.width = progressPercent + '%';

    document.querySelectorAll('.redeem-btn').forEach(btn => {
        const cost = parseInt(btn.previousElementSibling.innerText);
        btn.disabled = currentPoints < cost;
    });
}

async function redeem(cost) {
    if (currentPoints >= cost) {
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Not authenticated");
                return;
            }

            currentPoints -= cost;
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { points: currentPoints });

            alert('Reward redeemed! 🎉');
            updateUI();
        } catch (err) {
            console.error("Error redeeming reward:", err);
            alert("Failed to redeem reward. Please try again.");
            updateUI(); // Refresh UI in case of error
        }
    }
}

// Attach redeem function to global scope for onclick handlers
window.redeem = redeem;
