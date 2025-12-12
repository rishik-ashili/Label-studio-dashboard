import React, { useState, useEffect, useRef } from 'react';
import SchedulerSettings from '../scheduler/SchedulerSettings';
import ApplicationLogs from './ApplicationLogs';
import { projectsAPI } from '../../services/api';

const SettingsTab = ({ labelStudioUrl, onRefreshAll, refreshing, onRefreshingChange }) => {
    const [progress, setProgress] = useState(null);
    const pollingInterval = useRef(null);

    // Poll for progress when refreshing
    useEffect(() => {
        if (refreshing) {
            // Start polling immediately
            fetchProgress();
            pollingInterval.current = setInterval(fetchProgress, 500);
        } else {
            // Stop polling and clear progress
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
            setProgress(null);
        }

        // Cleanup on unmount
        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, [refreshing]);

    // Check if refresh is complete based on progress
    useEffect(() => {
        if (progress && !progress.inProgress && progress.total > 0 && refreshing) {
            // Refresh is complete
            console.log('✅ Refresh complete based on progress');
            onRefreshingChange(false);
        }
    }, [progress, refreshing, onRefreshingChange]);

    const fetchProgress = async () => {
        try {
            const response = await projectsAPI.getRefreshProgress();
            console.log('📊 Progress update:', response.data);
            setProgress(response.data);
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        }
    };

    const getProgressPercentage = () => {
        if (!progress || !progress.total || progress.total === 0) return 0;
        const percentage = Math.round((progress.current / progress.total) * 100);
        return isNaN(percentage) ? 0 : percentage;
    };

    // Check if progress data is valid and ready to display
    const hasValidProgress = progress && progress.total > 0;

    return (
        <div className="max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">⚙️ Settings</h2>

            {/* Server Configuration */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">🌐 Server</h3>
                <div className="bg-gray-100 p-4 rounded">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Label Studio URL
                    </label>
                    <div className="text-blue-600 font-mono break-all">
                        {labelStudioUrl}
                    </div>
                </div>
            </div>

            {/* Auto-Refresh Scheduler */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">🔄 Auto-Refresh Scheduler</h3>

                <SchedulerSettings />

                {/* Manual Refresh */}
                <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3">Manual Refresh</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Refresh all projects immediately to fetch the latest data from Label Studio.
                    </p>

                    {/* Progress Bar */}
                    {refreshing && hasValidProgress && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900">
                                        {progress.inProgress
                                            ? `Refreshing project ${progress.current || 0}/${progress.total || 0}`
                                            : `Processing ${progress.completed || 0}/${progress.total || 0} projects...`
                                        }
                                    </p>
                                    {progress.currentProjectTitle && (
                                        <p className="text-xs text-blue-700 mt-1 truncate">
                                            {progress.currentProjectTitle}
                                        </p>
                                    )}
                                </div>
                                <div className="ml-4 text-sm font-semibold text-blue-900">
                                    {getProgressPercentage()}%
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${getProgressPercentage()}%` }}
                                />
                            </div>

                            {/* Stats */}
                            <div className="flex gap-4 mt-2 text-xs text-blue-700">
                                <span>✓ Completed: {progress.completed || 0}</span>
                                {(progress.failed || 0) > 0 && (
                                    <span className="text-red-600">✗ Failed: {progress.failed}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Show loading indicator when refreshing but no progress yet */}
                    {refreshing && !hasValidProgress && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-medium text-blue-900">
                                    Initializing refresh...
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onRefreshAll}
                        disabled={refreshing}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {refreshing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Refreshing All Projects...</span>
                            </>
                        ) : (
                            <>
                                <span>🔄</span>
                                <span>Refresh All Projects</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Application Logs */}
            <ApplicationLogs />

            {/* Additional Settings (Future) */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">🎨 Preferences</h3>
                <p className="text-gray-500 text-sm">
                    Additional settings will be available here in future updates.
                </p>
            </div>
        </div>
    );
};

export default SettingsTab;
