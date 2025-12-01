import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../utils/colorPalette';
import { formatNumber } from '../../utils/chartDataProcessors';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">{formatNumber(entry.value)}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ProgressBarChart = ({ data, dataKeys = ['value'], colors, height = 300, stacked = false }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;
    }

    // Calculate dynamic width based on number of items
    // Minimum 80px per bar for readability
    const minBarWidth = 80;
    const itemCount = data.length;
    const calculatedWidth = Math.max(itemCount * minBarWidth, 500);
    const needsScroll = calculatedWidth > 500;

    const chartContent = (
        <ResponsiveContainer width={needsScroll ? calculatedWidth : "100%"} height={height}>
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                />
                <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {dataKeys.map((key, index) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        fill={colors?.[index] || CHART_COLORS.primary}
                        radius={[8, 8, 0, 0]}
                        stackId={stacked ? "stack" : undefined}
                        name={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );

    // If the chart needs scrolling, wrap it in a scrollable container
    if (needsScroll) {
        return (
            <div className="overflow-x-auto overflow-y-hidden" style={{ width: '100%' }}>
                {chartContent}
            </div>
        );
    }

    return chartContent;
};

export default ProgressBarChart;
