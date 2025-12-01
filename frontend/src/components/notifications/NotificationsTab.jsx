import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationsTab = () => {
    const { notifications, dismissNotification, loading } = useNotifications();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading notifications...</p>
                </div>
            </div>
        );
    }

    const handleDismiss = async (id) => {
        try {
            await dismissNotification(id);
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
            alert('Failed to dismiss notification');
        }
    };

    // Generate title and message from notification data
    const getNotificationContent = (notification) => {
        const title = `${notification.project_title || 'Project'}`;
        const message = `Class "${notification.class_name}" has increased by ${notification.increase_pct?.toFixed(1)}% (from ${notification.checkpoint_count} to ${notification.current_count} images)`;

        return { title, message };
    };

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">🔔 Training Notifications</h2>
                {notifications.length > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold mb-2">No Training Notifications</h3>
                    <p className="text-gray-600">
                        You're all caught up! New notifications will appear here when classes reach the 20% growth threshold.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => {
                        const { title, message } = getNotificationContent(notification);
                        const notificationId = `${notification.project_id}_${notification.class_name}_${notification.timestamp}`;

                        return (
                            <div
                                key={notificationId}
                                className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">🎯</span>
                                            <h3 className="text-lg font-semibold">
                                                {title}
                                            </h3>
                                        </div>

                                        <p className="text-gray-700 mb-3">
                                            {message}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>📅 {new Date(notification.timestamp).toLocaleString()}</span>
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded uppercase font-semibold">
                                                {notification.class_name}
                                            </span>
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                                                +{notification.increase_pct?.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDismiss(notificationId)}
                                        className="ml-4 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Dismiss"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsTab;
