// src/services/api.js - CLEANED AND ORGANIZED VERSION
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
    // ===== HEALTH & CONNECTION =====
    async healthCheck() {
        const response = await apiClient.get('/health');
        return response.data;
    },

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

    // ===== CPA MANAGEMENT =====
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

    // ===== COMPLIANCE MANAGEMENT =====
    async getCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}`);
        return response.data;
    },

    async getEnhancedCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/dashboard`);
        return response.data;
    },

    async getQuickComplianceStatus(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/quick-status`);
        return response.data;
    },

    async getComplianceRulesExplanation(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}/rules/explanation`);
        return response.data;
    },

    /**
     * Get compliance dashboard data (main dashboard endpoint)
     * This is the primary endpoint your ProfessionalCPEDashboard uses
     */
    async getComplianceDashboard(licenseNumber) {
        const response = await apiClient.get(`/api/upload/compliance-dashboard/${licenseNumber}`);
        return response.data;
    },

    async generateAuditPresentation(licenseNumber, options = {}) {
        const response = await apiClient.post(`/api/compliance/generate-audit-presentation/${licenseNumber}`, {
            include_free_tier: true,
            include_premium: true,
            format: options.format || 'pdf',
            style: options.style || 'professional'
        });
        return response.data;
    },

    // ===== TIME WINDOWS & PERIODS =====
    async getTimeWindows(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}`);
        return response.data;
    },

    async getReportingPeriods(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/available`);
        return response.data;
    },

    async getAvailablePeriods(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/available`);
        return response.data.available_windows || response.data;
    },

    async analyzeTimeWindow(licenseNumber, timeWindow) {
        const response = await apiClient.post(`/api/time-windows/${licenseNumber}/analyze`, {
            start_date: timeWindow.start_date,
            end_date: timeWindow.end_date
        });
        return response.data;
    },

    async getCurrentPeriod(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/current-period`);
        return response.data;
    },

    async getCurrentPeriodAnalysis(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}/current-period`);
        return response.data;
    },

    // ===== UPLOAD & CERTIFICATE MANAGEMENT =====

    /**
     * ADMIN: Upload monthly CPA list
     */
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

    /**
     * FREE TIER: Get upload status and remaining uploads
     */
    async getFreeTierStatus(licenseNumber) {
        const response = await apiClient.get(`/api/upload/free-tier-status/${licenseNumber}`);
        return response.data;
    },

    /**
     * FREE TIER: Upload certificate with FULL functionality (AI + Storage + Tracking)
     * LIMITED to 10 uploads, then subscription required
     */
    async uploadCertificateEnhancedFree(licenseNumber, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/upload/upload-certificate-free/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 90000, // 90 seconds for full processing (AI + upload + DB)
            }
        );
        return response.data;
    },

    /**
     * PREMIUM: Upload certificate for subscribers (unlimited)
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
                timeout: 60000,
            }
        );
        return response.data;
    },

    /**
     * ADMIN: Analyze certificate with AI (preview mode)
     */
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
                timeout: 60000, // 60 seconds for AI processing
            }
        );
        return response.data;
    },

    /**
     * ADMIN: Save reviewed certificate (after user edits AI results)
     */
    async saveReviewedCertificate(licenseNumber, certificateData) {
        const response = await apiClient.post(
            `/api/admin/save-reviewed-certificate/${licenseNumber}`,
            certificateData
        );
        return response.data;
    },

    /**
     * Delete a certificate record
     */
    async deleteCertificate(certificateId, licenseNumber) {
        try {
            const response = await apiClient.delete(
                `/api/upload/certificate/${certificateId}?license_number=${licenseNumber}`
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting certificate:', error);
            throw error;
        }
    },

    // ===== PAYMENTS & SUBSCRIPTIONS =====

    /**
     * Get subscription status for a CPA
     */
    async getSubscriptionStatus(licenseNumber) {
        const response = await apiClient.get(`/api/payments/subscription-status/${licenseNumber}`);
        return response.data;
    },

    /**
     * Create account and initiate payment process
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
     * Create payment intent for one-time payments
     */
    async createPaymentIntent(licenseNumber) {
        const response = await apiClient.post(`/api/payments/create-payment-intent/${licenseNumber}`);
        return response.data;
    },

    /**
     * Confirm payment completion
     */
    async confirmPayment(licenseNumber, paymentIntentId) {
        const response = await apiClient.post(`/api/payments/confirm-payment/${licenseNumber}`, {
            payment_intent_id: paymentIntentId
        });
        return response.data;
    },
};

export default apiService;