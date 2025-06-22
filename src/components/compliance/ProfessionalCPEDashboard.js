// src/components/compliance/ProfessionalCPEDashboard.js
import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SubscriptionModal from './SubscriptionModal';
import { apiService } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';
import styles from '../../styles/pages/Dashboard.module.css';

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    // State management
    const [cpa, setCpa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null); // Enhanced status tracking
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExtendedOffer, setShowExtendedOffer] = useState(false); // New state for extended offer

    const MAX_FREE_UPLOADS = 30; // Updated to match backend TOTAL_FREE_UPLOADS

    // Effects
    useEffect(() => {
        if (licenseNumber) {
            loadCPAData();
            loadUploadCount();
        }
    }, [licenseNumber]);

    // Data loading functions
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

            // Use the authenticated endpoint instead of free-tier-status
            const status = await apiService.getUserUploadStatus(licenseNumber);
            console.log('📈 Upload status loaded:', status);

            setUploadStatus(status);

            // Only show extended offer if:
            // 1. User needs extended offer AND
            // 2. User hasn't already accepted it AND
            // 3. We're not already showing the modal
            if (status.needs_extended_offer &&
                !status.accepted_extended_trial &&
                status.upload_phase !== 'extended') {
                setShowExtendedOffer(true);
            } else {
                // Hide modal if user has accepted or is in extended phase
                setShowExtendedOffer(false);
            }
        } catch (error) {
            console.error('Error loading upload status:', error);

            // Fallback to free-tier-status if user is not authenticated
            if (error.response?.status === 401) {
                console.log('User not authenticated, falling back to free-tier-status');
                try {
                    const fallbackStatus = await apiService.getFreeTierStatus(licenseNumber);
                    setUploadStatus(fallbackStatus);
                    setShowExtendedOffer(false); // Don't show extended offer for unauthenticated users
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

    // Upload function
    const handleUpload = async (file) => {
        // Check upload limit first
        if (uploadStatus?.at_limit) {
            setShowPaymentModal(true);
            return;
        }

        // If at initial limit but extended offer available, show offer
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
            console.log('📝 License number:', licenseNumber);

            const result = await apiService.uploadCertificateAuthenticated(licenseNumber, file);

            console.log('✅ Upload API response:', result);

            toast.success(`Certificate "${file.name}" uploaded successfully!`, { id: 'upload' });

            // DISABLED: Duplicate detection (causing too many false positives)
            // if (result.duplicate_warning) {
            //     console.log('⚠️ Duplicate warning detected:', result.duplicate_warning);
            //     setTimeout(() => {
            //         toast.error(
            //             `⚠️ ${result.duplicate_warning.message} Found ${result.duplicate_warning.similar_count} similar certificate(s).`,
            //             { 
            //                 duration: 6000,
            //                 id: 'duplicate-warning'
            //             }
            //         );
            //     }, 1000);
            // }

            console.log('📊 Upload result details:', {
                hasParsingResult: !!result.parsing_result,
                hasStorageInfo: !!result.storage_info,
                hasComplianceTracking: !!result.compliance_tracking,
                hasDuplicateWarning: !!result.duplicate_warning,
                fullResult: result
            });

            console.log('🔄 Refreshing upload status...');
            await loadUploadCount();
            console.log('📈 New upload status:', uploadStatus?.total_uploads_used || 0, uploadStatus?.upload_phase || 'unknown');

        } catch (error) {
            console.error('💥 Upload error:', error);
            console.error('📋 Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

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

    // Extended offer handling
    const handleAcceptExtendedOffer = async () => {
        try {
            console.log('🎯 Accepting extended trial offer...');

            // Call the backend endpoint to accept extended trial
            const result = await apiService.acceptExtendedTrial(licenseNumber);

            console.log('✅ Extended trial accepted:', result);

            setShowExtendedOffer(false);
            toast.success('🎉 Extended trial activated! 20 additional uploads unlocked.');

            // Refresh status to reflect extended phase
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

    // Payment handling functions
    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        toast.success('🎉 Upgrade successful! You now have unlimited uploads.');
        await loadUploadCount();
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        toast.info('You can upgrade anytime to continue uploading certificates.');
    };

    // Helper function to get current progress info
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

    // Loading state
    if (loading) {
        return (
            <div className={styles.basicDashboard}>
                <div className="loading-spinner">Loading your CPE compliance dashboard...</div>
            </div>
        );
    }

    // Error state
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

    // Main render
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
                {/* Progress indicator */}
                {uploadStatus && uploadStatus.total_uploads_used > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            background: '#e5e7eb',
                            borderRadius: '10px',
                            height: '8px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                background: progressInfo.phase === 'extended' ? '#10b981' : '#3b82f6', // Green for extended phase
                                height: '100%',
                                width: `${(progressInfo.current / progressInfo.total) * 100}%`,
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginTop: '8px',
                            textAlign: 'center'
                        }}>
                            {progressInfo.label}
                            {progressInfo.phase === 'extended' && (
                                <span style={{ color: '#10b981', fontWeight: '600' }}> • Extended Trial</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Upload area */}
                <div
                    style={{
                        border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        backgroundColor: uploading ? '#f9fafb' : dragActive ? '#eff6ff' : 'transparent',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                    }}
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
                        <div>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                border: '3px solid #e5e7eb',
                                borderTop: '3px solid #3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px'
                            }}></div>
                            <p>Processing your certificate...</p>
                        </div>
                    ) : uploadStatus?.at_limit ? (
                        <div>
                            <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
                            <h4>Ready to Upgrade?</h4>
                            <p>You've experienced everything SuperCPE offers with 30 free uploads!</p>
                            <Button
                                variant="primary"
                                style={{ marginTop: '16px' }}
                                onClick={() => setShowPaymentModal(true)}
                            >
                                Upgrade Now
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <Upload size={48} color="#6b7280" style={{ margin: '0 auto 16px' }} />
                            <h4>{dragActive ? 'Drop to upload certificate' : 'Click or drag to upload certificate'}</h4>
                            <p style={{ color: '#6b7280', margin: '8px 0 16px' }}>
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

            {/* Extended Offer Modal */}
            {showExtendedOffer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        margin: '20px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
                        <h2 style={{ marginBottom: '16px', color: '#1f2937' }}>Initial Testing Phase Complete!</h2>
                        <p style={{ marginBottom: '24px', color: '#6b7280', lineHeight: '1.6' }}>
                            Since SuperCPE is still in development, I'd like to extend <strong>20 additional free uploads</strong> to help you fully explore the platform. Your feedback during this testing phase is invaluable.
                        </p>
                        <p style={{ marginBottom: '32px', color: '#059669', fontWeight: '600' }}>
                            Continue exploring - no strings attached!
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Button
                                variant="primary"
                                onClick={handleAcceptExtendedOffer}
                                style={{ padding: '12px 24px' }}
                            >
                                Accept 20 More Uploads
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDeclineExtendedOffer}
                                style={{ padding: '12px 24px' }}
                            >
                                Upgrade Instead
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
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