import React from 'react';
import { formatNumber } from '../../utils/formatters';

const GrowthIndicator = ({ current, checkpoint, kaggle, growth, growthPct }) => {
    return (
        <div
            className="p-6 rounded-lg text-center mb-6 text-white"
            style={{ background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)' }}
        >
            <h2 className="text-2xl font-bold m-0">📈 Total Dataset Growth</h2>
            <h1 className="text-5xl font-bold my-4">+{formatNumber(growth)}</h1>
            <p className="text-xl mb-4">
                images ({growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}% from checkpoint)
            </p>
            <hr className="border-white opacity-30 my-4" />
            <p className="text-lg">
                <strong>Current:</strong> {formatNumber(current)} images | {' '}
                <strong>Kaggle:</strong> {formatNumber(kaggle)} images | {' '}
                <strong>Total:</strong> {formatNumber(current + kaggle)} images
            </p>
        </div>
    );
};

export default GrowthIndicator;
