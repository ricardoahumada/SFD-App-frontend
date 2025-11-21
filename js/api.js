// Enhanced API utility with automatic token refresh

const API_BASE_URL = 'http://localhost:3000/api'; // Update for production

/**
 * Enhanced API utility with automatic token refresh and comprehensive error handling
 */
class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Get the stored JWT token from token manager
     */
    getToken() {
        return window.tokenManager.getAccessToken();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return window.tokenManager.isAuthenticated();
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return window.tokenManager.getUser();
    }

    /**
     * Enhanced API request with automatic token refresh
     * @param {string} endpoint - API endpoint (relative to /api)
     * @param {object} options - Request options
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();
        
        // Merge headers
        const headers = {
            ...this.defaultHeaders,
            ...options.headers
        };

        // Add authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: 'GET',
            credentials: 'include',
            headers: headers,
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle token expiration
            if (response.status === 401) {
                const errorData = await response.json().catch(() => ({}));
                
                // Try to refresh token for non-auth endpoints
                if (!endpoint.startsWith('/auth/') && this.getToken() && window.tokenManager.getRefreshToken()) {
                    console.log('Token expired, attempting refresh...');
                    
                    try {
                        await window.tokenManager.forceRefresh();
                        // Retry the original request with new token
                        return await this.request(endpoint, options);
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        // Redirect to login
                        this.handleAuthenticationFailure();
                        throw new Error('Authentication required');
                    }
                }
                
                this.handleAuthenticationFailure(errorData);
                throw new Error(errorData.error || 'Authentication failed');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If JSON parsing fails, create basic error object
                    errorData = {
                        error: `HTTP error! status: ${response.status}`,
                        code: `HTTP_${response.status}`
                    };
                }

                // Handle specific error types
                switch (response.status) {
                    case 403:
                        errorData.error = errorData.error || 'Access forbidden';
                        break;
                    case 404:
                        errorData.error = errorData.error || 'Resource not found';
                        break;
                    case 429:
                        errorData.error = errorData.error || 'Rate limit exceeded';
                        break;
                    case 500:
                        errorData.error = errorData.error || 'Internal server error';
                        break;
                }

                throw new Error(errorData.error || 'Request failed');
            }

            const data = await response.json();
            return data;

        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to server');
            }
            
            console.error('API request failed:', {
                endpoint,
                method: options.method || 'GET',
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Handle authentication failure
     */
    handleAuthenticationFailure(errorData = {}) {
        // Clear tokens and redirect to login
        window.tokenManager.clearTokens();
        
        // Redirect to login if not already there
        if (window.router && window.router.currentRoute !== '/login') {
            window.router.navigate('/login');
        }
        
        // Show notification if not already on login page
        if (window.router && window.router.currentRoute !== '/login') {
            window.tokenManager.showNotification(
                errorData.message || 'Session expired. Please log in again.',
                'error'
            );
        }
    }

    /**
     * Login user with email and password
     * @param {string} email 
     * @param {string} password 
     * @param {string} clientId 
     */
    async login(email, password, clientId = 'web-client') {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, clientId })
        });

        if (response.success && response.access_token) {
            // Store tokens in token manager
            window.tokenManager.setTokens(
                response.access_token,
                response.refresh_token,
                response.session,
                response.user
            );
            
            return response;
        }

        throw new Error(response.error || 'Login failed');
    }

    /**
     * Refresh access token
     */
    async refreshToken() {
        const refreshToken = window.tokenManager.getRefreshToken();
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ 
                refresh_token: refreshToken,
                clientId: 'web-client'
            })
        });

        if (response.success && response.access_token) {
            // Update tokens
            window.tokenManager.setTokens(
                response.access_token,
                response.refresh_token,
                response.session,
                response.user
            );
            
            return response;
        }

        throw new Error(response.error || 'Token refresh failed');
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            const accessToken = this.getToken();
            const refreshToken = window.tokenManager.getRefreshToken();

            if (accessToken || refreshToken) {
                await this.request('/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    })
                });
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Clear tokens regardless of API call result
            window.tokenManager.clearTokens();
        }
    }

    /**
     * Logout from all devices
     */
    async logoutAll() {
        const accessToken = this.getToken();
        
        if (!accessToken) {
            throw new Error('No access token available');
        }

        const response = await this.request('/auth/logout-all', {
            method: 'POST',
            body: JSON.stringify({ access_token: accessToken })
        });

        // Clear tokens
        window.tokenManager.clearTokens();
        
        return response;
    }

    /**
     * Get customer service data
     */
    async getCustomerService() {
        return await this.request('/customer');
    }

    /**
     * Get customer profile
     */
    async getCustomerProfile() {
        return await this.request('/customer/profile');
    }

    /**
     * Update customer profile
     */
    async updateCustomerProfile(profileData) {
        return await this.request('/customer/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    /**
     * Get customer data
     */
    async getCustomerData() {
        return await this.request('/customer/data');
    }

    /**
     * Submit customer feedback
     */
    async submitFeedback(rating, comment, category = 'general') {
        return await this.request('/customer/feedback', {
            method: 'POST',
            body: JSON.stringify({ rating, comment, category })
        });
    }

    /**
     * Get customer security info
     */
    async getCustomerSecurity() {
        return await this.request('/customer/security');
    }

    /**
     * Get admin service data
     */
    async getAdminService() {
        return await this.request('/admin');
    }

    /**
     * Get all users (admin only)
     */
    async getAdminUsers() {
        return await this.request('/admin/users');
    }

    /**
     * Get system statistics (admin only)
     */
    async getAdminStats() {
        return await this.request('/admin/stats');
    }

    /**
     * Get active sessions (admin only)
     */
    async getAdminSessions() {
        return await this.request('/admin/sessions');
    }

    /**
     * Revoke session (admin only)
     */
    async revokeSession(userId, sessionId) {
        return await this.request('/admin/sessions/revoke', {
            method: 'POST',
            body: JSON.stringify({ userId, sessionId })
        });
    }

    /**
     * Get blacklisted tokens (admin only)
     */
    async getAdminBlacklist() {
        return await this.request('/admin/blacklist');
    }

    /**
     * Perform maintenance operation (admin only)
     */
    async performMaintenance(action) {
        return await this.request('/admin/maintenance', {
            method: 'POST',
            body: JSON.stringify({ action })
        });
    }

    /**
     * Blacklist a token (admin only)
     */
    async blacklistToken(token, reason = 'manual_blacklist') {
        return await this.request('/tokens/blacklist', {
            method: 'POST',
            body: JSON.stringify({ token, reason })
        });
    }

    /**
     * Introspect token
     */
    async introspectToken(token) {
        return await this.request('/tokens/introspect', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    /**
     * Check if token is blacklisted
     */
    async checkTokenBlacklist(token) {
        return await this.request(`/tokens/blacklist?token=${encodeURIComponent(token)}`);
    }

    /**
     * Get JWT algorithm information
     */
    async getAlgorithmInfo() {
        return await this.request('/tokens/algorithm');
    }

    /**
     * Get token service health
     */
    async getTokenHealth() {
        return await this.request('/tokens/health');
    }

    /**
     * Get user profile
     */
    async getProfile() {
        return await this.request('/auth/profile');
    }

    /**
     * Batch API calls with automatic retry on token refresh
     */
    async batch(requests) {
        const results = [];
        
        for (const request of requests) {
            try {
                const result = await this.request(request.endpoint, request.options);
                results.push({ success: true, data: result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Health check for API connectivity
     */
    async healthCheck() {
        try {
            const response = await this.request('/../health');
            return {
                healthy: true,
                data: response,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Update base URL (for different environments)
     */
    setBaseURL(url) {
        this.baseURL = url;
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return {
            baseURL: this.baseURL,
            isAuthenticated: this.isAuthenticated(),
            user: this.getCurrentUser(),
            tokenPreview: this.getToken() ? this.getToken().substring(0, 20) + '...' : null
        };
    }
}

// Export singleton instance
window.api = new API();