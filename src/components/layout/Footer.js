// src/components/layout/Footer.js
import React from 'react';
import styles from '../../styles/components/Footer.module.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h3 className={styles.footerTitle}>SuperCPE Professional</h3>
                        <p className={styles.footerDescription}>
                            Advanced CPE management for New Hampshire CPAs.
                            Streamline your continuing education compliance with Google AI-powered analysis.
                        </p>
                    </div>

                    <div className={styles.footerSection}>
                        <h4 className={styles.footerSectionTitle}>NH CPE Rule Changes</h4>
                        <p className={styles.footerText}>
                            New Hampshire recently updated CPE requirements from a 3-year (triennial)
                            to a 2-year (biennial) renewal cycle.
                        </p>
                    </div>

                    <div className={styles.footerSection}>
                        <h4 className={styles.footerSectionTitle}>What's Changed</h4>
                        <p className={styles.footerText}>
                            Reporting Periods: Triennial → Biennial<br />
                            CPE Hours Required: 120/3 years → 80/2 years<br />
                            State Fees: Updated fee structure
                        </p>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <div className={styles.footerBottomContent}>
                        <p className={styles.copyright}>
                            © {currentYear} SuperCPE Professional. All rights reserved.
                        </p>
                        <p className={styles.disclaimer}>
                            Not affiliated with the New Hampshire Board of Accountancy or OPLC.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;