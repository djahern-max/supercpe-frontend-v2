// src/components/CertificateManager.js
// NEW: Replace CEBrokerDashboard.js with this simplified certificate manager

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { apiService } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import styles from '../styles/components/CertificateManager.module.css';

const CertificateManager = ({ licenseNumber, onRefresh }) => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('current');
    const [showQuickFix, setShowQuickFix] = useState(null);

    useEffect(() => {
        if (licenseNumber) {
            loadCertificates();
        }
    }, [licenseNumber, selectedPeriod]);

    const loadCertificates = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.getComplianceDashboard(licenseNumber);
            setCertificates(response.certificates || []);
        } catch (error) {
            console.error('Error loading certificates:', error);
            setError('Failed to load certificates');
            toast.error('Failed to load certificates');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCertificate = async (certificateId) => {
        if (!window.confirm('Are you sure you want to delete this certificate?')) {
            return;
        }

        try {
            await apiService.deleteCertificate(certificateId, licenseNumber);
            toast.success('Certificate deleted successfully');
            loadCertificates(); // Refresh the list
            if (onRefresh) onRefresh(); // Refresh parent dashboard
        } catch (error) {
            console.error('Error deleting certificate:', error);
            toast.error('Failed to delete certificate');
        }
    };

    const handleQuickFix = async (certificateId, fixedData) => {
        try {
            // Update the certificate with corrected data
            await apiService.updateCertificate(certificateId, fixedData);
            toast.success('Certificate updated successfully');
            setShowQuickFix(null);
            loadCertificates();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating certificate:', error);
            toast.error('Failed to update certificate');
        }
    };

    const exportToCSV = () => {
        const csvContent = generateCSV(certificates);
        downloadCSV(csvContent, `cpe-certificates-${licenseNumber}.csv`);
        toast.success('CSV exported successfully');
    };

    const generateCSV = (data) => {
        const headers = [
            'Course Title',
            'Provider',
            'CPE Credits',
            'Ethics Credits',
            'Completion Date',
            'Certificate Number',
            'Upload Date'
        ];

        const rows = data.map(cert => [
            cert.course_title || '',
            cert.provider_name || '',
            cert.cpe_credits || 0,
            cert.ethics_credits || 0,
            cert.completion_date || '',
            cert.certificate_number || '',
            cert.created_at ? formatDate(new Date(cert.created_at)) : ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate stats
    const stats = {
        total: certificates.length,
        complete: certificates.filter(cert =>
            cert.course_title &&
            cert.provider_name &&
            cert.cpe_credits > 0 &&
            cert.completion_date
        ).length,
        needsReview: certificates.filter(cert =>
            !cert.course_title ||
            !cert.provider_name ||
            cert.cpe_credits === 0 ||
            !cert.completion_date
        ).length,
        totalCredits: certificates.reduce((sum, cert) => sum + (cert.cpe_credits || 0), 0)
    };

    if (loading) {
        return (
            <Card className={styles.loadingCard}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading your certificates...</p>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={styles.errorCard}>
                <h3>Unable to Load Certificates</h3>
                <p>{error}</p>
                <Button onClick={loadCertificates} variant="primary">
                    Try Again
                </Button>
            </Card>
        );
    }

    return (
        <div className={styles.certificateManager}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h2>📚 Certificate Manager</h2>
                    <p>Manage and review your CPE certificates</p>
                </div>

                <div className={styles.headerActions}>
                    <Button
                        onClick={exportToCSV}
                        variant="outline"
                        disabled={certificates.length === 0}
                    >
                        📄 Export CSV
                    </Button>
                    <Button onClick={loadCertificates} variant="outline">
                        🔄 Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                <StatCard
                    icon="📚"
                    number={stats.total}
                    label="Total Certificates"
                    color="blue"
                />
                <StatCard
                    icon="✅"
                    number={stats.complete}
                    label="Complete Records"
                    color="green"
                />
                <StatCard
                    icon="⚠️"
                    number={stats.needsReview}
                    label="Need Review"
                    color="orange"
                />
                <StatCard
                    icon="⏰"
                    number={stats.totalCredits}
                    label="Total CPE Hours"
                    color="purple"
                />
            </div>

            {/* Period Selector */}
            <div className={styles.periodSelector}>
                <label>Reporting Period:</label>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className={styles.periodSelect}
                >
                    <option value="current">Current Period (Jun 2022 - Jun 2025)</option>
                    <option value="previous">Previous Period (Jun 2019 - Jun 2022)</option>
                    <option value="all">All Certificates</option>
                </select>
            </div>

            {/* Certificates List */}
            {certificates.length === 0 ? (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                        <h3>No Certificates Found</h3>
                        <p>Upload your first CPE certificate to get started.</p>
                    </div>
                </Card>
            ) : (
                <div className={styles.certificatesList}>
                    {certificates.map(certificate => (
                        <CertificateCard
                            key={certificate.id}
                            certificate={certificate}
                            onDelete={handleDeleteCertificate}
                            onQuickFix={(fixedData) => handleQuickFix(certificate.id, fixedData)}
                        />
                    ))}
                </div>
            )}

            {/* Export Instructions */}
            {certificates.length > 0 && (
                <Card className={styles.exportInstructions}>
                    <h4>📋 Ready for Compliance Reporting</h4>
                    <p>
                        You have <strong>{stats.complete} complete certificates</strong> ready for reporting.
                        Export to CSV and upload to your state board's compliance system or CE Broker.
                    </p>
                    <div className={styles.instructionActions}>
                        <Button onClick={exportToCSV} variant="primary">
                            📄 Download CSV for Reporting
                        </Button>
                        <Button variant="outline">
                            📖 View Reporting Guide
                        </Button>
                    </div>
                </Card>
            )}

            {/* Quick Fix Modal */}
            {showQuickFix && (
                <QuickFixModal
                    certificate={showQuickFix}
                    onSave={handleQuickFix}
                    onClose={() => setShowQuickFix(null)}
                />
            )}
        </div>
    );
};

// Certificate Card Component
const CertificateCard = ({ certificate, onDelete, onQuickFix }) => {
    const needsReview = (
        !certificate.course_title ||
        !certificate.provider_name ||
        certificate.cpe_credits === 0 ||
        !certificate.completion_date
    );

    const missingFields = [];
    if (!certificate.course_title) missingFields.push("title");
    if (!certificate.provider_name) missingFields.push("provider");
    if (certificate.cpe_credits === 0) missingFields.push("credits");
    if (!certificate.completion_date) missingFields.push("date");

    return (
        <Card className={`${styles.certificateCard} ${needsReview ? styles.needsReview : ''}`}>
            <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                    <h4>{certificate.course_title || "Course Title Needs Review"}</h4>
                    {certificate.ai_extracted && (
                        <Badge variant="info" size="sm">🤖 AI Extracted</Badge>
                    )}
                    {needsReview && (
                        <Badge variant="warning" size="sm">NEEDS REVIEW</Badge>
                    )}
                </div>
            </div>

            <div className={styles.cardContent}>
                <div className={styles.certificateDetails}>
                    <p><strong>Provider:</strong> {certificate.provider_name || "Not specified"}</p>
                    <p><strong>CPE Credits:</strong> {certificate.cpe_credits || 0}</p>
                    <p><strong>Ethics Credits:</strong> {certificate.ethics_credits || 0}</p>
                    <p><strong>Completion Date:</strong> {certificate.completion_date ? formatDate(new Date(certificate.completion_date)) : "Not specified"}</p>
                    {certificate.certificate_number && (
                        <p><strong>Certificate #:</strong> {certificate.certificate_number}</p>
                    )}
                </div>

                {needsReview && (
                    <div className={styles.missingFields}>
                        <strong>Missing:</strong> {missingFields.join(", ")}
                    </div>
                )}
            </div>

            <div className={styles.cardActions}>
                {needsReview ? (
                    <Button
                        onClick={() => onQuickFix(certificate)}
                        variant="primary"
                        size="sm"
                    >
                        🔧 Quick Fix
                    </Button>
                ) : (
                    <Button
                        onClick={() => onQuickFix(certificate)}
                        variant="outline"
                        size="sm"
                    >
                        ✏️ Edit
                    </Button>
                )}
                <Button
                    onClick={() => onDelete(certificate.id)}
                    variant="danger"
                    size="sm"
                >
                    🗑️ Delete
                </Button>
            </div>
        </Card>
    );
};

// Stat Card Component
const StatCard = ({ icon, number, label, color = "blue" }) => (
    <Card className={`${styles.statCard} ${styles[`stat-${color}`]}`}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statNumber}>{number}</div>
        <div className={styles.statLabel}>{label}</div>
    </Card>
);

// Quick Fix Modal Component
const QuickFixModal = ({ certificate, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        course_title: certificate.course_title || "",
        provider_name: certificate.provider_name || "",
        cpe_credits: certificate.cpe_credits || 0,
        ethics_credits: certificate.ethics_credits || 0,
        completion_date: certificate.completion_date || "",
        certificate_number: certificate.certificate_number || "",
    });

    const handleSave = () => {
        onSave(certificate.id, formData);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>🔧 Quick Fix Certificate</h3>
                    <Button onClick={onClose} variant="ghost" size="sm">✕</Button>
                </div>

                <div className={styles.modalContent}>
                    <p>Review and correct the certificate information:</p>

                    <div className={styles.formField}>
                        <label>Course Title *</label>
                        <input
                            type="text"
                            value={formData.course_title}
                            onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                            placeholder="Enter course title"
                        />
                    </div>

                    <div className={styles.formField}>
                        <label>Provider *</label>
                        <input
                            type="text"
                            value={formData.provider_name}
                            onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                            placeholder="Enter provider name"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formField}>
                            <label>CPE Credits *</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.cpe_credits}
                                onChange={(e) => setFormData({ ...formData, cpe_credits: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className={styles.formField}>
                            <label>Ethics Credits</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.ethics_credits}
                                onChange={(e) => setFormData({ ...formData, ethics_credits: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className={styles.formField}>
                        <label>Completion Date *</label>
                        <input
                            type="date"
                            value={formData.completion_date}
                            onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                        />
                    </div>

                    <div className={styles.formField}>
                        <label>Certificate Number</label>
                        <input
                            type="text"
                            value={formData.certificate_number}
                            onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                            placeholder="Certificate or course code"
                        />
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <Button onClick={handleSave} variant="primary">
                        ✅ Save Changes
                    </Button>
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CertificateManager;