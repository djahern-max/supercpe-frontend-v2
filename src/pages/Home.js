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
                                {/* AI-Powered Analysis - Light Blue */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#3b82f6" />
                                    <path d="M2 17l10 5 10-5" stroke="#3b82f6" />
                                    <path d="M2 12l10 5 10-5" stroke="#3b82f6" />
                                    <circle cx="12" cy="8" r="2" stroke="#3b82f6" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>AI-Powered Analysis</h3>
                            <p className={styles.featureDescription}>
                                I use Google Cloud Vision API in this application to analyze documents with OCR technology (Optical Charicter Recognition).  I have found that it is very accurate and also reasonably priced.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* NH Compliance - Light Blue */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#3b82f6" />
                                    <polyline points="14,2 14,8 20,8" stroke="#3b82f6" />
                                    <line x1="16" y1="13" x2="8" y2="13" stroke="#3b82f6" />
                                    <line x1="16" y1="17" x2="8" y2="17" stroke="#3b82f6" />
                                    <polyline points="10,9 9,9 8,9" stroke="#3b82f6" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>NH Compliance Tracking</h3>
                            <p className={styles.featureDescription}>
                                I was confused when I renewed my license this year and found that it was due to be renewed again in 2 years as opposed to 3.  That brought about a lot of questions so I built this website to help make things a bit more clear.
                            </p>
                        </div>

                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                {/* Professional Storage - Light Blue */}
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="#3b82f6" />
                                    <circle cx="8.5" cy="8.5" r="1.5" stroke="#3b82f6" />
                                    <path d="M21 15l-5-5L5 21" stroke="#3b82f6" />
                                </svg>
                            </div>
                            <h3 className={styles.featureTitle}>Professional Storage</h3>
                            <p className={styles.featureDescription}>
                                I decided to go with Digital Ocean Spaces for storage.  It is a great service that is very affordable and easy to use.  All data is encrypted at rest and in transit.
                            </p>
                        </div>
                    </div>
                </section>


            </div>
        </div>
    );
};

export default Home;