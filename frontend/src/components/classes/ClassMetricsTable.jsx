import React from 'react';
import { calculateDelta } from '../../utils/formatters';

const ClassMetricsTable = ({
    category,
    classes,
    xrayType,
    metrics,
    previousMetrics,
    checkpoints
}) => {
    if (!classes || classes.length === 0) return null;

    return (
        <div className="mb-6">
            <h4 className="text-md font-bold mb-2 text-gray-700 border-b pb-1">
                {xrayType}
            </h4>

            <div className="overflow-x-auto">
                <table className="w-full bg-white rounded shadow-sm text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left">Class</th>
                            <th className="px-3 py-2 text-left">Images</th>
                            <th className="px-3 py-2 text-left">Annotations</th>
                            <th className="px-3 py-2 text-left">Changes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map(className => {
                            const current = metrics[className] || { image_count: 0, annotation_count: 0 };
                            const prev = previousMetrics?.[className];

                            // Calculate deltas
                            const delta = calculateDelta(
                                { [className]: current },
                                { [className]: prev }
                            );

                            const imgDelta = delta?.[className]?.image_count_delta || 0;

                            // Checkpoint delta
                            let checkpointDelta = null;
                            const cpKey = `${className}_${xrayType}`;
                            const cp = checkpoints?.classes?.[cpKey];

                            if (cp) {
                                checkpointDelta = current.image_count - (cp.metrics?.images || 0);
                            }

                            return (
                                <tr key={className} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium capitalize">{className}</td>
                                    <td className="px-3 py-2">{current.image_count}</td>
                                    <td className="px-3 py-2">{current.annotation_count}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex space-x-3">
                                            {imgDelta > 0 ? (
                                                <span className="text-success font-bold">🟢 +{imgDelta}</span>
                                            ) : (
                                                <span className="text-gray-400">🟢 +0</span>
                                            )}

                                            {checkpointDelta !== null && (
                                                checkpointDelta > 0 ? (
                                                    <span className="text-blue-600 font-bold">📍 +{checkpointDelta}</span>
                                                ) : (
                                                    <span className="text-gray-400">📍 +0</span>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Totals Row */}
                        <tr className="bg-gray-50 font-bold border-t-2">
                            <td className="px-3 py-2">Total</td>
                            <td className="px-3 py-2">
                                {classes.reduce((sum, c) => sum + (metrics[c]?.image_count || 0), 0)}
                            </td>
                            <td className="px-3 py-2">
                                {classes.reduce((sum, c) => sum + (metrics[c]?.annotation_count || 0), 0)}
                            </td>
                            <td className="px-3 py-2"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClassMetricsTable;
