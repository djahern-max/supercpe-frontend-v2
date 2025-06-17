// src/components/ui/Badge.js
import React from 'react';
import clsx from 'clsx';
import styles from '../../styles/components/Badge.module.css';

const Badge = ({
    children,
    variant = 'neutral',
    className,
    ...props
}) => {
    return (
        <span
            className={clsx(
                styles.badge,
                styles[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;