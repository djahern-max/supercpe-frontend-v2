// src/components/ui/Button.js
import React from 'react';
import clsx from 'clsx';
import styles from '../../styles/components/Button.module.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className,
    ...props
}) => {
    return (
        <button
            className={clsx(
                'btn-base',
                styles.button,
                styles[variant],
                styles[size],
                { [styles.loading]: loading },
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className="loading-spinner" />}
            {children}
        </button>
    );
};

export default Button;