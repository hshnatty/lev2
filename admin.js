import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA5ZatulVEicBeWqNciKtjd4fcQeAvohmY",
    authDomain: "natty-caa61.firebaseapp.com",
    projectId: "natty-caa61",
    storageBucket: "natty-caa61.firebasestorage.app",
    messagingSenderId: "822585320498",
    appId: "1:822585320498:web:01f76915ec4735bb6d082b",
    measurementId: "G-3RVDQ36T50"
};

const ADMIN_UID = "nMf919ubZIRdFHPOxuJcrL54i7F2"; // Replace with your Firebase UID

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Auth check
onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        alert("Access denied");
        window.location.href = "login.html";
    } else {
        loadPosts();
    }
});

// Load posts into table
function loadPosts() {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("pinned", "desc"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        const table = document.getElementById("posts-table");
        table.innerHTML = "";

        snapshot.forEach(docSnap => {
            const post = docSnap.data();
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${post.userName || "Anonymous"}</td>
                <td>${post.content || ""}</td>
                <td>${post.pinned ? "Yes" : "No"}</td>
                <td>
                    <button class="pin-btn">${post.pinned ? "Unpin" : "Pin"}</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            // Pin/Unpin
            tr.querySelector(".pin-btn").addEventListener("click", async () => {
                await updateDoc(doc(db, "posts", docSnap.id), { pinned: !post.pinned });
            });

            // Delete
            tr.querySelector(".delete-btn").addEventListener("click", async () => {
                if (confirm("Delete this post?")) {
                    await deleteDoc(doc(db, "posts", docSnap.id));
                }
            });

            table.appendChild(tr);
        });
    });
}
