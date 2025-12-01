import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, getColorArray } from '../../utils/colorPalette';
import { formatNumber, formatPercentage } from '../../utils/chartDataProcessors';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const total = payload[0].payload.payload?.total || data.value;
        const percentage = (data.value / total) * 100;

        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm font-semibold text-slate-900">{data.name}</p>
                <p className="text-sm text-slate-600">
                    Count: <span className="font-semibold">{formatNumber(data.value)}</span>
                </p>
                <p className="text-sm text-slate-600">
                    Percentage: <span className="font-semibold">{formatPercentage(percentage)}</span>
                </p>
            </div>
        );
    }
    return null;
};

const ClassPieChart = ({ data, colors, height = 300 }) => {
    const chartColors = colors || getColorArray(data.length);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};

export default ClassPieChart;
