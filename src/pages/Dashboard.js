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
            <Badge variant="primary">New 2-Year System</Badge> :
            <Badge variant="secondary">Legacy 3-Year System</Badge>;
    };

    const getStatusColor = (period) => {
        const today = new Date();
        const endDate = new Date(period.end_date);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return 'expired';
        if (daysRemaining < 180) return 'urgent';
        if (daysRemaining < 365) return 'upcoming';
        return 'current';
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loading-spinner"></div>
                <p>Loading your reporting periods...</p>
            </div>
        );
    }

    if (!cpa) {
        return (
            <div className={styles.error}>
                <h2>CPA Not Found</h2>
                <p>Please check your license number and try again.</p>
                <Link to="/">
                    <Button>Return Home</Button>
                </Link>
            </div>
        );
    }

    const isPreRuleChange = new Date(cpa.license_issue_date) < new Date('2023-02-22');

    return (
        <div className={styles.dashboard}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div>
                            <h1 className={styles.title}>{cpa.full_name}</h1>
                            <p className={styles.subtitle}>
                                License #{cpa.license_number} •
                                Licensed {formatDate(cpa.license_issue_date)} •
                                Expires {formatDate(cpa.license_expiration_date)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rule Explanation Based on License Date */}
                <Card className={styles.explanationCard}>
                    <div className="card-body">
                        <h2 className={styles.explanationTitle}>
                            📅 Your CPE Reporting Schedule Explained
                        </h2>

                        {isPreRuleChange ? (
                            <div className={styles.preRuleExplanation}>
                                <div className={styles.ruleStatus}>
                                    {getRuleSystemBadge('triennial')}
                                    <span className={styles.transitionNote}>→ Transitioning to 2-Year System</span>
                                </div>
                                <p className={styles.explanationText}>
                                    <strong>You were licensed before February 22, 2023</strong>, so you're transitioning
                                    from the old 3-year system to the new 2-year system. Your license still expires on
                                    <strong> June 30th</strong> (this doesn't change), but your CPE requirements have been
                                    adjusted for the transition.
                                </p>
                                <div className={styles.keyPoints}>
                                    <div className={styles.keyPoint}>
                                        ✅ <strong>Expiration Date:</strong> Still June 30th (unchanged)
                                    </div>
                                    <div className={styles.keyPoint}>
                                        🔄 <strong>CPE System:</strong> Transitioning to 80 hours every 2 years
                                    </div>
                                    <div className={styles.keyPoint}>
                                        📊 <strong>Your Schedule:</strong> Custom transition periods below
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.newRuleExplanation}>
                                <div className={styles.ruleStatus}>
                                    {getRuleSystemBadge('biennial')}
                                </div>
                                <p className={styles.explanationText}>
                                    <strong>You were licensed after February 22, 2023</strong>, so you're automatically
                                    on the new 2-year CPE system. Your license expires exactly 2 years from your
                                    issue date: <strong>{formatDate(cpa.license_expiration_date)}</strong>.
                                </p>
                                <div className={styles.keyPoints}>
                                    <div className={styles.keyPoint}>
                                        ✅ <strong>System:</strong> 80 CPE hours every 2 years
                                    </div>
                                    <div className={styles.keyPoint}>
                                        📅 <strong>Expiration:</strong> {formatDate(cpa.license_expiration_date)}
                                    </div>
                                    <div className={styles.keyPoint}>
                                        ⚡ <strong>Requirements:</strong> 4 ethics hours + 20 hour annual minimum
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Current Period */}
                {currentPeriod && (
                    <Card className={`${styles.currentPeriodCard} ${styles[getStatusColor(currentPeriod)]}`}>
                        <div className="card-header">
                            <h2 className="card-title">🎯 Your Current CPE Period</h2>
                            <div className={styles.periodBadge}>
                                <Badge variant="primary">Active Period</Badge>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className={styles.currentPeriodInfo}>
                                <div className={styles.periodDates}>
                                    <h3 className={styles.periodRange}>
                                        {formatDate(currentPeriod.start_date)} - {formatDate(currentPeriod.end_date)}
                                    </h3>
                                    <p className={styles.daysRemaining}>
                                        {calculateDaysRemaining(currentPeriod.end_date)} days remaining
                                    </p>
                                </div>

                                <div className={styles.requirementsGrid}>
                                    <div className={styles.requirementBox}>
                                        <div className={styles.requirementNumber}>
                                            {currentPeriod.hours_required}
                                        </div>
                                        <div className={styles.requirementLabel}>Total Hours</div>
                                    </div>
                                    <div className={styles.requirementBox}>
                                        <div className={styles.requirementNumber}>
                                            {currentPeriod.ethics_required}
                                        </div>
                                        <div className={styles.requirementLabel}>Ethics Hours</div>
                                    </div>
                                    <div className={styles.requirementBox}>
                                        <div className={styles.requirementNumber}>
                                            {currentPeriod.annual_minimum}
                                        </div>
                                        <div className={styles.requirementLabel}>Annual Minimum</div>
                                    </div>
                                </div>

                                <div className={styles.periodType}>
                                    <strong>Period Type:</strong> {currentPeriod.period_type}
                                    ({currentPeriod.rule_system === 'transition' ? 'Transition Period' : 'Standard Period'})
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* All Reporting Periods */}
                {reportingPeriods && reportingPeriods.periods && (
                    <Card className={styles.allPeriodsCard}>
                        <div className="card-header">
                            <h2 className="card-title">📋 All Your Reporting Periods</h2>
                            <p className="card-subtitle">
                                Complete schedule based on your {formatDate(cpa.license_issue_date)} license date
                            </p>
                        </div>

                        <div className="card-body">
                            <div className={styles.periodsTimeline}>
                                {reportingPeriods.periods.map((period, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.periodCard} ${styles[getStatusColor(period)]} ${period.is_current ? styles.active : ''}`}
                                    >
                                        <div className={styles.periodHeader}>
                                            <div className={styles.periodTitle}>
                                                Period {index + 1}
                                                {period.is_current && <Badge variant="success" size="sm">Current</Badge>}
                                                {getStatusColor(period) === 'expired' && <Badge variant="neutral" size="sm">Completed</Badge>}
                                            </div>
                                            <div className={styles.periodSystem}>
                                                {period.period_type} ({period.hours_required} hours)
                                            </div>
                                        </div>

                                        <div className={styles.periodDetails}>
                                            <div className={styles.periodDates}>
                                                <strong>{formatDate(period.start_date)} - {formatDate(period.end_date)}</strong>
                                            </div>
                                            <div className={styles.periodRequirements}>
                                                {period.hours_required} total • {period.ethics_required} ethics • {period.annual_minimum}/year minimum
                                            </div>
                                            {period.rule_system === 'transition' && (
                                                <div className={styles.transitionNote}>
                                                    ⚡ Transition period - adjusted requirements
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Professional Upgrade CTA */}
                <Card className={styles.upgradeCard}>
                    <div className="card-header">
                        <h2 className="card-title">🚀 Ready to Track Your Progress?</h2>
                    </div>

                    <div className="card-body">
                        <p className={styles.upgradeDescription}>
                            Now that you understand your reporting schedule, track your actual CPE progress
                            with certificate uploads, AI analysis, and automated compliance monitoring.
                        </p>

                        <div className={styles.upgradeFeatures}>
                            <div className={styles.upgradeFeature}>
                                📄 <strong>Upload & Analyze Certificates</strong> - Google AI extracts hours automatically
                            </div>
                            <div className={styles.upgradeFeature}>
                                💾 <strong>Secure Storage</strong> - All certificates organized and accessible
                            </div>
                            <div className={styles.upgradeFeature}>
                                📊 <strong>Progress Tracking</strong> - Real-time compliance monitoring
                            </div>
                        </div>

                        <Button
                            size="lg"
                            onClick={() => window.location.href = '/pricing'}
                            className={styles.upgradeButton}
                        >
                            Start Tracking Progress - $58/year
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;