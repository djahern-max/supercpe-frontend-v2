// src/components/compliance/AuthRequiredUploadSection.js
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { Shield, Upload, UserPlus, LogIn } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import QuickSignupModal from './QuickSignupModal';
import SubscriptionModal from './SubscriptionModal';
import styles from '../../styles/components/FreemiumUploadSection.module.css';

const AuthRequiredUploadSection = ({ licenseNumber, cpaName, onUploadSuccess }) => {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [userStatus, setUserStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const MAX_FREE_UPLOADS = 10;

    useEffect(() => {
        if (isAuthenticated && user?.license_number) {
            loadUserStatus();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [isAuthenticated, user, authLoading]);

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

    const handleUploadClick = () => {
        if (!isAuthenticated) {
            setShowSignupModal(true);
            return;
        }

        // If authenticated, check license ownership
        if (user.license_number !== licenseNumber) {
            toast.error('You can only upload certificates for your own license');
            return;
        }

        // Check upload limits
        if (userStatus?.at_limit && !userStatus?.has_premium_subscription) {
            setShowSubscriptionModal(true);
            return;
        }

        // Trigger file picker
        document.getElementById('hidden-file-input').click();
    };

    const handleFileSelect = async (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            await handleUpload([files[0]]);
        }
        // Reset file input
        event.target.value = '';
    };

    const handleUpload = async (acceptedFiles) => {
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

            const result = userStatus?.has_premium_subscription
                ? await apiService.uploadCertificatePremium(licenseNumber, file)
                : await apiService.uploadCertificateAuthenticated(licenseNumber, file);

            // toast.success('Certificate processed successfully!', { id: 'upload' });

            if (onUploadSuccess) {
                onUploadSuccess(result);
            }

            // Reload status to update counts
            await loadUserStatus();

        } catch (error) {
            console.error('Upload error:', error);

            if (error.response?.status === 402) {
                // Payment required - show subscription modal
                setShowSubscriptionModal(true);
                toast.error('Upgrade required to continue uploading', { id: 'upload' });
            } else if (error.response?.status === 401) {
                // Authentication required
                toast.error('Please sign in to upload certificates', { id: 'upload' });
                setShowSignupModal(true);
            } else {
                toast.error(error.response?.data?.detail || 'Upload failed. Please try again.', { id: 'upload' });
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSignupSuccess = async () => {
        setShowSignupModal(false);
        await loadUserStatus();
        toast.success('Account created! You can now upload certificates.');
    };

    const handleSubscriptionSuccess = async () => {
        setShowSubscriptionModal(false);
        await loadUserStatus();
        toast.success('Subscription activated! Enjoy unlimited uploads.');
    };

    // Dropzone configuration
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleUpload,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        multiple: false,
        disabled: uploading || (!isAuthenticated)
    });

    // Loading state
    if (loading || authLoading) {
        return (
            <div className={styles.loading}>
                <p>Loading upload status...</p>
            </div>
        );
    }

    // Not authenticated state
    if (!isAuthenticated) {
        return (
            <>
                <div className={styles.authRequired}>
                    <div className={styles.authPrompt}>
                        <Shield className={styles.authIcon} size={48} />
                        <h3>Sign In Required</h3>
                        <p>Create a free account to upload and track your CPE certificates securely.</p>

                        <div className={styles.authButtons}>
                            <Button
                                variant="primary"
                                onClick={() => setShowSignupModal(true)}
                                disabled={uploading}
                            >
                                <UserPlus size={20} />
                                Create Free Account
                            </Button>
                        </div>

                        <div className={styles.benefits}>
                            <div className={styles.benefit}>
                                <span className={styles.checkmark}>✓</span>
                                <span>10 free uploads with full features</span>
                            </div>
                            <div className={styles.benefit}>
                                <span className={styles.checkmark}>✓</span>
                                <span>Secure cloud storage</span>
                            </div>
                            <div className={styles.benefit}>
                                <span className={styles.checkmark}>✓</span>
                                <span>AI-powered analysis</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Signup Modal */}
                {showSignupModal && (
                    <QuickSignupModal
                        licenseNumber={licenseNumber}
                        cpaName={cpaName}
                        onClose={() => setShowSignupModal(false)}
                        onSuccess={handleSignupSuccess}
                    />
                )}
            </>
        );
    }

    // Authenticated state
    const isPremium = userStatus?.has_premium_subscription;
    const isAtLimit = userStatus?.at_limit && !isPremium;
    const remaining = userStatus?.uploads_remaining || 0;

    return (
        <>
            {/* Upload Header */}
            {!isPremium && (
                <div className={styles.uploadHeader}>
                    <Badge variant={remaining > 0 ? "success" : "warning"}>
                        {remaining > 0 ? `${remaining} Free Uploads Remaining` : "Upgrade Required"}
                    </Badge>
                    <div className={styles.uploadNote}>
                        Supported formats: PDF, PNG, JPG • {userStatus?.uploads_used || 0} of {MAX_FREE_UPLOADS} used
                    </div>
                </div>
            )}

            {/* Upload Zone */}
            <div
                {...getRootProps()}
                className={`${styles.uploadZone} ${isDragActive ? styles.dragActive : ''} ${isAtLimit ? styles.disabled : ''}`}
            >
                <input {...getInputProps()} />

                {/* Hidden file input for click uploads */}
                <input
                    id="hidden-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />

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
                        <Upload className={styles.uploadIcon} size={48} />
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
                        <Button
                            variant="outline"
                            disabled={uploading}
                            onClick={handleUploadClick}
                        >
                            {uploading ? 'Processing...' : 'Click to Upload'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Progress Bar - Only for free tier */}
            {!isPremium && userStatus?.uploads_used > 0 && (
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
                    cpaName={cpaName}
                    uploadsUsed={userStatus?.uploads_used || MAX_FREE_UPLOADS}
                    onClose={() => setShowSubscriptionModal(false)}
                    onSuccess={handleSubscriptionSuccess}
                />
            )}
        </>
    );
};

export default AuthRequiredUploadSection;