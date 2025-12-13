import React, { useState } from 'react';
import { useCheckpoints } from '../../hooks/useCheckpoints';
import { formatDate } from '../../utils/formatters';
import { checkpointsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ChartContainer from '../charts/ChartContainer';
import ProgressBarChart from '../charts/ProgressBarChart';
import { CHART_COLORS } from '../../utils/colorPalette';

const CheckpointsTab = ({ projects: currentProjects = [] }) => {
    const { checkpoints, loading, fetchCheckpoints } = useCheckpoints();
    const [activeTab, setActiveTab] = useState('projects'); // projects, categories, classes

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editNote, setEditNote] = useState('');
    const [saving, setSaving] = useState(false);

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

    const handleEditNote = (id, currentNote, type) => {
        setEditingId(`${type}-${id}`);
        setEditNote(currentNote || '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditNote('');
    };

    const handleSaveNote = async (id, type) => {
        setSaving(true);
        try {
            if (type === 'project') {
                await checkpointsAPI.updateProjectNote(id, editNote);
            } else if (type === 'class') {
                const [className, xrayType] = id.split('_');
                await checkpointsAPI.updateClassNote(className, xrayType, editNote);
            }

            await fetchCheckpoints();
            setEditingId(null);
            setEditNote('');
        } catch (error) {
            console.error('Error updating note:', error);
            alert('Failed to update note');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading checkpoints..." />;

    const renderProjectCheckpoints = () => {
        const projects = Object.values(checkpoints.projects || {});
        if (projects.length === 0) return <p className="text-gray-500">No project checkpoints found.</p>;

        return (
            <div>
                {/* Visualizations */}
                {comparisonData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                    <table className="w-full bg-white rounded shadow text-sm sm:text-base">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-2 sm:px-4 py-2 text-left">Project</th>
                                <th className="px-2 sm:px-4 py-2 text-left hidden md:table-cell">Date Marked</th>
                                <th className="px-2 sm:px-4 py-2 text-left hidden lg:table-cell">Snapshot Date</th>
                                <th className="px-2 sm:px-4 py-2 text-left">Note</th>
                                <th className="px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Total Images</th>
                                <th className="px-2 sm:px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(cp => {
                                const editKey = `project-${cp.project_id}`;
                                const isEditing = editingId === editKey;

                                return (
                                    <tr key={cp.project_id} className="border-t hover:bg-gray-50">
                                        <td className="px-2 sm:px-4 py-2 font-medium">{cp.project_title}</td>
                                        <td className="px-2 sm:px-4 py-2 hidden md:table-cell">{formatDate(cp.marked_at)}</td>
                                        <td className="px-2 sm:px-4 py-2 hidden lg:table-cell">{formatDate(cp.timestamp)}</td>
                                        <td className="px-2 sm:px-4 py-2 text-gray-600">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editNote}
                                                    onChange={(e) => setEditNote(e.target.value)}
                                                    className="w-full px-2 py-1 border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span>{cp.note || '-'}</span>
                                            )}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 font-bold hidden sm:table-cell">
                                            {Object.entries(cp.metrics || {}).reduce((sum, [key, val]) => {
                                                if (key === '_summary') return sum;
                                                return sum + (val.image_count || 0);
                                            }, 0)}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2">
                                            {isEditing ? (
                                                <div className="flex gap-1 sm:gap-2">
                                                    <button
                                                        onClick={() => handleSaveNote(cp.project_id, 'project')}
                                                        disabled={saving}
                                                        className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        ✓ Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        disabled={saving}
                                                        className="px-2 sm:px-3 py-1 bg-gray-400 text-white rounded text-xs sm:text-sm hover:bg-gray-500 disabled:opacity-50"
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditNote(cp.project_id, cp.note, 'project')}
                                                    className="px-2 sm:px-3 py-1 bg-indigo-600 text-white rounded text-xs sm:text-sm hover:bg-indigo-700"
                                                >
                                                    ✏️ Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
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
                <table className="w-full bg-white rounded shadow text-sm sm:text-base">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-2 sm:px-4 py-2 text-left">Class</th>
                            <th className="px-2 sm:px-4 py-2 text-left">X-ray Type</th>
                            <th className="px-2 sm:px-4 py-2 text-left hidden md:table-cell">Date Marked</th>
                            <th className="px-2 sm:px-4 py-2 text-left">Note</th>
                            <th className="px-2 sm:px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map((cp, idx) => {
                            const editKey = `class-${cp.class_name}_${cp.xray_type}`;
                            const isEditing = editingId === editKey;

                            return (
                                <tr key={idx} className="border-t hover:bg-gray-50">
                                    <td className="px-2 sm:px-4 py-2 font-medium capitalize">{cp.class_name}</td>
                                    <td className="px-2 sm:px-4 py-2">{cp.xray_type}</td>
                                    <td className="px-2 sm:px-4 py-2 hidden md:table-cell">{formatDate(cp.marked_at)}</td>
                                    <td className="px-2 sm:px-4 py-2 text-gray-600">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editNote}
                                                onChange={(e) => setEditNote(e.target.value)}
                                                className="w-full px-2 py-1 border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{cp.note || '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-2 sm:px-4 py-2">
                                        {isEditing ? (
                                            <div className="flex gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => handleSaveNote(`${cp.class_name}_${cp.xray_type}`, 'class')}
                                                    disabled={saving}
                                                    className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    ✓ Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={saving}
                                                    className="px-2 sm:px-3 py-1 bg-gray-400 text-white rounded text-xs sm:text-sm hover:bg-gray-500 disabled:opacity-50"
                                                >
                                                    ✕ Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditNote(`${cp.class_name}_${cp.xray_type}`, cp.note, 'class')}
                                                className="px-2 sm:px-3 py-1 bg-indigo-600 text-white rounded text-xs sm:text-sm hover:bg-indigo-700"
                                            >
                                                ✏️ Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">📍 Checkpoints Manager</h2>

            <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6 border-b overflow-x-auto">
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'projects' ? 'border-b-2 border-primary font-bold text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('projects')}
                >
                    Project Checkpoints
                </button>
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'classes' ? 'border-b-2 border-primary font-bold text-primary' : 'text-gray-500'}`}
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
