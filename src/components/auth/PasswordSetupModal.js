// src/components/auth/PasswordSetupModal.js
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import styles from '../../styles/components/PasswordSetupModal.module.css';

const PasswordSetupModal = ({ onClose, onSuccess, temporaryPassword = null }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password validation
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && passwordsMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            toast.error('Please ensure your password meets all requirements');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({
                    password: password,
                }),
            });

            if (response.ok) {
                toast.success('Password set successfully!');
                onSuccess();
            } else {
                const errorData = await response.json();
                toast.error(errorData.detail || 'Failed to set password');
            }
        } catch (error) {
            console.error('Password setup error:', error);
            toast.error('Failed to set password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.iconWrapper}>
                        <Lock className={styles.headerIcon} size={24} />
                    </div>
                    <h2 className={styles.modalTitle}>Set Your Password</h2>
                    <p className={styles.subtitle}>
                        Create a secure password for your account to use when signing in
                    </p>
                </div>

                {/* Temporary Password Display */}
                {temporaryPassword && (
                    <div className={styles.tempPasswordSection}>
                        <div className={styles.tempPasswordCard}>
                            <AlertCircle className={styles.alertIcon} size={20} />
                            <div>
                                <h4>Your Temporary Password</h4>
                                <p>Use this password to sign in if needed:</p>
                                <code className={styles.tempPassword}>{temporaryPassword}</code>
                                <p className={styles.tempPasswordNote}>
                                    Save this somewhere safe! You can change it below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* New Password */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            New Password
                        </label>
                        <div className={styles.passwordInputWrapper}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your password"
                                disabled={isSubmitting}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={styles.eyeButton}
                                disabled={isSubmitting}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                            Confirm Password
                        </label>
                        <div className={styles.passwordInputWrapper}>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Confirm your password"
                                disabled={isSubmitting}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={styles.eyeButton}
                                disabled={isSubmitting}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* 🔥 CONDITIONAL REQUIREMENTS/SUCCESS MESSAGE */}
                    {!isPasswordValid ? (
                        /* Show requirements when password doesn't meet criteria */
                        <div className={styles.requirements}>
                            <h4>Password Requirements:</h4>
                            <div className={styles.requirementsList}>
                                <div className={`${styles.requirement} ${hasMinLength ? styles.requirementMet : ''}`}>
                                    <Check size={16} className={styles.checkIcon} />
                                    <span>At least 8 characters</span>
                                </div>
                                <div className={`${styles.requirement} ${hasUpperCase ? styles.requirementMet : ''}`}>
                                    <Check size={16} className={styles.checkIcon} />
                                    <span>One uppercase letter</span>
                                </div>
                                <div className={`${styles.requirement} ${hasLowerCase ? styles.requirementMet : ''}`}>
                                    <Check size={16} className={styles.checkIcon} />
                                    <span>One lowercase letter</span>
                                </div>
                                <div className={`${styles.requirement} ${hasNumber ? styles.requirementMet : ''}`}>
                                    <Check size={16} className={styles.checkIcon} />
                                    <span>One number</span>
                                </div>
                                <div className={`${styles.requirement} ${hasSpecialChar ? styles.requirementMet : ''}`}>
                                    <Check size={16} className={styles.checkIcon} />
                                    <span>One special character</span>
                                </div>
                                <div className={`${styles.requirement} ${passwordsMatch ? styles.requirementMet : ''}`}>
                                    <Check size={16} className={styles.checkIcon} />
                                    <span>Passwords match</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Show success message when all requirements are met */
                        <div className={styles.successMessage}>
                            <div className={styles.successIcon}>
                                <CheckCircle size={24} />
                            </div>
                            <div className={styles.successText}>
                                <h4>Perfect! Your password meets all requirements.</h4>
                                <p>You can now set your password securely.</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button - Now always visible */}
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!isPasswordValid || isSubmitting}
                        loading={isSubmitting}
                        className={styles.submitButton}
                    >
                        Set Password
                    </Button>
                </form>

                {/* Skip Option */}
                <div className={styles.skipSection}>
                    <p>You can also skip this step and use your temporary password for now.</p>
                    <Button
                        variant="outline"
                        onClick={onSuccess}
                        disabled={isSubmitting}
                        className={styles.skipButton}
                    >
                        Skip for Now
                    </Button>
                </div>

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

export default PasswordSetupModal;