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


const BasicDashboardView = ({ cpa, licenseNumber }) => {
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

            {/* Upload Action - Simple */}
            <div className={styles.uploadSection}>
                <Button
                    as={Link}
                    to={`/upload/${licenseNumber}`}
                    variant="primary"
                    size="lg"
                >
                    Upload CPE Certificate
                </Button>
            </div>

            {/* Current Status Card */}
            <Card className={styles.statusCard}>
                <div className={styles.statusHeader}>
                    <h3>Your Current Compliance Status</h3>
                    <Badge variant={isExpiringVerySoon ? 'critical' : isExpiringSoon ? 'warning' : 'success'}>
                        {isExpiringVerySoon ? 'URGENT' : isExpiringSoon ? 'ACTION NEEDED' : 'ON TRACK'}
                    </Badge>
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

            {/* Requirements Card */}
            <Card className={styles.requirementsCard}>
                <h3>Your CPE Requirements (2-Year Period)</h3>

                <div className={styles.requirementsList}>
                    <div className={styles.requirement}>
                        <div className={styles.requirementHeader}>
                            <span className={styles.label}>Total CPE Hours</span>
                            <span className={styles.value}>0 / 80</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: '0%' }}></div>
                        </div>
                        <p className={styles.note}>80 hours required over 2 years</p>
                    </div>

                    <div className={styles.requirement}>
                        <div className={styles.requirementHeader}>
                            <span className={styles.label}>Ethics Hours</span>
                            <span className={styles.value}>0 / 4</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: '0%' }}></div>
                        </div>
                        <p className={styles.note}>4 hours required anytime during the 2-year period</p>
                    </div>

                    <div className={styles.requirement}>
                        <div className={styles.requirementHeader}>
                            <span className={styles.label}>Annual Minimum</span>
                            <span className={styles.value}>20 hours/year</span>
                        </div>
                        <p className={styles.note}>Must complete at least 20 hours each year</p>
                    </div>
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
        </div>
    );
};


export default Dashboard;