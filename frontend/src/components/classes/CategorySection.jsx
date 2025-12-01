import React, { useState, useEffect } from 'react';
import ClassMetricsTable from './ClassMetricsTable';
import HistoryViewer from '../common/HistoryViewer';
import CheckpointButton from '../common/CheckpointButton';
import { XRAY_TYPES } from '../../utils/constants';
import { categoriesAPI, checkpointsAPI } from '../../services/api';

import ChartContainer from '../charts/ChartContainer';
import ClassPieChart from '../charts/ClassPieChart';
import ProgressBarChart from '../charts/ProgressBarChart';
import { CHART_COLORS, getModalityColor } from '../../utils/colorPalette';

const CategorySection = ({
    category,
    classes,
    metrics,
    previousMetrics,
    checkpoints,
    onRefresh
}) => {
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const categoryCheckpoint = checkpoints?.categories?.[category];

    // Process data for charts
    const modalityData = React.useMemo(() => {
        if (!metrics) return [];
        return ['OPG', 'Bitewing', 'IOPA'].map(type => {
            const typeMetrics = metrics[type] || {};
            const total = Object.values(typeMetrics).reduce((sum, m) => sum + (m.image_count || 0), 0);
            return { name: type, value: total };
        }).filter(d => d.value > 0);
    }, [metrics]);

    const classComparisonData = React.useMemo(() => {
        if (!metrics || !classes) return [];

        return classes.map(className => {
            const opgCount = metrics.OPG?.[className]?.image_count || 0;
            const bwCount = metrics.Bitewing?.[className]?.image_count || 0;
            const iopaCount = metrics.IOPA?.[className]?.image_count || 0;

            return {
                name: className,
                OPG: opgCount,
                Bitewing: bwCount,
                IOPA: iopaCount,
                total: opgCount + bwCount + iopaCount
            };
        }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
    }, [metrics, classes]);

    const handleViewHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await categoriesAPI.getHistory(category);
            setHistory(response.data.history);
            setShowHistory(true);
        } catch (error) {
            console.error('Error loading history:', error);
            alert('Failed to load history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleCreateCheckpoint = async (note) => {
        try {
            await checkpointsAPI.createCategory(category, note);
            alert('Checkpoint created successfully!');
            window.location.reload(); // Refresh to show new checkpoint
        } catch (error) {
            throw error;
        }
    };

    const handleRefresh = async () => {
        if (refreshing) return; // Prevent multiple clicks

        setRefreshing(true);
        try {
            await onRefresh(category);
            alert(`${category} refreshed successfully!`);
            // Refresh history to show new entry
            if (showHistory) {
                await handleViewHistory();
            }
        } catch (error) {
            console.error('Error refreshing category:', error);
            alert('Refresh failed');
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">🏷️ {category}</span>
                    {categoryCheckpoint && (
                        <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                            📍 Checkpoint Set
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleViewHistory}
                        disabled={loadingHistory}
                        className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm transition-colors flex items-center gap-2"
                    >
                        <span>📊</span>
                        <span>{loadingHistory ? 'Loading...' : 'View History'}</span>
                    </button>

                    <CheckpointButton
                        onCheckpoint={handleCreateCheckpoint}
                        label="Set Checkpoint"
                        size="md"
                    />

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {refreshing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Refreshing...</span>
                            </>
                        ) : (
                            <>
                                <span>🔄</span>
                                <span>Refresh</span>
                            </>
                        )}
                    </button>
                </div>
            </div>



            {/* Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-6">
                <ChartContainer
                    title="Modality Distribution"
                    subtitle="Images by X-ray type"
                    height={250}
                    loading={!modalityData.length}
                >
                    <ClassPieChart
                        data={modalityData}
                        colors={modalityData.map(d => getModalityColor(d.name))}
                    />
                </ChartContainer>

                <ChartContainer
                    title="Class Breakdown"
                    subtitle="Distribution across modalities"
                    height={250}
                    loading={!classComparisonData.length}
                >
                    <ProgressBarChart
                        data={classComparisonData}
                        dataKeys={['OPG', 'Bitewing', 'IOPA']}
                        colors={[CHART_COLORS.opg, CHART_COLORS.bitewing, CHART_COLORS.iopa]}
                        stacked={true}
                    />
                </ChartContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {Object.keys(XRAY_TYPES).map(xrayType => (
                    <ClassMetricsTable
                        key={xrayType}
                        category={category}
                        classes={classes}
                        xrayType={xrayType}
                        metrics={metrics[xrayType] || {}}
                        previousMetrics={previousMetrics?.[xrayType]}
                        checkpoints={checkpoints}
                    />
                ))}
            </div>

            {/* History Modal */}
            {
                showHistory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-xl font-bold">{category} - History</h2>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <HistoryViewer history={history} type="category" />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CategorySection;
