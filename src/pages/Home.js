// src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import CPASearch from '../components/CPASearch';
import styles from '../styles/pages/Home.module.css';

const Home = () => {
    const navigate = useNavigate();

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

                        <CPASearch />

                        <div className={styles.searchInstructions}>
                            <p>Search by name or license number to access your dashboard</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className={styles.features}>
                    <div className={styles.featuresGrid}>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>Google AI-Powered Analysis</h3>
                            <p className={styles.featureDescription}>
                                Powered by Google's advanced machine learning technology to extract CPE hours,
                                course details, and completion dates from your certificates with exceptional accuracy.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>📋</div>
                            <h3 className={styles.featureTitle}>NH Compliance Tracking</h3>
                            <p className={styles.featureDescription}>
                                Stay current with New Hampshire's updated CPE requirements. Navigate the recent transition
                                from triennial to biennial renewal cycles with confidence and ensure full compliance.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>🛡️</div>
                            <h3 className={styles.featureTitle}>Professional Storage</h3>
                            <p className={styles.featureDescription}>
                                Enterprise-grade document storage with encrypted backups and instant access
                                to your complete CPE history whenever you need it.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className={styles.cta}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Ready to streamline your CPE management?</h2>
                        <p className={styles.ctaDescription}>
                            Experience the future of CPE compliance management designed
                            specifically for New Hampshire CPAs.
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