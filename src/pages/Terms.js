import React from 'react';
import styles from '../styles/pages/Terms.module.css';

const Terms = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>Terms of Service</h1>
                <p className={styles.lastUpdated}>Last updated: December 2024</p>

                <section>
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing and using SuperCPE ("Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
                </section>

                <section>
                    <h2>2. Description of Service</h2>
                    <p>SuperCPE provides continuing professional education (CPE) compliance tracking services for New Hampshire Certified Public Accountants, including:</p>
                    <ul>
                        <li>AI-powered certificate analysis and data extraction</li>
                        <li>Compliance period tracking and reporting</li>
                        <li>Secure document storage and management</li>
                        <li>Professional dashboard and progress monitoring</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Service Plans</h2>
                    <h3>Free Tier:</h3>
                    <ul>
                        <li>10 free certificate uploads with AI analysis</li>
                        <li>Basic compliance dashboard access</li>
                        <li>Temporary certificate analysis results</li>
                    </ul>
                    <h3>Professional Tier ($10/month):</h3>
                    <ul>
                        <li>Unlimited certificate uploads</li>
                        <li>Permanent record storage</li>
                        <li>Advanced compliance reporting</li>
                        <li>Priority customer support</li>
                    </ul>
                </section>

                <section>
                    <h2>4. User Responsibilities</h2>
                    <p>You agree to:</p>
                    <ul>
                        <li>Use the service only for legitimate CPE compliance purposes</li>
                        <li>Upload only authentic CPE certificates you have earned</li>
                        <li>Maintain the accuracy of your account information</li>
                        <li>Comply with all applicable professional and legal requirements</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Data and Privacy</h2>
                    <p>Your privacy is important to us. Please review our Privacy Policy, which governs how we collect, use, and protect your information.</p>
                </section>

                <section>
                    <h2>6. Limitation of Liability</h2>
                    <p>SuperCPE is a compliance tracking tool. You remain solely responsible for:</p>
                    <ul>
                        <li>Meeting all CPA continuing education requirements</li>
                        <li>Verifying the accuracy of AI-extracted certificate data</li>
                        <li>Submitting required documentation to licensing authorities</li>
                        <li>Compliance with all professional standards and regulations</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Contact Information</h2>
                    <p>For questions about these terms:</p>
                    <ul>
                        <li>Email: support@supercpe.com</li>
                        <li>Website: https://nh.supercpe.com</li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default Terms;