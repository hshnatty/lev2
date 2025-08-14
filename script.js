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
const ADMIN_UID = "nMf919ubZIRdFHPOxuJcrL54i7F2"; // <-- Replace with your Firebase UID

// -------------------- Auth State --------------------
auth.onAuthStateChanged((user) => {
    if (user) {
        userId = user.uid;
        checkUsername();
    } else {
        toggleVisibility("login-container");
        toggleVisibility("forum-container", false);
        toggleVisibility("username-setup", false);
    }
});

// -------------------- Login --------------------
function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error("Login Error: ", error);
    });
}

// -------------------- Logout --------------------
function logout() {
    auth.signOut().then(() => {
        toggleVisibility("login-container");
        toggleVisibility("forum-container", false);
        toggleVisibility("username-setup", false);
    }).catch((error) => console.error("Logout Error: ", error));
}

// -------------------- Username --------------------
function checkUsername() {
    db.collection("users").doc(userId).get().then(doc => {
        if (doc.exists && doc.data().username) {
            userName = doc.data().username;
            document.getElementById("user-name").innerText = `Welcome, ${userName}`;
            toggleVisibility("forum-container");
            toggleVisibility("login-container", false);
            toggleVisibility("username-setup", false);
            loadPosts();
        } else {
            toggleVisibility("username-setup", true);
            toggleVisibility("login-container", false);
            toggleVisibility("forum-container", false);
        }
    });
}

function saveUsername() {
    const enteredName = document.getElementById("username-input").value.trim();
    if (!enteredName) {
        alert("Please enter a username");
        return;
    }

    db.collection("users").doc(userId).set({ username: enteredName })
    .then(() => {
        userName = enteredName;
        document.getElementById("user-name").innerText = `Welcome, ${userName}`;
        toggleVisibility("username-setup", false);
        toggleVisibility("forum-container", true);
        loadPosts();
    }).catch(err => console.error("Error saving username:", err));
}

// -------------------- Submit Post --------------------
function submitPost() {
    const postText = document.getElementById("post-text").value.trim();
    if (postText === "") return;

    db.collection("posts").add({
        userId,
        userName,
        content: postText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById("post-text").value = "";
        loadPosts();
    }).catch(err => console.error("Error posting:", err));
}

// -------------------- Submit Reply --------------------
function submitReply(postId) {
    const replyInput = document.getElementById(`reply-input-${postId}`);
    const replyText = replyInput.value.trim();
    if (replyText === "") return;

    db.collection("posts").doc(postId).collection("replies").add({
        userId,
        userName,
        content: replyText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        replyInput.value = "";
        loadPosts();
    }).catch(err => console.error("Error replying:", err));
}

// -------------------- Delete Post (Admin) --------------------
function deletePost(postId) {
    if (userId !== ADMIN_UID) return;
    db.collection("posts").doc(postId).delete()
    .then(() => loadPosts())
    .catch(err => console.error("Error deleting post:", err));
}

// -------------------- Load Posts --------------------
async function loadPosts() {
    const postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = "";

    const querySnapshot = await db.collection("posts").orderBy("timestamp", "desc").get();
    for (const doc of querySnapshot.docs) {
        const postData = doc.data();
        const postId = doc.id;

        // Post container
        const postElement = document.createElement("div");
        postElement.style.border = "1px solid #ccc";
        postElement.style.padding = "10px";
        postElement.style.marginBottom = "10px";
        postElement.style.backgroundColor = "#fff";

        // Post header
        const h3 = document.createElement("h3");
        h3.innerText = postData.userName;
        postElement.appendChild(h3);

        // Post content
        const p = document.createElement("p");
        p.innerText = postData.content;
        postElement.appendChild(p);

        // Timestamp
        const small = document.createElement("small");
        const date = postData.timestamp?.seconds 
            ? new Date(postData.timestamp.seconds * 1000).toLocaleString() 
            : "Unknown";
        small.innerText = `Posted on ${date}`;
        postElement.appendChild(small);

        // Reply input
        const replyDiv = document.createElement("div");
        replyDiv.style.marginTop = "10px";
        const replyInput = document.createElement("input");
        replyInput.type = "text";
        replyInput.id = `reply-input-${postId}`;
        replyInput.placeholder = "Write a reply...";
        const replyBtn = document.createElement("button");
        replyBtn.innerText = "Reply";
        replyBtn.onclick = () => submitReply(postId);
        replyDiv.appendChild(replyInput);
        replyDiv.appendChild(replyBtn);
        postElement.appendChild(replyDiv);

        // Replies container
        const repliesContainer = document.createElement("div");
        repliesContainer.id = `replies-${postId}`;
        repliesContainer.style.marginTop = "10px";
        postElement.appendChild(repliesContainer);

        // Admin delete button
        if (userId === ADMIN_UID) {
            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "Delete Post";
            deleteBtn.style.marginTop = "10px";
            deleteBtn.onclick = () => deletePost(postId);
            postElement.appendChild(deleteBtn);
        }

        postsDiv.appendChild(postElement);

        // Load replies
        const repliesSnap = await db.collection("posts").doc(postId).collection("replies").orderBy("timestamp", "asc").get();
        repliesSnap.forEach(replyDoc => {
            const replyData = replyDoc.data();
            const replyEl = document.createElement("div");
            replyEl.style.marginLeft = "20px";
            replyEl.innerHTML = `<strong>${replyData.userName}:</strong> ${replyData.content}<br>
                                 <small>${replyData.timestamp?.seconds ? new Date(replyData.timestamp.seconds * 1000).toLocaleString() : "Unknown"}</small>`;
            repliesContainer.appendChild(replyEl);
        });
    }
}

// -------------------- Toggle Visibility --------------------
function toggleVisibility(id, show = true) {
    document.getElementById(id).style.display = show ? "block" : "none";
}
