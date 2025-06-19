// src/components/AuthDebug.js - Temporary debug component
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebug = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const [debugInfo, setDebugInfo] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show in development
        if (process.env.NODE_ENV === 'development') {
            updateDebugInfo();
        }
    }, [isAuthenticated, user, isLoading]);

    const updateDebugInfo = () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        setDebugInfo({
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            accessTokenLength: accessToken ? accessToken.length : 0,
            isAuthenticated,
            userExists: !!user,
            userEmail: user?.email,
            userName: user?.name,
            userLicense: user?.license_number,
            isLoading,
            timestamp: new Date().toLocaleTimeString()
        });
    };

    // Only render in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            fontFamily: 'monospace',
            fontSize: '12px'
        }}>
            <button
                onClick={() => setIsVisible(!isVisible)}
                style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '8px'
                }}
            >
                🐛 Auth Debug
            </button>

            {isVisible && (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: '#00ff00',
                    padding: '12px',
                    borderRadius: '4px',
                    minWidth: '300px',
                    whiteSpace: 'pre-wrap'
                }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffff00' }}>
                        Auth State Debug ({debugInfo.timestamp})
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                        <span>Loading:</span>
                        <span style={{ color: debugInfo.isLoading ? '#ff6b6b' : '#51cf66' }}>
                            {debugInfo.isLoading ? 'TRUE' : 'FALSE'}
                        </span>

                        <span>Authenticated:</span>
                        <span style={{ color: debugInfo.isAuthenticated ? '#51cf66' : '#ff6b6b' }}>
                            {debugInfo.isAuthenticated ? 'TRUE' : 'FALSE'}
                        </span>

                        <span>Access Token:</span>
                        <span style={{ color: debugInfo.hasAccessToken ? '#51cf66' : '#ff6b6b' }}>
                            {debugInfo.hasAccessToken ? `${debugInfo.accessTokenLength} chars` : 'NONE'}
                        </span>

                        <span>Refresh Token:</span>
                        <span style={{ color: debugInfo.hasRefreshToken ? '#51cf66' : '#ff6b6b' }}>
                            {debugInfo.hasRefreshToken ? 'EXISTS' : 'NONE'}
                        </span>

                        <span>User Object:</span>
                        <span style={{ color: debugInfo.userExists ? '#51cf66' : '#ff6b6b' }}>
                            {debugInfo.userExists ? 'EXISTS' : 'NULL'}
                        </span>

                        {debugInfo.userEmail && (
                            <>
                                <span>Email:</span>
                                <span style={{ color: '#74c0fc' }}>{debugInfo.userEmail}</span>
                            </>
                        )}

                        {debugInfo.userName && (
                            <>
                                <span>Name:</span>
                                <span style={{ color: '#74c0fc' }}>{debugInfo.userName}</span>
                            </>
                        )}

                        {debugInfo.userLicense && (
                            <>
                                <span>License:</span>
                                <span style={{ color: '#74c0fc' }}>{debugInfo.userLicense}</span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            console.log('Full Auth Debug Info:', debugInfo);
                            console.log('LocalStorage tokens:', {
                                access: localStorage.getItem('access_token'),
                                refresh: localStorage.getItem('refresh_token')
                            });
                        }}
                        style={{
                            background: '#495057',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            marginTop: '8px',
                            fontSize: '10px'
                        }}
                    >
                        Log to Console
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthDebug;