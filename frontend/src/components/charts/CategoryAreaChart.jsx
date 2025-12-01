import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

const CategoryAreaChart = ({ data, dataKeys = ['total'], colors, height = 300 }) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    {dataKeys.map((key, index) => (
                        <linearGradient key={`gradient-${key}`} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors?.[index] || CHART_COLORS.primary} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={colors?.[index] || CHART_COLORS.primary} stopOpacity={0.1} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                />
                <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {dataKeys.map((key, index) => (
                    <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors?.[index] || CHART_COLORS.primary}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#color${key})`}
                        name={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                ))}
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
};

export default CategoryAreaChart;
