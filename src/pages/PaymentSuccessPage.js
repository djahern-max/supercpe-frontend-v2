// Create this file: src/pages/PaymentSuccessPage.js

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        const handlePaymentSuccess = async () => {
            if (!sessionId) {
                setStatus('error');
                toast.error('No payment session found');
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            try {
                // Give Stripe webhooks a moment to process
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Show success and redirect to dashboard
                setStatus('success');
                toast.success('🎉 Subscription activated successfully!');

                // Redirect to dashboard after showing success message
                setTimeout(() => {
                    // Try to get the license number from localStorage or other state
                    const lastLicenseNumber = localStorage.getItem('lastViewedLicense') ||
                        sessionStorage.getItem('currentLicense');

                    if (lastLicenseNumber) {
                        navigate(`/dashboard/${lastLicenseNumber}`);
                    } else {
                        // Fallback to home page
                        navigate('/');
                    }
                }, 3000);

            } catch (error) {
                console.error('Payment processing error:', error);
                setStatus('error');
                toast.error('Payment verification failed. Please contact support.');
                setTimeout(() => navigate('/'), 5000);
            }
        };

        handlePaymentSuccess();
    }, [sessionId, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '48px 32px',
                textAlign: 'center',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                {status === 'processing' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#dbeafe',
                            borderRadius: '50%'
                        }}>
                            <Loader size={32} color="#3b82f6" className="animate-spin" />
                        </div>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#111827',
                            marginBottom: '12px'
                        }}>
                            Processing Your Payment...
                        </h1>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '16px',
                            lineHeight: '1.5'
                        }}>
                            Please wait while we confirm your subscription and set up your account.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#dcfce7',
                            borderRadius: '50%'
                        }}>
                            <CheckCircle size={32} color="#16a34a" />
                        </div>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#111827',
                            marginBottom: '12px'
                        }}>
                            🎉 Payment Successful!
                        </h1>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '16px',
                            lineHeight: '1.5',
                            marginBottom: '24px'
                        }}>
                            Your SuperCPE Professional subscription has been activated. You now have unlimited uploads and access to all premium features.
                        </p>
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '24px'
                        }}>
                            <p style={{
                                color: '#166534',
                                fontSize: '14px',
                                margin: 0
                            }}>
                                Redirecting you to your dashboard...
                            </p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fef2f2',
                            borderRadius: '50%'
                        }}>
                            <X size={32} color="#dc2626" />
                        </div>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#111827',
                            marginBottom: '12px'
                        }}>
                            Payment Processing Issue
                        </h1>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '16px',
                            lineHeight: '1.5'
                        }}>
                            There was an issue processing your payment. Please contact support if you were charged.
                        </p>
                    </>
                )}

                <div style={{
                    marginTop: '32px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#6b7280'
                }}>
                    Session ID: {sessionId ? `${sessionId.substring(0, 20)}...` : 'Not found'}
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;