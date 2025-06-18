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

    const MAX_FREE_UPLOADS = 5;
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
            toast.loading('Analyzing certificate with AI...', { id: 'upload' });

            // Call the AI analysis endpoint
            const result = await apiService.analyzeCertificate(licenseNumber, file);

            toast.success('Certificate analyzed successfully!', { id: 'upload' });

            // Pass the result up to parent
            onUploadSuccess({
                id: Date.now(),
                fileName: file.name,
                fileSize: file.size,
                uploadDate: new Date(),
                extractedData: result.extracted_data,
                assignedPeriod: result.assigned_period,
                hours: result.hours || result.extracted_data?.hours || 0,
                ethicsHours: result.ethics_hours || result.extracted_data?.ethics_hours || 0,
                confidence: result.confidence || 95,
                aiAnalysis: result
            });

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error.message || 'Failed to analyze certificate', { id: 'upload' });
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
                {/* Progress Header */}
                <div className={styles.uploadHeader}>
                    <h3>Upload Your CPE Certificates</h3>
                    <Badge variant={remaining > 0 ? "success" : "warning"}>
                        {remaining > 0
                            ? `${remaining} Free Uploads Remaining`
                            : "Upgrade to Continue Uploading"
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
                                <h4>Analyzing Certificate with AI...</h4>
                                <p>Our AI is extracting CPE hours, dates, and compliance data</p>
                            </div>
                        ) : isDisabled ? (
                            <div className={styles.disabledState}>
                                <h4>🎉 You've used all 5 free uploads!</h4>
                                <p>Upgrade to SuperCPE Professional to continue tracking your CPE compliance</p>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowUpgradeModal(true)}
                                >
                                    Upgrade Now
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.activeState}>
                                <div className={styles.uploadIcon}>📄</div>
                                <h4>
                                    {isDragActive
                                        ? "Drop your certificate here!"
                                        : "Drag & drop your CPE certificate"
                                    }
                                </h4>
                                <p>Supports PDF, PNG, JPG files</p>
                                <Button variant="outline">
                                    Or click to browse files
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Progress Indicator */}
                {uploadCount > 0 && (
                    <div className={styles.progressIndicator}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${(uploadCount / MAX_FREE_UPLOADS) * 100}%` }}
                            ></div>
                        </div>
                        <p>{uploadCount} of {MAX_FREE_UPLOADS} free uploads used</p>
                    </div>
                )}


            </Card>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <UpgradeModal
                    onClose={() => setShowUpgradeModal(false)}
                    uploadCount={uploadCount}
                    licenseNumber={licenseNumber}
                />
            )}
        </>
    );
};

export default FreemiumUploadSection;