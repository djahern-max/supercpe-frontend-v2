// src/components/compliance/QuickSignupModal.js - Fixed Google OAuth to preserve license
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Mail, User, Shield, Check, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/components/QuickSignupModal.module.css';

const QuickSignupModal = ({
    licenseNumber,
    cpaName,
    cpaData,
    onClose,
    onSuccess,
    isPasscodeVerified = false
}) => {
    const [step, setStep] = useState('method');
    const [email, setEmail] = useState('');
    const [name, setName] = useState(cpaName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { loginWithGoogle, createAccountWithEmail, setAuthToken } = useAuth();

    const handleGoogleSignup = async () => {
        try {
            setIsSubmitting(true);

            // CRITICAL FIX: Store license data for OAuth callback to use
            if (isPasscodeVerified && cpaData) {
                console.log('Storing license data for OAuth flow:', {
                    license: cpaData.license_number,
                    name: cpaData.full_name
                });

                // Store the license information in sessionStorage so AuthCallback can find it
                sessionStorage.setItem('pending_license_link', cpaData.license_number);
                sessionStorage.setItem('pending_cpa_name', cpaData.full_name);

                // Also store that this came from passcode verification
                sessionStorage.setItem('oauth_from_passcode', 'true');
            }

            await loginWithGoogle();
            // Google OAuth will redirect, so we don't need to handle success here
        } catch (error) {
            console.error('Google signup error:', error);
            toast.error('Google signup failed. Please try again.');
            setIsSubmitting(false);

            // Clear the stored license data if OAuth fails
            sessionStorage.removeItem('pending_license_link');
            sessionStorage.removeItem('pending_cpa_name');
            sessionStorage.removeItem('oauth_from_passcode');
        }
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();

        // ADD DEBUG LOGGING HERE - Right at the start
        console.log('=== DEBUG: QuickSignupModal handleEmailSignup ===');
        console.log('Debug info:', {
            isPasscodeVerified,
            cpaData,
            hasPasscode: !!cpaData?.passcode,
            willUsePasscodeFlow: isPasscodeVerified && cpaData?.passcode,
            licenseNumber,
            email: email.trim(),
            name: name.trim()
        });

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        setIsSubmitting(true);

        try {
            let result;

            if (isPasscodeVerified && cpaData?.passcode) {
                // ADD MORE DEBUG LOGGING HERE - Right before the API call
                console.log('Using passcode flow - making request to:', '/api/auth/signup-with-passcode');
                console.log('Request body:', {
                    email: email.trim(),
                    name: name.trim(),
                    passcode: cpaData.passcode,
                });

                // New passcode-based signup
                const response = await fetch('/api/auth/signup-with-passcode', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        name: name.trim(),
                        passcode: cpaData.passcode,
                    }),
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Success response data:', data);
                    setAuthToken(data.access_token);
                    result = { success: true };
                } else {
                    const errorData = await response.json();
                    console.error('Passcode signup error:', errorData);
                    result = { success: false, error: errorData.detail || 'Signup failed' };
                }
            } else {
                // Fallback to original flow if passcode not verified
                console.warn('Passcode not verified, using fallback signup');
                result = await createAccountWithEmail({
                    email: email.trim(),
                    name: name.trim(),
                    license_number: licenseNumber
                });
            }

            if (result.success) {
                setStep('success');
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                toast.error(result.error || 'Failed to create account. Please try again.');
            }

        } catch (error) {
            console.error('Email signup error:', error);
            toast.error('Account creation failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        // Clean up any stored OAuth data when modal is closed
        sessionStorage.removeItem('pending_license_link');
        sessionStorage.removeItem('pending_cpa_name');
        sessionStorage.removeItem('oauth_from_passcode');
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    {step === 'email' && (
                        <button
                            onClick={() => setStep('method')}
                            className={styles.backButton}
                            disabled={isSubmitting}
                        >
                            ← Back
                        </button>
                    )}
                    <h2 className={styles.modalTitle}>
                        {step === 'method' ? 'Create Your Free Account' :
                            step === 'email' ? 'Create Account' : 'Welcome!'}
                    </h2>
                    <button
                        onClick={closeModal}
                        className={styles.closeButton}
                        disabled={isSubmitting}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.modalBody}>
                    {step === 'method' && (
                        <>
                            <p className={styles.subtitle}>
                                Sign up to securely upload and track your CPE certificates
                            </p>

                            {/* Benefits */}
                            <div className={styles.benefits}>
                                <div className={styles.benefit}>
                                    <Check className={styles.checkIcon} />
                                    <span>10 free uploads with full functionality</span>
                                </div>
                                <div className={styles.benefit}>
                                    <Check className={styles.checkIcon} />
                                    <span>Secure cloud storage & AI analysis</span>
                                </div>
                                <div className={styles.benefit}>
                                    <Check className={styles.checkIcon} />
                                    <span>Professional compliance reports</span>
                                </div>
                            </div>

                            {/* Sign up options */}
                            <div className={styles.signupOptions}>
                                {/* Google Signup */}
                                <Button
                                    onClick={handleGoogleSignup}
                                    variant="outline"
                                    disabled={isSubmitting}
                                    loading={isSubmitting}
                                    className={styles.googleButton}
                                >
                                    <Mail size={16} />
                                    Continue with Google
                                </Button>

                                <div className={styles.divider}>
                                    <span>or</span>
                                </div>

                                {/* Email Signup */}
                                <Button
                                    onClick={() => setStep('email')}
                                    variant="primary"
                                    disabled={isSubmitting}
                                    className={styles.emailButton}
                                >
                                    <User size={16} />
                                    Continue with Email
                                </Button>
                            </div>

                            {/* License info */}
                            {licenseNumber && (
                                <div className={styles.licenseInfo}>
                                    <div className={styles.licenseCard}>
                                        <div className={styles.licenseDetails}>
                                            <strong>{cpaName}</strong>
                                            <br />
                                            <span>License: {licenseNumber}</span>
                                        </div>
                                        <Shield className={styles.licenseIcon} />
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className={styles.modalFooter}>
                                <div className={styles.securityInfo}>
                                    <Shield size={16} />
                                    <span>Secure & Encrypted</span>
                                </div>
                                <div className={styles.securityInfo}>
                                    <Check size={16} />
                                    <span>No Credit Card Required</span>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 'email' && (
                        <>
                            <p className={styles.subtitle}>
                                Enter your details to get started
                            </p>

                            <form onSubmit={handleEmailSignup} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="email" className={styles.label}>
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={styles.input}
                                        placeholder="your.email@example.com"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>

                                <div className={styles.inputGroup}>
                                    <label htmlFor="name" className={styles.label}>
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={styles.input}
                                        placeholder="Your full name"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting || !email || !name}
                                    loading={isSubmitting}
                                    className={styles.submitButton}
                                >
                                    Create Account <ArrowRight size={16} />
                                </Button>
                            </form>

                            {/* License verification display */}
                            {licenseNumber && (
                                <div className={styles.verificationInfo}>
                                    <Shield size={16} />
                                    <span>Verified access for license {licenseNumber}</span>
                                </div>
                            )}

                            {/* Footer */}
                            <div className={styles.modalFooter}>
                                <div className={styles.securityInfo}>
                                    <Shield size={16} />
                                    <span>Secure & Encrypted</span>
                                </div>
                                <div className={styles.securityInfo}>
                                    <Check size={16} />
                                    <span>No Credit Card Required</span>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 'success' && (
                        <div className={styles.successContent}>
                            <div className={styles.successIcon}>
                                <Check size={48} />
                            </div>
                            <h3>Account Created Successfully!</h3>
                            <p>Welcome to SuperCPE. Redirecting you to your dashboard...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickSignupModal;