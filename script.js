// Sample data - In a real app, you would use Firebase or another backend
let players = [
    { username: "PESMaster99", region: "Europe" },
    { username: "KonamiKing", region: "Asia" },
    { username: "SoccerPro22", region: "North America" },
    { username: "DribbleGod", region: "South America" },
    { username: "GoalMachine", region: "Africa" },
    { username: "ThroughBall", region: "Oceania" }
];

// DOM Elements
const usernameForm = document.getElementById('usernameForm');
const playersList = document.getElementById('playersList');
const filterRegion = document.getElementById('filterRegion');
const refreshBtn = document.getElementById('refreshBtn');

// Display players in the list
function displayPlayers(playersToShow) {
    if (playersToShow.length === 0) {
        playersList.innerHTML = '<div class="no-players">No players found matching your criteria</div>';
        return;
    }

    playersList.innerHTML = '';

    playersToShow.forEach(player => {
        const playerRow = document.createElement('div');
        playerRow.className = 'player-row';

        playerRow.innerHTML = `
            <div class="player-info">
                <span class="player-username">${player.username}</span>
            </div>
            <span class="player-region">${player.region}</span>
        `;

        playersList.appendChild(playerRow);
    });
}

// Filter players by region
function filterPlayers() {
    const region = filterRegion.value;

    if (region === '') {
        displayPlayers(players);
    } else {
        const filteredPlayers = players.filter(player => player.region === region);
        displayPlayers(filteredPlayers);
    }
}

// Add a new player
usernameForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const region = document.getElementById('region').value;

    if (username === '' || region === '') {
        alert('Please fill in all fields');
        return;
    }

    // Add new player to the array
    const newPlayer = { username, region };
    players.unshift(newPlayer); // Add to beginning of array

    // Reset form
    usernameForm.reset();

    // Update the display
    filterPlayers();

    // Show success message
    alert(`${username} has been added successfully!`);
});

// Event listeners
filterRegion.addEventListener('change', filterPlayers);
refreshBtn.addEventListener('click', filterPlayers);

// Initial display
displayPlayers(players);