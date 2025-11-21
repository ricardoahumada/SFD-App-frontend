// API utility for handling backend communication

const API_BASE_URL = 'http://localhost:3000/api'; // Change this for production

/**
 * Get the stored JWT token from localStorage
 */
function getToken() {
    return localStorage.getItem('authToken');
}

/**
 * Set the JWT token in localStorage
 */
function setToken(token) {
    localStorage.setItem('authToken', token);
}

/**
 * Remove the JWT token from localStorage
 */
function removeToken() {
    localStorage.removeItem('authToken');
}

/**
 * Make an API request with authentication
 * @param {string} endpoint - API endpoint (relative to /api)
 * @param {object} options - Request options
 */
async function makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add authorization header if token exists
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: 'GET',
        headers: defaultHeaders,
        ...options
    };

    try {
        showLoading();
        const response = await fetch(url, config);
        const data = await response.json();

        hideLoading();

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
            removeToken();
            if (window.router && typeof window.router.navigate === 'function') {
                window.router.navigate('/login');
            }
            throw new Error(data.error || 'Authentication failed');
        }

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        hideLoading();
        console.error('API request failed:', error);
        throw error;
    }
}

/**
 * Login user with email and password
 * @param {string} email 
 * @param {string} password 
 */
async function login(email, password) {
    const response = await makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (response.success && response.token) {
        setToken(response.token);
        return response;
    }

    throw new Error('Login failed');
}

/**
 * Get customer service data
 */
async function getCustomerService() {
    return makeRequest('/customer');
}

/**
 * Get customer profile
 */
async function getCustomerProfile() {
    return makeRequest('/customer/profile');
}

/**
 * Get admin service data
 */
async function getAdminService() {
    return makeRequest('/admin');
}

/**
 * Get all users (admin only)
 */
async function getAdminUsers() {
    return makeRequest('/admin/users');
}

/**
 * Get system statistics (admin only)
 */
async function getAdminStats() {
    return makeRequest('/admin/stats');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Get current user info from token
 */
function getCurrentUser() {
    const token = getToken();
    if (!token) return null;

    try {
        // Parse JWT token (base64 decode payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            exp: payload.exp
        };
    } catch (error) {
        console.error('Failed to parse user token:', error);
        return null;
    }
}

/**
 * Show loading overlay
 */
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

/**
 * Handle API errors and display user-friendly messages
 * @param {Error} error 
 * @param {string} elementId - ID of element to show error message
 */
function handleApiError(error, elementId) {
    console.error('API Error:', error);
    
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = error.message || 'An error occurred';
        element.style.display = 'block';
    }
}

// Export functions
window.api = {
    login,
    getCustomerService,
    getCustomerProfile,
    getAdminService,
    getAdminUsers,
    getAdminStats,
    isAuthenticated,
    getCurrentUser,
    removeToken,
    handleApiError,
    showLoading,
    hideLoading
};