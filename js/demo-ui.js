/**
 * Demo UI Handler
 * Manages the user interface interactions and animations
 */

class DemoUI {
    constructor() {
        this.currentTab = 'oauth2-demo';
        this.notifications = [];
        this.init();
    }

    /**
     * Initialize the demo UI
     */
    init() {
        this.setupTabNavigation();
        this.setupKeyboardShortcuts();
        this.addWelcomeAnimation();
        this.startPeriodicUpdates();
    }

    /**
     * Setup tab navigation functionality
     */
    setupTabNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    /**
     * Switch between tabs
     */
    switchTab(tabId) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;
        this.onTabSwitch(tabId);
    }

    /**
     * Handle tab switch events
     */
    onTabSwitch(tabId) {
        switch (tabId) {
            case 'oauth2-demo':
                this.highlightDemoSteps();
                break;
            case 'pkce-comparison':
                this.animateComparisonCards();
                break;
            case 'security-benefits':
                this.animateBenefitCards();
                break;
            case 'api-test':
                this.updateAPIButtons();
                break;
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + number keys to switch tabs
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('oauth2-demo');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('pkce-comparison');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('security-benefits');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchTab('api-test');
                        break;
                }
            }

            // Escape to close overlays
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }
        });
    }

    /**
     * Add welcome animation to the page
     */
    addWelcomeAnimation() {
        const header = document.querySelector('.header');
        const nav = document.querySelector('.navigation');
        
        // Animate header
        setTimeout(() => {
            header.style.animation = 'slideInDown 0.8s ease-out';
        }, 100);

        // Animate navigation
        setTimeout(() => {
            nav.style.animation = 'slideInUp 0.8s ease-out';
        }, 300);

        // Add CSS for animations if not present
        if (!document.querySelector('#demo-animations')) {
            const style = document.createElement('style');
            style.id = 'demo-animations';
            style.textContent = `
                @keyframes slideInDown {
                    from { opacity: 0; transform: translateY(-50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { opacity: 1; transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-bounce {
                    animation: bounceIn 0.6s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Highlight demo steps progressively
     */
    highlightDemoSteps() {
        const steps = document.querySelectorAll('.step');
        let currentStep = 0;

        // Reset all steps
        steps.forEach(step => {
            step.style.opacity = '0.6';
            step.style.transform = 'scale(0.98)';
        });

        // Animate steps one by one
        const animateNextStep = () => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                step.style.transition = 'all 0.5s ease';
                step.style.opacity = '1';
                step.style.transform = 'scale(1)';
                step.classList.add('animate-bounce');
                
                setTimeout(() => {
                    step.classList.remove('animate-bounce');
                }, 600);
                
                currentStep++;
                setTimeout(animateNextStep, 800);
            }
        };

        animateNextStep();
    }

    /**
     * Animate comparison cards
     */
    animateComparisonCards() {
        const cards = document.querySelectorAll('.comparison-card');
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(' + (index === 0 ? '-50px' : '50px') + ')';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateX(0)';
            }, index * 200);
        });
    }

    /**
     * Animate benefit cards
     */
    animateBenefitCards() {
        const cards = document.querySelectorAll('.benefit-card');
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    /**
     * Update API testing buttons
     */
    updateAPIButtons() {
        const protectedButtons = document.querySelectorAll('.endpoint-card .btn:not(.btn-secondary)');
        
        if (oauth2Client && oauth2Client.isAuthenticated()) {
            protectedButtons.forEach(btn => {
                btn.disabled = false;
            });
        } else {
            protectedButtons.forEach(btn => {
                btn.disabled = true;
            });
        }
    }

    /**
     * Start periodic updates
     */
    startPeriodicUpdates() {
        // Update token status every 30 seconds
        setInterval(() => {
            if (oauth2Client) {
                this.updateTokenStatusDisplay();
            }
        }, 30000);

        // Update PKCE demo data every 60 seconds
        setInterval(() => {
            if (this.currentTab === 'pkce-comparison') {
                this.refreshPKCEDemoData();
            }
        }, 60000);
    }

    /**
     * Update token status display
     */
    updateTokenStatusDisplay() {
        const statusDiv = document.getElementById('token-status');
        if (statusDiv && oauth2Client) {
            const tokens = oauth2Client.getTokens();
            
            if (oauth2Client.isAuthenticated()) {
                const timeUntilExpiry = Math.max(0, tokens.expiresAt - Date.now());
                const minutes = Math.floor(timeUntilExpiry / 60000);
                const seconds = Math.floor((timeUntilExpiry % 60000) / 1000);
                
                statusDiv.innerHTML = `
                    <div class="success">
                        <strong>✅ Authenticated</strong><br>
                        <strong>Access Token:</strong> ${tokens.accessToken ? 'Present' : 'Missing'}<br>
                        <strong>Refresh Token:</strong> ${tokens.refreshToken ? 'Present' : 'Missing'}<br>
                        <strong>Expires In:</strong> ${minutes}m ${seconds}s<br>
                        <small>Auto-refreshes at ${new Date(tokens.expiresAt - 60000).toLocaleTimeString()}</small>
                    </div>
                `;
            } else {
                statusDiv.innerHTML = `
                    <div class="error">
                        <strong>❌ Not Authenticated</strong><br>
                        No active tokens. Please complete the OAuth2 flow.
                    </div>
                `;
            }
        }
    }

    /**
     * Refresh PKCE demo data
     */
    async refreshPKCEDemoData() {
        try {
            const response = await fetch('http://localhost:3000/api/oauth2/demo/status');
            const data = await response.json();
            
            // Update PKCE demo if visible
            const demoResult = document.getElementById('pkce-demo-result');
            if (demoResult && demoResult.style.display !== 'none') {
                demoResult.innerHTML += `
                    <div style="margin-top: 1rem; font-size: 0.9em; opacity: 0.7;">
                        Last updated: ${new Date().toLocaleTimeString()}<br>
                        Active PKCE challenges: ${data.data.active_challenges}
                    </div>
                `;
            }
        } catch (error) {
            console.warn('Failed to refresh PKCE demo data:', error);
        }
    }

    /**
     * Close all overlays
     */
    closeAllOverlays() {
        const overlays = document.querySelectorAll('.loading-overlay');
        overlays.forEach(overlay => {
            overlay.style.display = 'none';
        });
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);

        // Add to notifications array
        this.notifications.push({
            message,
            type,
            timestamp: new Date(),
            element: toast
        });

        // Limit notifications to prevent overflow
        if (this.notifications.length > 5) {
            const oldToast = this.notifications.shift();
            if (oldToast.element && oldToast.element.parentNode) {
                oldToast.element.remove();
            }
        }
    }

    /**
     * Get icon for toast type
     */
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-bell';
        }
    }

    /**
     * Display API request/response details
     */
    displayRequestResponse(requestData, responseData) {
        const requestDiv = document.getElementById('request-details');
        const responseDiv = document.getElementById('response-details');

        if (requestDiv) {
            requestDiv.innerHTML = `
                <strong>📤 Request:</strong><br>
                <pre>${JSON.stringify(requestData, null, 2)}</pre>
            `;
        }

        if (responseDiv) {
            const isSuccess = responseData.success !== false;
            responseDiv.innerHTML = `
                <strong>📥 Response (${isSuccess ? 'Success' : 'Error'}):</strong><br>
                <pre>${JSON.stringify(responseData, null, 2)}</pre>
            `;
        }
    }

    /**
     * Update demo progress indicators
     */
    updateDemoProgress(step, completed = false) {
        const stepElement = document.getElementById(`step-${step}`);
        if (stepElement) {
            const indicator = stepElement.querySelector('.step-number');
            if (completed) {
                indicator.style.background = 'var(--secondary-color)';
                indicator.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                indicator.style.background = 'var(--primary-color)';
                indicator.textContent = step;
            }
        }
    }

    /**
     * Highlight security features
     */
    highlightSecurityFeatures() {
        const features = document.querySelectorAll('.benefit-card');
        let index = 0;

        const highlightNext = () => {
            if (index < features.length) {
                const feature = features[index];
                feature.style.transform = 'scale(1.02)';
                feature.style.boxShadow = '0 8px 25px rgba(66, 133, 244, 0.3)';
                
                setTimeout(() => {
                    feature.style.transform = '';
                    feature.style.boxShadow = '';
                    index++;
                    setTimeout(highlightNext, 500);
                }, 1000);
            }
        };

        highlightNext();
    }

    /**
     * Export demo data
     */
    exportDemoData() {
        const data = {
            timestamp: new Date().toISOString(),
            oauth2Tokens: oauth2Client ? oauth2Client.getTokens() : null,
            notifications: this.notifications,
            currentTab: this.currentTab,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            demoVersion: '3.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oauth2-demo-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Demo data exported successfully', 'success');
    }
}

// Global functions for HTML onclick handlers
window.showLoading = function(show) {
    if (window.demoUI) {
        window.demoUI.showLoading(show);
    }
};

window.showToast = function(message, type, duration) {
    if (window.demoUI) {
        window.demoUI.showToast(message, type, duration);
    }
};

window.updateTokenStatus = function() {
    if (window.demoUI) {
        window.demoUI.updateTokenStatusDisplay();
    }
};

window.displayApiResult = function(data) {
    if (window.demoUI) {
        const resultDiv = document.getElementById('api-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="${data.success ? 'success' : 'error'}">
                    <strong>Response:</strong><br>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    }
};

window.displayPKCEDemo = function(data) {
    if (window.demoUI) {
        const resultDiv = document.getElementById('pkce-demo-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="info">
                    <strong>PKCE Demonstration:</strong><br>
                    <strong>Concept:</strong> ${data.demo.pkce_concept.description}<br>
                    <strong>Problem:</strong> ${data.demo.pkce_concept.problem}<br>
                    <strong>Solution:</strong> ${data.demo.pkce_concept.solution}<br><br>
                    
                    <strong>S256 Method (Recommended):</strong><br>
                    <code>${data.demo.methods.s256.code_challenge}</code><br><br>
                    
                    <strong>Plain Method (Insecure):</strong><br>
                    <code>${data.demo.methods.plain.code_challenge}</code><br><br>
                    
                    <strong>Security Level Comparison:</strong><br>
                    S256: <span style="color: green;">${data.demo.methods.s256.security_level}</span><br>
                    Plain: <span style="color: red;">${data.demo.methods.plain.security_level}</span>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    }
};

// Initialize demo UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.demoUI = new DemoUI();
    
    // Add keyboard shortcut hint
    setTimeout(() => {
        window.demoUI.showToast('💡 Tip: Use Alt+1, Alt+2, Alt+3, Alt+4 to switch tabs quickly', 'info', 8000);
    }, 2000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemoUI;
}