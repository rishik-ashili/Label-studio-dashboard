import React, { useState } from 'react';
import { useScheduler } from '../../hooks/useScheduler';

const SchedulerSettings = () => {
    const { status, logs, startScheduler, stopScheduler, triggerManualRefresh, fetchLogs } = useScheduler();
    const [hour, setHour] = useState(2);
    const [minute, setMinute] = useState(8);
    const [showSettings, setShowSettings] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const handleStart = async () => {
        const success = await startScheduler(hour, minute);
        if (success) {
            alert('Scheduler started!');
        }
    };

    const handleStop = async () => {
        const success = await stopScheduler();
        if (success) {
            alert('Scheduler stopped!');
        }
    };

    const handleManualRefresh = async () => {
        const success = await triggerManualRefresh();
        if (success) {
            alert('Manual refresh started in background!');
        }
    };

    const handleShowLogs = async () => {
        await fetchLogs(50);
        setShowLogs(!showLogs);
    };

    if (!status) return null;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">⏰ Auto-Refresh Scheduler</h3>

            {status.is_running ? (
                <div className="bg-success text-white p-2 rounded text-sm mb-2">
                    ✅ Active - Runs daily at {status.schedule}
                </div>
            ) : (
                <div className="bg-gray-200 p-2 rounded text-sm mb-2">
                    ⏸️ Inactive
                </div>
            )}

            {status.last_run && (
                <p className="text-sm text-gray-600 mb-1">
                    Last run: {new Date(status.last_run).toLocaleString()}
                </p>
            )}

            {status.next_run && (
                <p className="text-sm text-gray-600 mb-3">
                    Next run: {new Date(status.next_run).toLocaleString()}
                </p>
            )}

            <hr className="my-3" />

            <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
            >
                ⚙️ Scheduler Settings {showSettings ? '▼' : '▶'}
            </button>

            {showSettings && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <label className="block text-xs mb-1">Hour (24h)</label>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                value={hour}
                                onChange={(e) => setHour(parseInt(e.target.value))}
                                className="w-full px-2 py-1 border rounded text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1">Minute</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={minute}
                                onChange={(e) => setMinute(parseInt(e.target.value))}
                                className="w-full px-2 py-1 border rounded text-sm"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-3">
                        Schedule: Daily at {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        {!status.is_running ? (
                            <button
                                onClick={handleStart}
                                className="px-3 py-2 bg-success text-white rounded text-sm hover:bg-green-600"
                            >
                                ▶️ Start
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                className="px-3 py-2 bg-danger text-white rounded text-sm hover:bg-red-600"
                            >
                                ⏹️ Stop
                            </button>
                        )}

                        <button
                            onClick={handleManualRefresh}
                            className="px-3 py-2 bg-primary text-white rounded text-sm hover:bg-blue-600"
                        >
                            🔄 Refresh Now
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={handleShowLogs}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm mt-2"
            >
                📋 View Recent Logs {showLogs ? '▼' : '▶'}
            </button>

            {showLogs && (
                <div className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs font-mono max-h-64 overflow-y-auto">
                    {logs || 'No logs available yet'}
                </div>
            )}
        </div>
    );
};

export default SchedulerSettings;
