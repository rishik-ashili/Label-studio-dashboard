import React, { useState } from 'react';

const MODALITY_COLORS = {
    'OPG': 'border-l-4 border-blue-500 bg-blue-50',
    'Bitewing': 'border-l-4 border-green-500 bg-green-50',
    'IOPA': 'border-l-4 border-purple-500 bg-purple-50',
    'Others': 'border-l-4 border-gray-500 bg-gray-50'
};

const MODALITY_TEXT_COLORS = {
    'OPG': 'text-blue-700',
    'Bitewing': 'text-green-700',
    'IOPA': 'text-purple-700',
    'Others': 'text-gray-700'
};

const GrowthCard = ({ metric }) => {
    const [expanded, setExpanded] = useState(false);

    const {
        className,
        modality,
        currentCount,
        checkpointCount,
        growthPct,
        growthCount,
        contributingProjects
    } = metric;

    const cardColor = MODALITY_COLORS[modality] || MODALITY_COLORS['Others'];
    const textColor = MODALITY_TEXT_COLORS[modality] || MODALITY_TEXT_COLORS['Others'];

    return (
        <div
            className={`rounded-lg shadow-md p-4 mb-3 cursor-pointer transition-all hover:shadow-lg ${cardColor}`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
                        {className} <span className="text-sm font-normal">({modality})</span>
                        {metric.isNew && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">
                                NEW
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {checkpointCount} → {currentCount} images (+{growthCount})
                        {metric.isNew && (
                            <span className="ml-2 text-xs text-green-600 font-semibold">
                                (First checkpoint)
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                            +{growthPct}%
                        </div>
                        <div className="text-xs text-gray-500">growth</div>
                    </div>
                    <div className={`text-2xl transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        ▼
                    </div>
                </div>
            </div>

            {/* Expanded Content - Contributing Projects */}
            {expanded && contributingProjects.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                    <h4 className="font-semibold text-gray-700 mb-3">
                        Contributing Projects ({contributingProjects.length})
                    </h4>
                    <div className="space-y-2">
                        {contributingProjects.map((project, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">
                                        {project.projectTitle}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {project.checkpointCount} → {project.currentCount} images
                                        {project.growthCount > 0 && (
                                            <span className="text-green-600 ml-2">
                                                (+{project.growthCount})
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right ml-4">
                                    <div className={`text-lg font-bold ${project.growthPct > 0 ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        {project.growthPct > 0 ? '+' : ''}{project.growthPct}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GrowthCard;
