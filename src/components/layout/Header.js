// src/components/layout/Header.js - Fixed authentication flow
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';
import styles from '../../styles/components/Header.module.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const handleLogin = async () => {
        if (isLoggingIn) return; // Prevent double clicks

        try {
            setIsLoggingIn(true);
            const authData = await apiService.getGoogleAuthUrl();

            if (authData && authData.auth_url) {
                window.location.href = authData.auth_url;
            } else {
                throw new Error('Invalid auth URL received');
            }
        } catch (error) {
            setIsLoggingIn(false);
            console.error('Login error:', error);
            toast.error('Failed to initiate login. Please try again.');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
            toast.success('Successfully signed out!');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Logout failed. Please try again.');
        }
    };

    const closeMenus = () => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    return (
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
                            href="https://nh.supercpe.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.navLink}
                            onClick={closeMenus}
                        >
                            API Docs
                        </a>
                    </nav>

                    {/* Header Actions */}
                    <div className={styles.headerActions}>
                        {isAuthenticated && user ? (
                            // Authenticated user menu
                            <div className={styles.userMenu}>
                                <button
                                    className={styles.userButton}
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    aria-label="User menu"
                                >
                                    <div className={styles.userInfo}>
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
                                        <span className={styles.userName}>
                                            {user.name || 'User'}
                                        </span>
                                        <svg
                                            className={`${styles.chevron} ${isUserMenuOpen ? styles.chevronOpen : ''}`}
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="currentColor"
                                        >
                                            <path d="M4.5 6L8 9.5L11.5 6H4.5Z" />
                                        </svg>
                                    </div>
                                </button>

                                {/* User Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className={styles.userDropdown}>
                                        <div className={styles.userProfile}>
                                            <div className={styles.userEmail}>{user.email}</div>
                                            {user.license_number && (
                                                <div className={styles.userLicense}>
                                                    License: {user.license_number}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.dropdownDivider}></div>
                                        {user.license_number && (
                                            <Link
                                                to={`/dashboard/${user.license_number}`}
                                                className={styles.dropdownItem}
                                                onClick={closeMenus}
                                            >
                                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                                </svg>
                                                Dashboard
                                            </Link>
                                        )}
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={handleLogout}
                                        >
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                                                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Login button for non-authenticated users
                            <button
                                onClick={handleLogin}
                                disabled={isLoggingIn}
                                className={`${styles.loginButton} ${styles.desktopOnly}`}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                            <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                                        </svg>
                                        Sign In
                                    </>
                                )}
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
                                <button
                                    onClick={handleLogin}
                                    disabled={isLoggingIn}
                                    className={styles.mobileLoginButton}
                                >
                                    {isLoggingIn ? 'Signing In...' : 'Sign In with Google'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;