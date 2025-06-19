// src/hooks/useAuthSync.js - Hook to ensure authentication state is synchronized
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

/**
 * Hook to ensure authentication state is properly synchronized
 * This is especially important for dashboard pages where users should be authenticated
 */
export const useAuthSync = () => {
    const { isAuthenticated, user, isLoading, forceAuthCheck } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        const isDashboardPage = location.pathname.includes('/dashboard/');

        console.log('🔄 useAuthSync: Checking sync requirements', {
            hasToken: !!accessToken,
            isAuthenticated,
            hasUser: !!user,
            isLoading,
            isDashboardPage,
            currentPath: location.pathname
        });

        // If we're on a dashboard page but not authenticated, or we have a token but no user
        if (accessToken && (!isAuthenticated || !user) && !isLoading) {
            console.log('🔄 useAuthSync: Forcing auth check due to inconsistent state');
            forceAuthCheck();
        }

        // If we're on a dashboard page without a token, something's wrong
        if (isDashboardPage && !accessToken && !isLoading) {
            console.log('🔄 useAuthSync: Dashboard page without token, redirecting to home');
            window.location.href = '/';
        }

    }, [isAuthenticated, user, isLoading, location.pathname, forceAuthCheck]);

    // Return current auth state for convenience
    return { isAuthenticated, user, isLoading };
};