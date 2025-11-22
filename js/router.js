// Enhanced Router for client-side navigation with token validation

class EnhancedRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = '';
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize router and set up event listeners
     */
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });
        
        // Handle initial route
        this.handleRouteChange();
        
        // Make router globally available
        window.router = this;
        this.isInitialized = true;
        
        console.log('Enhanced Router initialized');
    }

    /**
     * Add a route to the router
     */
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Navigate to a specific route
     */
    navigate(path) {
        if (path !== this.currentRoute) {
            window.location.hash = path;
        }
    }

    /**
     * Get current route from hash
     */
    getCurrentRoute() {
        const hash = window.location.hash.slice(1) || '/';
        return hash;
    }

    /**
     * Handle route changes with comprehensive validation
     */
    handleRouteChange() {
        const currentPath = this.getCurrentRoute();
        
        // Hide all views first
        this.hideAllViews();
        
        // Update current route
        this.currentRoute = currentPath;
        
        // Handle route with authentication and authorization checks
        this.handleRoute(currentPath);
    }

    /**
     * Hide all views
     */
    hideAllViews() {
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            view.classList.remove('active');
        });
    }

    /**
     * Show a specific view
     */
    showView(viewId) {
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }
    }

    /**
     * Enhanced route handling with token validation
     */
    handleRoute(path) {
        const tokenManager = window.tokenManager;
        const isAuthenticated = tokenManager.isAuthenticated();
        const user = tokenManager.getUser();
        
        console.log('Route handling:', {
            path,
            isAuthenticated,
            user: user ? { id: user.id, role: user.role } : null
        });
        
        // Public routes
        if (path === '/' || path === '/welcome') {
            this.showView('welcome-view');
            window.auth.updateUserInfo();
            return;
        }
        
        if (path === '/login') {
            // If already authenticated, redirect to appropriate dashboard
            if (isAuthenticated && user) {
                if (user.role === 'admin') {
                    this.navigate('/admin');
                    return;
                } else {
                    this.navigate('/customer');
                    return;
                }
            }
            this.showView('login-view');
            return;
        }
        
        // Debug route (development only)
        if (path === '/debug') {
            if (this.isDevelopmentMode()) {
                this.showView('debug-view');
                this.loadDebugInfo();
            } else {
                this.showView('welcome-view');
            }
            return;
        }
        
        // Protected routes
        if (!isAuthenticated) {
            this.showView('login-view');
            this.navigate('/login');
            return;
        }
        
        // Check token expiration
        if (window.auth.isTokenExpired()) {
            console.log('Token expired, showing expired view');
            this.showView('token-expired-view');
            window.auth.startTokenExpirationCountdown();
            return;
        }
        
        // Role-based route handling
        switch (path) {
            case '/customer':
                if (user.role === 'customer') {
                    this.showView('customer-view');
                    window.auth.updateUserInfo();
                    this.loadCustomerData();
                } else {
                    this.showView('unauthorized-view');
                }
                break;
                
            case '/admin':
                if (user.role === 'admin') {
                    this.showView('admin-view');
                    window.auth.updateUserInfo();
                    // Admin data is loaded on demand
                } else {
                    this.showView('unauthorized-view');
                }
                break;
                
            case '/profile':
                if (user) {
                    // Show appropriate profile based on role
                    if (user.role === 'admin') {
                        this.navigate('/admin');
                    } else {
                        this.navigate('/customer');
                    }
                } else {
                    this.showView('login-view');
                }
                break;
                
            default:
                // Unknown route, show welcome page
                this.showView('welcome-view');
                break;
        }
    }

    /**
     * Load customer data when customer view is shown
     */
    loadCustomerData() {
        this.loadCustomerProfile();
        this.loadCustomerTokenInfo();
    }

    /**
     * Load customer profile
     */
    async loadCustomerProfile() {
        const profileContainer = document.getElementById('customer-profile');
        if (!profileContainer) return;
        
        profileContainer.innerHTML = '<div class="loading-placeholder">Loading profile...</div>';
        
        try {
            const response = await window.api.getCustomerProfile();
            if (response.success && response.profile) {
                const profile = response.profile;
                profileContainer.innerHTML = `
                    <div class="profile-info">
                        <p><strong>Name:</strong> ${profile.name}</p>
                        <p><strong>Email:</strong> ${profile.email}</p>
                        <p><strong>Role:</strong> ${profile.role}</p>
                        <p><strong>Account Status:</strong> ${profile.accountStatus}</p>
                        <p><strong>Membership Level:</strong> ${profile.membershipLevel}</p>
                        <p><strong>Member Since:</strong> ${new Date(profile.createdAt).toLocaleDateString()}</p>
                        <p><strong>Last Login:</strong> ${profile.lastLogin ? new Date(profile.lastLogin.timestamp).toLocaleString() : 'Never'}</p>
                        <div class="scopes">
                            <strong>Permissions:</strong> ${profile.scopes.join(', ')}
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            profileContainer.innerHTML = `
                <div style="color: #e74c3c;">Error loading profile: ${error.message}</div>
            `;
        }
    }

    /**
     * Load customer token information
     */
    loadCustomerTokenInfo() {
        const tokenInfoContainer = document.getElementById('customer-token-info');
        if (!tokenInfoContainer) return;
        
        // Token info is loaded by the token manager
        window.tokenManager.updateTokenDisplays();
    }

    /**
     * Load debug information
     */
    loadDebugInfo() {
        const tokenManager = window.tokenManager;
        
        // Current user info
        const userElement = document.getElementById('debug-user');
        if (userElement) {
            const user = tokenManager.getUser();
            userElement.textContent = JSON.stringify(user || { message: 'Not authenticated' }, null, 2);
        }
        
        // Token payload
        const tokenElement = document.getElementById('debug-token');
        if (tokenElement) {
            const token = tokenManager.getAccessToken();
            if (token) {
                const payload = window.JWTUtils.parseJWT(token);
                tokenElement.textContent = JSON.stringify(payload, null, 2);
            } else {
                tokenElement.textContent = 'No access token';
            }
        }
        
        // Session information
        const sessionElement = document.getElementById('debug-session');
        if (sessionElement) {
            const session = tokenManager.getSession();
            const expInfo = tokenManager.getTokenExpirationInfo();
            sessionElement.textContent = JSON.stringify({
                session: session,
                expiration: expInfo
            }, null, 2);
        }
        
        // API configuration
        const configElement = document.getElementById('debug-config');
        if (configElement) {
            configElement.textContent = JSON.stringify(window.api.getConfig(), null, 2);
        }
    }

    /**
     * Check if running in development mode
     */
    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('repl.co') ||
               window.location.hostname.includes('codesandbox.io');
    }

    /**
     * Get route history
     */
    getHistory() {
        // Simple history tracking
        return this.history || [];
    }

    /**
     * Check if route is protected
     */
    isProtectedRoute(path) {
        const protectedRoutes = ['/customer', '/admin', '/profile'];
        return protectedRoutes.includes(path);
    }

    /**
     * Get required role for route
     */
    getRequiredRole(path) {
        const roleMap = {
            '/customer': 'customer',
            '/admin': 'admin',
            '/profile': null // any authenticated user
        };
        return roleMap[path] || null;
    }

    /**
     * Get required scopes for route
     */
    getRequiredScopes(path) {
        const scopeMap = {
            '/admin/users': ['users:read'],
            '/admin/stats': ['stats:read'],
            '/admin/sessions': ['users:read'],
            '/customer/profile': ['profile:read'],
            '/customer/data': ['read']
        };
        return scopeMap[path] || [];
    }

    /**
     * Validate route access
     */
    validateRouteAccess(path) {
        const tokenManager = window.tokenManager;
        const isAuthenticated = tokenManager.isAuthenticated();
        const user = tokenManager.getUser();
        
        // Check authentication
        if (this.isProtectedRoute(path) && !isAuthenticated) {
            return {
                valid: false,
                reason: 'Authentication required'
            };
        }
        
        // Check role
        const requiredRole = this.getRequiredRole(path);
        if (requiredRole && user?.role !== requiredRole) {
            return {
                valid: false,
                reason: `Role required: ${requiredRole}, user role: ${user?.role}`
            };
        }
        
        // Check scopes
        const requiredScopes = this.getRequiredScopes(path);
        if (requiredScopes.length > 0) {
            const userScopes = user?.scopes || [];
            const hasScopes = requiredScopes.every(scope => userScopes.includes(scope));
            if (!hasScopes) {
                return {
                    valid: false,
                    reason: `Scopes required: ${requiredScopes.join(', ')}`
                };
            }
        }
        
        return { valid: true };
    }

    /**
     * Handle navigation errors
     */
    handleNavigationError(error) {
        console.error('Navigation error:', error);
        
        // Show user-friendly error
        window.tokenManager.showNotification(
            'Navigation error: ' + error.message,
            'error'
        );
    }

    /**
     * Refresh current route
     */
    refresh() {
        this.handleRouteChange();
    }

    /**
     * Get current route information
     */
    getCurrentRouteInfo() {
        const path = this.getCurrentRoute();
        return {
            path,
            isProtected: this.isProtectedRoute(path),
            requiredRole: this.getRequiredRole(path),
            requiredScopes: this.getRequiredScopes(path),
            validation: this.validateRouteAccess(path)
        };
    }
}

// Create and export router instance
window.EnhancedRouter = EnhancedRouter;

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.router = new EnhancedRouter();
    });
} else {
    window.router = new EnhancedRouter();
}

// Export for potential manual initialization
window.initRouter = () => {
    return new EnhancedRouter();
};