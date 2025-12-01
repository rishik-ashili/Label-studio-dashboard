import { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';

export const useProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await projectsAPI.getAll();
            setProjects(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const refreshProject = async (id, projectTitle) => {
        setError(null);
        try {
            await projectsAPI.refresh(id, projectTitle);
            await fetchProjects(); // Refresh list
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const refreshAllProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            await projectsAPI.refreshAll();
            await fetchProjects();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return {
        projects,
        loading,
        error,
        fetchProjects,
        refreshProject,
        refreshAllProjects
    };
};
