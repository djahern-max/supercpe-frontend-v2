// src/components/ui/Badge.js  
import React from 'react';

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
    const variantClass = {
        primary: 'badge-primary',
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        neutral: 'badge-neutral',
        secondary: 'badge-secondary'
    }[variant] || 'badge-primary';

    const sizeClass = {
        sm: 'badge-sm',
        md: 'badge-md',
        lg: 'badge-lg'
    }[size] || 'badge-md';

    return (
        <span className={`badge ${variantClass} ${sizeClass} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
