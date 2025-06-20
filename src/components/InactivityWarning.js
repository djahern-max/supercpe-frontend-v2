// src/components/InactivityWarning.js - Modal to warn users before auto-logout
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const InactivityWarning = () => {
    const { showInactivityWarning, extendSession } = useAuth();
    const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

    useEffect(() => {
        if (!showInactivityWarning) {
            setCountdown(300);
            return;
        }

        // Start countdown when warning is shown
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showInactivityWarning]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleStayLoggedIn = () => {
        extendSession();
    };

    if (!showInactivityWarning) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '480px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e5e7eb'
            }}>
                {/* Warning Icon */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: '32px'
                }}>
                    ⚠️
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '16px',
                    lineHeight: '1.25'
                }}>
                    Session Timeout Warning
                </h2>

                {/* Message */}
                <p style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    marginBottom: '24px',
                    lineHeight: '1.5'
                }}>
                    You've been inactive for a while. For your security, you'll be automatically
                    logged out in <strong style={{ color: '#dc2626' }}>{formatTime(countdown)}</strong>.
                </p>

                {/* Countdown Progress Bar */}
                <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    marginBottom: '24px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        backgroundColor: countdown > 60 ? '#3b82f6' : '#dc2626',
                        width: `${(countdown / 300) * 100}%`,
                        transition: 'width 1s linear, background-color 0.3s ease',
                        borderRadius: '4px'
                    }} />
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={handleStayLoggedIn}
                        style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            minWidth: '140px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                        Stay Logged In
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minWidth: '120px'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.borderColor = '#9ca3af';
                            e.target.style.color = '#4b5563';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.color = '#6b7280';
                        }}
                    >
                        Logout Now
                    </button>
                </div>

                {/* Additional Info */}
                <p style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginTop: '20px',
                    lineHeight: '1.4'
                }}>
                    This helps protect your account when you're away from your computer.
                </p>
            </div>
        </div>
    );
};

export default InactivityWarning;