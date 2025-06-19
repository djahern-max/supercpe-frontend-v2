// src/components/compliance/PeriodSelector.js - Fixed API endpoints
import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';
import styles from '../../styles/components/PeriodSelector.module.css';

const PeriodSelector = ({ licenseNumber, onPeriodSelect, onAnalysisLoad }) => {
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (licenseNumber) {
            loadAvailablePeriods();
        }
    }, [licenseNumber]);

    const loadAvailablePeriods = async () => {
        try {
            setLoading(true);

            // Use the correct API endpoint: /api/time-windows/{license_number}/available
            const response = await fetch(`/api/time-windows/${licenseNumber}/available`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Available periods response:', data);

            // Handle the API response structure
            const windows = data.available_windows || [];

            // Transform the API data to match our component needs
            const transformedPeriods = windows.map((window) => ({
                id: `${window.start_date}-${window.end_date}`,
                start_date: window.start_date,
                end_date: window.end_date,
                label: window.description || `${window.start_date} - ${window.end_date}`,
                period_type: window.period_type,
                hours_required: window.hours_required,
                ethics_required: window.ethics_required,
                annual_minimum: window.annual_minimum,
                duration_years: window.period_type === 'biennial' ? 2 : 3,
                is_current: window.is_current,
                is_historical: window.is_historical,
                is_future: window.is_future,
                days_from_today: window.days_from_today,
                description: window.description
            }));

            setAvailablePeriods(transformedPeriods);

            // Auto-select current period if available
            const currentPeriod = transformedPeriods.find(p => p.is_current);
            if (currentPeriod && !selectedPeriod) {
                setSelectedPeriod(currentPeriod);
                if (onPeriodSelect) {
                    onPeriodSelect(currentPeriod);
                }
            }

        } catch (error) {
            console.error('Error getting available periods:', error);

            // Fallback to default periods if API fails
            const fallbackPeriods = createFallbackPeriods();
            setAvailablePeriods(fallbackPeriods);

            if (fallbackPeriods.length > 0 && !selectedPeriod) {
                setSelectedPeriod(fallbackPeriods[0]);
                if (onPeriodSelect) {
                    onPeriodSelect(fallbackPeriods[0]);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const createFallbackPeriods = () => {
        const currentYear = new Date().getFullYear();
        return [
            {
                id: `${currentYear - 2}-01-01-${currentYear}-12-31`,
                start_date: `${currentYear - 2}-01-01`,
                end_date: `${currentYear}-12-31`,
                label: `${currentYear - 2} - ${currentYear} (Current)`,
                period_type: 'triennial',
                hours_required: 120,
                ethics_required: 4,
                annual_minimum: 20,
                duration_years: 3,
                is_current: true,
                is_historical: false,
                is_future: false,
                description: `Current 3-year period: ${currentYear - 2} - ${currentYear}`
            }
        ];
    };

    const handlePeriodChange = async (event) => {
        const selectedId = event.target.value;
        const period = availablePeriods.find(p => p.id === selectedId);

        if (!period || period.id === selectedPeriod?.id) return;

        setSelectedPeriod(period);
        setAnalyzing(true);

        try {
            // Try to analyze the selected period
            const analysisResponse = await fetch(`/api/time-windows/${licenseNumber}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_date: period.start_date,
                    end_date: period.end_date
                })
            });

            if (analysisResponse.ok) {
                const analysis = await analysisResponse.json();

                // Update the period with analysis data
                const updatedPeriod = {
                    ...period,
                    analysis: analysis
                };

                if (onAnalysisLoad) {
                    onAnalysisLoad(analysis);
                }

                toast.success(`Analyzing period: ${formatPeriodLabel(period)}`);
            } else {
                console.log('Analysis endpoint not available, using basic period data');
            }

            if (onPeriodSelect) {
                onPeriodSelect(period);
            }

        } catch (error) {
            console.error('Failed to analyze period:', error);
            // Still proceed with period selection even if analysis fails
            if (onPeriodSelect) {
                onPeriodSelect(period);
            }
        } finally {
            setAnalyzing(false);
        }
    };

    const formatPeriodLabel = (period) => {
        const startDate = new Date(period.start_date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
        const endDate = new Date(period.end_date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
        return `${startDate} - ${endDate}`;
    };

    const getPeriodBadge = (period) => {
        if (period.is_current) return <Badge variant="success">Current</Badge>;
        if (period.is_historical) return <Badge variant="neutral">Past</Badge>;
        if (period.is_future) return <Badge variant="primary">Future</Badge>;
        return null;
    };

    const getPeriodDetails = (period) => {
        const years = period.duration_years || (period.period_type === 'biennial' ? 2 : 3);
        const hours = period.hours_required || (years === 2 ? 80 : 120);
        const ethics = period.ethics_required || 4;
        return `${years} years • ${hours} hours • ${ethics} ethics`;
    };

    if (loading) {
        return (
            <div className={styles.periodSelector}>
                <div className={styles.selectorHeader}>
                    <Calendar size={20} />
                    <h3>Compliance Period to Track</h3>
                </div>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Loading available periods...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.periodSelector}>
            <div className={styles.selectorHeader}>
                <Calendar size={20} />
                <h3>Compliance Period to Track</h3>
                {analyzing && (
                    <div className={styles.analyzing}>
                        <div className={styles.spinner}></div>
                        <span>Analyzing...</span>
                    </div>
                )}
            </div>

            <div className={styles.selectorContent}>
                <div className={styles.dropdownWrapper}>
                    <select
                        className={styles.dropdown}
                        value={selectedPeriod?.id || ''}
                        onChange={handlePeriodChange}
                        disabled={analyzing}
                    >
                        <option value="">Select a compliance period...</option>
                        {availablePeriods.map((period) => (
                            <option key={period.id} value={period.id}>
                                {formatPeriodLabel(period)} ({period.duration_years || (period.period_type === 'biennial' ? 2 : 3)} years)
                                {period.is_current ? ' - Current' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedPeriod && (
                    <div className={styles.selectedPeriodCard}>
                        <div className={styles.periodInfo}>
                            <div className={styles.periodTitle}>
                                <span className={styles.periodLabel}>
                                    {formatPeriodLabel(selectedPeriod)}
                                </span>
                                {getPeriodBadge(selectedPeriod)}
                            </div>
                            <div className={styles.periodDetails}>
                                <BarChart3 size={16} />
                                <span>{getPeriodDetails(selectedPeriod)}</span>
                            </div>
                        </div>

                        {selectedPeriod.is_current && (
                            <div className={styles.currentPeriodNote}>
                                <Clock size={14} />
                                <span>This is your current compliance period</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PeriodSelector;