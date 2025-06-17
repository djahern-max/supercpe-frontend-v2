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

    // Compliance Management
    async getCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}`);
        return response.data;
    },

    async getTimeWindows(licenseNumber) {
        const response = await apiClient.get(`/api/time-windows/${licenseNumber}`);
        return response.data;
    },

    // File Uploads & AI Analysis
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

    async analyzeCertificate(licenseNumber, file, parseWithAI = true) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parse_with_ai', parseWithAI);

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

    // Premium Features - CPE Records
    async getCPERecords(licenseNumber) {
        const response = await apiClient.get(`/api/cpe-records/${licenseNumber}`);
        return response.data;
    },

    async deleteCPERecord(licenseNumber, recordId) {
        const response = await apiClient.delete(`/api/cpe-records/${licenseNumber}/${recordId}`);
        return response.data;
    },

    // Subscription & Payment Management
    async getSubscriptionStatus(licenseNumber) {
        const response = await apiClient.get(`/api/payments/subscription-status/${licenseNumber}`);
        return response.data;
    },

    async createSubscription(licenseNumber, paymentMethodId) {
        const response = await apiClient.post('/api/payments/create-subscription', {
            license_number: licenseNumber,
            payment_method_id: paymentMethodId
        });
        return response.data;
    },

    async cancelSubscription(licenseNumber) {
        const response = await apiClient.post(`/api/payments/cancel-subscription/${licenseNumber}`);
        return response.data;
    },

    async getPricingPlans() {
        const response = await apiClient.get('/api/payments/pricing');
        return response.data;
    },

    // Testing helpers
    async testConnection() {
        try {
            const response = await apiClient.get('/');
            return {
                success: true,
                message: response.data.message || 'API connected successfully',
                version: response.data.version
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
};

export default apiService;