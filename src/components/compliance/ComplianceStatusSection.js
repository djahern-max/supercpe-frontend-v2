// src/components/compliance/ComplianceStatusSection.js
import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import styles from '../../styles/components/ComplianceStatusSection.module.css';

const ComplianceStatusSection = ({ complianceData, selectedPeriod }) => {
    if (!complianceData && !selectedPeriod) return null;

    // Extract data from API response or use defaults
    const {
        total_hours_found = 0,
        ethics_hours_found = 0,
        is_compliant = false,
        missing_hours = 0,
        annual_breakdown = []
    } = complianceData || {};

    // Get requirements from selected period
    const total_hours_required = selectedPeriod?.total_hours_required || 80;
    const ethics_hours_required = selectedPeriod?.ethics_hours_required || 4;

    // Calculate progress
    const progressPercentage = Math.min((total_hours_found / total_hours_required) * 100, 100);
    const ethicsProgressPercentage = Math.min((ethics_hours_found / ethics_hours_required) * 100, 100);

    // Determine badge variant based on compliance
    const getBadgeVariant = () => {
        if (is_compliant) return 'success';
        if (total_hours_found > 0) return 'warning';
        return 'critical';
    };

    const getBadgeText = () => {
        if (is_compliant) return 'ON TRACK';
        if (total_hours_found > 0) return 'NEEDS ATTENTION';
        return 'NEEDS ATTENTION';
    };

    // Get year breakdown from API or create default
    const getYearData = () => {
        if (annual_breakdown && annual_breakdown.length > 0) {
            return annual_breakdown.map((year, index) => ({
                year: index + 1,
                hours: year.hours_completed || 0,
                required: 20,
                compliant: (year.hours_completed || 0) >= 20
            }));
        }

        // Default for 2-year or 3-year period
        const yearCount = selectedPeriod?.duration_years || 2;
        return Array.from({ length: yearCount }, (_, index) => ({
            year: index + 1,
            hours: 0,
            required: 20,
            compliant: false
        }));
    };

    const yearData = getYearData();

    return (
        <Card className={styles.complianceStatusSection}>
            {/* Header with status badge */}
            <div className={styles.statusHeader}>
                <h3>Your CPE Compliance Status</h3>
                <Badge variant={getBadgeVariant()}>
                    {getBadgeText()}
                </Badge>
            </div>

            {/* Main compliance grid */}
            <div className={styles.complianceGrid}>
                {/* Total Hours Progress */}
                <div className={styles.progressCard}>
                    <div className={styles.progressHeader}>
                        <span className={styles.label}>Total CPE Hours</span>
                        <span className={styles.value}>
                            {total_hours_found} / {total_hours_required}
                        </span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className={styles.progressNote}>
                        {missing_hours > 0
                            ? `${missing_hours} hours remaining`
                            : 'Requirement met!'
                        }
                    </p>
                </div>

                {/* Ethics Hours Progress */}
                <div className={styles.progressCard}>
                    <div className={styles.progressHeader}>
                        <span className={styles.label}>Ethics Hours</span>
                        <span className={styles.value}>
                            {ethics_hours_found} / {ethics_hours_required}
                        </span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${ethicsProgressPercentage}%` }}
                        ></div>
                    </div>
                    <p className={styles.progressNote}>
                        {ethics_hours_required - ethics_hours_found > 0
                            ? `${ethics_hours_required - ethics_hours_found} ethics hours needed`
                            : 'Ethics requirement met!'
                        }
                    </p>
                </div>

                {/* Annual Requirements */}
                <div className={styles.annualRequirements}>
                    <h4>Annual Minimums (20 hours/year)</h4>
                    <div className={styles.yearGrid}>
                        {yearData.map((year) => (
                            <div key={year.year} className={styles.yearCard}>
                                <span className={styles.yearLabel}>Year {year.year}</span>
                                <span className={styles.yearValue}>
                                    {year.hours} / {year.required} hours
                                </span>
                                <Badge variant={year.compliant ? 'success' : 'warning'}>
                                    {year.compliant ? 'Met' : 'Incomplete'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Message */}
            <div className={styles.statusMessage}>
                <h4>Status: {is_compliant ? 'Compliant' : 'Needs Attention'}</h4>
                <p>
                    {is_compliant
                        ? `Great job! You've completed ${total_hours_found} of ${total_hours_required} required hours.`
                        : `You need ${missing_hours} more hours to meet your requirement.`
                    }
                </p>
            </div>
        </Card>
    );
};

export default ComplianceStatusSection;