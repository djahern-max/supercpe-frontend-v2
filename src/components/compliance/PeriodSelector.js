// src/components/compliance/CompactPeriodSelector.js
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';
import styles from '../../styles/components/PeriodSelector.module.css';

const PeriodSelector = ({ licenseNumber, onPeriodChange, selectedPeriod }) => {
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        loadAvailablePeriods();
    }, [licenseNumber]);

    const loadAvailablePeriods = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAvailablePeriods(licenseNumber);

            // Handle the API response structure
            const periods = response.available_windows || response || [];

            // Transform the API data to match our component needs
            const transformedPeriods = periods.map((period, index) => ({
                id: `${period.start_date}-${period.end_date}`,
                start_date: period.start_date,
                end_date: period.end_date,
                label: period.description || `${period.start_date} - ${period.end_date}`,
                period_type: period.period_type,
                total_hours_required: period.hours_required,
                ethics_hours_required: period.ethics_required,
                duration_years: period.period_type === 'biennial' ? 2 : 3,
                is_current: period.is_current,
                is_historical: period.is_historical,
                is_future: period.is_future,
                description: period.window_description || period.description
            }));

            setAvailablePeriods(transformedPeriods);

            // Auto-select current period if no period is selected
            if (!selectedPeriod && transformedPeriods.length > 0) {
                const currentPeriod = transformedPeriods.find(p => p.is_current) || transformedPeriods[0];
                onPeriodChange(currentPeriod);
            }
        } catch (error) {
            console.error('Failed to load periods:', error);
            toast.error('Failed to load compliance periods');
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = async (event) => {
        const selectedId = event.target.value;
        const period = availablePeriods.find(p => p.id === selectedId);

        if (!period || period.id === selectedPeriod?.id) return;

        setAnalyzing(true);
        try {
            // Analyze the selected period
            const analysis = await apiService.analyzeTimeWindow(licenseNumber, {
                start_date: period.start_date,
                end_date: period.end_date
            });

            // Update the period with analysis data
            const updatedPeriod = {
                ...period,
                analysis: analysis
            };

            onPeriodChange(updatedPeriod);
            toast.success(`Switched to tracking period: ${formatPeriodLabel(period)}`);
        } catch (error) {
            console.error('Failed to analyze period:', error);
            toast.error('Failed to analyze selected period');
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
        return `${period.duration_years} years • ${period.total_hours_required} hours • ${period.ethics_hours_required} ethics`;
    };

    if (loading) {
        return (
            <Card className={styles.compactSelector}>
                <div className={styles.loading}>
                    <div className="loading-spinner"></div>
                    <span>Loading periods...</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className={styles.compactSelector}>
            <div className={styles.selectorContent}>
                <div className={styles.selectorHeader}>
                    <label htmlFor="period-select" className={styles.label}>
                        Compliance Period to Track:
                    </label>
                    {analyzing && (
                        <div className={styles.analyzing}>
                            <div className="loading-spinner"></div>
                            <span>Analyzing period...</span>
                        </div>
                    )}
                </div>

                <div className={styles.selectorRow}>
                    <select
                        id="period-select"
                        className={styles.dropdown}
                        value={selectedPeriod?.id || ''}
                        onChange={handlePeriodChange}
                        disabled={analyzing}
                    >
                        <option value="">Select a compliance period...</option>
                        {availablePeriods.map((period) => (
                            <option key={period.id} value={period.id}>
                                {formatPeriodLabel(period)} ({period.period_type === 'biennial' ? '2 years' : '3 years'})
                                {period.is_current ? ' - Current' : ''}
                            </option>
                        ))}
                    </select>

                    {selectedPeriod && (
                        <div className={styles.selectedPeriodInfo}>
                            {getPeriodBadge(selectedPeriod)}
                            <span className={styles.periodDetails}>
                                {getPeriodDetails(selectedPeriod)}
                            </span>
                        </div>
                    )}
                </div>


            </div>
        </Card>
    );
};

export default PeriodSelector;