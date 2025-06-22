// src/services/api.js - Complete API service with enhanced authentication handling
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Track if we're currently refreshing token to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh and user deletion
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            const errorMessage = error.response?.data?.detail || '';

            // Check if the error is specifically about user not existing
            if (errorMessage === 'User account no longer exists') {
                console.log('User account deleted - clearing tokens and redirecting');

                // Clear all authentication data
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                // Trigger auth context update if available
                if (window.authContext) {
                    window.authContext.setIsAuthenticated(false);
                    window.authContext.setUser(null);
                }

                // Show user-friendly message
                if (window.toast) {
                    window.toast.error('Your account is no longer available. Please sign in again.');
                }

                // Redirect to home page
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }

                return Promise.reject(error);
            }

            // Handle token refresh for other 401 errors
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                        refresh_token: refreshToken
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('access_token', access_token);

                    processQueue(null, access_token);

                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(originalRequest);

                } catch (refreshError) {
                    processQueue(refreshError, null);

                    // Clear tokens and redirect
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    if (window.authContext) {
                        window.authContext.setIsAuthenticated(false);
                        window.authContext.setUser(null);
                    }

                    if (window.toast) {
                        window.toast.error('Your session has expired. Please sign in again.');
                    }

                    if (window.location.pathname !== '/') {
                        window.location.href = '/';
                    }

                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                // No refresh token available
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                if (window.authContext) {
                    window.authContext.setIsAuthenticated(false);
                    window.authContext.setUser(null);
                }

                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        }

        return Promise.reject(error);
    }
);

export const apiService = {
    baseURL: API_BASE_URL,

    // ===== AUTHENTICATION METHODS =====

    /**
     * Get Google OAuth URL
     */
    async getGoogleAuthUrl() {
        // ✅ CORRECT endpoint that matches your backend
        const response = await apiClient.get('/api/auth/google');
        return response.data;
    },

    /**
     * Create account with email and password (signup)
     */
    async createAccountWithEmail(userData) {
        const response = await apiClient.post('/api/auth/signup-with-email', userData);
        return response.data;
    },

    /**
     * Login with email and password (if implemented)
     */
    async loginWithEmail(email, password) {
        const response = await apiClient.post('/api/auth/login', { email, password });
        return response.data;
    },

    /**
     * Get current user profile
     */
    async getCurrentUser() {
        const response = await apiClient.get('/api/auth/me');
        return response.data;
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        const response = await apiClient.post('/api/auth/refresh', {
            refresh_token: refreshToken
        });
        return response.data;
    },

    /**
     * Connect CPA license to user account
     */
    async connectLicense(licenseNumber) {
        const response = await apiClient.post('/api/auth/connect-license', {
            license_number: licenseNumber
        });
        return response.data;
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await apiClient.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with client-side cleanup even if server logout fails
        } finally {
            // Clear tokens from localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Clear auth context if available
            if (window.authContext) {
                window.authContext.setIsAuthenticated(false);
                window.authContext.setUser(null);
            }
        }
    },
    /**
         * 🔥 NEW: Login with email and password
         */
    async loginWithEmail(email, password) {
        const response = await apiClient.post('/api/auth/login', {
            email,
            password
        });
        return response.data;
    },

    /**
     * 🔥 NEW: Set password for passcode users
     */
    async setPassword(password) {
        const response = await apiClient.post('/api/auth/set-password', {
            password
        });
        return response.data;
    },

    /**
     * 🔥 NEW: Enhanced logout (if not already implemented)
     */
    async logout() {
        const response = await apiClient.post('/api/auth/logout');
        return response.data;
    },



    /**
     * Check authentication status and handle stale tokens
     */
    async checkAuthStatus() {
        try {
            const user = await this.getCurrentUser();
            return {
                isAuthenticated: true,
                user
            };
        } catch (error) {
            // If we get a 401, tokens are likely stale
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }

            return {
                isAuthenticated: false,
                user: null
            };
        }
    },

    /**
     * Clear all authentication data (useful for manual cleanup)
     */
    clearAuthData() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        if (window.authContext) {
            window.authContext.setIsAuthenticated(false);
            window.authContext.setUser(null);
        }
    },

    // ===== CPA METHODS (PUBLIC) =====

    /**
     * Search CPAs by name or license number
     */
    async searchCPAs(query, limit = 10) {
        const response = await apiClient.get(`/api/cpas/search`, {
            params: { q: query, limit }
        });
        return response.data;
    },

    /**
     * Get CPA by license number
     */
    async getCPAByLicense(licenseNumber) {
        const response = await apiClient.get(`/api/cpas/${licenseNumber}`);
        return response.data;
    },

    /**
     * Get CPA statistics summary
     */
    async getCPAStats() {
        const response = await apiClient.get('/api/cpas/stats/summary');
        return response.data;
    },

    // ===== UPLOAD METHODS =====

    /**
     * Get compliance dashboard data (PUBLIC)
     */
    async getComplianceDashboard(licenseNumber) {
        const response = await apiClient.get(`/api/upload/compliance-dashboard/${licenseNumber}`);
        return response.data;
    },

    /**
     * Get free tier status (PUBLIC)
     */
    async getFreeTierStatus(licenseNumber) {
        const response = await apiClient.get(`/api/upload/free-tier-status/${licenseNumber}`);
        return response.data;
    },

    /**
 * Accept extended trial offer (REQUIRES AUTHENTICATION)
 */
    async acceptExtendedTrial(licenseNumber) {
        const response = await apiClient.post(`/api/upload/accept-extended-trial/${licenseNumber}`);
        return response.data;
    },

    /**
     * Analyze certificate for preview (PUBLIC - Free analysis)
     */
    async analyzeCertificatePreview(licenseNumber, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/upload/analyze-certificate/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        );
        return response.data;
    },

    /**
     * Upload certificate (Free tier - REQUIRES AUTHENTICATION)
     */
    async uploadCertificateFreeTier(licenseNumber, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/upload/upload-certificate-free/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Upload and save certificate with authentication
     */
    async uploadCertificateAuthenticated(licenseNumber, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/upload/upload-certificate-authenticated/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Upload CPE certificate (Premium - REQUIRES AUTHENTICATION)
     */
    async uploadCPECertificatePremium(licenseNumber, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/upload/upload-cpe-certificate/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Save reviewed certificate data (REQUIRES AUTHENTICATION)
     */
    async saveReviewedCertificate(licenseNumber, reviewData) {
        const response = await apiClient.post(
            `/api/upload/save-reviewed-certificate/${licenseNumber}`,
            reviewData
        );
        return response.data;
    },

    /**
     * Delete certificate (REQUIRES AUTHENTICATION)
     */
    async deleteCertificate(recordId, licenseNumber) {
        const response = await apiClient.delete(`/api/upload/certificate/${recordId}`, {
            params: { license_number: licenseNumber }
        });
        return response.data;
    },

    /**
     * Get document URL (REQUIRES AUTHENTICATION)
     */
    async getDocumentUrl(certificateId, licenseNumber) {
        const response = await apiClient.get(`/api/upload/document/${certificateId}`, {
            params: { license_number: licenseNumber }
        });
        return response.data;
    },

    /**
     * View document in new tab (REQUIRES AUTHENTICATION)
     */
    async viewDocument(certificateId, licenseNumber) {
        const url = `${this.baseURL}/api/upload/view-document/${certificateId}?license_number=${licenseNumber}`;
        window.open(url, '_blank');
    },

    /**
     * Upload monthly CPA list (Admin function)
     */
    async uploadCPAList(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            '/api/upload/upload-cpa-list',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // ===== TIME WINDOWS / COMPLIANCE METHODS =====

    /**
     * Get available compliance periods for a CPA
     */
    async getAvailablePeriods(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/available`);
        return response.data;
    },

    /**
     * Analyze a specific time window
     */
    async analyzeTimeWindow(licenseNumber, windowData) {
        const response = await apiClient.post(`/api/time-windows/${licenseNumber}/analyze`, windowData);
        return response.data;
    },

    /**
     * Get current period analysis
     */
    async getCurrentPeriodAnalysis(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/current-period`);
        return response.data;
    },

    // ===== PAYMENT & SUBSCRIPTION METHODS =====

    /**
     * Create account and initiate payment process
     */
    async createAccountForPayment(accountData) {
        const response = await apiClient.post(
            `/api/payments/create-account-for-payment`,
            accountData
        );
        return response.data;
    },

    /**
     * Get subscription status (REQUIRES AUTHENTICATION)
     */
    async getSubscriptionStatus(licenseNumber) {
        const response = await apiClient.get(`/api/payments/subscription-status/${licenseNumber}`);
        return response.data;
    },

    /**
     * Get pricing plans (PUBLIC)
     */
    async getPricingPlans() {
        const response = await apiClient.get('/api/payments/pricing');
        return response.data;
    },

    // ===== UTILITY METHODS =====

    /**
     * Get simple routes list
     */
    async getRoutes() {
        const response = await apiClient.get('/routes-simple');
        return response.data;
    },

    /**
     * Health check
     */
    async healthCheck() {
        const response = await apiClient.get('/health');
        return response.data;
    },

    // ===== LEGACY COMPATIBILITY METHODS =====

    /**
     * Alias for getCPAByLicense (backward compatibility)
     */
    async getCPA(licenseNumber) {
        return this.getCPAByLicense(licenseNumber);
    },

    /**
     * Alias for getAvailablePeriods (backward compatibility)
     */
    async getAvailableWindows(licenseNumber) {
        return this.getAvailablePeriods(licenseNumber);
    },
    /**
 * Check passcode for CPA access
 */
    async checkPasscode(passcode) {
        const response = await apiClient.get(`/api/cpas/check-code?passcode=${passcode}`);
        return response.data;
    },
};

export default apiService;