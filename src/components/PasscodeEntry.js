// src/components/PasscodeEntry.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import QuickSignupModal from './compliance/QuickSignupModal';
import { apiService } from '../services/api';
import styles from '../styles/components/PasscodeEntry.module.css';

const PasscodeEntry = () => {
    const [mode, setMode] = useState('passcode'); // 'passcode' or 'login'
    const [passcode, setPasscode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [cpaData, setCpaData] = useState(null);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, user, setAuthToken } = useAuth();

    const handlePasscodeSubmit = async (e) => {
        e.preventDefault();
        if (passcode.length < 6) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/cpas/lookup-passcode/${passcode}`);

            if (response.ok) {
                const data = await response.json();

                if (data.found) {
                    setCpaData(data.cpa);

                    if (isAuthenticated && user?.license_number === data.cpa.license_number) {
                        navigate(`/dashboard/${data.cpa.license_number}`);
                    } else if (isAuthenticated) {
                        toast.error('This passcode is for a different CPA license.');
                    } else {
                        setShowSignupModal(true);
                    }
                } else {
                    toast.error('Invalid passcode. Please check and try again.');
                }
            } else {
                toast.error('Error verifying passcode. Please try again.');
            }
        } catch (error) {
            toast.error('Error verifying passcode. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setAuthToken(data.access_token);
                navigate(`/dashboard/${data.user.license_number}`);
                toast.success('Welcome back!');
            } else {
                toast.error('Invalid email or password.');
            }
        } catch (error) {
            toast.error('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSuccess = () => {
        setShowSignupModal(false);
        if (cpaData) {
            navigate(`/dashboard/${cpaData.license_number}`);
        }
    };

    return (
        <>
            <div className={styles.entryContainer}>
                {mode === 'passcode' ? (
                    <form onSubmit={handlePasscodeSubmit}>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                                placeholder="Enter Your Access Passcode"
                                className={styles.searchInput}
                                autoComplete="off"
                                disabled={loading}
                                maxLength={12}
                            />
                            {loading && (
                                <div className={styles.loadingSpinner}>
                                    <div className={styles.spinner}></div>
                                </div>
                            )}
                        </div>



                        <div className={styles.switchMode}>
                            Already have an account?
                            <button type="button" onClick={() => setMode('login')}>
                                Sign In Here
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleLogin}>
                        <div className={styles.loginForm}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className={styles.loginInput}
                                disabled={loading}
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className={styles.loginInput}
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading || !email || !password}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>

                        <div className={styles.switchMode}>
                            New user?
                            <button type="button" onClick={() => setMode('passcode')}>
                                Enter Passcode
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {showSignupModal && cpaData && (
                <QuickSignupModal
                    licenseNumber={cpaData.license_number}
                    cpaName={cpaData.full_name}
                    cpaData={cpaData}
                    isPasscodeVerified={true}  // Add this line!
                    onClose={() => setShowSignupModal(false)}
                    onSuccess={handleSignupSuccess}
                />
            )}
        </>
    );
};

export default PasscodeEntry;