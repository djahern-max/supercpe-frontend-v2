// src/pages/AuthCallback.js - Improved with better dashboard redirect logic
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import styles from '../styles/pages/AuthCallback.module.css';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [isProcessing, setIsProcessing] = useState(true);
    const [status, setStatus] = useState('Completing Sign In...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                setStatus('Processing authentication...');

                const accessToken = searchParams.get('access_token');
                const refreshToken = searchParams.get('refresh_token');
                const userLicense = searchParams.get('user_license');
                const error = searchParams.get('error');

                console.log('Auth callback params:', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    userLicense,
                    error
                });

                if (error) {
                    console.error('OAuth error:', error);
                    toast.error('Authentication failed. Please try again.');
                    navigate('/', { replace: true });
                    return;
                }

                if (!accessToken) {
                    console.error('No access token received');
                    toast.error('Authentication failed. No access token received.');
                    navigate('/', { replace: true });
                    return;
                }

                setStatus('Storing authentication tokens...');

                // Store tokens
                localStorage.setItem('access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refresh_token', refreshToken);
                }

                setStatus('Fetching user profile...');

                // Get user profile
                const { apiService } = await import('../services/api');
                const userProfile = await apiService.getCurrentUser();

                console.log('User profile loaded:', userProfile);

                setStatus('Setting up your account...');

                // Use the login method from auth context
                const loginSuccess = await login(accessToken, refreshToken, userProfile);

                if (!loginSuccess) {
                    console.error('Login context failed');
                    toast.error('Failed to complete sign in');
                    navigate('/', { replace: true });
                    return;
                }

                setStatus('Redirecting to your dashboard...');

                // Determine redirect destination with priority logic
                let redirectPath = '/';
                let welcomeMessage = `Welcome, ${userProfile.name}!`;

                // Priority 1: User's own license number from profile
                if (userProfile.license_number) {
                    redirectPath = `/dashboard/${userProfile.license_number}`;
                    welcomeMessage = `Welcome back, ${userProfile.name}! Redirecting to your dashboard...`;
                }
                // Priority 2: License number from backend callback URL
                else if (userLicense) {
                    redirectPath = `/dashboard/${userLicense}`;
                    welcomeMessage = `Welcome, ${userProfile.name}! Redirecting to your dashboard...`;
                }
                // Priority 3: No license - go to home with helpful message
                else {
                    redirectPath = '/';
                    welcomeMessage = `Welcome, ${userProfile.name}! Enter your CPA license number to get started.`;
                }

                console.log('Redirecting to:', redirectPath);

                // Show success message
                toast.success(welcomeMessage, { duration: 3000 });

                // Clean up URL params before navigating
                window.history.replaceState({}, document.title, window.location.pathname);

                // Navigate to destination with small delay for better UX
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 1500);

            } catch (error) {
                console.error('Auth callback error:', error);

                // Handle specific error cases
                if (error.response?.status === 401) {
                    toast.error('Authentication session expired. Please sign in again.');
                } else if (error.response?.data?.detail === 'User account no longer exists') {
                    toast.error('Your account is no longer available.');
                } else {
                    toast.error('An unexpected error occurred during authentication.');
                }

                // Clear any stored tokens
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                navigate('/', { replace: true });
            } finally {
                setIsProcessing(false);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    if (isProcessing) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    <h2 className={styles.loadingTitle}>
                        Completing Sign In...
                    </h2>
                    <p className={styles.loadingText}>
                        {status}
                    </p>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill}></div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AuthCallback;