// JWT Utilities for parsing, validation, and debugging

/**
 * JWT Utility functions for enhanced token management
 */
class JWTUtils {
    /**
     * Parse JWT token and return decoded payload
     * @param {string} token - JWT token
     * @returns {object|null} - Decoded payload or null if invalid
     */
    static parseJWT(token) {
        if (!token || typeof token !== 'string') {
            return null;
        }

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.warn('Invalid JWT format: must have 3 parts');
                return null;
            }

            const payload = parts[1];
            const decodedPayload = this.base64UrlDecode(payload);
            
            if (!decodedPayload) {
                console.warn('Failed to decode JWT payload');
                return null;
            }

            const parsed = JSON.parse(decodedPayload);
            
            // Add parsed timestamp fields
            if (parsed.iat) {
                parsed.iatDate = new Date(parsed.iat * 1000);
            }
            if (parsed.exp) {
                parsed.expDate = new Date(parsed.exp * 1000);
            }
            if (parsed.nbf) {
                parsed.nbfDate = new Date(parsed.nbf * 1000);
            }

            return parsed;
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }

    /**
     * Base64 URL decode
     * @param {string} str - Base64 URL encoded string
     * @returns {string|null} - Decoded string or null if error
     */
    static base64UrlDecode(str) {
        try {
            // Add padding if needed
            let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }
            
            return atob(base64);
        } catch (error) {
            console.error('Base64 URL decode error:', error);
            return null;
        }
    }

    /**
     * Base64 URL encode
     * @param {string} str - String to encode
     * @returns {string} - Base64 URL encoded string
     */
    static base64UrlEncode(str) {
        try {
            const base64 = btoa(str);
            return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        } catch (error) {
            console.error('Base64 URL encode error:', error);
            return null;
        }
    }

    /**
     * Validate JWT token structure and claims
     * @param {string} token - JWT token
     * @returns {object} - Validation result
     */
    static validateJWT(token) {
        const result = {
            valid: false,
            errors: [],
            warnings: [],
            claims: null
        };

        if (!token) {
            result.errors.push('Token is missing');
            return result;
        }

        if (typeof token !== 'string') {
            result.errors.push('Token must be a string');
            return result;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            result.errors.push('Token must have 3 parts (header.payload.signature)');
            return result;
        }

        const payload = this.parseJWT(token);
        if (!payload) {
            result.errors.push('Failed to parse token payload');
            return result;
        }

        result.claims = payload;

        // Check required claims
        const requiredClaims = ['iss', 'sub', 'aud', 'iat', 'exp'];
        const missingClaims = requiredClaims.filter(claim => !payload[claim]);
        
        if (missingClaims.length > 0) {
            result.errors.push(`Missing required claims: ${missingClaims.join(', ')}`);
        }

        // Check expiration
        if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp <= now) {
                result.errors.push('Token has expired');
            } else if (payload.exp <= now + 300) { // 5 minutes
                result.warnings.push('Token expires soon (less than 5 minutes)');
            }
        } else {
            result.errors.push('Token has no expiration claim');
        }

        // Check not before
        if (payload.nbf) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.nbf > now) {
                result.errors.push('Token is not yet valid (nbf claim in future)');
            }
        }

        // Validate role and scopes
        if (payload.role && !['admin', 'customer'].includes(payload.role)) {
            result.warnings.push(`Unknown role: ${payload.role}`);
        }

        if (payload.scopes && !Array.isArray(payload.scopes)) {
            result.warnings.push('Scopes claim should be an array');
        }

        // Check session ID
        if (!payload.sessionId) {
            result.warnings.push('Token missing sessionId claim');
        }

        // Check JWT ID
        if (!payload.jti) {
            result.warnings.push('Token missing jti (JWT ID) claim');
        }

        result.valid = result.errors.length === 0;

        return result;
    }

    /**
     * Get token status with detailed information
     * @param {string} token - JWT token
     * @returns {object} - Token status
     */
    static getTokenStatus(token) {
        const validation = this.validateJWT(token);
        const payload = validation.claims;
        
        if (!payload) {
            return {
                status: 'invalid',
                message: 'Token is invalid or malformed',
                validation: validation
            };
        }

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;
        const timeSinceIssued = now - payload.iat;

        let status = 'valid';
        let message = 'Token is valid';

        if (timeUntilExpiry <= 0) {
            status = 'expired';
            message = 'Token has expired';
        } else if (timeUntilExpiry <= 300) { // 5 minutes
            status = 'expiring_soon';
            message = 'Token expires soon';
        }

        return {
            status: status,
            message: message,
            payload: payload,
            validation: validation,
            timing: {
                now: new Date(now * 1000).toISOString(),
                issuedAt: new Date(payload.iat * 1000).toISOString(),
                expiresAt: new Date(payload.exp * 1000).toISOString(),
                timeUntilExpiry: timeUntilExpiry,
                timeSinceIssued: timeSinceIssued,
                expiresIn: this.formatDuration(timeUntilExpiry),
                age: this.formatDuration(timeSinceIssued)
            }
        };
    }

    /**
     * Format duration in human readable format
     * @param {number} seconds - Duration in seconds
     * @returns {string} - Formatted duration
     */
    static formatDuration(seconds) {
        if (seconds < 0) {
            return 'expired';
        }

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const parts = [];
        
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0 && parts.length === 0) parts.push(`${remainingSeconds}s`);

        return parts.join(' ') || '0s';
    }

    /**
     * Extract specific claims from token
     * @param {string} token - JWT token
     * @param {Array} claims - Array of claim names to extract
     * @returns {object} - Extracted claims
     */
    static extractClaims(token, claims) {
        const payload = this.parseJWT(token);
        if (!payload) {
            return null;
        }

        const extracted = {};
        claims.forEach(claim => {
            if (payload.hasOwnProperty(claim)) {
                extracted[claim] = payload[claim];
            }
        });

        return extracted;
    }

    /**
     * Check if token has required scopes
     * @param {string} token - JWT token
     * @param {Array} requiredScopes - Array of required scopes
     * @returns {object} - Scope check result
     */
    static checkScopes(token, requiredScopes) {
        const payload = this.parseJWT(token);
        
        if (!payload) {
            return {
                valid: false,
                reason: 'Invalid token'
            };
        }

        if (!payload.scopes || !Array.isArray(payload.scopes)) {
            return {
                valid: false,
                reason: 'No scopes defined in token'
            };
        }

        const userScopes = payload.scopes;
        const missingScopes = requiredScopes.filter(scope => !userScopes.includes(scope));
        
        return {
            valid: missingScopes.length === 0,
            userScopes: userScopes,
            requiredScopes: requiredScopes,
            missingScopes: missingScopes,
            reason: missingScopes.length > 0 ? `Missing scopes: ${missingScopes.join(', ')}` : null
        };
    }

    /**
     * Debug token information (development only)
     * @param {string} token - JWT token
     * @returns {object} - Debug information
     */
    static debugToken(token) {
        if (!token) {
            return {
                error: 'No token provided'
            };
        }

        const validation = this.validateJWT(token);
        const payload = validation.claims;
        
        return {
            token: {
                preview: token.substring(0, 20) + '...',
                length: token.length,
                parts: token.split('.').length
            },
            header: this.parseJWT(token)?.header || null,
            payload: payload,
            validation: validation,
            security: {
                algorithm: payload?.alg,
                issuer: payload?.iss,
                audience: payload?.aud,
                subject: payload?.sub,
                tokenType: payload?.tokenType,
                hasJTI: !!payload?.jti,
                hasSession: !!payload?.sessionId
            },
            timing: payload ? {
                issued: new Date(payload.iat * 1000).toISOString(),
                expires: new Date(payload.exp * 1000).toISOString(),
                now: new Date().toISOString(),
                expiresIn: this.formatDuration(payload.exp - Math.floor(Date.now() / 1000))
            } : null
        };
    }

    /**
     * Create a debug-friendly representation of token
     * @param {string} token - JWT token
     * @returns {string} - Formatted debug string
     */
    static formatTokenForDebug(token) {
        const debug = this.debugToken(token);
        
        return JSON.stringify(debug, null, 2);
    }

    /**
     * Validate token for specific purpose
     * @param {string} token - JWT token
     * @param {object} requirements - Validation requirements
     * @returns {object} - Validation result
     */
    static validateForPurpose(token, requirements = {}) {
        const validation = this.validateJWT(token);
        const payload = validation.claims;
        
        const result = {
            valid: validation.valid,
            errors: [...validation.errors],
            warnings: [...validation.warnings]
        };

        // Check role requirements
        if (requirements.role && payload?.role !== requirements.role) {
            result.valid = false;
            result.errors.push(`Required role: ${requirements.role}, actual: ${payload?.role}`);
        }

        // Check scope requirements
        if (requirements.scopes && payload?.scopes) {
            const scopeCheck = this.checkScopes(token, requirements.scopes);
            if (!scopeCheck.valid) {
                result.valid = false;
                result.errors.push(scopeCheck.reason);
            }
        }

        // Check client ID
        if (requirements.clientId && payload?.clientId !== requirements.clientId) {
            result.valid = false;
            result.errors.push(`Required client: ${requirements.clientId}, actual: ${payload?.clientId}`);
        }

        // Check minimum remaining time
        if (requirements.minRemainingTime) {
            const remaining = payload ? (payload.exp - Math.floor(Date.now() / 1000)) : 0;
            if (remaining < requirements.minRemainingTime) {
                result.valid = false;
                result.errors.push(`Token expires too soon (${this.formatDuration(remaining)} remaining)`);
            }
        }

        return result;
    }
}

// Export for use in other modules
window.JWTUtils = JWTUtils;