// src/components/compliance/QuickSignupModal.js - Fixed field name mismatch
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Shield, CheckCircle, BarChart3, Clock, Lock } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import PasswordSetupModal from '../auth/PasswordSetupModal';
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
    const [showPasswordSetup, setShowPasswordSetup] = useState(false);
    const [temporaryPassword, setTemporaryPassword] = useState(null);

    const { createAccountWithEmail, setAuthToken } = useAuth();

    const handleEmailSignup = async (e) => {
        e.preventDefault();

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
                console.log('Using passcode flow - making request to:', '/api/auth/signup-with-passcode');
                console.log('Request body:', {
                    email: email.trim(),
                    full_name: name.trim(), // ✅ FIXED: Using full_name instead of name
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
                        full_name: name.trim(), // ✅ FIXED: Changed from 'name' to 'full_name'
                        passcode: cpaData.passcode,
                    }),
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (response.ok) {
                    const data = await response.json();

                    // 🔍 DETAILED DEBUGGING
                    console.log('🔍 FULL BACKEND RESPONSE:', JSON.stringify(data, null, 2));
                    console.log('🔍 TEMPORARY PASSWORD CHECK:', {
                        hasTemporaryPassword: !!data.temporary_password,
                        temporaryPasswordValue: data.temporary_password,
                        temporaryPasswordType: typeof data.temporary_password,
                        hasRequiresPasswordReset: !!data.requires_password_reset,
                        requiresPasswordResetValue: data.requires_password_reset
                    });

                    setAuthToken(data.access_token, data.refresh_token);

                    // 🔥 CHECK FOR TEMPORARY PASSWORD
                    if (data.temporary_password) {
                        console.log('✅ TEMPORARY PASSWORD DETECTED - SHOWING PASSWORD SETUP');
                        setTemporaryPassword(data.temporary_password);
                        setStep('password-setup');
                        toast.success('Account created! Please set your password.');
                        return;
                    } else if (data.requires_password_reset) {
                        console.log('✅ REQUIRES PASSWORD RESET - SHOWING PASSWORD SETUP');
                        setStep('password-setup');
                        toast.success('Account created! Please set your password.');
                        return;
                    } else {
                        console.log('❌ NO PASSWORD SETUP REQUIRED - GOING TO SUCCESS');
                        setStep('success');
                        setTimeout(() => {
                            onSuccess();
                        }, 2000);
                    }

                    result = { success: true };
                } else {
                    const errorData = await response.json();
                    console.error('❌ PASSCODE SIGNUP ERROR:', errorData);
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

                if (result.success) {
                    if (result.temporaryPassword) {
                        setTemporaryPassword(result.temporaryPassword);
                        setStep('password-setup');
                        toast.success('Account created! Please set your password.');
                    } else {
                        setStep('success');
                        setTimeout(() => {
                            onSuccess();
                        }, 2000);
                    }
                }
            }

            if (!result.success) {
                toast.error(result.error || 'Failed to create account. Please try again.');
            }

        } catch (error) {
            console.error('Email signup error:', error);
            toast.error('Account creation failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordSetupSuccess = () => {
        setShowPasswordSetup(false);
        setStep('success');

        setTimeout(() => {
            onSuccess();
        }, 2000);
    };

    const handleSkipPasswordSetup = () => {
        setShowPasswordSetup(false);
        setStep('success');
        toast.success('Account setup complete!');
        setTimeout(() => {
            onSuccess();
        }, 2000);
    };

    const closeModal = () => {
        // Clean up any stored OAuth data when modal is closed
        sessionStorage.removeItem('pending_license_link');
        sessionStorage.removeItem('pending_cpa_name');
        sessionStorage.removeItem('oauth_from_passcode');
        onClose();
    };

    // Show password setup modal when needed
    if (step === 'password-setup' || showPasswordSetup) {
        return (
            <PasswordSetupModal
                onClose={closeModal}
                onSuccess={handlePasswordSetupSuccess}
                onSkip={handleSkipPasswordSetup}
                temporaryPassword={temporaryPassword}
            />
        );
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {/* Enhanced Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Create Your Professional Account</h2>
                </div>

                {/* Minimalist Benefits Row */}
                <div className={styles.featureGrid}>
                    <div className={styles.featureItem}>
                        <CheckCircle size={18} />
                        <span>AI-Powered</span>
                    </div>
                    <div className={styles.featureItem}>
                        <Shield size={18} />
                        <span>Secure Storage</span>
                    </div>
                    <div className={styles.featureItem}>
                        <BarChart3 size={18} />
                        <span>Compliance Reports</span>
                    </div>
                    <div className={styles.featureItem}>
                        <Clock size={18} />
                        <span>Time Tracking</span>
                    </div>
                </div>

                {/* Simplified Signup Form */}
                <form onSubmit={handleEmailSignup} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Professional Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="your.email@firmname.com"
                            disabled={isSubmitting}
                            required
                        />
                        <p className={styles.inputHint}>
                            Use your firm email for easier compliance tracking
                        </p>
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
                        disabled={!email || !name || isSubmitting}
                        loading={isSubmitting}
                        className={styles.submitButton}
                    >
                        Create Professional Account
                    </Button>
                </form>

                {/* Enhanced CPA Verification Display */}
                {isPasscodeVerified && cpaData && (
                    <div className={styles.cpaVerification}>
                        <div className={styles.verificationBadge}>
                            <Shield className={styles.verificationIcon} size={16} />
                            <span>NH CPA License Verified</span>
                        </div>
                        <div className={styles.cpaInfo}>
                            <strong>{cpaData.full_name}</strong>
                            <span>License: {cpaData.license_number}</span>
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={styles.closeButton}
                    disabled={isSubmitting}
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

export default QuickSignupModal;