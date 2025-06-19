// src/contexts/AuthContext.js - Fixed with missing functions
import React, { createContext, useContext, useState, useEffect } from 'react';
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

    // Make auth context globally available for API interceptors
    useEffect(() => {
        window.authContext = {
            setIsAuthenticated,
            setUser
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

    // Check authentication status on app load
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        setIsLoading(true);

        const accessToken = localStorage.getItem('access_token');

        // If no token, user is not authenticated
        if (!accessToken) {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            // Try to get current user if we have a token
            const userProfile = await apiService.getCurrentUser();
            setIsAuthenticated(true);
            setUser(userProfile);
        } catch (error) {
            console.error('Auth check failed:', error);

            // If we get a 401, it means the token is invalid
            if (error.response?.status === 401) {
                console.log('Token invalid, clearing auth state');
                clearAuthState();
            } else {
                // For other errors, just log them but don't clear auth
                console.log('Auth check error (non-401):', error.message);
                setIsAuthenticated(false);
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearAuthState = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    // MISSING FUNCTION 1: loginWithGoogle
    const loginWithGoogle = async () => {
        try {
            const authData = await apiService.getGoogleAuthUrl();

            if (authData && authData.auth_url) {
                // Redirect to Google OAuth
                window.location.href = authData.auth_url;
            } else {
                throw new Error('Invalid auth URL received');
            }
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    // MISSING FUNCTION 2: createAccountWithEmail  
    const createAccountWithEmail = async (userData) => {
        try {
            const response = await apiService.createAccountWithEmail(userData);

            if (response.success && response.access_token) {
                // Store tokens and update auth state
                localStorage.setItem('access_token', response.access_token);
                if (response.refresh_token) {
                    localStorage.setItem('refresh_token', response.refresh_token);
                }

                setIsAuthenticated(true);
                setUser(response.user);
            }

            return response;
        } catch (error) {
            console.error('Account creation error:', error);
            throw error;
        }
    };

    const login = async (accessToken, refreshToken, userProfile) => {
        try {
            // Store tokens
            localStorage.setItem('access_token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }

            // Update state
            setIsAuthenticated(true);
            setUser(userProfile);

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            clearAuthState();
            return false;
        }
    };

    const logout = async () => {
        try {
            // Try to call logout endpoint, but don't fail if it doesn't work
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with cleanup even if server logout fails
        } finally {
            clearAuthState();
        }
    };

    const refreshUser = async () => {
        try {
            const userProfile = await apiService.getCurrentUser();
            setUser(userProfile);
            return userProfile;
        } catch (error) {
            console.error('Failed to refresh user:', error);

            // If user no longer exists, clear auth state
            if (error.response?.status === 401) {
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
            console.error('License connection failed:', error);

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

    const value = {
        isAuthenticated,
        user,
        isLoading,
        login,
        loginWithGoogle,        // ADDED: Missing function
        createAccountWithEmail, // ADDED: Missing function
        logout,
        refreshUser,
        connectLicense,
        checkAuthStatus,
        clearAuthState,
        handleAuthError,
        setIsAuthenticated,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};