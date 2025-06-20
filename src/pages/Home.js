// src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import CPASearch from '../components/CPASearch';
import styles from '../styles/pages/Home.module.css';
import PasscodeEntry from '../components/PasscodeEntry';

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
                            Did you receive a secret code? Please enter it below.
                        </p>

                        {/* <CPASearch /> */}
                        <PasscodeEntry />
                    </div>
                </section>

                {/* Features Section */}
                <section className={styles.features}>
                    <div className={styles.featuresGrid}>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* AI-Powered Analysis - Light Blue with subtle fill */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#dbeafe" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                    <circle cx="12" cy="8" r="2" fill="#3b82f6" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>AI-Powered Analysis</h3>
                            <p className={styles.featureDescription}>
                                This platform uses Google Cloud Vision's OCR capabilities to scan and analyze documents with impressive accuracy. It’s fast, cost-effective, and reliable for extracting meaningful data from certificates and forms.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* NH Compliance - Green tint */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#d1fae5" />
                                    <polyline points="14,2 14,8 20,8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10,9 9,9 8,9" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>NH Compliance Tracking</h3>
                            <p className={styles.featureDescription}>
                                Keeping up with New Hampshire’s CPA license renewal cycles and requirements can be confusing. This tool was built to bring more clarity and organization to the process for fellow professionals in the state.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* Professional Storage - Violet */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="#ede9fe" />
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="#8b5cf6" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>Professional Storage</h3>
                            <p className={styles.featureDescription}>
                                Files are securely stored using DigitalOcean Spaces, a dependable cloud solution that ensures data is encrypted both at rest and in transit—offering peace of mind without breaking the budget.
                            </p>
                        </div>

                    </div>
                </section>



            </div>
        </div>
    );
};

export default Home;