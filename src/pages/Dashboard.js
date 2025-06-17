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
    const [compliance, setCompliance] = useState(null);
    const [cpeRecords, setCpeRecords] = useState([]);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [licenseNumber]);

    const loadDashboardData = async () => {
        try {
            const [cpaData, complianceData, subscriptionData] = await Promise.all([
                apiService.getCPA(licenseNumber),
                apiService.getCompliance(licenseNumber),
                apiService.getSubscriptionStatus(licenseNumber)
            ]);

            setCpa(cpaData);
            setCompliance(complianceData);
            setSubscriptionStatus(subscriptionData);

            // Load CPE records if user has subscription
            if (subscriptionData.has_active_subscription) {
                try {
                    const records = await apiService.getCPERecords(licenseNumber);
                    setCpeRecords(records);
                } catch (error) {
                    console.warn('Could not load CPE records');
                }
            }
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getComplianceStatusBadge = (status) => {
        switch (status) {
            case 'Compliant':
                return <Badge variant="success">Compliant</Badge>;
            case 'At Risk':
                return <Badge variant="warning">At Risk</Badge>;
            case 'Critical':
                return <Badge variant="error">Critical</Badge>;
            default:
                return <Badge variant="neutral">Unknown</Badge>;
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loading-spinner"></div>
                <p>Loading your dashboard...</p>
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

    const daysUntilRenewal = calculateDaysRemaining(cpa.license_expiration_date);

    return (
        <div className={styles.dashboard}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div>
                            <h1 className={styles.title}>{cpa.full_name}</h1>
                            <p className={styles.subtitle}>
                                CPA License #{cpa.license_number} •
                                Expires {formatDate(cpa.license_expiration_date)}
                                ({daysUntilRenewal} days remaining)
                            </p>
                        </div>
                        <div className={styles.headerActions}>
                            <Link to={`/upload/${licenseNumber}`}>
                                <Button size="lg">Upload CPE Certificate</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Compliance Overview */}
                {compliance && (
                    <Card className={styles.complianceCard}>
                        <div className="card-header">
                            <h2 className="card-title">Compliance Status</h2>
                            <div className={styles.statusBadge}>
                                {getComplianceStatusBadge(compliance.compliance?.overall_status)}
                            </div>
                        </div>

                        <div className="card-body">
                            <div className={styles.complianceGrid}>
                                <div className={styles.complianceItem}>
                                    <div className={styles.complianceNumber}>
                                        {compliance.progress?.total_hours}
                                    </div>
                                    <div className={styles.complianceLabel}>Total CPE Hours</div>
                                </div>

                                <div className={styles.complianceItem}>
                                    <div className={styles.complianceNumber}>
                                        {compliance.progress?.ethics_hours}
                                    </div>
                                    <div className={styles.complianceLabel}>Ethics Hours</div>
                                </div>

                                <div className={styles.complianceItem}>
                                    <div className={styles.complianceNumber}>
                                        {compliance.compliance?.days_until_renewal}
                                    </div>
                                    <div className={styles.complianceLabel}>Days Until Renewal</div>
                                </div>
                            </div>

                            {compliance.recommendations && compliance.recommendations.length > 0 && (
                                <div className={styles.recommendations}>
                                    <h3 className={styles.recommendationsTitle}>Recommendations</h3>
                                    <ul className={styles.recommendationsList}>
                                        {compliance.recommendations.slice(0, 3).map((rec, index) => (
                                            <li key={index} className={styles.recommendationItem}>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Subscription Status */}
                <Card className={styles.subscriptionCard}>
                    <div className="card-header">
                        <h2 className="card-title">Professional Features</h2>
                    </div>

                    <div className="card-body">
                        {subscriptionStatus?.has_active_subscription ? (
                            <div className={styles.activeSubscription}>
                                <div className={styles.subscriptionStatus}>
                                    <Badge variant="success">Professional Active</Badge>
                                    <span className={styles.expiryDate}>
                                        Expires {formatDate(subscriptionStatus.subscription?.expires_at)}
                                    </span>
                                </div>

                                <div className={styles.features}>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>✅</span>
                                        <span>AI-powered certificate analysis</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>✅</span>
                                        <span>Secure document storage</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>✅</span>
                                        <span>Advanced compliance reports</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.freeSubscription}>
                                <p className={styles.freeMessage}>
                                    You're using the free tier. Upgrade to Professional for complete CPE management.
                                </p>

                                <div className={styles.upgradeFeatures}>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>🤖</span>
                                        <span>AI certificate analysis (currently free to try!)</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>💾</span>
                                        <span>Permanent record storage</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>📊</span>
                                        <span>Professional compliance reports</span>
                                    </div>
                                </div>

                                <Link to="/pricing">
                                    <Button size="lg" className={styles.upgradeButton}>
                                        Upgrade to Professional - $58/year
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </Card>

                {/* CPE Records */}
                {subscriptionStatus?.has_active_subscription && (
                    <Card className={styles.recordsCard}>
                        <div className="card-header">
                            <h2 className="card-title">Your CPE Records</h2>
                            <p className="card-subtitle">
                                {cpeRecords.length} certificates stored securely
                            </p>
                        </div>

                        <div className="card-body">
                            {cpeRecords.length > 0 ? (
                                <div className={styles.recordsList}>
                                    {cpeRecords.map((record) => (
                                        <div key={record.id} className={styles.recordItem}>
                                            <div className={styles.recordInfo}>
                                                <h4 className={styles.recordTitle}>{record.course_title}</h4>
                                                <p className={styles.recordDetails}>
                                                    {record.provider_name} • {formatDate(record.completion_date)}
                                                </p>
                                            </div>
                                            <div className={styles.recordHours}>
                                                <span className={styles.hoursNumber}>{record.cpe_credits}</span>
                                                <span className={styles.hoursLabel}>hours</span>
                                                {record.is_ethics && (
                                                    <Badge variant="info" className={styles.ethicsBadge}>Ethics</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>📄</div>
                                    <h3>No CPE records yet</h3>
                                    <p>Upload your first certificate to get started with AI-powered analysis.</p>
                                    <Link to={`/upload/${licenseNumber}`}>
                                        <Button>Upload Certificate</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
