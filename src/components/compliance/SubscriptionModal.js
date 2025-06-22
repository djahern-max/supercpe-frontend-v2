// src/components/compliance/SubscriptionModal.js
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Check, ArrowRight, Star, X, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import styles from '../../styles/components/SubscriptionModal.module.css';

const SubscriptionModal = ({
    licenseNumber,
    cpaName,
    uploadsUsed = 10,
    onClose,
    onSuccess
}) => {
    const [selectedPlan, setSelectedPlan] = useState('annual'); // Default to annual for savings
    const [isSubmitting, setIsSubmitting] = useState(false);

    const plans = {
        monthly: {
            id: 'monthly',
            name: 'Professional Monthly',
            price: '$10',
            period: '/month',
            annual_price: '$120/year',
            description: 'Perfect for ongoing CPE management',
            flexible: true, // Add badge for monthly plan
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

    const handlePlanSelect = async (planId) => {
        setSelectedPlan(planId);
        setIsSubmitting(true);

        try {
            // Since user is already authenticated, we can create the subscription directly
            // This should call a new endpoint for authenticated users
            const result = await apiService.createSubscriptionForAuthenticatedUser({
                license_number: licenseNumber,
                plan: planId
            });

            if (result.success) {
                toast.success('Redirecting to payment...');

                // Redirect to Stripe checkout
                if (result.redirect_url) {
                    window.location.href = result.redirect_url;
                } else {
                    // Fallback - close modal and show success
                    onSuccess();
                }
            } else {
                toast.error(result.error || 'Failed to create subscription. Please try again.');
            }
        } catch (error) {
            console.error('Subscription creation error:', error);

            if (error.response?.status === 401) {
                toast.error('Please log in to continue with your subscription.');
            } else if (error.response?.status === 404) {
                toast.error('CPA license number not found. Please verify your license number.');
            } else {
                toast.error('Unable to process your request. Please try again or contact support.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

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
                            className={`${styles.planCard} ${plan.popular ? styles.popular : ''} ${isSubmitting ? styles.disabled : ''}`}
                            onClick={() => !isSubmitting && handlePlanSelect(planId)}
                        >
                            {plan.popular && (
                                <div className={styles.popularBadge}>
                                    <Star size={16} />
                                    Most Popular
                                </div>
                            )}

                            {plan.flexible && (
                                <div className={styles.flexibleBadge}>
                                    <Clock size={16} />
                                    Cancel Anytime
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

                            <button
                                className={styles.selectPlanButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && selectedPlan === planId ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        Choose {plan.name}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators - Updated with colors and removed Cancel Anytime */}
                <div className={styles.trustIndicators}>
                    <div className={styles.trustItem}>
                        <div className={styles.trustIcon}>
                            <Shield size={16} />
                        </div>
                        <span>Secure Payment via Stripe</span>
                    </div>
                    <div className={styles.trustItem}>
                        <div className={styles.trustIcon}>
                            <Star size={16} />
                        </div>
                        <span>30-Day Money Back Guarantee</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;