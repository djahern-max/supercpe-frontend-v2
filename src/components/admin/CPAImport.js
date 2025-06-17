// src/components/admin/CPAImport.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { apiService } from '../../services/api';
import styles from '../../styles/components/CPAImport.module.css';

const CPAImport = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [stats, setStats] = useState(null);

    // Load current stats on component mount
    React.useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const statsData = await apiService.getCPAStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];

        if (!file) {
            toast.error('Please select a file');
            return;
        }

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        setUploading(true);
        setUploadResult(null);

        try {
            const result = await apiService.uploadCPAList(file);
            setUploadResult(result);
            toast.success(`Successfully imported CPA list: ${result.results.created} created, ${result.results.updated} updated`);

            // Refresh stats after successful upload
            await loadStats();
        } catch (error) {
            toast.error(error.message || 'Failed to upload CPA list');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        multiple: false,
        disabled: uploading
    });

    const testConnection = async () => {
        try {
            const result = await apiService.testConnection();
            if (result.success) {
                toast.success(`✅ API connected successfully! Version: ${result.version}`);
            } else {
                toast.error(`❌ API connection failed: ${result.error}`);
            }
        } catch (error) {
            toast.error(`❌ Connection test failed: ${error.message}`);
        }
    };

    return (
        <div className={styles.cpaImport}>
            <div className="container">
                <div className={styles.header}>
                    <h1 className={styles.title}>CPA Data Management</h1>
                    <p className={styles.subtitle}>
                        Import monthly OPLC CPA lists and manage database
                    </p>
                </div>

                {/* Connection Test */}
                <Card className={styles.connectionCard}>
                    <div className="card-header">
                        <h2 className="card-title">🔗 API Connection</h2>
                    </div>
                    <div className="card-body">
                        <p>Test the connection to your backend API:</p>
                        <Button onClick={testConnection} variant="outline">
                            Test API Connection
                        </Button>
                    </div>
                </Card>

                {/* Current Stats */}
                {stats && (
                    <Card className={styles.statsCard}>
                        <div className="card-header">
                            <h2 className="card-title">📊 Current Database Stats</h2>
                        </div>
                        <div className="card-body">
                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <div className={styles.statNumber}>{stats.total_cpas}</div>
                                    <div className={styles.statLabel}>Total CPAs</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statNumber}>{stats.active_cpas}</div>
                                    <div className={styles.statLabel}>Active CPAs</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statNumber}>{stats.premium_cpas}</div>
                                    <div className={styles.statLabel}>Premium CPAs</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statNumber}>{stats.free_cpas}</div>
                                    <div className={styles.statLabel}>Free CPAs</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* File Upload */}
                <Card className={styles.uploadCard}>
                    <div className="card-header">
                        <h2 className="card-title">📤 Upload Monthly CPA List</h2>
                    </div>
                    <div className="card-body">
                        <div
                            {...getRootProps()}
                            className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${uploading ? styles.disabled : ''}`}
                        >
                            <input {...getInputProps()} />

                            <div className={styles.dropzoneContent}>
                                {uploading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        <p>Uploading and processing...</p>
                                    </>
                                ) : isDragActive ? (
                                    <>
                                        <div className={styles.uploadIcon}>📁</div>
                                        <p>Drop the Excel file here...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.uploadIcon}>📊</div>
                                        <p>
                                            <strong>Click to select</strong> or drag and drop the monthly OPLC CPA Excel file
                                        </p>
                                        <p className={styles.fileTypes}>
                                            Accepts: .xlsx, .xls files only
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Upload Instructions */}
                        <div className={styles.instructions}>
                            <h3>Instructions:</h3>
                            <ol>
                                <li>Download the monthly CPA list from OPLC in Excel format</li>
                                <li>Ensure the file contains columns: License Number, Full Name/Business Name, License Status, Issue Date, Expiration Date</li>
                                <li>Upload the file using the dropzone above</li>
                                <li>The system will automatically import active CPAs and update existing records</li>
                            </ol>
                        </div>
                    </div>
                </Card>

                {/* Upload Results */}
                {uploadResult && (
                    <Card className={styles.resultsCard}>
                        <div className="card-header">
                            <h2 className="card-title">✅ Upload Results</h2>
                        </div>
                        <div className="card-body">
                            <div className={styles.results}>
                                <p><strong>File:</strong> {uploadResult.filename}</p>
                                <div className={styles.resultStats}>
                                    <div className={styles.resultItem}>
                                        <span className={styles.resultNumber}>{uploadResult.results.created}</span>
                                        <span className={styles.resultLabel}>New CPAs Created</span>
                                    </div>
                                    <div className={styles.resultItem}>
                                        <span className={styles.resultNumber}>{uploadResult.results.updated}</span>
                                        <span className={styles.resultLabel}>Existing CPAs Updated</span>
                                    </div>
                                    <div className={styles.resultItem}>
                                        <span className={styles.resultNumber}>{uploadResult.results.skipped || 0}</span>
                                        <span className={styles.resultLabel}>Records Skipped</span>
                                    </div>
                                    <div className={styles.resultItem}>
                                        <span className={styles.resultNumber}>{uploadResult.results.errors || 0}</span>
                                        <span className={styles.resultLabel}>Errors</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default CPAImport;