// src/components/compliance/ProfessionalCPEDashboard.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SubscriptionModal from './SubscriptionModal';
import CertificateManager from '../CertificateManager';
import { apiService } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';
import styles from '../../styles/components/ProfessionalCPEDashboard.module.css';

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    // Core state management - simplified
    const [cpa, setCpa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExtendedOffer, setShowExtendedOffer] = useState(false);
    const [showCertificateManager, setShowCertificateManager] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        if (licenseNumber) {
            checkAuthStatus();
            loadCPAData();
        }
    }, [licenseNumber]);

    // Show certificate manager when user has uploaded certificates
    useEffect(() => {
        if (uploadStatus && uploadStatus.total_uploads_used > 0) {
            setShowCertificateManager(true);
        }
    }, [uploadStatus]);

    // Load upload count after auth check is complete
    useEffect(() => {
        if (!checkingAuth && licenseNumber) {
            loadUploadCount();
        }
    }, [checkingAuth, licenseNumber]);

    const checkAuthStatus = async () => {
        try {
            setCheckingAuth(true);
            const token = localStorage.getItem('access_token');

            if (!token) {
                console.log('No access token found');
                setIsAuthenticated(false);
                return;
            }

            // Verify token is still valid
            const response = await apiService.getCurrentUser();
            console.log('User authenticated successfully');
            setIsAuthenticated(true);

        } catch (error) {
            console.log('Auth check failed:', error);
            setIsAuthenticated(false);

            // Clear stale tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } finally {
            setCheckingAuth(false);
        }
    };

    const loadCPAData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`Loading CPA data for license: ${licenseNumber}`);
            const cpaData = await apiService.getCPA(licenseNumber);
            console.log('CPA data loaded:', cpaData);
            if (!cpaData?.license_number) {
                throw new Error('Invalid CPA data received');
            }
            setCpa(cpaData);
        } catch (error) {
            console.error('Error loading CPA data:', error);
            setError(error.message || 'Failed to load CPA information');
        } finally {
            setLoading(false);
        }
    };

    const loadUploadCount = async () => {
        try {
            console.log('📊 Loading upload status...');

            // Check if user is authenticated first
            if (!isAuthenticated) {
                console.log('User not authenticated, using free tier status');
                try {
                    const status = await apiService.getFreeTierStatus(licenseNumber);
                    setUploadStatus(status);
                    setShowExtendedOffer(false);
                } catch (error) {
                    console.error('Error loading free tier status:', error);
                    // Set fallback status for unauthenticated users
                    setUploadStatus({
                        total_uploads_used: 0,
                        upload_phase: 'initial',
                        at_limit: false,
                        needs_extended_offer: false,
                        initial_uploads_used: 0,
                        remaining_uploads: 10,
                        has_premium_subscription: false
                    });
                }
                return;
            }

            // User is authenticated - try to get their full status
            try {
                const status = await apiService.getUserUploadStatus(licenseNumber);
                console.log('📈 Authenticated upload status loaded:', status);
                setUploadStatus(status);

                if (status.needs_extended_offer &&
                    !status.accepted_extended_trial &&
                    status.upload_phase !== 'extended') {
                    setShowExtendedOffer(true);
                } else {
                    setShowExtendedOffer(false);
                }
            } catch (authError) {
                if (authError.response?.status === 403 || authError.response?.status === 401) {
                    console.log('Authentication failed during upload status check');

                    // Update auth state and clear tokens
                    setIsAuthenticated(false);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    // Fall back to free tier status
                    try {
                        const fallbackStatus = await apiService.getFreeTierStatus(licenseNumber);
                        setUploadStatus(fallbackStatus);
                    } catch (fallbackError) {
                        console.error('Fallback also failed:', fallbackError);
                        setUploadStatus({
                            total_uploads_used: 0,
                            upload_phase: 'initial',
                            at_limit: false,
                            needs_extended_offer: false,
                            initial_uploads_used: 0,
                            remaining_uploads: 10,
                            has_premium_subscription: false
                        });
                    }
                    setShowExtendedOffer(false);
                } else {
                    throw authError; // Re-throw other errors
                }
            }

        } catch (error) {
            console.error('Error loading upload status:', error);

            // Ultimate fallback - show basic upload interface
            setUploadStatus({
                total_uploads_used: 0,
                upload_phase: 'initial',
                at_limit: false,
                needs_extended_offer: false,
                initial_uploads_used: 0,
                remaining_uploads: 10,
                has_premium_subscription: false
            });
            setShowExtendedOffer(false);
        }
    };

    // File handling functions
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleUpload(file);
        }
        event.target.value = '';
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async (file) => {
        // Check upload limits first
        if (uploadStatus?.at_limit) {
            setShowPaymentModal(true);
            return;
        }

        if (uploadStatus?.needs_extended_offer) {
            setShowExtendedOffer(true);
            return;
        }

        // Validate file
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            toast.error('Please upload a PDF or image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            toast.loading('Processing certificate...', { id: 'upload' });
            console.log('🚀 Starting upload for file:', file.name);

            // Check if user is authenticated
            if (!isAuthenticated) {
                // Use free tier analysis (no save)
                console.log('User not authenticated, using free analysis');
                try {
                    const result = await apiService.analyzeCertificatePreview(licenseNumber, file);
                    console.log('Analysis result:', result);

                    toast.success(`Certificate analyzed! Sign in to save results.`, { id: 'upload' });

                    // You could show a modal here with the analysis results
                    // For now, just log the results
                } catch (analysisError) {
                    console.error('Analysis error:', analysisError);
                    toast.error('Analysis failed. Please try again.', { id: 'upload' });
                }
                return;
            }

            // User is authenticated, try to upload and save
            try {
                const result = await apiService.uploadCertificateAuthenticated(licenseNumber, file);
                console.log('✅ Upload API response:', result);

                toast.success(`Certificate "${file.name}" uploaded successfully!`, { id: 'upload' });
                console.log('🔄 Refreshing upload status...');
                await loadUploadCount();

                // Show certificate manager after first upload
                setShowCertificateManager(true);

            } catch (uploadError) {
                if (uploadError.response?.status === 401 || uploadError.response?.status === 403) {
                    // Authentication expired during upload
                    console.log('Authentication expired, clearing tokens');
                    setIsAuthenticated(false);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    toast.error('Your session expired. Please sign in to save certificates.', { id: 'upload' });

                } else if (uploadError.response?.status === 402) {
                    toast.error('Payment required - upgrade needed', { id: 'upload' });
                    setShowPaymentModal(true);
                } else {
                    throw uploadError; // Re-throw other errors
                }
            }

        } catch (error) {
            console.error('💥 Upload error:', error);

            if (error.response?.data?.detail) {
                toast.error(`Upload failed: ${error.response.data.detail}`, { id: 'upload' });
            } else {
                toast.error(`Upload failed: ${error.message}`, { id: 'upload' });
            }
        } finally {
            setUploading(false);
        }
    };

    const handleAcceptExtendedOffer = async () => {
        if (!isAuthenticated) {
            toast.error('Please sign in to accept the extended trial.');
            return;
        }

        try {
            console.log('🎯 Accepting extended trial offer...');
            const result = await apiService.acceptExtendedTrial(licenseNumber);
            console.log('✅ Extended trial accepted:', result);
            setShowExtendedOffer(false);
            toast.success('🎉 Extended trial activated! 20 additional uploads unlocked.');
            await loadUploadCount();
        } catch (error) {
            console.error('❌ Error accepting extended trial:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                setIsAuthenticated(false);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                toast.error('Your session expired. Please sign in again.');
            } else {
                toast.error('Failed to activate extended trial. Please try again.');
            }
        }
    };

    const handleDeclineExtendedOffer = () => {
        setShowExtendedOffer(false);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        toast.success('🎉 Upgrade successful! You now have unlimited uploads.');
        await loadUploadCount();
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        toast.info('You can upgrade anytime to continue uploading certificates.');
    };

    const getProgressInfo = () => {
        if (!uploadStatus) return { current: 0, total: 10, phase: 'initial', label: '0 of 10 free uploads used' };

        const { upload_phase, initial_uploads_used, extended_uploads_used, total_uploads_used } = uploadStatus;

        if (upload_phase === 'initial') {
            return {
                current: initial_uploads_used || 0,
                total: 10,
                phase: 'initial',
                label: `${initial_uploads_used || 0} of 10 free uploads used`
            };
        } else if (upload_phase === 'extended') {
            return {
                current: extended_uploads_used || 0,
                total: 20,
                phase: 'extended',
                label: `${extended_uploads_used || 0} of 20 extended uploads used`
            };
        } else {
            return {
                current: total_uploads_used || 0,
                total: 30,
                phase: 'complete',
                label: `${total_uploads_used || 0} total uploads used`
            };
        }
    };

    // Callback to refresh data when certificates are updated
    const handleCertificateManagerRefresh = () => {
        loadUploadCount();
    };

    // Render upload zone based on authentication status
    const renderUploadZone = () => {
        if (checkingAuth) {
            return (
                <div className={styles.uploadingState}>
                    <div className={styles.uploadSpinner}></div>
                    <h4>Checking authentication...</h4>
                    <p>Please wait while we verify your session</p>
                </div>
            );
        }

        if (uploading) {
            return (
                <div className={styles.uploadingState}>
                    <div className={styles.uploadSpinner}></div>
                    <h4>Processing your certificate...</h4>
                    <p>AI is extracting CPE data from your document</p>
                </div>
            );
        }

        if (uploadStatus?.at_limit) {
            return (
                <div className={styles.upgradePrompt}>
                    <CheckCircle size={48} color="#059669" />
                    <h4>Ready to Upgrade?</h4>
                    <p>You've experienced everything SuperCPE offers with 30 free uploads!</p>
                    <Button
                        variant="primary"
                        onClick={() => setShowPaymentModal(true)}
                        className={styles.upgradeButton}
                    >
                        Upgrade Now
                    </Button>
                </div>
            );
        }

        return (
            <div className={styles.uploadPrompt}>
                <Upload size={48} color="#6b7280" />
                <h4>{dragActive ? 'Drop to upload certificate' : 'Click or drag to upload certificate'}</h4>
                <p className={styles.uploadHint}>
                    PDF, PNG, JPG • Max 10MB
                    {!isAuthenticated && <br />}
                    {!isAuthenticated && <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Sign in to save results</span>}
                </p>
                <Button
                    variant="primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('certificate-upload').click();
                    }}
                >
                    Choose File
                </Button>
                {!isAuthenticated && (
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '0.5rem' }}
                    >
                        Sign In to Save Results
                    </Button>
                )}
            </div>
        );
    };

    // Loading and error states
    if (loading) {
        return (
            <div className={styles.basicDashboard}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading your CPE compliance dashboard...</p>
            </div>
        );
    }

    if (error || !cpa) {
        return (
            <Card className={styles.errorCard}>
                <h3>Dashboard Unavailable</h3>
                <p>{error || `We couldn't find license number ${licenseNumber} in our database.`}</p>
                <Button onClick={loadCPAData} variant="primary">
                    Try Again
                </Button>
            </Card>
        );
    }

    const progressInfo = getProgressInfo();

    return (
        <div className={styles.basicDashboard}>
            {/* CPA Header */}
            <div className={styles.cpaHeader}>
                <h1 className={styles.cpaName}>{cpa.full_name}</h1>
                <p className={styles.cpaCredentials}>
                    License: {cpa.license_number} • Renews: {formatDate(new Date(cpa.license_expiration_date))} •
                    {Math.ceil((new Date(cpa.license_expiration_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                    {!isAuthenticated && <span style={{ color: '#f59e0b', marginLeft: '10px' }}>• Not signed in</span>}
                </p>
            </div>

            {/* Upload Section */}
            <Card className={styles.statusCard}>
                {uploadStatus && !uploadStatus.has_premium_subscription && (
                    <div className={styles.progressSection}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    background: progressInfo.phase === 'extended' ? '#10b981' : '#3b82f6',
                                    width: `${(progressInfo.current / progressInfo.total) * 100}%`,
                                }}
                            ></div>
                        </div>
                        <p className={styles.progressLabel}>
                            {progressInfo.label}
                            {progressInfo.phase === 'extended' && (
                                <span className={styles.extendedBadge}> • Extended Trial</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Upload Drop Zone */}
                <div
                    className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''} ${uploading ? styles.uploading : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && !uploadStatus?.at_limit && document.getElementById('certificate-upload').click()}
                >
                    <input
                        type="file"
                        id="certificate-upload"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        disabled={uploading || uploadStatus?.at_limit}
                    />

                    {renderUploadZone()}
                </div>
            </Card>

            {/* Certificate Manager - Only show if authenticated and has certificates */}
            {isAuthenticated && showCertificateManager && (
                <CertificateManager
                    licenseNumber={licenseNumber}
                    onRefresh={handleCertificateManagerRefresh}
                />
            )}

            {/* Extended Trial Offer Modal */}
            {showExtendedOffer && (
                <div className={styles.modalOverlay}>
                    <div className={styles.extendedOfferModal}>
                        <CheckCircle size={64} color="#10b981" />
                        <h2>Initial Testing Phase Complete!</h2>
                        <p>
                            Since SuperCPE is still in development, I'd like to extend <strong>20 additional free uploads</strong> to help you fully explore the platform. Your feedback during this testing phase is invaluable.
                        </p>
                        <p className={styles.offerHighlight}>
                            Continue exploring - no strings attached!
                        </p>
                        <div className={styles.offerActions}>
                            <Button
                                variant="primary"
                                onClick={handleAcceptExtendedOffer}
                                disabled={!isAuthenticated}
                            >
                                Accept 20 More Uploads
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDeclineExtendedOffer}
                            >
                                Upgrade Instead
                            </Button>
                        </div>
                        {!isAuthenticated && (
                            <p style={{ color: '#f59e0b', marginTop: '1rem', fontSize: '0.875rem' }}>
                                Please sign in to accept the extended trial.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Subscription Modal */}
            {showPaymentModal && (
                <SubscriptionModal
                    licenseNumber={licenseNumber}
                    cpaName={cpa?.full_name || 'CPA Professional'}
                    uploadsUsed={uploadStatus?.total_uploads_used || 0}
                    onClose={handlePaymentCancel}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

export default ProfessionalCPEDashboard;