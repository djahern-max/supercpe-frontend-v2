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
 * Get authenticated user upload status (REQUIRES AUTHENTICATION)
 */
    async getUserUploadStatus(licenseNumber) {
        const response = await apiClient.get(`/api/upload/user-upload-status/${licenseNumber}`);
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
 * Create subscription for already authenticated user (REQUIRES AUTHENTICATION)
 */
    async createSubscriptionForAuthenticatedUser(data) {
        const response = await apiClient.post('/api/payments/create-subscription-authenticated', data);
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
     * Get certificates with enhanced smart review data
     */
    async getCertificatesWithReviewData(licenseNumber, period = 'current') {
        try {
            console.log(`🔍 Fetching certificates with smart review data for ${licenseNumber}`);

            // For now, use your existing compliance dashboard endpoint and enhance the data
            const response = await this.getComplianceDashboard(licenseNumber);

            // Transform certificates to include smart review structure
            const certificates = (response.certificates || []).map(cert => ({
                ...cert,
                // Ensure boolean fields are properly typed
                needs_review: !cert.course_title || !cert.provider_name || cert.cpe_credits === 0 || !cert.completion_date,
                is_verified: Boolean(cert.is_verified),
                is_complete: Boolean(cert.course_title && cert.provider_name && cert.cpe_credits > 0 && cert.completion_date),

                // Map legacy field names
                provider: cert.provider_name || cert.provider,

                // Initialize smart review fields (will be populated when backend is ready)
                suggestions: [],
                review_flags: [],
                smart_insights: {},

                // Computed status
                review_status: this.computeReviewStatus(cert),

                // Processing method display
                processing_method: cert.ai_extracted ? 'smart_review' : 'manual',
                confidence_score: cert.confidence_score || 0
            }));

            console.log(`📊 Loaded ${certificates.length} enhanced certificates`);

            return {
                certificates,
                stats: this.computeCertificateStats(certificates)
            };

        } catch (error) {
            console.error('Error fetching enhanced certificates:', error);
            throw error;
        }
    },

    /**
     * Get detailed review data for a specific certificate
     */
    async getCertificateReviewData(certificateId) {
        try {
            console.log(`🔍 Fetching review data for certificate ${certificateId}`);

            // TODO: Replace with actual backend endpoint when ready
            // For now, return mock structure
            return {
                id: certificateId,
                filename: "certificate.pdf",
                processing_method: "smart_review",
                confidence_score: 0.85,
                needs_review: true,
                current_data: {
                    course_title: "Sample Course",
                    provider: "Sample Provider",
                    cpe_credits: 8,
                    ethics_credits: 0,
                    completion_date: new Date().toISOString().split('T')[0],
                    certificate_number: "CERT123"
                },
                smart_insights: {},
                suggestions: [],
                review_flags: [],
                raw_text: "Sample raw text from OCR...",
                raw_text_preview: "Sample raw text from OCR..."
            };

        } catch (error) {
            console.error('Error fetching certificate review data:', error);
            throw error;
        }
    },

    /**
     * Update certificate after review
     */
    async updateCertificateFromReview(certificateId, updateData) {
        try {
            console.log(`💾 Updating certificate ${certificateId} from review`);

            // TODO: Replace with actual backend endpoint when ready
            // For now, use the existing save reviewed certificate method
            const response = await this.saveReviewedCertificate(certificateId, updateData);

            console.log('✅ Certificate updated successfully');
            return response;

        } catch (error) {
            console.error('Error updating certificate:', error);
            throw error;
        }
    },

    /**
     * Handle specific review actions (accept suggestion, etc.)
     */
    async handleReviewAction(certificateId, action, field, value, suggestionIndex = null) {
        try {
            console.log(`🎯 Handling review action: ${action} for field ${field}`);

            // TODO: Replace with actual backend endpoint when ready
            // For now, treat as a regular update
            const updateData = { [field]: value };
            const response = await this.updateCertificateFromReview(certificateId, updateData);

            console.log('✅ Review action completed successfully');
            return response;

        } catch (error) {
            console.error('Error handling review action:', error);
            throw error;
        }
    },

    /**
     * Get all certificates needing review
     */
    async getCertificatesNeedingReview(licenseNumber) {
        try {
            console.log('🔍 Fetching certificates needing review');

            // Use existing method and filter for those needing review
            const allCerts = await this.getCertificatesWithReviewData(licenseNumber);
            const needingReview = allCerts.certificates.filter(cert => cert.needs_review);

            return needingReview.map(cert => ({
                id: cert.id,
                filename: cert.original_filename || cert.document_filename,
                confidence_score: cert.confidence_score,
                review_flags: cert.review_flags,
                suggestions_count: cert.suggestions.length,
                created_at: cert.created_at,
                preview: {
                    course_title: cert.course_title,
                    provider: cert.provider,
                    cpe_credits: cert.cpe_credits
                }
            }));

        } catch (error) {
            console.error('Error fetching certificates needing review:', error);
            throw error;
        }
    },

    /**
     * Get review statistics for dashboard
     */
    async getReviewStatistics(licenseNumber) {
        try {
            console.log(`📊 Fetching review statistics for ${licenseNumber}`);

            const data = await this.getCertificatesWithReviewData(licenseNumber);
            return data.stats;

        } catch (error) {
            console.error('Error fetching review statistics:', error);
            throw error;
        }
    },

    /**
     * Export certificates with enhanced data to CSV
     */
    async exportCertificatesCSV(licenseNumber, includeReviewData = false) {
        try {
            console.log(`📤 Exporting certificates CSV for ${licenseNumber}`);

            // Get the certificates data
            const data = await this.getCertificatesWithReviewData(licenseNumber);

            // Create CSV content
            const headers = [
                'License_Number',
                'Course_Title',
                'Provider',
                'CPE_Credits',
                'Ethics_Credits',
                'Total_Credits',
                'Completion_Date',
                'Certificate_Number',
                'Verified',
                'Upload_Date'
            ];

            if (includeReviewData) {
                headers.push('Confidence_Score', 'Processing_Method', 'Review_Status');
            }

            const csvContent = [
                headers.join(','),
                ...data.certificates.map(cert => {
                    const row = [
                        licenseNumber,
                        `"${cert.course_title || ''}"`,
                        `"${cert.provider || ''}"`,
                        cert.cpe_credits || 0,
                        cert.ethics_credits || 0,
                        (cert.cpe_credits || 0) + (cert.ethics_credits || 0),
                        cert.completion_date || '',
                        `"${cert.certificate_number || ''}"`,
                        cert.is_verified ? 'Yes' : 'No',
                        cert.created_at ? new Date(cert.created_at).toLocaleDateString() : ''
                    ];

                    if (includeReviewData) {
                        row.push(
                            cert.confidence_score || 0,
                            cert.processing_method || 'manual',
                            cert.review_status || 'unknown'
                        );
                    }

                    return row.join(',');
                })
            ].join('\n');

            // Create blob
            const blob = new Blob([csvContent], { type: 'text/csv' });
            console.log('✅ CSV export completed');

            return blob;

        } catch (error) {
            console.error('Error exporting CSV:', error);
            throw error;
        }
    },

    /**
     * Mark certificate as reviewed without changes
     */
    async markCertificateAsReviewed(certificateId) {
        try {
            console.log(`✅ Marking certificate ${certificateId} as reviewed`);

            // TODO: Replace with actual backend endpoint when ready
            const response = await this.updateCertificateFromReview(certificateId, {
                is_verified: true,
                needs_review: false
            });

            return response;

        } catch (error) {
            console.error('Error marking certificate as reviewed:', error);
            throw error;
        }
    },

    // Helper methods for enhanced certificate manager
    computeReviewStatus(certificate) {
        if (certificate.is_verified) {
            return 'verified';
        } else if (certificate.needs_review) {
            if (certificate.review_started_at) {
                return 'in_review';
            } else {
                return 'needs_review';
            }
        } else if (certificate.is_complete) {
            return 'complete';
        } else {
            return 'incomplete';
        }
    },

    computeCertificateStats(certificates) {
        const stats = {
            total: certificates.length,
            complete: 0,
            needs_review: 0,
            verified: 0,
            in_review: 0,
            incomplete: 0,
            total_cpe_credits: 0,
            total_ethics_credits: 0,
            avg_confidence: 0,
            smart_extracted: 0
        };

        let totalConfidence = 0;
        let confidenceCount = 0;

        certificates.forEach(cert => {
            // Status counts
            if (cert.is_verified) stats.verified++;
            if (cert.needs_review) stats.needs_review++;
            if (cert.is_complete) stats.complete++;
            if (cert.review_status === 'in_review') stats.in_review++;
            if (cert.review_status === 'incomplete') stats.incomplete++;

            // Credit totals
            stats.total_cpe_credits += cert.cpe_credits || 0;
            stats.total_ethics_credits += cert.ethics_credits || 0;

            // Confidence tracking
            if (cert.confidence_score && cert.confidence_score > 0) {
                totalConfidence += cert.confidence_score;
                confidenceCount++;
            }

            // Smart extraction count
            if (cert.processing_method === 'smart_review' || cert.processing_method === 'google_vision') {
                stats.smart_extracted++;
            }
        });

        // Calculate average confidence
        if (confidenceCount > 0) {
            stats.avg_confidence = totalConfidence / confidenceCount;
        }

        return stats;
    },


};

export default apiService;