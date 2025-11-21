// Authentication module

/**
 * Handle user login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const errorDiv = document.getElementById('login-error');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    // Validate input
    if (!email || !password) {
        showError(errorDiv, 'Please enter both email and password');
        return;
    }
    
    try {
        // Attempt login
        const response = await window.api.login(email, password);
        
        if (response.success) {
            // Login successful, redirect based on role
            const user = response.user;
            if (user.role === 'admin') {
                window.router.navigate('/admin');
            } else {
                window.router.navigate('/customer');
            }
        } else {
            showError(errorDiv, response.error || 'Login failed');
        }
    } catch (error) {
        showError(errorDiv, error.message || 'Login failed. Please try again.');
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Remove token
    window.api.removeToken();
    
    // Clear user info from UI
    clearUserInfo();
    
    // Navigate to welcome page
    window.router.navigate('/');
    
    console.log('User logged out successfully');
}

/**
 * Show error message
 * @param {HTMLElement} errorDiv - Error container element
 * @param {string} message - Error message
 */
function showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

/**
 * Update user info in navigation
 */
function updateUserInfo() {
    const userInfo = document.getElementById('user-info');
    const navigation = document.getElementById('navigation');
    
    if (!userInfo || !navigation) return;
    
    const user = window.api.getCurrentUser();
    
    if (user && window.api.isAuthenticated()) {
        userInfo.textContent = `${user.email} (${user.role})`;
        navigation.style.display = 'block';
    } else {
        navigation.style.display = 'none';
    }
}

/**
 * Clear user info from navigation
 */
function clearUserInfo() {
    const userInfo = document.getElementById('user-info');
    const navigation = document.getElementById('navigation');
    
    if (userInfo) {
        userInfo.textContent = '';
    }
    
    if (navigation) {
        navigation.style.display = 'none';
    }
}

/**
 * Check if current user has required role
 * @param {string} requiredRole - Required role
 */
function hasRole(requiredRole) {
    const user = window.api.getCurrentUser();
    return user && user.role === requiredRole;
}

/**
 * Get user's role
 */
function getUserRole() {
    const user = window.api.getCurrentUser();
    return user ? user.role : null;
}

/**
 * Check if token is expired
 */
function isTokenExpired() {
    const user = window.api.getCurrentUser();
    if (!user || !user.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return user.exp < currentTime;
}

/**
 * Initialize authentication event listeners
 */
function initializeAuthListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navigation buttons
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => window.router.navigate('/login'));
    }
    
    const backToWelcome = document.getElementById('back-to-welcome');
    if (backToWelcome) {
        backToWelcome.addEventListener('click', () => window.router.navigate('/'));
    }
    
    const unauthorizedBack = document.getElementById('unauthorized-back');
    if (unauthorizedBack) {
        unauthorizedBack.addEventListener('click', () => window.router.navigate('/'));
    }
}

/**
 * Auto-login functionality for development (optional)
 * This can be removed in production
 */
function enableAutoLogin() {
    // Check if auto-login is enabled in localStorage
    const autoLogin = localStorage.getItem('autoLogin');
    if (autoLogin === 'true' && window.api.isAuthenticated()) {
        const user = window.api.getCurrentUser();
        if (user) {
            console.log('Auto-login enabled for user:', user.email);
            // Don't automatically navigate, let user choose
        }
    }
}

// Export authentication functions
window.auth = {
    handleLogin,
    handleLogout,
    updateUserInfo,
    hasRole,
    getUserRole,
    isTokenExpired,
    initializeAuthListeners,
    enableAutoLogin
};