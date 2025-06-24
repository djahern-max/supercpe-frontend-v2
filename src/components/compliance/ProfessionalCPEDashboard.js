// src/components/compliance/ProfessionalCPEDashboard.js - REBUILT & SIMPLIFIED
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

    useEffect(() => {
        if (licenseNumber) {
            loadCPAData();
            loadUploadCount();
        }
    }, [licenseNumber]);

    // Show certificate manager when user has uploaded certificates
    useEffect(() => {
        if (uploadStatus && uploadStatus.total_uploads_used > 0) {
            setShowCertificateManager(true);
        }
    }, [uploadStatus]);

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
            const status = await apiService.getUserUploadStatus(licenseNumber);
            console.log('📈 Upload status loaded:', status);
            setUploadStatus(status);

            if (status.needs_extended_offer &&
                !status.accepted_extended_trial &&
                status.upload_phase !== 'extended') {
                setShowExtendedOffer(true);
            } else {
                setShowExtendedOffer(false);
            }
        } catch (error) {
            console.error('Error loading upload status:', error);
            if (error.response?.status === 401) {
                console.log('User not authenticated, falling back to free-tier-status');
                try {
                    const fallbackStatus = await apiService.getFreeTierStatus(licenseNumber);
                    setUploadStatus(fallbackStatus);
                    setShowExtendedOffer(false);
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    setUploadStatus({
                        total_uploads_used: 0,
                        upload_phase: 'initial',
                        at_limit: false,
                        needs_extended_offer: false
                    });
                    setShowExtendedOffer(false);
                }
            } else {
                setUploadStatus({
                    total_uploads_used: 0,
                    upload_phase: 'initial',
                    at_limit: false,
                    needs_extended_offer: false
                });
                setShowExtendedOffer(false);
            }
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
        if (uploadStatus?.at_limit) {
            setShowPaymentModal(true);
            return;
        }

        if (uploadStatus?.needs_extended_offer) {
            setShowExtendedOffer(true);
            return;
        }

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

            const result = await apiService.uploadCertificateAuthenticated(licenseNumber, file);
            console.log('✅ Upload API response:', result);

            toast.success(`Certificate "${file.name}" uploaded successfully!`, { id: 'upload' });
            console.log('🔄 Refreshing upload status...');
            await loadUploadCount();

            // Show certificate manager after first upload
            setShowCertificateManager(true);

        } catch (error) {
            console.error('💥 Upload error:', error);
            if (error.response?.status === 402) {
                toast.error('Payment required - upgrade needed', { id: 'upload' });
            } else if (error.response?.status === 401) {
                toast.error('Authentication required', { id: 'upload' });
            } else if (error.response?.data?.detail) {
                toast.error(`Upload failed: ${error.response.data.detail}`, { id: 'upload' });
            } else {
                toast.error(`Upload failed: ${error.message}`, { id: 'upload' });
            }
        } finally {
            setUploading(false);
        }
    };

    const handleAcceptExtendedOffer = async () => {
        try {
            console.log('🎯 Accepting extended trial offer...');
            const result = await apiService.acceptExtendedTrial(licenseNumber);
            console.log('✅ Extended trial accepted:', result);
            setShowExtendedOffer(false);
            toast.success('🎉 Extended trial activated! 20 additional uploads unlocked.');
            await loadUploadCount();
        } catch (error) {
            console.error('❌ Error accepting extended trial:', error);
            toast.error('Failed to activate extended trial. Please try again.');
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
        if (!uploadStatus) return { current: 0, total: 10, phase: 'initial' };

        const { upload_phase, initial_uploads_used, extended_uploads_used, total_uploads_used } = uploadStatus;

        if (upload_phase === 'initial') {
            return {
                current: initial_uploads_used,
                total: 10,
                phase: 'initial',
                label: `${initial_uploads_used} of 10 free uploads used`
            };
        } else if (upload_phase === 'extended') {
            return {
                current: extended_uploads_used,
                total: 20,
                phase: 'extended',
                label: `${extended_uploads_used} of 20 extended uploads used`
            };
        } else {
            return {
                current: total_uploads_used,
                total: 30,
                phase: 'complete',
                label: `${total_uploads_used} total uploads used`
            };
        }
    };

    // Callback to refresh data when certificates are updated
    const handleCertificateManagerRefresh = () => {
        loadUploadCount();
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

                    {uploading ? (
                        <div className={styles.uploadingState}>
                            <div className={styles.uploadSpinner}></div>
                            <h4>Processing your certificate...</h4>
                            <p>AI is extracting CPE data from your document</p>
                        </div>
                    ) : uploadStatus?.at_limit ? (
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
                    ) : (
                        <div className={styles.uploadPrompt}>
                            <Upload size={48} color="#6b7280" />
                            <h4>{dragActive ? 'Drop to upload certificate' : 'Click or drag to upload certificate'}</h4>
                            <p className={styles.uploadHint}>
                                PDF, PNG, JPG • Max 10MB
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
                        </div>
                    )}
                </div>
            </Card>

            {/* Certificate Manager - Replaces CE Broker Section */}
            {showCertificateManager && (
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