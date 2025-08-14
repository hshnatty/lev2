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

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let userId = null;
let userName = null;

// -------------------- Restore login on reload --------------------
auth.onAuthStateChanged((user) => {
    if (user) {
        userId = user.uid;

        // Check if username exists
        db.collection("users").doc(userId).get().then(doc => {
            if (doc.exists && doc.data().username) {
                userName = doc.data().username;
                document.getElementById("user-name").innerText = `Welcome, ${userName}`;
                toggleVisibility("forum-container");
                toggleVisibility("login-container", false);
                toggleVisibility("username-setup", false);
                loadPosts();
            } else {
                // Show username setup
                toggleVisibility("username-setup", true);
                toggleVisibility("login-container", false);
                toggleVisibility("forum-container", false);
            }
        });
    } else {
        toggleVisibility("login-container");
        toggleVisibility("forum-container", false);
        toggleVisibility("username-setup", false);
    }
});

// -------------------- Login with Google --------------------
function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => console.error("Login Error:", error));
}

// -------------------- Save Username --------------------
function saveUsername() {
    const enteredName = document.getElementById("username-input").value.trim();
    if (!enteredName) return alert("Please enter a username");

    db.collection("users").doc(userId).set({ username: enteredName })
      .then(() => {
          userName = enteredName;
          document.getElementById("user-name").innerText = `Welcome, ${userName}`;
          toggleVisibility("username-setup", false);
          toggleVisibility("forum-container", true);
          loadPosts();
      }).catch(err => console.error("Error saving username:", err));
}

// -------------------- Logout --------------------
function logout() {
    auth.signOut().then(() => {
        toggleVisibility("login-container");
        toggleVisibility("forum-container", false);
        toggleVisibility("username-setup", false);
    }).catch(err => console.error("Logout Error:", err));
}

// -------------------- Submit a Post --------------------
function submitPost() {
    const postText = document.getElementById("post-text").value.trim();
    if (!postText) return;

    db.collection("posts").add({
        userId,
        userName,
        content: postText,
        pinned: false, // default not pinned
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById("post-text").value = "";
        loadPosts();
    });
}

// -------------------- Submit a Reply --------------------
function submitReply(postId) {
    const replyInput = document.getElementById(`reply-input-${postId}`);
    const replyText = replyInput.value.trim();
    if (!replyText) return;

    db.collection("posts").doc(postId).collection("replies").add({
        userId,
        userName,
        content: replyText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        replyInput.value = "";
        loadPosts();
    });
}

// -------------------- Load Posts --------------------
function loadPosts() {
    const postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = ""; // Clear once

    // Get all posts, pinned first
    db.collection("posts")
      .orderBy("pinned", "desc")
      .orderBy("timestamp", "desc")
      .get()
      .then(async (querySnapshot) => {
        for (const doc of querySnapshot.docs) {
            const postData = doc.data();
            const postId = doc.id;

            const postElement = document.createElement("div");
            postElement.className = "post";
            postElement.innerHTML = `
                <h3>${postData.userName}</h3>
                <p>${postData.content}</p>
                ${postData.pinned ? "<span class='pinned-label'>📌 Pinned</span>" : ""}
                <small>${postData.timestamp ? new Date(postData.timestamp.seconds * 1000).toLocaleString() : "Unknown"}</small>
                <div>
                    <input type="text" id="reply-input-${postId}" placeholder="Write a reply..." />
                    <button onclick="submitReply('${postId}')">Reply</button>
                </div>
                <div id="replies-${postId}" class="replies"></div>
                <hr>
            `;
            postsDiv.appendChild(postElement);

            // Load replies
            const repliesSnap = await db.collection("posts").doc(postId).collection("replies").orderBy("timestamp", "asc").get();
            const repliesDiv = document.getElementById(`replies-${postId}`);
            repliesSnap.forEach(replyDoc => {
                const replyData = replyDoc.data();
                const replyElement = document.createElement("div");
                replyElement.style.marginLeft = "20px";
                replyElement.innerHTML = `
                    <strong>${replyData.userName}:</strong> ${replyData.content}
                    <br><small>${replyData.timestamp ? new Date(replyData.timestamp.seconds * 1000).toLocaleString() : "Unknown"}</small>
                `;
                repliesDiv.appendChild(replyElement);
            });
        }
    });
}

// -------------------- Toggle Visibility --------------------
function toggleVisibility(id, show = true) {
    document.getElementById(id).style.display = show ? "block" : "none";
}
