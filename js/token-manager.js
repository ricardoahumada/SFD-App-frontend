// Enhanced Token Manager with automatic refresh and secure storage

class TokenManager {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.sessionData = null;
        this.user = null;
        this.refreshTimer = null;
        this.refreshBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.isRefreshing = false;
        this.refreshPromise = null;
        this.storage = this.getStorageMethod();
        
        this.init();
    }

    /**
     * Initialize token manager
     */
    init() {
        this.loadTokensFromStorage();
        this.setupStorageListener();
        this.scheduleRefreshCheck();
    }

    /**
     * Get storage method (localStorage with fallback)
     */
    getStorageMethod() {
        try {
            // Test localStorage availability
            const test = '__token_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return {
                get: (key) => localStorage.getItem(key),
                set: (key, value) => localStorage.setItem(key, value),
                remove: (key) => localStorage.removeItem(key),
                type: 'localStorage'
            };
        } catch (error) {
            console.warn('localStorage not available, using in-memory storage');
            const memoryStorage = new Map();
            return {
                get: (key) => memoryStorage.get(key) || null,
                set: (key, value) => memoryStorage.set(key, value),
                remove: (key) => memoryStorage.delete(key),
                type: 'memory'
            };
        }
    }

    /**
     * Load tokens from storage
     */
    loadTokensFromStorage() {
        this.accessToken = this.storage.get('accessToken');
        this.refreshToken = this.storage.get('refreshToken');
        this.sessionData = JSON.parse(this.storage.get('sessionData') || 'null');
        this.user = JSON.parse(this.storage.get('userData') || 'null');
        
        console.log('Tokens loaded from storage:', {
            hasAccess: !!this.accessToken,
            hasRefresh: !!this.refreshToken,
            storageType: this.storage.type
        });
    }

    /**
     * Save tokens to storage
     */
    saveToStorage() {
        if (this.accessToken) {
            this.storage.set('accessToken', this.accessToken);
        }
        if (this.refreshToken) {
            this.storage.set('refreshToken', this.refreshToken);
        }
        if (this.sessionData) {
            this.storage.set('sessionData', JSON.stringify(this.sessionData));
        }
        if (this.user) {
            this.storage.set('userData', JSON.stringify(this.user));
        }
    }

    /**
     * Clear tokens from storage
     */
    clearFromStorage() {
        this.storage.remove('accessToken');
        this.storage.remove('refreshToken');
        this.storage.remove('sessionData');
        this.storage.remove('userData');
    }

    /**
     * Setup storage change listener for multi-tab sync
     */
    setupStorageListener() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'accessToken' || event.key === 'refreshToken') {
                console.log('Token updated in another tab, refreshing...');
                this.loadTokensFromStorage();
                this.updateUI();
            }
        });
    }

    /**
     * Set tokens after successful login
     */
    setTokens(accessToken, refreshToken, sessionData, user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.sessionData = sessionData;
        this.user = user;
        
        this.saveToStorage();
        this.scheduleRefreshCheck();
        this.updateUI();
        
        console.log('Tokens set successfully');
    }

    /**
     * Clear all tokens
     */
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.sessionData = null;
        this.user = null;
        
        this.clearFromStorage();
        this.clearRefreshTimer();
        this.updateUI();
        
        console.log('Tokens cleared');
    }

    /**
     * Get current access token
     */
    getAccessToken() {
        return this.accessToken;
    }

    /**
     * Get current refresh token
     */
    getRefreshToken() {
        return this.refreshToken;
    }

    /**
     * Get user information
     */
    getUser() {
        return this.user;
    }

    /**
     * Get session information
     */
    getSession() {
        return this.sessionData;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!(this.accessToken && this.user);
    }

    /**
     * Get token expiration info
     */
    getTokenExpirationInfo() {
        if (!this.accessToken) {
            return null;
        }

        const payload = window.JWTUtils.parseJWT(this.accessToken);
        if (!payload || !payload.exp) {
            return null;
        }

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;
        const timeSinceIssued = now - payload.iat;

        return {
            expiresAt: new Date(payload.exp * 1000),
            issuedAt: new Date(payload.iat * 1000),
            timeUntilExpiry: timeUntilExpiry,
            timeSinceIssued: timeSinceIssued,
            isExpired: timeUntilExpiry <= 0,
            expiresIn: window.JWTUtils.formatDuration(timeUntilExpiry),
            age: window.JWTUtils.formatDuration(timeSinceIssued)
        };
    }

    /**
     * Check if token needs refresh
     */
    needsRefresh() {
        const expInfo = this.getTokenExpirationInfo();
        if (!expInfo || expInfo.isExpired) {
            return true;
        }

        // Check if token expires within the refresh buffer time
        const bufferSeconds = this.refreshBuffer / 1000;
        return expInfo.timeUntilExpiry <= bufferSeconds;
    }

    /**
     * Automatically refresh token if needed
     */
    async autoRefresh() {
        if (this.isRefreshing || !this.needsRefresh()) {
            return;
        }

        console.log('Auto-refreshing token...');
        return this.refreshToken();
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken() {
        if (this.isRefreshing) {
            return this.refreshPromise;
        }

        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        this.isRefreshing = true;
        
        try {
            this.refreshPromise = this.performTokenRefresh();
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    /**
     * Perform the actual token refresh
     */
    async performTokenRefresh() {
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: this.refreshToken,
                    clientId: 'web-client'
                })
            });

            if (!response.ok) {
                throw new Error(`Refresh failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.access_token) {
                // Update tokens
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                
                // Update session data
                if (this.sessionData) {
                    this.sessionData.refreshedAt = new Date().toISOString();
                }
                
                this.saveToStorage();
                this.scheduleRefreshCheck();
                this.updateUI();
                
                console.log('Token refreshed successfully');
                return {
                    success: true,
                    token: this.accessToken,
                    user: this.user
                };
            } else {
                throw new Error(data.error || 'Refresh failed');
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            throw error;
        }
    }

    /**
     * Schedule automatic refresh check
     */
    scheduleRefreshCheck() {
        this.clearRefreshTimer();
        
        if (!this.accessToken) {
            return;
        }

        const expInfo = this.getTokenExpirationInfo();
        if (!expInfo || expInfo.isExpired) {
            return;
        }

        // Schedule refresh at buffer time before expiration
        const timeUntilRefresh = Math.max(
            1000, // Minimum 1 second
            (expInfo.expiresAt.getTime() - Date.now()) - this.refreshBuffer
        );

        console.log(`Scheduling refresh in ${Math.round(timeUntilRefresh / 1000)} seconds`);
        
        this.refreshTimer = setTimeout(() => {
            this.autoRefresh().catch(error => {
                console.error('Auto-refresh failed:', error);
                // Don't redirect immediately, let the app handle the error
            });
        }, timeUntilRefresh);
    }

    /**
     * Clear refresh timer
     */
    clearRefreshTimer() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Force refresh token (user initiated)
     */
    async forceRefresh() {
        console.log('Force refreshing token...');
        try {
            await this.refreshToken();
            this.showNotification('Token refreshed successfully', 'success');
            return true;
        } catch (error) {
            console.error('Force refresh failed:', error);
            this.showNotification('Token refresh failed: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Logout and blacklist tokens
     */
    async logout() {
        try {
            const logoutData = {
                access_token: this.accessToken,
                refresh_token: this.refreshToken
            };

            // Call logout endpoint to blacklist tokens
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logoutData)
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            this.clearTokens();
        }
    }

    /**
     * Update UI with current token status
     */
    updateUI() {
        // Update navigation
        this.updateNavigation();
        
        // Update token info displays
        this.updateTokenDisplays();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('tokenUpdate', {
            detail: {
                isAuthenticated: this.isAuthenticated(),
                user: this.user,
                tokenInfo: this.getTokenExpirationInfo()
            }
        }));
    }

    /**
     * Update navigation UI
     */
    updateNavigation() {
        const navigation = document.getElementById('navigation');
        const userInfo = document.getElementById('user-info');
        const sessionInfo = document.getElementById('session-info');
        const refreshBtn = document.getElementById('refresh-token-btn');

        if (this.isAuthenticated()) {
            if (userInfo) {
                userInfo.textContent = `${this.user.name} (${this.user.role})`;
            }
            
            if (sessionInfo) {
                const expInfo = this.getTokenExpirationInfo();
                if (expInfo) {
                    sessionInfo.textContent = `Expires in: ${expInfo.expiresIn}`;
                    if (expInfo.timeUntilExpiry <= 300) { // 5 minutes
                        sessionInfo.style.color = '#e74c3c';
                    } else {
                        sessionInfo.style.color = 'rgba(255,255,255,0.8)';
                    }
                }
            }
            
            if (navigation) {
                navigation.style.display = 'block';
            }
            
            if (refreshBtn) {
                refreshBtn.style.display = 'inline-block';
                refreshBtn.textContent = 'Refresh Token';
            }
        } else {
            if (navigation) {
                navigation.style.display = 'none';
            }
        }
    }

    /**
     * Update token information displays
     */
    updateTokenDisplays() {
        const tokenInfoElements = [
            'customer-token-info',
            'admin-token-info'
        ];

        tokenInfoElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) return;

            if (!this.isAuthenticated()) {
                element.innerHTML = '<div class="loading-placeholder">Not authenticated</div>';
                return;
            }

            const expInfo = this.getTokenExpirationInfo();
            const payload = window.JWTUtils.parseJWT(this.accessToken);
            
            if (!expInfo || !payload) {
                element.innerHTML = '<div class="loading-placeholder">Invalid token</div>';
                return;
            }

            const status = expInfo.isExpired ? 'expired' : 
                          expInfo.timeUntilExpiry <= 300 ? 'expiring_soon' : 'valid';

            element.innerHTML = `
                <div class="token-status status-${status}">
                    <strong>Status:</strong> ${status.replace('_', ' ')}<br>
                    <strong>Expires:</strong> ${expInfo.expiresIn}<br>
                    <strong>Issued:</strong> ${expInfo.age}<br>
                    <strong>Session ID:</strong> ${payload.sessionId || 'N/A'}<br>
                    <strong>JTI:</strong> ${payload.jti || 'N/A'}
                </div>
            `;
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-text">${message}</span>
            </div>
        `;

        // Add styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 1001;
                    animation: slideIn 0.3s ease-out;
                    border-left: 4px solid var(--primary-color);
                }
                .notification-success { border-left-color: #27ae60; }
                .notification-error { border-left-color: #e74c3c; }
                .notification-warning { border-left-color: #f39c12; }
                .notification-info { border-left-color: #3498db; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * Debug information
     */
    getDebugInfo() {
        const expInfo = this.getTokenExpirationInfo();
        const payload = this.accessToken ? window.JWTUtils.parseJWT(this.accessToken) : null;

        return {
            storage: {
                type: this.storage.type,
                hasAccess: !!this.accessToken,
                hasRefresh: !!this.refreshToken,
                hasSession: !!this.sessionData,
                hasUser: !!this.user
            },
            token: {
                hasToken: !!this.accessToken,
                tokenPreview: this.accessToken ? this.accessToken.substring(0, 20) + '...' : null,
                isRefreshing: this.isRefreshing,
                expiration: expInfo
            },
            user: this.user,
            session: this.sessionData,
            jwtPayload: payload
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.clearRefreshTimer();
        this.clearTokens();
        console.log('Token manager destroyed');
    }
}

// Create and export singleton instance
window.tokenManager = new TokenManager();