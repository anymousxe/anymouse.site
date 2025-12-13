import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyDsoQrx2jyRQzwJ3XhB3biznqQLdmJtEKY",
    authDomain: "mouseland-istuff.firebaseapp.com",
    projectId: "mouseland-istuff",
    storageBucket: "mouseland-istuff.firebasestorage.app",
    messagingSenderId: "459629527486",
    appId: "1:459629527486:web:0c038f1fad27ef288879ef",
    measurementId: "G-HX18GW1CVG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- STATE ---
let currentUser = null;
let selectedModel = 'banana'; // 'banana' or 'sora'
let soraDuration = 10;
let guestCredits = { banana: 2, sora: 2 };
const ADMIN_EMAIL = "anymousxe.info@gmail.com";

// --- DOM ELEMENTS ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const userPfp = document.getElementById('user-pfp');
const creditDisplay = document.getElementById('credit-display');
const soraOptions = document.getElementById('sora-options');
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt-input');
const galleryGrid = document.getElementById('gallery-grid');
const root = document.documentElement;

// --- AUTHENTICATION ---
const provider = new GoogleAuthProvider();

loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch((error) => console.error(error));
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
    location.reload();
});

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userPfp.src = user.photoURL;
        creditDisplay.innerText = "Unlimited (Logged In)";
        
        loadUserQueue(user.uid);

        // Check for Admin
        if (user.email === ADMIN_EMAIL) {
            setupAdminPanel();
        }
    } else {
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        loadGuestCredits();
        // Clear gallery for privacy/reset
        galleryGrid.innerHTML = '<div class="empty-state">Log in to see history or start generating as guest.</div>';
    }
});

function loadGuestCredits() {
    const saved = localStorage.getItem('guestCredits');
    if (saved) {
        guestCredits = JSON.parse(saved);
    }
    updateCreditDisplay();
}

function updateCreditDisplay() {
    if (!currentUser) {
        const count = selectedModel === 'banana' ? guestCredits.banana : guestCredits.sora;
        creditDisplay.innerText = `Guest: ${count} left`;
    }
}

// --- UI LOGIC ---
window.selectModel = (model) => {
    selectedModel = model;
    
    // Style update
    document.getElementById('model-banana').classList.remove('active');
    document.getElementById('model-sora').classList.remove('active');
    document.getElementById(`model-${model}`).classList.add('active');

    // Color Theme update
    if(model === 'banana') {
        root.style.setProperty('--primary', '#ffe135');
        soraOptions.classList.add('hidden');
    } else {
        root.style.setProperty('--primary', '#00f2ff');
        soraOptions.classList.remove('hidden');
    }

    updateCreditDisplay();
};

window.setDuration = (seconds) => {
    soraDuration = seconds;
    const btns = document.querySelectorAll('.dur-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
};

// --- GENERATION LOGIC ---
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return showToast("Please enter a prompt!");

    // Check Credits for Guest
    if (!currentUser) {
        if (guestCredits[selectedModel] <= 0) {
            return showToast("Out of credits! Log in for more.");
        }
        guestCredits[selectedModel]--;
        localStorage.setItem('guestCredits', JSON.stringify(guestCredits));
        updateCreditDisplay();
    }

    // Prepare Data
    const reqData = {
        prompt: prompt,
        model: selectedModel === 'banana' ? "Nano Banana Pro" : "Sora 2",
        duration: selectedModel === 'sora' ? soraDuration : null,
        userId: currentUser ? currentUser.uid : "guest",
        userEmail: currentUser ? currentUser.email : "Guest User",
        userName: currentUser ? currentUser.displayName : "Guest",
        status: "pending",
        resultUrl: "",
        timestamp: serverTimestamp()
    };

    try {
        // Add to collection 'ai_studio_requests'
        await addDoc(collection(db, "ai_studio_requests"), reqData);
        promptInput.value = "";
        showToast("Request sent to queue!");
        if(!currentUser) addGuestCard(reqData); // Manually add visual for guest
    } catch (e) {
        console.error(e);
        showToast("Error sending request.");
    }
});

// --- LISTENER (USER SIDE) ---
function loadUserQueue(uid) {
    const q = query(
        collection(db, "ai_studio_requests"), 
        where("userId", "==", uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        galleryGrid.innerHTML = "";
        snapshot.forEach((doc) => {
            renderCard(doc.data(), doc.id);
        });
        if(snapshot.empty) galleryGrid.innerHTML = '<div class="empty-state">No generations yet.</div>';
    });
}

// Visual only for guest (since guests can't query db without auth usually, keeping it simple)
function addGuestCard(data) {
    // Just a temporary visual since guests don't have a persistent ID in this simple setup
    // For a real app, you'd use a session ID. 
    // This allows the guest to see "Pending" instantly.
    renderCard(data, "temp-id"); 
}

function renderCard(data, id) {
    const isVideo = data.model === "Sora 2";
    let mediaContent = "";
    
    if (data.status === "pending") {
        mediaContent = `<div style="height:200px; display:flex; align-items:center; justify-content:center; color:#555;">
                            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                        </div>`;
    } else {
        if(isVideo) {
            mediaContent = `<video src="${data.resultUrl}" controls></video>`;
        } else {
            mediaContent = `<img src="${data.resultUrl}" alt="Result">`;
        }
    }

    const html = `
    <div class="creation-card" id="${id}">
        ${mediaContent}
        <div class="creation-meta">
            <span class="status-badge status-${data.status}">${data.status}</span>
            <p style="font-size:0.9rem; color:#aaa; margin-top:5px;">${data.prompt}</p>
            <p style="font-size:0.7rem; color:#555; margin-top:5px;">${data.model} ${data.duration ? `(${data.duration}s)` : ''}</p>
        </div>
    </div>
    `;
    
    // Append instead of overwrite for guests, overwrite for logged in (handled by onSnapshot)
    if(currentUser) {
        galleryGrid.innerHTML += html;
    } else {
        galleryGrid.insertAdjacentHTML('afterbegin', html);
    }
}

// --- ADMIN LOGIC ---
function setupAdminPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');
    const adminQueue = document.getElementById('admin-queue');

    // Listen to ALL pending requests
    const q = query(
        collection(db, "ai_studio_requests"), 
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        adminQueue.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Only show if no result yet (or you can change logic to show all)
            const card = document.createElement('div');
            card.className = "admin-card";
            card.innerHTML = `
                <p><strong style="color:var(--primary)">${data.model}</strong> by <span style="color:#fff">${data.userName}</span></p>
                <div class="prompt-text" onclick="navigator.clipboard.writeText('${data.prompt}')">
                    ${data.prompt} <i class="fa-solid fa-copy" style="margin-left:5px"></i>
                </div>
                <p>Status: ${data.status}</p>
                ${data.status === 'pending' ? `
                <input type="text" class="admin-input" id="res-${id}" placeholder="Paste Image/Video URL here...">
                <button class="complete-btn" onclick="fulfillRequest('${id}')">UPLOAD / COMPLETE</button>
                ` : `<p style="color:#00ff88">Completed</p>`}
            `;
            adminQueue.appendChild(card);
        });
    });
}

window.fulfillRequest = async (docId) => {
    const urlInput = document.getElementById(`res-${docId}`).value;
    if (!urlInput) return alert("Need a URL!");

    await updateDoc(doc(db, "ai_studio_requests", docId), {
        status: "completed",
        resultUrl: urlInput
    });
};

window.closeAdmin = () => {
    document.getElementById('admin-panel').classList.add('hidden');
};

function showToast(msg) {
    const t = document.getElementById('toast-container');
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}
