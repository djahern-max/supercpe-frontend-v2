// src/components/compliance/ProfessionalCPEDashboard.js
import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, Clock, AlertTriangle, CheckCircle, Eye, Download, Shield, Database } from 'lucide-react';
import styles from '../../styles/components/ProfessionalCPEDashboard.module.css';

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    // Mock data based on your actual API response
    const [dashboardData, setDashboardData] = useState({
        cpa: { license_number: '07308', name: 'Daniel Joseph Ahern' },
        compliance_summary: {
            total_cpe_hours: 26.0,
            total_ethics_hours: 0.0,
            total_certificates: 2,
            progress_percentage: 21.67
        },
        upload_status: {
            free_uploads_used: 2,
            free_uploads_remaining: 8,
            premium_uploads: 0,
            total_storage_used: 2
        },
        certificates: [
            {
                id: 2,
                course_title: 'Understanding the Economy',
                provider: 'MasterCPE® Professional Online',
                cpe_credits: 8.0,
                completion_date: '2025-06-06',
                storage_tier: 'free',
                confidence: 0.875
            },
            {
                id: 1,
                course_title: 'Dealing with Debt and Interest',
                provider: 'MasterCPE® Professional Online',
                cpe_credits: 18.0,
                completion_date: '2025-06-02',
                storage_tier: 'free',
                confidence: 0.875
            }
        ]
    });

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
            // Import your API service
            const { apiService } = await import('../../services/api');
            const response = await apiService.getComplianceDashboard(license);
            setDashboardData(response);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

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
                const result = await apiService.uploadCertificateEnhancedFree(licenseNumber, file);

                // Add the new certificate to dashboard data
                const newCertificate = {
                    id: result.compliance_tracking?.database_record_id || Date.now(),
                    course_title: result.parsing_result?.parsed_data?.course_title?.value || 'Unknown Course',
                    provider: result.parsing_result?.parsed_data?.provider?.value || 'Unknown Provider',
                    cpe_credits: result.compliance_tracking?.cpe_hours_added || 0,
                    completion_date: result.parsing_result?.parsed_data?.completion_date?.value || new Date().toISOString().split('T')[0],
                    storage_tier: 'free',
                    confidence: result.parsing_result?.confidence_score || 0
                };

                setDashboardData(prev => ({
                    ...prev,
                    compliance_summary: {
                        ...prev.compliance_summary,
                        total_cpe_hours: prev.compliance_summary.total_cpe_hours + newCertificate.cpe_credits,
                        total_certificates: prev.total_certificates + 1,
                        progress_percentage: ((prev.compliance_summary.total_cpe_hours + newCertificate.cpe_credits) / 120) * 100
                    },
                    upload_status: {
                        ...prev.upload_status,
                        free_uploads_used: result.free_tier_status?.uploads_used || prev.upload_status.free_uploads_used + 1,
                        free_uploads_remaining: result.free_tier_status?.remaining_uploads || prev.upload_status.free_uploads_remaining - 1,
                        total_storage_used: prev.upload_status.total_storage_used + 1
                    },
                    certificates: [newCertificate, ...prev.certificates]
                }));
            }

        } catch (error) {
            console.error('Upload failed:', error);
            // Handle error appropriately - maybe show a toast notification
        } finally {
            setUploading(false);
            setSelectedFiles([]);
        }
    };

    const handleExportAudit = () => {
        // TODO: Implement audit export functionality
        console.log('Exporting audit report...');
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
                                    <span className={styles.statusValue}>87.5%</span>
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
                            Supported formats: PDF, PNG, JPG
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
                <div className={styles.certificatesSection}>
                    <div className={styles.tableHeader}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>CPE Certificate Records</h3>
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
                                                    {Math.round(cert.confidence * 100)}% confidence
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