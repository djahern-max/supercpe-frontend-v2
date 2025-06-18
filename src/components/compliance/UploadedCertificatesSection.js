// src/components/compliance/UploadedCertificatesSection.js
import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/dateUtils';
import styles from '../../styles/components/UploadedCertificatesSection.module.css';

// Helper function
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UploadedCertificatesSection = ({ uploads }) => {
    if (!uploads || uploads.length === 0) return null;

    return (
        <Card className={styles.uploadedCertificatesSection}>
            <div className={styles.sectionHeader}>
                <h3>Your Uploaded Certificates</h3>
                <Badge variant="success">
                    {uploads.length} Certificate{uploads.length !== 1 ? 's' : ''} Processed
                </Badge>
            </div>

            <div className={styles.certificatesList}>
                {uploads.map((upload) => (
                    <CertificateCard
                        key={upload.id}
                        upload={upload}
                        formatFileSize={formatFileSize}
                    />
                ))}
            </div>

            {/* Summary statistics */}
            <div className={styles.uploadSummary}>
                <h4>Summary</h4>
                <div className={styles.summaryStats}>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Total Hours</span>
                        <span className={styles.statValue}>
                            {uploads.reduce((sum, upload) => sum + (upload.hours || 0), 0)}
                        </span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Ethics Hours</span>
                        <span className={styles.statValue}>
                            {uploads.reduce((sum, upload) => sum + (upload.ethicsHours || 0), 0)}
                        </span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Certificates</span>
                        <span className={styles.statValue}>
                            {uploads.length}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const CertificateCard = ({ upload, formatFileSize }) => {
    return (
        <div className={styles.certificateCard}>
            {/* File info header */}
            <div className={styles.cardHeader}>
                <div className={styles.fileInfo}>
                    <h4 className={styles.fileName}>{upload.fileName}</h4>
                    <div className={styles.fileMeta}>
                        <span>{formatFileSize(upload.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(upload.uploadDate)}</span>
                    </div>
                </div>
                <Badge variant="success">
                    {upload.confidence}% Confidence
                </Badge>
            </div>

            {/* Extracted data */}
            <div className={styles.extractedData}>
                <div className={styles.dataGrid}>
                    <div className={styles.dataItem}>
                        <span className={styles.dataLabel}>CPE Hours</span>
                        <span className={styles.dataValue}>{upload.hours}</span>
                    </div>

                    {upload.ethicsHours > 0 && (
                        <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Ethics Hours</span>
                            <span className={styles.dataValue}>{upload.ethicsHours}</span>
                        </div>
                    )}

                    {/* Show extracted course/program info if available */}
                    {upload.extractedData?.course_title && (
                        <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Course</span>
                            <span className={styles.dataValue}>{upload.extractedData.course_title}</span>
                        </div>
                    )}

                    {upload.extractedData?.completion_date && (
                        <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Completion Date</span>
                            <span className={styles.dataValue}>
                                {formatDate(upload.extractedData.completion_date)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Smart period assignment - the killer feature */}
                {upload.assignedPeriod && (
                    <div className={styles.periodAssignment}>
                        <div className={styles.assignmentHeader}>
                            <span className={styles.assignmentLabel}>🎯 Smart Period Assignment</span>
                            <Badge variant="primary">
                                {upload.assignedPeriod}
                            </Badge>
                        </div>
                        <p className={styles.assignmentNote}>
                            Automatically assigned based on completion date and your renewal cycle
                        </p>
                    </div>
                )}

                {/* Show other extracted details if available */}
                {upload.extractedData?.provider && (
                    <div className={styles.additionalDetails}>
                        <h5>Additional Details</h5>
                        <div className={styles.detailsList}>
                            <div className={styles.detail}>
                                <span>Provider:</span>
                                <span>{upload.extractedData.provider}</span>
                            </div>
                            {upload.extractedData?.field_of_study && (
                                <div className={styles.detail}>
                                    <span>Field:</span>
                                    <span>{upload.extractedData.field_of_study}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadedCertificatesSection;