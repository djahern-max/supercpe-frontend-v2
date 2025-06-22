// src/components/ce-broker/CEBrokerDashboard.js

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertTriangle, Copy, ExternalLink, Edit } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';

const CEBrokerDashboard = ({ licenseNumber }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedRecords, setSelectedRecords] = useState([]);

    useEffect(() => {
        if (licenseNumber) {
            loadDashboard();
        }
    }, [licenseNumber]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await apiService.getCEBrokerDashboard(licenseNumber);
            setDashboardData(data);
        } catch (error) {
            console.error('Error loading CE Broker dashboard:', error);
            toast.error('Failed to load CE Broker dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format = 'json') => {
        try {
            setExporting(true);

            const exportData = await apiService.exportCEBrokerData(
                licenseNumber,
                format,
                { ready_only: true }
            );

            if (format === 'clipboard') {
                await navigator.clipboard.writeText(exportData.clipboard_text);
                toast.success('CE Broker data copied to clipboard!');
            } else if (format === 'csv') {
                // Download CSV file
                const blob = new Blob([exportData.csv_content], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = exportData.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('CSV file downloaded!');
            } else {
                // JSON format - show in modal or new window
                console.log('Export data:', exportData);
                toast.success('Export completed - check console for data');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export CE Broker data');
        } finally {
            setExporting(false);
        }
    };

    const handleMarkExported = async () => {
        if (selectedRecords.length === 0) {
            toast.error('Please select records to mark as exported');
            return;
        }

        try {
            await apiService.markCEBrokerExported(licenseNumber, selectedRecords);
            toast.success(`Marked ${selectedRecords.length} records as exported`);
            setSelectedRecords([]);
            await loadDashboard(); // Refresh data
        } catch (error) {
            console.error('Error marking exported:', error);
            toast.error('Failed to mark records as exported');
        }
    };

    const formatSubjectAreas = (areas) => {
        if (!areas || areas.length === 0) return 'Not specified';
        return areas.join(', ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <Card className="ce-broker-dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading CE Broker dashboard...</p>
                </div>
            </Card>
        );
    }

    if (!dashboardData) {
        return (
            <Card className="ce-broker-dashboard">
                <div className="error-state">
                    <AlertTriangle size={48} color="#dc2626" />
                    <h3>Unable to Load Dashboard</h3>
                    <p>Please try refreshing the page.</p>
                    <Button onClick={loadDashboard}>Retry</Button>
                </div>
            </Card>
        );
    }

    const { cpa, summary, ready_records, needs_review, export_available } = dashboardData;

    return (
        <div className="ce-broker-dashboard">
            {/* Header */}
            <Card className="dashboard-header">
                <div className="header-content">
                    <div className="cpa-info">
                        <h2>CE Broker Export Dashboard</h2>
                        <p><strong>{cpa.name}</strong> - License #{cpa.license_number}</p>
                        <p>License Expires: {formatDate(cpa.expiration_date)}</p>
                    </div>
                    <div className="quick-actions">
                        <Button
                            variant="primary"
                            onClick={() => handleExport('clipboard')}
                            disabled={!export_available || exporting}
                            icon={<Copy size={16} />}
                        >
                            Copy to Clipboard
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleExport('csv')}
                            disabled={!export_available || exporting}
                            icon={<Download size={16} />}
                        >
                            Download CSV
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Summary Statistics */}
            <div className="summary-grid">
                <Card className="summary-card">
                    <div className="stat">
                        <div className="stat-value">{summary.total_certificates}</div>
                        <div className="stat-label">Total Certificates</div>
                    </div>
                </Card>

                <Card className="summary-card ready">
                    <div className="stat">
                        <div className="stat-value">{summary.ready_for_export}</div>
                        <div className="stat-label">Ready for Export</div>
                        <CheckCircle size={20} color="#16a34a" />
                    </div>
                </Card>

                <Card className="summary-card needs-review">
                    <div className="stat">
                        <div className="stat-value">{summary.needs_review}</div>
                        <div className="stat-label">Needs Review</div>
                        <AlertTriangle size={20} color="#f59e0b" />
                    </div>
                </Card>

                <Card className="summary-card">
                    <div className="stat">
                        <div className="stat-value">{summary.total_cpe_hours}</div>
                        <div className="stat-label">Total CPE Hours</div>
                    </div>
                </Card>
            </div>

            {/* Ready for Export Section */}
            {ready_records && ready_records.length > 0 && (
                <Card className="ready-section">
                    <div className="section-header">
                        <h3>
                            <CheckCircle size={20} color="#16a34a" />
                            Ready for CE Broker Export ({ready_records.length})
                        </h3>
                        <div className="export-actions">
                            <Button
                                variant="success"
                                onClick={() => window.open('https://cebroker.com', '_blank')}
                                icon={<ExternalLink size={16} />}
                            >
                                Open CE Broker
                            </Button>
                        </div>
                    </div>

                    <div className="records-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRecords(ready_records.map(r => r.certificate_id));
                                                } else {
                                                    setSelectedRecords([]);
                                                }
                                            }}
                                            checked={selectedRecords.length === ready_records.length}
                                        />
                                    </th>
                                    <th>Course Name</th>
                                    <th>Provider</th>
                                    <th>Date</th>
                                    <th>Hours</th>
                                    <th>Type</th>
                                    <th>Subject Areas</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ready_records.map((record) => (
                                    <tr key={record.certificate_id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRecords.includes(record.certificate_id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedRecords([...selectedRecords, record.certificate_id]);
                                                    } else {
                                                        setSelectedRecords(selectedRecords.filter(id => id !== record.certificate_id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <div className="course-name">
                                                {record.course_name}
                                                {record.course_code && (
                                                    <div className="course-code">{record.course_code}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{record.provider_name}</td>
                                        <td>{formatDate(record.completion_date)}</td>
                                        <td>
                                            <div className="hours">
                                                <div>{record.cpe_hours} CPE</div>
                                                {record.ethics_hours > 0 && (
                                                    <div className="ethics">{record.ethics_hours} Ethics</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="course-type">
                                                {record.course_type}
                                                <div className="delivery-method">{record.delivery_method}</div>
                                            </div>
                                        </td>
                                        <td>{formatSubjectAreas(record.subject_areas)}</td>
                                        <td>
                                            <Button
                                                size="small"
                                                variant="outline"
                                                onClick={() => copyRecordData(record)}
                                                icon={<Copy size={14} />}
                                            >
                                                Copy
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedRecords.length > 0 && (
                        <div className="bulk-actions">
                            <Button
                                onClick={handleMarkExported}
                                variant="outline"
                            >
                                Mark {selectedRecords.length} as Exported
                            </Button>
                        </div>
                    )}
                </Card>
            )}

            {/* Needs Review Section */}
            {needs_review && needs_review.length > 0 && (
                <Card className="needs-review-section">
                    <div className="section-header">
                        <h3>
                            <AlertTriangle size={20} color="#f59e0b" />
                            Needs Review ({needs_review.length})
                        </h3>
                    </div>

                    <div className="review-items">
                        {needs_review.map((record) => (
                            <div key={record.certificate_id} className="review-item">
                                <div className="review-content">
                                    <h4>{record.course_name || 'Untitled Course'}</h4>
                                    <p>Provider: {record.provider_name || 'Not specified'}</p>
                                    <p>Date: {formatDate(record.completion_date)}</p>

                                    <div className="missing-fields">
                                        <strong>Missing fields:</strong>
                                        {record.missing_fields && record.missing_fields.map(field => (
                                            <span key={field} className="missing-field">{field}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="review-actions">
                                    <Button
                                        size="small"
                                        onClick={() => editRecord(record.certificate_id)}
                                        icon={<Edit size={14} />}
                                    >
                                        Fix
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Instructions */}
            <Card className="instructions">
                <h3>How to Submit to CE Broker</h3>
                <ol>
                    <li>Click "Copy to Clipboard" above to copy your ready certificates</li>
                    <li>Open CE Broker in a new tab using the "Open CE Broker" button</li>
                    <li>Navigate to "Report CE" in CE Broker</li>
                    <li>Select "General CPE" (or appropriate category)</li>
                    <li>Paste the course information into each field</li>
                    <li>Submit each course individually</li>
                    <li>Return here and mark courses as "Exported" when complete</li>
                </ol>
            </Card>
        </div>
    );
};

// Helper functions
const copyRecordData = async (record) => {
    const text = `Course: ${record.course_name}
Provider: ${record.provider_name}
Date: ${record.completion_date}
Hours: ${record.cpe_hours}
Type: ${record.course_type}
Delivery: ${record.delivery_method}
Subjects: ${record.subject_areas?.join(', ') || 'N/A'}`;

    try {
        await navigator.clipboard.writeText(text);
        toast.success('Course data copied to clipboard!');
    } catch (error) {
        toast.error('Failed to copy to clipboard');
    }
};

const editRecord = (recordId) => {
    // TODO: Open edit modal for the record
    toast.info('Edit functionality coming soon!');
};

export default CEBrokerDashboard