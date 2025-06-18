// src/components/compliance/EnhancedFreemiumUploadSection.js
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { apiService } from '../../services/api';
import SubscriptionModal from './SubscriptionModal';
import styles from '../../styles/components/FreemiumUploadSection.module.css';

const EnhancedFreemiumUploadSection = ({ licenseNumber, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [freeTierStatus, setFreeTierStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    // Maximum free uploads allowed
    const MAX_FREE_UPLOADS = 10;

    // Load free tier status on component mount
    useEffect(() => {
        loadFreeTierStatus();
    }, [licenseNumber]);

    const loadFreeTierStatus = async () => {
        try {
            setLoading(true);
            const status = await apiService.getFreeTierStatus(licenseNumber);
            setFreeTierStatus(status);
        } catch (error) {
            console.error('Error loading free tier status:', error);
            toast.error('Failed to load upload status');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = async (acceptedFiles) => {
        if (!freeTierStatus) {
            toast.error('Please wait for status to load');
            return;
        }

        // Check if at upload limit
        if (freeTierStatus.at_limit && !freeTierStatus.has_premium_subscription) {
            setShowSubscriptionModal(true);
            return;
        }

        const file = acceptedFiles[0];
        if (!file) return;

        // Validate file type
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            toast.error('Please upload a PDF or image file');
            return;
        }

        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            toast.loading('🚀 Processing with full functionality...', { id: 'upload' });

            let result;

            // Use appropriate endpoint based on subscription status
            if (freeTierStatus.has_premium_subscription) {
                result = await apiService.uploadCertificatePremium(licenseNumber, file);
            } else {
                result = await apiService.uploadCertificateEnhancedFree(licenseNumber, file);
            }

            toast.success('🎉 Certificate processed successfully!', { id: 'upload' });

            // Update parent component with upload result
            onUploadSuccess({
                id: result.compliance_tracking?.database_record_id || Date.now(),
                fileName: file.name,
                fileSize: file.size,
                uploadDate: new Date(),
                extractedData: result.parsing_result?.parsed_data,
                assignedPeriod: result.compliance_tracking?.assigned_to_period,
                hours: result.compliance_tracking?.cpe_hours_added || 0,
                ethicsHours: result.compliance_tracking?.ethics_hours_added || 0,
                confidence: result.parsing_result?.confidence_score || 95,
                aiAnalysis: result,
                storedInCloud: result.storage_info?.uploaded_to_digital_ocean || false,
                permanentStorage: result.storage_info?.permanent_storage || false,
                databaseRecordId: result.compliance_tracking?.database_record_id,
                tierType: freeTierStatus.has_premium_subscription ? 'PREMIUM' : 'ENHANCED_FREE'
            });

            // Refresh status after successful upload
            await loadFreeTierStatus();

        } catch (error) {
            console.error('Upload failed:', error);

            // Handle different error types
            if (error.response?.status === 402) {
                const errorData = error.response.data;
                if (errorData.detail?.error === 'Free upload limit reached') {
                    toast.error(`🎯 You've used all ${errorData.detail.max_uploads} free uploads!`, { id: 'upload' });
                    setShowSubscriptionModal(true);
                    await loadFreeTierStatus(); // Refresh status
                    return;
                }
            }

            toast.error(error.response?.data?.detail || error.message || 'Failed to process certificate', { id: 'upload' });
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        multiple: false,
        disabled: uploading || (freeTierStatus?.at_limit && !freeTierStatus?.has_premium_subscription)
    });

    const handleSubscriptionSuccess = async () => {
        setShowSubscriptionModal(false);
        toast.success('🎉 Welcome to SuperCPE Professional!');
        await loadFreeTierStatus(); // Refresh status after subscription
    };

    if (loading) {
        return (
            <Card className={styles.uploadSection}>
                <div className={styles.loading}>
                    <p>Loading upload status...</p>
                </div>
            </Card>
        );
    }

    if (!freeTierStatus) {
        return (
            <Card className={styles.uploadSection}>
                <div className={styles.error}>
                    <p>Failed to load upload status. Please refresh the page.</p>
                </div>
            </Card>
        );
    }

    const isAtLimit = freeTierStatus.at_limit && !freeTierStatus.has_premium_subscription;
    const isDisabled = uploading || isAtLimit;
    const remaining = freeTierStatus.uploads_remaining;

    return (
        <>
            <Card className={styles.uploadSection}>
                {/* Header Section */}
                <div className={styles.uploadHeader}>
                    <h3>
                        {freeTierStatus.has_premium_subscription
                            ? 'SuperCPE Professional'
                            : '10 Free Uploads'
                        }
                    </h3>
                    <Badge variant={remaining > 0 || freeTierStatus.has_premium_subscription ? "success" : "warning"}>
                        {freeTierStatus.has_premium_subscription
                            ? "Professional Subscriber"
                            : remaining > 0
                                ? `${remaining} Full-Feature Uploads Remaining`
                                : "Upgrade for Unlimited Uploads"
                        }
                    </Badge>
                </div>

                {/* Upload Zone */}
                <div
                    {...getRootProps()}
                    className={`${styles.uploadZone} ${isDragActive ? styles.dragActive : ''} ${isDisabled ? styles.disabled : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className={styles.uploadContent}>
                        {isAtLimit ? (
                            <div className={styles.upgradePrompt}>
                                <h4>🎯 Ready to Upgrade!</h4>
                                <p>You've used all {MAX_FREE_UPLOADS} free uploads with full functionality.</p>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowSubscriptionModal(true)}
                                    disabled={uploading}
                                >
                                    Upgrade to Professional
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <h4>
                                    {isDragActive
                                        ? "Drop for instant AI analysis + cloud storage!"
                                        : freeTierStatus.has_premium_subscription
                                            ? "Upload Unlimited Certificates"
                                            : "Upload with FULL Professional Functionality"
                                    }
                                </h4>
                                <p>
                                    {freeTierStatus.has_premium_subscription
                                        ? "Unlimited uploads with professional features"
                                        : "AI Analysis + Digital Ocean Storage + Compliance Tracking"
                                    }
                                </p>
                                <Button variant="outline" disabled={isDisabled}>
                                    {uploading ? 'Processing...' : 'Click to upload certificate'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Indicator - Only show for free tier */}
                {!freeTierStatus.has_premium_subscription && freeTierStatus.uploads_used > 0 && (
                    <div className={styles.progressIndicator}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${(freeTierStatus.uploads_used / MAX_FREE_UPLOADS) * 100}%` }}
                            ></div>
                        </div>
                        <p>
                            ✨ {freeTierStatus.uploads_used} of {MAX_FREE_UPLOADS} enhanced uploads used
                            {remaining > 0 && ` (${remaining} remaining)`}
                        </p>
                    </div>
                )}

                {/* Benefits Section */}
                {!freeTierStatus.has_premium_subscription && (
                    <div className={styles.uploadBenefits}>
                        <h4>
                            {remaining > 0
                                ? '🎯 Your Enhanced Free Tier Includes FULL Functionality:'
                                : '🎯 Professional Features Waiting for You:'
                            }
                        </h4>

                        {remaining > 0 ? (
                            <div className={styles.enhancedNote}>
                                <strong>This is the SAME functionality as our $10/month Professional tier!</strong>
                                <br />Experience the complete system with your first {MAX_FREE_UPLOADS} certificates.
                            </div>
                        ) : (
                            <div className={styles.upgradeNote}>
                                <strong>Ready to continue with unlimited uploads?</strong>
                                <br />All your data will be preserved when you upgrade!
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Subscription Modal */}
            {showSubscriptionModal && (
                <SubscriptionModal
                    licenseNumber={licenseNumber}
                    cpaName={freeTierStatus.cpa_name}
                    uploadsUsed={freeTierStatus.uploads_used}
                    onClose={() => setShowSubscriptionModal(false)}
                    onSuccess={handleSubscriptionSuccess}
                />
            )}
        </>
    );
};

export default EnhancedFreemiumUploadSection;