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

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const accessToken = searchParams.get('access_token');
                const refreshToken = searchParams.get('refresh_token');
                const userLicense = searchParams.get('user_license'); // License from backend
                const error = searchParams.get('error');

                if (error) {
                    toast.error('Authentication failed. Please try again.');
                    navigate('/');
                    return;
                }

                if (!accessToken) {
                    toast.error('Authentication failed. No access token received.');
                    navigate('/');
                    return;
                }

                // Store tokens temporarily
                localStorage.setItem('access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refresh_token', refreshToken);
                }

                // Get user profile to verify account still exists
                const { apiService } = await import('../services/api');

                try {
                    const userProfile = await apiService.getCurrentUser();

                    // Use the login method from auth context
                    const loginSuccess = await login(accessToken, refreshToken, userProfile);

                    if (loginSuccess) {
                        // Determine redirect destination
                        let redirectPath = '/';

                        // Priority 1: User's own license number from profile
                        if (userProfile.license_number) {
                            redirectPath = `/dashboard/${userProfile.license_number}`;
                            toast.success(`Welcome back, ${userProfile.name}! Redirecting to your dashboard...`);
                        }
                        // Priority 2: License number from backend callback
                        else if (userLicense) {
                            redirectPath = `/dashboard/${userLicense}`;
                            toast.success(`Welcome, ${userProfile.name}! Redirecting to dashboard...`);
                        }
                        // Priority 3: Default to home
                        else {
                            toast.success(`Welcome, ${userProfile.name}! You can now enter a CPA license number to get started.`);
                        }

                        // Clean up URL params before navigating
                        window.history.replaceState({}, document.title, window.location.pathname);

                        // Small delay for better UX
                        setTimeout(() => {
                            navigate(redirectPath);
                        }, 1000);
                    } else {
                        // Login failed
                        navigate('/');
                    }

                } catch (userError) {
                    console.error('Failed to get user profile:', userError);

                    // Check if it's a specific user deletion error
                    if (userError.response?.data?.detail === 'User account no longer exists') {
                        toast.error('Your account is no longer available. This may happen if your account was deleted.');
                    } else {
                        toast.error('Authentication failed. Unable to verify your account.');
                    }

                    // Clear any stored tokens
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    navigate('/');
                }

            } catch (error) {
                console.error('Auth callback error:', error);
                toast.error('An unexpected error occurred during authentication.');

                // Clear any stored tokens
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                navigate('/');
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
                        Please wait while we verify your account and prepare your dashboard.
                    </p>
                </div>
            </div>
        );
    }

    return null;
};

export default AuthCallback;