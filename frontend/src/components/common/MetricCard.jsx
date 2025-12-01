import React from 'react';
import { formatNumber } from '../../utils/formatters';

const MetricCard = ({ label, value, delta, icon }) => {
    const getDeltaClass = () => {
        if (!delta) return '';
        if (delta > 0) return 'text-success';
        if (delta < 0) return 'text-danger';
        return 'text-gray-500';
    };

    const getDeltaText = () => {
        if (!delta) return '';
        if (delta > 0) return `+${formatNumber(delta)}`;
        return formatNumber(delta);
    };

    return (
        <div className="metric-card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-bold">{formatNumber(value)}</p>
                    {delta !== undefined && delta !== null && (
                        <p className={`text-sm ${getDeltaClass()}`}>{getDeltaText()}</p>
                    )}
                </div>
                {icon && <div className="text-3xl">{icon}</div>}
            </div>
        </div>
    );
};

export default MetricCard;
