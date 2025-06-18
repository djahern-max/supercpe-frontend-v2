// src/components/compliance/FreemiumUploadSection.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import UpgradeModal from './UpgradeModal';
import { apiService } from '../../services/api';
import styles from '../../styles/components/FreemiumUploadSection.module.css';

const FreemiumUploadSection = ({ licenseNumber, uploadCount, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // ENHANCED: Now offering 10 free uploads with FULL functionality
    const MAX_FREE_UPLOADS = 10;
    const remaining = MAX_FREE_UPLOADS - uploadCount;

    const onDrop = async (acceptedFiles) => {
        if (uploadCount >= MAX_FREE_UPLOADS) {
            setShowUpgradeModal(true);
            return;
        }

        const file = acceptedFiles[0];
        if (!file) return;

        // Validate file type
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            toast.error('Please upload a PDF or image file');
            return;
        }

        try {
            setUploading(true);
            toast.loading('🚀 Processing with full functionality...', { id: 'upload' });

            // Call the ENHANCED free tier endpoint with full functionality
            const result = await apiService.uploadCertificateEnhancedFree(licenseNumber, file);

            toast.success('🎉 Certificate processed with full functionality!', { id: 'upload' });

            // Pass the enhanced result up to parent
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
                // Enhanced data
                storedInCloud: result.storage_info?.uploaded_to_digital_ocean || false,
                permanentStorage: result.storage_info?.permanent_storage || false,
                databaseRecordId: result.compliance_tracking?.database_record_id,
                tierType: 'ENHANCED_FREE'
            });

        } catch (error) {
            console.error('Upload failed:', error);

            // Handle free tier limit reached
            if (error.response?.status === 402) {
                const errorData = error.response.data;
                if (errorData.detail?.error === 'Free upload limit reached') {
                    toast.error(`🎯 You've used all ${errorData.detail.max_uploads} free uploads!`, { id: 'upload' });
                    setShowUpgradeModal(true);
                    return;
                }
            }

            toast.error(error.message || 'Failed to process certificate', { id: 'upload' });
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
        disabled: uploading || uploadCount >= MAX_FREE_UPLOADS
    });

    const isDisabled = uploading || uploadCount >= MAX_FREE_UPLOADS;

    return (
        <>
            <Card className={styles.uploadSection}>
                {/* Enhanced Progress Header */}
                <div className={styles.uploadHeader}>
                    <h3> Enhanced Free CPE Management</h3>
                    <Badge variant={remaining > 0 ? "success" : "warning"}>
                        {remaining > 0
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
                        {uploading ? (
                            <div className={styles.uploadingState}>
                                <div className="loading-spinner"></div>
                                <h4>🤖 AI Analysis + Cloud Storage in Progress...</h4>
                                <p>✨ Full functionality: AI extraction + Digital Ocean upload + Database storage</p>
                            </div>
                        ) : isDisabled ? (
                            <div className={styles.disabledState}>
                                <h4>🎉 Amazing! You've used all 10 enhanced free uploads!</h4>
                                <p>You experienced the full SuperCPE Professional experience with AI analysis, secure cloud storage, and real-time compliance tracking.</p>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowUpgradeModal(true)}
                                >
                                    Continue with Unlimited Professional
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.activeState}>
                                <div className={styles.uploadIcon}>🚀</div>
                                <h4>
                                    {isDragActive
                                        ? "Drop for instant AI analysis + cloud storage!"
                                        : "Upload with FULL Professional Functionality"
                                    }
                                </h4>
                                <p>AI Analysis + Digital Ocean Storage + Compliance Tracking</p>
                                <Button variant="outline">
                                    Click to upload certificate
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Progress Indicator */}
                {uploadCount > 0 && (
                    <div className={styles.progressIndicator}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${(uploadCount / MAX_FREE_UPLOADS) * 100}%` }}
                            ></div>
                        </div>
                        <p>✨ {uploadCount} of {MAX_FREE_UPLOADS} enhanced uploads used (with full functionality)</p>
                    </div>
                )}



            </Card>

            {/* Enhanced Upgrade Modal */}
            {showUpgradeModal && (
                <UpgradeModal
                    onClose={() => setShowUpgradeModal(false)}
                    uploadCount={uploadCount}
                    licenseNumber={licenseNumber}
                    enhancedFreeExperience={true}
                />
            )}
        </>
    );
};

export default FreemiumUploadSection;