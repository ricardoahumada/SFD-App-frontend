// Enhanced Authentication module with token management

/**
 * Handle user login with enhanced validation
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const clientId = form.clientId.value;
    const errorDiv = document.getElementById('login-error');
    const successDiv = document.getElementById('login-success');
    
    // Clear previous messages
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    successDiv.style.display = 'none';
    successDiv.textContent = '';
    
    // Validate input
    if (!email || !password) {
        showError(errorDiv, 'Please enter both email and password');
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError(errorDiv, 'Please enter a valid email address');
        return;
    }
    
    try {
        showLoading('Logging in...');
        
        // Attempt login
        const response = await window.api.login(email, password, clientId);
        
        if (response.success) {
            showSuccess(successDiv, 'Login successful! Redirecting...');
            
            // Wait a moment to show success message
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirect based on role
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
        console.error('Login error:', error);
        showError(errorDiv, error.message || 'Login failed. Please try again.');
    } finally {
        hideLoading();
    }
}

/**
 * Handle user logout with token blacklisting
 */
async function handleLogout() {
    try {
        showLoading('Logging out...');
        await window.api.logout();
        window.router.navigate('/');
        window.tokenManager.showNotification('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        // Still navigate away even if logout fails
        window.router.navigate('/');
        window.tokenManager.showNotification('Logged out', 'info');
    } finally {
        hideLoading();
    }
}

/**
 * Handle force token refresh
 */
async function handleForceRefresh() {
    try {
        const success = await window.tokenManager.forceRefresh();
        if (success) {
            // Refresh current view
            window.router.handleRouteChange();
        }
    } catch (error) {
        console.error('Force refresh error:', error);
    }
}

/**
 * Handle logout from all devices (admin)
 */
async function handleLogoutAll() {
    if (!confirm('Are you sure you want to logout from all devices? This will terminate all active sessions.')) {
        return;
    }
    
    try {
        showLoading('Logging out from all devices...');
        await window.api.logoutAll();
        window.router.navigate('/');
        window.tokenManager.showNotification('Logged out from all devices', 'success');
    } catch (error) {
        console.error('Logout all error:', error);
        window.tokenManager.showNotification('Failed to logout from all devices', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Show error message
 */
function showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

/**
 * Show success message
 */
function showSuccess(successDiv, message) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

/**
 * Update user info in navigation with enhanced information
 */
function updateUserInfo() {
    const tokenManager = window.tokenManager;
    const userInfo = document.getElementById('user-info');
    const sessionInfo = document.getElementById('session-info');
    const navigation = document.getElementById('navigation');
    
    if (!userInfo || !navigation) return;
    
    if (tokenManager.isAuthenticated()) {
        const user = tokenManager.getUser();
        const session = tokenManager.getSession();
        
        if (userInfo) {
            userInfo.textContent = `${user.name} (${user.role})`;
        }
        
        if (sessionInfo && session) {
            const createdAt = new Date(session.createdAt || Date.now());
            sessionInfo.textContent = `Session: ${session.id} | Created: ${createdAt.toLocaleDateString()}`;
        }
        
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
    const sessionInfo = document.getElementById('session-info');
    const navigation = document.getElementById('navigation');
    
    if (userInfo) {
        userInfo.textContent = '';
    }
    
    if (sessionInfo) {
        sessionInfo.textContent = '';
    }
    
    if (navigation) {
        navigation.style.display = 'none';
    }
}

/**
 * Check if current user has required role
 */
function hasRole(requiredRole) {
    const user = window.tokenManager.getUser();
    return user && user.role === requiredRole;
}

/**
 * Get user's role
 */
function getUserRole() {
    const user = window.tokenManager.getUser();
    return user ? user.role : null;
}

/**
 * Get user's scopes
 */
function getUserScopes() {
    const user = window.tokenManager.getUser();
    return user && user.scopes ? user.scopes : [];
}

/**
 * Check if user has required scopes
 */
function hasScopes(requiredScopes) {
    const userScopes = getUserScopes();
    return requiredScopes.every(scope => userScopes.includes(scope));
}

/**
 * Check if token is expired
 */
function isTokenExpired() {
    const tokenManager = window.tokenManager;
    const expInfo = tokenManager.getTokenExpirationInfo();
    return !expInfo || expInfo.isExpired;
}

/**
 * Get time until token expires
 */
function getTimeUntilExpiry() {
    const tokenManager = window.tokenManager;
    const expInfo = tokenManager.getTokenExpirationInfo();
    return expInfo ? expInfo.timeUntilExpiry : 0;
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
    
    const unauthorizedLogin = document.getElementById('unauthorized-login');
    if (unauthorizedLogin) {
        unauthorizedLogin.addEventListener('click', () => window.router.navigate('/login'));
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Force refresh button
    const refreshBtn = document.getElementById('refresh-token-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleForceRefresh);
    }
}

/**
 * Setup token-related event listeners
 */
function setupTokenListeners() {
    // Listen for token updates
    window.addEventListener('tokenUpdate', (event) => {
        console.log('Token updated:', event.detail);
        updateUserInfo();
    });
    
    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (event) => {
        if (event.key === 'accessToken' || event.key === 'refreshToken') {
            console.log('Token changed in another tab');
            updateUserInfo();
            
            // Refresh current view if needed
            if (window.router) {
                window.router.handleRouteChange();
            }
        }
    });
}

/**
 * Handle token expiration countdown
 */
function startTokenExpirationCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    
    let seconds = 10;
    const timer = setInterval(() => {
        countdownElement.textContent = seconds;
        seconds--;
        
        if (seconds < 0) {
            clearInterval(timer);
            window.router.navigate('/login');
        }
    }, 1000);
}

/**
 * Extend session (prevent automatic logout)
 */
function extendSession() {
    window.tokenManager.forceRefresh().then(() => {
        window.router.navigate('/');
        window.tokenManager.showNotification('Session extended successfully', 'success');
    }).catch(error => {
        window.tokenManager.showNotification('Failed to extend session', 'error');
    });
}

/**
 * Auto-login functionality for development
 */
function enableAutoLogin() {
    // Check URL parameters for auto-login
    const urlParams = new URLSearchParams(window.location.search);
    const autoLogin = urlParams.get('autologin');
    
    if (autoLogin === 'true' && window.tokenManager.isAuthenticated()) {
        console.log('Auto-login enabled, redirecting based on user role');
        const user = window.tokenManager.getUser();
        if (user) {
            if (user.role === 'admin') {
                window.router.navigate('/admin');
            } else {
                window.router.navigate('/customer');
            }
        }
    }
}

/**
 * Initialize debug mode (development only)
 */
function initializeDebugMode() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.debugAuth = {
            getUser: () => window.tokenManager.getUser(),
            getToken: () => window.tokenManager.getAccessToken(),
            getTokenStatus: () => window.tokenManager.getTokenExpirationInfo(),
            getScopes: () => getUserScopes(),
            hasRole: (role) => hasRole(role),
            hasScopes: (scopes) => hasScopes(scopes),
            forceRefresh: () => window.tokenManager.forceRefresh(),
            clearTokens: () => window.tokenManager.clearTokens(),
            debugInfo: () => window.tokenManager.getDebugInfo()
        };
        
        console.log('🔧 Debug mode enabled. Use window.debugAuth for debugging.');
    }
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    
    if (loading) {
        if (loadingText) {
            loadingText.textContent = message;
        }
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

// Export authentication functions
window.auth = {
    handleLogin,
    handleLogout,
    handleForceRefresh,
    handleLogoutAll,
    updateUserInfo,
    clearUserInfo,
    hasRole,
    getUserRole,
    getUserScopes,
    hasScopes,
    isTokenExpired,
    getTimeUntilExpiry,
    initializeAuthListeners,
    setupTokenListeners,
    startTokenExpirationCountdown,
    extendSession,
    enableAutoLogin,
    initializeDebugMode,
    showLoading,
    hideLoading
};