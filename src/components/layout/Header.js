// src/components/layout/Header.js - Streamlined with clean navigation
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import SimpleAuthModal from '../auth/SimpleAuthModal';
import styles from '../../styles/components/Header.module.css';

const Header = () => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, isLoading } = useAuth();

    const isActive = (path) => location.pathname === path;

    // Debug authentication state changes
    useEffect(() => {
        console.log('Header: Auth state changed:', { isAuthenticated, user: !!user, isLoading });
    }, [isAuthenticated, user, isLoading]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isUserMenuOpen && !event.target.closest(`.${styles.userMenu}`)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isUserMenuOpen]);

    const handleLogin = () => {
        console.log('Header: Login button clicked');
        setShowAuthModal(true);
    };

    const handleLogout = async () => {
        console.log('Header: Logout button clicked');
        try {
            await logout();
            setIsUserMenuOpen(false);
            toast.success('Successfully signed out!');
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Logout failed. Please try again.');
        }
    };

    const handleAuthSuccess = () => {
        console.log('Header: Auth success callback');
        setShowAuthModal(false);
        toast.success('Welcome back!');
    };

    // Show loading state
    if (isLoading) {
        return (
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.headerContent}>
                        <Link to="/" className={styles.logo}>
                            <span className={styles.logoText}>SuperCPE</span>
                            <span className={styles.logoSubtext}>Professional</span>
                        </Link>

                        <div className={styles.authLoading}>
                            <div className={styles.loadingSpinner}></div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <>
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.headerContent}>
                        {/* Logo */}
                        <Link to="/" className={styles.logo}>
                            <span className={styles.logoText}>SuperCPE</span>
                            <span className={styles.logoSubtext}>Professional</span>
                        </Link>

                        {/* Main Navigation - Always visible, responsive */}
                        <nav className={styles.nav}>
                            <Link
                                to="/"
                                className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
                            >
                                Home
                            </Link>
                            <Link
                                to="/docs"
                                className={`${styles.navLink} ${isActive('/docs') ? styles.navLinkActive : ''}`}
                            >
                                Docs
                            </Link>
                            <Link
                                to="/privacy"
                                className={`${styles.navLink} ${isActive('/privacy') ? styles.navLinkActive : ''}`}
                            >
                                Privacy
                            </Link>
                            <Link
                                to="/terms"
                                className={`${styles.navLink} ${isActive('/terms') ? styles.navLinkActive : ''}`}
                            >
                                Terms
                            </Link>
                        </nav>

                        {/* Authentication Section */}
                        <div className={styles.authSection}>
                            {isAuthenticated && user ? (
                                <div className={styles.userMenu}>
                                    <button
                                        className={styles.userMenuButton}
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        aria-label="User menu"
                                        aria-expanded={isUserMenuOpen}
                                    >
                                        {user.profile_picture ? (
                                            <img
                                                src={user.profile_picture}
                                                alt={user.name || user.email}
                                                className={styles.userAvatar}
                                            />
                                        ) : (
                                            <div className={styles.userAvatarPlaceholder}>
                                                {(user.name || user.email)?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className={styles.userInfo}>
                                            <span className={styles.userName}>{user.name || user.email}</span>
                                            {user.license_number && (
                                                <span className={styles.userLicense}>#{user.license_number}</span>
                                            )}
                                        </span>
                                        <svg
                                            className={`${styles.userMenuIcon} ${isUserMenuOpen ? styles.userMenuIconOpen : ''}`}
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="currentColor"
                                        >
                                            <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                                        </svg>
                                    </button>

                                    {/* User Dropdown Menu */}
                                    {isUserMenuOpen && (
                                        <div className={styles.userMenuDropdown}>
                                            <div className={styles.userMenuHeader}>
                                                <div className={styles.userMenuHeaderInfo}>
                                                    <strong>{user.name || user.email}</strong>
                                                    <span className={styles.userEmail}>{user.email}</span>
                                                    {user.license_number && (
                                                        <span className={styles.userLicenseDetail}>
                                                            License: {user.license_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={styles.userMenuItems}>
                                                {user.license_number && (
                                                    <Link
                                                        to={`/dashboard/${user.license_number}`}
                                                        className={styles.userMenuItem}
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm10.5 2a.5.5 0 1 1 0 1h-3a.5.5 0 0 1 0-1h3zM3 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                                        </svg>
                                                        Dashboard
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={handleLogout}
                                                    className={`${styles.userMenuItem} ${styles.logoutButton}`}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                                                        <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleLogin}
                                    className={styles.loginButton}
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                                    </svg>
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Authentication Modal */}
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