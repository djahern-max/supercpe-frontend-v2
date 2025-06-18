// src/components/compliance/ProfessionalUpgradeModal.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Shield, Check, ArrowRight, Star } from 'lucide-react';
import styles from '../../styles/components/ProfessionalUpgradeModal.module.css';

const ProfessionalUpgradeModal = ({
    licenseNumber,
    cpaName,
    onClose,
    uploadedCount = 10
}) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('annual'); // Default to annual
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            // Import API service
            const { apiService } = await import('../../services/api');

            // Create user account with email and redirect to payment
            const result = await apiService.createAccountForPayment({
                email,
                license_number: licenseNumber,
                name: cpaName,
                plan: selectedPlan
            });

            if (result.success) {
                // Success - redirect to Stripe checkout or your payment page
                toast.success('Account created! Redirecting to payment...');

                // Redirect to payment page (either your custom page or Stripe checkout)
                if (result.redirect_url) {
                    window.location.href = result.redirect_url;
                } else {
                    navigate(`/payment?email=${encodeURIComponent(email)}&license=${licenseNumber}&plan=${selectedPlan}`);
                }
            } else {
                toast.error(result.error || 'Failed to create account. Please try again.');
            }
        } catch (error) {
            console.error('Account creation error:', error);
            toast.error('Unable to process your request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <Shield className={styles.shieldIcon} />
                    <h2>Upgrade to Professional CPE Management</h2>
                </div>

                <div className={styles.content}>
                    <div className={styles.achievementSection}>
                        <h3>You've experienced the full SuperCPE platform!</h3>
                        <p className={styles.achievementText}>
                            You've uploaded {uploadedCount} certificates with our enhanced features:
                        </p>
                        <div className={styles.achievementsList}>
                            <div className={styles.achievementItem}>
                                <Check className={styles.checkIcon} />
                                <span>AI-powered certificate analysis</span>
                            </div>
                            <div className={styles.achievementItem}>
                                <Check className={styles.checkIcon} />
                                <span>Cloud secure storage</span>
                            </div>
                            <div className={styles.achievementItem}>
                                <Check className={styles.checkIcon} />
                                <span>Automated compliance tracking</span>
                            </div>
                            <div className={styles.achievementItem}>
                                <Check className={styles.checkIcon} />
                                <span>Professional dashboard</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.pricingSection}>
                        <h3>Choose your subscription plan</h3>

                        <div className={styles.pricingOptions}>
                            <div
                                className={`${styles.pricingCard} ${selectedPlan === 'annual' ? styles.selectedPlan : ''}`}
                                onClick={() => setSelectedPlan('annual')}
                            >
                                <div className={styles.pricingHeader}>
                                    <div className={styles.planName}>
                                        <Star className={styles.starIcon} />
                                        <span>Annual</span>
                                    </div>
                                    {selectedPlan === 'annual' && (
                                        <div className={styles.selectedBadge}>Selected</div>
                                    )}
                                </div>

                                <div className={styles.price}>
                                    <span className={styles.amount}>$96</span>
                                    <span className={styles.period}>/year</span>
                                </div>

                                <div className={styles.monthlyEquivalent}>
                                    $8/month (20% savings)
                                </div>

                                <div className={styles.savingsBadge}>Best Value</div>
                            </div>

                            <div
                                className={`${styles.pricingCard} ${selectedPlan === 'monthly' ? styles.selectedPlan : ''}`}
                                onClick={() => setSelectedPlan('monthly')}
                            >
                                <div className={styles.pricingHeader}>
                                    <div className={styles.planName}>
                                        <span>Monthly</span>
                                    </div>
                                    {selectedPlan === 'monthly' && (
                                        <div className={styles.selectedBadge}>Selected</div>
                                    )}
                                </div>

                                <div className={styles.price}>
                                    <span className={styles.amount}>$10</span>
                                    <span className={styles.period}>/month</span>
                                </div>

                                <div className={styles.monthlyEquivalent}>
                                    Cancel anytime
                                </div>
                            </div>
                        </div>

                        <div className={styles.includedFeatures}>
                            <p className={styles.includedTitle}>All plans include:</p>
                            <div className={styles.featuresList}>
                                <div className={styles.featureItem}>
                                    <Check className={styles.featureCheck} />
                                    <span><strong>Unlimited</strong> certificate uploads</span>
                                </div>
                                <div className={styles.featureItem}>
                                    <Check className={styles.featureCheck} />
                                    <span><strong>All</strong> your existing certificates preserved</span>
                                </div>
                                <div className={styles.featureItem}>
                                    <Check className={styles.featureCheck} />
                                    <span>Professional audit reports</span>
                                </div>
                                <div className={styles.featureItem}>
                                    <Check className={styles.featureCheck} />
                                    <span>Premium customer support</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.upgradeForm}>
                        <p className={styles.formIntro}>
                            Enter your email to continue with professional access:
                        </p>
                        <div className={styles.inputGroup}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email address"
                                className={styles.emailInput}
                                required
                            />
                            <button
                                type="submit"
                                className={styles.continueButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : 'Continue'}
                                {!isSubmitting && <ArrowRight className={styles.arrowIcon} />}
                            </button>
                        </div>
                        <p className={styles.securityNote}>
                            <Shield className={styles.miniShieldIcon} />
                            Secure payment processing via Stripe. Your data is protected.
                        </p>
                    </form>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Continue with limited access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalUpgradeModal;