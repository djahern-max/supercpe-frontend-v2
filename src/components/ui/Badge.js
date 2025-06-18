// src/components/ui/Badge.js
import React from 'react';
import styles from '../../styles/components/Badge.module.css';

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
    const variantClass = {
        primary: styles['badge-primary'],
        success: styles['badge-success'],
        warning: styles['badge-warning'],
        critical: styles['badge-critical'],  // Added critical variant
        error: styles['badge-error'],
        neutral: styles['badge-neutral'],
        secondary: styles['badge-secondary']
    }[variant] || styles['badge-primary'];

    const sizeClass = {
        sm: styles['badge-sm'],
        md: styles['badge-md'],
        lg: styles['badge-lg']
    }[size] || styles['badge-md'];

    return (
        <span className={`${styles.badge} ${variantClass} ${sizeClass} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;