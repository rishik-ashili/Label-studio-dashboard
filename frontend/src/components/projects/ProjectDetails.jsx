import React, { useState, useEffect, useMemo } from 'react';
import { projectsAPI, checkpointsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import HistoryViewer from '../common/HistoryViewer';
import { formatDate, formatNumber } from '../../utils/formatters';
import { calculateDelta } from '../../utils/formatters';
import ChartContainer from '../charts/ChartContainer';
import TimelineChart from '../charts/TimelineChart';
import ClassPieChart from '../charts/ClassPieChart';
import ProgressBarChart from '../charts/ProgressBarChart';
import { processTimelineData, processClassDistribution, processCheckpointComparison, calculateProgressMetrics } from '../../utils/chartDataProcessors';
import { getClassColor } from '../../utils/colorPalette';
import { CHART_COLORS } from '../../utils/colorPalette';

const ProjectDetails = ({ project, onBack }) => {
    const [projectData, setProjectData] = useState(null);
    const [checkpoint, setCheckpoint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCheckpointForm, setShowCheckpointForm] = useState(false);
    const [checkpointNote, setCheckpointNote] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchProjectData();
        fetchCheckpoint();
    }, [project.id]);

    const fetchProjectData = async () => {
        try {
            const response = await projectsAPI.getOne(project.id);
            setProjectData(response.data);
        } catch (error) {
            console.error('Error fetching project data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCheckpoint = async () => {
        try {
            const response = await checkpointsAPI.getAll();
            setCheckpoint(response.data.projects[project.id]);
        } catch (error) {
            console.error('Error fetching checkpoint:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await projectsAPI.refresh(project.id, project.title);
            await fetchProjectData();
            await fetchCheckpoint();
        } catch (error) {
            console.error('Error refreshing project:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateCheckpoint = async () => {
        try {
            await checkpointsAPI.createProject(project.id, project.title, checkpointNote);
            await fetchCheckpoint();
            setShowCheckpointForm(false);
            setCheckpointNote('');
            alert('Checkpoint created!');
        } catch (error) {
            console.error('Error creating checkpoint:', error);
            alert('Failed to create checkpoint');
        }
    };

    // Process data for charts
    const latest = projectData?.history?.[projectData.history.length - 1];

    const timelineData = useMemo(() => {
        if (!projectData || !projectData.history) return [];
        return processTimelineData(projectData.history);
    }, [projectData]);

    const classDistributionData = useMemo(() => {
        if (!projectData || !latest) return [];
        return processClassDistribution(latest.metrics);
    }, [projectData, latest]);

    const progressData = useMemo(() => {
        if (!projectData || !projectData.history) return [];
        const metrics = calculateProgressMetrics(projectData.history);
        return [
            { name: 'Today', value: metrics.today },
            { name: 'Yesterday', value: metrics.yesterday },
            { name: 'This Week', value: metrics.week },
            { name: 'This Month', value: metrics.month }
        ];
    }, [projectData]);

    const checkpointComparisonData = useMemo(() => {
        if (!latest || !checkpoint) return [];
        return processCheckpointComparison(latest.metrics, checkpoint.metrics);
    }, [latest, checkpoint]);

    if (loading) {
        return <LoadingSpinner message="Loading project details..." />;
    }

    if (!projectData || !projectData.history || projectData.history.length === 0) {
        return (
            <div>
                <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded mb-4">
                    ← Back to Projects
                </button>
                <p className="text-yellow-700 bg-yellow-100 p-4 rounded">
                    No data available. Fetching data...
                </p>
            </div>
        );
    }

    const history = projectData.history;
    // latest is already defined above
    const metrics = latest.metrics;
    const summary = metrics._summary || {};
    const previous = history.length >= 2 ? history[history.length - 2].metrics : null;
    const delta = calculateDelta(metrics, previous);

    return (
        <div>
            <p className="text-sm mb-2">🟢 = change from last refresh | 📍 = change from checkpoint</p>

            <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded mb-4">
                ← Back to Projects
            </button>

            <h1 className="text-3xl font-bold mb-4">📊 {project.title}</h1>

            <div className="bg-blue-100 p-3 rounded mb-4">
                🕐 Last refreshed: {formatDate(latest.timestamp)}
            </div>

            <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full px-4 py-3 bg-primary text-white rounded font-semibold mb-4 disabled:opacity-50"
            >
                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
            </button>

            <hr className="my-4" />

            {/* Checkpoint Section */}
            <div className="mb-4">
                {checkpoint && (
                    <div className="bg-success text-white p-3 rounded mb-2">
                        ✓ Checkpoint: {formatDate(checkpoint.timestamp)}
                        {checkpoint.note && <p className="text-sm mt-1">Note: {checkpoint.note}</p>}
                    </div>
                )}

                <button
                    onClick={() => setShowCheckpointForm(!showCheckpointForm)}
                    className="text-sm px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    📍 Set Checkpoint {showCheckpointForm ? '▼' : '▶'}
                </button>

                {showCheckpointForm && (
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                        <input
                            type="text"
                            placeholder="Note (optional)"
                            value={checkpointNote}
                            onChange={(e) => setCheckpointNote(e.target.value)}
                            className="w-full px-3 py-2 border rounded mb-2"
                        />
                        <button
                            onClick={handleCreateCheckpoint}
                            className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-blue-600"
                        >
                            📍 Mark as Checkpoint
                        </button>
                    </div>
                )}
            </div>

            <hr className="my-4" />

            {/* Summary */}
            <h2 className="text-2xl font-bold mb-3">📊 Summary</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow">
                    <p className="text-sm text-gray-600">Total Images</p>
                    <p className="text-2xl font-bold">{summary.total_images || 0}</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <p className="text-sm text-gray-600">Annotated Images</p>
                    <p className="text-2xl font-bold">{summary.annotated_images || 0}</p>
                    <p className="text-sm text-gray-600">
                        {summary.total_images > 0 ?
                            ((summary.annotated_images / summary.total_images) * 100).toFixed(1) + '%' :
                            '0%'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <p className="text-sm text-gray-600">Unannotated Images</p>
                    <p className="text-2xl font-bold">{summary.unannotated_images || 0}</p>
                </div>
            </div>

            <hr className="my-6" />

            {/* Data Visualizations */}
            <h2 className="text-2xl font-bold mb-4">📊 Data Visualizations</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Timeline Chart */}
                <ChartContainer
                    title="Annotation Progress Timeline"
                    subtitle="Total images over time"
                    height={300}
                    loading={!timelineData.length}
                >
                    <TimelineChart
                        data={timelineData}
                        dataKeys={['total']}
                        colors={[CHART_COLORS.primary]}
                    />
                </ChartContainer>

                {/* Class Distribution Pie Chart */}
                <ChartContainer
                    title="Class Distribution"
                    subtitle="Current distribution across classes"
                    height={300}
                    loading={!classDistributionData.length}
                >
                    <ClassPieChart
                        data={classDistributionData}
                        colors={classDistributionData.map(item => getClassColor(item.name))}
                    />
                </ChartContainer>

                {/* Progress Comparison Bar Chart */}
                <ChartContainer
                    title="Recent Activity"
                    subtitle="Image count changes over time periods"
                    height={300}
                    loading={!progressData.length}
                >
                    <ProgressBarChart
                        data={progressData}
                        dataKeys={['value']}
                        colors={[CHART_COLORS.success]}
                    />
                </ChartContainer>

                {/* Checkpoint Comparison */}
                {checkpoint && (
                    <ChartContainer
                        title="Growth Since Checkpoint"
                        subtitle={`Comparing current vs checkpoint (${formatDate(checkpoint.timestamp)})`}
                        height={300}
                        loading={!checkpointComparisonData.length}
                    >
                        <ProgressBarChart
                            data={checkpointComparisonData}
                            dataKeys={['current', 'checkpoint']}
                            colors={[CHART_COLORS.primary, CHART_COLORS.gray]}
                        />
                    </ChartContainer>
                )}
            </div>

            <hr className="my-4" />

            {/* Class-wise Metrics */}
            <h2 className="text-2xl font-bold mb-3">📋 Current Class Metrics</h2>

            <div className="overflow-x-auto">
                <table className="w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 text-left">Class</th>
                            <th className="px-4 py-2 text-left">Images</th>
                            <th className="px-4 py-2 text-left">Annotations</th>
                            <th className="px-4 py-2 text-left">Image Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(metrics)
                            .filter(k => k !== '_summary')
                            .sort()
                            .map((className) => {
                                const classMetrics = metrics[className];
                                const changeParts = [];

                                // Delta from last refresh
                                if (delta && delta[className]) {
                                    const imgDelta = delta[className].image_count_delta;
                                    if (imgDelta > 0) {
                                        changeParts.push(`🟢 +${imgDelta}`);
                                    } else if (imgDelta === 0) {
                                        changeParts.push('+0');
                                    } else {
                                        changeParts.push(String(imgDelta));
                                    }
                                } else {
                                    changeParts.push('—');
                                }

                                // Delta from checkpoint
                                if (checkpoint) {
                                    const checkpointMetrics = checkpoint.metrics;
                                    const currCount = classMetrics.image_count || 0;
                                    const checkpointCount = checkpointMetrics[className]?.image_count || 0;

                                    if (checkpointCount > 0) {
                                        const cpDelta = currCount - checkpointCount;
                                        if (cpDelta > 0) {
                                            changeParts.push(`📍 +${cpDelta}`);
                                        } else if (cpDelta !== 0) {
                                            changeParts.push(`📍 ${cpDelta}`);
                                        }
                                    }
                                }

                                return (
                                    <tr key={className} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-2 font-semibold capitalize">{className}</td>
                                        <td className="px-4 py-2">{classMetrics.image_count || 0}</td>
                                        <td className="px-4 py-2">{classMetrics.annotation_count || 0}</td>
                                        <td className="px-4 py-2">{changeParts.join(' | ')}</td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>

            <hr className="my-6" />

            {/* History Timeline Section */}
            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">📊 Refresh History</h2>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                        {showHistory ? '▼ Hide History' : '▶ View History'} ({history.length} refreshes)
                    </button>
                </div>

                {showHistory && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <HistoryViewer history={history} type="project" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
