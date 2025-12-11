import React, { useState } from 'react';
import MetricCard from '../common/MetricCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatTimeAgo } from '../../utils/formatters';
import { modalitiesAPI } from '../../services/api';

const MODALITIES = ['OPG', 'Bitewing', 'IOPA', 'Others'];

const MODALITY_COLORS = {
    'OPG': 'bg-blue-100 text-blue-800 border-blue-300',
    'Bitewing': 'bg-green-100 text-green-800 border-green-300',
    'IOPA': 'bg-purple-100 text-purple-800 border-purple-300',
    'Others': 'bg-gray-100 text-gray-800 border-gray-300'
};

const ProjectCard = ({ project, onRefresh, onViewDetails, onModalityChange }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [updatingModality, setUpdatingModality] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh(project.id, project.title);
        setRefreshing(false);
    };

    const handleModalityChange = async (e) => {
        const newModality = e.target.value;
        setUpdatingModality(true);

        try {
            await modalitiesAPI.update(project.id, newModality);
            // Notify parent to refresh projects
            if (onModalityChange) {
                onModalityChange();
            }
        } catch (error) {
            console.error('Failed to update modality:', error);
        } finally {
            setUpdatingModality(false);
        }
    };

    const latestMetrics = project.latest_metrics?.metrics;
    const summary = latestMetrics?._summary || {};
    const timestamp = project.latest_metrics?.timestamp;
    const modality = project.modality || 'Others';

    return (
        <div className="project-tile relative">
            <h3 className="text-lg font-bold mb-2">📁 {project.title}</h3>

            {/* Modality Selector */}
            <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Modality</label>
                <select
                    value={modality}
                    onChange={handleModalityChange}
                    disabled={updatingModality}
                    className={`w-full px-3 py-1.5 text-sm font-medium border rounded-md transition-colors ${MODALITY_COLORS[modality]} ${updatingModality ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                        }`}
                >
                    {MODALITIES.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {timestamp && (
                <p className="text-sm text-gray-500 italic mb-3">
                    Last updated: {formatTimeAgo(timestamp)}
                </p>
            )}

            <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 mb-2 disabled:opacity-50"
            >
                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>

            <button
                onClick={() => onViewDetails(project)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-3"
            >
                📊 View Details
            </button>

            {project.has_history ? (
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-white rounded">
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-lg font-bold">{summary.total_images || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                        <p className="text-xs text-gray-600">Annotated</p>
                        <p className="text-lg font-bold">{summary.annotated_images || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                        <p className="text-xs text-gray-600">Pending</p>
                        <p className="text-lg font-bold">{summary.unannotated_images || 0}</p>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                    No data cached. Click Refresh to load.
                </div>
            )}

            {latestMetrics && (
                <div className="mt-3 text-sm text-gray-700">
                    <strong>📋 {Object.keys(latestMetrics).filter(k => k !== '_summary').length}</strong> classes
                </div>
            )}
        </div>
    );
};

export default ProjectCard;
