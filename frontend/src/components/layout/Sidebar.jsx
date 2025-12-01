import React from 'react';
import NotificationsPanel from './NotificationsPanel';
import SchedulerSettings from '../scheduler/SchedulerSettings';

const Sidebar = ({ labelStudioUrl, onRefreshAll, refreshing }) => {
    return (
        <div className="w-64 bg-gray-800 text-white p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">⚙️ Settings</h2>

            <div className="bg-gray-700 p-3 rounded mb-4 text-sm">
                <strong>Server:</strong><br />
                <span className="text-blue-300 break-all">{labelStudioUrl}</span>
            </div>

            <SchedulerSettings />

            <hr className="border-gray-600 my-4" />

            <div className="mb-4">
                <NotificationsPanel />
            </div>

            <hr className="border-gray-600 my-4" />

            <button
                onClick={onRefreshAll}
                disabled={refreshing}
                className="w-full px-4 py-3 bg-primary hover:bg-blue-600 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh All Projects'}
            </button>
        </div>
    );
};

export default Sidebar;
