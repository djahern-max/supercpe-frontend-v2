// src/components/layout/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/components/Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.footerContent}>
                    <div className={styles.links}>
                        <Link to="/terms">Terms</Link>
                        <Link to="/privacy">Privacy</Link>
                        <a href="mailto:feedback@ryze.ai">Send Feedback</a>
                    </div>
                    <p className={styles.copy}>© {new Date().getFullYear()} SuperCPE · All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
