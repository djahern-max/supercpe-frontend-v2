// src/components/compliance/EnhancedFreemiumUploadSection.js
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { apiService } from '../../services/api';
import SubscriptionModal from './SubscriptionModal';
import styles from '../../styles/components/FreemiumUploadSection.module.css';

const EnhancedFreemiumUploadSection = ({ licenseNumber, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [userStatus, setUserStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const MAX_FREE_UPLOADS = 10;

    useEffect(() => {
        loadUserStatus();
    }, [licenseNumber]);

    const loadUserStatus = async () => {
        try {
            setLoading(true);
            const status = await apiService.getFreeTierStatus(licenseNumber);
            setUserStatus(status);
        } catch (error) {
            console.error('Error loading user status:', error);
            toast.error('Failed to load upload status');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (acceptedFiles) => {
        if (!userStatus) {
            toast.error('Please wait for status to load');
            return;
        }

        // Check if user needs to upgrade
        if (userStatus.at_limit && !userStatus.has_premium_subscription) {
            setShowSubscriptionModal(true);
            return;
        }

        const file = acceptedFiles[0];
        if (!file) return;

        // Basic file validation
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

            const result = userStatus.has_premium_subscription
                ? await apiService.uploadCertificatePremium(licenseNumber, file)
                : await apiService.uploadCertificateEnhancedFree(licenseNumber, file);

            toast.success('Certificate processed successfully!', { id: 'upload' });

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
                tierType: userStatus.has_premium_subscription ? 'PREMIUM' : 'ENHANCED_FREE'
            });

            await loadUserStatus();

        } catch (error) {
            console.error('Upload failed:', error);

            if (error.response?.status === 402) {
                const errorData = error.response.data;
                if (errorData.detail?.error === 'Free upload limit reached') {
                    toast.error(`You've used all ${errorData.detail.max_uploads} free uploads!`, { id: 'upload' });
                    setShowSubscriptionModal(true);
                    await loadUserStatus();
                    return;
                }
            }

            toast.error(error.response?.data?.detail || error.message || 'Failed to process certificate', { id: 'upload' });
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleUpload,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        multiple: false,
        disabled: uploading || (userStatus?.at_limit && !userStatus?.has_premium_subscription)
    });

    const handleSubscriptionSuccess = async () => {
        setShowSubscriptionModal(false);
        toast.success('Welcome to SuperCPE Professional!');
        await loadUserStatus();
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.loading}>
                <p>Loading upload status...</p>
            </div>
        );
    }

    // Error state
    if (!userStatus) {
        return (
            <div className={styles.error}>
                <p>Failed to load upload status. Please refresh the page.</p>
            </div>
        );
    }

    const isPremium = userStatus.has_premium_subscription;
    const isAtLimit = userStatus.at_limit && !isPremium;
    const remaining = userStatus.uploads_remaining;

    return (
        <>
            {/* Simple Header - Only show for free tier */}
            {!isPremium && (
                <div className={styles.uploadHeader}>
                    <Badge variant={remaining > 0 ? "success" : "warning"}>
                        {remaining > 0 ? `${remaining} Free Uploads` : "Upgrade Required"}
                    </Badge>
                    <div className={styles.uploadNote}>
                        Supported formats: PDF, PNG, JPG • {remaining} uploads remaining
                    </div>
                </div>
            )}

            {/* Upload Zone */}
            <div
                {...getRootProps()}
                className={`${styles.uploadZone} ${isDragActive ? styles.dragActive : ''} ${isAtLimit ? styles.disabled : ''}`}
            >
                <input {...getInputProps()} />

                {isAtLimit ? (
                    <div className={styles.upgradePrompt}>
                        <h4>Upgrade to Continue</h4>
                        <p>You've used all {MAX_FREE_UPLOADS} free uploads.</p>
                        <Button
                            variant="primary"
                            onClick={() => setShowSubscriptionModal(true)}
                            disabled={uploading}
                        >
                            Upgrade to Professional
                        </Button>
                    </div>
                ) : (
                    <div className={styles.uploadContent}>
                        <h4>
                            {isDragActive
                                ? "Drop to upload"
                                : isPremium
                                    ? "Upload Certificate"
                                    : "Upload with Full Features"
                            }
                        </h4>
                        <p>
                            {isPremium
                                ? "Unlimited uploads with all professional features"
                                : "AI Analysis + Cloud Storage + Compliance Tracking"
                            }
                        </p>
                        <Button variant="outline" disabled={uploading}>
                            {uploading ? 'Processing...' : 'Click to upload'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Progress Bar - Only for free tier */}
            {!isPremium && userStatus.uploads_used > 0 && (
                <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${(userStatus.uploads_used / MAX_FREE_UPLOADS) * 100}%` }}
                        />
                    </div>
                    <p>{userStatus.uploads_used} of {MAX_FREE_UPLOADS} uploads used</p>
                </div>
            )}



            {/* Subscription Modal */}
            {showSubscriptionModal && (
                <SubscriptionModal
                    licenseNumber={licenseNumber}
                    cpaName={userStatus.cpa_name}
                    uploadsUsed={userStatus.uploads_used}
                    onClose={() => setShowSubscriptionModal(false)}
                    onSuccess={handleSubscriptionSuccess}
                />
            )}
        </>
    );
};

export default EnhancedFreemiumUploadSection;