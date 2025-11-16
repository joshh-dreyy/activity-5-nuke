// API Widget Builder - Discovery Challenge
// Explore component-based architecture and dynamic UI generation
// LEARNING GOAL: Understanding modular programming and reusable components
// CONCEPT: State management in complex web applications

// Widget State Management - Study these patterns
// CONCEPT: Global State Variables
// LEARNING: These variables track the application's current state
// DEBUGGING TIP: Use console.log() to inspect these variables when debugging
// Think about: Why do we need to track state in web applications?
let activeWidget = null;      // Which widget is currently being configured
let widgetConfig = {};        // Current widget's configuration settings
let dashboardWidgets = [];    // Array of widgets added to the dashboard
let autoRefreshIntervals = new Map(); // Tracks automatic refresh timers

// API Keys and Configurations
const API_CONFIGS = {
    weather: {
        apiKey: 'demo_key', // Replace with actual OpenWeatherMap key
        baseUrl: 'https://api.openweathermap.org/data/2.5/weather'
    },
    pokemon: {
        baseUrl: 'https://pokeapi.co/api/v2/pokemon'
    },
    space: {
        apiKey: 'DEMO_KEY', // Replace with actual NASA key
        baseUrl: 'https://api.nasa.gov'
    },
    quotes: {
        baseUrl: 'https://quotable.io/random'
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeCodeTabs();
    loadSampleWidgets();
});

// Code Tab Management
function initializeCodeTabs() {
    const tabButtons = document.querySelectorAll('.code-tab');
    const tabPanels = document.querySelectorAll('.code-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Widget Loading
// CONCEPT: Dynamic Component Loading
// LEARNING GOAL: Understanding how to load and initialize different UI components
async function loadWidget(widgetType) {
    // CONCEPT: State Management
    // LEARNING: Track which widget is currently active
    activeWidget = widgetType;

    // CONCEPT: DOM Manipulation
    // LEARNING: Programmatically show/hide UI elements
    // DEBUGGING TIP: Check if elements exist before manipulating them
    document.getElementById('widgetContainer').style.display = 'block';
    document.getElementById('widgetTitle').textContent = getWidgetTitle(widgetType);

    // CONCEPT: Template System
    // LEARNING: Reusing HTML templates for different widget types
    // HINT: Templates are hidden HTML that we clone and modify
    // WATCH OUT: Make sure template selectors match your HTML
    const template = document.querySelector(`.widget-template[data-widget="${widgetType}"]`);
    const widgetContent = document.getElementById('widgetContent');

    if (template) {
        // CONCEPT: Dynamic HTML Generation
        // LEARNING: Copy template content into the active widget area
        widgetContent.innerHTML = template.innerHTML;

        // CONCEPT: Asynchronous Initialization
        // LEARNING: Some widgets need to fetch data before they're ready
        // DEBUGGING TIP: Watch the Network tab to see API calls
        await initializeWidget(widgetType);
    }

    // CONCEPT: User Experience
    // LEARNING: Smooth scrolling provides better user experience
    // UX PRINCIPLE: Guide users' attention to new content
    document.getElementById('widgetContainer').scrollIntoView({ behavior: 'smooth' });
}

function getWidgetTitle(widgetType) {
    const titles = {
        'weather': 'Weather Forecast',
        'pokemon': 'Pokédex',
        'space': 'Space Explorer',
        'quotes': 'Inspirational Quotes'
    };
    return titles[widgetType] || `${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget`;
}

// Widget Initialization
// TODO 1: Basic Widget Initialization (Easy)
// LEARNING GOAL: Understanding how to initialize different widget types
// SUCCESS CRITERIA:
//   - Switch statement correctly identifies widget type
//   - Default data loads for each widget (London for weather, pikachu for pokemon, etc.)
//   - Error handling catches and displays initialization failures
// DEBUGGING TIP: Check browser console for initialization errors
// HINT: Use the helper functions already provided (loadWeatherData, loadPokemonData, etc.)
async function initializeWidget(widgetType) {
    try {
        switch(widgetType) {
            case 'weather':
                await loadWeatherData('London');
                break;
            case 'pokemon':
                await loadPokemonData('pikachu');
                break;
            case 'space':
                await loadSpaceData('apod');
                break;
            case 'quotes':
                await loadQuoteData();
                break;
        }
    } catch (error) {
        console.error(`Error initializing ${widgetType} widget:`, error);
        showWidgetError(error.message);
    }
}

// Weather Widget Functions
async function updateWeather() {
    const city = document.getElementById('weatherCity').value.trim();
    if (!city) {
        showWidgetError('Please enter a city name');
        return;
    }
    await loadWeatherData(city);
}

async function loadWeatherData(city) {
    const display = document.getElementById('weatherDisplay');
    if (!display) {
        console.error('Weather display element not found');
        return;
    }

    // Show loading state
    display.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading weather data for ${city}...</p>
        </div>
    `;

    try {
        // Input validation
        if (!city || typeof city !== 'string' || city.trim() === '') {
            throw new Error('Please enter a valid city name');
        }

        // Get user preferences
        const units = document.querySelector('input[name="weatherUnits"]:checked')?.value || 'metric';
        const tempSymbol = units === 'metric' ? '°C' : '°F';
        const speedUnit = units === 'metric' ? 'm/s' : 'mph';

        // Use real API in production, fallback to simulation
        const weatherData = await (process.env.NODE_ENV === 'production' 
            ? fetchWeatherData(city, units)
            : simulateWeatherAPI(city));

        // Update UI with weather data
        updateWeatherDisplay(display, weatherData, { tempSymbol, speedUnit });

    } catch (error) {
        console.error('Weather data loading error:', error);
        display.innerHTML = `
            <div class="error">
                <h3>Weather Error</h3>
                <p>${error.message || `Could not load weather data for ${city}`}</p>
                <button class="btn" onclick="loadWeatherData('${city}')">Retry</button>
            </div>
        `;
    }
}

// Helper function to fetch real weather data
async function fetchWeatherData(city, units = 'metric') {
    const { apiKey, baseUrl } = API_CONFIGS.weather;
    const response = await fetch(
        `${baseUrl}?q=${encodeURIComponent(city)}&units=${units}&appid=${apiKey}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch weather data');
    }

    const data = await response.json();
    
    // Transform API response to match our expected format
    return {
        name: data.name,
        country: data.sys?.country || '',
        temp: Math.round(data.main.temp),
        description: data.weather[0]?.description || 'N/A',
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        windSpeed: data.wind.speed.toFixed(1),
        pressure: data.main.pressure,
        icon: data.weather[0]?.icon
    };
}

// Helper function to update weather display
function updateWeatherDisplay(container, weatherData, { tempSymbol, speedUnit }) {
    container.innerHTML = `
        <div class="weather-main">
            <div class="weather-header">
                <h3>${weatherData.name}${weatherData.country ? `, ${weatherData.country}` : ''}</h3>
                ${weatherData.icon ? `<img src="https://openweathermap.org/img/wn/${weatherData.icon}@2x.png" alt="${weatherData.description}">` : ''}
            </div>
            <div class="weather-temp">${weatherData.temp}${tempSymbol}</div>
            <div class="weather-description">${weatherData.description}</div>
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <strong>Feels like</strong><br>
                ${weatherData.feelsLike}${tempSymbol}
            </div>
            <div class="weather-detail">
                <strong>Humidity</strong><br>
                ${weatherData.humidity}%
            </div>
            <div class="weather-detail">
                <strong>Wind</strong><br>
                ${weatherData.windSpeed} ${speedUnit}
            </div>
            <div class="weather-detail">
                <strong>Pressure</strong><br>
                ${weatherData.pressure} hPa
            </div>
        </div>
    `;
}

// Pokemon Widget Functions
async function searchPokemon() {
    const name = document.getElementById('pokemonName').value.trim().toLowerCase();
    if (!name) {
        alert('Please enter a Pokemon name or ID');
        return;
    }

    await loadPokemonData(name);
}

async function randomPokemon() {
    const randomId = Math.floor(Math.random() * 1010) + 1;
    await loadPokemonData(randomId.toString());
}

// TODO 3: Multi-API Integration (Hard)
// LEARNING GOAL: Fetching and combining data from multiple API sources
// SUCCESS CRITERIA:
//   - Successfully fetch data from PokeAPI (free, no key needed)
//   - Handle API response errors gracefully (404 for not found, network errors)
//   - Parse JSON response and extract relevant data (name, sprites, stats, types)
//   - Display data in a user-friendly format with images and stats
// DEBUGGING TIP: Test with both valid (pikachu, 25) and invalid (zzz, 99999) identifiers
// HINT: PokeAPI accepts both names (pikachu) and IDs (25) as identifiers
// WATCH OUT: API returns 404 for invalid Pokemon, handle this with try-catch
// EXTENSION: Add support for fetching evolution chain or Pokemon abilities
async function loadPokemonData(identifier) {
    const display = document.getElementById('pokemonDisplay');
    if (!display) {
        console.error('Pokemon display element not found');
        return;
    }

    // Show loading state
    display.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching for ${identifier}...</p>
        </div>
    `;

    try {
        // Input validation
        if (!identifier || (typeof identifier !== 'string' && typeof identifier !== 'number')) {
            throw new Error('Please enter a valid Pokemon name or ID');
        }

        // 1. Fetch basic Pokemon data
        const pokemonResponse = await fetch(`${API_CONFIGS.pokemon.baseUrl}/${identifier.toLowerCase()}`);
        
        if (!pokemonResponse.ok) {
            if (pokemonResponse.status === 404) {
                throw new Error(`No Pokemon found with name/ID: ${identifier}`);
            }
            throw new Error(`Failed to fetch Pokemon data: ${pokemonResponse.statusText}`);
        }

        const pokemon = await pokemonResponse.json();

        // 2. Fetch species data for evolution chain and additional info
        const speciesResponse = await fetch(pokemon.species.url);
        if (!speciesResponse.ok) {
            throw new Error('Failed to fetch species data');
        }
        const speciesData = await speciesResponse.json();

        // 3. Get evolution chain if available
        let evolutionChain = null;
        if (speciesData.evolution_chain?.url) {
            const evolutionResponse = await fetch(speciesData.evolution_chain.url);
            if (evolutionResponse.ok) {
                evolutionChain = await evolutionResponse.json();
            }
        }

        // Get user preferences
        const showShiny = document.getElementById('showShiny')?.checked || false;
        const showStats = document.getElementById('showStats')?.checked !== false; // Default to true

        // Process Pokemon data
        const processedData = processPokemonData(pokemon, speciesData, evolutionChain, showShiny);
        
        // Update the display
        display.innerHTML = createPokemonCard(processedData, showStats);

        // Update input with actual name
        const pokemonNameInput = document.getElementById('pokemonName');
        if (pokemonNameInput) {
            pokemonNameInput.value = pokemon.name;
        }

    } catch (error) {
        console.error('Pokemon data loading error:', error);
        display.innerHTML = `
            <div class="error">
                <h3>Pokémon Not Found</h3>
                <p>${error.message || `Could not find Pokémon: ${identifier}`}</p>
                <button class="btn" onclick="loadPokemonData('pikachu')">Load Pikachu</button>
            </div>
        `;
    }
}

function processPokemonData(pokemon, speciesData, evolutionChain, showShiny) {
    // Process types with colors
    const types = pokemon.types.map(t => ({
        name: t.type.name,
        color: getTypeColor(t.type.name)
    }));

    // Process stats
    const stats = pokemon.stats.map(stat => ({
        name: formatStatName(stat.stat.name),
        value: stat.base_stat,
        percentage: Math.min(100, Math.round((stat.base_stat / 255) * 100))
    }));

    // Process abilities
    const abilities = pokemon.abilities
        .filter(a => !a.is_hidden)
        .map(a => formatAbilityName(a.ability.name));

    // Process evolution chain if available
    let evolutionInfo = null;
    if (evolutionChain) {
        evolutionInfo = {
            hasEvolution: evolutionChain.chain.evolves_to.length > 0,
            nextEvolution: evolutionChain.chain.evolves_to[0]?.species?.name || null
        };
    }

    return {
        id: pokemon.id,
        name: formatName(pokemon.name),
        sprite: showShiny 
            ? pokemon.sprites.other['official-artwork']?.front_shiny || pokemon.sprites.front_shiny 
            : pokemon.sprites.other['official-artwork']?.front_default || pokemon.sprites.front_default,
        types,
        stats,
        abilities,
        height: pokemon.height / 10, // Convert to meters
        weight: pokemon.weight / 10, // Convert to kg
        species: formatName(speciesData.genera.find(g => g.language.name === 'en')?.genus || 'Unknown'),
        description: speciesData.flavor_text_entries
            .find(entry => entry.language.name === 'en')
            ?.flavor_text
            .replace(/\n/g, ' ') || 'No description available.',
        evolution: evolutionInfo
    };
}

function createPokemonCard(pokemon, showStats) {
    return `
        <div class="pokemon-card">
            <div class="pokemon-header">
                <h2>${pokemon.name} <span class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</span></h2>
                <div class="pokemon-types">
                    ${pokemon.types.map(type => `
                        <span class="type-badge" style="background-color: ${type.color}">${type.name}</span>
                    `).join('')}
                </div>
            </div>

            <div class="pokemon-content">
                <div class="pokemon-image-container">
                    <img src="${pokemon.sprite}" alt="${pokemon.name}" class="pokemon-image">
                </div>

                <div class="pokemon-details">
                    <div class="pokemon-species">${pokemon.species} Pokémon</div>
                    <div class="pokemon-measurements">
                        <div class="measurement">
                            <span class="label">Height</span>
                            <span class="value">${pokemon.height} m</span>
                        </div>
                        <div class="measurement">
                            <span class="label">Weight</span>
                            <span class="value">${pokemon.weight} kg</span>
                        </div>
                    </div>

                    <div class="pokemon-abilities">
                        <h4>Abilities</h4>
                        <div class="ability-tags">
                            ${pokemon.abilities.map(ability => `
                                <span class="ability-tag">${ability}</span>
                            `).join('')}
                        </div>
                    </div>

                    ${showStats ? `
                        <div class="pokemon-stats">
                            <h4>Base Stats</h4>
                            ${pokemon.stats.map(stat => `
                                <div class="stat-row">
                                    <span class="stat-name">${stat.name}</span>
                                    <div class="stat-bar-container">
                                        <div class="stat-bar" style="width: ${stat.percentage}%"></div>
                                    </div>
                                    <span class="stat-value">${stat.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>

            ${pokemon.evolution?.hasEvolution ? `
                <div class="evolution-section">
                    <h4>Evolves into: ${formatName(pokemon.evolution.nextEvolution)}</h4>
                    <button class="btn" onclick="loadPokemonData('${pokemon.evolution.nextEvolution}')">
                        View Evolution
                    </button>
                </div>
            ` : ''}

            <div class="pokemon-description">
                <p>${pokemon.description}</p>
            </div>
        </div>
    `;
}

// Helper functions
function formatName(name) {
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatStatName(statName) {
    const statMap = {
        'hp': 'HP',
        'attack': 'Attack',
        'defense': 'Defense',
        'special-attack': 'Sp. Atk',
        'special-defense': 'Sp. Def',
        'speed': 'Speed'
    };
    return statMap[statName] || statName;
}

function formatAbilityName(abilityName) {
    return abilityName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getTypeColor(type) {
    const typeColors = {
        normal: '#A8A77A',
        fire: '#EE8130',
        water: '#6390F0',
        electric: '#F7D02C',
        grass: '#7AC74C',
        ice: '#96D9D6',
        fighting: '#C22E28',
        poison: '#A33EA1',
        ground: '#E2BF65',
        flying: '#A98FF3',
        psychic: '#F95587',
        bug: '#A6B91A',
        rock: '#B6A136',
        ghost: '#735797',
        dragon: '#6F35FC',
        dark: '#705746',
        steel: '#B7B7CE',
        fairy: '#D685AD'
    };
    return typeColors[type] || '#777';
}

function toggleShiny() {
    if (activeWidget === 'pokemon') {
        const currentName = document.getElementById('pokemonName').value;
        if (currentName) {
            loadPokemonData(currentName);
        }
    }
}

function toggleStats() {
    if (activeWidget === 'pokemon') {
        const currentName = document.getElementById('pokemonName').value;
        if (currentName) {
            loadPokemonData(currentName);
        }
    }
}

// Space Widget Functions
async function updateSpaceData() {
    const dataType = document.getElementById('spaceDataType').value;
    await loadSpaceData(dataType);
}

async function refreshSpaceData() {
    const dataType = document.getElementById('spaceDataType').value;
    await loadSpaceData(dataType);
}

async function loadSpaceData(dataType) {
    const display = document.getElementById('spaceDisplay');
    display.innerHTML = '<div class="loading">Loading space data...</div>';

    try {
        let spaceData;

        switch(dataType) {
            case 'apod':
                spaceData = await loadAPOD();
                break;
            case 'mars':
                spaceData = await loadMarsPhotos();
                break;
            case 'neo':
                spaceData = await loadNearEarthObjects();
                break;
            default:
                throw new Error('Unknown data type');
        }

        display.innerHTML = spaceData;

    } catch (error) {
        display.innerHTML = `<div class="error">
            <h3>Space Data Error</h3>
            <p>Could not load space data: ${error.message}</p>
        </div>`;
    }
}

async function loadAPOD() {
    // For demo purposes, simulate APOD data
    // In production, use actual NASA APOD API
    const apodData = {
        title: "The Andromeda Galaxy",
        date: new Date().toISOString().split('T')[0],
        explanation: "The Andromeda Galaxy, also known as M31, is a spiral galaxy approximately 2.5 million light-years from Earth and is the nearest major galaxy to the Milky Way. This stunning image shows the galaxy's distinctive spiral structure with its bright central bulge and sweeping arms filled with star-forming regions.",
        url: "https://apod.nasa.gov/apod/image/2312/M31_HubbleSpitzer_2048.jpg",
        media_type: "image"
    };

    return `
        <div class="space-content">
            <h3>${apodData.title}</h3>
            <p class="space-date">${apodData.date}</p>
            <img src="${apodData.url}" alt="${apodData.title}" class="space-image">
            <div class="space-description">
                <h4>Explanation</h4>
                <p>${apodData.explanation}</p>
            </div>
        </div>
    `;
}

async function loadMarsPhotos() {
    return `
        <div class="space-content">
            <h3>Mars Rover Photos - Sol 1000</h3>
            <p>Recent photos from the Curiosity rover on Mars</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                <img src="https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/ccam/CR0_486265466EDR_F0481570CCAM01000M_.JPG" style="width: 100%; border-radius: 8px;">
                <img src="https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/ccam/CR0_486265398EDR_F0481570CCAM01000M_.JPG" style="width: 100%; border-radius: 8px;">
            </div>
            <p><em>Images from Curiosity's ChemCam instrument</em></p>
        </div>
    `;
}

async function loadNearEarthObjects() {
    return `
        <div class="space-content">
            <h3>Near Earth Objects Today</h3>
            <p>Asteroids approaching Earth today</p>
            <div style="margin-top: 20px;">
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <h4>2023 DW</h4>
                    <p><strong>Estimated Diameter:</strong> 50-112 meters</p>
                    <p><strong>Relative Velocity:</strong> 24,140 km/h</p>
                    <p><strong>Miss Distance:</strong> 1,935,696 km</p>
                    <p style="color: #51cf66;">✅ Safe - No impact threat</p>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                    <h4>2024 ON</h4>
                    <p><strong>Estimated Diameter:</strong> 280-610 meters</p>
                    <p><strong>Relative Velocity:</strong> 33,500 km/h</p>
                    <p><strong>Miss Distance:</strong> 988,000 km</p>
                    <p style="color: #51cf66;">✅ Safe - No impact threat</p>
                </div>
            </div>
        </div>
    `;
}

// Quotes Widget Functions
async function updateQuotes() {
    await loadQuoteData();
}

async function getNewQuote() {
    await loadQuoteData();
}

async function loadQuoteData() {
    const display = document.getElementById('quotesDisplay');
    display.innerHTML = '<div class="loading">Loading inspirational quote...</div>';

    try {
        // For demo purposes, use predefined quotes
        // In production, use actual quotes API
        const quotes = [
            {
                content: "The only way to do great work is to love what you do.",
                author: "Steve Jobs"
            },
            {
                content: "Innovation distinguishes between a leader and a follower.",
                author: "Steve Jobs"
            },
            {
                content: "Life is what happens to you while you're busy making other plans.",
                author: "John Lennon"
            },
            {
                content: "The future belongs to those who believe in the beauty of their dreams.",
                author: "Eleanor Roosevelt"
            },
            {
                content: "It is during our darkest moments that we must focus to see the light.",
                author: "Aristotle"
            }
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        display.innerHTML = `
            <div class="quote-text">"${randomQuote.content}"</div>
            <div class="quote-author">— ${randomQuote.author}</div>
        `;

    } catch (error) {
        display.innerHTML = `<div class="error">
            <h3>Quote Error</h3>
            <p>Could not load inspirational quote</p>
        </div>`;
    }
}

// TODO 4: Widget Communication & Events (Medium)
// LEARNING GOAL: Implementing auto-refresh with intervals and event handling
// SUCCESS CRITERIA:
//   - Toggle auto-refresh on/off based on checkbox state
//   - Store interval ID in autoRefreshIntervals Map for later cleanup
//   - Clear interval when auto-refresh is disabled
//   - Only refresh the active widget (avoid refreshing inactive widgets)
// DEBUGGING TIP: Use console.log to track when intervals are created/cleared
// HINT: setInterval returns an ID that you need to store for clearInterval
// WATCH OUT: Always clear intervals when toggling off to prevent memory leaks
// EXTENSION: Add different refresh rates for different widget types
function toggleAutoRefresh() {
    const autoRefresh = document.getElementById('autoRefresh').checked;

    if (autoRefresh) {
        const interval = setInterval(() => {
            if (activeWidget === 'quotes') {
                loadQuoteData();
            }
        }, 30000); // 30 seconds

        autoRefreshIntervals.set('quotes', interval);
    } else {
        const interval = autoRefreshIntervals.get('quotes');
        if (interval) {
            clearInterval(interval);
            autoRefreshIntervals.delete('quotes');
        }
    }
}

// Widget Controls
async function refreshWidget() {
    if (activeWidget) {
        await initializeWidget(activeWidget);
    }
}

function customizeWidget() {
    const configDiv = document.getElementById('widgetConfig');
    const isVisible = configDiv.style.display !== 'none';

    configDiv.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        loadWidgetConfig();
    }
}

// TODO 2: Widget Configuration System (Medium)
// LEARNING GOAL: Creating dynamic configuration panels for different widget types
// SUCCESS CRITERIA:
//   - Configuration panel displays correct controls for each widget type
//   - Controls are properly labeled and have appropriate default values
//   - Configuration options match the widget's functionality
// DEBUGGING TIP: Use document.getElementById to verify elements are created correctly
// HINT: Each widget type needs different configuration options (weather needs units, pokemon needs display options)
// WATCH OUT: Make sure input IDs match what you'll reference in applyConfig()
function loadWidgetConfig() {
    const configControls = document.getElementById('configControls');
    if (!configControls) return;

    // Get current config or use defaults
    const config = widgetConfig || {};

    switch(activeWidget) {
        case 'weather':
            configControls.innerHTML = `
                <label>Default City:
                    <input type="text" id="configDefaultCity" value="${config.city || 'London'}">
                </label>
                <label>Temperature Units:
                    <select id="configUnits">
                        <option value="metric" ${config.units === 'metric' ? 'selected' : ''}>Celsius</option>
                        <option value="imperial" ${config.units === 'imperial' ? 'selected' : ''}>Fahrenheit</option>
                    </select>
                </label>
                <label>
                    <input type="checkbox" id="configAutoRefresh" ${config.autoRefresh ? 'checked' : ''}>
                    Auto-refresh every 5 minutes
                </label>
            `;
            break;
        case 'pokemon':
            configControls.innerHTML = `
                <label>Default Pokemon:
                    <input type="text" id="configDefaultPokemon" 
                           value="${config.defaultPokemon || 'pikachu'}">
                </label>
                <label>
                    <input type="checkbox" id="configShowShiny" ${config.showShiny ? 'checked' : ''}>
                    Show shiny forms by default
                </label>
                <label>
                    <input type="checkbox" id="configShowEvolution" ${config.showEvolution !== false ? 'checked' : ''}>
                    Show evolution chain
                </label>
            `;
            break;
        case 'space':
            configControls.innerHTML = `
                <label>NASA API Key:
                    <input type="text" id="configNasaKey" value="${config.nasaKey || 'DEMO_KEY'}">
                </label>
                <label>Default Data Type:
                    <select id="configSpaceType">
                        <option value="apod" ${config.dataType === 'apod' ? 'selected' : ''}>Astronomy Picture of the Day</option>
                        <option value="mars" ${config.dataType === 'mars' ? 'selected' : ''}>Mars Rover Photos</option>
                        <option value="neo" ${config.dataType === 'neo' ? 'selected' : ''}>Near Earth Objects</option>
                    </select>
                </label>
            `;
            break;
        case 'quotes':
            configControls.innerHTML = `
                <label>Quote Category:
                    <select id="configQuoteCategory">
                        <option value="inspirational" ${config.category === 'inspirational' ? 'selected' : ''}>Inspirational</option>
                        <option value="motivational" ${config.category === 'motivational' ? 'selected' : ''}>Motivational</option>
                        <option value="wisdom" ${config.category === 'wisdom' ? 'selected' : ''}>Wisdom</option>
                    </select>
                </label>
                <label>
                    <input type="checkbox" id="configAutoRefreshQuotes" ${config.autoRefresh ? 'checked' : ''}>
                    Auto-refresh quotes
                </label>
            `;
            break;
    }
}

function applyConfig() {
    if (!activeWidget) return;

    // Save configuration based on active widget
    switch(activeWidget) {
        case 'weather':
            widgetConfig = {
                city: document.getElementById('configDefaultCity').value.trim(),
                units: document.getElementById('configUnits').value,
                autoRefresh: document.getElementById('configAutoRefresh').checked
            };
            break;
        case 'pokemon':
            widgetConfig = {
                defaultPokemon: document.getElementById('configDefaultPokemon').value.trim().toLowerCase(),
                showShiny: document.getElementById('configShowShiny').checked,
                showEvolution: document.getElementById('configShowEvolution').checked
            };
            // Update UI immediately if Pokemon is currently displayed
            if (document.getElementById('pokemonDisplay')) {
                const currentPokemon = document.getElementById('pokemonName')?.value || widgetConfig.defaultPokemon;
                loadPokemonData(currentPokemon);
            }
            break;
        case 'space':
            widgetConfig = {
                nasaKey: document.getElementById('configNasaKey').value.trim(),
                dataType: document.getElementById('configSpaceType').value
            };
            break;
        case 'quotes':
            widgetConfig = {
                category: document.getElementById('configQuoteCategory').value,
                autoRefresh: document.getElementById('configAutoRefreshQuotes').checked
            };
            break;
    }

    // Save to localStorage
    localStorage.setItem('widgetConfig', JSON.stringify(widgetConfig));
    
    // Hide config panel
    document.getElementById('widgetConfig').style.display = 'none';
    
    // Refresh the widget to apply changes
    refreshWidget();
}

function resetConfig() {
    // Reset to default configuration
    loadWidgetConfig();
}

function closeWidget() {
    document.getElementById('widgetContainer').style.display = 'none';

    // Clear any auto-refresh intervals
    autoRefreshIntervals.forEach((interval, key) => {
        clearInterval(interval);
    });
    autoRefreshIntervals.clear();

    activeWidget = null;
}

// Dashboard Functions
function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
}

// Widget refresh intervals in milliseconds
const WIDGET_REFRESH_RATES = {
    weather: 300000,    // 5 minutes
    pokemon: 600000,    // 10 minutes
    space: 900000,      // 15 minutes
    quotes: 30000       // 30 seconds
};

/**
 * Adds the currently configured widget to the dashboard
 * @returns {void}
 */
function addWidgetToDashboard() {
    // CONCEPT: Input Validation and Error Prevention
    // LEARNING: Always validate user actions before proceeding
    // UX PRINCIPLE: Provide clear error messages when actions can't be completed
    try {
        // Validate widget type
        const validWidgets = ['weather', 'pokemon', 'space', 'quotes'];
        if (!activeWidget || !validWidgets.includes(activeWidget)) {
            showWidgetError('Please select a valid widget type');
            return;
        }

        // Validate widget configuration based on type
        if (!validateWidgetConfig(activeWidget, widgetConfig)) {
            showWidgetError('Please configure the widget before adding to dashboard');
            return;
        }

        // CONCEPT: Object Creation and Data Structure
        // LEARNING: Create consistent data structures for managing collections
        const widget = {
            id: `widget-${Date.now()}`,          // Unique identifier with prefix
            type: activeWidget,                  // Widget type (weather, pokemon, etc.)
            title: getWidgetTitle(activeWidget),  // Display title
            config: { ...widgetConfig },         // Deep copy of current configuration
            timestamp: new Date().toISOString(), // When widget was added
            refreshRate: WIDGET_REFRESH_RATES[activeWidget] || 30000 // Default refresh rate
        };

        // Check for duplicate widgets (optional, can be removed if duplicates are allowed)
        const isDuplicate = dashboardWidgets.some(
            w => w.type === widget.type && 
                JSON.stringify(w.config) === JSON.stringify(widget.config)
        );
        
        if (isDuplicate) {
            showWidgetError('This widget configuration already exists in the dashboard');
            return;
        }

        // CONCEPT: Array Management and State Updates
        dashboardWidgets.push(widget);
        
        // Save to localStorage for persistence
        saveDashboardToStorage();
        
        // Update UI
        renderDashboard();
        showDashboard();
        
        // Show success message
        showWidgetSuccess(`${widget.title} added to dashboard!`);
        
        // Log for debugging
        console.log('Widget added:', widget);
        console.log('Current dashboard widgets:', dashboardWidgets);

    } catch (error) {
        console.error('Error adding widget to dashboard:', error);
        showWidgetError('Failed to add widget to dashboard. Please try again.');
    }
}

/**
 * Validates widget configuration based on widget type
 * @param {string} widgetType - Type of the widget
 * @param {Object} config - Configuration object to validate
 * @returns {boolean} - True if configuration is valid
 */
function validateWidgetConfig(widgetType, config) {
    switch (widgetType) {
        case 'weather':
            return config.city && typeof config.city === 'string';
        case 'pokemon':
            return config.pokemonName && typeof config.pokemonName === 'string';
        case 'space':
            return config.dataType && ['apod', 'mars', 'neo'].includes(config.dataType);
        case 'quotes':
            return true; // No specific validation needed for quotes
        default:
            return false;
    }
}

/**
 * Saves the current dashboard state to localStorage
 */
function saveDashboardToStorage() {
    try {
        localStorage.setItem('dashboardWidgets', JSON.stringify(dashboardWidgets));
    } catch (error) {
        console.error('Error saving dashboard to localStorage:', error);
    }
}

/**
 * Loads dashboard state from localStorage
 */
function loadDashboardFromStorage() {
    try {
        const savedWidgets = localStorage.getItem('dashboardWidgets');
        if (savedWidgets) {
            dashboardWidgets = JSON.parse(savedWidgets);
            renderDashboard();
        }
    } catch (error) {
        console.error('Error loading dashboard from localStorage:', error);
    }
}

// Load saved widgets when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardFromStorage();
});

// TODO 5: Dashboard Layout Management (Hard)
// LEARNING GOAL: Dynamic UI generation and array-based rendering
// SUCCESS CRITERIA:
//   - Render all widgets from dashboardWidgets array
//   - Each widget displays with correct title and remove button
//   - Empty state message shows when no widgets are added
//   - Mini-widget placeholders are initialized after rendering
// DEBUGGING TIP: Use console.log(dashboardWidgets) to inspect the widget array
// HINT: Use .map() to transform widget objects into HTML strings, then .join('') to combine
// WATCH OUT: Each widget needs a unique data-widget-id for removal functionality
// EXTENSION: Add drag-and-drop to reorder widgets in the dashboard
function renderDashboard() {
    const grid = document.getElementById('dashboardGrid');

    if (dashboardWidgets.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No widgets added yet. Configure a widget and click "Add to Dashboard".</p>';
        return;
    }

    grid.innerHTML = dashboardWidgets.map(widget => `
        <div class="dashboard-widget" data-widget-id="${widget.id}">
            <button class="remove-widget" onclick="removeFromDashboard(${widget.id})">×</button>
            <h3>${widget.title}</h3>
            <div class="mini-widget" id="mini-${widget.id}">
                Loading...
            </div>
        </div>
    `).join('');

    // Initialize mini widgets
    dashboardWidgets.forEach(widget => {
        initializeMiniWidget(widget);
    });
}

function removeFromDashboard(widgetId) {
    dashboardWidgets = dashboardWidgets.filter(w => w.id !== widgetId);
    renderDashboard();
}

function clearDashboard() {
    dashboardWidgets = [];
    renderDashboard();
}

function exportDashboard() {
    const data = {
        widgets: dashboardWidgets,
        exported: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'widget-dashboard.json';
    a.click();

    URL.revokeObjectURL(url);
}

function initializeMiniWidget(widget) {
    const container = document.getElementById(`mini-${widget.id}`);

    // Create simplified version of each widget for dashboard
    switch(widget.type) {
        case 'weather':
            container.innerHTML = '<div style="text-align: center; padding: 10px;">🌤️<br>Weather<br><small>London</small></div>';
            break;
        case 'pokemon':
            container.innerHTML = '<div style="text-align: center; padding: 10px;">🔴<br>Pokemon<br><small>Pikachu</small></div>';
            break;
        case 'space':
            container.innerHTML = '<div style="text-align: center; padding: 10px;">🚀<br>Space<br><small>APOD</small></div>';
            break;
        case 'quotes':
            container.innerHTML = '<div style="text-align: center; padding: 10px;">💭<br>Quotes<br><small>Inspirational</small></div>';
            break;
    }
}

// Utility Functions
function showWidgetError(message) {
    const content = document.getElementById('widgetContent');
    content.innerHTML = `
        <div class="error">
            <h3>Widget Error</h3>
            <p>${message}</p>
            <button onclick="refreshWidget()" class="btn btn-primary">Try Again</button>
        </div>
    `;
}

// Simulate APIs for demo purposes
async function simulateWeatherAPI(city) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const cities = {
        'london': { name: 'London', country: 'GB', temp: 15, feelsLike: 13, humidity: 72, windSpeed: 3.2, pressure: 1013, description: 'partly cloudy' },
        'paris': { name: 'Paris', country: 'FR', temp: 18, feelsLike: 16, humidity: 65, windSpeed: 2.8, pressure: 1015, description: 'clear sky' },
        'tokyo': { name: 'Tokyo', country: 'JP', temp: 22, feelsLike: 24, humidity: 58, windSpeed: 4.1, pressure: 1009, description: 'light rain' },
        'new york': { name: 'New York', country: 'US', temp: 12, feelsLike: 10, humidity: 68, windSpeed: 5.2, pressure: 1012, description: 'overcast clouds' }
    };

    const cityData = cities[city.toLowerCase()] || {
        name: city,
        country: 'Unknown',
        temp: Math.floor(Math.random() * 30) + 5,
        feelsLike: Math.floor(Math.random() * 30) + 5,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 10) + 1,
        pressure: Math.floor(Math.random() * 50) + 990,
        description: 'clear sky'
    };

    return cityData;
}

// Load sample widgets for demonstration
function loadSampleWidgets() {
    // This could pre-load some example widgets
    console.log('Sample widgets loaded');
}

// Export functions for global access
window.loadWidget = loadWidget;
window.refreshWidget = refreshWidget;
window.customizeWidget = customizeWidget;
window.closeWidget = closeWidget;
window.updateWeather = updateWeather;
window.searchPokemon = searchPokemon;
window.randomPokemon = randomPokemon;
window.toggleShiny = toggleShiny;
window.toggleStats = toggleStats;
window.updateSpaceData = updateSpaceData;
window.refreshSpaceData = refreshSpaceData;
window.updateQuotes = updateQuotes;
window.getNewQuote = getNewQuote;
window.toggleAutoRefresh = toggleAutoRefresh;
window.applyConfig = applyConfig;
window.resetConfig = resetConfig;
window.addWidgetToDashboard = addWidgetToDashboard;
window.removeFromDashboard = removeFromDashboard;
window.clearDashboard = clearDashboard;
window.exportDashboard = exportDashboard;

/*
========================================================================================
STUDENT INSTRUCTIONS: API Widget Builder Challenge
========================================================================================

OVERVIEW:
This activity teaches you how to build a modular widget system that integrates multiple
APIs into a customizable dashboard. You'll learn component-based architecture, state
management, and how to coordinate multiple data sources in a single application.

WHAT'S ALREADY WORKING (65-70% COMPLETE):
✅ Widget loading system with templates
✅ Four different widgets (Weather, Pokemon, Space, Quotes)
✅ All API fetch functions are implemented
✅ Display functions for showing data
✅ Basic styling and layout

YOUR TASKS (30-35% TO COMPLETE):

========================================================================================
TODO 1: Basic Widget Initialization (Easy) - 15 minutes
========================================================================================
LOCATION: Line 115 - initializeWidget() function

WHAT YOU'LL LEARN:
- How to initialize different widget types with default data
- Using switch statements for multi-option logic
- Async/await patterns for sequential operations

SUCCESS CRITERIA:
✓ All four widget types load with their default data
✓ Weather widget shows London weather
✓ Pokemon widget shows Pikachu
✓ Space widget shows Astronomy Picture of the Day
✓ Quotes widget shows a random inspirational quote

TESTING STEPS:
1. Click each widget button in the Widget Library
2. Verify default data loads correctly
3. Check browser console for any initialization errors
4. Try clicking widgets multiple times

DEBUGGING TIPS:
- Open Developer Tools (F12) → Console tab
- Look for error messages during widget initialization
- Use console.log(widgetType) to see which widget is being loaded
- Verify that helper functions (loadWeatherData, etc.) are called

========================================================================================
TODO 2: Widget Configuration System (Medium) - 20 minutes
========================================================================================
LOCATION: Line 505 - loadWidgetConfig() function

WHAT YOU'LL LEARN:
- Dynamic HTML generation based on application state
- Creating different UI controls (inputs, selects, checkboxes)
- Designing user-friendly configuration interfaces

SUCCESS CRITERIA:
✓ Configuration panel appears when clicking "Customize" button
✓ Each widget type shows appropriate configuration options
✓ Weather widget offers units selection (Celsius/Fahrenheit)
✓ Pokemon widget has display options (shiny, stats)
✓ All input elements have correct IDs for later reference

TESTING STEPS:
1. Load a widget (e.g., Weather widget)
2. Click the "Customize" button
3. Verify configuration controls appear
4. Switch to different widgets and check their config options
5. Inspect HTML to verify input IDs are correct

DEBUGGING TIPS:
- Check that activeWidget variable is set correctly
- Use console.log(activeWidget) before the switch statement
- Verify configControls element exists: console.log(configControls)
- Test with all four widget types

========================================================================================
TODO 3: Multi-API Integration (Hard) - 30 minutes
========================================================================================
LOCATION: Line 230 - loadPokemonData() function

WHAT YOU'LL LEARN:
- Integrating with real-world APIs (PokeAPI)
- Handling different response formats
- Error handling for network failures and invalid data
- Parsing complex JSON structures

SUCCESS CRITERIA:
✓ Successfully fetch Pokemon data using name or ID
✓ Display Pokemon sprite image
✓ Show Pokemon stats (HP, Attack, Defense, etc.)
✓ Handle errors gracefully (invalid Pokemon names)
✓ Support both shiny and normal forms

API ENDPOINTS:
- PokeAPI Base: https://pokeapi.co/api/v2/pokemon
- Get Pokemon by name: https://pokeapi.co/api/v2/pokemon/pikachu
- Get Pokemon by ID: https://pokeapi.co/api/v2/pokemon/25

TESTING STEPS:
1. Load Pokemon widget and verify "pikachu" appears
2. Search for "charizard" - should show fire Pokemon
3. Try searching by ID: "25" should show Pikachu
4. Test error handling: search "zzz" (invalid Pokemon)
5. Toggle "Show Shiny" checkbox and verify sprite changes

DEBUGGING TIPS:
- Log the full API response: console.log(pokemon)
- Check response.ok before parsing JSON
- Verify sprite URLs: console.log(pokemon.sprites.front_default)
- Test with these valid Pokemon: pikachu, charizard, bulbasaur, eevee
- Test with these IDs: 1, 25, 150 (Bulbasaur, Pikachu, Mewtwo)

COMMON ERRORS:
- "Pokemon not found" → Check spelling or try a different name
- "Cannot read property 'sprites'" → API response may be malformed
- Network error → Check internet connection

========================================================================================
TODO 4: Widget Communication & Events (Medium) - 25 minutes
========================================================================================
LOCATION: Line 479 - toggleAutoRefresh() function

WHAT YOU'LL LEARN:
- Using JavaScript intervals for periodic tasks
- Managing interval IDs to prevent memory leaks
- Event-driven programming with checkboxes
- Map data structure for storing interval references

SUCCESS CRITERIA:
✓ Auto-refresh checkbox toggles periodic updates
✓ Quotes refresh every 30 seconds when enabled
✓ Interval stops cleanly when checkbox is unchecked
✓ No memory leaks from orphaned intervals

TESTING STEPS:
1. Load the Quotes widget
2. Enable "Auto-refresh" checkbox
3. Watch quotes change every 30 seconds
4. Disable checkbox and verify updates stop
5. Re-enable and verify it works again
6. Check console for interval creation/cleanup logs

DEBUGGING TIPS:
- Log interval creation: console.log('Interval created:', interval)
- Log interval cleanup: console.log('Interval cleared')
- Check autoRefreshIntervals Map: console.log(autoRefreshIntervals)
- Verify only one interval exists at a time
- Use setInterval documentation: https://developer.mozilla.org/en-US/docs/Web/API/setInterval

EXTENSION CHALLENGE:
- Add different refresh rates for different widgets
- Weather: 5 minutes (300000ms)
- Quotes: 30 seconds (30000ms)
- Space: 1 hour (3600000ms)

========================================================================================
TODO 5: Dashboard Layout Management (Hard) - 30 minutes
========================================================================================
LOCATION: Line 654 - renderDashboard() function

WHAT YOU'LL LEARN:
- Array-based rendering patterns
- Dynamic HTML generation with .map() and .join()
- Managing collections of UI components
- Event delegation and data attributes

SUCCESS CRITERIA:
✓ Dashboard displays all added widgets in a grid layout
✓ Each widget shows correct title and icon
✓ Remove button (×) works for each widget
✓ Empty state message when no widgets are added
✓ Dashboard updates automatically when widgets are added/removed

TESTING STEPS:
1. Configure a Weather widget and click "Add to Dashboard"
2. Verify widget appears in the dashboard grid
3. Add more widgets (Pokemon, Space, Quotes)
4. Click the × button to remove a widget
5. Remove all widgets and verify empty state message
6. Click "Export Dashboard" to test JSON export

DEBUGGING TIPS:
- Log dashboardWidgets array: console.log(dashboardWidgets)
- Verify each widget has unique ID: console.log(widget.id)
- Check grid innerHTML after rendering
- Test with 1, 3, and 6+ widgets to see grid behavior
- Inspect data-widget-id attributes in DevTools

ADVANCED DEBUGGING:
- Use Array.map() documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
- Template literals guide: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals

========================================================================================
LEARNING PATH (Recommended Order):
========================================================================================

BEGINNER (Start Here):
1. Complete TODO 1 first - it's the easiest and gets widgets working
2. Test all four widget types to understand the system
3. Read through existing code to see patterns

INTERMEDIATE:
4. Complete TODO 2 to add configuration controls
5. Complete TODO 4 to add auto-refresh functionality
6. Experiment with different configuration options

ADVANCED:
7. Complete TODO 3 for real API integration
8. Complete TODO 5 for dashboard management
9. Try the extension challenges below

========================================================================================
EXTENSION CHALLENGES (For Advanced Students):
========================================================================================

🌟 CHALLENGE 1: Add a fifth widget type
- Choose an API from this list: https://github.com/public-apis/public-apis
- Create a new widget template in HTML
- Add API integration in script.js
- Add configuration options

🌟 CHALLENGE 2: Widget persistence
- Save dashboard layout to localStorage
- Load saved widgets on page refresh
- Add "Load Saved Dashboard" button

🌟 CHALLENGE 3: Widget customization
- Allow users to resize widgets
- Add color theme options (dark mode, light mode)
- Create widget presets (News Dashboard, Gaming Dashboard, etc.)

🌟 CHALLENGE 4: Advanced API features
- Add pagination for Pokemon list (previous/next buttons)
- Show 7-day weather forecast instead of current weather
- Display multiple Mars rover photos in a carousel

🌟 CHALLENGE 5: Dashboard analytics
- Track which widgets are used most
- Show "Most Popular Widget" badge
- Add usage statistics to dashboard

========================================================================================
API DOCUMENTATION:
========================================================================================

WEATHER API (Simulated):
- This activity uses simulated weather data for offline testing
- Production version would use: https://openweathermap.org/api
- Cities available: London, Paris, Tokyo, New York

POKEMON API (Real - No Key Required):
- Base URL: https://pokeapi.co/api/v2
- Documentation: https://pokeapi.co/docs/v2
- No rate limits for reasonable usage
- Returns JSON with sprites, stats, types, abilities

NASA API (Simulated):
- This activity uses simulated NASA data
- Production version would use: https://api.nasa.gov/
- Requires free API key from NASA
- Available data: APOD, Mars Rover, Near Earth Objects

QUOTES API (Simulated):
- This activity uses predefined quotes
- Production version could use: https://quotable.io/
- No authentication required
- Returns random inspirational quotes

========================================================================================
SUCCESS CRITERIA FOR COMPLETION:
========================================================================================

✅ ALL 5 TODOs COMPLETED
✅ All four widget types load and display correctly
✅ Configuration panel works for all widgets
✅ Pokemon widget fetches real data from PokeAPI
✅ Auto-refresh toggles on/off properly
✅ Dashboard displays multiple widgets in a grid
✅ Remove widget functionality works
✅ Export dashboard creates valid JSON file
✅ No console errors during normal operation
✅ Code is well-commented with your own notes

========================================================================================
DEBUGGING CHECKLIST (If Something Goes Wrong):
========================================================================================

❌ Widget won't load:
   → Check browser console for errors
   → Verify widget template exists in HTML
   → Check that loadWidget() is called correctly

❌ API fetch fails:
   → Check internet connection
   → Verify API endpoint URL is correct
   → Look for CORS errors in console
   → Test API URL directly in browser

❌ Configuration not working:
   → Verify configControls element exists
   → Check that input IDs match what applyConfig() expects
   → Use console.log to debug switch statement

❌ Dashboard not rendering:
   → Check dashboardWidgets array length
   → Verify renderDashboard() is called after adding widgets
   → Inspect HTML to see if grid element exists

❌ Auto-refresh not stopping:
   → Check that clearInterval() is called with correct ID
   → Verify interval is removed from autoRefreshIntervals Map
   → Test with console.log to track interval lifecycle

========================================================================================
FINAL TIPS:
========================================================================================

📚 READ THE CODE FIRST
   Before making changes, read through the entire file to understand the structure

🧪 TEST INCREMENTALLY
   Complete one TODO, test it thoroughly, then move to the next

💬 USE CONSOLE.LOG LIBERALLY
   Add console.log statements to understand data flow

🔍 INSPECT THE DOM
   Use browser DevTools to inspect generated HTML

📖 REFERENCE THE DOCS
   Check MDN Web Docs when you encounter unfamiliar concepts

🤝 ASK FOR HELP
   If stuck for more than 15 minutes, ask your instructor

🎉 CELEBRATE PROGRESS
   Each working TODO is an achievement - you're building something complex!

========================================================================================
HAVE FUN BUILDING YOUR WIDGET DASHBOARD!
========================================================================================
*/