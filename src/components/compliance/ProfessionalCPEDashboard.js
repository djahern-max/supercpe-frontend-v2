// src/components/compliance/ProfessionalCPEDashboard.js
import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, Clock, AlertTriangle, CheckCircle, Eye, Download, Shield, Database } from 'lucide-react';
import styles from '../../styles/components/ProfessionalCPEDashboard.module.css';

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    // REAL STATE - NO MOCK DATA
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Load dashboard data on component mount
    useEffect(() => {
        if (licenseNumber) {
            loadDashboardData(licenseNumber);
        }
    }, [licenseNumber]);

    const loadDashboardData = async (license) => {
        try {
            setLoading(true);
            setError(null);
            // Import your API service
            const { apiService } = await import('../../services/api');
            const response = await apiService.getComplianceDashboard(license);
            setDashboardData(response);
            console.log('Dashboard data loaded:', response);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.container}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <h2>Loading your CPE compliance dashboard...</h2>
                        <p>Retrieving your certificates and compliance status</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error || !dashboardData) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.container}>
                    <div className={styles.errorState}>
                        <AlertTriangle className={styles.errorIcon} />
                        <h2>Unable to Load Dashboard</h2>
                        <p>{error || 'No dashboard data available'}</p>
                        <button
                            className={styles.retryButton}
                            onClick={() => loadDashboardData(licenseNumber)}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate compliance status
    const getComplianceStatus = () => {
        const { total_cpe_hours } = dashboardData.compliance_summary;
        if (total_cpe_hours >= 120) return { status: 'Compliant', className: styles.statusCompliant };
        if (total_cpe_hours >= 80) return { status: 'On Track', className: styles.statusOnTrack };
        if (total_cpe_hours >= 40) return { status: 'Needs Attention', className: styles.statusAttention };
        return { status: 'Action Required', className: styles.statusRequired };
    };

    const complianceStatus = getComplianceStatus();

    const handleFileUpload = async (files) => {
        setUploading(true);
        setSelectedFiles(files);

        try {
            // Import your API service
            const { apiService } = await import('../../services/api');

            for (const file of files) {
                console.log('Uploading file:', file.name);
                const result = await apiService.uploadCertificateEnhancedFree(licenseNumber, file);
                console.log('Upload result:', result);
            }

            // Reload dashboard data to get updated information
            await loadDashboardData(licenseNumber);

            console.log('Dashboard refreshed after upload');

        } catch (error) {
            console.error('Upload failed:', error);
            setError('Failed to upload certificate. Please try again.');
        } finally {
            setUploading(false);
            setSelectedFiles([]);
        }
    };

    const handleExportAudit = async () => {
        try {
            const { apiService } = await import('../../services/api');
            const result = await apiService.generateAuditPresentation(licenseNumber, {
                format: 'pdf',
                style: 'professional'
            });
            console.log('Audit export:', result);
            // Handle download/export logic here
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const ProgressBar = ({ percentage, label, current, total, colorClass = styles.progressBlue }) => {
        return (
            <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>{label}</span>
                    <span className={styles.progressValue}>{current} / {total}</span>
                </div>
                <div className={styles.progressTrack}>
                    <div
                        className={`${styles.progressFill} ${colorClass}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    // Calculate average confidence for processing quality
    const calculateAverageConfidence = () => {
        if (!dashboardData.certificates || dashboardData.certificates.length === 0) return 0;
        const total = dashboardData.certificates.reduce((sum, cert) => sum + (cert.confidence || 0), 0);
        return (total / dashboardData.certificates.length) * 100;
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div>
                            <h1 className={styles.title}>CPE Compliance Dashboard</h1>
                            <div className={styles.cpeName}>{dashboardData.cpa.name}</div>
                            <div className={styles.licenseInfo}>
                                License: {dashboardData.cpa.license_number} • Expires: June 29, 2027
                            </div>
                        </div>
                        <div className={styles.headerStatus}>
                            <div className={`${styles.statusBadge} ${complianceStatus.className}`}>
                                {complianceStatus.status}
                            </div>
                            <div className={styles.hoursDisplay}>
                                <div className={styles.hoursNumber}>{dashboardData.compliance_summary.total_cpe_hours}</div>
                                <div className={styles.hoursLabel}>of 120 hours required</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compliance Overview */}
                <div className={styles.complianceGrid}>

                    {/* Main Progress */}
                    <div className={styles.progressSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Compliance Progress</h3>
                            <BarChart3 className={styles.sectionIcon} />
                        </div>

                        <div className={styles.progressList}>
                            <ProgressBar
                                percentage={(dashboardData.compliance_summary.total_cpe_hours / 120) * 100}
                                label="Total CPE Hours"
                                current={dashboardData.compliance_summary.total_cpe_hours}
                                total={120}
                                colorClass={styles.progressBlue}
                            />

                            <ProgressBar
                                percentage={(dashboardData.compliance_summary.total_ethics_hours / 4) * 100}
                                label="Ethics Hours"
                                current={dashboardData.compliance_summary.total_ethics_hours}
                                total={4}
                                colorClass={styles.progressGreen}
                            />

                            <div className={styles.annualRequirements}>
                                <h4 className={styles.annualTitle}>Annual Requirements (20 hours minimum per year)</h4>
                                <div className={styles.yearGrid}>
                                    <div className={styles.yearCard}>
                                        <div className={styles.yearHours}>0</div>
                                        <div className={styles.yearLabel}>Year 1</div>
                                        <div className={styles.yearStatus}>Incomplete</div>
                                    </div>
                                    <div className={styles.yearCard}>
                                        <div className={styles.yearHours}>0</div>
                                        <div className={styles.yearLabel}>Year 2</div>
                                        <div className={styles.yearStatus}>Incomplete</div>
                                    </div>
                                    <div className={styles.yearCard}>
                                        <div className={styles.yearHours}>0</div>
                                        <div className={styles.yearLabel}>Year 3</div>
                                        <div className={styles.yearStatus}>Incomplete</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className={styles.statusSidebar}>

                        {/* Upload Status */}
                        <div className={styles.statusCard}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>Upload Status</h3>
                                <Database className={styles.sectionIcon} />
                            </div>
                            <div className={styles.statusContent}>
                                <div className={styles.statusRow}>
                                    <span className={styles.statusLabel}>Free uploads remaining</span>
                                    <span className={styles.statusValue}>
                                        {dashboardData.upload_status.free_uploads_remaining} of 10
                                    </span>
                                </div>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={`${styles.progressFill} ${styles.progressGray}`}
                                        style={{ width: `${(dashboardData.upload_status.free_uploads_used / 10) * 100}%` }}
                                    ></div>
                                </div>
                                <div className={styles.statusNote}>
                                    Includes: AI analysis, secure storage, compliance tracking
                                </div>
                            </div>
                        </div>

                        {/* Processing Quality */}
                        <div className={styles.statusCard}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>Processing Quality</h3>
                                <Shield className={styles.sectionIcon} />
                            </div>
                            <div className={styles.statusContent}>
                                <div className={styles.statusRow}>
                                    <span className={styles.statusLabel}>AI Accuracy</span>
                                    <span className={styles.statusValue}>{Math.round(calculateAverageConfidence())}%</span>
                                </div>
                                <div className={styles.statusRow}>
                                    <span className={styles.statusLabel}>Documents Processed</span>
                                    <span className={styles.statusValue}>{dashboardData.compliance_summary.total_certificates}</span>
                                </div>
                                <div className={styles.statusNote}>
                                    Google Cloud Vision analysis with manual review capability
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Upload Section */}
                <div className={styles.uploadSection}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Upload CPE Certificates</h3>
                        <div className={styles.uploadNote}>
                            Supported formats: PDF, PNG, JPG • {dashboardData.upload_status.free_uploads_remaining} uploads remaining
                        </div>
                    </div>

                    {uploading ? (
                        <div className={styles.uploadProcessing}>
                            <div className={styles.spinner}></div>
                            <h4 className={styles.processingTitle}>Processing Certificate</h4>
                            <p className={styles.processingText}>
                                Analyzing document with AI and uploading to secure storage
                            </p>
                            <div className={styles.processingSteps}>
                                <div className={styles.processingStep}>
                                    <div className={`${styles.stepIndicator} ${styles.stepActive}`}></div>
                                    <span>AI Analysis</span>
                                </div>
                                <div className={styles.processingStep}>
                                    <div className={`${styles.stepIndicator} ${styles.stepActive}`}></div>
                                    <span>Secure Upload</span>
                                </div>
                                <div className={styles.processingStep}>
                                    <div className={styles.stepIndicator}></div>
                                    <span>Database Update</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={styles.uploadZone}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            <input
                                id="fileInput"
                                type="file"
                                multiple
                                accept=".pdf,.png,.jpg,.jpeg"
                                className={styles.fileInput}
                                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                            />
                            <div className={styles.uploadContent}>
                                <Upload className={styles.uploadIcon} />
                                <div className={styles.uploadText}>
                                    <h4 className={styles.uploadTitle}>Upload Certificate Documents</h4>
                                    <p className={styles.uploadDescription}>
                                        Drag and drop files here, or click to select files
                                    </p>
                                </div>
                                <button className={styles.uploadButton}>Select Files</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Certificates Table */}
                {dashboardData.certificates && dashboardData.certificates.length > 0 && (
                    <div className={styles.certificatesSection}>
                        <div className={styles.tableHeader}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>CPE Certificate Records ({dashboardData.certificates.length})</h3>
                                <button className={styles.exportButton} onClick={handleExportAudit}>
                                    <Download className={styles.buttonIcon} />
                                    Export for Audit
                                </button>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.certificatesTable}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th className={styles.tableHeader}>Course Information</th>
                                        <th className={styles.tableHeader}>Provider</th>
                                        <th className={styles.tableHeader}>CPE Credits</th>
                                        <th className={styles.tableHeader}>Completion Date</th>
                                        <th className={styles.tableHeader}>Status</th>
                                        <th className={styles.tableHeader}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={styles.tableBody}>
                                    {dashboardData.certificates.map((cert) => (
                                        <tr key={cert.id} className={styles.tableRow}>
                                            <td className={styles.tableCell}>
                                                <div>
                                                    <div className={styles.certTitle}>{cert.course_title}</div>
                                                    <div className={styles.certId}>ID: {cert.id}</div>
                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.providerName}>{cert.provider}</div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.creditValue}>{cert.cpe_credits}</div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.dateValue}>{cert.completion_date}</div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.statusContainer}>
                                                    <span className={styles.verifiedBadge}>Verified</span>
                                                    <span className={styles.confidenceText}>
                                                        {Math.round((cert.confidence || 0) * 100)}% confidence
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <button className={styles.actionButton}>
                                                    <Eye className={styles.actionIcon} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* No Certificates State */}
                {dashboardData.certificates && dashboardData.certificates.length === 0 && (
                    <div className={styles.emptyCertificates}>
                        <FileText className={styles.emptyIcon} />
                        <h3>No certificates uploaded yet</h3>
                        <p>Upload your first CPE certificate to start tracking your compliance progress.</p>
                    </div>
                )}

                {/* Professional Upgrade Notice */}
                {dashboardData.upload_status.free_uploads_remaining <= 3 && (
                    <div className={styles.upgradeNotice}>
                        <div className={styles.upgradeIcon}>
                            <CheckCircle className={styles.checkIcon} />
                        </div>
                        <div className={styles.upgradeContent}>
                            <h3 className={styles.upgradeTitle}>Professional CPE Management</h3>
                            <p className={styles.upgradeDescription}>
                                You have {dashboardData.upload_status.free_uploads_remaining} remaining uploads with full functionality.
                                Continue with unlimited professional management for $58/year.
                            </p>
                            <div className={styles.upgradeFeatures}>
                                <span>✓ Unlimited certificate uploads</span>
                                <span>✓ Advanced reporting features</span>
                                <span>✓ Priority customer support</span>
                                <span>✓ Enhanced audit tools</span>
                            </div>
                            <div className={styles.upgradeAction}>
                                <button className={styles.upgradeButton}>
                                    Upgrade to Professional
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProfessionalCPEDashboard;