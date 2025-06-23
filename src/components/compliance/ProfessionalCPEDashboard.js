// src/components/compliance/ProfessionalCPEDashboard.js - Enhanced with CE Broker
import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, FileText, Download, Copy, Edit3, AlertCircle, RefreshCw, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SubscriptionModal from './SubscriptionModal';
import { apiService } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';
import styles from '../../styles/components/ProfessionalCPEDashboard.module.css';

const ProfessionalCPEDashboard = ({ licenseNumber }) => {
    // Existing state management
    const [cpa, setCpa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExtendedOffer, setShowExtendedOffer] = useState(false);

    // NEW: CE Broker state
    const [ceBrokerData, setCeBrokerData] = useState(null);
    const [ceBrokerLoading, setCeBrokerLoading] = useState(false);
    const [showCEBrokerSection, setShowCEBrokerSection] = useState(false);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [ceOptions, setCeOptions] = useState(null);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    const MAX_FREE_UPLOADS = 30;

    // Existing effects and functions remain the same...
    useEffect(() => {
        if (licenseNumber) {
            loadCPAData();
            loadUploadCount();
            loadCEBrokerOptions();
            loadAvailablePeriods();
        }
    }, [licenseNumber]);

    // Load CE Broker data when upload is successful or period changes
    useEffect(() => {
        if (uploadStatus && uploadStatus.total_uploads_used > 0) {
            setShowCEBrokerSection(true);
        }
    }, [uploadStatus]);

    useEffect(() => {
        if (selectedPeriod && showCEBrokerSection) {
            loadCEBrokerDashboard();
        }
    }, [selectedPeriod, showCEBrokerSection]);

    // ALL YOUR EXISTING FUNCTIONS STAY THE SAME
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

    const loadUploadCount = async () => {
        try {
            console.log('📊 Loading upload status...');
            const status = await apiService.getUserUploadStatus(licenseNumber);
            console.log('📈 Upload status loaded:', status);
            setUploadStatus(status);

            if (status.needs_extended_offer &&
                !status.accepted_extended_trial &&
                status.upload_phase !== 'extended') {
                setShowExtendedOffer(true);
            } else {
                setShowExtendedOffer(false);
            }
        } catch (error) {
            console.error('Error loading upload status:', error);
            if (error.response?.status === 401) {
                console.log('User not authenticated, falling back to free-tier-status');
                try {
                    const fallbackStatus = await apiService.getFreeTierStatus(licenseNumber);
                    setUploadStatus(fallbackStatus);
                    setShowExtendedOffer(false);
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    setUploadStatus({
                        total_uploads_used: 0,
                        upload_phase: 'initial',
                        at_limit: false,
                        needs_extended_offer: false
                    });
                    setShowExtendedOffer(false);
                }
            } else {
                setUploadStatus({
                    total_uploads_used: 0,
                    upload_phase: 'initial',
                    at_limit: false,
                    needs_extended_offer: false
                });
                setShowExtendedOffer(false);
            }
        }
    };

    // NEW: Load available periods
    const loadAvailablePeriods = async () => {
        try {
            const response = await fetch(`/api/time-windows/${licenseNumber}/available`);
            if (response.ok) {
                const data = await response.json();
                const periods = data.available_windows || [];

                const formattedPeriods = periods.map((window) => ({
                    id: `${window.start_date}-${window.end_date}`,
                    start_date: window.start_date,
                    end_date: window.end_date,
                    label: formatPeriodLabel(window.start_date, window.end_date),
                    is_current: window.is_current,
                    hours_required: window.hours_required || 80,
                    ethics_required: window.ethics_required || 4
                }));

                setAvailablePeriods(formattedPeriods);

                // Set current period as default
                const currentPeriod = formattedPeriods.find(p => p.is_current);
                if (currentPeriod) {
                    setSelectedPeriod(currentPeriod);
                }
            }
        } catch (error) {
            console.error('Error loading periods:', error);
        }
    };

    const formatPeriodLabel = (startDate, endDate) => {
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return `${start} - ${end}`;
    };
    // NEW: CE Broker functions with period filtering
    const loadCEBrokerDashboard = async () => {
        try {
            setCeBrokerLoading(true);

            // Add period filtering to the API call
            const params = new URLSearchParams();
            if (selectedPeriod) {
                params.append('date_from', selectedPeriod.start_date);
                params.append('date_to', selectedPeriod.end_date);
            }

            const url = `/api/ce-broker/dashboard/${licenseNumber}${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCeBrokerData(data);
            }
        } catch (error) {
            console.error('Error loading CE Broker dashboard:', error);
        } finally {
            setCeBrokerLoading(false);
        }
    };

    const loadCEBrokerOptions = async () => {
        try {
            const options = await apiService.getCEBrokerOptions();
            setCeOptions(options);
        } catch (error) {
            console.error('Error loading CE Broker options:', error);
        }
    };

    const handleCEBrokerExport = async (format = 'clipboard') => {
        try {
            const options = { ready_only: true };
            if (selectedPeriod) {
                options.date_from = selectedPeriod.start_date;
                options.date_to = selectedPeriod.end_date;
            }

            const exportData = await apiService.exportCEBrokerData(
                licenseNumber,
                format,
                options
            );

            if (format === 'clipboard' && exportData.clipboard_text) {
                await navigator.clipboard.writeText(exportData.clipboard_text);
                toast.success('CE Broker data copied to clipboard! Paste into CE Broker website.');
            } else if (format === 'csv' && exportData.csv_content) {
                const blob = new Blob([exportData.csv_content], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = exportData.filename || 'ce_broker_export.csv';
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('CSV file downloaded!');
            }
        } catch (error) {
            console.error('Error exporting CE Broker data:', error);
            toast.error('Failed to export data');
        }
    };

    const handleUpdateRecord = async (recordId, updateData) => {
        try {
            await apiService.updateCEBrokerRecord(recordId, updateData);
            toast.success('Record updated successfully!');
            loadCEBrokerDashboard(); // Refresh data
            setShowUpdateModal(false);
            setEditingRecord(null);
        } catch (error) {
            console.error('Error updating record:', error);
            toast.error('Failed to update record');
        }
    };

    const handleMarkSubmitted = async (recordIds) => {
        try {
            await apiService.markCEBrokerExported(licenseNumber, recordIds);
            toast.success(`Marked ${recordIds.length} record(s) as submitted!`);
            loadCEBrokerDashboard();
            setSelectedRecords([]);
        } catch (error) {
            console.error('Error marking records as submitted:', error);
            toast.error('Failed to mark records as submitted');
        }
    };

    // ALL YOUR EXISTING FILE HANDLING FUNCTIONS STAY THE SAME
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleUpload(file);
        }
        event.target.value = '';
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async (file) => {
        if (uploadStatus?.at_limit) {
            setShowPaymentModal(true);
            return;
        }

        if (uploadStatus?.needs_extended_offer) {
            setShowExtendedOffer(true);
            return;
        }

        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            toast.error('Please upload a PDF or image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            toast.loading('Processing certificate...', { id: 'upload' });
            console.log('🚀 Starting upload for file:', file.name);
            console.log('📝 License number:', licenseNumber);

            const result = await apiService.uploadCertificateAuthenticated(licenseNumber, file);
            console.log('✅ Upload API response:', result);

            toast.success(`Certificate "${file.name}" uploaded successfully!`, { id: 'upload' });
            console.log('🔄 Refreshing upload status...');
            await loadUploadCount();

            // Refresh CE Broker data after successful upload
            setTimeout(() => {
                loadCEBrokerDashboard();
            }, 1000);

        } catch (error) {
            console.error('💥 Upload error:', error);
            if (error.response?.status === 402) {
                toast.error('Payment required - upgrade needed', { id: 'upload' });
            } else if (error.response?.status === 401) {
                toast.error('Authentication required', { id: 'upload' });
            } else if (error.response?.data?.detail) {
                toast.error(`Upload failed: ${error.response.data.detail}`, { id: 'upload' });
            } else {
                toast.error(`Upload failed: ${error.message}`, { id: 'upload' });
            }
        } finally {
            setUploading(false);
        }
    };

    // ALL YOUR EXISTING HANDLER FUNCTIONS STAY THE SAME
    const handleAcceptExtendedOffer = async () => {
        try {
            console.log('🎯 Accepting extended trial offer...');
            const result = await apiService.acceptExtendedTrial(licenseNumber);
            console.log('✅ Extended trial accepted:', result);
            setShowExtendedOffer(false);
            toast.success('🎉 Extended trial activated! 20 additional uploads unlocked.');
            await loadUploadCount();
        } catch (error) {
            console.error('❌ Error accepting extended trial:', error);
            toast.error('Failed to activate extended trial. Please try again.');
        }
    };

    const handleDeclineExtendedOffer = () => {
        setShowExtendedOffer(false);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        toast.success('🎉 Upgrade successful! You now have unlimited uploads.');
        await loadUploadCount();
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        toast.info('You can upgrade anytime to continue uploading certificates.');
    };

    const getProgressInfo = () => {
        if (!uploadStatus) return { current: 0, total: 10, phase: 'initial' };

        const { upload_phase, initial_uploads_used, extended_uploads_used, total_uploads_used } = uploadStatus;

        if (upload_phase === 'initial') {
            return {
                current: initial_uploads_used,
                total: 10,
                phase: 'initial',
                label: `${initial_uploads_used} of 10 free uploads used`
            };
        } else if (upload_phase === 'extended') {
            return {
                current: extended_uploads_used,
                total: 20,
                phase: 'extended',
                label: `${extended_uploads_used} of 20 extended uploads used`
            };
        } else {
            return {
                current: total_uploads_used,
                total: 30,
                phase: 'complete',
                label: `${total_uploads_used} total uploads used`
            };
        }
    };

    // Loading and error states remain the same
    if (loading) {
        return (
            <div className={styles.basicDashboard}>
                <div className="loading-spinner">Loading your CPE compliance dashboard...</div>
            </div>
        );
    }

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

    const progressInfo = getProgressInfo();

    return (
        <div className={styles.basicDashboard}>
            {/* EXISTING CPA Header - NO CHANGES */}
            <div className={styles.cpaHeader}>
                <h1 className={styles.cpaName}>{cpa.full_name}</h1>
                <p className={styles.cpaCredentials}>
                    License: {cpa.license_number} • Renews: {formatDate(new Date(cpa.license_expiration_date))} •
                    {Math.ceil((new Date(cpa.license_expiration_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                </p>
            </div>

            {/* EXISTING Upload Section - NO CHANGES */}
            <Card className={styles.statusCard}>
                {uploadStatus && !uploadStatus.has_premium_subscription && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            background: '#e5e7eb',
                            borderRadius: '10px',
                            height: '8px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                background: progressInfo.phase === 'extended' ? '#10b981' : '#3b82f6',
                                height: '100%',
                                width: `${(progressInfo.current / progressInfo.total) * 100}%`,
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginTop: '8px',
                            textAlign: 'center'
                        }}>
                            {progressInfo.label}
                            {progressInfo.phase === 'extended' && (
                                <span style={{ color: '#10b981', fontWeight: '600' }}> • Extended Trial</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Upload area - EXISTING CODE */}
                <div
                    style={{
                        border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        backgroundColor: uploading ? '#f9fafb' : dragActive ? '#eff6ff' : 'transparent',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && !uploadStatus?.at_limit && document.getElementById('certificate-upload').click()}
                >
                    <input
                        type="file"
                        id="certificate-upload"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        disabled={uploading || uploadStatus?.at_limit}
                    />

                    {uploading ? (
                        <div>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                border: '3px solid #e5e7eb',
                                borderTop: '3px solid #3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px'
                            }}></div>
                            <p>Processing your certificate...</p>
                        </div>
                    ) : uploadStatus?.at_limit ? (
                        <div>
                            <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
                            <h4>Ready to Upgrade?</h4>
                            <p>You've experienced everything SuperCPE offers with 30 free uploads!</p>
                            <Button
                                variant="primary"
                                style={{ marginTop: '16px' }}
                                onClick={() => setShowPaymentModal(true)}
                            >
                                Upgrade Now
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <Upload size={48} color="#6b7280" style={{ margin: '0 auto 16px' }} />
                            <h4>{dragActive ? 'Drop to upload certificate' : 'Click or drag to upload certificate'}</h4>
                            <p style={{ color: '#6b7280', margin: '8px 0 16px' }}>
                                PDF, PNG, JPG • Max 10MB
                            </p>
                            <Button
                                variant="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById('certificate-upload').click();
                                }}
                            >
                                Choose File
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* NEW: CE Broker Section - Added below upload */}
            {showCEBrokerSection && (
                <CEBrokerSection
                    ceBrokerData={ceBrokerData}
                    loading={ceBrokerLoading}
                    availablePeriods={availablePeriods}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                    onExport={handleCEBrokerExport}
                    onUpdateRecord={handleUpdateRecord}
                    onMarkSubmitted={handleMarkSubmitted}
                    onRefresh={loadCEBrokerDashboard}
                />
            )}

            {/* EXISTING Modals - NO CHANGES */}
            {showExtendedOffer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        margin: '20px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
                        <h2 style={{ marginBottom: '16px', color: '#1f2937' }}>Initial Testing Phase Complete!</h2>
                        <p style={{ marginBottom: '24px', color: '#6b7280', lineHeight: '1.6' }}>
                            Since SuperCPE is still in development, I'd like to extend <strong>20 additional free uploads</strong> to help you fully explore the platform. Your feedback during this testing phase is invaluable.
                        </p>
                        <p style={{ marginBottom: '32px', color: '#059669', fontWeight: '600' }}>
                            Continue exploring - no strings attached!
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Button
                                variant="primary"
                                onClick={handleAcceptExtendedOffer}
                                style={{ padding: '12px 24px' }}
                            >
                                Accept 20 More Uploads
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDeclineExtendedOffer}
                                style={{ padding: '12px 24px' }}
                            >
                                Upgrade Instead
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <SubscriptionModal
                    licenseNumber={licenseNumber}
                    cpaName={cpa?.full_name || 'CPA Professional'}
                    uploadsUsed={uploadStatus?.total_uploads_used || 0}
                    onClose={handlePaymentCancel}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

// NEW: CE Broker Section Component with Period Selector
const CEBrokerSection = ({
    ceBrokerData,
    loading,
    availablePeriods,
    selectedPeriod,
    onPeriodChange,
    onExport,
    onUpdateRecord,
    onMarkSubmitted,
    onRefresh
}) => {
    if (loading) {
        return (
            <Card className={styles.ceBrokerSection}>
                <div className={styles.ceBrokerHeader}>
                    <FileText className={styles.sectionIcon} />
                    <h2>CE Broker Export</h2>
                </div>
                <div className={styles.loading}>
                    <RefreshCw className={styles.spinner} />
                    <p>Loading CE Broker data...</p>
                </div>
            </Card>
        );
    }

    if (!ceBrokerData) {
        return (
            <Card className={styles.ceBrokerSection}>
                <div className={styles.ceBrokerHeader}>
                    <FileText className={styles.sectionIcon} />
                    <h2>CE Broker Export</h2>
                </div>
                <div className={styles.noData}>
                    <AlertCircle size={48} color="#6b7280" />
                    <h3>No Data Available</h3>
                    <p>Upload some certificates to get started with CE Broker export.</p>
                </div>
            </Card>
        );
    }

    const { summary, ready_records = [], needs_review = [] } = ceBrokerData;

    return (
        <Card className={styles.ceBrokerSection}>
            <div className={styles.ceBrokerHeader}>
                <div className={styles.headerLeft}>
                    <FileText className={styles.sectionIcon} />
                    <h2>CE Broker Export</h2>
                    {selectedPeriod && (
                        <span className={styles.periodLabel}>
                            {selectedPeriod.label}
                        </span>
                    )}
                </div>
                <div className={styles.headerRight}>
                    {availablePeriods.length > 0 && (
                        <select
                            className={styles.periodSelector}
                            value={selectedPeriod?.id || ''}
                            onChange={(e) => {
                                const period = availablePeriods.find(p => p.id === e.target.value);
                                onPeriodChange(period);
                            }}
                        >
                            {availablePeriods.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {period.label} {period.is_current ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        className={styles.refreshButton}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>📚</div>
                    <div className={styles.summaryContent}>
                        <span className={styles.summaryNumber}>{summary.total_certificates || 0}</span>
                        <span className={styles.summaryLabel}>Total Certificates</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>✅</div>
                    <div className={styles.summaryContent}>
                        <span className={styles.summaryNumber}>{summary.ready_for_export || 0}</span>
                        <span className={styles.summaryLabel}>Ready for Export</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>⏳</div>
                    <div className={styles.summaryContent}>
                        <span className={styles.summaryNumber}>{summary.needs_review || 0}</span>
                        <span className={styles.summaryLabel}>Need Review</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>⏰</div>
                    <div className={styles.summaryContent}>
                        <span className={styles.summaryNumber}>{summary.total_cpe_hours || 0}</span>
                        <span className={styles.summaryLabel}>
                            Hours {selectedPeriod ? `(${selectedPeriod.hours_required} required)` : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Export Ready Section */}
            {ready_records.length > 0 && (
                <div className={styles.readySection}>
                    <div className={styles.readySectionHeader}>
                        <h3>
                            <CheckCircle size={20} color="#059669" />
                            Ready for CE Broker ({ready_records.length})
                        </h3>
                        <div className={styles.exportButtons}>
                            <Button
                                variant="primary"
                                onClick={() => onExport('clipboard')}
                                className={styles.exportButton}
                            >
                                <Copy size={16} />
                                Copy to Clipboard
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => onExport('csv')}
                                className={styles.exportButton}
                            >
                                <Download size={16} />
                                Download CSV
                            </Button>
                        </div>
                    </div>

                    <div className={styles.recordsList}>
                        {ready_records.map((record) => (
                            <div key={record.certificate_id} className={styles.recordCard}>
                                <div className={styles.recordHeader}>
                                    <h4>{record.course_name}</h4>
                                    <Badge variant="success">Ready</Badge>
                                </div>
                                <div className={styles.recordDetails}>
                                    <p><strong>Provider:</strong> {record.provider_name}</p>
                                    <p><strong>Date:</strong> {record.completion_date}</p>
                                    <p><strong>Hours:</strong> {record.cpe_hours} CPE + {record.ethics_hours} Ethics</p>
                                    <p><strong>Subject Areas:</strong> {record.subject_areas?.join(', ') || 'None'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {ready_records.length > 0 && (
                        <div className={styles.bulkActions}>
                            <Button
                                variant="outline"
                                onClick={() => onMarkSubmitted(ready_records.map(r => r.certificate_id))}
                                className={styles.markSubmittedButton}
                            >
                                Mark All as Submitted to CE Broker
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Needs Review Section */}
            {needs_review.length > 0 && (
                <div className={styles.reviewSection}>
                    <h3>
                        <AlertCircle size={20} color="#f59e0b" />
                        Need Review ({needs_review.length})
                    </h3>
                    <div className={styles.recordsList}>
                        {needs_review.map((record) => (
                            <div key={record.certificate_id} className={styles.recordCard}>
                                <div className={styles.recordHeader}>
                                    <h4>{record.course_name}</h4>
                                    <Badge variant="warning">Needs Review</Badge>
                                </div>
                                <div className={styles.recordDetails}>
                                    <p><strong>Provider:</strong> {record.provider_name}</p>
                                    <p><strong>Date:</strong> {record.completion_date}</p>
                                    <p><strong>Hours:</strong> {record.cpe_hours} CPE</p>
                                    {record.missing_fields && record.missing_fields.length > 0 && (
                                        <div className={styles.missingFields}>
                                            <strong>Missing:</strong> {record.missing_fields.join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.recordActions}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onUpdateRecord(record.certificate_id, {
                                            subject_areas: ['Finance', 'Business management and organization'],
                                            course_type: 'anytime',
                                            delivery_method: 'Computer-Based Training (ie: online courses)'
                                        })}
                                    >
                                        <Edit3 size={14} />
                                        Quick Fix
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Records State */}
            {ready_records.length === 0 && needs_review.length === 0 && (
                <div className={styles.noRecords}>
                    <FileText size={48} color="#6b7280" />
                    <h3>No CPE Records Found</h3>
                    <p>Upload some CPE certificates to get started with CE Broker export.</p>
                </div>
            )}

            {/* Instructions */}
            <div className={styles.instructions}>
                <h4>How to Submit to CE Broker:</h4>
                <ol>
                    <li>Click "Copy to Clipboard" above to copy your ready records</li>
                    <li>Visit <a href="https://www.cebroker.com" target="_blank" rel="noopener noreferrer">cebroker.com</a> and log in</li>
                    <li>Navigate to "Report CE" for your NH CPA license</li>
                    <li>Paste the course information into the CE Broker form fields</li>
                    <li>Submit each course individually</li>
                    <li>Return here and mark records as submitted when complete</li>
                </ol>
            </div>
        </Card>
    );
};

export default ProfessionalCPEDashboard;