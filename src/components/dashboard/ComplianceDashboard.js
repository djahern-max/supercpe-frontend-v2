// src/components/dashboard/ComplianceDashboard.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { apiService } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import styles from '../../styles/components/ComplianceDashboard.module.css';

const ComplianceDashboard = ({ licenseNumber }) => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (licenseNumber) {
            loadEnhancedDashboard();
        }
    }, [licenseNumber]);

    const loadEnhancedDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Loading enhanced compliance dashboard...');

            // Try enhanced dashboard first, fallback to basic compliance
            let dashboardData;
            try {
                dashboardData = await apiService.getEnhancedCompliance(licenseNumber);
                console.log('Enhanced dashboard loaded:', dashboardData);
            } catch (enhancedError) {
                console.log('Enhanced dashboard failed, trying basic compliance:', enhancedError);
                // Fallback to basic compliance endpoint
                dashboardData = await apiService.getCompliance(licenseNumber);
                console.log('Basic compliance loaded:', dashboardData);

                // Transform basic response to expected format
                dashboardData = transformBasicToEnhanced(dashboardData);
            }

            setDashboard(dashboardData);

        } catch (error) {
            console.error('Failed to load compliance dashboard:', error);
            setError(error.message);
            toast.error('Failed to load compliance dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Transform basic compliance response to enhanced format
    const transformBasicToEnhanced = (basicResponse) => {
        // Handle the actual API response structure
        const cpaInfo = basicResponse.cpa_info || {};
        const periodInfo = basicResponse.period_info || {};

        return {
            cpa_info: {
                license_number: cpaInfo.license_number || licenseNumber,
                full_name: cpaInfo.full_name || 'Unknown CPA',
                license_issue_date: cpaInfo.license_issue_date,
                license_expiration_date: cpaInfo.license_expiration_date
            },
            period_info: {
                period_start: periodInfo.period_start,
                period_end: periodInfo.period_end,
                days_remaining: periodInfo.days_remaining || 0,
                hours_required: periodInfo.hours_required || 80,
                ethics_required: 4,
                annual_minimum: 20,
                rule_system: 'biennial'
            },
            progress: {
                total_hours_completed: 0,
                total_hours_required: periodInfo.hours_required || 80,
                ethics_hours_completed: 0,
                ethics_hours_required: 4,
                compliance_notes: [
                    'No CPE records found yet. Upload certificates to track progress.',
                    'This is a simplified compliance view. Enhanced features coming soon.'
                ]
            },
            personalized_summary: {
                urgency_level: periodInfo.days_remaining <= 90 ? 'high' : 'medium',
                summary: `You have ${periodInfo.days_remaining || 0} days remaining in your current reporting period. Upload your CPE certificates to track compliance progress.`,
                key_points: [
                    `Total requirement: ${periodInfo.hours_required || 80} hours over 2 years`,
                    'Ethics requirement: 4 hours minimum',
                    'Annual minimum: 20 hours per year',
                    'Upload certificates to track your progress'
                ]
            },
            action_items: [
                {
                    action: 'Upload CPE Certificates',
                    description: 'Upload your completed CPE certificates to track compliance progress',
                    urgency: 'medium',
                    deadline: periodInfo.period_end
                }
            ],
            important_dates: [
                {
                    date: periodInfo.period_end,
                    event: 'License Renewal Deadline',
                    description: 'Complete all CPE requirements by this date',
                    importance: 'High'
                }
            ]
        };
    };

    const getUrgencyVariant = (urgency) => {
        switch (urgency) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'info';
            default: return 'success';
        }
    };

    const getProgressPercentage = (completed, required) => {
        if (!required || required === 0) return 0;
        return Math.min(100, Math.round((completed / required) * 100));
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading your personalized compliance dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className={styles.errorCard}>
                <div className={styles.errorContent}>
                    <h3>Dashboard Unavailable</h3>
                    <p>{error}</p>
                    <Button onClick={loadEnhancedDashboard} variant="primary">
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    if (!dashboard) {
        return (
            <Card className={styles.noDataCard}>
                <div className={styles.noDataContent}>
                    <h3>No Compliance Data</h3>
                    <p>Unable to load compliance information for license {licenseNumber}</p>
                    <Button onClick={loadEnhancedDashboard} variant="primary">
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    // Safely extract data with fallbacks
    const cpaInfo = dashboard.cpa_info || {};
    const periodInfo = dashboard.period_info || {};
    const progress = dashboard.progress || {};
    const personalizedSummary = dashboard.personalized_summary || {};
    const actionItems = dashboard.action_items || [];
    const importantDates = dashboard.important_dates || [];

    return (
        <div className={styles.complianceDashboard}>
            {/* Header with CPA Information */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Professional Compliance Dashboard</h1>
                    <div className={styles.cpaInfo}>
                        <h2 className={styles.cpaName}>
                            {cpaInfo.full_name || 'Unknown CPA'}
                        </h2>
                        <p className={styles.licenseNumber}>
                            License: {cpaInfo.license_number || licenseNumber}
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <Card className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                    <h3>Your Current Compliance Status</h3>
                    <Badge variant={getUrgencyVariant(personalizedSummary.urgency_level || 'medium')}>
                        {(personalizedSummary.urgency_level || 'MEDIUM').toUpperCase()}
                    </Badge>
                </div>
                <div className={styles.summaryContent}>
                    <p className={styles.summaryText}>
                        {personalizedSummary.summary || 'Compliance information is being processed.'}
                    </p>
                    {personalizedSummary.key_points && personalizedSummary.key_points.length > 0 && (
                        <div className={styles.keyPoints}>
                            {personalizedSummary.key_points.map((point, index) => (
                                <div key={index} className={styles.keyPoint}>
                                    <span className={styles.bullet}>•</span>
                                    <span>{point}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Current Period Info */}
            <Card className={styles.periodCard}>
                <div className={styles.cardHeader}>
                    <h3>Current Reporting Period</h3>
                    <Badge variant="info">
                        {(periodInfo.rule_system || 'Biennial')} System
                    </Badge>
                </div>
                <div className={styles.periodDetails}>
                    <div className={styles.periodDates}>
                        <div className={styles.dateRange}>
                            <strong>
                                {periodInfo.period_start ? formatDate(periodInfo.period_start) : 'Start Date TBD'} - {periodInfo.period_end ? formatDate(periodInfo.period_end) : 'End Date TBD'}
                            </strong>
                        </div>
                        <div className={styles.daysRemaining}>
                            {periodInfo.days_remaining > 0 ? (
                                <span className={periodInfo.days_remaining <= 90 ? styles.urgent : styles.normal}>
                                    {periodInfo.days_remaining} days remaining
                                </span>
                            ) : (
                                <span className={styles.expired}>Period expired</span>
                            )}
                        </div>
                    </div>
                    <div className={styles.requirements}>
                        <div className={styles.requirement}>
                            <span className={styles.label}>Total Hours:</span>
                            <span className={styles.value}>{periodInfo.hours_required || 80}</span>
                        </div>
                        <div className={styles.requirement}>
                            <span className={styles.label}>Ethics Required:</span>
                            <span className={styles.value}>{periodInfo.ethics_required || 4} hours</span>
                        </div>
                        <div className={styles.requirement}>
                            <span className={styles.label}>Annual Minimum:</span>
                            <span className={styles.value}>{periodInfo.annual_minimum || 20} hours/year</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Progress Tracking */}
            <Card className={styles.progressCard}>
                <div className={styles.cardHeader}>
                    <h3>CPE Progress</h3>
                </div>
                <div className={styles.progressContent}>
                    <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                            <span className={styles.progressLabel}>Total CPE Hours</span>
                            <span className={styles.progressNumbers}>
                                {progress.total_hours_completed || 0} / {progress.total_hours_required || 80}
                            </span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${getProgressPercentage(progress.total_hours_completed || 0, progress.total_hours_required || 80)}%` }}
                            />
                        </div>
                    </div>

                    <div className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                            <span className={styles.progressLabel}>Ethics Hours</span>
                            <span className={styles.progressNumbers}>
                                {progress.ethics_hours_completed || 0} / {progress.ethics_hours_required || 4}
                            </span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${getProgressPercentage(progress.ethics_hours_completed || 0, progress.ethics_hours_required || 4)}%` }}
                            />
                        </div>
                    </div>

                    {progress.compliance_notes && progress.compliance_notes.length > 0 && (
                        <div className={styles.complianceNotes}>
                            <h4>Important Notes:</h4>
                            <ul>
                                {progress.compliance_notes.map((note, index) => (
                                    <li key={index}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Card>

            {/* Action Items */}
            {actionItems && actionItems.length > 0 && (
                <Card className={styles.actionItemsCard}>
                    <div className={styles.cardHeader}>
                        <h3>Recommended Actions</h3>
                    </div>
                    <div className={styles.actionItems}>
                        {actionItems.map((item, index) => (
                            <div key={index} className={styles.actionItem}>
                                <div className={styles.actionHeader}>
                                    <span className={styles.actionTitle}>{item.action}</span>
                                    <Badge variant={getUrgencyVariant(item.urgency)}>
                                        {item.urgency}
                                    </Badge>
                                </div>
                                <p className={styles.actionDescription}>{item.description}</p>
                                {item.deadline && (
                                    <div className={styles.actionDeadline}>
                                        <strong>Deadline:</strong> {formatDate(item.deadline)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Important Dates */}
            {importantDates && importantDates.length > 0 && (
                <Card className={styles.datesCard}>
                    <div className={styles.cardHeader}>
                        <h3>Important Dates</h3>
                    </div>
                    <div className={styles.importantDates}>
                        {importantDates.map((dateItem, index) => (
                            <div key={index} className={styles.dateItem}>
                                <div className={styles.dateHeader}>
                                    <span className={styles.dateEvent}>{dateItem.event}</span>
                                    <Badge variant={getUrgencyVariant(dateItem.importance ? dateItem.importance.toLowerCase() : 'medium')}>
                                        {dateItem.importance || 'Medium'}
                                    </Badge>
                                </div>
                                <div className={styles.dateDate}>
                                    {dateItem.date ? formatDate(dateItem.date) : 'Date TBD'}
                                </div>
                                <p className={styles.dateDescription}>{dateItem.description}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Footer with Refresh */}
            <div className={styles.footer}>
                <Button onClick={loadEnhancedDashboard} variant="outline">
                    Refresh Dashboard
                </Button>
                <small className={styles.lastUpdated}>
                    Dashboard data reflects current NH compliance requirements
                </small>
            </div>
        </div>
    );
};

export default ComplianceDashboard;