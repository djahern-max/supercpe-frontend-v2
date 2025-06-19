// src/services/api.js - Clean and Organized API Service
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://nh.supercpe.com'
    : 'http://localhost:8000';

// Create axios instance with interceptors
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                        refresh_token: refreshToken
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('access_token', access_token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, redirect to login
                localStorage.removeItem('access_token');
                window.location.href = '/';
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
        const response = await apiClient.get('/api/auth/google/login');
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
        }
    },

    /**
     * Check authentication status
     */
    async checkAuthStatus() {
        try {
            const user = await this.getCurrentUser();
            return {
                isAuthenticated: true,
                user
            };
        } catch (error) {
            return {
                isAuthenticated: false,
                user: null
            };
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
                },
            }
        );
        return response.data;
    },

    /**
     * Upload and save certificate (REQUIRES AUTHENTICATION)
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
    }
};

export default apiService;