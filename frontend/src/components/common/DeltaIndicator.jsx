import React from 'react';
import { formatNumber } from '../../utils/formatters';

/**
 * Delta Indicator Component  
 * Shows change from checkpoint with visual indicator
 */
const DeltaIndicator = ({ current, checkpoint, label = "images" }) => {
    if (!checkpoint || checkpoint === 0) {
        return null;
    }

    const delta = current - checkpoint;
    const deltaPercent = checkpoint > 0 ? ((delta / checkpoint) * 100) : 0;

    if (delta === 0) {
        return (
            <span className="text-gray-500 text-sm">
                📍 No change
            </span>
        );
    }

    const isIncrease = delta > 0;
    const colorClass = isIncrease ? 'text-green-600' : 'text-red-600';
    const bgClass = isIncrease ? 'bg-green-50' : 'bg-red-50';
    const borderClass = isIncrease ? 'border-green-200' : 'border-red-200';

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${bgClass} ${borderClass}`}>
            <span>📍</span>
            <span className={`font-semibold ${colorClass}`}>
                {isIncrease ? '+' : ''}{formatNumber(delta)}
            </span>
            <span className="text-gray-600 text-sm">
                {label}
            </span>
            <span className={`text-sm ${colorClass}`}>
                ({deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}%)
            </span>
        </div>
    );
};

export default DeltaIndicator;
