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
import GrowthTab from './components/growth/GrowthTab';
import ChatBot from './components/chat/ChatBot';
import GrowthIndicator from './components/common/GrowthIndicator';
import { useProjects } from './hooks/useProjects';
import { useCheckpoints } from './hooks/useCheckpoints';
import { kaggleAPI } from './services/api';

function App() {
    const [activeTab, setActiveTab] = useState('growth');
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
        try {
            await refreshAllProjects();
            // Don't set refreshing(false) here - let SettingsTab handle it based on progress
        } catch (error) {
            console.error('Error starting refresh:', error);
            setRefreshing(false);
        }
    };

    // Export setRefreshing so SettingsTab can control it
    const handleRefreshingChange = (value) => {
        setRefreshing(value);
    };

    // Calculate growth metrics with checkpoint priority: class > project > kaggle
    const calculateGrowthMetrics = () => {
        let currentTotal = 0;
        let kaggleTotal = 0;
        let checkpointTotal = 0;
        let hasClassCheckpoint = false;
        let hasProjectCheckpoint = false;
        let latestCheckpointDate = null;
        let checkpointSources = new Set();

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

        // 3. Checkpoint Total - sum both class and project checkpoints
        if (checkpoints) {
            let classCheckpointTotal = 0;
            let projectCheckpointTotal = 0;
            let classCheckpointDate = null;
            let projectCheckpointDate = null;

            // Track which class-modality combinations have class checkpoints
            const classCheckpointKeys = new Set();

            // First, process class checkpoints
            if (checkpoints.classes) {
                Object.entries(checkpoints.classes).forEach(([key, cp]) => {
                    const images = cp.metrics?.images || 0;
                    classCheckpointTotal += images;
                    hasClassCheckpoint = true;
                    classCheckpointKeys.add(key); // e.g., "pulp_IOPA"
                    checkpointSources.add(key);

                    if (cp.marked_at) {
                        const cpDate = new Date(cp.marked_at);
                        if (!classCheckpointDate || cpDate > classCheckpointDate) {
                            classCheckpointDate = cpDate;
                        }
                    }
                });
            }

            // Then add ALL project checkpoints (they cover all modalities combined)
            if (checkpoints.projects) {
                Object.values(checkpoints.projects).forEach(cp => {
                    const metrics = cp.metrics || {};
                    Object.keys(metrics).forEach(key => {
                        if (key !== '_summary') {
                            projectCheckpointTotal += metrics[key].image_count || 0;
                            hasProjectCheckpoint = true;
                        }
                    });

                    if (cp.marked_at) {
                        const cpDate = new Date(cp.marked_at);
                        if (!projectCheckpointDate || cpDate > projectCheckpointDate) {
                            projectCheckpointDate = cpDate;
                        }
                    }
                });
            }

            // Sum both class and project checkpoints
            checkpointTotal = classCheckpointTotal + projectCheckpointTotal;

            // Use date from the dominant checkpoint source
            if (projectCheckpointTotal > classCheckpointTotal) {
                latestCheckpointDate = projectCheckpointDate;
            } else if (classCheckpointTotal > 0) {
                latestCheckpointDate = classCheckpointDate;
            } else {
                latestCheckpointDate = projectCheckpointDate;
            }
        }

        const growth = currentTotal - checkpointTotal;
        const growthPct = checkpointTotal > 0 ? (growth / checkpointTotal) * 100 : 0;

        // Determine checkpoint type for display
        let checkpointType = 'none';
        let checkpointInfo = 'from Kaggle baseline';

        if (hasClassCheckpoint && hasProjectCheckpoint) {
            checkpointType = 'mixed';
            checkpointInfo = 'from class & project checkpoints';
        } else if (hasClassCheckpoint) {
            checkpointType = 'class';
            checkpointInfo = checkpointSources.size === 1
                ? `from class checkpoint: ${Array.from(checkpointSources)[0]}`
                : `from ${checkpointSources.size} class checkpoints`;
        } else if (hasProjectCheckpoint) {
            checkpointType = 'project';
            checkpointInfo = 'from project checkpoints';
        } else if (checkpointTotal > 0) {
            checkpointType = 'kaggle';
        }

        return {
            currentTotal,
            kaggleTotal,
            checkpointTotal,
            growth,
            growthPct,
            checkpointType,
            checkpointInfo,
            checkpointDate: latestCheckpointDate
        };
    };

    const { currentTotal, kaggleTotal, checkpointTotal, growth, growthPct,
        checkpointType, checkpointInfo, checkpointDate } = calculateGrowthMetrics();

    // Handle tab changes - clear selected project when switching tabs
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedProject(null); // Clear selected project when changing tabs
    };

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
            case 'growth':
                return <GrowthTab />;
            case 'projects':
                return (
                    <ProjectGrid
                        projects={projects}
                        loading={loading}
                        onRefresh={refreshProject}
                        onViewDetails={setSelectedProject}
                        onModalityChange={refreshAllProjects}
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
                        onRefreshingChange={handleRefreshingChange}
                    />
                );
            case 'notifications':
                return <NotificationsTab />;
            default:
                return null;
        }
    };

    return (
        <>
            <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
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
                                checkpointInfo={checkpointInfo}
                                checkpointDate={checkpointDate}
                            />
                        )}
                    </>
                )}

                {renderContent()}
            </MainLayout>

            <ChatBot />
        </>
    );
}

export default App;
