// src/components/ui/Card.js
import React from 'react';

const Card = ({ children, className = '' }) => {
    return (
        <div className={`card ${className}`}>
            {children}
        </div>
    );
};

export default Card;


