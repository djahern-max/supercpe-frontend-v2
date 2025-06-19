// src/components/auth/SimpleAuthModal.js - Fixed to properly update auth state
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import styles from '../../styles/components/SimpleAuthModal.module.css';

const SimpleAuthModal = ({ onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, forceAuthCheck } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please enter both email and password');
            return;
        }

        if (!email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        console.log('🔐 SimpleAuthModal: Starting login process...');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('🔐 SimpleAuthModal: Login response received:', {
                    hasAccessToken: !!data.access_token,
                    hasUser: !!data.user,
                    userEmail: data.user?.email
                });

                // Use the login method from auth context
                const loginSuccess = await login(
                    data.access_token,
                    data.refresh_token,
                    data.user
                );

                if (loginSuccess) {
                    console.log('🔐 SimpleAuthModal: Login successful, calling callbacks');

                    // Force an auth check to ensure state is synchronized
                    setTimeout(() => {
                        forceAuthCheck();
                    }, 100);

                    toast.success('Welcome back!');

                    // Call success callback first
                    if (onSuccess) {
                        onSuccess();
                    }

                    // Close modal
                    onClose();

                    // Navigate to dashboard if user has license
                    if (data.user?.license_number) {
                        console.log('🔐 SimpleAuthModal: Navigating to dashboard');
                        navigate(`/dashboard/${data.user.license_number}`, { replace: true });
                    } else {
                        // If no license, go to home page
                        navigate('/', { replace: true });
                    }
                } else {
                    console.error('🔐 SimpleAuthModal: Login context method failed');
                    toast.error('Login failed. Please try again.');
                }
            } else {
                const errorData = await response.json();
                console.error('🔐 SimpleAuthModal: Login request failed:', errorData);
                toast.error(errorData.detail || 'Invalid email or password');
            }
        } catch (error) {
            console.error('🔐 SimpleAuthModal: Login error:', error);
            toast.error('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Sign In</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="Enter your email"
                            disabled={isLoading}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading || !email || !password}
                    >
                        {isLoading ? (
                            <div className={styles.loadingContent}>
                                <div className={styles.spinner}></div>
                                <span>Signing In...</span>
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        New to SuperCPE?
                        <button
                            type="button"
                            className={styles.linkButton}
                            onClick={onClose}
                        >
                            Enter your passcode on the home page to get started
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SimpleAuthModal;