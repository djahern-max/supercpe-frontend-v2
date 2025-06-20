import React from 'react';
import styles from '../styles/pages/Privacy.module.css';

const Privacy = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>Privacy Policy</h1>
                <p className={styles.lastUpdated}>Last updated: June 2025</p>

                <section>
                    <h2>1. Information We Collect</h2>
                    <p>SuperCPE collects the following information to provide our CPE compliance tracking service:</p>
                    <ul>
                        <li><strong>Account Information:</strong> When you sign up, we collect your email address, name, and password to create and manage your account.</li>
                        <li><strong>CPA License Information:</strong> Your New Hampshire CPA license number to verify your professional status.</li>
                        <li><strong>CPE Certificates:</strong> Digital copies of your continuing education certificates for compliance tracking.</li>
                        <li><strong>Usage Data:</strong> Information about how you use our service to improve functionality.</li>
                    </ul>
                </section>

                <section>
                    <h2>2. How We Use Your Information</h2>
                    <p>We use your information solely to:</p>
                    <ul>
                        <li>Provide CPE compliance tracking services</li>
                        <li>Verify your CPA license status with New Hampshire state records</li>
                        <li>Process and analyze your CPE certificates using AI technology</li>
                        <li>Send important account and compliance-related notifications</li>
                        <li>Improve our service based on usage patterns</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Information Sharing</h2>
                    <p>We do not sell, trade, or share your personal information with third parties except:</p>
                    <ul>
                        <li><strong>Service Providers:</strong> Secure cloud storage (DigitalOcean Spaces) and payment processing (Stripe)</li>
                        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Data Security</h2>
                    <p>We implement industry-standard security measures including:</p>
                    <ul>
                        <li>Encrypted data transmission (HTTPS/SSL)</li>
                        <li>Secure cloud storage with access controls</li>
                        <li>Regular security audits and updates</li>
                        <li>Limited employee access on a need-to-know basis</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate information</li>
                        <li>Delete your account and data</li>
                        <li>Export your data</li>
                        <li>Withdraw consent for data processing</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Contact Information</h2>
                    <p>For privacy-related questions or requests:</p>
                    <ul>
                        <li>Email: support@supercpe.com</li>
                        <li>Website: <a href="https://nh.supercpe.com" target="_blank" rel="noopener noreferrer">nh.supercpe.com</a></li>
                    </ul>
                </section>

                <section>
                    <h2>7. Changes to This Policy</h2>
                    <p>We may update this privacy policy periodically. We will notify users of significant changes via email or a prominent notice on our website.</p>
                </section>
            </div>
        </div>
    );
};

export default Privacy;
