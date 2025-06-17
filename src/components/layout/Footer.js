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
                            Streamline your continuing education compliance with AI-powered analysis.
                        </p>
                    </div>

                    <div className={styles.footerSection}>
                        <h4 className={styles.footerSectionTitle}>Features</h4>
                        <ul className={styles.footerLinks}>
                            <li><a href="#ai-analysis" className={styles.footerLink}>AI Certificate Analysis</a></li>
                            <li><a href="#compliance" className={styles.footerLink}>Compliance Tracking</a></li>
                            <li><a href="#storage" className={styles.footerLink}>Secure Storage</a></li>
                            <li><a href="#reports" className={styles.footerLink}>Professional Reports</a></li>
                        </ul>
                    </div>

                    <div className={styles.footerSection}>
                        <h4 className={styles.footerSectionTitle}>Support</h4>
                        <ul className={styles.footerLinks}>
                            <li>
                                <a
                                    href="https://nh.supercpe.com/docs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.footerLink}
                                >
                                    API Documentation
                                </a>
                            </li>
                            <li><a href="mailto:support@supercpe.com" className={styles.footerLink}>Contact Support</a></li>
                            <li><a href="#privacy" className={styles.footerLink}>Privacy Policy</a></li>
                            <li><a href="#terms" className={styles.footerLink}>Terms of Service</a></li>
                        </ul>
                    </div>

                    <div className={styles.footerSection}>
                        <h4 className={styles.footerSectionTitle}>New Hampshire CPAs</h4>
                        <p className={styles.footerText}>
                            Designed specifically for NH CPA compliance requirements.
                            Supports the current 80-hour biennial system with annual minimums.
                        </p>
                        <div className={styles.compliance}>
                            <span className={styles.complianceItem}>✓ 80 Hours Biennial</span>
                            <span className={styles.complianceItem}>✓ 4 Hours Ethics</span>
                            <span className={styles.complianceItem}>✓ 20 Hours Annual Minimum</span>
                        </div>
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