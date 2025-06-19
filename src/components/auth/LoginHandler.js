// src/components/auth/LoginHandler.js - Handles login with password reset detection
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PasswordSetupModal from './PasswordSetupModal';
import { toast } from 'react-hot-toast';

const LoginHandler = ({ children }) => {
    const { requiresPasswordSetup, temporaryPassword, completePasswordSetup } = useAuth();
    const [showPasswordSetup, setShowPasswordSetup] = useState(false);

    // Auto-show password setup modal when required
    React.useEffect(() => {
        if (requiresPasswordSetup) {
            setShowPasswordSetup(true);
        }
    }, [requiresPasswordSetup]);

    const handlePasswordSetupSuccess = () => {
        setShowPasswordSetup(false);
        completePasswordSetup();
        toast.success('Password updated successfully!');
    };

    const handlePasswordSetupSkip = () => {
        setShowPasswordSetup(false);
        completePasswordSetup();
        toast.success('You can update your password anytime in settings.');
    };

    const handlePasswordSetupClose = () => {
        setShowPasswordSetup(false);
        // Don't call completePasswordSetup() here - user might want to set password later
    };

    return (
        <>
            {children}

            {/* Password Setup Modal - shown when user needs to set password */}
            {showPasswordSetup && (
                <PasswordSetupModal
                    onClose={handlePasswordSetupClose}
                    onSuccess={handlePasswordSetupSuccess}
                    onSkip={handlePasswordSetupSkip}
                    temporaryPassword={temporaryPassword}
                />
            )}
        </>
    );
};

export default LoginHandler;