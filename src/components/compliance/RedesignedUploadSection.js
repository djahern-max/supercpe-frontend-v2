// src/components/compliance/RedesignedUploadSection.js
import React, { useState } from 'react';
import { Upload, Shield, Check, ArrowRight, FileText, Clock, Zap } from 'lucide-react';
import Button from '../ui/Button';
import QuickSignupModal from './QuickSignupModal';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';
import styles from '../../styles/components/RedesignedUploadSection.module.css';

const RedesignedUploadSection = ({ licenseNumber, cpaName, onUploadSuccess }) => {
    const { isAuthenticated, user } = useAuth();
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleUploadClick = () => {
        if (!isAuthenticated) {
            setShowSignupModal(true);
            return;
        }
        // Trigger file picker
        document.getElementById('hidden-file-input').click();
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

        if (!isAuthenticated) {
            setShowSignupModal(true);
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (event) => {
        if (event.target.files && event.target.files[0]) {
            handleUpload(event.target.files[0]);
        }
        // Reset file input
        event.target.value = '';
    };

    const handleUpload = async (file) => {
        if (!file) return;

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

            const result = await apiService.uploadCertificateAuthenticated(licenseNumber, file);

            // toast.success('Certificate processed successfully!', { id: 'upload' });

            if (onUploadSuccess) {
                onUploadSuccess(result);
            }
        } catch (error) {
            console.error('Upload error:', error);

            if (error.response?.status === 402) {
                toast.error('Upgrade required to continue uploading', { id: 'upload' });
            } else if (error.response?.status === 401) {
                toast.error('Please sign in to upload certificates', { id: 'upload' });
                setShowSignupModal(true);
            } else {
                toast.error(error.response?.data?.detail || 'Upload failed. Please try again.', { id: 'upload' });
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSignupSuccess = () => {
        setShowSignupModal(false);
        toast.success('Account created! You can now upload certificates.');
    };

    if (isAuthenticated) {
        // Authenticated user - show full upload interface
        return (
            <div className={styles.uploadContainer}>
                <div className={styles.uploadHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.iconWrapper}>
                            <Upload className={styles.uploadIcon} size={24} />
                        </div>
                        <div className={styles.headerText}>
                            <h2>Upload CPE Certificate</h2>
                            <p>Drag and drop your certificate or click to browse</p>
                        </div>
                    </div>
                </div>

                <div
                    className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''} ${uploading ? styles.uploading : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleUploadClick}
                >
                    <input
                        id="hidden-file-input"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />

                    <div className={styles.uploadContent}>
                        {uploading ? (
                            <>
                                <div className={styles.spinner}></div>
                                <h3>Processing Certificate...</h3>
                                <p>Our AI is extracting course details</p>
                            </>
                        ) : (
                            <>
                                <Upload className={styles.uploadIconLarge} size={48} />
                                <h3>{dragActive ? 'Drop to upload' : 'Click or drag to upload'}</h3>
                                <p>PDF, PNG, JPG • Max 10MB</p>
                                <Button variant="primary" disabled={uploading}>
                                    Choose File
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <Zap size={16} />
                        <span>AI-powered extraction</span>
                    </div>
                    <div className={styles.feature}>
                        <Shield size={16} />
                        <span>Secure cloud storage</span>
                    </div>
                    <div className={styles.feature}>
                        <Clock size={16} />
                        <span>Instant compliance tracking</span>
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated - show signup prompt
    return (
        <>
            <div className={styles.authPromptContainer}>
                <div className={styles.authPromptContent}>
                    <div className={styles.iconWrapper}>
                        <Shield className={styles.shieldIcon} size={32} />
                    </div>

                    <div className={styles.authPromptText}>
                        <h2>Sign In Required</h2>
                        <p>Create a free account to upload and track your CPE certificates securely.</p>
                    </div>

                    <Button
                        variant="primary"
                        onClick={() => setShowSignupModal(true)}
                        className={styles.signupButton}
                    >
                        <ArrowRight size={16} />
                        Create Free Account
                    </Button>
                </div>

                <div className={styles.featureGrid}>
                    <div className={styles.featureItem}>
                        <Check className={styles.checkIcon} size={16} />
                        <span>10 free uploads with full features</span>
                    </div>
                    <div className={styles.featureItem}>
                        <Check className={styles.checkIcon} size={16} />
                        <span>Secure cloud storage</span>
                    </div>
                    <div className={styles.featureItem}>
                        <Check className={styles.checkIcon} size={16} />
                        <span>AI-powered analysis</span>
                    </div>
                    <div className={styles.featureItem}>
                        <Check className={styles.checkIcon} size={16} />
                        <span>Compliance tracking</span>
                    </div>
                </div>
            </div>

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
};

export default RedesignedUploadSection;