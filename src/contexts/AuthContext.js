// src/contexts/AuthContext.js - Enhanced with automatic logout after 1 hour of inactivity
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

// Auto-logout configuration
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout

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

    // Auto-logout state
    const [showInactivityWarning, setShowInactivityWarning] = useState(false);
    const inactivityTimer = useRef(null);
    const warningTimer = useRef(null);
    const lastActivity = useRef(Date.now());

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

    // Clear all timers
    const clearTimers = useCallback(() => {
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
            inactivityTimer.current = null;
        }
        if (warningTimer.current) {
            clearTimeout(warningTimer.current);
            warningTimer.current = null;
        }
        setShowInactivityWarning(false);
    }, []);

    // Handle automatic logout due to inactivity
    const handleInactivityLogout = useCallback(async () => {
        console.log('🔐 AuthContext: Auto-logout due to inactivity');

        clearTimers();

        try {
            await logout();
            toast.error('You have been logged out due to inactivity.');
        } catch (error) {
            console.error('Auto-logout error:', error);
            // Force logout even if server call fails
            clearAuthState();
            toast.error('Session expired. Please sign in again.');
        }

        // Redirect to home page
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }, []);

    // Show inactivity warning
    const showInactivityWarningDialog = useCallback(() => {
        console.log('🔐 AuthContext: Showing inactivity warning');
        setShowInactivityWarning(true);

        // Set timer for final logout
        inactivityTimer.current = setTimeout(() => {
            handleInactivityLogout();
        }, WARNING_TIME);
    }, [handleInactivityLogout]);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        if (!isAuthenticated) return;

        lastActivity.current = Date.now();

        // Clear existing timers
        clearTimers();

        // Set warning timer (logout time minus warning time)
        warningTimer.current = setTimeout(() => {
            showInactivityWarningDialog();
        }, INACTIVITY_TIMEOUT - WARNING_TIME);

        console.log('🔐 AuthContext: Inactivity timer reset');
    }, [isAuthenticated, clearTimers, showInactivityWarningDialog]);

    // Extend session (called when user dismisses warning)
    const extendSession = useCallback(() => {
        console.log('🔐 AuthContext: Session extended by user');
        setShowInactivityWarning(false);
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    // Track user activity
    useEffect(() => {
        if (!isAuthenticated) {
            clearTimers();
            return;
        }

        const activityEvents = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        const throttledResetTimer = (() => {
            let timeoutId;
            return () => {
                if (timeoutId) return; // Throttle to once per second

                timeoutId = setTimeout(() => {
                    resetInactivityTimer();
                    timeoutId = null;
                }, 1000);
            };
        })();

        // Add event listeners for user activity
        activityEvents.forEach(event => {
            document.addEventListener(event, throttledResetTimer, { passive: true });
        });

        // Initial timer setup
        resetInactivityTimer();

        // Cleanup
        return () => {
            activityEvents.forEach(event => {
                document.removeEventListener(event, throttledResetTimer);
            });
            clearTimers();
        };
    }, [isAuthenticated, resetInactivityTimer, clearTimers]);

    // Make auth context globally available for API interceptors
    useEffect(() => {
        window.authContext = {
            setIsAuthenticated,
            setUser,
            clearAuthState: () => clearAuthState(),
            checkAuthStatus: () => checkAuthStatus(),
            resetInactivityTimer
        };

        // Cleanup on unmount
        return () => {
            delete window.authContext;
        };
    }, [resetInactivityTimer]);

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
                if (isAuthenticated) {
                    resetInactivityTimer(); // Reset timer when tab becomes active
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isAuthenticated, resetInactivityTimer]);

    // Log auth state changes for debugging
    useEffect(() => {
        logAuthChange('State Changed');
    }, [isAuthenticated, user, isLoading, logAuthChange]);

    const clearAuthState = useCallback(() => {
        console.log('🔐 AuthContext: Clearing authentication state');

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        setIsAuthenticated(false);
        setUser(null);
        setRequiresPasswordSetup(false);
        setTemporaryPassword(null);

        // Clear inactivity timers
        clearTimers();
    }, [clearTimers]);

    const checkAuthStatus = useCallback(async () => {
        console.log('🔐 AuthContext: Checking authentication status');

        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
            console.log('🔐 AuthContext: No access token found');
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            clearTimers();
            return;
        }

        try {
            setIsLoading(true);
            const { apiService } = await import('../services/api');
            const userProfile = await apiService.getCurrentUser();

            console.log('🔐 AuthContext: User authenticated successfully');
            setIsAuthenticated(true);
            setUser(userProfile);

            // Start inactivity timer for authenticated users
            resetInactivityTimer();

        } catch (error) {
            console.error('🔐 AuthContext: Authentication check failed:', error);
            clearAuthState();
        } finally {
            setIsLoading(false);
        }
    }, [clearAuthState, resetInactivityTimer]);

    const forceAuthCheck = useCallback(() => {
        console.log('🔐 AuthContext: Forcing authentication check');
        checkAuthStatus();
    }, [checkAuthStatus]);

    const connectLicense = async (licenseNumber) => {
        try {
            console.log('🔐 AuthContext: Connecting license', licenseNumber);
            const response = await apiService.connectLicense(licenseNumber);

            if (response.success) {
                // Refresh user data to get updated license info
                await refreshUser();
                return { success: true };
            }

            return { success: false, error: response.message || 'Failed to connect license' };
        } catch (error) {
            console.error('🔐 Connect license failed:', error);
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to connect license'
            };
        }
    };

    const signupWithPasscode = async (email, name, passcode) => {
        try {
            console.log('🔐 AuthContext: Signing up with passcode');
            const response = await apiService.signupWithPasscode(email, name, passcode);

            if (response.success) {
                if (response.requires_password_setup) {
                    setRequiresPasswordSetup(true);
                    setTemporaryPassword(response.temporary_password);
                }
                return { success: true, data: response };
            }

            return { success: false, error: response.message || 'Failed to create account' };
        } catch (error) {
            console.error('🔐 Signup failed:', error);
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

            // Start inactivity timer
            resetInactivityTimer();

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

    return (
        <AuthContext.Provider value={{
            // Auth state
            isAuthenticated,
            user,
            isLoading,

            // Password setup state
            requiresPasswordSetup,
            temporaryPassword,

            // Inactivity state
            showInactivityWarning,

            // Auth methods
            login,
            logout,
            checkAuthStatus,
            forceAuthCheck,
            clearAuthState,
            setAuthToken,
            refreshUser,

            // Account creation
            connectLicense,
            signupWithPasscode,
            setPassword,
            completePasswordSetup,

            // Inactivity methods
            extendSession,
            resetInactivityTimer
        }}>
            {children}
        </AuthContext.Provider>
    );
};