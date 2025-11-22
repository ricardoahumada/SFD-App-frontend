// Enhanced Main Application with comprehensive functionality

/**
 * Initialize the enhanced application
 */
function initApp() {
    console.log('🚀 Initializing Advanced Authentication System v2.0...');
    
    // Initialize modules in order
    initializeCore();
    initializeEventListeners();
    initializeUIComponents();
    initializeAutoRefresh();
    initializeDebugMode();
    
    console.log('✅ Application initialized successfully');
    
    // Show welcome notification
    if (window.tokenManager.isAuthenticated()) {
        console.log('User already authenticated, redirecting...');
        const user = window.tokenManager.getUser();
        if (user) {
            setTimeout(() => {
                if (user.role === 'admin') {
                    window.router.navigate('/admin');
                } else {
                    window.router.navigate('/customer');
                }
            }, 500);
        }
    }
}

/**
 * Initialize core functionality
 */
function initializeCore() {
    // Initialize authentication event listeners
    window.auth.initializeAuthListeners();
    
    // Setup token event listeners
    window.auth.setupTokenListeners();
    
    // Initialize debug mode
    window.auth.initializeDebugMode();
    
    // Enable auto-login for development
    window.auth.enableAutoLogin();
    
    // Update initial UI
    window.auth.updateUserInfo();
}

/**
 * Initialize event listeners for views and components
 */
function initializeEventListeners() {
    // Customer service buttons
    const customerServiceBtn = document.getElementById('customer-service-btn');
    if (customerServiceBtn) {
        customerServiceBtn.addEventListener('click', handleCustomerService);
    }
    
    const customerDataBtn = document.getElementById('customer-data-btn');
    if (customerDataBtn) {
        customerDataBtn.addEventListener('click', handleCustomerData);
    }
    
    const customerFeedbackBtn = document.getElementById('customer-feedback-btn');
    if (customerFeedbackBtn) {
        customerFeedbackBtn.addEventListener('click', handleCustomerFeedback);
    }
    
    const customerSecurityBtn = document.getElementById('customer-security-btn');
    if (customerSecurityBtn) {
        customerSecurityBtn.addEventListener('click', handleCustomerSecurity);
    }
    
    const customerUpdateProfileBtn = document.getElementById('customer-update-profile');
    if (customerUpdateProfileBtn) {
        customerUpdateProfileBtn.addEventListener('click', handleCustomerUpdateProfile);
    }
    
    // Admin service buttons
    const adminServiceBtn = document.getElementById('admin-service-btn');
    if (adminServiceBtn) {
        adminServiceBtn.addEventListener('click', handleAdminService);
    }
    
    const adminUsersBtn = document.getElementById('admin-users-btn');
    if (adminUsersBtn) {
        adminUsersBtn.addEventListener('click', handleAdminUsers);
    }
    
    const adminSessionsBtn = document.getElementById('admin-sessions-btn');
    if (adminSessionsBtn) {
        adminSessionsBtn.addEventListener('click', handleAdminSessions);
    }
    
    const adminStatsBtn = document.getElementById('admin-stats-btn');
    if (adminStatsBtn) {
        adminStatsBtn.addEventListener('click', handleAdminStats);
    }
    
    const adminBlacklistBtn = document.getElementById('admin-blacklist-btn');
    if (adminBlacklistBtn) {
        adminBlacklistBtn.addEventListener('click', handleAdminBlacklist);
    }
    
    const adminMaintenanceBtn = document.getElementById('admin-maintenance-btn');
    if (adminMaintenanceBtn) {
        adminMaintenanceBtn.addEventListener('click', handleAdminMaintenance);
    }
    
    // Token control buttons
    const blacklistTokenBtn = document.getElementById('blacklist-token-btn');
    if (blacklistTokenBtn) {
        blacklistTokenBtn.addEventListener('click', handleBlacklistToken);
    }
    
    // Token debug button
    const showTokenDebugBtn = document.getElementById('show-token-debug');
    if (showTokenDebugBtn) {
        showTokenDebugBtn.addEventListener('click', showTokenDebug);
    }
    
    // Debug view buttons
    const refreshDebugBtn = document.getElementById('refresh-debug');
    if (refreshDebugBtn) {
        refreshDebugBtn.addEventListener('click', () => {
            if (window.router) {
                window.router.loadDebugInfo();
            }
        });
    }
    
    const closeDebugBtn = document.getElementById('close-debug');
    if (closeDebugBtn) {
        closeDebugBtn.addEventListener('click', () => {
            window.router.navigate('/');
        });
    }
    
    // Token expired view buttons
    const extendSessionBtn = document.getElementById('extend-session-btn');
    if (extendSessionBtn) {
        extendSessionBtn.addEventListener('click', window.auth.extendSession);
    }
    
    const loginAgainBtn = document.getElementById('login-again-btn');
    if (loginAgainBtn) {
        loginAgainBtn.addEventListener('click', () => {
            window.router.navigate('/login');
        });
    }
}

/**
 * Initialize UI components
 */
function initializeUIComponents() {
    // Initialize tooltips if needed
    initializeTooltips();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize auto-save functionality
    initializeAutoSave();
}

/**
 * Initialize automatic token refresh monitoring
 */
function initializeAutoRefresh() {
    // Check for token refresh every 30 seconds
    setInterval(() => {
        if (window.tokenManager.isAuthenticated() && window.tokenManager.needsRefresh()) {
            console.log('Auto-refreshing token...');
            window.tokenManager.autoRefresh().catch(error => {
                console.error('Auto-refresh failed:', error);
            });
        }
    }, 30000);
    
    // Check token expiration on page visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.tokenManager.isAuthenticated()) {
            if (window.tokenManager.needsRefresh()) {
                console.log('Page became visible, checking token...');
                window.tokenManager.autoRefresh().catch(error => {
                    console.error('Auto-refresh failed on visibility change:', error);
                });
            }
        }
    });
}

/**
 * Initialize debug mode
 */
function initializeDebugMode() {
    // Only in development mode
    if (window.router && window.router.isDevelopmentMode()) {
        // Add debug keyboard shortcut (Ctrl+D)
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault();
                if (window.router.currentRoute === '/debug') {
                    window.router.navigate('/');
                } else {
                    window.router.navigate('/debug');
                }
            }
        });
        
        // Add refresh keyboard shortcut (F5)
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F5') {
                event.preventDefault();
                window.router.refresh();
            }
        });
        
        console.log('🔧 Debug mode enabled. Use Ctrl+D to toggle debug view.');
    }
}

/**
 * Customer service handler
 */
async function handleCustomerService() {
    const resultDiv = document.getElementById('customer-service-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Accessing customer service...</div>';
    
    try {
        const response = await window.api.getCustomerService();
        if (response.success) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <div class="service-data">
                    <p><strong>Service:</strong> ${response.data.service}</p>
                    <p><strong>User:</strong> ${response.data.user.name} (${response.data.user.role})</p>
                    <p><strong>Session:</strong> ${response.data.session.id}</p>
                    <p><strong>Timestamp:</strong> ${new Date(response.data.timestamp).toLocaleString()}</p>
                    <p><strong>JWT Algorithm:</strong> ${response.data.jwt_info.algorithm}</p>
                    <p><strong>JTI:</strong> ${response.data.jwt_info.jti}</p>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Customer data handler
 */
async function handleCustomerData() {
    const resultDiv = document.getElementById('customer-service-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Loading customer data...</div>';
    
    try {
        const response = await window.api.getCustomerData();
        if (response.success) {
            const data = response.data;
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ Customer data retrieved</div>
                <div class="customer-data">
                    <h4>Order History:</h4>
                    ${data.orderHistory.map(order => `
                        <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #3498db;">
                            <strong>Order ${order.id}</strong><br>
                            Date: ${new Date(order.date).toLocaleDateString()}<br>
                            Amount: $${order.amount}<br>
                            Status: ${order.status}
                        </div>
                    `).join('')}
                    
                    <h4>Statistics:</h4>
                    <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px;">
                        <p><strong>Total Orders:</strong> ${data.statistics.totalOrders}</p>
                        <p><strong>Total Spent:</strong> $${data.statistics.totalSpent}</p>
                        <p><strong>Member Since:</strong> ${new Date(data.statistics.memberSince).toLocaleDateString()}</p>
                        <p><strong>Last Purchase:</strong> ${new Date(data.statistics.lastPurchase).toLocaleDateString()}</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Customer feedback handler
 */
async function handleCustomerFeedback() {
    const rating = prompt('Please rate your experience (1-5):');
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        window.tokenManager.showNotification('Invalid rating. Please enter a number between 1 and 5.', 'error');
        return;
    }
    
    const comment = prompt('Please provide additional feedback (optional):');
    
    const resultDiv = document.getElementById('customer-service-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Submitting feedback...</div>';
    
    try {
        const response = await window.api.submitFeedback(parseInt(rating), comment || '');
        if (response.success) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <div class="feedback-result">
                    <p><strong>Feedback ID:</strong> ${response.feedback.id}</p>
                    <p><strong>Rating:</strong> ${response.feedback.rating}/5</p>
                    <p><strong>Category:</strong> ${response.feedback.category}</p>
                    ${response.feedback.comment ? `<p><strong>Comment:</strong> ${response.feedback.comment}</p>` : ''}
                    <p><strong>Submitted:</strong> ${new Date(response.feedback.submittedAt).toLocaleString()}</p>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Customer security info handler
 */
async function handleCustomerSecurity() {
    const resultDiv = document.getElementById('customer-service-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Loading security information...</div>';
    
    try {
        const response = await window.api.getCustomerSecurity();
        if (response.success) {
            const security = response.security;
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ Security information retrieved</div>
                <div class="security-info">
                    <h4>Last Login:</h4>
                    <p>${security.lastLogin ? new Date(security.lastLogin.timestamp).toLocaleString() : 'Never'}</p>
                    
                    <h4>Active Sessions:</h4>
                    <p>${security.activeSessions}</p>
                    
                    <h4>Token Information:</h4>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
                        <p><strong>Algorithm:</strong> ${security.tokenInfo.algorithm}</p>
                        <p><strong>Session ID:</strong> ${security.tokenInfo.sessionId}</p>
                        <p><strong>JTI:</strong> ${security.tokenInfo.jti}</p>
                        <p><strong>Issued:</strong> ${new Date(security.tokenInfo.issuedAt).toLocaleString()}</p>
                        <p><strong>Expires:</strong> ${new Date(security.tokenInfo.expiresAt).toLocaleString()}</p>
                    </div>
                    
                    <h4>Permissions:</h4>
                    <div style="background: #e8f4fd; padding: 10px; border-radius: 4px;">
                        ${security.permissions.map(perm => `<span style="display: inline-block; background: #3498db; color: white; padding: 2px 8px; margin: 2px; border-radius: 12px; font-size: 12px;">${perm}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Customer profile update handler
 */
async function handleCustomerUpdateProfile() {
    const currentProfile = window.tokenManager.getUser();
    if (!currentProfile) return;
    
    const newName = prompt('Enter new name (leave blank to keep current):', currentProfile.name);
    if (newName === null) return; // User cancelled
    
    try {
        const response = await window.api.updateCustomerProfile({
            name: newName || currentProfile.name
        });
        
        if (response.success) {
            window.tokenManager.showNotification('Profile updated successfully', 'success');
            // Refresh the page to show updated profile
            if (window.router) {
                window.router.loadCustomerProfile();
            }
        }
    } catch (error) {
        window.tokenManager.showNotification('Failed to update profile: ' + error.message, 'error');
    }
}

/**
 * Admin service handler
 */
async function handleAdminService() {
    const resultDiv = document.getElementById('admin-service-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Accessing admin service...</div>';
    
    try {
        const response = await window.api.getAdminService();
        if (response.success) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <div class="service-data">
                    <p><strong>Service:</strong> ${response.data.service}</p>
                    <p><strong>Admin:</strong> ${response.data.user.name}</p>
                    <p><strong>Session:</strong> ${response.data.session.id}</p>
                    <p><strong>Timestamp:</strong> ${new Date(response.data.timestamp).toLocaleString()}</p>
                    <p><strong>JWT Algorithm:</strong> ${response.data.jwt_info.algorithm}</p>
                    <p><strong>JTI:</strong> ${response.data.jwt_info.jti}</p>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Admin users handler
 */
async function handleAdminUsers() {
    const resultDiv = document.getElementById('admin-users-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Loading users...</div>';
    
    try {
        const response = await window.api.getAdminUsers();
        if (response.success) {
            let usersHtml = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <p><strong>Total Users:</strong> ${response.totalUsers}</p>
                <div style="margin-top: 15px;">
            `;
            
            response.users.forEach(user => {
                usersHtml += `
                    <div style="background: white; padding: 15px; margin: 8px 0; border-radius: 6px; border-left: 4px solid ${user.role === 'admin' ? '#f39c12' : '#3498db'};">
                        <strong style="color: ${user.role === 'admin' ? '#f39c12' : '#3498db'};">${user.name}</strong>
                        <div style="margin-top: 5px; font-size: 14px; color: #666;">
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Role:</strong> ${user.role}</p>
                            <p><strong>ID:</strong> ${user.id}</p>
                            <p><strong>Scopes:</strong> ${user.scopes.join(', ')}</p>
                            <p><strong>Active Sessions:</strong> ${user.activeRefreshTokens}</p>
                            <p><strong>Last Login:</strong> ${user.lastLogin ? new Date(user.lastLogin.timestamp).toLocaleString() : 'Never'}</p>
                        </div>
                    </div>
                `;
            });
            
            usersHtml += '</div>';
            resultDiv.innerHTML = usersHtml;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Admin sessions handler
 */
async function handleAdminSessions() {
    const resultDiv = document.getElementById('admin-users-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Loading sessions...</div>';
    
    try {
        const response = await window.api.getAdminSessions();
        if (response.success) {
            let sessionsHtml = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <div class="session-summary">
                    <p><strong>Total Sessions:</strong> ${response.summary.total}</p>
                    <p><strong>Active Sessions:</strong> ${response.summary.active}</p>
                    <p><strong>Revoked Sessions:</strong> ${response.summary.revoked}</p>
                </div>
                <div style="margin-top: 15px;">
            `;
            
            response.sessions.forEach(session => {
                sessionsHtml += `
                    <div style="background: white; padding: 12px; margin: 6px 0; border-radius: 4px; border-left: 4px solid ${session.isRevoked ? '#e74c3c' : '#27ae60'};">
                        <strong>Session ${session.sessionId}</strong>
                        <div style="font-size: 13px; color: #666; margin-top: 4px;">
                            <p><strong>User:</strong> ${session.userEmail} (${session.userRole})</p>
                            <p><strong>Status:</strong> ${session.isRevoked ? 'Revoked' : 'Active'}</p>
                            <p><strong>Created:</strong> ${new Date(session.createdAt).toLocaleString()}</p>
                            <p><strong>Expires:</strong> ${new Date(session.expiresAt).toLocaleString()}</p>
                            <p><strong>IP:</strong> ${session.ipAddress}</p>
                        </div>
                    </div>
                `;
            });
            
            sessionsHtml += '</div>';
            resultDiv.innerHTML = sessionsHtml;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Admin stats handler
 */
async function handleAdminStats() {
    const resultDiv = document.getElementById('admin-stats-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Loading statistics...</div>';
    
    try {
        const response = await window.api.getAdminStats();
        if (response.success) {
            const stats = response.statistics;
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                        <h4>👥 Users</h4>
                        <p><strong>Total:</strong> ${stats.users.total}</p>
                        <p><strong>Admin:</strong> ${stats.users.admin}</p>
                        <p><strong>Customer:</strong> ${stats.users.customer}</p>
                        <p><strong>Active (1h):</strong> ${stats.users.activeLastHour}</p>
                        <p><strong>Active (24h):</strong> ${stats.users.activeLastDay}</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                        <h4>🔑 Sessions</h4>
                        <p><strong>Active Tokens:</strong> ${stats.sessions.totalActiveRefreshTokens}</p>
                        <p><strong>Revoked Tokens:</strong> ${stats.sessions.totalRevokedTokens}</p>
                        <p><strong>Avg/User:</strong> ${stats.sessions.averageSessionsPerUser}</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                        <h4>🛡️ Security</h4>
                        <p><strong>Blacklisted Access:</strong> ${stats.security.blacklistedAccessTokens}</p>
                        <p><strong>Blacklisted Refresh:</strong> ${stats.security.blacklistedRefreshTokens}</p>
                        <p><strong>Algorithm:</strong> ${stats.security.algorithm}</p>
                        <p><strong>Clock Skew:</strong> ${stats.security.clockSkewTolerance}s</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                        <h4>⚙️ System</h4>
                        <p><strong>Uptime:</strong> ${Math.floor(stats.system.uptime / 60)} minutes</p>
                        <p><strong>Memory Usage:</strong> ${(stats.system.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Node Version:</strong> ${stats.system.nodeVersion}</p>
                        <p><strong>Environment:</strong> ${stats.system.environment}</p>
                    </div>
                </div>
                
                <div class="permissions-info" style="margin-top: 20px;">
                    <h4>🔐 Available Permissions:</h4>
                    <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f39c12;">
                        <p><strong>Admin Scopes:</strong> ${stats.permissions.admin.join(', ') || 'None'}</p>
                        <p><strong>Customer Scopes:</strong> ${stats.permissions.customer.join(', ') || 'None'}</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Admin blacklist handler
 */
async function handleAdminBlacklist() {
    const resultDiv = document.getElementById('admin-stats-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Loading blacklist...</div>';
    
    try {
        const response = await window.api.getAdminBlacklist();
        if (response.success) {
            const blacklist = response.blacklist;
            let blacklistHtml = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <div class="blacklist-summary">
                    <p><strong>Access Tokens:</strong> ${blacklist.summary.accessTokensCount}</p>
                    <p><strong>Refresh Tokens:</strong> ${blacklist.summary.refreshTokensCount}</p>
                </div>
                
                <h4>Access Token Blacklist:</h4>
                <div style="max-height: 200px; overflow-y: auto; margin: 10px 0;">
            `;
            
            blacklist.accessTokens.forEach(token => {
                blacklistHtml += `
                    <div style="background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #f39c12;">
                        <strong>Token:</strong> ${token.token}<br>
                        <strong>Blacklisted:</strong> ${new Date(token.blacklistedAt).toLocaleString()}<br>
                        <strong>Reason:</strong> ${token.reason}<br>
                        <strong>Expires:</strong> ${new Date(token.expiresAt).toLocaleString()}
                    </div>
                `;
            });
            
            blacklistHtml += '</div>';
            
            if (blacklist.refreshTokens.length > 0) {
                blacklistHtml += `
                    <h4>Refresh Token Blacklist:</h4>
                    <div style="max-height: 200px; overflow-y: auto; margin: 10px 0;">
                `;
                
                blacklist.refreshTokens.forEach(token => {
                    blacklistHtml += `
                        <div style="background: #f8d7da; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #e74c3c;">
                            <strong>Token:</strong> ${token.token}<br>
                            <strong>Blacklisted:</strong> ${new Date(token.blacklistedAt).toLocaleString()}<br>
                            <strong>Reason:</strong> ${token.reason}
                        </div>
                    `;
                });
                
                blacklistHtml += '</div>';
            }
            
            resultDiv.innerHTML = blacklistHtml;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Admin maintenance handler
 */
async function handleAdminMaintenance() {
    const action = prompt('Maintenance action:\n1. cleanup_blacklist - Remove expired blacklist entries\n2. revoke_all_sessions - Revoke all user sessions\n\nEnter action name:');
    
    if (!action) return;
    
    const resultDiv = document.getElementById('admin-stats-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Performing maintenance...</div>';
    
    try {
        const response = await window.api.performMaintenance(action);
        if (response.success) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <div class="maintenance-result">
                    <p><strong>Action:</strong> ${response.result.action}</p>
                    <p><strong>Message:</strong> ${response.result.message}</p>
                    ${response.result.accessTokensBefore !== undefined ? `<p><strong>Access Tokens Before:</strong> ${response.result.accessTokensBefore}</p>` : ''}
                    ${response.result.refreshTokensBefore !== undefined ? `<p><strong>Refresh Tokens Before:</strong> ${response.result.refreshTokensBefore}</p>` : ''}
                    ${response.result.revokedSessions !== undefined ? `<p><strong>Revoked Sessions:</strong> ${response.result.revokedSessions}</p>` : ''}
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Token blacklisting handler
 */
async function handleBlacklistToken() {
    const tokenInput = document.getElementById('token-to-blacklist');
    const reasonInput = document.getElementById('blacklist-reason');
    
    if (!tokenInput || !reasonInput) return;
    
    const token = tokenInput.value.trim();
    const reason = reasonInput.value.trim() || 'manual_blacklist';
    
    if (!token) {
        window.tokenManager.showNotification('Please enter a token to blacklist', 'error');
        return;
    }
    
    const resultDiv = document.getElementById('admin-blacklist-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading-placeholder">Blacklisting token...</div>';
    
    try {
        const response = await window.api.blacklistToken(token, reason);
        if (response.success) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✅ ${response.message}</div>
                <div class="blacklist-result">
                    <p><strong>Token:</strong> ${response.token}</p>
                    <p><strong>Reason:</strong> ${response.reason}</p>
                    <p><strong>Blacklisted At:</strong> ${new Date(response.blacklisted_at).toLocaleString()}</p>
                    <p><strong>Blacklisted By:</strong> ${response.blacklisted_by}</p>
                </div>
            `;
            
            // Clear inputs
            tokenInput.value = '';
            reasonInput.value = '';
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">❌ Error: ${error.message}</div>
        `;
    }
}

/**
 * Show token debug information
 */
function showTokenDebug() {
    const tokenManager = window.tokenManager;
    const token = tokenManager.getAccessToken();
    
    if (!token) {
        window.tokenManager.showNotification('No token available for debugging', 'error');
        return;
    }
    
    const debugInfo = window.JWTUtils.formatTokenForDebug(token);
    
    // Create debug modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1002;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    content.innerHTML = `
        <h3>🔍 Token Debug Information</h3>
        <button onclick="this.parentElement.parentElement.remove()" style="float: right; padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow: auto; font-size: 12px; line-height: 1.4; margin-top: 20px;">${debugInfo}</pre>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Initialize tooltips (if needed)
 */
function initializeTooltips() {
    // Add tooltip functionality if needed
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = e.target.getAttribute('data-tooltip');
            // Implement tooltip display logic
        });
    });
}

/**
 * Initialize form validation
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#e74c3c';
                } else {
                    field.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                window.tokenManager.showNotification('Please fill in all required fields', 'error');
            }
        });
    });
}

/**
 * Initialize auto-save functionality
 */
function initializeAutoSave() {
    // Auto-save form data to localStorage
    const autoSaveFields = document.querySelectorAll('[data-autosave]');
    autoSaveFields.forEach(field => {
        const saveKey = field.getAttribute('data-autosave');
        
        // Load saved value
        const savedValue = localStorage.getItem(`autosave_${saveKey}`);
        if (savedValue && field.type !== 'password') {
            field.value = savedValue;
        }
        
        // Save on change
        field.addEventListener('input', () => {
            if (field.type !== 'password') {
                localStorage.setItem(`autosave_${saveKey}`, field.value);
            }
        });
    });
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    if (window.tokenManager && window.tokenManager.showNotification) {
        window.tokenManager.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Debug function for development
 */
function debugInfo() {
    const tokenManager = window.tokenManager;
    
    console.log('=== Debug Info ===');
    console.log('Current Route:', window.router?.getCurrentRoute());
    console.log('Is Authenticated:', tokenManager?.isAuthenticated());
    console.log('Current User:', tokenManager?.getUser());
    console.log('Token Info:', tokenManager?.getTokenExpirationInfo());
    console.log('API Config:', window.api?.getConfig());
    console.log('Debug Info:', tokenManager?.getDebugInfo());
    console.log('==================');
}

// Make debug function globally available
window.debugInfo = debugInfo;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make app functions globally available
window.app = {
    initApp,
    showNotification,
    debugInfo,
    // Handler functions
    handleCustomerService,
    handleCustomerData,
    handleCustomerFeedback,
    handleCustomerSecurity,
    handleAdminService,
    handleAdminUsers,
    handleAdminStats
};