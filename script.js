// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- API Configuration ---
    const cocktailApiBaseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/';

    // --- DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const randomButton = document.getElementById('random-button');
    const cocktailDisplayDiv = document.getElementById('cocktail-display');

    // --- Helper Functions ---

    /**
     * Fetches data from TheCocktailDB API.
     * @param {string} url - The full API endpoint URL.
     * @returns {Promise<object|null>} - A promise that resolves with the first drink object or null if none found.
     * @throws {Error} - Throws an error if the fetch fails or API returns an error structure.
     */
    async function fetchCocktailData(url) {
        console.log("Fetching URL:", url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            // The API returns { drinks: null } if no cocktail is found
            if (!data.drinks) {
                return null; // Indicate no results found
            }
            // Return the first drink object from the 'drinks' array
            return data.drinks[0];
        } catch (error) {
            console.error("Cocktail Fetch error:", error);
            throw error; // Re-throw to be caught by calling function
        }
    }

    /**
     * Displays cocktail data in the designated div.
     * @param {object|null} drink - The drink object from the API, or null if not found.
     */
    function displayCocktail(drink) {
        if (!cocktailDisplayDiv) return;

        if (!drink) {
            cocktailDisplayDiv.innerHTML = '<p class="error-text">No se encontró ningún cóctel con ese nombre.</p>';
            return;
        }

        // Build ingredients list
        let ingredientsHtml = '<ul>';
        for (let i = 1; i <= 15; i++) { // Check up to 15 ingredients
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];

            // Stop if ingredient is null or empty
            if (!ingredient) break;

            ingredientsHtml += `<li>${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}</li>`;
        }
        ingredientsHtml += '</ul>';

        // Construct HTML for display
        cocktailDisplayDiv.innerHTML = `
            <h3>${drink.strDrink}</h3>
            <img src="${drink.strDrinkThumb}" alt="[Imagen de ${drink.strDrink}]" onerror="this.style.display='none'">
            ${drink.strCategory ? `<p><strong>Categoría:</strong> ${drink.strCategory}</p>` : ''}
            ${drink.strAlcoholic ? `<p><strong>Tipo:</strong> ${drink.strAlcoholic}</p>` : ''}
            ${drink.strGlass ? `<p><strong>Vaso recomendado:</strong> ${drink.strGlass}</p>` : ''}

            <h4>Ingredientes:</h4>
            ${ingredientsHtml}

            <h4>Instrucciones:</h4>
            <p>${drink.strInstructions || 'Instrucciones no disponibles.'}</p>
        `;
    }

     /**
     * Displays an error message in the cocktail display area.
     * @param {string} message - The error message.
     */
    function displayError(message) {
        if (cocktailDisplayDiv) {
            cocktailDisplayDiv.innerHTML = `<p class="error-text">${message}</p>`;
        }
    }

     /**
     * Displays loading state in the cocktail display area.
      * @param {string} [message='Cargando...'] - Optional loading message.
     */
    function displayLoading(message = 'Cargando...') {
         if (cocktailDisplayDiv) {
            cocktailDisplayDiv.innerHTML = `<p class="loading-text">${message}</p>`;
         }
    }

    /**
     * Fetches a random cocktail and displays it.
     */
    async function fetchAndDisplayRandomCocktail() {
        displayLoading('Buscando un cóctel aleatorio...');
        try {
            const drink = await fetchCocktailData(`${cocktailApiBaseUrl}random.php`);
            displayCocktail(drink);
        } catch (error) {
            displayError(`Error al cargar cóctel aleatorio: ${error.message}`);
        }
    }

    /**
     * Searches for a cocktail by name and displays it.
     */
    async function searchAndDisplayCocktail() {
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            displayError('Por favor, introduce un nombre de cóctel para buscar.');
            return; // Don't search if input is empty
        }

        displayLoading(`Buscando "${searchTerm}"...`);
        try {
            const drink = await fetchCocktailData(`${cocktailApiBaseUrl}search.php?s=${encodeURIComponent(searchTerm)}`);
            displayCocktail(drink); // displayCocktail handles the null case (not found)
        } catch (error) {
             displayError(`Error al buscar cóctel: ${error.message}`);
        }
    }


    // --- Event Listeners ---
    if (searchButton) {
        searchButton.addEventListener('click', searchAndDisplayCocktail);
    }

    if (searchInput) {
        // Allow searching by pressing Enter in the input field
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                searchAndDisplayCocktail();
            }
        });
    }

    if (randomButton) {
        randomButton.addEventListener('click', fetchAndDisplayRandomCocktail);
    }

    // --- Initial Data Load ---
    //fetchAndDisplayRandomCocktail(); // Load a random cocktail when the page loads

    // --- Category Functions ---

    /**
     * Fetches all cocktail categories from the API.
     * @returns {Promise<Array<object>|null>} - A promise that resolves with an array of category objects, or null if an error occurs.
     */
    async function fetchCocktailCategories() {
        try {
            const response = await fetch(`${cocktailApiBaseUrl}list.php?c=list`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.drinks) {
                return null; // Indicate no results found
            }
            return data.drinks;
        } catch (error) {
            console.error("Category Fetch error:", error);
            displayError(`Error al cargar las categorías: ${error.message}`);
            return null;
        }
    }

    /**
     * Displays cocktail categories as clickable cards.
     * @param {Array<object>} categories - Array of category objects.
     */
    function displayCategories(categories) {
        const categoriesDisplayDiv = document.getElementById('categories-display');
        if (!categoriesDisplayDiv) return;

        if (!categories || categories.length === 0) {
            categoriesDisplayDiv.innerHTML = '<p class="error-text">No se encontraron categorías.</p>';
            return;
        }

        let categoriesHtml = '';
        categories.forEach(category => {
            const categoryName = category.strCategory;
            categoriesHtml += `
                <div class="category-card m-2 p-4 bg-white rounded-lg shadow-md cursor-pointer hover:bg-teal-100"
                     data-category="${categoryName}"
                     style="width: 150px; text-align: center;">
                    ${categoryName}
                </div>
            `;
        });
        categoriesDisplayDiv.innerHTML = categoriesHtml;

        // Add event listeners to category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', function() {
                const category = this.dataset.category;
                // Clear the cocktail display
                cocktailDisplayDiv.innerHTML = '';
                fetchAndDisplayCocktailsByCategory(category);
            });
        });
    }

    /**
     * Fetches cocktails by category and displays them.
     * @param {string} category - The cocktail category to fetch.
     */
    async function fetchAndDisplayCocktailsByCategory(category) {
        displayLoading(`Cargando cócteles de la categoría "${category}"...`);
        try {
            const response = await fetch(`${cocktailApiBaseUrl}filter.php?c=${encodeURIComponent(category)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.drinks) {
                cocktailDisplayDiv.innerHTML = `<p class="error-text">No se encontraron cócteles en la categoría "${category}".</p>`;
                return;
            }

            let cocktailsHtml = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">';
            data.drinks.forEach(drink => {
                cocktailsHtml += `
                    <div class="cocktail-item m-2 p-4 bg-white rounded-lg shadow-md text-center cursor-pointer" data-drink-id="${drink.idDrink}">
                        <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" style="max-width: 150px; height: auto; margin: 0 auto;">
                        <h3 class="text-lg font-semibold">${drink.strDrink}</h3>
                    </div>
                `;
            });
            cocktailsHtml += '</div>';
            cocktailDisplayDiv.innerHTML = cocktailsHtml;

            // Add event listeners to cocktail items
            document.querySelectorAll('.cocktail-item').forEach(item => {
                item.addEventListener('click', function() {
                    const drinkId = this.dataset.drinkId;
                    fetchAndDisplayCocktailDetails(drinkId);
                });
            });
        } catch (error) {
            displayError(`Error al cargar cócteles de la categoría "${category}": ${error.message}`);
        }
    }

    /**
     * Fetches and displays the details of a specific cocktail.
     * @param {string} drinkId - The ID of the cocktail to fetch.
     */
    async function fetchAndDisplayCocktailDetails(drinkId) {
        displayLoading('Cargando detalles del cóctel...');
        try {
            const drink = await fetchCocktailData(`${cocktailApiBaseUrl}lookup.php?i=${encodeURIComponent(drinkId)}`);
            displayCocktail(drink);
        } catch (error) {
            displayError(`Error al cargar detalles del cóctel: ${error.message}`);
        }
    }

    // --- Initial Category Load ---
    async function initializeCategories() {
        const categories = await fetchCocktailCategories();
        displayCategories(categories);
    }

    initializeCategories();

});
