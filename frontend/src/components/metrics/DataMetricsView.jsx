import React, { useState, useEffect } from 'react';
import { metricsAPI } from '../../services/api';
import { CLASS_CATEGORIES } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Data Metrics View - Combined Kaggle + Label Studio
 * Shows class-wise breakdown across all X-ray modalities (OPG, Bitewing, IOPA)
 */
const DataMetricsView = () => {
    const [combinedData, setCombinedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const fetchData = async () => {
        try {
            const response = await metricsAPI.getCombined();
            setCombinedData(response.data);
        } catch (error) {
            console.error('Error fetching combined metrics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const refreshData = async () => {
        setRefreshing(true);
        await fetchData();
    };

    if (loading) return <LoadingSpinner message="Loading metrics..." />;
    if (!combinedData) return <div className="text-center py-8">No data available</div>;

    // Organize data by category
    const dataByCategory = {};
    for (const [className, xrayData] of Object.entries(combinedData)) {
        let category = 'Others';
        for (const [cat, classList] of Object.entries(CLASS_CATEGORIES)) {
            if (classList.includes(className)) {
                category = cat;
                break;
            }
        }

        if (!dataByCategory[category]) {
            dataByCategory[category] = [];
        }

        dataByCategory[category].push({ className, ...xrayData });
    }

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const downloadCSV = () => {
        const headers = [
            'Class',
            'OPG Kaggle', 'OPG LS', 'OPG Total',
            'Bitewing Kaggle', 'Bitewing LS', 'Bitewing Total',
            'IOPA Kaggle', 'IOPA LS', 'IOPA Total'
        ];

        const rows = [];
        Object.entries(dataByCategory).forEach(([category, classes]) => {
            // Category header
            rows.push([`${category}`, '', '', '', '', '', '', '', '', '']);

            classes.forEach(({ className, OPG, Bitewing, IOPA }) => {
                rows.push([
                    className,
                    OPG.kaggle_images, OPG.ls_images, OPG.total_images,
                    Bitewing.kaggle_images, Bitewing.ls_images, Bitewing.total_images,
                    IOPA.kaggle_images, IOPA.ls_images, IOPA.total_images
                ]);
            });
        });

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `combined_metrics_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📊 Combined Data Metrics</h2>
                <div className="flex gap-3">
                    <button
                        onClick={refreshData}
                        disabled={refreshing}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {refreshing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Refreshing...</span>
                            </>
                        ) : (
                            <>
                                <span>🔄</span>
                                <span>Refresh Data</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <span>📥</span>
                        <span>Download CSV</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="px-4 py-3 text-left font-semibold sticky left-0 z-10 bg-gray-800">
                                    Class
                                </th>
                                {/* OPG */}
                                <th className="px-3 py-3 text-center text-sm border-l border-gray-700" colSpan="3">
                                    OPG
                                </th>
                                {/* Bitewing */}
                                <th className="px-3 py-3 text-center text-sm border-l border-gray-700" colSpan="3">
                                    Bitewing
                                </th>
                                {/* IOPA */}
                                <th className="px-3 py-3 text-center text-sm border-l border-gray-700" colSpan="3">
                                    IOPA
                                </th>
                                {/* Grand Total */}
                                <th className="px-3 py-3 text-center text-sm border-l-2 border-yellow-500 bg-yellow-600" colSpan="3">
                                    Grand Total
                                </th>
                            </tr>
                            <tr className="bg-gray-700 text-white text-xs">
                                <th className="px-4 py-2 text-left sticky left-0 z-10 bg-gray-700"></th>
                                {/* OPG sub-headers */}
                                <th className="px-2 py-2 text-center border-l border-gray-600">Kaggle</th>
                                <th className="px-2 py-2 text-center">LS</th>
                                <th className="px-2 py-2 text-center font-bold bg-gray-600">Total</th>
                                {/* Bitewing sub-headers */}
                                <th className="px-2 py-2 text-center border-l border-gray-600">Kaggle</th>
                                <th className="px-2 py-2 text-center">LS</th>
                                <th className="px-2 py-2 text-center font-bold bg-gray-600">Total</th>
                                {/* IOPA sub-headers */}
                                <th className="px-2 py-2 text-center border-l border-gray-600">Kaggle</th>
                                <th className="px-2 py-2 text-center">LS</th>
                                <th className="px-2 py-2 text-center font-bold bg-gray-600">Total</th>
                                {/* Grand Total sub-headers */}
                                <th className="px-2 py-2 text-center border-l-2 border-yellow-500 bg-yellow-700">Kaggle</th>
                                <th className="px-2 py-2 text-center bg-yellow-700">LS</th>
                                <th className="px-2 py-2 text-center font-bold bg-yellow-600">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(dataByCategory).map(([category, classes]) => (
                                <React.Fragment key={category}>
                                    {/* Category Header */}
                                    <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                        <td colSpan="13" className="px-4 py-3 font-bold text-lg">
                                            {category}
                                        </td>
                                    </tr>

                                    {/* Class Rows */}
                                    {classes.map(({ className, OPG, Bitewing, IOPA }, idx) => {
                                        const grandTotalKaggle = OPG.kaggle_images + Bitewing.kaggle_images + IOPA.kaggle_images;
                                        const grandTotalLS = OPG.ls_images + Bitewing.ls_images + IOPA.ls_images;
                                        const grandTotal = OPG.total_images + Bitewing.total_images + IOPA.total_images;

                                        return (
                                            <tr
                                                key={className}
                                                className={`border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                    }`}
                                            >
                                                <td className="px-4 py-3 font-semibold capitalize sticky left-0 bg-inherit">
                                                    {className}
                                                </td>
                                                {/* OPG */}
                                                <td className="px-3 py-3 text-center text-sm border-l">
                                                    {OPG.kaggle_images.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm">
                                                    {OPG.ls_images.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm font-bold bg-gray-100">
                                                    {OPG.total_images.toLocaleString()}
                                                </td>
                                                {/* Bitewing */}
                                                <td className="px-3 py-3 text-center text-sm border-l">
                                                    {Bitewing.kaggle_images.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm">
                                                    {Bitewing.ls_images.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm font-bold bg-gray-100">
                                                    {Bitewing.total_images.toLocaleString()}
                                                </td>
                                                {/* IOPA */}
                                                <td className="px-3 py-3 text-center text-sm border-l">
                                                    {IOPA.kaggle_images.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm">
                                                    {IOPA.ls_images.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm font-bold bg-gray-100">
                                                    {IOPA.total_images.toLocaleString()}
                                                </td>
                                                {/* Grand Total */}
                                                <td className="px-3 py-3 text-center text-sm border-l-2 border-yellow-500 bg-yellow-50">
                                                    {grandTotalKaggle.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm bg-yellow-50">
                                                    {grandTotalLS.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm font-bold bg-yellow-100">
                                                    {grandTotal.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                <p><strong>Kaggle:</strong> Pre-training dataset images</p>
                <p><strong>LS:</strong> Label Studio annotated images</p>
                <p><strong>Total:</strong> Combined dataset size</p>
            </div>
        </div>
    );
};

export default DataMetricsView;
