import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await notificationsAPI.getAll();
            setNotifications(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const dismissNotification = async (index) => {
        setError(null);
        try {
            await notificationsAPI.dismiss(index);
            await fetchNotifications();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    return {
        notifications,
        loading,
        error,
        fetchNotifications,
        dismissNotification
    };
};
