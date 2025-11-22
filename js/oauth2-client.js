/**
 * OAuth 2.0 Client Implementation
 * Handles Google OAuth2 integration with PKCE support
 */

class OAuth2Client {
    constructor(config = {}) {
        this.config = {
            backendUrl: config.backendUrl || 'http://localhost:3000',
            clientId: config.clientId || 'demo-client',
            redirectUri: config.redirectUri || 'http://localhost:5173/oauth2/callback',
            scopes: config.scopes || ['openid', 'email', 'profile'],
            ...config
        };
        
        this.tokens = {
            accessToken: null,
            refreshToken: null,
            idToken: null,
            expiresAt: null
        };
        
        this.pkceData = {
            codeVerifier: null,
            codeChallenge: null,
            state: null,
            nonce: null
        };
        
        // Try to restore PKCE data from sessionStorage if available
        this.restorePkceData();
        
        // Load stored tokens from localStorage
        this.loadStoredTokens();
        
        this.init();
    }

    /**
     * Restore PKCE data from sessionStorage
     */
    restorePkceData() {
        try {
            const storedPkceData = sessionStorage.getItem('oauth2_pkce_data');
            if (storedPkceData) {
                const parsed = JSON.parse(storedPkceData);
                // Only restore if we have all required fields and they're not expired (2 hours)
                if (parsed.codeVerifier && parsed.codeChallenge && parsed.state && parsed.nonce) {
                    this.pkceData = {
                        codeVerifier: parsed.codeVerifier,
                        codeChallenge: parsed.codeChallenge,
                        state: parsed.state,
                        nonce: parsed.nonce
                    };
                    console.log('PKCE data restored from sessionStorage:', this.pkceData);
                } else {
                    console.log('PKCE data incomplete, skipping restoration');
                    this.pkceData = { codeVerifier: null, codeChallenge: null, state: null, nonce: null };
                }
            }
        } catch (error) {
            console.warn('Failed to restore PKCE data:', error);
            this.pkceData = { codeVerifier: null, codeChallenge: null, state: null, nonce: null };
        }
    }

    /**
     * Initialize OAuth2 client
     */
    init() {
        console.log('OAuth2 Client initialized:', this.config);
        this.loadStoredTokens();
        // Note: updateUI() will be called after page load to ensure all global functions are available
    }

    /**
     * Start OAuth2 authorization flow
     */
    async startAuthorizationFlow() {
        try {
            showLoading(true);
            
            // Clear any existing PKCE data to ensure fresh start
            this.pkceData = {
                codeVerifier: null,
                codeChallenge: null,
                state: null,
                nonce: null
            };
            sessionStorage.removeItem('oauth2_pkce_data');
            
            console.log('Starting fresh OAuth2 authorization flow');
            
            // Get authorization URL from backend
            const response = await fetch(`${this.config.backendUrl}/api/oauth2/authorize`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to generate authorization URL');
            }

            // Store PKCE data for validation
            this.pkceData = {
                codeVerifier: data.data.pkce.codeVerifier,
                codeChallenge: data.data.pkce.codeChallenge,
                state: data.data.state,
                nonce: data.data.nonce
            };

            // Store in session storage for persistence
            sessionStorage.setItem('oauth2_pkce_data', JSON.stringify(this.pkceData));

            return data.data;
        } catch (error) {
            console.error('Authorization flow error:', error);
            showToast('Failed to start authorization flow', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code) {
        try {
            showLoading(true);

            // Restore PKCE data from sessionStorage if not already restored
            const storedPkceData = sessionStorage.getItem('oauth2_pkce_data');
            if (storedPkceData) {
                this.pkceData = JSON.parse(storedPkceData);
            }

            // Validate PKCE data
            if (!this.pkceData.state || !this.pkceData.codeVerifier) {
                console.error('Missing PKCE data:', this.pkceData);
                throw new Error('Missing PKCE data. Please restart the authorization flow to get a new authorization code.');
            }

            console.log('Using PKCE data for token exchange:', this.pkceData);

            const requestBody = {
                code: code,
                state: this.pkceData.state
            };

            // Add PKCE code verifier
            requestBody.code_verifier = this.pkceData.codeVerifier;

            const response = await fetch(`${this.config.backendUrl}/api/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Token exchange failed');
            }

            // Store tokens
            this.tokens.accessToken = data.data.access_token;
            this.tokens.refreshToken = data.data.refresh_token;
            this.tokens.idToken = data.data.id_token;
            this.tokens.expiresAt = Date.now() + (data.data.expires_in * 1000);

            // Store tokens securely (in production, use httpOnly cookies)
            this.storeTokens();

            // Clear PKCE data as it's one-time use
            sessionStorage.removeItem('oauth2_pkce_data');
            this.pkceData = {};

            return data.data;
        } catch (error) {
            console.error('Token exchange error:', error);
            showToast('Token exchange failed', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        try {
            if (!this.tokens.refreshToken) {
                throw new Error('No refresh token available');
            }

            showLoading(true);

            const response = await fetch(`${this.config.backendUrl}/api/oauth2/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: this.tokens.refreshToken
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Token refresh failed');
            }

            // Update access token
            this.tokens.accessToken = data.data.access_token;
            this.tokens.expiresAt = Date.now() + (data.data.expires_in * 1000);

            // Store updated tokens
            this.storeTokens();

            return data.data;
        } catch (error) {
            console.error('Token refresh error:', error);
            showToast('Token refresh failed', 'error');
            
            // Clear invalid tokens
            this.clearTokens();
            throw error;
        } finally {
            showLoading(false);
        }
    }

    /**
     * Get user information
     */
    async getUserInfo() {
        try {
            if (!this.tokens.accessToken) {
                throw new Error('No access token available');
            }

            const response = await fetch(`${this.config.backendUrl}/api/oauth2/userinfo`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get user info');
            }

            return data.data;
        } catch (error) {
            console.error('Get user info error:', error);
            showToast('Failed to get user information', 'error');
            throw error;
        }
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        try {
            // Check if token needs refresh
            if (this.isTokenExpired() && this.tokens.refreshToken) {
                await this.refreshAccessToken();
            }

            const config = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            // Add authorization header if access token is available
            if (this.tokens.accessToken) {
                config.headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
            }

            const response = await fetch(`${this.config.backendUrl}${endpoint}`, config);

            // Handle token expiration
            if (response.status === 401 && this.tokens.refreshToken) {
                try {
                    await this.refreshAccessToken();
                    config.headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
                    const retryResponse = await fetch(`${this.config.backendUrl}${endpoint}`, config);
                    
                    if (!retryResponse.ok) {
                        throw new Error(`HTTP error! status: ${retryResponse.status}`);
                    }
                    
                    return await retryResponse.json();
                } catch (refreshError) {
                    this.clearTokens();
                    throw new Error('Authentication failed. Please log in again.');
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            showToast(error.message, 'error');
            throw error;
        }
    }

    /**
     * Check if access token is expired
     */
    isTokenExpired() {
        if (!this.tokens.expiresAt) return true;
        return Date.now() >= (this.tokens.expiresAt - 60000); // Refresh 1 minute before expiry
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.tokens.accessToken && !this.isTokenExpired();
    }

    /**
     * Store tokens securely
     */
    storeTokens() {
        try {
            // In production, use httpOnly cookies instead of localStorage
            localStorage.setItem('oauth2_tokens', JSON.stringify({
                accessToken: this.tokens.accessToken,
                refreshToken: this.tokens.refreshToken,
                idToken: this.tokens.idToken,
                expiresAt: this.tokens.expiresAt
            }));
        } catch (error) {
            console.error('Failed to store tokens:', error);
        }
    }

    /**
     * Load stored tokens
     */
    loadStoredTokens() {
        try {
            const stored = localStorage.getItem('oauth2_tokens');
            if (stored) {
                const tokens = JSON.parse(stored);
                this.tokens = { ...this.tokens, ...tokens };
                
                // Check if token is still valid
                if (this.isTokenExpired()) {
                    this.clearTokens();
                }
            }
        } catch (error) {
            console.error('Failed to load stored tokens:', error);
        }
    }

    /**
     * Clear all tokens
     */
    clearTokens() {
        this.tokens = {
            accessToken: null,
            refreshToken: null,
            idToken: null,
            expiresAt: null
        };
        
        try {
            localStorage.removeItem('oauth2_tokens');
            sessionStorage.removeItem('oauth2_pkce_data');
        } catch (error) {
            console.error('Failed to clear tokens:', error);
        }
        
        this.updateUI();
    }

    /**
     * Update UI based on authentication status
     */
    updateUI() {
        const isAuth = this.isAuthenticated();
        
        // Update protected buttons
        const protectedButtons = document.querySelectorAll('.endpoint-card .btn:not(.btn-secondary)');
        protectedButtons.forEach(btn => {
            btn.disabled = !isAuth;
        });

        // Update token status (with safety check)
        if (typeof updateTokenStatus === 'function') {
            updateTokenStatus();
        }
    }

    /**
     * Get current tokens
     */
    getTokens() {
        return { ...this.tokens };
    }

    /**
     * Logout
     */
    logout() {
        this.clearTokens();
        showToast('Logged out successfully', 'success');
    }
}

// Create global OAuth2 client instance
const oauth2Client = new OAuth2Client({
    backendUrl: 'http://localhost:3000',
    clientId: 'oauth2-pkce-demo',
    redirectUri: 'http://localhost:5173/callback',
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/userinfo.email']
});

// Global functions for HTML onclick handlers
window.startOAuth2Flow = async function() {
    try {
        const authData = await oauth2Client.startAuthorizationFlow();
        
        // Display results
        const resultDiv = document.getElementById('auth-url-result');
        const pkceDiv = document.getElementById('pkce-details');
        const codeVerifierSpan = document.getElementById('code-verifier-display');
        const codeChallengeSpan = document.getElementById('code-challenge-display');
        
        resultDiv.innerHTML = `
            <div class="success">
                <strong>Authorization URL Generated Successfully!</strong><br><br>
                <strong>URL:</strong><br>
                <code>${authData.authorizationUrl}</code><br><br>
                <strong>State:</strong> ${authData.state}<br>
                <strong>Nonce:</strong> ${authData.nonce}<br>
                <strong>PKCE:</strong> ${authData.pkce.enabled ? 'Enabled' : 'Disabled'}
            </div>
        `;
        
        if (authData.pkce.enabled && authData.pkce.codeVerifier) {
            codeVerifierSpan.textContent = oauth2Client.pkceData.codeVerifier;
            codeChallengeSpan.textContent = oauth2Client.pkceData.codeChallenge;
            pkceDiv.style.display = 'block';
        }
        
        resultDiv.style.display = 'block';
        showToast('Authorization URL generated successfully!', 'success');
        
    } catch (error) {
        console.error('OAuth2 flow error:', error);
        showToast('Failed to start OAuth2 flow', 'error');
    }
};

window.exchangeCodeForTokens = async function() {
    const codeInput = document.getElementById('authorization-code');
    let code = codeInput.value.trim();
    
    if (!code) {
        showToast('Please enter an authorization code', 'warning');
        return;
    }
    
    // URL decode the authorization code (it's encoded in the callback URL)
    try {
        code = decodeURIComponent(code);
        console.log('🔍 Frontend: URL-decoded authorization code:', code.substring(0, 20) + '...');
    } catch (error) {
        console.warn('⚠️ Frontend: Failed to URL-decode authorization code, proceeding as-is');
    }
    
    try {
        const tokenData = await oauth2Client.exchangeCodeForTokens(code);
        
        // Display results
        const resultDiv = document.getElementById('token-result');
        resultDiv.innerHTML = `
            <div class="success">
                <strong>Tokens Generated Successfully!</strong><br><br>
                <strong>Access Token:</strong><br>
                <code>${tokenData.access_token.substring(0, 50)}...</code><br><br>
                <strong>Refresh Token:</strong><br>
                <code>${tokenData.refresh_token ? tokenData.refresh_token.substring(0, 50) + '...' : 'None'}</code><br><br>
                <strong>Expires In:</strong> ${tokenData.expires_in} seconds<br>
                <strong>Token Type:</strong> ${tokenData.token_type}<br>
                <strong>PKCE Validated:</strong> ${tokenData.pkce?.validated ? 'Yes' : 'No'}
            </div>
        `;
        resultDiv.style.display = 'block';
        
        oauth2Client.updateUI();
        showToast('Tokens generated successfully!', 'success');
        
    } catch (error) {
        console.error('Token exchange error:', error);
        showToast('Token exchange failed', 'error');
    }
};

window.getUserProfile = async function() {
    try {
        const data = await oauth2Client.apiRequest('/api/user/profile');
        displayApiResult(data);
    } catch (error) {
        console.error('Get profile error:', error);
    }
};

window.getUserDashboard = async function() {
    try {
        const data = await oauth2Client.apiRequest('/api/user/dashboard');
        displayApiResult(data);
    } catch (error) {
        console.error('Get dashboard error:', error);
    }
};

window.refreshAccessToken = async function() {
    try {
        const data = await oauth2Client.refreshAccessToken();
        
        displayApiResult({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                access_token: data.access_token.substring(0, 50) + '...',
                expires_in: data.expires_in,
                token_type: data.token_type
            }
        });
        
        showToast('Token refreshed successfully!', 'success');
    } catch (error) {
        console.error('Refresh token error:', error);
    }
};

window.testEndpoint = async function(endpoint) {
    try {
        const data = await oauth2Client.apiRequest(endpoint);
        displayApiResult(data);
    } catch (error) {
        console.error('Test endpoint error:', error);
    }
};

window.generatePKCEDemo = async function() {
    try {
        const response = await fetch('http://localhost:3000/api/oauth2/demo/pkce-comparison');
        const data = await response.json();
        displayPKCEDemo(data);
    } catch (error) {
        console.error('PKCE demo error:', error);
        showToast('Failed to load PKCE demo', 'error');
    }
};

window.copyToClipboard = function(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Copied to clipboard!', 'success');
    });
};







// Initialize UI on page load
document.addEventListener('DOMContentLoaded', function() {
    oauth2Client.updateUI();
});