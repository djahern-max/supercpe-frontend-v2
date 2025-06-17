// src/components/layout/Header.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/components/Header.module.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header className={styles.header}>
            <div className="container">
                <div className={styles.headerContent}>
                    <Link to="/" className={styles.logo}>
                        <span className={styles.logoText}>SuperCPE</span>
                        <span className={styles.logoSubtext}>Professional</span>
                    </Link>

                    <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
                        <Link
                            to="/"
                            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/pricing"
                            className={`${styles.navLink} ${isActive('/pricing') ? styles.navLinkActive : ''}`}
                        >
                            Pricing
                        </Link>
                        <a
                            href="https://nh.supercpe.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.navLink}
                        >
                            API Docs
                        </a>
                    </nav>

                    <div className={styles.headerActions}>
                        <Link to="/pricing" className={`btn-base ${styles.ctaButton}`}>
                            Get Started
                        </Link>

                        <button
                            className={styles.mobileMenuButton}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <span className={styles.hamburger}></span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
