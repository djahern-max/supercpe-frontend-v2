// src/pages/AuthCallback.js - OAuth callback handler
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setIsAuthenticated, setUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');
            const licenseNumber = searchParams.get('license_number');
            const error = searchParams.get('error');

            if (error) {
                toast.error('Authentication failed. Please try again.');
                navigate('/');
                return;
            }

            if (accessToken) {
                // Store tokens
                localStorage.setItem('access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refresh_token', refreshToken);
                }

                try {
                    // Get user profile
                    const { apiService } = await import('../services/api');
                    const userProfile = await apiService.getCurrentUser();

                    setUser(userProfile);
                    setIsAuthenticated(true);

                    toast.success('Successfully signed in!');

                    // Redirect to dashboard if we have license number, otherwise home
                    if (licenseNumber) {
                        navigate(`/dashboard/${licenseNumber}`);
                    } else {
                        navigate('/');
                    }
                } catch (error) {
                    console.error('Failed to get user profile:', error);
                    toast.error('Authentication failed. Please try again.');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate('/');
                }
            } else {
                toast.error('Authentication failed. Please try again.');
                navigate('/');
            }
        };

        handleCallback();
    }, [searchParams, navigate, setIsAuthenticated, setUser]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div style={{
                width: '2rem',
                height: '2rem',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <p>Completing sign in...</p>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AuthCallback;