import React, { useState } from 'react';
import { useCheckpoints } from '../../hooks/useCheckpoints';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import ChartContainer from '../charts/ChartContainer';
import ProgressBarChart from '../charts/ProgressBarChart';
import { CHART_COLORS } from '../../utils/colorPalette';

const CheckpointsTab = ({ projects: currentProjects = [] }) => {
    const { checkpoints, loading, createProjectCheckpoint } = useCheckpoints();
    const [activeTab, setActiveTab] = useState('projects'); // projects, categories, classes

    // Process data for charts
    const comparisonData = React.useMemo(() => {
        if (!checkpoints.projects || currentProjects.length === 0) return [];

        return Object.values(checkpoints.projects).map(cp => {
            const currentProject = currentProjects.find(p => p.id === cp.project_id);
            const currentTotal = currentProject?.latest_metrics?.metrics?._summary?.total_images || 0;

            // Calculate checkpoint total
            const checkpointTotal = Object.entries(cp.metrics || {}).reduce((sum, [key, val]) => {
                if (key === '_summary') return sum;
                return sum + (val.image_count || 0);
            }, 0);

            return {
                name: cp.project_title,
                checkpoint: checkpointTotal,
                current: currentTotal,
                growth: Math.max(0, currentTotal - checkpointTotal)
            };
        }).filter(d => d.current > 0);
    }, [checkpoints, currentProjects]);

    if (loading) return <LoadingSpinner message="Loading checkpoints..." />;

    const renderProjectCheckpoints = () => {
        const projects = Object.values(checkpoints.projects || {});
        if (projects.length === 0) return <p className="text-gray-500">No project checkpoints found.</p>;

        return (
            <div>
                {/* Visualizations */}
                {comparisonData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <ChartContainer
                            title="Checkpoint vs Current"
                            subtitle="Total images comparison"
                            height={300}
                        >
                            <ProgressBarChart
                                data={comparisonData}
                                dataKeys={['checkpoint', 'current']}
                                colors={[CHART_COLORS.gray, CHART_COLORS.primary]}
                            />
                        </ChartContainer>

                        <ChartContainer
                            title="Growth Since Checkpoint"
                            subtitle="New images added"
                            height={300}
                        >
                            <ProgressBarChart
                                data={comparisonData}
                                dataKeys={['growth']}
                                colors={[CHART_COLORS.success]}
                            />
                        </ChartContainer>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded shadow">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left">Project</th>
                                <th className="px-4 py-2 text-left">Date Marked</th>
                                <th className="px-4 py-2 text-left">Snapshot Date</th>
                                <th className="px-4 py-2 text-left">Note</th>
                                <th className="px-4 py-2 text-left">Total Images</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(cp => (
                                <tr key={cp.project_id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{cp.project_title}</td>
                                    <td className="px-4 py-2">{formatDate(cp.marked_at)}</td>
                                    <td className="px-4 py-2">{formatDate(cp.timestamp)}</td>
                                    <td className="px-4 py-2 text-gray-600">{cp.note || '-'}</td>
                                    <td className="px-4 py-2 font-bold">
                                        {Object.entries(cp.metrics || {}).reduce((sum, [key, val]) => {
                                            if (key === '_summary') return sum;
                                            return sum + (val.image_count || 0);
                                        }, 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderClassCheckpoints = () => {
        const classes = Object.values(checkpoints.classes || {});
        if (classes.length === 0) return <p className="text-gray-500">No class checkpoints found.</p>;

        return (
            <div className="overflow-x-auto">
                <table className="w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Class</th>
                            <th className="px-4 py-2 text-left">X-ray Type</th>
                            <th className="px-4 py-2 text-left">Date Marked</th>
                            <th className="px-4 py-2 text-left">Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map((cp, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium capitalize">{cp.class_name}</td>
                                <td className="px-4 py-2">{cp.xray_type}</td>
                                <td className="px-4 py-2">{formatDate(cp.marked_at)}</td>
                                <td className="px-4 py-2 text-gray-600">{cp.note || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">📍 Checkpoints Manager</h2>

            <div className="flex space-x-4 mb-6 border-b">
                <button
                    className={`pb-2 px-4 ${activeTab === 'projects' ? 'border-b-2 border-primary font-bold text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('projects')}
                >
                    Project Checkpoints
                </button>
                <button
                    className={`pb-2 px-4 ${activeTab === 'classes' ? 'border-b-2 border-primary font-bold text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('classes')}
                >
                    Class Checkpoints
                </button>
            </div>

            {activeTab === 'projects' && renderProjectCheckpoints()}
            {activeTab === 'classes' && renderClassCheckpoints()}
        </div>
    );
};

export default CheckpointsTab;
