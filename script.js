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
let db, auth;
try {
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
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
const authContainer = document.getElementById('authContainer');
const userProfile = document.getElementById('userProfile');
const userEmail = document.getElementById('userEmail');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authButton = document.getElementById('authButton');
const authToggle = document.getElementById('authToggle');
const authError = document.getElementById('authError');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Authentication state
let isLoginMode = true;
let currentUser = null;
let userPlayerData = null;

// Toggle between login and signup
authToggle.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'Login' : 'Sign Up';
    authButton.textContent = isLoginMode ? 'Login' : 'Sign Up';
    authToggle.textContent = isLoginMode 
        ? 'Need an account? Sign up' 
        : 'Already have an account? Login';
    
    // Clear form and error
    authForm.reset();
    authError.textContent = '';
});

// Handle authentication form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    try {
        if (isLoginMode) {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            await auth.createUserWithEmailAndPassword(email, password);
        }
        authError.textContent = '';
        authForm.reset();
    } catch (error) {
        authError.textContent = error.message;
    }
});

// Handle logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Handle account deletion
deleteAccountBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete your account? This will also remove your player profile.')) {
        try {
            // Delete player data first
            if (userPlayerData) {
                await db.collection('players').doc(userPlayerData.id).delete();
            }
            
            // Delete user account
            const user = auth.currentUser;
            await user.delete();
            
            alert('Account deleted successfully');
        } catch (error) {
            console.error("Error deleting account:", error);
            alert(`Error: ${error.message}`);
        }
    }
});

// Authentication state observer
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
        // User is signed in
        authContainer.style.display = 'none';
        userProfile.style.display = 'block';
        userEmail.textContent = user.email;
        
        // Check if user has a player profile
        const playerQuery = await db.collection('players')
            .where('userId', '==', user.uid)
            .limit(1)
            .get();
            
        if (!playerQuery.empty) {
            userPlayerData = {
                id: playerQuery.docs[0].id,
                ...playerQuery.docs[0].data()
            };
            
            // Pre-fill the form with user's data
            document.getElementById('username').value = userPlayerData.username;
            document.getElementById('region').value = userPlayerData.region;
            
            // Add delete button to form
            if (!document.getElementById('deleteProfileBtn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.id = 'deleteProfileBtn';
                deleteBtn.textContent = 'Delete My Profile';
                deleteBtn.style.backgroundColor = 'var(--danger)';
                deleteBtn.style.marginLeft = '10px';
                usernameForm.appendChild(deleteBtn);
                
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete your player profile?')) {
                        try {
                            await db.collection('players').doc(userPlayerData.id).delete();
                            userPlayerData = null;
                            usernameForm.reset();
                            deleteBtn.remove();
                            alert('Profile deleted successfully');
                        } catch (error) {
                            console.error("Error deleting profile:", error);
                            alert(`Error: ${error.message}`);
                        }
                    }
                });
            }
        }
    } else {
        // User is signed out
        authContainer.style.display = 'block';
        userProfile.style.display = 'none';
        
        // Remove delete button if it exists
        const deleteBtn = document.getElementById('deleteProfileBtn');
        if (deleteBtn) deleteBtn.remove();
    }
});

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

    // Check if user is authenticated
    if (!currentUser) {
        alert("Please sign in to add your username");
        return;
    }

    const username = document.getElementById('username').value.trim();
    const region = document.getElementById('region').value;

    if (!username || !region) {
        alert('Please fill in all fields');
        return;
    }

    try {
        if (userPlayerData) {
            // Update existing player profile
            await db.collection('players').doc(userPlayerData.id).update({
                username,
                region,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Profile updated successfully!');
        } else {
            // Create new player profile
            await db.collection('players').add({
                username,
                region,
                userId: currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Username submitted successfully!');
        }
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
