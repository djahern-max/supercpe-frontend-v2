// src/components/compliance/SubscriptionModal.js
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Check, ArrowRight, Star, X } from 'lucide-react';
import { apiService } from '../../services/api';
import styles from '../../styles/components/SubscriptionModal.module.css';

const SubscriptionModal = ({
    licenseNumber,
    cpaName,
    uploadsUsed = 10,
    onClose,
    onSuccess
}) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState(cpaName || '');
    const [selectedPlan, setSelectedPlan] = useState('annual'); // Default to annual for savings
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState('plan'); // 'plan' or 'account'

    const plans = {
        monthly: {
            id: 'monthly',
            name: 'Professional Monthly',
            price: '$10',
            period: '/month',
            annual_price: '$120/year',
            description: 'Perfect for ongoing CPE management',
            features: [
                'Unlimited certificate uploads',
                'Advanced compliance reports',
                'Priority AI processing',
                'Secure document vault',
                'Professional audit presentations',
                'Multi-year tracking',
                'Email support'
            ]
        },
        annual: {
            id: 'annual',
            name: 'Professional Annual',
            price: '$96',
            period: '/year',
            monthly_equivalent: '$8/month',
            savings: 'Save $24/year',
            description: 'Best value - 2 months free!',
            popular: true,
            features: [
                'Everything in Monthly plan',
                '2 months FREE (20% savings)',
                'Priority customer support',
                'Advanced compliance analytics',
                'Custom report templates',
                'Early access to new features'
            ]
        }
    };

    const handlePlanSelect = (planId) => {
        setSelectedPlan(planId);
        setStep('account');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await apiService.createAccountForPayment({
                email: email.trim(),
                license_number: licenseNumber,
                name: name.trim(),
                plan: selectedPlan
            });

            if (result.success) {
                toast.success('Account created! Redirecting to payment...');

                // Redirect to Stripe checkout or payment page
                if (result.redirect_url) {
                    window.location.href = result.redirect_url;
                } else {
                    // Fallback - close modal and show success
                    onSuccess();
                }
            } else {
                toast.error(result.error || 'Failed to create account. Please try again.');
            }
        } catch (error) {
            console.error('Account creation error:', error);

            if (error.response?.status === 400) {
                toast.error(error.response.data?.detail || 'Invalid request. Please check your information.');
            } else if (error.response?.status === 404) {
                toast.error('CPA license number not found. Please verify your license number.');
            } else {
                toast.error('Unable to process your request. Please try again or contact support.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToPlan = () => {
        setStep('plan');
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

                {step === 'plan' && (
                    <>
                        {/* Header */}
                        <div className={styles.modalHeader}>
                            <div className={styles.iconWrapper}>
                                <Shield className={styles.headerIcon} />
                            </div>
                            <h2>🎉 Ready to Upgrade!</h2>
                            <p>You've used all {uploadsUsed} free uploads with full functionality. Choose your plan to continue:</p>
                        </div>

                        {/* Data Preservation Notice */}
                        <div className={styles.dataNotice}>
                            <Check className={styles.checkIcon} />
                            <span>All your {uploadsUsed} certificates and data will be preserved</span>
                        </div>

                        {/* Plan Selection */}
                        <div className={styles.plansContainer}>
                            {Object.entries(plans).map(([planId, plan]) => (
                                <div
                                    key={planId}
                                    className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
                                    onClick={() => handlePlanSelect(planId)}
                                >
                                    {plan.popular && (
                                        <div className={styles.popularBadge}>
                                            <Star size={16} />
                                            Most Popular
                                        </div>
                                    )}

                                    <div className={styles.planHeader}>
                                        <h3>{plan.name}</h3>
                                        <div className={styles.planPrice}>
                                            <span className={styles.price}>{plan.price}</span>
                                            <span className={styles.period}>{plan.period}</span>
                                        </div>
                                        {plan.monthly_equivalent && (
                                            <div className={styles.equivalent}>{plan.monthly_equivalent}</div>
                                        )}
                                        {plan.savings && (
                                            <div className={styles.savings}>{plan.savings}</div>
                                        )}
                                    </div>

                                    <p className={styles.planDescription}>{plan.description}</p>

                                    <ul className={styles.featureList}>
                                        {plan.features.map((feature, index) => (
                                            <li key={index}>
                                                <Check size={16} className={styles.featureCheck} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button className={styles.selectPlanButton}>
                                        Choose {plan.name}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Trust Indicators */}
                        <div className={styles.trustIndicators}>
                            <div className={styles.trustItem}>
                                <Shield size={16} />
                                <span>Secure Payment via Stripe</span>
                            </div>
                            <div className={styles.trustItem}>
                                <Check size={16} />
                                <span>Cancel Anytime</span>
                            </div>
                            <div className={styles.trustItem}>
                                <Star size={16} />
                                <span>30-Day Money Back Guarantee</span>
                            </div>
                        </div>
                    </>
                )}

                {step === 'account' && (
                    <>
                        {/* Account Creation Header */}
                        <div className={styles.modalHeader}>
                            <button className={styles.backButton} onClick={handleBackToPlan}>
                                ← Back to Plans
                            </button>
                            <h2>Create Your Account</h2>
                            <p>
                                Setting up <strong>{plans[selectedPlan].name}</strong> for license #{licenseNumber}
                            </p>
                        </div>

                        {/* Selected Plan Summary */}
                        <div className={styles.planSummary}>
                            <div className={styles.summaryDetails}>
                                <span className={styles.planName}>{plans[selectedPlan].name}</span>
                                <span className={styles.planPrice}>
                                    {plans[selectedPlan].price}{plans[selectedPlan].period}
                                </span>
                            </div>
                            {plans[selectedPlan].savings && (
                                <div className={styles.savingsNote}>{plans[selectedPlan].savings}</div>
                            )}
                        </div>

                        {/* Account Form */}
                        <form onSubmit={handleSubmit} className={styles.accountForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    required
                                    disabled={isSubmitting}
                                />
                                <small>We'll send your receipt and account details here</small>
                            </div>

                            <div className={styles.formGroup}>
                                <label>CPA License Number</label>
                                <input
                                    type="text"
                                    value={licenseNumber}
                                    disabled
                                    className={styles.disabledInput}
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    'Creating Account...'
                                ) : (
                                    <>
                                        Continue to Payment
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Data Preservation Reminder */}
                        <div className={styles.preservationReminder}>
                            <Check className={styles.checkIcon} />
                            <div>
                                <strong>Your data is safe!</strong>
                                <br />
                                All {uploadsUsed} certificates and compliance records will remain accessible after upgrade.
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SubscriptionModal;