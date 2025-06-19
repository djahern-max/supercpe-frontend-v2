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
                            <p>Enter Your Name or License Number</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className={styles.features}>
                    <div className={styles.featuresGrid}>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* AI-Powered Analysis - Purple/Blue gradient for tech/AI */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <defs>
                                        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#8B5CF6" />
                                            <stop offset="100%" stopColor="#3B82F6" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="url(#aiGradient)" />
                                    <path d="M2 17l10 5 10-5" stroke="url(#aiGradient)" />
                                    <path d="M2 12l10 5 10-5" stroke="url(#aiGradient)" />
                                    <circle cx="12" cy="8" r="2" stroke="url(#aiGradient)" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>AI-Powered Analysis</h3>
                            <p className={styles.featureDescription}>
                                Powered by advanced machine learning technology to extract CPE hours,
                                course details, and completion dates from your certificates with exceptional accuracy.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* NH Compliance - Green for compliance/success */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <defs>
                                        <linearGradient id="complianceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#10B981" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="url(#complianceGradient)" />
                                    <polyline points="14,2 14,8 20,8" stroke="url(#complianceGradient)" />
                                    <line x1="16" y1="13" x2="8" y2="13" stroke="url(#complianceGradient)" />
                                    <line x1="16" y1="17" x2="8" y2="17" stroke="url(#complianceGradient)" />
                                    <polyline points="10,9 9,9 8,9" stroke="url(#complianceGradient)" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>NH Compliance Tracking</h3>
                            <p className={styles.featureDescription}>
                                Stay current with New Hampshire's updated CPE requirements. Navigate
                                the recent transition from triennial to biennial renewal cycles with confidence
                                and ensure full compliance.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* Professional Storage - Orange/Red for security/storage */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <defs>
                                        <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#F59E0B" />
                                            <stop offset="100%" stopColor="#DC2626" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="url(#storageGradient)" />
                                    <circle cx="8.5" cy="8.5" r="1.5" stroke="url(#storageGradient)" />
                                    <path d="M21 15l-5-5L5 21" stroke="url(#storageGradient)" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>Professional Storage</h3>
                            <p className={styles.featureDescription}>
                                Enterprise-grade document storage with encrypted backups and instant
                                access to your complete CPE history whenever you need it.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className={styles.cta}>
                    <h2 className={styles.ctaTitle}>Ready to Simplify Your CPE Management?</h2>
                    <p className={styles.ctaDescription}>
                        Join hundreds of New Hampshire CPAs who trust SuperCPE for their
                        continuing education compliance.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/pricing')}
                    >
                        Get Started Today
                    </Button>
                </section>
            </div>
        </div>
    );
};

export default Home;