import React, { useState } from 'react';

const TimeSeriesCard = ({ metric }) => {
    const [expanded, setExpanded] = useState(false);

    const { className, modality, category, totalImages, totalAnnotations, dailyData } = metric;

    // Get modality colors
    const modality_colors = {
        'OPG': { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
        'Bitewing': { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
        'IOPA': { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
        'Others': { border: 'border-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' }
    };

    const colors = modality_colors[modality] || modality_colors['Others'];

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatDelta = (delta) => {
        if (delta > 0) return `+${delta}`;
        if (delta < 0) return `${delta}`;
        return '0';
    };

    return (
        <div className={`border-2 ${colors.border} rounded-lg overflow-hidden mb-3 transition-all hover:shadow-md`}>
            {/* Card Header */}
            <div
                className={`${colors.bg} p-4 cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h4 className={`font-bold text-lg ${colors.text} flex items-center gap-2`}>
                            {className}
                            <span className="text-sm font-normal">({modality})</span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">{totalImages.toLocaleString()}</span> images
                            <span className="mx-2">•</span>
                            <span className="font-semibold">{totalAnnotations.toLocaleString()}</span> annotations
                        </p>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className={`${colors.text} transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Expanded Daily Breakdown */}
            {expanded && dailyData && dailyData.length > 0 && (
                <div className="bg-white p-4 border-t-2 border-gray-200">
                    <h5 className="font-semibold text-gray-800 mb-3">
                        Daily Breakdown (Last {dailyData.length} Days)
                    </h5>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Images</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Δ</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Annotations</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Δ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.map((day, index) => (
                                    <tr
                                        key={day.date}
                                        className={`border-b border-gray-200 hover:bg-gray-50 ${index === 0 ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="py-2 px-3">
                                            {formatDate(day.date)}
                                            {index === 0 && (
                                                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                                                    Latest
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-right py-2 px-3 font-mono">
                                            {day.images.toLocaleString()}
                                        </td>
                                        <td className={`text-right py-2 px-3 font-mono font-semibold ${day.imagesDelta > 0 ? 'text-green-600' :
                                            day.imagesDelta < 0 ? 'text-red-600' : 'text-gray-500'
                                            }`}>
                                            {day.imagesDelta !== 0 && (
                                                <span className="flex items-center justify-end gap-1">
                                                    {formatDelta(day.imagesDelta)}
                                                    {day.imagesDelta > 0 && '↑'}
                                                    {day.imagesDelta < 0 && '↓'}
                                                </span>
                                            )}
                                            {day.imagesDelta === 0 && '—'}
                                        </td>
                                        <td className="text-right py-2 px-3 font-mono">
                                            {day.annotations.toLocaleString()}
                                        </td>
                                        <td className={`text-right py-2 px-3 font-mono font-semibold ${day.annotationsDelta > 0 ? 'text-green-600' :
                                            day.annotationsDelta < 0 ? 'text-red-600' : 'text-gray-500'
                                            }`}>
                                            {day.annotationsDelta !== 0 && (
                                                <span className="flex items-center justify-end gap-1">
                                                    {formatDelta(day.annotationsDelta)}
                                                    {day.annotationsDelta > 0 && '↑'}
                                                    {day.annotationsDelta < 0 && '↓'}
                                                </span>
                                            )}
                                            {day.annotationsDelta === 0 && '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* No Data Message */}
            {expanded && (!dailyData || dailyData.length === 0) && (
                <div className="bg-gray-50 p-4 text-center text-gray-500">
                    No historical data available yet
                </div>
            )}
        </div>
    );
};

export default TimeSeriesCard;
