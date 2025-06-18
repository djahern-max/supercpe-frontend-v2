// src/components/compliance/UpgradeModal.js
import React from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import styles from '../../styles/components/UpgradeModal.module.css';

const UpgradeModal = ({ onClose, uploadCount, licenseNumber }) => {
    const handleUpgrade = () => {
        // TODO: Integrate with Stripe payment flow
        // For now, just show a placeholder
        window.open(`/pricing?license=${licenseNumber}`, '_blank');
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                {/* Close button */}
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    ×
                </button>

                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2>🎉 Amazing Progress!</h2>
                    <p>You've experienced the power of SuperCPE's AI-driven compliance tracking!</p>
                </div>

                {/* Achievements */}
                <div className={styles.achievements}>
                    <h3>What You've Accomplished:</h3>
                    <div className={styles.achievementsList}>
                        <div className={styles.achievement}>
                            <span className={styles.achievementIcon}>📄</span>
                            <span>Uploaded {uploadCount} certificates</span>
                        </div>
                        <div className={styles.achievement}>
                            <span className={styles.achievementIcon}>✨</span>
                            <span>Experienced AI-powered data extraction</span>
                        </div>
                        <div className={styles.achievement}>
                            <span className={styles.achievementIcon}>🎯</span>
                            <span>Saw smart period assignment in action</span>
                        </div>
                        <div className={styles.achievement}>
                            <span className={styles.achievementIcon}>📊</span>
                            <span>Viewed real-time compliance calculations</span>
                        </div>
                        <div className={styles.achievement}>
                            <span className={styles.achievementIcon}>⚡</span>
                            <span>Saved hours of manual data entry</span>
                        </div>
                    </div>
                </div>

                {/* Upgrade value proposition */}
                <div className={styles.upgradeValue}>
                    <h3>Continue Your Success with SuperCPE Professional</h3>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📂</span>
                            <div>
                                <strong>Unlimited Uploads</strong>
                                <p>Upload as many certificates as you need</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>💾</span>
                            <div>
                                <strong>Permanent Storage</strong>
                                <p>All your compliance data saved securely</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📈</span>
                            <div>
                                <strong>Advanced Tracking</strong>
                                <p>Multiple periods, detailed reports, progress tracking</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🔔</span>
                            <div>
                                <strong>Smart Reminders</strong>
                                <p>Never miss a renewal deadline again</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🛡️</span>
                            <div>
                                <strong>Priority Support</strong>
                                <p>Direct access to our compliance experts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className={styles.pricing}>
                    <div className={styles.priceCard}>
                        <div className={styles.priceHeader}>
                            <h4>SuperCPE Professional</h4>
                            <Badge variant="success">Best Value</Badge>
                        </div>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>$10</span>
                            <span className={styles.pricePeriod}>/month</span>
                        </div>
                        <div className={styles.priceNote}>
                            $8/month • Cancel anytime
                        </div>
                    </div>
                </div>

                {/* Call to action */}
                <div className={styles.modalActions}>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleUpgrade}
                        className={styles.upgradeButton}
                    >
                        Upgrade to Professional
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className={styles.continueButton}
                    >
                        Maybe Later
                    </Button>
                </div>

                {/* Testimonial or trust indicator */}
                <div className={styles.trustIndicator}>
                    <p>"SuperCPE saved me hours of compliance tracking. The AI is incredibly accurate!"
                        <br />— <em>Sarah M., NH CPA</em></p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;