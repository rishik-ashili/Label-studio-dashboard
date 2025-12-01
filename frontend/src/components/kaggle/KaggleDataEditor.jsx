import React, { useState, useEffect } from 'react';
import { kaggleAPI } from '../../services/api';
import { CLASS_CATEGORIES, XRAY_TYPES } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';

const KaggleDataEditor = () => {
    const [kaggleData, setKaggleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editedData, setEditedData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await kaggleAPI.getAll();
            setKaggleData(response.data);
            setEditedData(response.data);
        } catch (error) {
            console.error('Error fetching Kaggle data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (category, className, xrayType, value) => {
        setEditedData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [className]: {
                    ...prev[category]?.[className],
                    [xrayType]: { images: parseInt(value) || 0 }
                }
            }
        }));
    };

    const handleSave = async (category) => {
        setSaving(true);
        try {
            await kaggleAPI.updateCategory(category, editedData[category]);
            alert(`Saved ${category} data!`);
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save data');
        } finally {
            setSaving(false);
        }
    };

    const getCount = (category, className, xrayType) => {
        return editedData[category]?.[className]?.[xrayType]?.images || 0;
    };

    const getClassTotal = (category, className) => {
        const classData = editedData[category]?.[className];
        if (!classData) return 0;
        return Object.values(classData).reduce((sum, type) => sum + (type.images || 0), 0);
    };

    const getCategoryTotal = (category) => {
        const catData = editedData[category];
        if (!catData) return 0;
        let total = 0;
        Object.values(catData).forEach(classData => {
            Object.values(classData).forEach(type => {
                total += (type.images || 0);
            });
        });
        return total;
    };

    if (loading) return <LoadingSpinner message="Loading Kaggle data..." />;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">📦 Kaggle Pre-training Data</h2>
            <p className="text-gray-600 mb-6">
                Manage the number of images available in the Kaggle dataset.
                Counts are broken down by X-ray type (OPG, Bitewing, IOPA).
            </p>

            <div className="grid grid-cols-1 gap-6">
                {Object.entries(CLASS_CATEGORIES).map(([category, classes]) => (
                    <div key={category} className="bg-white p-6 rounded shadow">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">{category}</h3>
                            <button
                                onClick={() => handleSave(category)}
                                disabled={saving}
                                className="px-4 py-2 bg-primary text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left">Class</th>
                                        {Object.keys(XRAY_TYPES).map(type => (
                                            <th key={type} className="px-4 py-2 text-right">{type}</th>
                                        ))}
                                        <th className="px-4 py-2 text-right font-bold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map(className => (
                                        <tr key={className} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium capitalize">{className}</td>
                                            {Object.keys(XRAY_TYPES).map(type => (
                                                <td key={type} className="px-4 py-2 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={getCount(category, className, type)}
                                                        onChange={(e) => handleChange(category, className, type, e.target.value)}
                                                        className="w-20 px-2 py-1 border rounded text-right focus:ring-2 focus:ring-primary focus:outline-none"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-4 py-2 text-right font-bold">
                                                {getClassTotal(category, className).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold border-t-2">
                                        <td className="px-4 py-2">Category Total</td>
                                        <td colSpan={Object.keys(XRAY_TYPES).length} className="px-4 py-2"></td>
                                        <td className="px-4 py-2 text-right text-primary text-lg">
                                            {getCategoryTotal(category).toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KaggleDataEditor;
