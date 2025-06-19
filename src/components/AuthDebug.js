// src/components/AuthDebug.js - Debug component for authentication issues
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthDebug = () => {
    const { isAuthenticated, user, clearAuthState } = useAuth();
    const [debugInfo, setDebugInfo] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show in development
        if (process.env.NODE_ENV === 'development') {
            updateDebugInfo();
        }
    }, [isAuthenticated, user]);

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
            userLicense: user?.license_number,
            timestamp: new Date().toISOString()
        });
    };

    const testAuthStatus = async () => {
        try {
            const response = await apiService.getCurrentUser();
            toast.success('Auth test successful');
            console.log('Auth test response:', response);
        } catch (error) {
            toast.error(`Auth test failed: ${error.response?.data?.detail || error.message}`);
            console.error('Auth test error:', error);
        }
    };

    const clearTokens = () => {
        clearAuthState();
        updateDebugInfo();
        toast.success('Tokens cleared');
    };

    const checkTokenValidity = async () => {
        try {
            const authStatus = await apiService.checkAuthStatus();
            toast.success(`Token valid: ${authStatus.isAuthenticated}`);
            console.log('Token check:', authStatus);
        } catch (error) {
            toast.error(`Token check failed: ${error.message}`);
            console.error('Token check error:', error);
        }
    };

    // Only render in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-mono hover:bg-red-700"
            >
                🐛 Auth Debug
            </button>

            {isVisible && (
                <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800">Authentication Debug</h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-2 text-sm font-mono">
                        <div className="grid grid-cols-2 gap-2">
                            <span className="text-gray-600">Auth State:</span>
                            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                                {isAuthenticated ? 'TRUE' : 'FALSE'}
                            </span>

                            <span className="text-gray-600">Access Token:</span>
                            <span className={debugInfo.hasAccessToken ? 'text-green-600' : 'text-red-600'}>
                                {debugInfo.hasAccessToken ? `${debugInfo.accessTokenLength} chars` : 'NONE'}
                            </span>

                            <span className="text-gray-600">Refresh Token:</span>
                            <span className={debugInfo.hasRefreshToken ? 'text-green-600' : 'text-red-600'}>
                                {debugInfo.hasRefreshToken ? 'EXISTS' : 'NONE'}
                            </span>

                            <span className="text-gray-600">User Object:</span>
                            <span className={debugInfo.userExists ? 'text-green-600' : 'text-red-600'}>
                                {debugInfo.userExists ? 'EXISTS' : 'NULL'}
                            </span>

                            <span className="text-gray-600">Email:</span>
                            <span className="text-blue-600 break-all">
                                {debugInfo.userEmail || 'N/A'}
                            </span>

                            <span className="text-gray-600">License:</span>
                            <span className="text-blue-600">
                                {debugInfo.userLicense || 'N/A'}
                            </span>
                        </div>

                        <div className="border-t pt-2 mt-3">
                            <div className="space-y-2">
                                <button
                                    onClick={testAuthStatus}
                                    className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                                >
                                    Test /api/auth/me
                                </button>

                                <button
                                    onClick={checkTokenValidity}
                                    className="w-full bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                >
                                    Check Token Validity
                                </button>

                                <button
                                    onClick={clearTokens}
                                    className="w-full bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                >
                                    Clear All Tokens
                                </button>

                                <button
                                    onClick={updateDebugInfo}
                                    className="w-full bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                                >
                                    Refresh Debug Info
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 border-t pt-2">
                            Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthDebug;