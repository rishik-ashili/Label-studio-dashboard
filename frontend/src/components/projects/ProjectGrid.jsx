import React from 'react';
import ProjectCard from './ProjectCard';
import LoadingSpinner from '../common/LoadingSpinner';

const ProjectGrid = ({ projects, loading, onRefresh, onViewDetails, onModalityChange }) => {
    if (loading) {
        return <LoadingSpinner message="Loading projects..." />;
    }

    if (!projects || projects.length === 0) {
        return (
            <div className="text-center p-8">
                <p className="text-xl text-gray-600">❌ No projects found</p>
                <p className="text-sm text-gray-500 mt-2">Please check your API credentials</p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-4 text-success font-semibold">
                ✅ Found {projects.length} projects
            </div>

            <hr className="mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onRefresh={onRefresh}
                        onViewDetails={onViewDetails}
                        onModalityChange={onModalityChange}
                    />
                ))}
            </div>
        </>
    );
};

export default ProjectGrid;
