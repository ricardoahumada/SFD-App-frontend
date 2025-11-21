// Main application file

/**
 * Initialize the application
 */
function initApp() {
    console.log('Initializing Authentication System...');
    
    // Initialize authentication listeners
    window.auth.initializeAuthListeners();
    
    // Initialize view-specific event listeners
    initializeViewListeners();
    
    // Update user info in navigation
    window.auth.updateUserInfo();
    
    // Enable auto-login for development
    window.auth.enableAutoLogin();
    
    console.log('Application initialized successfully');
}

/**
 * Initialize event listeners for specific views
 */
function initializeViewListeners() {
    // Customer service button
    const customerServiceBtn = document.getElementById('customer-service-btn');
    if (customerServiceBtn) {
        customerServiceBtn.addEventListener('click', handleCustomerService);
    }
    
    // Admin service button
    const adminServiceBtn = document.getElementById('admin-service-btn');
    if (adminServiceBtn) {
        adminServiceBtn.addEventListener('click', handleAdminService);
    }
    
    // Admin users button
    const adminUsersBtn = document.getElementById('admin-users-btn');
    if (adminUsersBtn) {
        adminUsersBtn.addEventListener('click', handleAdminUsers);
    }
    
    // Admin stats button
    const adminStatsBtn = document.getElementById('admin-stats-btn');
    if (adminStatsBtn) {
        adminStatsBtn.addEventListener('click', handleAdminStats);
    }
}

/**
 * Handle customer service request
 */
async function handleCustomerService() {
    const resultDiv = document.getElementById('customer-service-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await window.api.getCustomerService();
        if (response.success) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✓ ${response.message}</div>
                <p><strong>Service:</strong> ${response.data.service}</p>
                <p><strong>User:</strong> ${response.data.user.name} (${response.data.user.role})</p>
                <p><strong>Timestamp:</strong> ${response.data.timestamp}</p>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">✗ Error: ${error.message}</div>
        `;
    }
}

/**
 * Handle admin service request
 */
async function handleAdminService() {
    const resultDiv = document.getElementById('admin-service-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await window.api.getAdminService();
        if (response.success) {
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✓ ${response.message}</div>
                <p><strong>Service:</strong> ${response.data.service}</p>
                <p><strong>User:</strong> ${response.data.user.name} (${response.data.user.role})</p>
                <p><strong>Timestamp:</strong> ${response.data.timestamp}</p>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">✗ Error: ${error.message}</div>
        `;
    }
}

/**
 * Handle admin users request
 */
async function handleAdminUsers() {
    const resultDiv = document.getElementById('admin-users-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await window.api.getAdminUsers();
        if (response.success) {
            let usersHtml = `
                <div style="color: #27ae60; font-weight: bold;">✓ ${response.message}</div>
                <p><strong>Total Users:</strong> ${response.totalUsers}</p>
                <div style="margin-top: 15px;">
            `;
            
            response.users.forEach(user => {
                usersHtml += `
                    <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #3498db;">
                        <strong>${user.name}</strong><br>
                        Email: ${user.email}<br>
                        Role: ${user.role}<br>
                        ID: ${user.id}
                    </div>
                `;
            });
            
            usersHtml += '</div>';
            resultDiv.innerHTML = usersHtml;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">✗ Error: ${error.message}</div>
        `;
    }
}

/**
 * Handle admin stats request
 */
async function handleAdminStats() {
    const resultDiv = document.getElementById('admin-stats-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await window.api.getAdminStats();
        if (response.success) {
            const stats = response.statistics;
            resultDiv.innerHTML = `
                <div style="color: #27ae60; font-weight: bold;">✓ ${response.message}</div>
                <div style="margin-top: 15px;">
                    <p><strong>Total Users:</strong> ${stats.totalUsers}</p>
                    <p><strong>Admin Users:</strong> ${stats.adminUsers}</p>
                    <p><strong>Customer Users:</strong> ${stats.customerUsers}</p>
                    <p><strong>System Status:</strong> ${stats.systemStatus}</p>
                    <p><strong>Last Update:</strong> ${stats.lastUpdate}</p>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">✗ Error: ${error.message}</div>
        `;
    }
}

/**
 * Show notification message
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 1001;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Debug function to help with development
 */
function debugInfo() {
    const user = window.api.getCurrentUser();
    const isAuth = window.api.isAuthenticated();
    const route = window.router.getCurrentRoute();
    
    console.log('=== Debug Info ===');
    console.log('Current Route:', route);
    console.log('Is Authenticated:', isAuth);
    console.log('Current User:', user);
    console.log('Token:', window.api.getToken());
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
    debugInfo
};