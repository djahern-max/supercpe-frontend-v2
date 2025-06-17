// src/pages/Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import { apiService } from '../services/api';
import styles from '../styles/pages/Home.module.css';

const Home = () => {
    const [licenseNumber, setLicenseNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLookup = async (e) => {
        e.preventDefault();

        if (!licenseNumber.trim()) {
            toast.error('Please enter your CPA license number');
            return;
        }

        setLoading(true);

        try {
            const cpa = await apiService.getCPA(licenseNumber.trim());
            toast.success(`Welcome, ${cpa.full_name}!`);
            navigate(`/dashboard/${licenseNumber.trim()}`);
        } catch (error) {
            if (error.message.includes('404')) {
                toast.error('CPA license number not found. Please check your number or contact support.');
            } else {
                toast.error('Unable to connect. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.home}>
            <div className="container">
                {/* Hero Section */}
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            Professional CPE Management
                            <span className={styles.heroSubtitle}>for New Hampshire CPAs</span>
                        </h1>

                        <p className={styles.heroDescription}>
                            Streamline your continuing education tracking with AI-powered certificate analysis,
                            professional compliance reporting, and secure document management.
                        </p>

                        <form onSubmit={handleLookup} className={styles.lookupForm}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="licenseNumber" className="visually-hidden">
                                    CPA License Number
                                </label>
                                <input
                                    id="licenseNumber"
                                    type="text"
                                    placeholder="Enter your CPA license number (e.g., 07308)"
                                    value={licenseNumber}
                                    onChange={(e) => setLicenseNumber(e.target.value)}
                                    className={`form-input ${styles.licenseInput}`}
                                    disabled={loading}
                                />
                                <Button
                                    type="submit"
                                    size="lg"
                                    loading={loading}
                                    className={styles.lookupButton}
                                >
                                    Access Dashboard
                                </Button>
                            </div>
                        </form>

                        <p className={styles.tryDemo}>
                            Want to see it in action? Try license number <strong>07308</strong>
                        </p>
                    </div>
                </section>

                {/* Features Section */}
                <section className={styles.features}>
                    <div className={styles.featuresGrid}>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>🤖</div>
                            <h3 className={styles.featureTitle}>AI-Powered Analysis</h3>
                            <p className={styles.featureDescription}>
                                Upload certificates and let our advanced AI extract CPE hours,
                                course details, and completion dates with 87% accuracy.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>📊</div>
                            <h3 className={styles.featureTitle}>Compliance Tracking</h3>
                            <p className={styles.featureDescription}>
                                Automatically track your progress against NH's 80-hour biennial
                                requirement with annual minimums and ethics requirements.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>🔒</div>
                            <h3 className={styles.featureTitle}>Secure Storage</h3>
                            <p className={styles.featureDescription}>
                                Professional-grade document storage with encrypted backups
                                and instant access to your complete CPE history.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className={styles.cta}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Ready to streamline your CPE management?</h2>
                        <p className={styles.ctaDescription}>
                            Join hundreds of New Hampshire CPAs who trust SuperCPE Professional
                            for their continuing education compliance.
                        </p>
                        <Button size="lg" onClick={() => navigate('/pricing')}>
                            View Pricing Plans
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Home;
