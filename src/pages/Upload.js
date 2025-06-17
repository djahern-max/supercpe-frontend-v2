// src/pages/Upload.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import FileUpload from '../components/ui/FileUpload';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { apiService } from '../services/api';
import styles from '../styles/pages/Upload.module.css';

const Upload = () => {
    const { licenseNumber } = useParams();
    const navigate = useNavigate();
    const [cpa, setCpa] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('upload'); // upload, review, save

    useEffect(() => {
        loadCPA();
    }, [licenseNumber]);

    const loadCPA = async () => {
        try {
            const cpaData = await apiService.getCPA(licenseNumber);
            setCpa(cpaData);
        } catch (error) {
            toast.error('CPA not found');
            navigate('/');
        }
    };

    const handleFileSelect = async (file) => {
        setSelectedFile(file);
        setLoading(true);
        setStep('analyzing');

        try {
            const result = await apiService.analyzeCertificate(licenseNumber, file);
            setAnalysisResult(result);
            setReviewData({
                cpe_credits: result.ai_analysis?.cpe_hours || '',
                course_title: result.ai_analysis?.course_title || '',
                provider_name: result.ai_analysis?.provider || '',
                completion_date: result.ai_analysis?.completion_date || '',
                is_ethics: false,
                notes: ''
            });
            setStep('review');
            toast.success('Certificate analyzed successfully!');
        } catch (error) {
            toast.error('Analysis failed. Please try again.');
            setStep('upload');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await apiService.saveReviewedCertificate(licenseNumber, selectedFile, reviewData);
            toast.success('CPE record saved successfully!');
            navigate(`/dashboard/${licenseNumber}`);
        } catch (error) {
            if (error.message.includes('subscription')) {
                toast.error('Professional subscription required to save records');
                navigate('/pricing');
            } else {
                toast.error('Failed to save record. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!cpa) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.upload}>
            <div className="container">
                <div className={styles.header}>
                    <h1 className={styles.title}>Upload CPE Certificate</h1>
                    <p className={styles.subtitle}>
                        {cpa.full_name} • License #{cpa.license_number}
                    </p>
                </div>

                {step === 'upload' && (
                    <Card className={styles.uploadCard}>
                        <div className="card-body">
                            <h2 className={styles.stepTitle}>Step 1: Select Certificate</h2>
                            <p className={styles.stepDescription}>
                                Upload your CPE certificate for AI-powered analysis.
                                Our system extracts course details, hours, and completion dates automatically.
                            </p>

                            <FileUpload
                                onFileSelect={handleFileSelect}
                                disabled={loading}
                                className={styles.fileUpload}
                            />

                            <div className={styles.features}>
                                <div className={styles.featureItem}>
                                    <span className={styles.featureIcon}>✨</span>
                                    <span>AI extracts CPE hours, dates, and course details</span>
                                </div>
                                <div className={styles.featureItem}>
                                    <span className={styles.featureIcon}>🔍</span>
                                    <span>Review and edit before saving</span>
                                </div>
                                <div className={styles.featureItem}>
                                    <span className={styles.featureIcon}>💾</span>
                                    <span>Secure professional storage</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {step === 'analyzing' && (
                    <Card className={styles.analyzeCard}>
                        <div className="card-body">
                            <div className={styles.analyzing}>
                                <div className="loading-spinner"></div>
                                <h2>Analyzing Certificate...</h2>
                                <p>Our AI is extracting CPE information from your document.</p>
                            </div>
                        </div>
                    </Card>
                )}

                {step === 'review' && analysisResult && (
                    <Card className={styles.reviewCard}>
                        <div className="card-header">
                            <h2 className="card-title">Step 2: Review & Edit</h2>
                            <p className="card-subtitle">
                                AI Analysis Confidence:
                                <Badge variant="success" className={styles.confidenceBadge}>
                                    {analysisResult.ai_analysis?.overall_confidence || 0}%
                                </Badge>
                            </p>
                        </div>

                        <div className="card-body">
                            <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="cpe_credits" className={styles.label}>
                                            CPE Hours *
                                        </label>
                                        <input
                                            id="cpe_credits"
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="50"
                                            value={reviewData.cpe_credits}
                                            onChange={(e) => setReviewData({ ...reviewData, cpe_credits: e.target.value })}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="completion_date" className={styles.label}>
                                            Completion Date *
                                        </label>
                                        <input
                                            id="completion_date"
                                            type="date"
                                            value={reviewData.completion_date}
                                            onChange={(e) => setReviewData({ ...reviewData, completion_date: e.target.value })}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="course_title" className={styles.label}>
                                            Course Title *
                                        </label>
                                        <input
                                            id="course_title"
                                            type="text"
                                            value={reviewData.course_title}
                                            onChange={(e) => setReviewData({ ...reviewData, course_title: e.target.value })}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="provider_name" className={styles.label}>
                                            Provider *
                                        </label>
                                        <input
                                            id="provider_name"
                                            type="text"
                                            value={reviewData.provider_name}
                                            onChange={(e) => setReviewData({ ...reviewData, provider_name: e.target.value })}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={reviewData.is_ethics}
                                                onChange={(e) => setReviewData({ ...reviewData, is_ethics: e.target.checked })}
                                                className={styles.checkbox}
                                            />
                                            Ethics Course
                                        </label>
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="notes" className={styles.label}>
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            id="notes"
                                            value={reviewData.notes}
                                            onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                                            className={`form-input ${styles.textarea}`}
                                            rows="3"
                                            placeholder="Add any additional notes about this course..."
                                        />
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setStep('upload')}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className={styles.saveButton}
                                    >
                                        Save CPE Record
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Upload;