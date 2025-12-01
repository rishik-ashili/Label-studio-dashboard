import React, { useState } from 'react';
import SchedulerSettings from '../scheduler/SchedulerSettings';
import ApplicationLogs from './ApplicationLogs';
import { schedulerAPI } from '../../services/api';

const SettingsTab = ({ labelStudioUrl, onRefreshAll, refreshing }) => {
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
