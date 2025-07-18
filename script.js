// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDCK9zGapNWsrEX7UCT-AhLkbcXECOht_0",
    authDomain: "pes-gamer-f6342.firebaseapp.com",
    projectId: "pes-gamer-f6342",
    storageBucket: "pes-gamer-f6342.appspot.com",
    messagingSenderId: "397106240623",
    appId: "1:397106240623:web:36afe72121f26f33fd819a",
    measurementId: "G-L4RWNLB6PT"
};

// Initialize Firebase services
let db;
try {
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
    alert("Failed to initialize Firebase. Please check console for details.");
}

// DOM Elements
const usernameForm = document.getElementById('usernameForm');
const playersList = document.getElementById('playersList');
const filterRegion = document.getElementById('filterRegion');
const refreshBtn = document.getElementById('refreshBtn');

// Format date for display
function formatDate(date) {
    if (!date) return 'Just now';
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short'
    }).format(date);
}

// Add player to DOM
function addPlayerToDOM(player, id) {
    if (filterRegion.value && filterRegion.value !== player.region) return;

    const playerRow = document.createElement('div');
    playerRow.className = 'player-row';
    playerRow.dataset.id = id;

    playerRow.innerHTML = `
        <div class="player-info">
            <span class="player-username">${player.username}</span>
        </div>
        <span class="player-region">${player.region}</span>
        <div class="player-meta">
            <small>${formatDate(player.timestamp?.toDate())}</small>
        </div>
    `;

    playersList.appendChild(playerRow);
}

// Apply region filter
function applyRegionFilter() {
    const allPlayerRows = document.querySelectorAll('.player-row');
    const region = filterRegion.value;

    allPlayerRows.forEach(row => {
        const playerRegion = row.querySelector('.player-region')?.textContent;
        row.style.display = (!region || playerRegion === region) ? 'flex' : 'none';
    });
}

// Real-time listener for players
function setupRealTimeListener() {
    if (!db) {
        console.error("Firestore not initialized");
        return () => { };
    }

    return db.collection('players')
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            playersList.innerHTML = '';

            if (snapshot.empty) {
                playersList.innerHTML = '<div class="no-players">No players found. Be the first!</div>';
                return;
            }

            snapshot.forEach(doc => {
                const player = doc.data();
                addPlayerToDOM(player, doc.id);
            });

            applyRegionFilter();
        }, error => {
            console.error("Error loading players:", error);
            playersList.innerHTML = `
                <div class="error">
                    Error loading players. 
                    <button onclick="window.location.reload()">Refresh Page</button>
                    <p>${error.message}</p>
                </div>
            `;
        });
}

// Form submission
usernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!db) {
        alert("Database not ready. Please try again later.");
        return;
    }

    const username = document.getElementById('username').value.trim();
    const region = document.getElementById('region').value;

    if (!username || !region) {
        alert('Please fill in all fields');
        return;
    }

    try {
        await db.collection('players').add({
            username,
            region,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        usernameForm.reset();
        alert('Username submitted successfully!');
    } catch (error) {
        console.error("Submission error:", error);
        alert(`Error: ${error.message}`);
    }
});

// Event listeners
filterRegion.addEventListener('change', applyRegionFilter);
refreshBtn.addEventListener('click', applyRegionFilter);

// Initialize with error handling
let unsubscribe;
try {
    unsubscribe = setupRealTimeListener();
} catch (error) {
    console.error("Failed to setup listener:", error);
    playersList.innerHTML = `
        <div class="error">
            Failed to load players. 
            <button onclick="window.location.reload()">Try Again</button>
            <p>${error.message}</p>
        </div>
    `;
}