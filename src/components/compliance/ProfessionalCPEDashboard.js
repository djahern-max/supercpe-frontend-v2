// src/components/compliance/ProfessionalCPEDashboard.js
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { apiService } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import styles from '../../styles/pages/Dashboard.module.css'; // Use same styles as BasicDashboardView

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    const [cpa, setCpa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (licenseNumber) {
            loadCPAData();
        }
    }, [licenseNumber]);

    const loadCPAData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log(`Loading CPA data for license: ${licenseNumber}`);
            const cpaData = await apiService.getCPA(licenseNumber);
            console.log('CPA data loaded:', cpaData);

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
            <div className={styles.basicDashboard}>
                <div className="loading-spinner">Loading your CPE compliance dashboard...</div>
            </div>
        );
    }

    // Show error state
    if (error || !cpa) {
        return (
            <Card className={styles.errorCard}>
                <h3>Dashboard Unavailable</h3>
                <p>{error || `We couldn't find license number ${licenseNumber} in our database.`}</p>
                <Button onClick={loadCPAData} variant="primary">
                    Try Again
                </Button>
            </Card>
        );
    }

    // Parse dates - same logic as BasicDashboardView
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
            {/* CPA Name and Credentials at Top - Identical to BasicDashboardView */}
            <div className={styles.cpaHeader}>
                <h1 className={styles.cpaName}>{cpa.full_name}</h1>
                <p className={styles.cpaCredentials}>
                    License: {cpa.license_number} • Renews: {formatDate(expirationDate)} • {daysRemaining} days remaining
                </p>
            </div>



            {/* TODO: Add new CPE-specific cards here as you build them */}

        </div>
    );
};

export default ProfessionalCPEDashboard;