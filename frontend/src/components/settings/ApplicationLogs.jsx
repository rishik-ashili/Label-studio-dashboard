import React, { useState, useEffect } from 'react';
import { logsAPI } from '../../services/logsAPI';

const ApplicationLogs = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [filters, setFilters] = useState({
        level: 'all',
        source: '',
        limit: 100
    });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await logsAPI.getRecent(filters);
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await logsAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [filters]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchLogs();
            fetchStats();
        }, 5000); // Refresh every 5 seconds

        return () => clearInterval(interval);
    }, [autoRefresh, filters]);

    const handleDownload = async (format) => {
        try {
            await logsAPI.download({ ...filters, format });
        } catch (error) {
            console.error('Failed to download logs:', error);
            alert('Failed to download logs');
        }
    };

    const getLevelBadgeClass = (level) => {
        const baseClasses = 'px-2 py-1 rounded text-xs font-semibold uppercase';
        switch (level) {
            case 'error':
                return `${baseClasses} bg-red-100 text-red-800`;
            case 'warn':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'info':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'debug':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-600`;
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">📋 Application Logs</h3>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        Auto-refresh (5s)
                    </label>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="text-red-600 text-2xl font-bold">{stats.lastHourByLevel.error}</div>
                        <div className="text-red-700 text-sm">Errors (1h)</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="text-yellow-600 text-2xl font-bold">{stats.lastHourByLevel.warn}</div>
                        <div className="text-yellow-700 text-sm">Warnings (1h)</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="text-blue-600 text-2xl font-bold">{stats.lastHourByLevel.info}</div>
                        <div className="text-blue-700 text-sm">Info (1h)</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <div className="text-gray-600 text-2xl font-bold">{stats.total}</div>
                        <div className="text-gray-700 text-sm">Total Logs</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <select
                        value={filters.level}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                        className="px-3 py-2 border rounded text-sm"
                    >
                        <option value="all">All Levels</option>
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Filter</label>
                    <input
                        type="text"
                        value={filters.source}
                        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                        placeholder="Filter by source (e.g., frontend, backend)"
                        className="w-full px-3 py-2 border rounded text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                    <select
                        value={filters.limit}
                        onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                        className="px-3 py-2 border rounded text-sm"
                    >
                        <option value="50">50 logs</option>
                        <option value="100">100 logs</option>
                        <option value="200">200 logs</option>
                        <option value="500">500 logs</option>
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Refreshing...
                        </>
                    ) : (
                        <>🔄 Refresh Now</>
                    )}
                </button>
                <button
                    onClick={() => handleDownload('json')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                    📥 Download JSON
                </button>
                <button
                    onClick={() => handleDownload('txt')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                    📥 Download TXT
                </button>
            </div>

            {/* Logs Display */}
            <div className="bg-gray-50 rounded border max-h-96 overflow-y-auto">
                {loading && logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                        Loading logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No logs found
                    </div>
                ) : (
                    <div className="divide-y">
                        {logs.map((log, index) => (
                            <div key={index} className="p-3 hover:bg-white transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="text-xs text-gray-500 whitespace-nowrap mt-1">
                                        {formatTimestamp(log.timestamp)}
                                    </div>
                                    <div className={getLevelBadgeClass(log.level)}>
                                        {log.level}
                                    </div>
                                    <div className="text-xs text-gray-600 font-mono whitespace-nowrap mt-1">
                                        [{log.source}]
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-900">{log.message}</div>
                                        {log.context && Object.keys(log.context).length > 0 && (
                                            <details className="mt-1">
                                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                                    View context
                                                </summary>
                                                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(log.context, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-3 text-xs text-gray-500 text-center">
                Showing {logs.length} of {stats?.total || 0} total logs
                {autoRefresh && ' • Auto-refreshing every 5 seconds'}
            </div>
        </div>
    );
};

export default ApplicationLogs;
