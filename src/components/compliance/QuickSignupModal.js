// src/components/compliance/QuickSignupModal.js - Complete Version
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Mail, User, Shield, Check, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/components/QuickSignupModal.module.css';

const QuickSignupModal = ({ licenseNumber, cpaName, onClose, onSuccess }) => {
    const [step, setStep] = useState('method'); // 'method', 'email', 'success'
    const [email, setEmail] = useState('');
    const [name, setName] = useState(cpaName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { loginWithGoogle, createAccountWithEmail, connectLicense } = useAuth();

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
            // Create account with email
            const result = await createAccountWithEmail({
                email: email.trim(),
                name: name.trim(),
                license_number: licenseNumber
            });

            if (result.success) {
                setStep('success');

                // Auto-close after showing success
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                toast.error(result.error || 'Failed to create account. Please try again.');
            }
        } catch (error) {
            console.error('Account creation error:', error);

            if (error.response?.status === 400) {
                toast.error(error.response.data?.detail || 'Invalid request. Please check your information.');
            } else if (error.response?.status === 404) {
                toast.error('CPA license number not found. Please verify your license number.');
            } else if (error.response?.status === 409) {
                toast.error('An account with this email already exists. Please sign in instead.');
            } else {
                toast.error('Unable to process your request. Please try again or contact support.');
            }
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
                        <div className={styles.authOptions}>
                            <Button
                                variant="primary"
                                onClick={handleGoogleSignup}
                                disabled={isSubmitting}
                                className={styles.googleButton}
                            >
                                <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </Button>

                            <div className={styles.divider}>
                                <span>or</span>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setStep('email')}
                                disabled={isSubmitting}
                                className={styles.emailButton}
                            >
                                <Mail size={20} />
                                Continue with Email
                            </Button>
                        </div>

                        {/* License Info */}
                        <div className={styles.licenseInfo}>
                            <div className={styles.licenseCard}>
                                <div className={styles.licenseDetails}>
                                    <strong>License: {licenseNumber}</strong>
                                    <p>{cpaName}</p>
                                </div>
                                <Check className={styles.verifiedIcon} />
                            </div>
                        </div>
                    </>
                )}

                {step === 'email' && (
                    <>
                        {/* Email Form Header */}
                        <div className={styles.modalHeader}>
                            <button
                                className={styles.backButton}
                                onClick={handleBackToMethod}
                                type="button"
                            >
                                ←
                            </button>
                            <div className={styles.iconWrapper}>
                                <Mail className={styles.headerIcon} />
                            </div>
                            <h2>Create Account</h2>
                            <p>Enter your email to create your free account</p>
                        </div>

                        {/* Email Form */}
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
                            <span>We'll verify your account with license {licenseNumber}</span>
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