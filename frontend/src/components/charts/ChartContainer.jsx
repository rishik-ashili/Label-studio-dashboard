import React from 'react';

const ChartContainer = ({ title, subtitle, children, className = '', loading = false, error = null, height = 300 }) => {
    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                {title && <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>}
                <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Loading chart data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                {title && <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>}
                <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
                    <div className="text-center">
                        <div className="text-4xl mb-2">⚠️</div>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            {title && (
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
                </div>
            )}
            <div style={{ height: `${height}px` }}>
                {children}
            </div>
        </div>
    );
};

export default ChartContainer;
