// src/components/ui/FileUpload.js
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import styles from '../../styles/components/FileUpload.module.css';

const FileUpload = ({
    onFileSelect,
    accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    maxSize = 10485760, // 10MB
    disabled = false,
    className
}) => {
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            const error = rejectedFiles[0].errors[0];
            console.error('File rejected:', error.message);
            return;
        }

        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxSize,
        multiple: false,
        disabled
    });

    return (
        <div
            {...getRootProps()}
            className={clsx(
                styles.dropzone,
                {
                    [styles.active]: isDragActive,
                    [styles.reject]: isDragReject,
                    [styles.disabled]: disabled
                },
                className
            )}
        >
            <input {...getInputProps()} />

            <div className={styles.dropzoneContent}>
                <div className={styles.uploadIcon}>
                    📄
                </div>

                {isDragActive ? (
                    <p className={styles.dropzoneText}>Drop your CPE certificate here...</p>
                ) : (
                    <>
                        <p className={styles.dropzoneText}>
                            Drag & drop your CPE certificate, or <span className={styles.clickText}>click to browse</span>
                        </p>
                        <p className={styles.dropzoneSubtext}>
                            Supports PDF, JPG, PNG, DOC, DOCX (max 10MB)
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUpload;