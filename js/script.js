const apiUrl = 'https://pokeapi.co/api/v2/'

const allPokemonData = [];

let typeFilterActive = 'all';

const listPokemon = document.getElementById('listPokemon');
const inputFilter = document.getElementById('inputFilter');
const typeFilter = document.getElementById('typeFilter');
const messageResult = document.getElementById('messageId');
const modalBody = document.getElementById('modalBody');
const loaderPage = document.getElementById('loaderPage');
const scrollToTopBtn = document.getElementById('scrollToTop');

async function getAllPokemon() {
    const pokemonPromises = [];

    for (let i = 1; i <= 1010; i++) {
        const url = `${apiUrl}pokemon/${i}`;
        pokemonPromises.push(fetch(url).then(response => response.json()));
    }

    return Promise.all(pokemonPromises);
}

async function getPokemonById(pokemonId) {
    const response = await fetch(`${apiUrl}pokemon/${pokemonId}`);
    return response.json();
}

async function getEvolutions(pokemonSpeciesUrl) {
    try {
        const speciesResponse = await fetch(pokemonSpeciesUrl);
        const speciesData = await speciesResponse.json();

        const evolutionChainUrl = speciesData.evolution_chain.url;
        const evolutionChainResponse = await fetch(evolutionChainUrl);
        const evolutionChainData = await evolutionChainResponse.json();

        const evolutions = [];

        const processEvolutions = async (evolutionDetails) => {
            const id = evolutionDetails.species.url.split('/').slice(-2, -1)[0];
            const pokemonResponse = await fetch(`${apiUrl}pokemon/${id}`);
            const pokemonData = await pokemonResponse.json();
            const types = pokemonData.types.map(type => type.type.name);
            evolutions.push({
                id,
                name: evolutionDetails.species.name,
                types,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
            });

            for (const evolution of evolutionDetails.evolves_to) {
                await processEvolutions(evolution);
            }
        };

        await processEvolutions(evolutionChainData.chain);
        return evolutions;
    } catch (error) {
        console.error(error.message);
    }
}

function createPokemonCard(pokemon) {
    const pokemonImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    const types = pokemon.types.map(type => `<span class="badge ${type.type.name}">${type.type.name}</span>`).join('');
    const pokemonId = pokemon.id.toString().padStart(3, '0');

    const card = document.createElement('div');
    card.classList.add('col-md-4', 'mb-4');
    card.innerHTML = `
    <div class="card pokemon-card">
        <img src="${pokemonImage}" class="pokemon-image" alt="${pokemon.name}" loading="lazy">
        <div class="card-body">
            <p class="badge pokemon-id">#${pokemonId}</p>
            <h3 class="pokemon-name">${pokemon.name}</h3>
            <p class="pokemon-types">${types}</p>
        </div>
    </div>
  `;

    card.addEventListener('click', () => {
        openPokemonDetails(pokemon);
    });

    listPokemon.appendChild(card);
}

async function openPokemonDetails(pokemon) {
    try {
        const pokemonImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
        const types = pokemon.types.map(type => `<span class="badge ${type.type.name}">${type.type.name}</span>`).join('');
        const pokemonId = pokemon.id.toString().padStart(3, '0');
        const pokemonWeight = parseFloat(pokemon.weight / 10).toFixed(1);
        const pokemonHeight = parseFloat(pokemon.height / 10).toFixed(1);
        const totalStats = pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);

        const evolutions = await getEvolutions(pokemon.species.url);

        const evolutionCards = evolutions.map(evolution => {
            const evolutionTypes = evolution.types.map(type => `<span class="badge ${type}">${type}</span>`).join('');
            return `
                <div class="col-md-4 mb-4">
                    <div class="modal-card d-flex flex-column align-items-center" data-bs-toggle="modal" data-bs-target="#pokemonModal" onclick="openEvolutionDetails('${evolution.id}')">
                        <img class="evolutions-image" src="${evolution.image}" alt="${evolution.name}" loading="lazy">
                        <div class="card-body">
                            <p class="badge evolutions-id">#${evolution.id.toString().padStart(3, '0')}</p>
                            <h3 class="evolutions-name">${evolution.name}</h3>
                            <p class="evolutions-types">${evolutionTypes}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        const evolutionMessage = evolutions.length <= 1 ? '<p class="no-evolutions">This pokemon does not evolve</p>' : '';

        const evolutionsBody = `
            <div class="container">
                <div class="row justify-content-center">
                    ${evolutionMessage}
                    ${evolutionCards.join('')}
                </div>
            </div>
        `;

        const pokemonExperience = pokemon.base_experience !== null ? pokemon.base_experience : 'not';

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <img src="${pokemonImage}" alt="${pokemon.name}" class="modal-pokemon-image" loading="lazy">
                    <div class="card-body">
                        <p class="badge modal-pokemon-id">#${pokemonId}</p>
                        <h3 class="modal-pokemon-name">${pokemon.name}</h3>
                        <p class="modal-pokemon-types">${types}</p>
                    </div>
                    <table class="stats-table mt-3">
                        <thead>
                            <tr>
                                <th class="stat-base"><i class="fa-regular fa-life-ring"></i></strong> ${pokemonWeight} Kg</th>
                                <th class="stat-base"><i class="fa-regular fa-chart-bar"></i></strong> ${pokemonHeight} M</th>
                                <th class="stat-base"><i class="fas fa-chart-line"></i></strong> ${pokemonExperience} Exp</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Weight</td>
                                <td>Height</td>
                                <td>Experience</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-md-7">
                    <h6 class="modal-title mt-3 mb-2">Stats</h6>
                    <table class="stats-table">
                        <tbody>
                            <tr>
                                <td class="td-bottom stat-name">HP</td>
                                <td class="td-bottom stat-progress">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated grass progress-bar-label" role="progressbar" style="width: ${pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat}%;" aria-valuenow="${pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat}" aria-valuemin="0" aria-valuemax="100">${pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="td-bottom stat-name">Attack</td>
                                <td class="td-bottom stat-progress">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated fighting progress-bar-label" role="progressbar" style="width: ${pokemon.stats.find(stat => stat.stat.name === 'attack').base_stat}%;" aria-valuenow="${pokemon.stats.find(stat => stat.stat.name === 'attack').base_stat}" aria-valuemin="0" aria-valuemax="100">${pokemon.stats.find(stat => stat.stat.name === 'attack').base_stat}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="td-bottom stat-name">Defense</td>
                                <td class="td-bottom stat-progress">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated electric progress-bar-label" role="progressbar" style="width: ${pokemon.stats.find(stat => stat.stat.name === 'defense').base_stat}%;" aria-valuenow="${pokemon.stats.find(stat => stat.stat.name === 'defense').base_stat}" aria-valuemin="0" aria-valuemax="100">${pokemon.stats.find(stat => stat.stat.name === 'defense').base_stat}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="td-bottom stat-name">Sp. Attack</td>
                                <td class="td-bottom stat-progress">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated water progress-bar-label" role="progressbar" style="width: ${pokemon.stats.find(stat => stat.stat.name === 'special-attack').base_stat}%;" aria-valuenow="${pokemon.stats.find(stat => stat.stat.name === 'special-attack').base_stat}" aria-valuemin="0" aria-valuemax="100">${pokemon.stats.find(stat => stat.stat.name === 'special-attack').base_stat}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="td-bottom stat-name">Sp. Defense</td>
                                <td class="td-bottom stat-progress">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated fire progress-bar-label" role="progressbar" style="width: ${pokemon.stats.find(stat => stat.stat.name === 'special-defense').base_stat}%;" aria-valuenow="${pokemon.stats.find(stat => stat.stat.name === 'special-defense').base_stat}" aria-valuemin="0" aria-valuemax="100">${pokemon.stats.find(stat => stat.stat.name === 'special-defense').base_stat}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="td-bottom stat-name">Speed</td>
                                <td class="td-bottom stat-progress">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated psychic progress-bar-label" role="progressbar" style="width: ${pokemon.stats.find(stat => stat.stat.name === 'speed').base_stat}%;" aria-valuenow="${pokemon.stats.find(stat => stat.stat.name === 'speed').base_stat}" aria-valuemin="0" aria-valuemax="100">${pokemon.stats.find(stat => stat.stat.name === 'speed').base_stat}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="td-bottom stat-name">Total</td>
                                <td class="td-bottom stat-progress">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated ghost progress-bar-label" role="progressbar" style="width: ${totalStats}%;" aria-valuenow="${totalStats}" aria-valuemin="0" aria-valuemax="100">${totalStats}</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-md-12">
                    <h6 class="modal-title mt-3 mb-2">Evolutions</h6>
                        ${evolutionsBody}
                    </div>
                </div>
            </div>
        `;

        const pokemonModal = new bootstrap.Modal(document.getElementById('pokemonModal'));
        pokemonModal.show();
  } catch (error) {
    console.error(error.message);
  }
}

async function openEvolutionDetails(evolutionId) {
    try {
        const evolutionData = await getPokemonById(evolutionId);
        openPokemonDetails(evolutionData);
    } catch (error) {
        console.error(error.message);
    }
}

function filterByPokemon() {
    const filterValue = inputFilter.value.toLowerCase().trim();

    listPokemon.innerHTML = '';
    let foundPokemon = false;

    for (const pokemon of allPokemonData) {
        const pokemonName = pokemon.name.toLowerCase();
        const pokemonId = pokemon.id.toString();

        if ((pokemonName.startsWith(filterValue) || pokemonId.startsWith(filterValue)) && 
           (typeFilterActive === 'all' || typeMatch(pokemon, typeFilterActive))) {
            createPokemonCard(pokemon);
            foundPokemon = true;
        }
    }
    if (!foundPokemon) {
        messageResult.innerHTML = '<img class="pokedex-image text-uppercase" src="img/pokemon-not-found.png" alt="Pokemon not found">';
        messageResult.style.display = 'block';
    } else {
        messageResult.style.display = 'none';
    }
}

function filterByType(type) {
    typeFilterActive = type;
    filterByPokemon();
}

function typeMatch(pokemon, typeFilter) {
    return pokemon.types.some(type => type.type.name === typeFilter);
}

function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

function scrollToTopButton() {

    function toggleScrollButton() {
        const shouldDisplay = window.scrollY > 1000;
        scrollToTopBtn.style.display = shouldDisplay ? 'block' : 'none';
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    scrollToTopBtn.addEventListener('click', scrollToTop);
    window.addEventListener('scroll', toggleScrollButton);
    toggleScrollButton();
}

async function initApp() {
    try {
        loaderPage.style.display = 'block';

        const pokemonDataArray = await getAllPokemon();
        allPokemonData.push(...pokemonDataArray);

        loaderPage.style.display = 'none';

        inputFilter.addEventListener('input', filterByPokemon);
        typeFilter.addEventListener('change', filterByPokemon);

        filterByPokemon();
    } catch (error) {
        console.error(error.message);
    }
}

initApp();
scrollToTopButton();