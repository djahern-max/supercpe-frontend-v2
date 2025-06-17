// src/pages/Pricing.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { apiService } from '../services/api';
import styles from '../styles/pages/Pricing.module.css';

const Pricing = () => {
    const [plans, setPlans] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPricingPlans();
    }, []);

    const loadPricingPlans = async () => {
        try {
            const pricingData = await apiService.getPricingPlans();
            setPlans(pricingData);
        } catch (error) {
            toast.error('Failed to load pricing information');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (planKey) => {
        if (planKey === 'free') {
            navigate('/');
            return;
        }

        // For now, show coming soon message for paid plans
        toast.success('Stripe integration coming soon! Contact support for early access.');
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loading-spinner"></div>
                <p>Loading pricing plans...</p>
            </div>
        );
    }

    return (
        <div className={styles.pricing}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Professional CPE Management</h1>
                    <p className={styles.subtitle}>
                        Choose the plan that fits your professional needs.
                        Start with our free tier and upgrade when you're ready to save your records.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className={styles.plansGrid}>
                    {plans && Object.entries(plans).map(([planKey, plan]) => (
                        <Card key={planKey} className={styles.planCard}>
                            <div className="card-header">
                                <h3 className={styles.planName}>{plan.name}</h3>
                                {planKey === 'premium_annual' && (
                                    <Badge variant="success" className={styles.popularBadge}>
                                        Most Popular
                                    </Badge>
                                )}
                                <div className={styles.planPrice}>
                                    <span className={styles.priceAmount}>
                                        ${plan.price}
                                    </span>
                                    <span className={styles.pricePeriod}>
                                        {planKey === 'premium_annual' ? '/year' : planKey === 'pay_per_upload' ? '/upload' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="card-body">
                                <ul className={styles.featuresList}>
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className={styles.feature}>
                                            <span className={styles.featureIcon}>✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="card-footer">
                                <Button
                                    size="lg"
                                    variant={planKey === 'premium_annual' ? 'primary' : 'outline'}
                                    onClick={() => handleSelectPlan(planKey)}
                                    className={styles.selectButton}
                                >
                                    {planKey === 'free' ? 'Get Started Free' : 'Select Plan'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className={styles.faq}>
                    <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>

                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>How accurate is the AI analysis?</h3>
                            <p className={styles.faqAnswer}>
                                Our AI achieves 87% overall accuracy in extracting CPE hours, course titles,
                                and completion dates from certificates. You can always review and edit before saving.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>What file formats are supported?</h3>
                            <p className={styles.faqAnswer}>
                                We support PDF, JPG, PNG, DOC, and DOCX files up to 10MB.
                                PDF certificates typically work best with our AI analysis.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>Is my data secure?</h3>
                            <p className={styles.faqAnswer}>
                                Yes. We use enterprise-grade encryption and secure cloud storage.
                                Your certificates and CPE records are stored with bank-level security.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>Do you track NH compliance rules?</h3>
                            <p className={styles.faqAnswer}>
                                Absolutely. We're specifically designed for New Hampshire's 80-hour biennial
                                requirement with 4 ethics hours and 20-hour annual minimums.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>Can I cancel anytime?</h3>
                            <p className={styles.faqAnswer}>
                                Yes, you can cancel your Professional subscription at any time.
                                Your data remains accessible until your current billing period ends.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>What about board audits?</h3>
                            <p className={styles.faqAnswer}>
                                Our Professional plan generates board-ready compliance reports
                                and maintains secure access to all your original certificates.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className={styles.cta}>
                    <h2 className={styles.ctaTitle}>Ready to streamline your CPE management?</h2>
                    <p className={styles.ctaDescription}>
                        Start with free AI analysis, then upgrade to save your records permanently.
                    </p>
                    <Button size="lg" onClick={() => navigate('/')}>
                        Try Free Analysis Now
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;