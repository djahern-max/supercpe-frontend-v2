// src/components/compliance/ProfessionalCPEDashboard.js
import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, Clock, AlertTriangle, CheckCircle, Eye, Download, Shield, Database, Trash2 } from 'lucide-react';
import PeriodSelector from './PeriodSelector';
import styles from '../../styles/components/ProfessionalCPEDashboard.module.css';
import DeleteCertificateButton from './DeleteCertificateButton';
import EnhancedFreemiumUploadSection from './EnhancedFreemiumUploadSection';

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    // REAL STATE - NO MOCK DATA
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [periodAnalysis, setPeriodAnalysis] = useState(null);

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

    // Handle certificate deletion
    const handleCertificateDeleted = (deletedCertId) => {
        if (!dashboardData || !dashboardData.certificates) return;

        // Update the certificates in the dashboard data
        const updatedCertificates = dashboardData.certificates.filter(
            cert => cert.id !== deletedCertId
        );

        // Update dashboard data with the filtered certificates
        setDashboardData({
            ...dashboardData,
            certificates: updatedCertificates,
            compliance_summary: {
                ...dashboardData.compliance_summary,
                total_certificates: updatedCertificates.length
            }
        });

        // Recalculate totals if needed (could be more complex in real application)
        console.log(`Certificate ${deletedCertId} removed from UI`);
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

    // Handle period selection and analysis
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);

        // If switching to current period, clear period analysis to use original data
        if (period.is_current) {
            setPeriodAnalysis(null);
            console.log('Switched to current period - using original dashboard data');
        } else if (period.analysis) {
            console.log('Period analysis data:', period.analysis);
            setPeriodAnalysis(period.analysis);
        } else {
            // For non-current periods without analysis, set empty analysis
            setPeriodAnalysis({
                total_cpe_hours: 0,
                total_ethics_hours: 0,
                total_certificates: 0,
                certificates: []
            });
        }

        console.log('Period changed:', period);
    };

    // Calculate compliance status - use period analysis if available, otherwise dashboard data
    const getComplianceStatus = () => {
        const dataSource = displayData?.compliance_summary;
        if (!dataSource) return { status: 'Loading...', className: styles.statusRequired };

        const { total_cpe_hours } = dataSource;
        const requiredHours = selectedPeriod?.total_hours_required || 120;

        if (total_cpe_hours >= requiredHours) return { status: 'Compliant', className: styles.statusCompliant };
        if (total_cpe_hours >= requiredHours * 0.67) return { status: 'On Track', className: styles.statusOnTrack };
        if (total_cpe_hours >= requiredHours * 0.33) return { status: 'Needs Attention', className: styles.statusAttention };
        return { status: 'Action Required', className: styles.statusRequired };
    };

    // Get the data source for display (period analysis or dashboard data)
    // Get the data source for display (period analysis or dashboard data)
    const getDisplayData = () => {
        // If we have a selected period and it's NOT the current period, use period analysis
        if (selectedPeriod && !selectedPeriod.is_current && periodAnalysis) {
            return {
                compliance_summary: {
                    total_cpe_hours: periodAnalysis.total_cpe_hours || 0,
                    total_ethics_hours: periodAnalysis.total_ethics_hours || 0,
                    total_certificates: periodAnalysis.total_certificates || 0
                },
                certificates: periodAnalysis.certificates || []
            };
        }

        // For current period or when no period analysis, always use dashboard data
        return dashboardData;
    };

    const displayData = dashboardData ? getDisplayData() : null;
    const complianceStatus = displayData ? getComplianceStatus() : null;

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
            console.log('Generating audit export...');

            // For now, create a simple CSV export as a fallback
            const csvData = [
                ['Course Title', 'Provider', 'CPE Credits', 'Completion Date', 'Confidence', 'ID'],
                ...displayData.certificates.map(cert => [
                    cert.course_title,
                    cert.provider,
                    cert.cpe_credits,
                    cert.completion_date,
                    `${Math.round((cert.confidence || 0) * 100)}%`,
                    cert.id
                ])
            ];

            const csvContent = csvData.map(row =>
                row.map(field => `"${field}"`).join(',')
            ).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `CPE_Audit_Report_${dashboardData.cpa.license_number}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Audit export completed');

            // TODO: Replace with actual API call when backend endpoint is ready
            // const { apiService } = await import('../../services/api');
            // const result = await apiService.generateAuditPresentation(licenseNumber, {
            //     format: 'pdf',
            //     style: 'professional'
            // });

        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
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

    // Calculate hours by year for annual requirements
    const calculateYearlyHours = () => {
        const certificates = displayData?.certificates || [];
        const period = selectedPeriod;

        if (!period || certificates.length === 0) {
            return { year1: 0, year2: 0, year3: 0 };
        }

        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);

        // Define year boundaries
        const year1Start = new Date(startDate);
        const year1End = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate() - 1);
        const year2Start = new Date(year1End.getTime() + 24 * 60 * 60 * 1000); // Next day
        const year2End = new Date(startDate.getFullYear() + 2, startDate.getMonth(), startDate.getDate() - 1);
        const year3Start = new Date(year2End.getTime() + 24 * 60 * 60 * 1000); // Next day
        const year3End = new Date(endDate);

        let year1Hours = 0, year2Hours = 0, year3Hours = 0;

        certificates.forEach(cert => {
            const certDate = new Date(cert.completion_date);
            const hours = parseFloat(cert.cpe_credits) || 0;

            if (certDate >= year1Start && certDate <= year1End) {
                year1Hours += hours;
            } else if (certDate >= year2Start && certDate <= year2End) {
                year2Hours += hours;
            } else if (period.duration_years >= 3 && certDate >= year3Start && certDate <= year3End) {
                year3Hours += hours;
            }
        });

        return {
            year1: year1Hours,
            year2: year2Hours,
            year3: year3Hours
        };
    };

    // Calculate average confidence for processing quality
    const calculateAverageConfidence = () => {
        const certificates = displayData?.certificates || [];
        if (certificates.length === 0) return 0;
        const total = certificates.reduce((sum, cert) => sum + (cert.confidence || 0), 0);
        return (total / certificates.length) * 100;
    };

    const yearlyHours = displayData ? calculateYearlyHours() : { year1: 0, year2: 0, year3: 0 };

    // Helper function to get year status
    const getYearStatus = (hours) => {
        if (hours >= 20) return { text: 'Complete', className: styles.yearStatusComplete };
        if (hours > 0) return { text: 'In Progress', className: styles.yearStatusProgress };
        return { text: 'Incomplete', className: styles.yearStatusIncomplete };
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.container}>

                {/* Period Selector */}
                <PeriodSelector
                    licenseNumber={licenseNumber}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                />

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div>
                            <h1 className={styles.title}>CPE Compliance Dashboard</h1>
                            <div className={styles.cpeName}>{dashboardData.cpa.name}</div>
                            <div className={styles.licenseInfo}>
                                License: {dashboardData.cpa.license_number}
                                {selectedPeriod && (
                                    <span> • Tracking: {new Date(selectedPeriod.start_date).toLocaleDateString()} - {new Date(selectedPeriod.end_date).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                        <div className={styles.headerStatus}>
                            <div className={`${styles.statusBadge} ${complianceStatus.className}`}>
                                {complianceStatus.status}
                            </div>
                            <div className={styles.hoursDisplay}>
                                <div className={styles.hoursNumber}>
                                    {displayData?.compliance_summary?.total_cpe_hours || 0}
                                </div>
                                <div className={styles.hoursLabel}>
                                    of {selectedPeriod?.total_hours_required || 120} hours required
                                </div>
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
                                percentage={((displayData?.compliance_summary?.total_cpe_hours || 0) / (selectedPeriod?.total_hours_required || 120)) * 100}
                                label="Total CPE Hours"
                                current={displayData?.compliance_summary?.total_cpe_hours || 0}
                                total={selectedPeriod?.total_hours_required || 120}
                                colorClass={styles.progressBlue}
                            />

                            <ProgressBar
                                percentage={((displayData?.compliance_summary?.total_ethics_hours || 0) / (selectedPeriod?.ethics_hours_required || 4)) * 100}
                                label="Ethics Hours"
                                current={displayData?.compliance_summary?.total_ethics_hours || 0}
                                total={selectedPeriod?.ethics_hours_required || 4}
                                colorClass={styles.progressGreen}
                            />

                            <div className={styles.annualRequirements}>
                                <h4 className={styles.annualTitle}>Annual Requirements (20 hours minimum per year)</h4>
                                <div className={styles.yearGrid}>
                                    <div className={styles.yearCard}>
                                        <div className={styles.yearHours}>{yearlyHours.year1}</div>
                                        <div className={styles.yearLabel}>Year 1</div>
                                        <div className={`${styles.yearStatus} ${getYearStatus(yearlyHours.year1).className}`}>
                                            {getYearStatus(yearlyHours.year1).text}
                                        </div>
                                    </div>
                                    <div className={styles.yearCard}>
                                        <div className={styles.yearHours}>{yearlyHours.year2}</div>
                                        <div className={styles.yearLabel}>Year 2</div>
                                        <div className={`${styles.yearStatus} ${getYearStatus(yearlyHours.year2).className}`}>
                                            {getYearStatus(yearlyHours.year2).text}
                                        </div>
                                    </div>
                                    {selectedPeriod?.duration_years >= 3 && (
                                        <div className={styles.yearCard}>
                                            <div className={styles.yearHours}>{yearlyHours.year3}</div>
                                            <div className={styles.yearLabel}>Year 3</div>
                                            <div className={`${styles.yearStatus} ${getYearStatus(yearlyHours.year3).className}`}>
                                                {getYearStatus(yearlyHours.year3).text}
                                            </div>
                                        </div>
                                    )}
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
                                    <span className={styles.statusValue}>
                                        {displayData?.compliance_summary?.total_certificates || 0}
                                    </span>
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
                        <EnhancedFreemiumUploadSection
                            licenseNumber={licenseNumber}
                            onUploadSuccess={(uploadResult) => {
                                // Your existing refresh logic
                                loadDashboardData(licenseNumber);
                            }}
                        />


                    )}
                </div>

                {/* Certificates Table */}
                {displayData.certificates && displayData.certificates.length > 0 && (
                    <div className={styles.certificatesSection}>
                        <div className={styles.tableHeader}>
                            <div className={styles.sectionHeaderExport}>
                                <h3 className={styles.sectionTitle}>CPE Certificate Records ({displayData.certificates.length})</h3>
                                <button className={styles.exportButton} onClick={handleExportAudit}>
                                    <Download className={styles.buttonIcon} />
                                    Export
                                </button>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.certificatesTable}>

                                <tbody className={styles.tableBody}>
                                    {displayData.certificates.map((cert) => (
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
                                            <td className={`${styles.tableCell} ${styles.hideOnMobile}`}>
                                                <div className={styles.dateValue}>{cert.completion_date}</div>
                                            </td>
                                            <td className={`${styles.tableCell} ${styles.hideOnMobile}`}>
                                                <div className={styles.statusContainer}>
                                                    <span className={styles.verifiedBadge}>Verified</span>
                                                    <span className={styles.confidenceText}>
                                                        {Math.round((cert.confidence || 0) * 100)}% confidence
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.certificateActions}>
                                                    <button className={styles.actionButton}>
                                                        <Eye className={styles.actionIcon} />
                                                    </button>
                                                    <DeleteCertificateButton
                                                        certificateId={cert.id}
                                                        licenseNumber={licenseNumber}
                                                        certificateTitle={cert.course_title}
                                                        onDeleteSuccess={handleCertificateDeleted}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* No Certificates State */}
                {displayData?.certificates && displayData.certificates.length === 0 && (
                    <div className={styles.emptyCertificates}>
                        <FileText className={styles.emptyIcon} />
                        <h3>
                            {selectedPeriod?.is_current
                                ? "No certificates uploaded yet"
                                : "No certificates found for this period"
                            }
                        </h3>
                        <p>
                            {selectedPeriod?.is_current
                                ? "Upload your first CPE certificate to start tracking your compliance progress."
                                : "Upload certificates or select a different compliance period to view records."
                            }
                        </p>
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
                                Continue with unlimited professional management for $10/month.
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