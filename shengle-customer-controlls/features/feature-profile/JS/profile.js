import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, getDocs } 
    from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const phoneEl = document.getElementById("phone");
const addressEl = document.getElementById("address");
const joinedEl = document.getElementById("joined");
const avatarEl = document.getElementById("avatar");
const logoutBtn = document.getElementById("logoutBtn");
const notifCountEl = document.getElementById("notifCount");
const notifListEl = document.getElementById("notifList");
const notifSummaryEl = document.getElementById("notifSummary");
const feedbackBtn = document.getElementById("feedbackBtn");
const complaintBtn = document.getElementById("complaintBtn");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../../../user-account-management-Joseph/HTML/account.html';
        return;
    }

    emailEl.textContent = user.email;
    avatarEl.textContent = user.email[0].toUpperCase();

    // load notifications for this user
    loadNotifications(user.uid).catch((e) => console.warn("Unable to load notifications", e));

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
        const data = snap.data();
        nameEl.textContent = data.name || "User";
        phoneEl.textContent = data.phone || "-";
        addressEl.textContent = data.address || "-";

        if (data.createdAt?.toDate) {
            joinedEl.textContent = data.createdAt.toDate().toDateString();
        }
    } else {
        nameEl.textContent = "User";
    }
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = '../../../user-account-management-Joseph/HTML/account.html';
});

// action map for event-key routing
const actionMap = {
    'feedback': '../feature-feedback/feedback.html',
    'complaint': '../feature-compliant/compliant.html'
};

// direct click handlers for buttons
if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
        console.log('Feedback button clicked');
        document.getElementById('feedbackModal').style.display = 'flex';
    });
}

if (complaintBtn) {
    complaintBtn.addEventListener('click', () => {
        console.log('Complaint button clicked');
        document.getElementById('complaintModal').style.display = 'flex';
    });
}

// close modal handlers
document.getElementById('closeFeedbackBtn').addEventListener('click', () => {
    document.getElementById('feedbackModal').style.display = 'none';
});

document.getElementById('closeComplaintBtn').addEventListener('click', () => {
    document.getElementById('complaintModal').style.display = 'none';
});

// submit handlers
document.getElementById('submitFeedbackBtn').addEventListener('click', () => {
    const rating = document.querySelector('input[name="rating"]:checked')?.value || '';
    const text = document.getElementById('feedbackText').value;
    if (text.trim()) {
        console.log('Feedback submitted:', { rating, text });
        alert('Thank you for your feedback!');
        document.getElementById('feedbackModal').style.display = 'none';
        document.getElementById('feedbackText').value = '';
        document.querySelector('input[name="rating"]:checked').checked = false;
    } else {
        alert('Please enter feedback');
    }
});

document.getElementById('submitComplaintBtn').addEventListener('click', () => {
    const store = document.getElementById('complaintStore').value;
    const title = document.getElementById('complaintTitle').value;
    const details = document.getElementById('complaintDetails').value;
    if (store && title.trim() && details.trim()) {
        console.log('Complaint submitted:', { store, title, details });
        alert('Thank you for your complaint. We will review it shortly.');
        document.getElementById('complaintModal').style.display = 'none';
        document.getElementById('complaintStore').value = '';
        document.getElementById('complaintTitle').value = '';
        document.getElementById('complaintDetails').value = '';
    } else {
        alert('Please fill all fields');
    }
});

async function loadNotifications(uid) {
    try {
        // try to read from a top-level 'notifications' collection where userId == uid
        const notifsCol = collection(db, 'notifications');
        let q;
        try {
            q = query(notifsCol, where('userId', '==', uid), orderBy('createdAt', 'desc'));
        } catch (e) {
            // fallback if there is no timestamp field
            q = query(notifsCol, where('userId', '==', uid));
        }

        const snap = await getDocs(q);
        const items = [];

        snap.forEach(docSnap => {
            const d = docSnap.data();
            items.push({ id: docSnap.id, ...d });
        });

        if (items.length === 0) {
            notifSummaryEl.textContent = 'No new notifications';
            notifCountEl.style.display = 'none';
            notifListEl.style.display = 'none';
            return;
        }

        notifSummaryEl.textContent = `${items.length} new notification${items.length>1? 's':''}`;
        notifCountEl.textContent = String(items.length);
        notifCountEl.style.display = 'inline-block';
        notifListEl.innerHTML = '';
        notifListEl.style.display = 'block';

        items.forEach(it => {
            const li = document.createElement('li');
            li.style.padding = '8px 6px';
            li.style.borderBottom = '1px solid #eee';
            li.textContent = it.title || it.message || 'Notification';
            notifListEl.appendChild(li);
        });

    } catch (err) {
        console.error('Error loading notifications', err);
        notifSummaryEl.textContent = 'Unable to load notifications';
    }
}
