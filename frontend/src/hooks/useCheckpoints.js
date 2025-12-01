import { useState, useEffect } from 'react';
import { checkpointsAPI } from '../services/api';

export const useCheckpoints = () => {
    const [checkpoints, setCheckpoints] = useState({ projects: {}, categories: {}, classes: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCheckpoints = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await checkpointsAPI.getAll();
            setCheckpoints(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createProjectCheckpoint = async (id, projectTitle, note = '') => {
        setError(null);
        try {
            await checkpointsAPI.createProject(id, projectTitle, note);
            await fetchCheckpoints();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const createCategoryCheckpoint = async (category, note = '') => {
        setError(null);
        try {
            await checkpointsAPI.createCategory(category, note);
            await fetchCheckpoints();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const createClassCheckpoint = async (className, xrayType, note = '') => {
        setError(null);
        try {
            await checkpointsAPI.createClass(className, xrayType, note);
            await fetchCheckpoints();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchCheckpoints();
    }, []);

    return {
        checkpoints,
        loading,
        error,
        fetchCheckpoints,
        createProjectCheckpoint,
        createCategoryCheckpoint,
        createClassCheckpoint
    };
};
