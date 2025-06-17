// src/utils/dateUtils.js

/**
 * Format a date string into a readable format
 * @param {string} dateString - ISO date string or date-like string
 * @returns {string} Formatted date (e.g., "January 15, 2024")
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.warn('Invalid date string:', dateString);
        return dateString;
    }
};

/**
 * Format a date string into a short format
 * @param {string} dateString - ISO date string or date-like string
 * @returns {string} Short formatted date (e.g., "Jan 15, 2024")
 */
export const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        console.warn('Invalid date string:', dateString);
        return dateString;
    }
};

/**
 * Calculate days remaining until a future date
 * @param {string} expirationDate - ISO date string
 * @returns {number} Days remaining (0 if expired)
 */
export const calculateDaysRemaining = (expirationDate) => {
    if (!expirationDate) return 0;

    try {
        const expiry = new Date(expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        expiry.setHours(0, 0, 0, 0); // Reset time to start of day

        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    } catch (error) {
        console.warn('Invalid expiration date:', expirationDate);
        return 0;
    }
};

/**
 * Check if a date is in the past
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if date is in the past
 */
export const isDateInPast = (dateString) => {
    if (!dateString) return false;

    try {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    } catch (error) {
        console.warn('Invalid date string:', dateString);
        return false;
    }
};

/**
 * Get status based on days until expiration
 * @param {string} expirationDate - ISO date string
 * @returns {string} Status: 'expired', 'critical', 'warning', or 'good'
 */
export const getDateStatus = (expirationDate) => {
    const daysRemaining = calculateDaysRemaining(expirationDate);

    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 30) return 'critical';
    if (daysRemaining <= 90) return 'warning';
    return 'good';
};

/**
 * Format a date for HTML input[type="date"]
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForInput = (date) => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.warn('Invalid date for input:', date);
        return '';
    }
};

/**
 * Calculate age in years from a date
 * @param {string} dateString - ISO date string (typically birth date or license issue date)
 * @returns {number} Age in years
 */
export const calculateYearsFrom = (dateString) => {
    if (!dateString) return 0;

    try {
        const startDate = new Date(dateString);
        const today = new Date();
        let years = today.getFullYear() - startDate.getFullYear();

        // Adjust if birthday hasn't occurred this year
        const monthDiff = today.getMonth() - startDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < startDate.getDate())) {
            years--;
        }

        return Math.max(0, years);
    } catch (error) {
        console.warn('Invalid date string:', dateString);
        return 0;
    }
};

/**
 * Get relative time description (e.g., "2 days ago", "in 5 days")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time description
 */
export const getRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = date - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 1) return `In ${diffDays} days`;
        if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

        return formatDateShort(dateString);
    } catch (error) {
        console.warn('Invalid date string:', dateString);
        return dateString;
    }
};

/**
 * Check if two dates are in the same compliance period
 * Used for CPE tracking across reporting periods
 * @param {string} date1 - First date
 * @param {string} date2 - Second date
 * @param {string} periodType - 'biennial' or 'triennial'
 * @returns {boolean} True if dates are in same period
 */
export const areDatesInSamePeriod = (date1, date2, periodType = 'biennial') => {
    if (!date1 || !date2) return false;

    try {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const yearsDiff = Math.abs(d1.getFullYear() - d2.getFullYear());

        if (periodType === 'biennial') {
            return yearsDiff < 2;
        } else if (periodType === 'triennial') {
            return yearsDiff < 3;
        }

        return yearsDiff < 2; // Default to biennial
    } catch (error) {
        console.warn('Invalid dates for period comparison:', date1, date2);
        return false;
    }
};

/**
 * Get the start of the current compliance year (July 1st in NH)
 * @param {string} currentDate - Current date (optional, defaults to today)
 * @returns {Date} Start of compliance year
 */
export const getComplianceYearStart = (currentDate = null) => {
    const date = currentDate ? new Date(currentDate) : new Date();
    const year = date.getFullYear();

    // NH compliance year starts July 1st
    const complianceStart = new Date(year, 6, 1); // Month 6 = July (0-indexed)

    // If we're before July 1st, the compliance year started last year
    if (date < complianceStart) {
        complianceStart.setFullYear(year - 1);
    }

    return complianceStart;
};

/**
 * Format duration in a human-readable way
 * @param {number} days - Number of days
 * @returns {string} Formatted duration (e.g., "2 years, 3 months")
 */
export const formatDuration = (days) => {
    if (!days || days < 0) return '0 days';

    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (remainingDays > 0 || parts.length === 0) {
        parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);
    }

    return parts.join(', ');
};

/**
 * Check if a date falls within a specific range
 * @param {string} date - Date to check
 * @param {string} startDate - Range start date
 * @param {string} endDate - Range end date
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, startDate, endDate) => {
    if (!date || !startDate || !endDate) return false;

    try {
        const checkDate = new Date(date);
        const start = new Date(startDate);
        const end = new Date(endDate);

        return checkDate >= start && checkDate <= end;
    } catch (error) {
        console.warn('Invalid dates for range check:', { date, startDate, endDate });
        return false;
    }
};

// Export all functions as default object for easier importing
export default {
    formatDate,
    formatDateShort,
    calculateDaysRemaining,
    isDateInPast,
    getDateStatus,
    formatDateForInput,
    calculateYearsFrom,
    getRelativeTime,
    areDatesInSamePeriod,
    getComplianceYearStart,
    formatDuration,
    isDateInRange,
};