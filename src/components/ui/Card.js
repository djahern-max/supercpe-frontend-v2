// src/components/ui/Card.js
import React from 'react';
import clsx from 'clsx';
import styles from '../../styles/components/Card.module.css';

const Card = ({ children, className, ...props }) => {
    return (
        <div className={clsx('card', styles.card, className)} {...props}>
            {children}
        </div>
    );
};

const CardHeader = ({ children, className, ...props }) => {
    return (
        <div className={clsx(styles.cardHeader, className)} {...props}>
            {children}
        </div>
    );
};

const CardBody = ({ children, className, ...props }) => {
    return (
        <div className={clsx(styles.cardBody, className)} {...props}>
            {children}
        </div>
    );
};

const CardFooter = ({ children, className, ...props }) => {
    return (
        <div className={clsx(styles.cardFooter, className)} {...props}>
            {children}
        </div>
    );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
