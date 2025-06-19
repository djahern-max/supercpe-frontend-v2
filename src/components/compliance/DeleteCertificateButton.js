// Replace your DeleteCertificateButton.js component with this enhanced version:

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import styles from '../../styles/components/DeleteCertificationButton.module.css';

const DeleteCertificateButton = ({
    certificateId,
    licenseNumber,
    certificateTitle,
    onDeleteSuccess
}) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleShowConfirmation = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        setShowConfirmation(true);
    };

    const handleCloseConfirmation = () => {
        setShowConfirmation(false);
    };

    const handleDelete = async () => {
        if (!certificateId || !licenseNumber) {
            toast.error('Missing required information to delete certificate');
            handleCloseConfirmation();
            return;
        }

        setIsDeleting(true);
        console.log('🗑️ Starting delete process for certificate:', certificateId);

        try {
            // Call the delete API
            const result = await apiService.deleteCertificate(certificateId, licenseNumber);
            console.log('✅ Delete API response:', result);

            if (result.success) {
                // Show success message with details
                const storageStatus = result.storage_deletion?.success ? 'and file' : 'but file may remain';
                toast.success(`Certificate deleted from database ${storageStatus}`);

                // Log detailed results
                console.log('📊 Delete results:', {
                    database: result.database_deletion,
                    storage: result.storage_deletion,
                    certificate: result.certificate_info
                });

                // Notify parent component about successful deletion
                if (onDeleteSuccess) {
                    onDeleteSuccess(certificateId);
                }
            } else {
                console.error('❌ Delete failed:', result);
                toast.error(result.error || 'Failed to delete certificate');
            }

        } catch (error) {
            console.error('💥 Error deleting certificate:', error);

            // Handle different error types
            if (error.response?.status === 404) {
                toast.error('Certificate not found');
            } else if (error.response?.status === 403) {
                toast.error('Access denied - cannot delete this certificate');
            } else {
                toast.error(
                    error.response?.data?.detail ||
                    error.message ||
                    'Failed to delete certificate. Please try again.'
                );
            }
        } finally {
            setIsDeleting(false);
            handleCloseConfirmation();
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleShowConfirmation}
                className={styles.actionButton}
                title="Delete Certificate"
                aria-label="Delete Certificate"
            >
                <Trash2 className={styles.actionIcon} />
            </button>

            {showConfirmation && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h4 className={styles.modalTitle}>Confirm Deletion</h4>
                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={handleCloseConfirmation}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>Are you sure you want to delete this certificate?</p>
                            <p><strong>{certificateTitle || `Certificate #${certificateId}`}</strong></p>
                            <p className={styles.warningText}>
                                This will remove the certificate from your records and delete the associated document file. This action cannot be undone.
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={handleCloseConfirmation}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.confirmButton}
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Certificate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DeleteCertificateButton;