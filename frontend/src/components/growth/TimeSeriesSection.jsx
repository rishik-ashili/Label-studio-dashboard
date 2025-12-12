import React, { useState, useEffect } from 'react';
import TimeSeriesCard from './TimeSeriesCard';
import { growthAPI } from '../../services/api';

const TimeSeriesSection = () => {
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serverTime, setServerTime] = useState('');
    const [activeRange, setActiveRange] = useState('7d');
    const [showCustom, setShowCustom] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        fetchMetrics(activeRange);
    }, [activeRange]);

    const fetchMetrics = async (range, startDate = null, endDate = null) => {
        setLoading(true);
        try {
            let response;
            if (startDate && endDate) {
                response = await growthAPI.getTimeSeriesCustom(startDate, endDate);
            } else {
                response = await growthAPI.getTimeSeries(range);
            }

            setMetrics(response.data.metrics || []);
            setServerTime(response.data.serverTime || new Date().toISOString());
        } catch (error) {
            console.error('Failed to fetch time series metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            fetchMetrics('custom', customStart, customEnd);
            setShowCustom(false);
        }
    };

    const groupedMetrics = React.useMemo(() => {
        const grouped = { 'Pathology': [], 'Non-Pathology': [], 'Tooth Parts': [], 'Others': [] };

        metrics.forEach(metric => {
            const category = metric.category || 'Others';
            if (grouped[category]) {
                grouped[category].push(metric);
            }
        });

        return Object.fromEntries(
            Object.entries(grouped).filter(([_, items]) => items.length > 0)
        );
    }, [metrics]);

    const formatServerTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
    };

    return (
        <div className="mt-8">
            <div className="border-t-2 border-gray-300 pt-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">📊 Time Series Analytics</h2>
                    <p className="text-sm text-gray-600">
                        Server Time: <span className="font-mono font-semibold">{formatServerTime(serverTime)}</span>
                    </p>
                </div>

                {/* Time Range Tabs */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setActiveRange('24h')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeRange === '24h'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            24 Hours
                        </button>
                        <button
                            onClick={() => setActiveRange('7d')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeRange === '7d'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setActiveRange('30d')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeRange === '30d'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setShowCustom(!showCustom)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${showCustom
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Custom Range ▼
                        </button>
                    </div>

                    {/* Custom Range Picker */}
                    {showCustom && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        From
                                    </label>
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        To
                                    </label>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={handleCustomApply}
                                    disabled={!customStart || !customEnd}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading time series data...</p>
                    </div>
                )}

                {/* No Data State */}
                {!loading && metrics.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                        <p className="text-xl text-yellow-700 font-semibold mb-2">
                            No Time Series Data Yet
                        </p>
                        <p className="text-sm text-yellow-600">
                            Refresh your projects to start collecting time-series data
                        </p>
                    </div>
                )}

                {/* Metrics Display */}
                {!loading && metrics.length > 0 && (
                    <div className="space-y-8">
                        {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                            <div key={category}>
                                <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-300">
                                    {category}
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        ({categoryMetrics.length} {categoryMetrics.length === 1 ? 'metric' : 'metrics'})
                                    </span>
                                </h3>
                                <div>
                                    {categoryMetrics.map((metric) => (
                                        <TimeSeriesCard key={metric.modalityClass} metric={metric} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeSeriesSection;
