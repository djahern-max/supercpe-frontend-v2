// src/components/CertificateManager.js - SIMPLE VERSION THAT ACTUALLY WORKS
import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
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

    useEffect(() => {
        if (licenseNumber) {
            loadCertificates();
        }
    }, [licenseNumber]);

    const loadCertificates = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔄 Loading certificates...');

            const response = await apiService.getComplianceDashboard(licenseNumber);
            console.log('📊 API Response:', response);

            // CRITICAL: Ensure we always have an array
            const certs = Array.isArray(response.certificates) ? response.certificates : [];
            setCertificates(certs);

            console.log(`📊 Loaded ${certs.length} certificates`);
        } catch (error) {
            console.error('Error loading certificates:', error);
            setError('Failed to load certificates');
            setCertificates([]); // CRITICAL: Set empty array on error
            toast.error('Failed to load certificates');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = async () => {
        try {
            // Simple CSV creation
            const headers = ['License', 'Course Title', 'Provider', 'CPE Credits', 'Ethics Credits', 'Completion Date'];
            const rows = certificates.map(cert => [
                licenseNumber,
                cert.course_title || '',
                cert.provider_name || '',
                cert.cpe_credits || 0,
                cert.ethics_credits || 0,
                cert.completion_date || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cpe-certificates-${licenseNumber}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('CSV exported successfully');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast.error('Failed to export CSV');
        }
    };

    if (loading) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #e5e7eb',
                        borderTop: '3px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p>Loading certificates...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <AlertTriangle size={32} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                    <h3>Unable to Load Certificates</h3>
                    <p>{error}</p>
                    <Button onClick={loadCertificates} variant="primary">
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    // CRITICAL: Double-check certificates is an array
    const safecertificates = Array.isArray(certificates) ? certificates : [];

    const stats = {
        total: safecertificates.length,
        complete: safecertificates.filter(cert =>
            cert.course_title && cert.provider_name && cert.cpe_credits > 0 && cert.completion_date
        ).length,
        totalCredits: safecertificates.reduce((sum, cert) => sum + (cert.cpe_credits || 0), 0)
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {/* Simple Header */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} />
                        <div>
                            <h3 style={{ margin: 0 }}>Certificate Manager</h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                                {stats.total} certificates • {stats.complete} complete • {stats.totalCredits} CPE hours
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button size="sm" variant="outline" onClick={exportToCSV} disabled={stats.total === 0}>
                            <Download size={14} />
                            Export
                        </Button>
                        <Button size="sm" variant="outline" onClick={loadCertificates}>
                            <RefreshCw size={14} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Certificates List */}
            {safecertificates.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <FileText size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                        <h3>No Certificates Found</h3>
                        <p style={{ color: '#6b7280' }}>Upload your first CPE certificate to get started.</p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {safecertificates.map((certificate, index) => (
                        <SimpleCertificateCard key={certificate.id || index} certificate={certificate} />
                    ))}
                </div>
            )}

            {/* Export Section */}
            {stats.complete > 0 && (
                <Card>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #ecfdf5 0%, white 100%)',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px'
                    }}>
                        <CheckCircle size={20} style={{ color: '#16a34a' }} />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.25rem 0', color: '#166534' }}>Ready for Reporting</h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
                                {stats.complete} complete certificates ready to export for compliance reporting.
                            </p>
                        </div>
                        <Button onClick={exportToCSV} variant="primary">
                            <Download size={14} />
                            Download CSV
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

// Simple Certificate Card
const SimpleCertificateCard = ({ certificate }) => {
    const needsReview = (
        !certificate.course_title ||
        !certificate.provider_name ||
        certificate.cpe_credits === 0 ||
        !certificate.completion_date
    );

    return (
        <Card>
            <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                            {certificate.course_title || "Course title missing"}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {needsReview ? (
                                <Badge variant="warning">Needs Review</Badge>
                            ) : (
                                <Badge variant="success">Complete</Badge>
                            )}
                            {certificate.ai_extracted && (
                                <Badge variant="info">AI Extracted</Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.75rem'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                            PROVIDER
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {certificate.provider_name || "Not specified"}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                            CPE CREDITS
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {certificate.cpe_credits || 0}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                            ETHICS CREDITS
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {certificate.ethics_credits || 0}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                            COMPLETION DATE
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {certificate.completion_date ? formatDate(new Date(certificate.completion_date)) : "Not specified"}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default CertificateManager;