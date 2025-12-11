import React, { useState, useEffect } from 'react';
import CategorySection from './CategorySection';
import LoadingSpinner from '../common/LoadingSpinner';
import { useProjects } from '../../hooks/useProjects';
import { useCheckpoints } from '../../hooks/useCheckpoints';
import { CLASS_CATEGORIES } from '../../utils/constants';

// Helper to aggregate metrics
const aggregateMetrics = (projects) => {
    const aggregated = {};

    // Initialize structure
    Object.keys(CLASS_CATEGORIES).forEach(cat => {
        aggregated[cat] = {
            OPG: {},
            Bitewing: {},
            IOPA: {},
            Others: {}
        };
    });

    projects.forEach(project => {
        const metrics = project.latest_metrics?.metrics || {};
        // Use stored modality from project
        const xrayType = project.modality || 'Others';

        Object.keys(metrics).forEach(className => {
            if (className === '_summary') return;

            // Find category
            let category = 'Others';
            for (const [cat, classes] of Object.entries(CLASS_CATEGORIES)) {
                if (classes.includes(className)) {
                    category = cat;
                    break;
                }
            }

            // Initialize if needed
            if (!aggregated[category][xrayType]) {
                aggregated[category][xrayType] = {};
            }
            if (!aggregated[category][xrayType][className]) {
                aggregated[category][xrayType][className] = { image_count: 0, annotation_count: 0 };
            }

            // Add counts
            aggregated[category][xrayType][className].image_count += metrics[className].image_count || 0;
            aggregated[category][xrayType][className].annotation_count += metrics[className].annotation_count || 0;
        });
    });

    return aggregated;
};

const ClassesTab = () => {
    const { projects, loading, refreshAllProjects } = useProjects();
    const { checkpoints } = useCheckpoints();
    const [aggregatedData, setAggregatedData] = useState(null);

    useEffect(() => {
        if (projects.length > 0) {
            const data = aggregateMetrics(projects);
            setAggregatedData(data);
        }
    }, [projects]);

    if (loading && !aggregatedData) {
        return <LoadingSpinner message="Loading class metrics..." />;
    }

    if (!aggregatedData) return null;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">📊 Class-wise Analysis</h2>

            <p className="text-gray-400 text-sm mb-4">Aggregated metrics across all projects, grouped by X-ray type</p>

            {Object.entries(CLASS_CATEGORIES).map(([category, classes]) => (
                <CategorySection
                    key={category}
                    category={category}
                    classes={classes}
                    metrics={aggregatedData[category]}
                    checkpoints={checkpoints}
                    onRefresh={() => refreshAllProjects()}
                />
            ))}
        </div>
    );
};

export default ClassesTab;
