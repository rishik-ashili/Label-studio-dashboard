import React, { useState } from 'react';

/**
 * Checkpoint Button Component
 * Provides UI for creating checkpoints with class and modality selection
 */
const CheckpointButton = ({
    onCheckpoint,
    label = "Set Checkpoint",
    size = "md",
    disabled = false,
    classes = [],  // Available classes for dropdown
    modalities = ['OPG', 'Bitewing', 'IOPA'],  // Available modalities
    requireSelection = true  // Whether class/modality selection is required
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedModality, setSelectedModality] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validate selection if required
        if (requireSelection && (!selectedClass || !selectedModality)) {
            alert('Please select both class and modality');
            return;
        }

        setLoading(true);
        try {
            await onCheckpoint({
                className: selectedClass,
                modality: selectedModality,
                note
            });

            // Reset form
            setSelectedClass('');
            setSelectedModality('');
            setNote('');
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating checkpoint:', error);
            alert('Failed to create checkpoint');
        } finally {
            setLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className={`${sizeClasses[size]} bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
                <span>📍</span>
                <span>{label}</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Create Checkpoint</h3>

                {requireSelection && (
                    <>
                        {/* Class Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Class <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                            >
                                <option value="">-- Select Class --</option>
                                {classes.map(className => (
                                    <option key={className} value={className}>
                                        {className}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Modality Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Modality (X-ray Type) <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedModality}
                                onChange={(e) => setSelectedModality(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                            >
                                <option value="">-- Select Modality --</option>
                                {modalities.map(modality => (
                                    <option key={modality} value={modality}>
                                        {modality}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {/* Note */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g., V1 training, Before experiment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        rows={3}
                    />
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setSelectedClass('');
                            setSelectedModality('');
                            setNote('');
                        }}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (requireSelection && (!selectedClass || !selectedModality))}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <span>📍</span>
                                <span>Create Checkpoint</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckpointButton;
