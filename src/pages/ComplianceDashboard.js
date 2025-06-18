// src/pages/ComplianceDashboard.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import PeriodSelector from '../components/compliance/PeriodSelector';
import FreemiumUploadSection from '../components/compliance/FreemiumUploadSection';
import ComplianceStatusSection from '../components/compliance/ComplianceStatusSection';
import UploadedCertificatesSection from '../components/compliance/UploadedCertificatesSection';
import { apiService } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import styles from '../styles/pages/ComplianceDashboard.module.css';

const ComplianceDashboard = () => {
    const { licenseNumber } = useParams();
    const [cpa, setCpa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadCount, setUploadCount] = useState(0);
    const [complianceData, setComplianceData] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    useEffect(() => {
        if (licenseNumber) {
            loadCPAData();
            loadComplianceData();
        }
    }, [licenseNumber]);

    const loadCPAData = async () => {
        try {
            setLoading(true);
            const cpaData = await apiService.getCPA(licenseNumber);
            setCpa(cpaData);
        } catch (error) {
            console.error('Failed to load CPA data:', error);
            setError(error.message || 'Failed to load CPA information');
            toast.error('Failed to load CPA information');
        } finally {
            setLoading(false);
        }
    };

    const loadComplianceData = async () => {
        try {
            // Try to get quick compliance status for the selected period
            if (selectedPeriod) {
                const compliance = await apiService.analyzeTimeWindow(licenseNumber, {
                    start_date: selectedPeriod.start_date,
                    end_date: selectedPeriod.end_date
                });
                setComplianceData(compliance);
            }
        } catch (error) {
            console.log('No compliance data yet - that\'s okay for new users');
        }
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        // Reload compliance data for the new period
        if (period) {
            loadComplianceDataForPeriod(period);
        }
    };

    const loadComplianceDataForPeriod = async (period) => {
        try {
            const compliance = await apiService.analyzeTimeWindow(licenseNumber, {
                start_date: period.start_date,
                end_date: period.end_date
            });
            setComplianceData(compliance);
        } catch (error) {
            console.log('No compliance data yet for this period');
            setComplianceData(null);
        }
    };

    const handleUploadSuccess = (uploadResult) => {
        setUploads(prev => [...prev, uploadResult]);
        setUploadCount(prev => prev + 1);

        // Refresh compliance data
        loadComplianceData();

        toast.success('Certificate analyzed successfully!');
    };

    // Show loading state
    if (loading) {
        return (
            <div className={styles.complianceDashboard}>
                <div className="container">
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        <p>Loading your compliance dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error || !cpa) {
        return (
            <div className={styles.complianceDashboard}>
                <div className="container">
                    <div className={styles.error}>
                        <h2>Dashboard Unavailable</h2>
                        <p>{error || `We couldn't find license number ${licenseNumber}.`}</p>
                        <div className={styles.errorActions}>
                            <Button
                                onClick={loadCPAData}
                                variant="primary"
                            >
                                Try Again
                            </Button>
                            <Button
                                as={Link}
                                to="/"
                                variant="outline"
                            >
                                Search Again
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.complianceDashboard}>
            <div className="container">
                {/* Header with navigation */}
                <div className={styles.complianceHeader}>
                    <div className={styles.breadcrumb}>
                        <Link to={`/dashboard/${licenseNumber}`} className={styles.backLink}>
                            ← Back to License Dashboard
                        </Link>
                    </div>

                    <div className={styles.headerContent}>
                        <h1>CPE Compliance Dashboard</h1>
                        <div className={styles.cpaInfo}>
                            <h2>{cpa.full_name}</h2>
                            <p>License: {cpa.license_number} • Expires: {formatDate(cpa.license_expiration_date)}</p>
                        </div>
                    </div>
                </div>

                {/* Main dashboard content */}
                <div className={styles.dashboardContent}>
                    {/* Period Selection - Critical for UX */}
                    <PeriodSelector
                        licenseNumber={licenseNumber}
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={handlePeriodChange}
                    />

                    {/* Freemium upload section */}
                    <FreemiumUploadSection
                        licenseNumber={licenseNumber}
                        uploadCount={uploadCount}
                        onUploadSuccess={handleUploadSuccess}
                        selectedPeriod={selectedPeriod}
                    />

                    {/* Compliance status - only show if we have data */}
                    {(complianceData || selectedPeriod) && (
                        <ComplianceStatusSection
                            complianceData={complianceData}
                            selectedPeriod={selectedPeriod}
                        />
                    )}

                    {/* Uploaded certificates list */}
                    {uploads.length > 0 && (
                        <UploadedCertificatesSection
                            uploads={uploads}
                        />
                    )}

                </div>
            </div>
        </div>
    );
};

export default ComplianceDashboard;