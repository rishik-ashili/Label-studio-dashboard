import React, { useState } from 'react';

/**
 * Checkpoint Button Component
 * Provides UI for creating checkpoints with optional notes
 */
const CheckpointButton = ({ onCheckpoint, label = "Set Checkpoint", size = "md", disabled = false }) => {
    const [isOpen, isSetOpen] = useState(false);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onCheckpoint(note);
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
                className={`${sizeClasses[size]} bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2`}
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

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g., V1 training, Before experiment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                    />
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setNote('');
                        }}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
