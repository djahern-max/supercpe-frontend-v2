// src/contexts/AuthContext.js - Complete fix for authentication state synchronization
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Password setup state
    const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);
    const [temporaryPassword, setTemporaryPassword] = useState(null);

    // Debug function to log auth state changes
    const logAuthChange = useCallback((action, data = {}) => {
        console.log(`🔐 AuthContext [${action}]:`, {
            isAuthenticated,
            hasUser: !!user,
            userEmail: user?.email,
            isLoading,
            ...data
        });
    }, [isAuthenticated, user, isLoading]);

    // Make auth context globally available for API interceptors
    useEffect(() => {
        window.authContext = {
            setIsAuthenticated,
            setUser,
            clearAuthState: () => clearAuthState(),
            checkAuthStatus: () => checkAuthStatus()
        };

        // Cleanup on unmount
        return () => {
            delete window.authContext;
        };
    }, []);

    // Make toast globally available for API interceptors
    useEffect(() => {
        window.toast = toast;
        return () => {
            delete window.toast;
        };
    }, []);

    // Check authentication status on app load and whenever tokens change
    useEffect(() => {
        checkAuthStatus();

        // Also check auth status when the page becomes visible again
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkAuthStatus();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Log auth state changes for debugging
    useEffect(() => {
        logAuthChange('State Changed');
    }, [isAuthenticated, user, isLoading, logAuthChange]);

    const clearAuthState = useCallback(() => {
        console.log('🔐 AuthContext: Clearing auth state');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        setUser(null);
        setRequiresPasswordSetup(false);
        setTemporaryPassword(null);
    }, []);

    const checkAuthStatus = useCallback(async () => {
        console.log('🔐 AuthContext: Checking auth status...');
        setIsLoading(true);

        const accessToken = localStorage.getItem('access_token');

        // If no token, user is not authenticated
        if (!accessToken) {
            console.log('🔐 AuthContext: No access token found');
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            // Try to get current user if we have a token
            console.log('🔐 AuthContext: Fetching current user with token...');
            const userProfile = await apiService.getCurrentUser();
            console.log('🔐 AuthContext: User profile fetched successfully:', userProfile);

            // Force update the authentication state
            setIsAuthenticated(true);
            setUser(userProfile);

            // Force a re-render by updating the state slightly
            setTimeout(() => {
                setIsAuthenticated(true);
            }, 0);

        } catch (error) {
            console.error('🔐 AuthContext: Auth check failed:', error);

            // If token is invalid, clear everything
            if (error.response?.status === 401) {
                console.log('🔐 AuthContext: Invalid token (401), clearing auth state');
                clearAuthState();
            } else {
                // For other errors, keep current state but stop loading
                console.log('🔐 AuthContext: Network error, keeping current state');
                setIsAuthenticated(false);
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [clearAuthState]);

    const loginWithGoogle = async () => {
        try {
            console.log('🔐 AuthContext: Google login initiated');

            // Get the OAuth URL from backend
            const response = await apiService.getGoogleAuthUrl();

            if (response.oauth_url) {
                // Redirect to Google OAuth
                console.log('🔐 Redirecting to Google OAuth:', response.oauth_url);
                window.location.href = response.oauth_url;
                return true;
            }

            throw new Error('No OAuth URL received from backend');
        } catch (error) {
            console.error('🔐 Google login failed:', error);
            toast.error('Failed to initiate Google login. Please try again.');
            return false;
        }
    };

    const loginWithEmail = async (email, password) => {
        try {
            console.log('🔐 AuthContext: Email login initiated for:', email);
            const response = await apiService.loginWithEmail(email, password);

            if (response.access_token) {
                const success = await login(
                    response.access_token,
                    response.refresh_token,
                    response.user
                );

                // Handle password reset requirement
                if (response.requires_password_reset) {
                    setRequiresPasswordSetup(true);
                }

                return { success, requiresPasswordReset: response.requires_password_reset };
            }

            return { success: false };
        } catch (error) {
            console.error('🔐 Email login failed:', error);
            const errorMessage = error.response?.data?.detail || 'Login failed';
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const createAccountWithEmail = async (email, password, name, licenseNumber) => {
        try {
            console.log('🔐 AuthContext: Creating account with email for:', email);
            const response = await apiService.signupWithEmail({
                email,
                password,
                name,
                license_number: licenseNumber
            });

            if (response.success && response.access_token) {
                const success = await login(
                    response.access_token,
                    response.refresh_token,
                    response.user
                );

                return { success, user: response.user };
            }

            return { success: false, error: response.message || 'Account creation failed' };
        } catch (error) {
            console.error('🔐 Account creation failed:', error);
            const errorMessage = error.response?.data?.detail || 'Failed to create account';
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const setPassword = async (password) => {
        try {
            console.log('🔐 AuthContext: Setting password');
            const response = await apiService.setPassword(password);

            if (response.success) {
                setRequiresPasswordSetup(false);
                setTemporaryPassword(null);
                return { success: true };
            }

            return { success: false, error: response.message || 'Failed to set password' };
        } catch (error) {
            console.error('🔐 Set password failed:', error);
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to set password'
            };
        }
    };

    const completePasswordSetup = () => {
        setRequiresPasswordSetup(false);
        setTemporaryPassword(null);
    };

    const login = async (accessToken, refreshToken, userProfile) => {
        try {
            console.log('🔐 AuthContext: Processing login with tokens and user:', userProfile);

            if (!accessToken || !userProfile) {
                console.error('🔐 AuthContext: Missing required login data');
                return false;
            }

            // Store tokens first
            localStorage.setItem('access_token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }

            // Update state immediately and force re-render
            setIsAuthenticated(true);
            setUser(userProfile);

            // Force another state update to ensure all components re-render
            setTimeout(() => {
                setIsAuthenticated(true);
                setUser(userProfile);
                console.log('🔐 AuthContext: Login state forcefully updated');
            }, 10);

            console.log('🔐 AuthContext: Login successful, state updated');
            return true;
        } catch (error) {
            console.error('🔐 Login processing failed:', error);
            clearAuthState();
            return false;
        }
    };

    const setAuthToken = (token, refreshToken = null) => {
        if (token) {
            console.log('🔐 AuthContext: Setting auth tokens');
            localStorage.setItem('access_token', token);
            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }

            // Trigger auth check after setting tokens
            setTimeout(() => {
                checkAuthStatus();
            }, 100);
        }
    };

    const logout = async () => {
        try {
            console.log('🔐 AuthContext: Logout initiated');

            // Try to call logout endpoint, but don't fail if it doesn't work
            await apiService.logout();
        } catch (error) {
            console.error('🔐 Server logout error:', error);
            // Continue with cleanup even if server logout fails
        } finally {
            console.log('🔐 AuthContext: Clearing auth state on logout');
            clearAuthState();
        }
    };

    const refreshUser = async () => {
        try {
            console.log('🔐 AuthContext: Refreshing user data');
            const userProfile = await apiService.getCurrentUser();
            setUser(userProfile);
            return userProfile;
        } catch (error) {
            console.error('🔐 Failed to refresh user:', error);

            // If user no longer exists, clear auth state
            if (error.response?.status === 401) {
                console.log('🔐 AuthContext: User refresh failed with 401, clearing state');
                clearAuthState();
                if (window.toast) {
                    window.toast.error('Your session has expired. Please sign in again.');
                }
            }

            throw error;
        }
    };

    const connectLicense = async (licenseNumber) => {
        try {
            console.log('🔐 AuthContext: Connecting license:', licenseNumber);
            const response = await apiService.connectLicense(licenseNumber);

            // Update user state with new license
            if (response.user) {
                setUser(prevUser => ({
                    ...prevUser,
                    license_number: response.user.license_number
                }));
            }

            return response;
        } catch (error) {
            console.error('🔐 License connection failed:', error);

            const errorMessage = error.response?.data?.detail || 'Failed to connect license';
            if (window.toast) {
                window.toast.error(errorMessage);
            }

            throw error;
        }
    };

    // Handle authentication errors globally
    const handleAuthError = (error) => {
        if (error.response?.status === 401) {
            const errorMessage = error.response?.data?.detail;

            if (errorMessage === 'User account no longer exists') {
                if (window.toast) {
                    window.toast.error('Your account is no longer available. Please sign in again.');
                }
            } else {
                if (window.toast) {
                    window.toast.error('Your session has expired. Please sign in again.');
                }
            }

            clearAuthState();

            // Redirect to home if not already there
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
    };

    // Force auth check function that can be called from outside
    const forceAuthCheck = useCallback(() => {
        console.log('🔐 AuthContext: Force auth check requested');
        checkAuthStatus();
    }, [checkAuthStatus]);

    const value = {
        // Auth state
        isAuthenticated,
        user,
        isLoading,

        // Password setup state
        requiresPasswordSetup,
        temporaryPassword,

        // Auth functions
        login,
        loginWithGoogle,
        loginWithEmail,
        createAccountWithEmail,
        logout,
        refreshUser,
        connectLicense,
        checkAuthStatus,
        forceAuthCheck,
        clearAuthState,
        handleAuthError,
        setIsAuthenticated,
        setUser,
        setAuthToken,

        // Password management functions
        setPassword,
        completePasswordSetup
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};