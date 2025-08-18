// TMDB API Configuration
<script src="config.js"></script>
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const moviesGrid = document.getElementById('moviesGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const sectionTitle = document.getElementById('sectionTitle');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('movieModal');
const closeModal = document.querySelector('.close');

// State
let currentCategory = 'trending';
let searchTimeout;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadMovies('trending');
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', handleSearchInput);
    searchBtn.addEventListener('click', () => searchMovies(searchInput.value));
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Load movies for selected category
            currentCategory = e.target.dataset.category;
            searchInput.value = '';
            loadMovies(currentCategory);
        });
    });
    
    // Modal events
    closeModal.addEventListener('click', closeMovieModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMovieModal();
        }
    });
    
    // Enter key for search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMovies(searchInput.value);
        }
    });
}

// Handle search input with debounce
function handleSearchInput(e) {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query === '') {
        loadMovies(currentCategory);
        return;
    }
    
    searchTimeout = setTimeout(() => {
        searchMovies(query);
    }, 500);
}

// Load movies by category
async function loadMovies(category) {
    showLoading(true);
    
    const endpoints = {
        trending: '/trending/movie/day',
        popular: '/movie/popular',
        top_rated: '/movie/top_rated',
        upcoming: '/movie/upcoming'
    };
    
    const titles = {
        trending: 'Trending Movies',
        popular: 'Popular Movies',
        top_rated: 'Top Rated Movies',
        upcoming: 'Upcoming Movies'
    };
    
    try {
        const url = `${BASE_URL}${endpoints[category]}?api_key=${API_KEY}&language=en-US&page=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch movies');
        }
        
        const data = await response.json();
        displayMovies(data.results);
        sectionTitle.textContent = titles[category];
        
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load movies. Please check your API key.');
    } finally {
        showLoading(false);
    }
}

// Search movies
async function searchMovies(query) {
    if (!query.trim()) return;
    
    showLoading(true);
    
    try {
        const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const data = await response.json();
        displayMovies(data.results);
        sectionTitle.textContent = `Search Results for "${query}"`;
        
    } catch (error) {
        console.error('Error searching movies:', error);
        showError('Search failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display movies in grid
function displayMovies(movies) {
    noResults.style.display = 'none';
    
    if (!movies || movies.length === 0) {
        moviesGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    moviesGrid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="openMovieModal(${movie.id})">
            <img 
                class="movie-poster" 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" 
                alt="${movie.title}"
                onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'"
            >
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                    <span class="movie-rating">⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
                <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
            </div>
        </div>
    `).join('');
}

// Open movie modal with details
async function openMovieModal(movieId) {
    try {
        showLoading(true);
        
        // Fetch detailed movie info
        const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch movie details');
        }
        
        const movie = await response.json();
        
        // Populate modal
        document.getElementById('modalPoster').src = movie.poster_path ? 
            IMAGE_BASE_URL + movie.poster_path : 
            'https://via.placeholder.com/500x750?text=No+Image';
        document.getElementById('modalTitle').textContent = movie.title;
        document.getElementById('modalYear').textContent = `Release Date: ${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}`;
        document.getElementById('modalRating').textContent = `Rating: ⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10`;
        document.getElementById('modalRuntime').textContent = `Runtime: ${movie.runtime ? movie.runtime + ' minutes' : 'N/A'}`;
        document.getElementById('modalOverview').textContent = movie.overview || 'No overview available.';
        
        // Display genres
        const genresContainer = document.getElementById('modalGenres');
        if (movie.genres && movie.genres.length > 0) {
            genresContainer.innerHTML = movie.genres.map(genre => 
                `<span class="genre-tag">${genre.name}</span>`
            ).join('');
        } else {
            genresContainer.innerHTML = '';
        }
        
        // Show modal
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading movie details:', error);
        alert('Failed to load movie details.');
    } finally {
        showLoading(false);
    }
}

// Close movie modal
function closeMovieModal() {
    modal.style.display = 'none';
}

// Show/hide loading state
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

// Show error message
function showError(message) {
    moviesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: white; padding: 40px;">${message}</div>`;
}

// Check if API key is set
if (API_KEY === 'your_api_key_here') {
    console.warn('⚠️ Please set your TMDB API key in script.js');
    showError('Please set your TMDB API key in script.js to load movies.');
}
