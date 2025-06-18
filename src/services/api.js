// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);

        if (error.response?.status === 404) {
            throw new Error('Resource not found (404)');
        } else if (error.response?.status === 500) {
            throw new Error('Server error. Please try again later.');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. Please check your connection.');
        }

        throw error;
    }
);

export const apiService = {
    // Health Check
    async healthCheck() {
        const response = await apiClient.get('/health');
        return response.data;
    },

    // Test Connection
    async testConnection() {
        try {
            const response = await apiClient.get('/health');
            return {
                success: true,
                status: response.data.status,
                version: '2.0.0'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    // CPA Management
    async getAllCPAs(skip = 0, limit = 100) {
        const response = await apiClient.get(`/api/cpas/?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    async getCPA(licenseNumber) {
        const response = await apiClient.get(`/api/cpas/${licenseNumber}`);
        return response.data;
    },

    async getCPAStats() {
        const response = await apiClient.get('/api/cpas/stats/summary');
        return response.data;
    },

    async searchCPAs(query, limit = 10) {
        const response = await apiClient.get(`/api/cpas/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        return response.data;
    },

    // Basic Compliance Management (existing)
    async getCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}`);
        return response.data;
    },

    // ===== NEW ENHANCED COMPLIANCE METHODS =====

    /**
     * Get the comprehensive enhanced compliance dashboard
     * This is the main endpoint for the personalized dashboard
     */
    async getEnhancedCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/dashboard`);
        return response.data;
    },

    /**
     * Get quick compliance status (for overview cards)
     */
    async getQuickComplianceStatus(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/quick-status`);
        return response.data;
    },

    /**
     * Get detailed NH compliance rules explanation
     */
    async getComplianceRulesExplanation(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/rules/explanation`);
        return response.data;
    },

    // Time Windows (existing)
    async getTimeWindows(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}`);
        return response.data;
    },

    async getReportingPeriods(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/available`);
        return response.data;
    },

    async analyzeTimeWindow(licenseNumber, timeWindow) {
        const response = await apiClient.post(`/api/time-windows/${licenseNumber}/analyze`, {
            time_window: timeWindow
        });
        return response.data;
    },

    // Admin and Upload functionality
    async uploadCPAList(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/api/admin/upload-cpa-list', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Certificate Analysis (AI functionality)
    async analyzeCertificate(licenseNumber, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/admin/analyze-certificate/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    async saveReviewedCertificate(licenseNumber, certificateData) {
        const response = await apiClient.post(
            `/api/admin/save-reviewed-certificate/${licenseNumber}`,
            certificateData
        );
        return response.data;
    },

    // Payment and Subscription
    async getSubscriptionStatus(licenseNumber) {
        const response = await apiClient.get(`/api/payments/subscription-status/${licenseNumber}`);
        return response.data;
    },

    async createPaymentIntent(licenseNumber) {
        const response = await apiClient.post(`/api/payments/create-payment-intent/${licenseNumber}`);
        return response.data;
    },

    async confirmPayment(licenseNumber, paymentIntentId) {
        const response = await apiClient.post(`/api/payments/confirm-payment/${licenseNumber}`, {
            payment_intent_id: paymentIntentId
        });
        return response.data;
    },


    // Add these methods to your existing src/services/api.js file

    // ===== NEW COMPLIANCE METHODS =====

    /**
     * Analyze a certificate with AI (FREE tier)
     */
    async analyzeCertificate(licenseNumber, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/upload/analyze-certificate/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000, // 60 seconds for AI processing
            }
        );
        return response.data;
    },

    /**
     * Get quick compliance status
     */
    async getQuickCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/quick-status`);
        return response.data;
    },

    /**
     * Get enhanced compliance dashboard
     */
    async getEnhancedCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/dashboard`);
        return response.data;
    },



    /**
     * Get current compliance period
     */
    async getCurrentPeriod(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/current-period`);
        return response.data;
    },

    /**
     * Check subscription status
     */
    async getSubscriptionStatus(licenseNumber) {
        const response = await apiClient.get(`/api/payments/subscription-status/${licenseNumber}`);
        return response.data;
    },

    /**
/**
 * Get available compliance periods for a CPA
 */
    async getAvailablePeriods(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/available`);
        return response.data.available_windows || response.data;
    },

    /**
     * Analyze a specific time window/period
     */
    async analyzeTimeWindow(licenseNumber, timeWindow) {
        const response = await apiClient.post(`/api/time-windows/${licenseNumber}/analyze`, {
            start_date: timeWindow.start_date,
            end_date: timeWindow.end_date
        });
        return response.data;
    },

    /**
     * Get current period analysis
     */
    async getCurrentPeriodAnalysis(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/current-period`);
        return response.data;
    },
};