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
    as: Component = 'button',  // Add support for custom component
    ...props
}) => {
    const buttonClasses = clsx(
        'btn-base',
        styles.button,
        styles[variant],
        styles[size],
        { [styles.loading]: loading },
        className
    );

    // If it's a button element, we need disabled prop
    const buttonProps = Component === 'button'
        ? { disabled: disabled || loading, ...props }
        : props; // For Links and other components, don't pass disabled

    return (
        <Component
            className={buttonClasses}
            {...buttonProps}
        >
            {loading && <span className="loading-spinner" />}
            {children}
        </Component>
    );
};

export default Button;