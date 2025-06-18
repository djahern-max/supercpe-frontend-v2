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

// Import ProfessionalCPEDashboard instead of ComplianceDashboard
let ProfessionalCPEDashboard;
try {
    ProfessionalCPEDashboard = require('../components/compliance/ProfessionalCPEDashboard').default;
} catch (error) {
    console.log('ProfessionalCPEDashboard component not found, using basic dashboard only');
    ProfessionalCPEDashboard = null;
}

const Dashboard = () => {
    const { licenseNumber } = useParams();
    const [cpa, setCpa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // FIX: Get initial state from localStorage or default to enhanced view
    const [useEnhanced, setUseEnhanced] = useState(() => {
        const saved = localStorage.getItem('dashboard_view_preference');
        return saved ? JSON.parse(saved) : true; // Default to enhanced (CPE Compliance)
    });

    // FIX: Save the toggle state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('dashboard_view_preference', JSON.stringify(useEnhanced));
    }, [useEnhanced]);

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
            if (!cpaData?.license_number) {
                throw new Error('Invalid CPA data received');
            }

            setCpa(cpaData);
        } catch (error) {
            console.error('Error loading CPA data:', error);
            setError(error.message || 'Failed to load CPA information');
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
                {ProfessionalCPEDashboard && (
                    <div className={styles.dashboardControls}>
                        <div className={styles.controlGroup}>
                            <Button
                                variant={!useEnhanced ? "primary" : "outline"}
                                onClick={() => setUseEnhanced(false)}
                                className={styles.controlButton}
                            >
                                Reporting Requirements
                            </Button>
                            <Button
                                variant={useEnhanced ? "primary" : "outline"}
                                onClick={() => setUseEnhanced(true)}
                                className={styles.controlButton}
                            >
                                CPE Compliance
                            </Button>
                        </div>
                    </div>
                )}

                {/* Render Enhanced or Basic Dashboard */}
                {useEnhanced && ProfessionalCPEDashboard ? (
                    <ProfessionalCPEDashboard licenseNumber={licenseNumber} />
                ) : (
                    <BasicDashboardView
                        cpa={cpa}
                        licenseNumber={licenseNumber}
                        onEnhanceToggle={() => setUseEnhanced(true)}
                    />
                )}
            </div>
        </div>
    );
};

// Fixed BasicDashboardView component
const BasicDashboardView = ({ cpa, licenseNumber, onEnhanceToggle }) => {
    if (!cpa) {
        return (
            <Card className={styles.errorCard}>
                <h3>CPA Not Found</h3>
                <p>License number {licenseNumber} not found in our database.</p>
            </Card>
        );
    }

    // Parse dates
    const issueDate = new Date(cpa.license_issue_date);
    const expirationDate = new Date(cpa.license_expiration_date);
    const ruleChangeDate = new Date('2023-02-22');
    const today = new Date();

    // Determine if licensed before rule change
    const wasLicensedBeforeRuleChange = issueDate <= ruleChangeDate;

    // Calculate current compliance period
    const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

    // Period start: 2 years before expiration + 1 day
    const periodStart = new Date(expirationDate);
    periodStart.setFullYear(periodStart.getFullYear() - 2);
    periodStart.setDate(periodStart.getDate() + 1);

    // Determine status
    const isExpiringSoon = daysRemaining <= 90;
    const isExpiringVerySoon = daysRemaining <= 30;

    return (
        <div className={styles.basicDashboard}>
            {/* CPA Name and Credentials at Top */}
            <div className={styles.cpaHeader}>
                <h1 className={styles.cpaName}>{cpa.full_name}</h1>
                <p className={styles.cpaCredentials}>
                    License: {cpa.license_number} • Renews: {formatDate(expirationDate)} • {daysRemaining} days remaining
                </p>
            </div>



            <Card className={styles.statusCard}>
                <div className={styles.statusHeader}>
                    <h3>Your License Status</h3>
                    {/* Badge removed - this is just license renewal info */}
                </div>

                <div className={styles.periodInfo}>
                    <div className={styles.periodDates}>
                        <div className={styles.dateItem}>
                            <span className={styles.label}>Current Period:</span>
                            <span className={styles.value}>
                                {formatDate(periodStart)} - {formatDate(expirationDate)}
                            </span>
                        </div>
                        <div className={styles.dateItem}>
                            <span className={styles.label}>Renewal Date:</span>
                            <span className={styles.value}>{formatDate(expirationDate)}</span>
                        </div>
                        <div className={styles.dateItem}>
                            <span className={styles.label}>Days Remaining:</span>
                            <span className={`${styles.value} ${isExpiringSoon ? styles.urgent : ''}`}>
                                {daysRemaining} days
                            </span>
                        </div>
                    </div>

                    {/* Add renewal reminder if needed */}
                    {isExpiringSoon && (
                        <div className={styles.renewalReminder}>
                            <p>💡 <strong>Renewal Reminder:</strong> Your license expires in {daysRemaining} days.
                                Remember to pay your renewal fee to the NH Board of Accountancy.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Rule Change Explanation */}
            <Card className={styles.ruleCard}>
                <h3>February 2023 Rule Changes - How They Affect You</h3>

                <div className={styles.yourSituation}>
                    <strong>Your Situation:</strong> {wasLicensedBeforeRuleChange
                        ? 'Existing CPA (licensed before February 2023)'
                        : 'New CPA (licensed after February 2023)'}
                </div>

                <div className={styles.changesGrid}>
                    <div className={styles.changesSection}>
                        <h4>✓ What Changed For You</h4>
                        <ul>
                            {wasLicensedBeforeRuleChange ? (
                                <>
                                    <li>Renewal cycle reduced from 3 years to 2 years</li>
                                    <li>Total CPE reduced from 120 hours to 80 hours</li>
                                    <li>June 30th renewal date maintained</li>
                                </>
                            ) : (
                                <>
                                    <li>Anniversary-based renewal dates (not June 30th)</li>
                                    <li>2-year renewal cycles from the start</li>
                                    <li>80 hours total CPE requirement</li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className={styles.changesSection}>
                        <h4>→ What Stayed The Same</h4>
                        <ul>
                            <li>20 hours per year minimum requirement</li>
                            <li>4 hours ethics requirement per renewal period</li>
                            {wasLicensedBeforeRuleChange
                                ? <li>June 30th renewal date</li>
                                : <li>Anniversary renewal pattern</li>
                            }
                        </ul>
                    </div>
                </div>

                <div className={styles.explanation}>
                    <p>
                        {wasLicensedBeforeRuleChange
                            ? `As a CPA licensed in ${issueDate.getFullYear()} (before February 2023), you maintain June 30th renewal dates but are now on 2-year renewal cycles instead of the previous 3-year cycles.`
                            : `As a CPA licensed in ${issueDate.getFullYear()} (after February 2023), your renewal follows your license anniversary date with 2-year renewal cycles.`
                        }
                    </p>
                </div>
            </Card>


            {/* Key Facts */}
            <Card className={styles.factsCard}>
                <h3>Key Facts About New NH Rules</h3>
                <div className={styles.factsList}>
                    <div className={styles.fact}>
                        <strong>Renewal Cycle:</strong> All NH CPAs are now on 2-year renewal cycles (down from 3 years)
                    </div>
                    <div className={styles.fact}>
                        <strong>Total Hours:</strong> 80 CPE hours over 2 years (down from 120 over 3 years)
                    </div>
                    <div className={styles.fact}>
                        <strong>Your Renewal Date:</strong> {wasLicensedBeforeRuleChange
                            ? 'June 30th every 2 years'
                            : `${issueDate.toLocaleDateString('en-US', { month: 'long' })} every 2 years`}

                    </div>
                    <div className={styles.fact}>
                        <strong>Annual Minimum:</strong> 20 hours per year must still be completed
                    </div>
                    <div className={styles.fact}>
                        <strong>Ethics Requirement:</strong> 4 hours of ethics CPE per 2-year period
                    </div>
                </div>
            </Card>
            {/* Upload Action - Now uses the toggle function */}
            <div className={styles.uploadSection}>
                <Button
                    onClick={onEnhanceToggle}
                    variant="primary"
                    size="lg"
                >
                    Upload CPE Certificate
                </Button>
            </div>

        </div>
    );
};

export default Dashboard;