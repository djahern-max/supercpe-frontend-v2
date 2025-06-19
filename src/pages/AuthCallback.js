// src/pages/AuthCallback.js - Fixed to prevent multiple executions
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
        // Create a flag to track if we've processed this callback
        const callbackId = searchParams.get('access_token');
        const processedKey = `callback_processed_${callbackId?.slice(-10) || 'unknown'}`;

        // Check if we've already processed this exact callback
        if (sessionStorage.getItem(processedKey)) {
            console.log('Callback already processed, skipping...');
            setIsProcessing(false);
            return;
        }

        const handleCallback = async () => {
            try {
                // Mark as processed immediately to prevent re-runs
                if (callbackId) {
                    sessionStorage.setItem(processedKey, 'true');
                }

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

                // Clean up URL params before deciding what to do next
                window.history.replaceState({}, document.title, '/auth/callback');

                // Determine redirect destination
                if (userProfile.license_number) {
                    // User has a license - go directly to dashboard
                    setStatus('Redirecting to your dashboard...');
                    const redirectPath = `/dashboard/${userProfile.license_number}`;
                    console.log('Redirecting to:', redirectPath);

                    toast.success(`Welcome back, ${userProfile.name}!`, {
                        duration: 2000
                    });

                    setTimeout(() => {
                        navigate(redirectPath, { replace: true });
                    }, 1000);

                } else if (userLicense) {
                    // Backend provided a license number - use it
                    setStatus('Redirecting to your dashboard...');
                    const redirectPath = `/dashboard/${userLicense}`;
                    console.log('Redirecting to:', redirectPath);

                    toast.success(`Welcome, ${userProfile.name}!`, {
                        duration: 2000
                    });

                    setTimeout(() => {
                        navigate(redirectPath, { replace: true });
                    }, 1000);

                } else {
                    // No license number - go to home with clear instructions
                    setStatus('Redirecting to home...');
                    console.log('Redirecting to: / (no license)');

                    // Clear any existing toasts first
                    toast.dismiss();

                    // Show success message with clear next steps
                    toast.success(`Welcome, ${userProfile.name}! Please search for and select your CPA license below to link it to your account.`, {
                        duration: 6000
                    });

                    setTimeout(() => {
                        navigate('/', {
                            replace: true,
                            state: {
                                justLoggedIn: true,
                                userName: userProfile.name,
                                needsLicense: true
                            }
                        });
                    }, 1500);
                }

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

        // Only run if we haven't processed this callback
        if (!sessionStorage.getItem(processedKey)) {
            handleCallback();
        }

        // Cleanup function to remove the processed flag after some time
        return () => {
            setTimeout(() => {
                sessionStorage.removeItem(processedKey);
            }, 30000); // Remove after 30 seconds
        };

    }, []); // Empty dependency array - only run once

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