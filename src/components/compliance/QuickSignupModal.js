// src/components/compliance/QuickSignupModal.js - Fixed version
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Mail, User, Shield, Check, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/components/QuickSignupModal.module.css';

const QuickSignupModal = ({
    licenseNumber,
    cpaName,
    cpaData,  // Add this prop
    onClose,
    onSuccess,
    isPasscodeVerified = false  // Add this prop for passcode flow
}) => {
    const [step, setStep] = useState('method'); // 'method', 'email', 'success'
    const [email, setEmail] = useState('');
    const [name, setName] = useState(cpaName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { loginWithGoogle, createAccountWithEmail, setAuthToken } = useAuth();  // Add setAuthToken

    const handleGoogleSignup = async () => {
        try {
            setIsSubmitting(true);
            await loginWithGoogle();
            // Google OAuth will redirect, so we don't need to handle success here
        } catch (error) {
            console.error('Google signup error:', error);
            toast.error('Google signup failed. Please try again.');
            setIsSubmitting(false);
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
            console.error('Account creation error:', error);
            toast.error('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToMethod = () => {
        setStep('method');
        setEmail('');
        setName(cpaName || '');
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

                {step === 'method' && (
                    <>
                        {/* Header */}
                        <div className={styles.modalHeader}>
                            <div className={styles.iconWrapper}>
                                <Shield className={styles.headerIcon} />
                            </div>
                            <h2>Create Your Free Account</h2>
                            <p>Sign up to securely upload and track your CPE certificates</p>
                        </div>

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
                    </>
                )}

                {step === 'email' && (
                    <>
                        {/* Email signup form */}
                        <div className={styles.modalHeader}>
                            <button onClick={handleBackToMethod} className={styles.backButton}>
                                ← Back
                            </button>
                            <h2>Create Account</h2>
                            <p>Enter your details to get started</p>
                        </div>

                        <form onSubmit={handleEmailSignup} className={styles.emailForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSubmitting || !email || !name}
                                loading={isSubmitting}
                                className={styles.submitButton}
                            >
                                Create Account
                                <ArrowRight size={16} />
                            </Button>
                        </form>

                        {/* License verification note */}
                        <div className={styles.verificationNote}>
                            <Shield size={16} />
                            <span>
                                {isPasscodeVerified
                                    ? `Verified access for license ${licenseNumber}`
                                    : `We'll verify your account with license ${licenseNumber}`
                                }
                            </span>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <>
                        {/* Success State */}
                        <div className={styles.successState}>
                            <div className={styles.successIcon}>
                                <Check size={48} />
                            </div>
                            <h2>Account Created Successfully!</h2>
                            <p>You can now upload and track your CPE certificates securely.</p>

                            <div className={styles.successBenefits}>
                                <div className={styles.benefit}>
                                    <Check className={styles.checkIcon} />
                                    <span>✨ 10 free uploads activated</span>
                                </div>
                                <div className={styles.benefit}>
                                    <Check className={styles.checkIcon} />
                                    <span>🔒 Secure account created</span>
                                </div>
                                <div className={styles.benefit}>
                                    <Check className={styles.checkIcon} />
                                    <span>📋 Ready to upload certificates</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Trust indicators */}
                <div className={styles.trustIndicators}>
                    <div className={styles.trustItem}>
                        <Shield size={16} />
                        <span>Secure & Encrypted</span>
                    </div>
                    <div className={styles.trustItem}>
                        <Check size={16} />
                        <span>No Credit Card Required</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickSignupModal;