// src/services/api.js - Enhanced with Authentication
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
     * Login with email and password (if you implement this)
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
     * Connect license to user account
     */
    async connectLicense(licenseNumber) {
        const response = await apiClient.post('/api/auth/connect-license', {
            license_number: licenseNumber
        });
        return response.data;
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

    // ===== EXISTING METHODS (Updated to require auth where needed) =====

    /**
     * Search CPAs by name or license number (Public - No auth required)
     */
    async searchCPAs(query, limit = 10) {
        const response = await apiClient.get(`/api/cpas/search`, {
            params: { q: query, limit }
        });
        return response.data;
    },

    /**
     * Get CPA by license number (Public - No auth required)
     */
    async getCPAByLicense(licenseNumber) {
        const response = await apiClient.get(`/api/cpas/${licenseNumber}`);
        return response.data;
    },

    /**
     * Get compliance dashboard (Public - No auth required)
     */
    async getComplianceDashboard(licenseNumber) {
        const response = await apiClient.get(`/api/upload/compliance-dashboard/${licenseNumber}`);
        return response.data;
    },

    /**
     * Get free tier status (Public - No auth required)
     */
    async getFreeTierStatus(licenseNumber) {
        const response = await apiClient.get(`/api/upload/free-tier-status/${licenseNumber}`);
        return response.data;
    },

    /**
     * Upload certificate (REQUIRES AUTHENTICATION)
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
     * Upload certificate premium (REQUIRES AUTHENTICATION)
     */
    async uploadCertificatePremium(licenseNumber, file) {
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
     * Analyze certificate preview (Public - No auth required)
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
     * Save reviewed certificate (REQUIRES AUTHENTICATION)
     */
    async saveReviewedCertificate(licenseNumber, reviewData) {
        const response = await apiClient.post(
            `/api/upload/save-reviewed-certificate/${licenseNumber}`,
            reviewData
        );
        return response.data;
    },

    // ===== PAYMENT & SUBSCRIPTION METHODS =====

    /**
     * Create account and initiate payment process (REQUIRES AUTHENTICATION)
     */
    async createAccountForPayment(accountData) {
        try {
            const response = await apiClient.post(
                `/api/payments/create-account-for-payment`,
                accountData
            );
            return response.data;
        } catch (error) {
            console.error('Error creating account for payment:', error);
            throw error;
        }
    },

    /**
     * Get subscription status (REQUIRES AUTHENTICATION)
     */
    async getSubscriptionStatus(licenseNumber) {
        const response = await apiClient.get(`/api/payments/subscription-status/${licenseNumber}`);
        return response.data;
    },

    /**
     * Get pricing plans (Public - No auth required)
     */
    async getPricingPlans() {
        const response = await apiClient.get('/api/payments/pricing');
        return response.data;
    },

    // ===== UTILITY METHODS =====

    /**
     * Get document URL (REQUIRES AUTHENTICATION)
     */
    async getDocumentUrl(certificateId, licenseNumber) {
        try {
            const response = await apiClient.get(`/api/upload/document/${certificateId}`, {
                params: { license_number: licenseNumber }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting document URL:', error);
            throw error;
        }
    },

    /**
     * View document (REQUIRES AUTHENTICATION)
     */
    async viewDocument(certificateId, licenseNumber) {
        try {
            const url = `${this.baseURL}/api/upload/view-document/${certificateId}?license_number=${licenseNumber}`;
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error viewing document:', error);
            throw error;
        }
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

    // ===== LEGACY METHODS (Keep for compatibility) =====

    /**
     * @deprecated Use analyzeCertificatePreview instead
     */
    async uploadCertificateEnhancedFree(licenseNumber, file) {
        console.warn('uploadCertificateEnhancedFree is deprecated. This will now redirect to authentication.');
        throw new Error('Authentication required. Please sign in to upload certificates.');
    }
};

export default apiService;