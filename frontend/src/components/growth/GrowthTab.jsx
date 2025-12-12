import React, { useState, useEffect } from 'react';
import GrowthCard from './GrowthCard';
import TimeSeriesSection from './TimeSeriesSection';
import LoadingSpinner from '../common/LoadingSpinner';
import { growthAPI } from '../../services/api';
import { CLASS_CATEGORIES } from '../../utils/constants';

const GrowthTab = () => {
    const [activeSubTab, setActiveSubTab] = useState('checkpoint');
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(20);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (activeSubTab === 'checkpoint') {
            fetchGrowthMetrics();
        }
    }, [threshold, activeSubTab]);

    const fetchGrowthMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await growthAPI.getMetrics(threshold);
            setMetrics(response.data.metrics || []);
        } catch (err) {
            console.error('Failed to fetch growth metrics:', err);
            setError('Failed to load growth data');
        } finally {
            setLoading(false);
        }
    };

    const groupedMetrics = React.useMemo(() => {
        const grouped = {};

        // Initialize categories
        Object.keys(CLASS_CATEGORIES).forEach(cat => {
            grouped[cat] = [];
        });

        // Group metrics by category
        metrics.forEach(metric => {
            const category = metric.category || 'Others';
            if (grouped[category]) {
                grouped[category].push(metric);
            }
        });

        // Remove empty categories
        return Object.fromEntries(
            Object.entries(grouped).filter(([_, items]) => items.length > 0)
        );
    }, [metrics]);

    const handleReset = () => {
        setThreshold(20);
    };

    const subTabs = [
        { id: 'checkpoint', label: 'Checkpoint Growth', icon: '🎯' },
        { id: 'timeseries', label: 'Time Series', icon: '📊' }
    ];

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">📈 Growth Tracking</h2>
                <p className="text-gray-600">
                    Track modality-class growth across all projects
                </p>
            </div>

            {/* Sub-tabs Navigation */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex border-b">
                    {subTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex-1 px-6 py-4 font-semibold text-center transition-all relative
                                ${activeSubTab === tab.id
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                            {activeSubTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Checkpoint Growth Content */}
            {activeSubTab === 'checkpoint' && (
                <>
                    {loading && metrics.length === 0 ? (
                        <LoadingSpinner message="Loading growth metrics..." />
                    ) : (
                        <>
                            {/* Threshold Slider */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="font-semibold text-gray-700">
                                        Growth Threshold
                                    </label>
                                    <button
                                        onClick={handleReset}
                                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                                    >
                                        Reset to 20%
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={threshold}
                                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="min-w-[80px] text-right">
                                        <span className="text-2xl font-bold text-blue-600">{threshold}%</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                </div>

                                {loading && (
                                    <div className="mt-4 text-center text-sm text-gray-500">
                                        Updating metrics...
                                    </div>
                                )}
                            </div>

                            {/* Error State */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                    {error}
                                </div>
                            )}

                            {/* Metrics Display */}
                            {metrics.length === 0 && !loading ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                                    <p className="text-xl text-yellow-700 font-semibold mb-2">
                                        No Growth Above {threshold}%
                                    </p>
                                    <p className="text-sm text-yellow-600">
                                        Try lowering the threshold to see more results
                                    </p>
                                </div>
                            ) : (
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
                                                {categoryMetrics.map((metric, idx) => (
                                                    <GrowthCard key={metric.modalityClass || idx} metric={metric} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Time Series Content */}
            {activeSubTab === 'timeseries' && (
                <TimeSeriesSection />
            )}
        </div>
    );
};

export default GrowthTab;
