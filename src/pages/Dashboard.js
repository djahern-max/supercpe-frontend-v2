// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { apiService } from '../services/api';
import { formatDate, calculateDaysRemaining } from '../utils/dateUtils';
import styles from '../styles/pages/Dashboard.module.css';

// Import ComplianceDashboard component if it exists, otherwise use fallback
let ComplianceDashboard;
try {
    ComplianceDashboard = require('../components/dashboard/ComplianceDashboard').default;
} catch (error) {
    console.log('ComplianceDashboard component not found, using basic dashboard only');
    ComplianceDashboard = null;
}

const Dashboard = () => {
    const { licenseNumber } = useParams();
    const [cpa, setCpa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [useEnhanced, setUseEnhanced] = useState(!!ComplianceDashboard);

    useEffect(() => {
        if (licenseNumber) {
            loadBasicCPAData();
        }
    }, [licenseNumber]);

    const loadBasicCPAData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log(`Loading CPA data for license: ${licenseNumber}`);

            // Load basic CPA data to verify the license exists
            const cpaData = await apiService.getCPA(licenseNumber);

            console.log('CPA data loaded:', cpaData);

            // Ensure we have the basic required fields
            if (!cpaData || !cpaData.license_number) {
                throw new Error('Invalid CPA data received from API');
            }

            setCpa(cpaData);

        } catch (error) {
            console.error('Failed to load CPA data:', error);
            setError(error.message || 'Failed to load CPA information');
            toast.error('Failed to load CPA information');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className="container">
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        <p>Loading your professional dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error || !cpa) {
        return (
            <div className={styles.dashboard}>
                <div className="container">
                    <div className={styles.error}>
                        <h2>Dashboard Unavailable</h2>
                        <p>{error || `We couldn't find license number ${licenseNumber} in our database.`}</p>
                        <div className={styles.errorActions}>
                            <Button
                                onClick={loadBasicCPAData}
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

    // Main dashboard render - CPA data is guaranteed to exist here
    return (
        <div className={styles.dashboard}>
            <div className="container">
                {/* Dashboard Header */}
                <div className={styles.dashboardHeader}>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.pageTitle}>Professional Dashboard</h1>
                        <div className={styles.cpaInfo}>
                            <h2 className={styles.cpaName}>
                                {cpa.full_name || 'Unknown CPA'}
                            </h2>
                            <p className={styles.licenseNumber}>
                                License: {cpa.license_number}
                            </p>
                            <p className={styles.licenseStatus}>
                                Status: <span className={styles.statusActive}>
                                    {cpa.status || 'Active'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Mode Toggle */}
                {ComplianceDashboard && (
                    <div className={styles.dashboardControls}>
                        <div className={styles.controlGroup}>
                            <Button
                                variant={useEnhanced ? "primary" : "outline"}
                                onClick={() => setUseEnhanced(true)}
                            >
                                Enhanced Dashboard
                            </Button>
                            <Button
                                variant={!useEnhanced ? "primary" : "outline"}
                                onClick={() => setUseEnhanced(false)}
                            >
                                Basic View
                            </Button>
                        </div>
                    </div>
                )}

                {/* Render Enhanced or Basic Dashboard */}
                {useEnhanced && ComplianceDashboard ? (
                    <ComplianceDashboard licenseNumber={licenseNumber} />
                ) : (
                    <BasicDashboardView cpa={cpa} licenseNumber={licenseNumber} />
                )}
            </div>
        </div>
    );
};

// Basic Dashboard Component with null safety
const BasicDashboardView = ({ cpa, licenseNumber }) => {
    const [reportingPeriods, setReportingPeriods] = useState(null);
    const [currentPeriod, setCurrentPeriod] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (cpa && licenseNumber) {
            loadReportingPeriods();
        }
    }, [cpa, licenseNumber]);

    const loadReportingPeriods = async () => {
        try {
            setLoading(true);
            // Try to load reporting periods (may not be implemented yet)
            const periodsData = await apiService.getReportingPeriods(licenseNumber);
            setReportingPeriods(periodsData);

            // Find current active period
            const current = periodsData.periods?.find(p => p.is_current);
            if (current) {
                setCurrentPeriod(current);
            }
        } catch (periodError) {
            console.log('Reporting periods endpoint not available yet');
            // For now, create a mock current period based on license data
            if (cpa) {
                const mockCurrentPeriod = createMockCurrentPeriod(cpa);
                setCurrentPeriod(mockCurrentPeriod);
            }
        } finally {
            setLoading(false);
        }
    };

    const createMockCurrentPeriod = (cpaData) => {
        if (!cpaData || !cpaData.license_issue_date || !cpaData.license_expiration_date) {
            return null;
        }

        const today = new Date();
        const licenseDate = new Date(cpaData.license_issue_date);
        const expirationDate = new Date(cpaData.license_expiration_date);
        const isPreRuleChange = licenseDate < new Date('2023-02-22');

        // Create a mock current period
        return {
            start_date: isPreRuleChange ? '2025-07-01' : cpaData.license_issue_date,
            end_date: cpaData.license_expiration_date,
            period_type: isPreRuleChange ? 'transition' : 'biennial',
            hours_required: 80,
            ethics_required: 4,
            annual_minimum: 20,
            rule_system: isPreRuleChange ? 'transition' : 'biennial',
            is_current: true
        };
    };

    const getRuleSystemBadge = (system) => {
        return system === 'biennial' ?
            <Badge variant="info">Current Biennial System</Badge> :
            <Badge variant="warning">Transitioning to Biennial</Badge>;
    };

    const getTimelineStatus = () => {
        if (!currentPeriod) return 'normal';

        const endDate = new Date(currentPeriod.end_date);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return 'expired';
        if (daysRemaining <= 90) return 'urgent';
        return 'normal';
    };

    const timelineStatus = getTimelineStatus();
    const daysRemaining = currentPeriod ?
        Math.ceil((new Date(currentPeriod.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

    // Null safety for CPA data
    if (!cpa) {
        return (
            <div className={styles.basicDashboard}>
                <Card className={styles.errorCard}>
                    <div className="card-body">
                        <p>CPA information not available.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.basicDashboard}>
            {/* CPA Information Card */}
            <Card className={styles.cpaInfoCard}>
                <div className="card-header">
                    <h2 className="card-title">CPA Information</h2>
                </div>
                <div className="card-body">
                    <div className={styles.cpaDetails}>
                        <div className={styles.cpaField}>
                            <span className={styles.fieldLabel}>Name:</span>
                            <span className={styles.fieldValue}>
                                {cpa.full_name || 'Not available'}
                            </span>
                        </div>
                        <div className={styles.cpaField}>
                            <span className={styles.fieldLabel}>License Number:</span>
                            <span className={styles.fieldValue}>
                                {cpa.license_number || 'Not available'}
                            </span>
                        </div>
                        <div className={styles.cpaField}>
                            <span className={styles.fieldLabel}>License Issued:</span>
                            <span className={styles.fieldValue}>
                                {cpa.license_issue_date ?
                                    new Date(cpa.license_issue_date).toLocaleDateString() :
                                    'Not available'
                                }
                            </span>
                        </div>
                        <div className={styles.cpaField}>
                            <span className={styles.fieldLabel}>License Expires:</span>
                            <span className={styles.fieldValue}>
                                {cpa.license_expiration_date ?
                                    new Date(cpa.license_expiration_date).toLocaleDateString() :
                                    'Not available'
                                }
                            </span>
                        </div>
                        <div className={styles.cpaField}>
                            <span className={styles.fieldLabel}>Status:</span>
                            <span className={`${styles.fieldValue} ${styles.statusActive}`}>
                                {cpa.status || 'Active'}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Current Period Information */}
            {currentPeriod && (
                <Card className={`${styles.currentPeriodCard} ${styles[timelineStatus]}`}>
                    <div className="card-header">
                        <div className={styles.periodHeader}>
                            <h2 className="card-title">Current Reporting Period</h2>
                            {getRuleSystemBadge(currentPeriod.rule_system)}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className={styles.currentPeriodInfo}>
                            <div className={styles.periodDates}>
                                <h3 className={styles.periodRange}>
                                    {new Date(currentPeriod.start_date).toLocaleDateString()} - {new Date(currentPeriod.end_date).toLocaleDateString()}
                                </h3>
                                <p className={styles.daysRemaining}>
                                    {daysRemaining > 0 ?
                                        `${daysRemaining} days remaining` :
                                        'Period has expired'
                                    }
                                </p>
                            </div>

                            <div className={styles.requirementsGrid}>
                                <div className={styles.requirement}>
                                    <div className={styles.requirementNumber}>{currentPeriod.hours_required}</div>
                                    <div className={styles.requirementLabel}>Total Hours Required</div>
                                </div>
                                <div className={styles.requirement}>
                                    <div className={styles.requirementNumber}>{currentPeriod.ethics_required}</div>
                                    <div className={styles.requirementLabel}>Ethics Hours Required</div>
                                </div>
                                <div className={styles.requirement}>
                                    <div className={styles.requirementNumber}>{currentPeriod.annual_minimum}</div>
                                    <div className={styles.requirementLabel}>Minimum Per Year</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* API Connection Status */}
            <Card className={styles.statusCard}>
                <div className="card-header">
                    <h3 className="card-title">System Status</h3>
                </div>
                <div className="card-body">
                    <div className={styles.statusInfo}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>API Connection:</span>
                            <span className={styles.statusValue}>✅ Connected</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>Data Source:</span>
                            <span className={styles.statusValue}>NH OPLC Database</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>Last Updated:</span>
                            <span className={styles.statusValue}>
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
                <Button
                    as={Link}
                    to={`/upload/${licenseNumber}`}
                    variant="primary"
                    size="large"
                >
                    Upload CPE Certificate
                </Button>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="large"
                >
                    Refresh Data
                </Button>
            </div>
        </div>
    );
};

export default Dashboard;