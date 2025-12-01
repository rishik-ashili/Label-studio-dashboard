import React, { useState } from 'react';
import MetricCard from '../common/MetricCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatTimeAgo } from '../../utils/formatters';

const ProjectCard = ({ project, onRefresh, onViewDetails }) => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh(project.id, project.title);
        setRefreshing(false);
    };

    const latestMetrics = project.latest_metrics?.metrics;
    const summary = latestMetrics?._summary || {};
    const timestamp = project.latest_metrics?.timestamp;

    return (
        <div className="project-tile">
            <h3 className="text-lg font-bold mb-2">📁 {project.title}</h3>

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
