import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatters';

/**
 * History Viewer Component
 * Displays timeline of historical metrics for projects or categories
 * with expandable entries to show detailed metrics
 */
const HistoryViewer = ({ history, type = 'category' }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No historical data available</p>
                <p className="text-sm mt-2">Data will appear after the first refresh</p>
            </div>
        );
    }

    // Calculate deltas between consecutive entries
    const entriesWithDelta = history.map((entry, index) => {
        if (index === 0) {
            return { ...entry, delta: null };
        }

        const prevEntry = history[index - 1];
        const delta = {};

        // Calculate totals for current and previous
        let currentTotal = 0;
        let prevTotal = 0;

        if (type === 'category') {
            // For categories: sum across all classes and xray types
            for (const [className, xrayTypes] of Object.entries(entry.metrics || {})) {
                for (const [xrayType, metrics] of Object.entries(xrayTypes)) {
                    currentTotal += metrics.images || 0;
                }
            }

            for (const [className, xrayTypes] of Object.entries(prevEntry.metrics || {})) {
                for (const [xrayType, metrics] of Object.entries(xrayTypes)) {
                    prevTotal += metrics.images || 0;
                }
            }
        } else if (type === 'project') {
            // For projects: sum all class image counts
            for (const [className, metrics] of Object.entries(entry.metrics || {})) {
                if (className !== '_summary') {
                    currentTotal += metrics.image_count || 0;
                }
            }

            for (const [className, metrics] of Object.entries(prevEntry.metrics || {})) {
                if (className !== '_summary') {
                    prevTotal += metrics.image_count || 0;
                }
            }
        }

        delta.total = currentTotal - prevTotal;

        return { ...entry, delta };
    });

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const renderMetricsDetails = (metrics) => {
        if (type === 'project') {
            // Project metrics: Show class-wise breakdown
            const classes = Object.keys(metrics).filter(k => k !== '_summary').sort();

            return (
                <div className="mt-4 bg-white p-4 rounded border">
                    <h4 className="font-semibold mb-3">Class Metrics:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {classes.map(className => (
                            <div key={className} className="p-2 bg-gray-50 rounded">
                                <div className="font-medium text-sm capitalize">{className}</div>
                                <div className="text-xs text-gray-600">
                                    Images: {formatNumber(metrics[className].image_count || 0)}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Annotations: {formatNumber(metrics[className].annotation_count || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                    {metrics._summary && (
                        <div className="mt-3 pt-3 border-t">
                            <div className="text-sm">
                                <strong>Total:</strong> {metrics._summary.total_images} images |
                                <strong> Annotated:</strong> {metrics._summary.annotated_images} |
                                <strong> Unannotated:</strong> {metrics._summary.unannotated_images}
                            </div>
                        </div>
                    )}
                </div>
            );
        } else if (type === 'category') {
            // Category metrics: Show by X-ray type
            const classes = Object.keys(metrics).sort();

            return (
                <div className="mt-4 bg-white p-4 rounded border">
                    <h4 className="font-semibold mb-3">Metrics by Class & X-ray Type:</h4>
                    <div className="space-y-3">
                        {classes.map(className => (
                            <div key={className} className="border-b pb-2">
                                <div className="font-medium capitalize mb-2">{className}</div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    {Object.entries(metrics[className]).map(([xrayType, data]) => (
                                        <div key={xrayType} className="bg-gray-50 p-2 rounded">
                                            <div className="font-semibold text-xs text-gray-600">{xrayType}</div>
                                            <div className="text-xs">
                                                Img: {formatNumber(data.images || 0)} |
                                                Ann: {formatNumber(data.annotations || 0)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Historical Timeline</h3>

            <div className="space-y-3">
                {entriesWithDelta.slice().reverse().map((entry, reverseIndex) => {
                    const actualIndex = entriesWithDelta.length - 1 - reverseIndex;
                    const isLatest = reverseIndex === 0;
                    const isExpanded = expandedIndex === reverseIndex;

                    return (
                        <div
                            key={entry.timestamp}
                            className={`rounded-lg border-l-4 ${isLatest
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-gray-50 border-gray-300'
                                }`}
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                                onClick={() => toggleExpand(reverseIndex)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                            <span className="font-medium">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                            {isLatest && (
                                                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                                    Latest
                                                </span>
                                            )}
                                        </div>

                                        {entry.delta && entry.delta.total !== 0 && (
                                            <div className="mt-2">
                                                <span className={`text-sm font-semibold ${entry.delta.total > 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {entry.delta.total > 0 ? '+' : ''}
                                                    {formatNumber(entry.delta.total)} images
                                                </span>
                                                <span className="text-gray-500 text-sm ml-2">
                                                    from previous refresh
                                                </span>
                                            </div>
                                        )}

                                        {!isExpanded && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Click to view detailed metrics
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Metrics Details */}
                            {isExpanded && (
                                <div className="px-4 pb-4">
                                    {renderMetricsDetails(entry.metrics)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                    Total records: {history.length} |
                    Showing last {Math.min(50, history.length)} entries
                </p>
            </div>
        </div>
    );
};

export default HistoryViewer;
