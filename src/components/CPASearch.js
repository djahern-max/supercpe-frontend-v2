// src/components/CPASearch.js - Simplified (AuthCallback handles license linking)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import styles from '../styles/components/CPASearch.module.css';

const CPASearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLinkingLicense, setIsLinkingLicense] = useState(false);

    const navigate = useNavigate();
    const { isAuthenticated, user, connectLicense } = useAuth();
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    // Clean up debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Debounced search as user types
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.trim().length < 2) {
            setResults([]);
            setShowResults(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(() => {
            performSearch(query.trim());
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    // Handle clicks outside to close results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async (searchQuery) => {
        try {
            const response = await apiService.searchCPAs(searchQuery, 8);
            setResults(response.results || []);
            setShowResults(true);
            setSelectedIndex(-1);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
            setShowResults(false);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = async (cpa) => {
        setQuery('');
        setShowResults(false);
        setSelectedIndex(-1);

        // If user is authenticated, try to link the license immediately
        if (isAuthenticated && user) {
            const shouldLinkLicense = !user.license_number || user.license_number !== cpa.license_number;

            if (shouldLinkLicense) {
                try {
                    setIsLinkingLicense(true);

                    toast.loading(`Linking license ${cpa.license_number} to your account...`, {
                        id: 'linking-license'
                    });

                    await connectLicense(cpa.license_number);

                    toast.success(`License ${cpa.license_number} linked to your account!`, {
                        id: 'linking-license',
                        duration: 3000
                    });

                    console.log(`Successfully linked license ${cpa.license_number} to user ${user.email}`);

                } catch (error) {
                    console.error('Failed to link license:', error);

                    if (error.response?.status === 409) {
                        toast.error('This license is already connected to another account.', {
                            id: 'linking-license'
                        });
                    } else if (error.response?.status === 404) {
                        toast.error('License number not found in our database.', {
                            id: 'linking-license'
                        });
                    } else {
                        toast.error('Failed to link license to your account.', {
                            id: 'linking-license'
                        });
                    }
                } finally {
                    setIsLinkingLicense(false);
                }
            } else {
                toast.success(`Accessing dashboard for ${cpa.full_name}`);
            }

            // Navigate to dashboard
            navigate(`/dashboard/${cpa.license_number}`);

        } else {
            // User is NOT authenticated - store license for OAuth callback to handle
            console.log(`Storing license ${cpa.license_number} for post-OAuth linking`);

            // Store the license info for AuthCallback to handle after OAuth
            sessionStorage.setItem('pending_license_link', cpa.license_number);
            sessionStorage.setItem('pending_cpa_name', cpa.full_name);

            toast.success(`Selected ${cpa.full_name}. Please sign in to link this license to your account.`, {
                duration: 4000
            });

            // Navigate to dashboard which will show sign-in prompt
            navigate(`/dashboard/${cpa.license_number}`);
        }
    };

    const handleKeyDown = (e) => {
        if (!showResults || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    handleResultClick(results[selectedIndex]);
                } else if (results.length === 1) {
                    handleResultClick(results[0]);
                }
                break;
            case 'Escape':
                setShowResults(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleInputFocus = () => {
        if (query.length >= 2 && results.length > 0) {
            setShowResults(true);
        }
    };

    const formatExpirationDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className={styles.searchContainer} ref={searchRef}>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    placeholder="Enter Your Name or License Number"
                    className={styles.searchInput}
                    autoComplete="off"
                    disabled={isLinkingLicense}
                />

                {(loading || isLinkingLicense) && (
                    <div className={styles.loadingSpinner}>
                        <div className={styles.spinner}></div>
                    </div>
                )}

                {query.length >= 1 && query.length < 2 && (
                    <div className={styles.minCharsHint}>
                        Type at least 2 characters to search
                    </div>
                )}
            </div>

            {showResults && (
                <div className={styles.resultsDropdown}>
                    {results.length > 0 ? (
                        <>
                            <div className={styles.resultsHeader}>
                                <span className={styles.resultCount}>
                                    {results.length} CPA{results.length !== 1 ? 's' : ''} found
                                </span>
                                <span className={styles.navigationHint}>
                                    Use ↑↓ keys to navigate, Enter to select
                                </span>
                            </div>

                            {/* Show different messages based on auth status */}
                            {isAuthenticated && user && !user.license_number && (
                                <div className={styles.authNotice}>
                                    <span className={styles.authIcon}>🔗</span>
                                    <span className={styles.authText}>
                                        Selecting a CPA will link this license to your account
                                    </span>
                                </div>
                            )}



                            <ul className={styles.resultsList}>
                                {results.map((cpa, index) => (
                                    <li
                                        key={cpa.license_number}
                                        className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''
                                            } ${isAuthenticated && user?.license_number === cpa.license_number
                                                ? styles.userLicense : ''
                                            }`}
                                        onClick={() => handleResultClick(cpa)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className={styles.resultContent}>
                                            <div className={styles.resultMain}>
                                                <span className={styles.resultName}>
                                                    {cpa.full_name}
                                                    {isAuthenticated && user?.license_number === cpa.license_number && (
                                                        <span className={styles.yourLicenseLabel}>
                                                            (Your License)
                                                        </span>
                                                    )}
                                                </span>
                                                <span className={styles.resultLicense}>
                                                    #{cpa.license_number}
                                                </span>
                                            </div>
                                            <div className={styles.resultDetails}>
                                                <span className={`${styles.resultStatus} ${cpa.status === 'Active' ? styles.statusActive : ''
                                                    }`}>
                                                    {cpa.status}
                                                </span>
                                                <span className={styles.resultExpiry}>
                                                    Expires {formatExpirationDate(cpa.license_expiration_date)}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div className={styles.noResults}>
                            <div className={styles.noResultsIcon}>🔍</div>
                            <p className={styles.noResultsText}>
                                No CPAs found matching "{query}"
                            </p>
                            <p className={styles.noResultsHint}>
                                Try searching by full name or license number
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CPASearch;