import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../utils/formatters';

const GrowthIndicator = ({ current, checkpoint, kaggle, growth, growthPct, checkpointInfo = 'from baseline', checkpointDate = null }) => {
    // Gauge data
    const gaugeData = [
        { name: 'Growth', value: Math.min(Math.max(growthPct, 0), 100) },
        { name: 'Remaining', value: 100 - Math.min(Math.max(growthPct, 0), 100) }
    ];

    // Colors
    const COLORS = ['#ffffff', 'rgba(255, 255, 255, 0.2)'];

    // Format checkpoint date
    const formatCheckpointDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div
            className="p-4 sm:p-6 rounded-lg text-white mb-4 sm:mb-6 flex flex-col md:flex-row items-center justify-between"
            style={{ background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)' }}
        >
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold m-0">📈 Total Dataset Growth</h2>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold my-2 sm:my-4">+{formatNumber(growth)}</h1>
                <p className="text-base sm:text-lg md:text-xl mb-1">
                    images ({growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}% {checkpointInfo})
                </p>
                {checkpointDate && (
                    <p className="text-xs sm:text-sm opacity-80 mb-2">
                        Latest checkpoint: {formatCheckpointDate(checkpointDate)}
                    </p>
                )}
                <div className="text-sm sm:text-base md:text-lg opacity-90 flex flex-col sm:flex-row sm:gap-2">
                    <span><strong>Current:</strong> {formatNumber(current)}</span>
                    <span className="hidden sm:inline">|</span>
                    <span><strong>Kaggle:</strong> {formatNumber(kaggle)}</span>
                    <span className="hidden sm:inline">|</span>
                    <span><strong>Total:</strong> {formatNumber(current + kaggle)}</span>
                </div>
            </div>

            {/* Gauge Chart */}
            <div className="w-48 h-24 relative mt-4 md:mt-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={gaugeData}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            {gaugeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 left-0 right-0 text-center mb-[-5px]">
                    <span className="text-xl font-bold">{growthPct.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
};

export default GrowthIndicator;
