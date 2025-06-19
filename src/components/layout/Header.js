// src/components/layout/Header.js - Fixed authentication display logic
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import SimpleAuthModal from '../auth/SimpleAuthModal';
import styles from '../../styles/components/Header.module.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const handleLogin = () => {
        // Show the simple auth modal
        setShowAuthModal(true);
        closeMenus();
    };

    const handleLogout = async () => {
        try {
            await logout();
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
            toast.success('Successfully signed out!');

            // Redirect to home page after logout
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Logout failed. Please try again.');
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        toast.success('Welcome back!');
    };

    const closeMenus = () => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    return (
        <>
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.headerContent}>
                        {/* Logo */}
                        <Link to="/" className={styles.logo} onClick={closeMenus}>
                            <span className={styles.logoText}>SuperCPE</span>
                            <span className={styles.logoSubtext}>Professional</span>
                        </Link>

                        {/* Navigation */}
                        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
                            <Link
                                to="/"
                                className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
                                onClick={closeMenus}
                            >
                                Home
                            </Link>
                            <a
                                href="https://supercpe.com/docs"
                                className={styles.navLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMenus}
                            >
                                Docs
                            </a>
                            <Link
                                to="/privacy"
                                className={`${styles.navLink} ${isActive('/privacy') ? styles.navLinkActive : ''}`}
                                onClick={closeMenus}
                            >
                                Privacy
                            </Link>
                            <Link
                                to="/terms"
                                className={`${styles.navLink} ${isActive('/terms') ? styles.navLinkActive : ''}`}
                                onClick={closeMenus}
                            >
                                Terms
                            </Link>
                        </nav>

                        {/* Authentication Section */}
                        <div className={styles.authSection}>
                            {/* ONLY show user menu when authenticated */}
                            {isAuthenticated && user ? (
                                <div className={styles.userMenu}>
                                    <button
                                        className={styles.userMenuButton}
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        aria-label="User menu"
                                    >
                                        {user.profile_picture ? (
                                            <img
                                                src={user.profile_picture}
                                                alt={user.name || 'User'}
                                                className={styles.userAvatar}
                                            />
                                        ) : (
                                            <div className={styles.userInitial}>
                                                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className={styles.userName}>{user.name || 'User'}</span>
                                        <svg
                                            className={`${styles.chevron} ${isUserMenuOpen ? styles.chevronOpen : ''}`}
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="6,9 12,15 18,9"></polyline>
                                        </svg>
                                    </button>

                                    {/* User Dropdown Menu */}
                                    {isUserMenuOpen && (
                                        <div className={styles.userDropdown}>
                                            <div className={styles.userInfo}>
                                                <div className={styles.userInfoName}>{user.name}</div>
                                                <div className={styles.userInfoEmail}>{user.email}</div>
                                                {user.license_number && (
                                                    <div className={styles.userInfoLicense}>
                                                        License: {user.license_number}
                                                    </div>
                                                )}
                                            </div>

                                            {user.license_number && (
                                                <Link
                                                    to={`/dashboard/${user.license_number}`}
                                                    className={styles.dropdownLink}
                                                    onClick={closeMenus}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                        <path d="M9 9h6v6H9z" />
                                                    </svg>
                                                    Dashboard
                                                </Link>
                                            )}

                                            <button
                                                onClick={handleLogout}
                                                className={styles.dropdownButton}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path fillRule="evenodd" d="M1.5 0 A1.5 1.5 0 0 0 0 1.5v9A1.5 1.5 0 0 0 1.5 12h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                                                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Show Sign In button for non-authenticated users
                                <button
                                    onClick={handleLogin}
                                    className={`${styles.loginButton} ${styles.desktopOnly}`}
                                >
                                    Sign In
                                </button>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                className={styles.mobileMenuButton}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Toggle menu"
                            >
                                <span className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ''}`}></span>
                            </button>
                        </div>

                        {/* Mobile Authentication (shown in mobile menu) */}
                        {isMenuOpen && (
                            <div className={styles.mobileAuth}>
                                {isAuthenticated && user ? (
                                    <div className={styles.mobileUserInfo}>
                                        <div className={styles.mobileUserProfile}>
                                            {user.profile_picture ? (
                                                <img
                                                    src={user.profile_picture}
                                                    alt={user.name || 'User'}
                                                    className={styles.mobileUserAvatar}
                                                />
                                            ) : (
                                                <div className={styles.mobileUserInitial}>
                                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className={styles.mobileUserName}>
                                                    {user.name || 'User'}
                                                </div>
                                                <div className={styles.mobileUserEmail}>
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                        {user.license_number && (
                                            <Link
                                                to={`/dashboard/${user.license_number}`}
                                                className={styles.mobileNavButton}
                                                onClick={closeMenus}
                                            >
                                                Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className={styles.mobileNavButton}
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    // Show Sign In button in mobile when NOT authenticated
                                    <button
                                        onClick={handleLogin}
                                        className={styles.mobileLoginButton}
                                    >
                                        Sign In
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* SimpleAuthModal - renders when showAuthModal is true */}
            {showAuthModal && (
                <SimpleAuthModal
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={handleAuthSuccess}
                />
            )}
        </>
    );
};

export default Header;