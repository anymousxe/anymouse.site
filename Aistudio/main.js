// Import Firebase (Using 12.6.0 as requested)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

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
const storage = getStorage(app);
const analytics = getAnalytics(app);

// --- STATE ---
let currentUser = null;
let currentModel = 'nano'; // 'nano' or 'sora'
let soraDuration = 10;
const ADMIN_EMAIL = 'anymousxe.info@gmail.com';

// --- DOM ELEMENTS ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const userPfp = document.getElementById('user-pfp');
const creditDisplay = document.getElementById('credit-display');
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt-input');
const galleryGrid = document.getElementById('gallery-grid');
const adminPanel = document.getElementById('admin-panel');
const adminQueue = document.getElementById('admin-queue');

// Model Switchers
document.querySelectorAll('.model-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.model-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currentModel = opt.dataset.model;
        
        const soraOpts = document.getElementById('sora-options');
        if(currentModel === 'sora') {
            soraOpts.classList.remove('hidden');
        } else {
            soraOpts.classList.add('hidden');
        }
    });
});

document.querySelectorAll('.dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        soraDuration = btn.dataset.time;
    });
});

// --- AUTH ---
loginBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => console.error(err));
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Logged In
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userPfp.src = user.photoURL;
        creditDisplay.innerText = "Unlimited Access (Member)";
        
        loadUserHistory(user.uid);

        // CHECK ADMIN
        if(user.email === ADMIN_EMAIL) {
            adminPanel.classList.remove('admin-hidden');
            adminPanel.classList.add('admin-show');
            loadAdminQueue();
        }
    } else {
        // Guest
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        adminPanel.classList.add('admin-hidden');
        updateGuestCreditsUI();
        loadGuestHistory(); // Load local storage history
    }
});

// --- GENERATION LOGIC ---

// Local Storage for Guest Limits
function getGuestUsage() {
    const usage = JSON.parse(localStorage.getItem('ai_studio_usage')) || { nano: 0, sora: 0 };
    return usage;
}

function updateGuestCreditsUI() {
    const usage = getGuestUsage();
    // Logic: 2 of each.
    const nanoLeft = 2 - usage.nano;
    const soraLeft = 2 - usage.sora;
    creditDisplay.innerText = `Guest: ${nanoLeft} imgs | ${soraLeft} vids left`;
}

generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return alert("Bro, type a prompt first.");

    // Limit Check
    if (!currentUser) {
        const usage = getGuestUsage();
        if (currentModel === 'nano' && usage.nano >= 2) return alert("Out of Nano credits! Log in for more.");
        if (currentModel === 'sora' && usage.sora >= 2) return alert("Out of Sora credits! Log in for more.");
        
        // Increment usage
        usage[currentModel]++;
        localStorage.setItem('ai_studio_usage', JSON.stringify(usage));
        updateGuestCreditsUI();
    }

    // UI Feedback
    generateBtn.innerHTML = `QUEUED <i class="fa-solid fa-check"></i>`;
    setTimeout(() => generateBtn.innerHTML = `GENERATE <i class="fa-solid fa-bolt"></i>`, 2000);
    promptInput.value = "";

    // Send to Firestore
    try {
        await addDoc(collection(db, "ai_studio_generations"), {
            userId: currentUser ? currentUser.uid : "guest_device_" + Date.now(),
            userEmail: currentUser ? currentUser.email : "guest",
            userName: currentUser ? currentUser.displayName : "Guest User",
            model: currentModel === 'nano' ? 'Nano Banana Pro' : 'Sora 2',
            duration: currentModel === 'sora' ? soraDuration + 's' : 'N/A',
            prompt: prompt,
            status: 'pending', // Pending Admin Approval/Upload
            resultUrl: null,
            createdAt: serverTimestamp()
        });
        
        // If guest, we need to manually trigger a re-render or add to local list tracker
        if(!currentUser) {
            alert("Request sent to queue! Check back below.");
            // For a real guest system with firestore, we'd need to store the specific doc IDs in localstorage to query them back, 
            // but for simplicity, guests just get the 'Sent' alert. 
            // PRO TIP: Log in to see your history.
        }

    } catch (e) {
        console.error("Error adding doc: ", e);
        alert("Something crashed. Check console.");
    }
});

// --- USER HISTORY (Realtime) ---
function loadUserHistory(uid) {
    const q = query(collection(db, "ai_studio_generations"), where("userId", "==", uid), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        galleryGrid.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            createCard(data, galleryGrid);
        });
    });
}

function loadGuestHistory() {
    // Simple placeholder for guests since they can't query secure DB easily without ID tracking
    galleryGrid.innerHTML = "<p style='color:#666; width:100%; text-align:center;'>Log in to see your history & downloads.</p>";
}

function createCard(data, container) {
    const card = document.createElement('div');
    card.className = 'card';
    
    let downloadHtml = `<span style="color:#666;">Processing...</span>`;
    let statusClass = 'pending';
    
    if (data.status === 'completed' && data.resultUrl) {
        downloadHtml = `<a href="${data.resultUrl}" target="_blank" class="download-btn">DOWNLOAD RESULT</a>`;
        statusClass = 'completed';
    }

    card.innerHTML = `
        <span class="card-status ${statusClass}">${data.status}</span>
        <div style="font-size:0.8rem; color:var(--secondary); margin-bottom:5px;">${data.model} (${data.duration})</div>
        <p class="card-prompt">"${data.prompt}"</p>
        ${downloadHtml}
    `;
    container.appendChild(card);
}

// --- ADMIN DASHBOARD (The "Secret" Sauce) ---
function loadAdminQueue() {
    // Admin sees ALL pending requests
    const q = query(collection(db, "ai_studio_generations"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        adminQueue.innerHTML = "";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${data.userName} (${data.userEmail})</strong>
                    <span style="color:var(--secondary);">${data.model} - ${data.duration}</span>
                </div>
                <p style="background:#222; padding:5px; border-radius:4px; font-size:0.9rem;">
                    ${data.prompt} 
                    <button class="copy-btn" onclick="navigator.clipboard.writeText('${data.prompt.replace(/'/g, "\\'")}')">COPY</button>
                </p>
                
                <div style="margin-top:10px; border-top:1px solid #444; padding-top:10px;">
                    <label style="font-size:0.8rem;">Upload Result:</label>
                    <input type="file" class="upload-input" id="file-${id}">
                    <button class="fulfill-btn" id="btn-${id}">UPLOAD & FULFILL</button>
                </div>
            `;
            
            adminQueue.appendChild(item);
            
            // Bind Upload Logic
            document.getElementById(`btn-${id}`).addEventListener('click', async () => {
                const fileInput = document.getElementById(`file-${id}`);
                if(fileInput.files.length === 0) return alert("Select a file first, boss.");
                
                const file = fileInput.files[0];
                const storageRef = ref(storage, `ai_studio_outputs/${id}_${file.name}`);
                
                const btn = document.getElementById(`btn-${id}`);
                btn.innerText = "UPLOADING...";
                
                try {
                    // 1. Upload
                    const snapshot = await uploadBytes(storageRef, file);
                    // 2. Get URL
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    // 3. Update Firestore
                    await updateDoc(doc(db, "ai_studio_generations", id), {
                        status: 'completed',
                        resultUrl: downloadURL
                    });
                    
                    alert("Sent to user!");
                } catch (e) {
                    console.error(e);
                    alert("Upload failed.");
                    btn.innerText = "RETRY";
                }
            });
        });
    });
}
