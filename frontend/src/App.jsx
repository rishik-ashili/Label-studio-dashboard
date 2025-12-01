import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import ProjectGrid from './components/projects/ProjectGrid';
import ProjectDetails from './components/projects/ProjectDetails';
import ClassesTab from './components/classes/ClassesTab';
import CheckpointsTab from './components/checkpoints/CheckpointsTab';
import KaggleDataEditor from './components/kaggle/KaggleDataEditor';
import DataMetricsView from './components/metrics/DataMetricsView';
import SettingsTab from './components/settings/SettingsTab';
import NotificationsTab from './components/notifications/NotificationsTab';
import GrowthIndicator from './components/common/GrowthIndicator';
import { useProjects } from './hooks/useProjects';
import { useCheckpoints } from './hooks/useCheckpoints';
import { kaggleAPI } from './services/api';

function App() {
    const [activeTab, setActiveTab] = useState('projects');
    const [selectedProject, setSelectedProject] = useState(null);
    const { projects, loading, refreshProject, refreshAllProjects } = useProjects();
    const { checkpoints } = useCheckpoints();
    const [refreshing, setRefreshing] = useState(false);
    const [kaggleData, setKaggleData] = useState(null);
    const labelStudioUrl = import.meta.env.VITE_LABEL_STUDIO_URL || 'http://localhost:8080';

    // Fetch Kaggle data for growth calculation
    useEffect(() => {
        const fetchKaggle = async () => {
            try {
                const response = await kaggleAPI.getAll();
                setKaggleData(response.data);
            } catch (error) {
                console.error('Error fetching Kaggle data:', error);
            }
        };
        fetchKaggle();
    }, []);

    const handleRefreshAll = async () => {
        setRefreshing(true);
        await refreshAllProjects();
        setRefreshing(false);
    };

    // Calculate growth metrics
    const calculateGrowthMetrics = () => {
        let currentTotal = 0;
        let kaggleTotal = 0;
        let checkpointTotal = 0;

        // 1. Current Total (from all projects)
        projects.forEach(project => {
            const metrics = project.latest_metrics?.metrics || {};
            Object.keys(metrics).forEach(className => {
                if (className !== '_summary') {
                    currentTotal += metrics[className].image_count || 0;
                }
            });
        });

        // 2. Kaggle Total
        if (kaggleData) {
            Object.values(kaggleData).forEach(catData => {
                Object.values(catData).forEach(classData => {
                    if (typeof classData === 'number') {
                        kaggleTotal += classData;
                    } else if (typeof classData === 'object') {
                        Object.values(classData).forEach(typeData => {
                            kaggleTotal += typeData.images || 0;
                        });
                    }
                });
            });
        }

        // 3. Checkpoint Total
        if (checkpoints && checkpoints.projects) {
            Object.values(checkpoints.projects).forEach(cp => {
                const metrics = cp.metrics || {};
                Object.keys(metrics).forEach(key => {
                    if (key !== '_summary') {
                        checkpointTotal += metrics[key].image_count || 0;
                    }
                });
            });
        }

        const growth = currentTotal - checkpointTotal;
        const growthPct = checkpointTotal > 0 ? (growth / checkpointTotal) * 100 : 0;

        return { currentTotal, kaggleTotal, checkpointTotal, growth, growthPct };
    };

    const { currentTotal, kaggleTotal, checkpointTotal, growth, growthPct } = calculateGrowthMetrics();

    const renderContent = () => {
        if (selectedProject) {
            return (
                <ProjectDetails
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                />
            );
        }

        switch (activeTab) {
            case 'projects':
                return (
                    <ProjectGrid
                        projects={projects}
                        loading={loading}
                        onRefresh={refreshProject}
                        onViewDetails={setSelectedProject}
                    />
                );
            case 'classes':
                return <ClassesTab />;
            case 'checkpoints':
                return <CheckpointsTab projects={projects} />;
            case 'kaggle':
                return <KaggleDataEditor />;
            case 'metrics':
                return <DataMetricsView />;
            case 'settings':
                return (
                    <SettingsTab
                        labelStudioUrl={labelStudioUrl}
                        onRefreshAll={handleRefreshAll}
                        refreshing={refreshing}
                    />
                );
            case 'notifications':
                return <NotificationsTab />;
            default:
                return null;
        }
    };

    return (
        <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {!selectedProject && (
                <>
                    {/* Growth Indicator - Hidden for Settings and Notifications tabs */}
                    {!['settings', 'notifications'].includes(activeTab) && (
                        <GrowthIndicator
                            current={currentTotal}
                            checkpoint={checkpointTotal}
                            kaggle={kaggleTotal}
                            growth={growth}
                            growthPct={growthPct}
                        />
                    )}
                </>
            )}

            {renderContent()}
        </MainLayout>
    );
}

export default App;
