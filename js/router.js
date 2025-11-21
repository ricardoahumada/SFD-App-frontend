// Router for client-side navigation

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = '';
        this.init();
    }

    /**
     * Initialize router and set up hash change listener
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
    }

    /**
     * Add a route to the router
     * @param {string} path - Route path (e.g., '/login', '/customer')
     * @param {function} handler - Route handler function
     */
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Navigate to a specific route
     * @param {string} path - Route path
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
     * Handle route changes
     */
    handleRouteChange() {
        const currentPath = this.getCurrentRoute();
        
        // Hide all views first
        this.hideAllViews();
        
        // Update current route
        this.currentRoute = currentPath;
        
        // Handle route based on authentication and authorization
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
     * @param {string} viewId - ID of the view to show
     */
    showView(viewId) {
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }
    }

    /**
     * Handle route with authentication and authorization checks
     * @param {string} path - Route path
     */
    handleRoute(path) {
        const isAuthenticated = window.api.isAuthenticated();
        const user = window.api.getCurrentUser();
        
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
        
        // Protected routes
        if (!isAuthenticated) {
            this.showView('login-view');
            this.navigate('/login');
            return;
        }
        
        // Check token expiration
        if (window.auth.isTokenExpired()) {
            window.api.removeToken();
            this.showView('login-view');
            this.navigate('/login');
            return;
        }
        
        // Role-based route handling
        switch (path) {
            case '/customer':
                if (user.role === 'customer') {
                    this.showView('customer-view');
                    window.auth.updateUserInfo();
                    // Load customer profile
                    this.loadCustomerProfile();
                } else {
                    this.showView('unauthorized-view');
                }
                break;
                
            case '/admin':
                if (user.role === 'admin') {
                    this.showView('admin-view');
                    window.auth.updateUserInfo();
                } else {
                    this.showView('unauthorized-view');
                }
                break;
                
            default:
                // Unknown route, show welcome page
                this.showView('welcome-view');
                break;
        }
    }

    /**
     * Load customer profile data
     */
    loadCustomerProfile() {
        const profileContainer = document.getElementById('customer-profile');
        if (!profileContainer) return;
        
        window.api.getCustomerProfile()
            .then(response => {
                if (response.success && response.profile) {
                    const profile = response.profile;
                    profileContainer.innerHTML = `
                        <p><strong>Name:</strong> ${profile.name}</p>
                        <p><strong>Email:</strong> ${profile.email}</p>
                        <p><strong>Role:</strong> ${profile.role}</p>
                        <p><strong>Account Status:</strong> ${profile.accountStatus}</p>
                        <p><strong>Member Since:</strong> ${profile.memberSince}</p>
                    `;
                }
            })
            .catch(error => {
                profileContainer.innerHTML = `
                    <p style="color: #e74c3c;">Error loading profile: ${error.message}</p>
                `;
            });
    }
}

// Initialize router
window.router = new Router();

// Export router class
window.Router = Router;