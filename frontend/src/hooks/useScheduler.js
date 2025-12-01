import { useState, useEffect } from 'react';
import { schedulerAPI } from '../services/api';

export const useScheduler = () => {
    const [status, setStatus] = useState(null);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await schedulerAPI.getStatus();
            setStatus(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startScheduler = async (hour, minute) => {
        setError(null);
        try {
            await schedulerAPI.start(hour, minute);
            await fetchStatus();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const stopScheduler = async () => {
        setError(null);
        try {
            await schedulerAPI.stop();
            await fetchStatus();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const triggerManualRefresh = async () => {
        setError(null);
        try {
            await schedulerAPI.trigger();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const fetchLogs = async (lines = 50) => {
        setError(null);
        try {
            const response = await schedulerAPI.getLogs(lines);
            setLogs(response.data.logs);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Poll status every 60 seconds
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    return {
        status,
        logs,
        loading,
        error,
        fetchStatus,
        startScheduler,
        stopScheduler,
        triggerManualRefresh,
        fetchLogs
    };
};
