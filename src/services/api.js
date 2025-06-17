// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nh.supercpe.com';

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

        throw new Error(error.response?.data?.detail || error.message || 'An error occurred');
    }
);

export const apiService = {
    // CPA endpoints
    async getCPA(licenseNumber) {
        const response = await apiClient.get(`/api/cpas/${licenseNumber}`);
        return response.data;
    },

    async getCPAStats() {
        const response = await apiClient.get('/api/cpas/stats/summary');
        return response.data;
    },

    // Compliance endpoints
    async getCompliance(licenseNumber) {
        const response = await apiClient.get(`/api/compliance/${licenseNumber}`);
        return response.data;
    },

    // Certificate analysis (FREE tier)
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
                timeout: 60000, // 60 seconds for AI analysis
            }
        );
        return response.data;
    },

    // Save certificate (PREMIUM tier)
    async saveReviewedCertificate(licenseNumber, file, reviewData) {
        const formData = new FormData();
        formData.append('file', file);

        // Add all review data to form
        Object.keys(reviewData).forEach(key => {
            formData.append(key, reviewData[key]);
        });

        const response = await apiClient.post(
            `/api/admin/save-reviewed-certificate/${licenseNumber}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // CPE records (PREMIUM tier)
    async getCPERecords(licenseNumber) {
        const response = await apiClient.get(`/api/admin/cpe-records/${licenseNumber}`);
        return response.data;
    },

    // Payments & subscriptions
    async getSubscriptionStatus(licenseNumber) {
        const response = await apiClient.get(`/api/payments/subscription-status/${licenseNumber}`);
        return response.data;
    },

    async getPricingPlans() {
        const response = await apiClient.get('/api/payments/pricing');
        return response.data;
    },

    async createPaymentIntent(paymentData) {
        const response = await apiClient.post('/api/payments/create-payment-intent', paymentData);
        return response.data;
    },

    // Health check
    async healthCheck() {
        const response = await apiClient.get('/health');
        return response.data;
    },
};

export default apiService;
