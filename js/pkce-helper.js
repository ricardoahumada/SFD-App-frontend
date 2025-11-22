/**
 * PKCE (Proof Key for Code Exchange) Helper Functions
 * Educational implementation for demonstrating PKCE concepts
 */

class PKCEHelper {
    constructor() {
        this.supportedMethods = ['S256', 'plain'];
        this.defaultLength = 128;
        this.charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    }

    /**
     * Generate a cryptographically secure code verifier
     * @param {number} length - Length of the code verifier (43-128 characters)
     * @returns {string} Base64url-encoded random string
     */
    generateCodeVerifier(length = this.defaultLength) {
        if (length < 43 || length > 128) {
            throw new Error('Code verifier length must be between 43 and 128 characters');
        }

        try {
            // Use Web Crypto API for cryptographically secure random generation
            const randomValues = new Uint8Array(length);
            crypto.getRandomValues(randomValues);

            let codeVerifier = '';
            for (let i = 0; i < length; i++) {
                codeVerifier += this.charset[randomValues[i] % this.charset.length];
            }

            return codeVerifier;
        } catch (error) {
            // Fallback for older browsers
            console.warn('Web Crypto API not available, using Math.random() fallback');
            return this.generateCodeVerifierFallback(length);
        }
    }

    /**
     * Fallback code verifier generation for older browsers
     */
    generateCodeVerifierFallback(length) {
        let codeVerifier = '';
        for (let i = 0; i < length; i++) {
            codeVerifier += this.charset[Math.floor(Math.random() * this.charset.length)];
        }
        return codeVerifier;
    }

    /**
     * Generate code challenge from code verifier using specified method
     * @param {string} codeVerifier - The code verifier string
     * @param {string} method - Challenge method ('S256' or 'plain')
     * @returns {string} Base64url-encoded code challenge
     */
    async generateCodeChallenge(codeVerifier, method = 'S256') {
        if (!codeVerifier) {
            throw new Error('Code verifier is required');
        }

        if (!this.supportedMethods.includes(method)) {
            throw new Error(`Unsupported method: ${method}. Use: ${this.supportedMethods.join(', ')}`);
        }

        if (method === 'S256') {
            return await this.generateCodeChallengeS256(codeVerifier);
        } else if (method === 'plain') {
            return this.generateCodeChallengePlain(codeVerifier);
        }

        throw new Error(`Unknown method: ${method}`);
    }

    /**
     * Generate code challenge using S256 method (SHA-256 + base64url)
     */
    async generateCodeChallengeS256(codeVerifier) {
        try {
            // Use Web Crypto API
            const encoder = new TextEncoder();
            const data = encoder.encode(codeVerifier);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            
            return this.base64urlEncode(hashBuffer);
        } catch (error) {
            // Fallback to Node.js crypto for server-side or older browsers
            console.warn('Web Crypto API not available, using Node.js crypto fallback');
            return this.generateCodeChallengeS256NodeJS(codeVerifier);
        }
    }

    /**
     * S256 challenge generation using Node.js crypto
     */
    generateCodeChallengeS256NodeJS(codeVerifier) {
        if (typeof require !== 'undefined') {
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(codeVerifier).digest(); // Get Buffer directly
            return this.base64urlEncode(hash);
        } else {
            throw new Error('No crypto implementation available');
        }
    }

    /**
     * Generate code challenge using plain method (insecure, for demonstration)
     */
    generateCodeChallengePlain(codeVerifier) {
        if (!codeVerifier) {
            throw new Error('Code verifier is required');
        }

        // Plain method simply returns the code verifier (not recommended for production)
        return codeVerifier;
    }

    /**
     * Verify that a code challenge matches a code verifier
     * @param {string} codeVerifier - Original code verifier
     * @param {string} codeChallenge - Code challenge to verify
     * @param {string} method - Challenge method used
     * @returns {boolean} True if verification succeeds
     */
    async verifyCodeChallenge(codeVerifier, codeChallenge, method = 'S256') {
        if (!codeVerifier || !codeChallenge) {
            return false;
        }

        try {
            const expectedChallenge = await this.generateCodeChallenge(codeVerifier, method);
            return expectedChallenge === codeChallenge;
        } catch (error) {
            console.error('PKCE verification error:', error);
            return false;
        }
    }

    /**
     * Base64 URL encoding (RFC 7636 compliant)
     * @param {ArrayBuffer|string} input - Input to encode
     * @returns {string} Base64url-encoded string
     */
    base64urlEncode(input) {
        const buffer = this.ensureArrayBuffer(input);
        const base64 = this.arrayBufferToBase64(buffer);
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Base64 URL decoding
     * @param {string} input - Base64url-encoded string
     * @returns {ArrayBuffer} Decoded array buffer
     */
    base64urlDecode(input) {
        const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4;
        const paddedBase64 = base64 + '='.repeat((4 - padding) % 4);
        
        const binaryString = atob(paddedBase64);
        const buffer = new ArrayBuffer(binaryString.length);
        const view = new Uint8Array(buffer);
        
        for (let i = 0; i < binaryString.length; i++) {
            view[i] = binaryString.charCodeAt(i);
        }
        
        return buffer;
    }

    /**
     * Convert ArrayBuffer to base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Ensure input is an ArrayBuffer
     */
    ensureArrayBuffer(input) {
        if (input instanceof ArrayBuffer) {
            return input;
        }
        if (typeof input === 'string') {
            const encoder = new TextEncoder();
            return encoder.encode(input);
        }
        if (input instanceof Uint8Array) {
            return input.buffer;
        }
        throw new Error('Unsupported input type for base64url encoding');
    }

    /**
     * Validate code verifier format
     * @param {string} codeVerifier - Code verifier to validate
     * @returns {Object} Validation result
     */
    validateCodeVerifier(codeVerifier) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!codeVerifier) {
            result.valid = false;
            result.errors.push('Code verifier is required');
            return result;
        }

        // Check length
        if (codeVerifier.length < 43) {
            result.valid = false;
            result.errors.push(`Code verifier too short: ${codeVerifier.length} < 43 characters`);
        } else if (codeVerifier.length > 128) {
            result.valid = false;
            result.errors.push(`Code verifier too long: ${codeVerifier.length} > 128 characters`);
        } else if (codeVerifier.length < 64) {
            result.warnings.push('Code verifier is shorter than recommended (64+ characters)');
        }

        // Check character set
        const validChars = /^[A-Za-z0-9\-._~]+$/;
        if (!validChars.test(codeVerifier)) {
            result.valid = false;
            result.errors.push('Code verifier contains invalid characters');
            result.errors.push('Only alphanumeric, hyphen, period, underscore, and tilde are allowed');
        }

        return result;
    }

    /**
     * Generate a complete PKCE pair for demonstration
     * @param {Object} options - Generation options
     * @returns {Object} PKCE pair with verifier, challenge, and metadata
     */
    async generatePKCEPair(options = {}) {
        const {
            length = this.defaultLength,
            method = 'S256'
        } = options;

        // Generate code verifier
        const codeVerifier = this.generateCodeVerifier(length);
        
        // Validate verifier
        const validation = this.validateCodeVerifier(codeVerifier);
        if (!validation.valid) {
            throw new Error(`Invalid code verifier: ${validation.errors.join(', ')}`);
        }

        // Generate code challenge
        const codeChallenge = await this.generateCodeChallenge(codeVerifier, method);

        return {
            codeVerifier,
            codeChallenge,
            method,
            length: codeVerifier.length,
            validation,
            generatedAt: new Date().toISOString(),
            security: {
                randomSource: 'crypto.getRandomValues',
                hashAlgorithm: method === 'S256' ? 'SHA-256' : 'None',
                entropy: this.calculateEntropy(codeVerifier)
            }
        };
    }

    /**
     * Calculate approximate entropy of a string
     */
    calculateEntropy(str) {
        const charsetSize = this.charset.length;
        return str.length * Math.log2(charsetSize);
    }

    /**
     * Get security recommendations for PKCE
     */
    getSecurityRecommendations() {
        return {
            recommendedLength: 128,
            minimumLength: 64,
            preferredMethod: 'S256',
            avoidMethods: ['plain'],
            characterSet: 'A-Z, a-z, 0-9, -, ., _, ~',
            storage: 'Session storage (one-time use)',
            generation: 'Cryptographically secure random (Web Crypto API)',
            validation: 'Server-side challenge verification required',
            expiry: 'Typically 10-15 minutes for authorization flow'
        };
    }

    /**
     * Educational demonstration comparing different PKCE methods
     */
    async demonstratePKCE() {
        const demo = {
            timestamp: new Date().toISOString(),
            methods: {},
            comparison: {},
            recommendations: this.getSecurityRecommendations()
        };

        // Generate samples for each method
        for (const method of this.supportedMethods) {
            try {
                const pair = await this.generatePKCEPair({ method });
                demo.methods[method] = {
                    codeVerifier: pair.codeVerifier,
                    codeChallenge: pair.codeChallenge,
                    security: pair.security
                };

                // Verify the challenge
                const isValid = await this.verifyCodeChallenge(pair.codeVerifier, pair.codeChallenge, method);
                demo.methods[method].verification = isValid;
            } catch (error) {
                demo.methods[method] = {
                    error: error.message
                };
            }
        }

        // Add security comparison
        demo.comparison = {
            s256: {
                securityLevel: 'HIGH',
                recommended: true,
                useCase: 'All modern applications',
                benefits: [
                    'Cryptographic binding between requests',
                    'Resistant to interception attacks',
                    'Standards compliant (RFC 7636)',
                    'Browser and mobile app support'
                ],
                implementation: 'SHA256(code_verifier) -> base64url'
            },
            plain: {
                securityLevel: 'LOW',
                recommended: false,
                useCase: 'Backwards compatibility only',
                risks: [
                    'No cryptographic protection',
                    'Vulnerable to code interception',
                    'Not suitable for public clients',
                    'Deprecated in OAuth 2.1'
                ],
                implementation: 'code_challenge = code_verifier'
            }
        };

        return demo;
    }
}

// Create global PKCE helper instance
const pkceHelper = new PKCEHelper();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PKCEHelper;
}

// Global functions for demo
window.generatePKCEChallenge = async function() {
    try {
        const pair = await pkceHelper.generatePKCEPair();
        
        return {
            success: true,
            data: {
                codeVerifier: pair.codeVerifier,
                codeChallenge: pair.codeChallenge,
                method: pair.method,
                length: pair.length,
                entropy: pair.security.entropy.toFixed(2),
                validation: pair.validation
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

window.verifyPKCEChallenge = async function(codeVerifier, codeChallenge, method = 'S256') {
    try {
        const isValid = await pkceHelper.verifyCodeChallenge(codeVerifier, codeChallenge, method);
        return {
            success: true,
            data: {
                valid: isValid,
                method: method,
                verifierLength: codeVerifier.length,
                challengeLength: codeChallenge.length
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

window.validatePKCEVerifier = function(codeVerifier) {
    const validation = pkceHelper.validateCodeVerifier(codeVerifier);
    return {
        success: true,
        data: validation
    };
};

window.getPKCERecommendations = function() {
    return {
        success: true,
        data: pkceHelper.getSecurityRecommendations()
    };
};

window.demonstratePKCE = async function() {
    try {
        const demo = await pkceHelper.demonstratePKCE();
        return {
            success: true,
            data: demo
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};