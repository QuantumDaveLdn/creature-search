// Get references to DOM elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const clearBtn = document.getElementById("clear-button");

// Elements for displaying creature data
const creatureNameElement = document.getElementById('creature-name');
const creatureIdElement = document.getElementById('creature-id');
const weightElement = document.getElementById('weight');
const heightElement = document.getElementById('height');
const typesElement = document.getElementById('types');
const specialAbilityDisplay = document.getElementById('special-ability-display');
const creatureInfoArea = document.getElementById('creature-info-area'); // Container for all creature info

// Elements for base stats
const hpElement = document.getElementById('hp');
const attackElement = document.getElementById('attack');
const defenseElement = document.getElementById('defense');
const spAttackElement = document.getElementById('sp-attack');
const spDefenseElement = document.getElementById('sp-defense');
const speedElement = document.getElementById('speed');

// Provided creature names array (used by searchForCreature, not directly by API search)
const creatureNames = [{"id":1,"name":"Pyrolynx"},{"id":2,"name":"Aquoroc"},{"id":3,"name":"Voltadon"},{"id":4,"name":"Floraspine"},{"id":5,"name":"Cryostag"},{"id":6,"name":"Terradon"},{"id":7,"name":"Emberapod"},{"id":8,"name":"Lunaclaw"},{"id":9,"name":"Quillquake"},{"id":10,"name":"Mystifin"},{"id":11,"name":"Dracilume"},{"id":12,"name":"Thornaconda"},{"id":13,"name":"Frostbyte"},{"id":14,"name":"Graviboa"},{"id":15,"name":"Zephyreon"},{"id":16,"name":"Blazebore"},{"id":17,"name":"Brontogale"},{"id":18,"name":"Shadeelisk"},{"id":19,"name":"Titanule"},{"id":20,"name":"Faegis"}];

/**
 * Searches for a creature in the local creatureNames array.
 * This function is part of the original script but not directly used by the main search button for API fetching.
 * @param {string | null} name - The name of the creature.
 * @param {number | null} id - The ID of the creature.
 * @returns {string | number | null} The creature's name or ID if found, otherwise null.
 */
const searchForCreature = (name = null, id = null) => {
    if (!name && !id) {
        alert("Please enter either a ID or Creature Name");
        return null;
    }

    if (typeof name === "number") { // Handles if name is accidentally a number
        id = name;
        name = null;
    }

    if (name === null) { // Search by ID in local array
        const creature = creatureNames.find(c => c.id === id);
        if (creature) return creature.id;
    } else if (id === null) { // Search by Name in local array
        const creature = creatureNames.find(c => c.name.toLowerCase() === String(name).toLowerCase().trim());
        if (creature) return creature.name;
    }
    return null;
};

/**
 * Fetches creature statistics from the API.
 * @param {number | null} id - The ID of the creature to fetch.
 * @param {string | null} name - The name of the creature to fetch.
 * @returns {Promise<Object | null>} A promise that resolves to the creature data object or null.
 */
const creaturesStats = async (id = null, name = null) => {
    if (!id && !name) {
        // This case should ideally be caught before calling, 
        // but good to have a safeguard.
        return null; 
    }
    // The API endpoint can handle either name or ID in the path.
    // The logic here correctly uses 'name' if provided, otherwise 'id'.
    // If called with creaturesStats(nameFromInput, idFromInput):
    //   - function's 'id' param gets nameFromInput
    //   - function's 'name' param gets idFromInput
    //   - if (name) checks idFromInput, if (id) checks nameFromInput.
    // This means if an ID is passed as the second argument, it's fetched.
    // If a name is passed as the first argument, it's fetched.
    // This matches the calling convention from handleSearch().
    let queryValue;
    if (name) { // If name parameter (which holds idFromInput if it's an ID search) is truthy
        queryValue = name;
    } else if (id) { // If id parameter (which holds nameFromInput if it's a name search) is truthy
        queryValue = id;
    } else {
        return null; // Should not happen if called correctly
    }
    
    try {
        const res = await fetch(`https://rpg-creature-api.freecodecamp.rocks/api/creature/${queryValue}`);
        if (!res.ok) { // Handle HTTP errors like 404
            // Throw an error to be caught by the calling function's catch block
            throw new Error(`Creature not found or API error: ${res.status}`);
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch creature stats:", error);
        // Re-throw to be handled by the caller, which will show the alert
        throw error;
    }
};

/**
 * Displays the fetched creature data on the page.
 * @param {Object} creature - The creature data object from the API.
 */
const displayCreatureData = (creature) => {
    const { id, name, weight, height, special, types, stats } = creature;

    // Populate main creature info
    creatureNameElement.textContent = name.toUpperCase();
    creatureIdElement.textContent = `#${id}`;
    weightElement.textContent = `Weight: ${weight}`;
    heightElement.textContent = `Height: ${height}`;

    // Populate types
    typesElement.innerHTML = ''; // Clear previous types
    types.forEach(typeInfo => {
        const typeSpan = document.createElement('span');
        typeSpan.textContent = typeInfo.name.toUpperCase();
        typeSpan.className = `type-bubble ${typeInfo.name.toLowerCase()}`;
        typesElement.appendChild(typeSpan);
    });

    // Display special ability
    if (special && special.name && special.description) {
        specialAbilityDisplay.innerHTML = `
            <h3 class="ability-name">${special.name}</h3>
            <p class="ability-desc">${special.description}</p>
        `;
    } else {
        specialAbilityDisplay.innerHTML = '<p>No special ability data.</p>';
    }

    // Populate base stats (HP, Attack, etc.)
    const creatureStatsMap = {};
    stats.forEach((stat) => {
        creatureStatsMap[stat.name.toLowerCase()] = stat.base_stat; // Ensure keys are lowercase
    });

    hpElement.textContent = creatureStatsMap["hp"] || 'N/A';
    attackElement.textContent = creatureStatsMap["attack"] || 'N/A';
    defenseElement.textContent = creatureStatsMap["defense"] || 'N/A';
    spAttackElement.textContent = creatureStatsMap["special-attack"] || 'N/A';
    spDefenseElement.textContent = creatureStatsMap["special-defense"] || 'N/A';
    speedElement.textContent = creatureStatsMap["speed"] || 'N/A';

    // Show the creature info area
    creatureInfoArea.classList.remove("hidden");
};

/**
 * Handles the search logic when the search button is clicked or Enter is pressed.
 */
const handleSearch = async () => {
    const inputValue = searchInput.value.trim();
    if (!inputValue) {
        // As per tests, an empty input doesn't trigger an alert immediately,
        // but a search for an invalid name (which could be empty if API treats it so) does.
        // For robustness, we can alert or just return.
        // Let's assume the API call with empty will result in "Creature not found".
        // Or, we can be proactive:
        // alert("Please enter a creature name or ID.");
        // return; 
    }

    let idToSearch = null;
    let nameToSearch = null;

    // Determine if input is an ID (numeric) or a name (string)
    if (!isNaN(inputValue) && inputValue !== '') {
        idToSearch = parseInt(inputValue);
    } else {
        nameToSearch = inputValue; // Even if empty, let API handle it
    }

    try {
        // Call creaturesStats with (name, id) order as per original script's event listeners
        // The creaturesStats function is designed to handle this specific calling convention.
        const creatureData = await creaturesStats(nameToSearch, idToSearch); 

        if (creatureData && creatureData.id) { // Check if valid data is returned
            displayCreatureData(creatureData);
        } else {
            // This case might be hit if API returns a valid response (e.g. 200 OK) but empty/error object
            // However, typical API errors (404) are caught by the catch block.
            alert("Creature not found");
            clearDisplayAndHideInfo();
        }
    } catch (error) {
        // This catch block handles network errors or errors thrown from creaturesStats (like 404s)
        console.error("Search error:", error);
        alert("Creature not found"); // Required by tests 14 & 19
        clearDisplayAndHideInfo();
    }
};

/**
 * Clears all displayed creature information and hides the info area.
 */
const clearDisplayAndHideInfo = () => {
    searchInput.value = ""; // Clear input field

    // Clear displayed creature details
    creatureNameElement.textContent = "";
    creatureIdElement.textContent = "";
    weightElement.textContent = "";
    heightElement.textContent = "";
    typesElement.innerHTML = "";
    specialAbilityDisplay.innerHTML = "";

    // Clear base stats
    hpElement.textContent = "";
    attackElement.textContent = "";
    defenseElement.textContent = "";
    spAttackElement.textContent = "";
    spDefenseElement.textContent = "";
    speedElement.textContent = "";

    // Hide the creature info display area
    creatureInfoArea.classList.add("hidden");
};

// Event Listeners
searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});

clearBtn.addEventListener("click", clearDisplayAndHideInfo);

// Initial state: ensure the info area is hidden on page load
document.addEventListener('DOMContentLoaded', () => {
    if (creatureInfoArea) { // Check if element exists before manipulating
        creatureInfoArea.classList.add("hidden");
    }
});
