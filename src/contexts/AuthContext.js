// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            setLoading(true);

            // Check if we have tokens in localStorage
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (accessToken) {
                // Verify token is valid by making a test API call
                try {
                    const userProfile = await apiService.getCurrentUser();
                    setUser(userProfile);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token is invalid, try to refresh
                    if (refreshToken) {
                        try {
                            await refreshAccessToken(refreshToken);
                        } catch (refreshError) {
                            // Refresh failed, clear tokens
                            clearAuthData();
                        }
                    } else {
                        clearAuthData();
                    }
                }
            } else {
                // Check URL params for tokens (from OAuth callback)
                const urlParams = new URLSearchParams(window.location.search);
                const urlAccessToken = urlParams.get('access_token');
                const urlRefreshToken = urlParams.get('refresh_token');
                const licenseNumber = urlParams.get('license_number');

                if (urlAccessToken) {
                    // Store tokens and get user info
                    localStorage.setItem('access_token', urlAccessToken);
                    if (urlRefreshToken) {
                        localStorage.setItem('refresh_token', urlRefreshToken);
                    }

                    try {
                        const userProfile = await apiService.getCurrentUser();
                        setUser(userProfile);
                        setIsAuthenticated(true);

                        // Clean up URL params
                        window.history.replaceState({}, document.title, window.location.pathname);

                        // If we have a license number, redirect to dashboard
                        if (licenseNumber) {
                            window.location.href = `/dashboard/${licenseNumber}`;
                        }
                    } catch (error) {
                        clearAuthData();
                    }
                }
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshAccessToken = async (refreshToken) => {
        try {
            const response = await apiService.refreshToken(refreshToken);

            localStorage.setItem('access_token', response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
            }

            const userProfile = await apiService.getCurrentUser();
            setUser(userProfile);
            setIsAuthenticated(true);

            return response.access_token;
        } catch (error) {
            throw error;
        }
    };

    const clearAuthData = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const loginWithGoogle = async () => {
        try {
            const response = await apiService.getGoogleAuthUrl();
            window.location.href = response.auth_url;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    const loginWithEmail = async (email, password) => {
        try {
            const response = await apiService.loginWithEmail(email, password);

            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);

            setUser(response.user);
            setIsAuthenticated(true);

            return response;
        } catch (error) {
            console.error('Email login error:', error);
            throw error;
        }
    };

    const createAccountWithEmail = async (accountData) => {
        try {
            const response = await apiService.createAccountForPayment(accountData);

            if (response.success && response.access_token) {
                localStorage.setItem('access_token', response.access_token);
                if (response.refresh_token) {
                    localStorage.setItem('refresh_token', response.refresh_token);
                }

                setUser(response.user);
                setIsAuthenticated(true);
            }

            return response;
        } catch (error) {
            console.error('Account creation error:', error);
            throw error;
        }
    };

    const connectLicense = async (licenseNumber) => {
        try {
            const response = await apiService.connectLicense(licenseNumber);

            // Update user with license info
            setUser(prev => ({
                ...prev,
                license_number: licenseNumber,
                ...response.user
            }));

            return response;
        } catch (error) {
            console.error('License connection error:', error);
            throw error;
        }
    };

    const logout = () => {
        clearAuthData();
        window.location.href = '/';
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        loginWithGoogle,
        loginWithEmail,
        createAccountWithEmail,
        connectLicense,
        logout,
        refreshAccessToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};