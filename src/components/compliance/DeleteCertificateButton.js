// src/components/compliance/DeleteCertificationButton.js
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import styles from '../../styles/components/DeleteCertificationButton.module.css';

const DeleteCertificationButton = ({
    certificateId,
    licenseNumber,
    certificateTitle,
    onDeleteSuccess
}) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleShowConfirmation = (e) => {
        e.stopPropagation(); // Prevent event bubbling if button is in a clickable container
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

        try {
            // Import the API service
            const { apiService } = await import('../../services/api');

            // Call the delete method
            const result = await apiService.deleteCertificate(certificateId, licenseNumber);

            if (result.success) {
                toast.success('Certificate deleted successfully');
                // Notify parent component about successful deletion
                if (onDeleteSuccess) {
                    onDeleteSuccess(certificateId);
                }
            } else {
                toast.error(result.error || 'Failed to delete certificate');
            }
        } catch (error) {
            console.error('Error deleting certificate:', error);
            toast.error(
                error.response?.data?.detail ||
                'Failed to delete certificate. Please try again.'
            );
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
                className={styles.deleteButton}
                title="Delete Certificate"
                aria-label="Delete Certificate"
            >
                <Trash2 size={16} />
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
                                &times;
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>Are you sure you want to delete this certificate?</p>
                            <p><strong>{certificateTitle || `Certificate #${certificateId}`}</strong></p>
                            <p className={styles.warningText}>This action cannot be undone.</p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={handleCloseConfirmation}
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

export default DeleteCertificationButton;