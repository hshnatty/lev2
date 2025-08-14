// -------------------- Firebase Setup --------------------
const firebaseConfig = {
    apiKey: "AIzaSyArgnPP7ZPdO86qT1wm7wqw_qS_IhNW1qk",
    authDomain: "lv1w-29520.firebaseapp.com",
    projectId: "lv1w-29520",
    storageBucket: "lv1w-29520.firebasestorage.app",
    messagingSenderId: "574419777057",
    appId: "1:574419777057:web:47db3d4ef8de155d269560",
    measurementId: "G-1QXRLXB33N"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_UID = "nMf919ubZIRdFHPOxuJcrL54i7F2"; // <-- Replace with your actual UID

// -------------------- Auth Check --------------------
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.uid !== ADMIN_UID) {
            alert("Access denied. Admin only.");
            window.location.href = "index.html";
        } else {
            loadPosts();
        }
    } else {
        window.location.href = "index.html";
    }
});

// -------------------- Logout --------------------
function logout() {
    auth.signOut().then(() => window.location.href = "index.html");
}

// -------------------- Load Posts --------------------
function loadPosts() {
    db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        const tbody = document.getElementById("posts-body");
        tbody.innerHTML = "";

        snapshot.forEach(doc => {
            const post = doc.data();
            const tr = document.createElement("tr");

            // User
            const tdUser = document.createElement("td");
            tdUser.textContent = post.userName;
            tr.appendChild(tdUser);

            // Content
            const tdContent = document.createElement("td");
            tdContent.textContent = post.content;
            tr.appendChild(tdContent);

            // Timestamp
            const tdTime = document.createElement("td");
            tdTime.textContent = post.timestamp?.seconds
                ? new Date(post.timestamp.seconds * 1000).toLocaleString()
                : "Unknown";
            tr.appendChild(tdTime);

            // Pinned status
            const tdPinned = document.createElement("td");
            tdPinned.textContent = post.pinned ? "✅" : "❌";
            tr.appendChild(tdPinned);

            // Actions
            const tdActions = document.createElement("td");

            // Delete button
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.onclick = () => deletePost(doc.id);
            tdActions.appendChild(delBtn);

            // Pin/Unpin button
            const pinBtn = document.createElement("button");
            pinBtn.textContent = post.pinned ? "Unpin" : "Pin";
            pinBtn.style.marginLeft = "5px";
            pinBtn.onclick = () => togglePin(doc.id, !post.pinned);
            tdActions.appendChild(pinBtn);

            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });
    });
}

// -------------------- Delete Post --------------------
function deletePost(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        db.collection("posts").doc(postId).delete().catch(err => console.error("Error deleting:", err));
    }
}

// -------------------- Pin / Unpin Post --------------------
function togglePin(postId, status) {
    db.collection("posts").doc(postId).update({ pinned: status })
        .catch(err => console.error("Error updating pin status:", err));
}
