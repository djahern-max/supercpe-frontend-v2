// src/components/compliance/ProfessionalCPEDashboard.js - Updated with Redesigned Upload Section
import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, Clock, AlertTriangle, CheckCircle, Eye, Download, Shield, Database, Trash2 } from 'lucide-react';
import PeriodSelector from './PeriodSelector';
import styles from '../../styles/components/ProfessionalCPEDashboard.module.css';
import DeleteCertificateButton from './DeleteCertificateButton';
import RedesignedUploadSection from './RedesignedUploadSection'; // Import new redesigned component
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    const { isAuthenticated, user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    const handleUploadSuccess = async (result) => {
        console.log('Upload successful:', result);
        toast.success('Certificate uploaded successfully!');

        // Reload dashboard data to reflect new upload
        await loadDashboardData(licenseNumber);
    };

    const handleDeleteSuccess = async () => {
        console.log('Certificate deleted successfully');
        toast.success('Certificate deleted successfully');

        // Reload dashboard data
        await loadDashboardData(licenseNumber);
    };

    const handlePeriodSelect = (period) => {
        setSelectedPeriod(period);
    };

    const handleAnalysisLoad = (analysis) => {
        setPeriodAnalysis(analysis);
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your compliance dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.error}>
                    <AlertTriangle className={styles.errorIcon} />
                    <h3>Unable to Load Dashboard</h3>
                    <p>{error}</p>
                    <button
                        onClick={() => loadDashboardData(licenseNumber)}
                        className={styles.retryButton}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!dashboardData) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.noData}>
                    <FileText className={styles.noDataIcon} />
                    <h3>No Data Available</h3>
                    <p>Unable to load compliance information for license {licenseNumber}</p>
                </div>
            </div>
        );
    }

    const {
        cpa,
        compliance_summary = {},
        certificates = [],
        upload_status = {}
    } = dashboardData;

    // Get CPA name - prefer from CPA data, fallback to user data if authenticated
    const cpaName = cpa?.name || (isAuthenticated && user?.name) || 'CPA Professional';

    return (
        <div className={styles.dashboard}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.cpaInfo}>
                    <h1>{cpaName}</h1>
                    <p>License: {licenseNumber}</p>
                    {isAuthenticated && user?.email && (
                        <p className={styles.userEmail}>
                            <Shield size={16} />
                            {user.email}
                        </p>
                    )}
                </div>

                <div className={styles.complianceOverview}>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{compliance_summary.total_cpe_hours || 0}</div>
                        <div className={styles.statLabel}>Total CPE Hours</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{compliance_summary.total_ethics_hours || 0}</div>
                        <div className={styles.statLabel}>Ethics Hours</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{compliance_summary.total_certificates || 0}</div>
                        <div className={styles.statLabel}>Certificates</div>
                    </div>
                </div>
            </div>
            {/* Period Selector - Now directly below upload */}
            <PeriodSelector
                licenseNumber={licenseNumber}
                onPeriodSelect={handlePeriodSelect}
                onAnalysisLoad={handleAnalysisLoad}
            />

            {/* Redesigned Upload Section */}
            <RedesignedUploadSection
                licenseNumber={licenseNumber}
                cpaName={cpaName}
                onUploadSuccess={handleUploadSuccess}
            />



            {/* Certificates Section */}
            <div className={styles.certificatesSection}>
                <h2>
                    <FileText className={styles.sectionIcon} />
                    Your CPE Certificates
                </h2>

                {certificates.length === 0 ? (
                    <div className={styles.noCertificates}>
                        <FileText className={styles.noCertificatesIcon} />
                        <h3>No Certificates Yet</h3>
                        <p>Upload your first CPE certificate to get started with compliance tracking.</p>
                    </div>
                ) : (
                    <div className={styles.certificatesList}>
                        {certificates.map((cert) => (
                            <div key={cert.id} className={styles.certificateCard}>
                                <div className={styles.certificateHeader}>
                                    <h4>{cert.course_title}</h4>
                                    <div className={styles.certificateActions}>
                                        <button
                                            onClick={() => apiService.viewDocument(cert.id, licenseNumber)}
                                            className={styles.viewButton}
                                            title="View Certificate"
                                        >
                                            <Eye size={16} />
                                        </button>

                                        {/* Only show delete for authenticated users who own the certificate */}
                                        {isAuthenticated && user?.id === cert.user_id && (
                                            <DeleteCertificateButton
                                                recordId={cert.id}
                                                licenseNumber={licenseNumber}
                                                onDeleteSuccess={handleDeleteSuccess}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className={styles.certificateDetails}>
                                    <div className={styles.certificateInfo}>
                                        <span><strong>Provider:</strong> {cert.provider_name || 'Not specified'}</span>
                                        <span><strong>Date:</strong> {cert.completion_date ? new Date(cert.completion_date).toLocaleDateString() : 'Not specified'}</span>
                                        <span><strong>CPE Hours:</strong> {cert.cpe_credits || 0}</span>
                                        <span><strong>Ethics Hours:</strong> {cert.ethics_credits || 0}</span>
                                    </div>

                                    <div className={styles.certificateMeta}>
                                        <div className={styles.processingBadge}>
                                            {cert.ai_extracted ? (
                                                <span className={styles.aiProcessed}>
                                                    <CheckCircle size={14} />
                                                    AI Processed
                                                </span>
                                            ) : (
                                                <span className={styles.manualEntry}>
                                                    <Clock size={14} />
                                                    Manual Entry
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.storageTier}>
                                            {cert.storage_tier === 'premium' ? (
                                                <span className={styles.premiumTier}>
                                                    <Database size={14} />
                                                    Premium
                                                </span>
                                            ) : (
                                                <span className={styles.freeTier}>
                                                    <Shield size={14} />
                                                    Free
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Period Analysis Results */}
            {periodAnalysis && (
                <div className={styles.periodSection}>
                    <h2>
                        <BarChart3 className={styles.sectionIcon} />
                        Period Analysis Results
                    </h2>
                    <div className={styles.periodAnalysis}>
                        <h3>Analysis for {selectedPeriod?.label}</h3>
                        <div className={styles.analysisContent}>
                            <pre>{JSON.stringify(periodAnalysis, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalCPEDashboard;