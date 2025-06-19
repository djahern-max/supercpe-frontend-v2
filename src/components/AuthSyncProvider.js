// src/components/AuthSyncProvider.js - Component to ensure auth state is synchronized
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthSyncProvider = ({ children }) => {
    const { forceAuthCheck, isAuthenticated, user, isLoading } = useAuth();

    useEffect(() => {
        // Force an auth check when the component mounts
        const accessToken = localStorage.getItem('access_token');

        console.log('🔄 AuthSyncProvider: Initial mount check', {
            hasToken: !!accessToken,
            isAuthenticated,
            hasUser: !!user,
            isLoading
        });

        if (accessToken && !isAuthenticated && !isLoading) {
            console.log('🔄 AuthSyncProvider: Found token but not authenticated, forcing check');
            setTimeout(() => {
                forceAuthCheck();
            }, 100);
        }

        // Also check when the window regains focus
        const handleFocus = () => {
            const token = localStorage.getItem('access_token');
            if (token && !user && !isLoading) {
                console.log('🔄 AuthSyncProvider: Window focus - checking auth state');
                forceAuthCheck();
            }
        };

        // Check when localStorage changes (useful for multi-tab scenarios)
        const handleStorageChange = (e) => {
            if (e.key === 'access_token') {
                console.log('🔄 AuthSyncProvider: Access token changed in localStorage');
                if (e.newValue && !isAuthenticated) {
                    forceAuthCheck();
                } else if (!e.newValue && isAuthenticated) {
                    // Token was removed, clear auth state
                    console.log('🔄 AuthSyncProvider: Token removed, clearing auth state');
                    // The auth context should handle this automatically
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [forceAuthCheck, isAuthenticated, user, isLoading]);

    return children;
};

export default AuthSyncProvider;