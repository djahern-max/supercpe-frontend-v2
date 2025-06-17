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

const Dashboard = () => {
    const { licenseNumber } = useParams();
    const [cpa, setCpa] = useState(null);
    const [reportingPeriods, setReportingPeriods] = useState(null);
    const [currentPeriod, setCurrentPeriod] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [licenseNumber]);

    const loadDashboardData = async () => {
        try {
            // Load CPA data first
            const cpaData = await apiService.getCPA(licenseNumber);
            setCpa(cpaData);

            // Try to load reporting periods (may not be implemented yet)
            try {
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
                const mockCurrentPeriod = createMockCurrentPeriod(cpaData);
                setCurrentPeriod(mockCurrentPeriod);
            }
        } catch (error) {
            toast.error('Failed to load CPA information');
        } finally {
            setLoading(false);
        }
    };

    const createMockCurrentPeriod = (cpaData) => {
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

    if (!cpa) {
        return (
            <div className={styles.dashboard}>
                <div className="container">
                    <div className={styles.error}>
                        <h2>CPA License Not Found</h2>
                        <p>We couldn't find license number {licenseNumber} in our database.</p>
                        <Button
                            as={Link}
                            to="/"
                            variant="primary"
                        >
                            Search Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const timelineStatus = getTimelineStatus();
    const daysRemaining = currentPeriod ?
        Math.ceil((new Date(currentPeriod.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <div className={styles.dashboard}>
            <div className="container">
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{cpa.full_name}</h1>
                        <p className={styles.subtitle}>
                            License #{cpa.license_number} • Licensed {formatDate(cpa.license_issue_date)} • Expires {formatDate(cpa.license_expiration_date)}
                        </p>
                    </div>
                </header>

                {/* CPE Reporting Schedule Explanation */}
                <Card className={styles.explanationCard}>
                    <div className="card-header">
                        <div className={styles.explanationTitle}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', color: 'var(--primary-600)' }}>
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <path d="M12 17h.01" />
                            </svg>
                            Your CPE Reporting Schedule Explained
                        </div>
                    </div>
                    <div className="card-body">
                        <div className={styles.ruleStatus}>
                            <span>Legacy 3-Year System</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12l2 2 4-4" />
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            <span>Transitioning to 2-Year System</span>
                        </div>

                        <p className={styles.explanationText}>
                            <strong>You were licensed before February 22, 2023</strong>, so you're transitioning from the old 3-year system to the new 2-year
                            system. Your license still expires on <strong>June 30th</strong> (this doesn't change), but your CPE requirements have been adjusted
                            for the transition.
                        </p>

                        <div className={styles.keyPoints}>
                            <div className={styles.keyPoint}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12l2 2 4-4" />
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                <div>
                                    <strong>Expiration Date:</strong> Still June 30th (unchanged)
                                </div>
                            </div>
                            <div className={styles.keyPoint}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12l2 2 4-4" />
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                <div>
                                    <strong>CPE System:</strong> Transitioning to 80 hours every 2 years
                                </div>
                            </div>
                            <div className={styles.keyPoint}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12l2 2 4-4" />
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                <div>
                                    <strong>Your Schedule:</strong> Custom transition periods below
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Current Period Card */}
                {currentPeriod && (
                    <Card className={`${styles.currentPeriodCard} ${styles[timelineStatus]}`}>
                        <div className="card-header">
                            <div className={styles.periodBadge}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <h2 className="card-title">Current Reporting Period</h2>
                                {getRuleSystemBadge(currentPeriod.rule_system)}
                            </div>
                        </div>
                        <div className="card-body">
                            <div className={styles.currentPeriodInfo}>
                                <div className={styles.periodDates}>
                                    <h3 className={styles.periodRange}>
                                        {formatDate(currentPeriod.start_date)} - {formatDate(currentPeriod.end_date)}
                                    </h3>
                                    <p className={styles.daysRemaining}>
                                        {daysRemaining > 0 ?
                                            `${daysRemaining} days remaining` :
                                            'Period has expired'
                                        }
                                    </p>
                                </div>

                                <div className={styles.requirementsGrid}>
                                    <div className={styles.requirementBox}>
                                        <div className={styles.requirementNumber}>
                                            {currentPeriod.hours_required}
                                        </div>
                                        <div className={styles.requirementLabel}>
                                            Total Hours Required
                                        </div>
                                    </div>
                                    <div className={styles.requirementBox}>
                                        <div className={styles.requirementNumber}>
                                            {currentPeriod.ethics_required}
                                        </div>
                                        <div className={styles.requirementLabel}>
                                            Ethics Hours Required
                                        </div>
                                    </div>
                                    <div className={styles.requirementBox}>
                                        <div className={styles.requirementNumber}>
                                            {currentPeriod.annual_minimum}
                                        </div>
                                        <div className={styles.requirementLabel}>
                                            Annual Minimum
                                        </div>
                                    </div>
                                </div>

                                {currentPeriod.period_type === 'transition' && (
                                    <div className={styles.transitionNote}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                        This is a special transition period as NH moves from 3-year to 2-year renewal cycles.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* All Periods Card */}
                <Card className={styles.allPeriodsCard}>
                    <div className="card-header">
                        <div className={styles.periodBadge}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                            <h2 className="card-title">Your Complete CPE Schedule</h2>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className={styles.periodsContainer}>
                            {/* Mock periods - will be replaced with real data */}
                            <div className={styles.period}>
                                <div className={styles.periodHeader}>
                                    <div className={styles.periodInfo}>
                                        <h4 className={styles.periodTitle}>Current Period (Transition)</h4>
                                        <div className={styles.periodStatus}>Active</div>
                                    </div>
                                    <Badge variant="warning">Transitioning</Badge>
                                </div>
                                <div className={styles.periodDetails}>
                                    <div className={styles.periodDates}>
                                        July 1, 2025 - June 29, 2027
                                    </div>
                                    <div className={styles.periodRequirements}>
                                        80 hours total • 4 hours ethics • 20 hours minimum per year
                                    </div>
                                </div>
                            </div>

                            <div className={styles.period}>
                                <div className={styles.periodHeader}>
                                    <div className={styles.periodInfo}>
                                        <h4 className={styles.periodTitle}>Next Period</h4>
                                        <div className={styles.periodStatus}>Future</div>
                                    </div>
                                    <Badge variant="info">Biennial System</Badge>
                                </div>
                                <div className={styles.periodDetails}>
                                    <div className={styles.periodDates}>
                                        June 30, 2027 - June 30, 2029
                                    </div>
                                    <div className={styles.periodRequirements}>
                                        80 hours total • 4 hours ethics • 20 hours minimum per year
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default Dashboard;