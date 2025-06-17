// src/components/layout/Layout.js
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import styles from '../../styles/components/Layout.module.css';

const Layout = ({ children }) => {
    return (
        <div className={styles.layout}>
            <Header />
            <main className={styles.main}>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
